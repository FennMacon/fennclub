#!/usr/bin/env python3
"""
Specialized Wildflower Color Extractor
Specifically designed to find vibrant blues, purples, oranges, and yellows
that might be less dominant but visually important in wildflower photos
"""

import os
import json
from PIL import Image
import colorsys
import numpy as np
from sklearn.cluster import KMeans
from collections import defaultdict

def heic_to_rgb(image_path):
    """Convert HEIC image to RGB format"""
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
        image = Image.open(image_path)
    except ImportError:
        print("pillow-heif not installed. Please install with: pip install pillow-heif")
        return None
    except Exception as e:
        print(f"Error opening image: {e}")
        return None
    
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    return image

def rgb_to_hsv(rgb):
    """Convert RGB to HSV"""
    r, g, b = [x/255.0 for x in rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return (int(h*360), int(s*100), int(v*100))

def extract_targeted_colors(image, target_colors=None):
    """Extract colors specifically targeting wildflower color families"""
    if target_colors is None:
        target_colors = {
            'blues': {'hue_range': (200, 260), 'min_sat': 15, 'min_val': 25},
            'purples': {'hue_range': (260, 320), 'min_sat': 10, 'min_val': 20},
            'violets': {'hue_range': (270, 300), 'min_sat': 20, 'min_val': 30},
            'oranges': {'hue_range': (10, 45), 'min_sat': 15, 'min_val': 35},
            'bright_yellows': {'hue_range': (45, 70), 'min_sat': 25, 'min_val': 45},
            'pale_yellows': {'hue_range': (45, 70), 'min_sat': 5, 'min_val': 65},
            'reds': {'hue_range': (340, 20), 'min_sat': 20, 'min_val': 30},
            'pinks': {'hue_range': (300, 340), 'min_sat': 15, 'min_val': 45},
        }
    
    # Resize for processing
    aspect_ratio = image.height / image.width
    width = 400
    height = int(width * aspect_ratio)
    image_resized = image.resize((width, height))
    
    # Convert to numpy array
    data = np.array(image_resized)
    data = data.reshape((-1, 3))
    
    # Find pixels matching our target color families
    targeted_pixels = defaultdict(list)
    
    for i, rgb in enumerate(data):
        h, s, v = rgb_to_hsv(rgb)
        
        for color_family, criteria in target_colors.items():
            hue_min, hue_max = criteria['hue_range']
            min_sat = criteria['min_sat']
            min_val = criteria['min_val']
            
            # Handle hue wraparound (e.g., red spans 340-360 and 0-20)
            if hue_min > hue_max:  # wraparound case
                hue_match = (h >= hue_min) or (h <= hue_max)
            else:
                hue_match = hue_min <= h <= hue_max
            
            if hue_match and s >= min_sat and v >= min_val:
                targeted_pixels[color_family].append(rgb.tolist())
    
    # Extract representative colors from each family
    result_colors = []
    color_info = []
    
    for color_family, pixels in targeted_pixels.items():
        if len(pixels) < 5:  # Lower threshold to catch more colors
            continue
            
        pixels_array = np.array(pixels)
        
        # Use k-means to find 2-3 representative colors per family
        n_colors = min(3, max(1, len(pixels) // 50))
        
        if len(pixels) > n_colors:
            try:
                kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
                kmeans.fit(pixels_array)
                family_colors = kmeans.cluster_centers_
                
                # Get frequency information
                labels = kmeans.labels_
                for i, color in enumerate(family_colors):
                    frequency = int(np.sum(labels == i))  # Convert to regular int
                    result_colors.append([int(c) for c in color])
                    color_info.append({
                        'family': color_family,
                        'frequency': frequency,
                        'total_pixels': len(pixels)
                    })
            except:
                # Fallback: use mean color
                mean_color = np.mean(pixels_array, axis=0)
                result_colors.append([int(c) for c in mean_color])
                color_info.append({
                    'family': color_family,
                    'frequency': len(pixels),
                    'total_pixels': len(pixels)
                })
    
    return result_colors, color_info

def rgb_to_hex(rgb):
    """Convert RGB to hex"""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def rgb_to_hsl(rgb):
    """Convert RGB to HSL"""
    r, g, b = [x/255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return (int(h*360), int(s*100), int(l*100))

def get_descriptive_name(rgb, family_info):
    """Generate descriptive names for colors"""
    h, s, v = rgb_to_hsv(rgb)
    family = family_info.get('family', 'wildflower')
    
    # Base names for families
    if family == 'blues':
        if v > 80:
            base = 'sky-blue'
        elif v > 60:
            base = 'powder-blue'
        elif s > 60:
            base = 'royal-blue'
        else:
            base = 'blue-gray'
    elif family == 'purples':
        if s > 60:
            base = 'violet'
        elif v > 70:
            base = 'lavender'
        else:
            base = 'purple-gray'
    elif family == 'violets':
        base = 'violet'
    elif family == 'oranges':
        if s > 70:
            base = 'burnt-orange'
        elif v > 80:
            base = 'peach'
        else:
            base = 'terracotta'
    elif family == 'bright_yellows':
        if s > 70:
            base = 'golden-yellow'
        else:
            base = 'butter-yellow'
    elif family == 'pale_yellows':
        base = 'cream-yellow'
    elif family == 'reds':
        if s > 70:
            base = 'crimson'
        else:
            base = 'rose'
    elif family == 'pinks':
        if v > 80:
            base = 'blush-pink'
        else:
            base = 'dusty-pink'
    else:
        base = 'wildflower-tone'
    
    return base

def generate_specialized_palette(image_path, output_dir="colors"):
    """Generate specialized wildflower palette targeting specific color families"""
    print(f"🌸 Processing image for specialized wildflower colors: {image_path}")
    
    # Load and process image
    image = heic_to_rgb(image_path)
    if image is None:
        return None
    
    print("🎯 Targeting specific wildflower color families...")
    colors, color_info = extract_targeted_colors(image)
    
    if not colors:
        print("❌ No targeted colors found!")
        return None
    
    # Remove duplicates
    unique_colors = []
    unique_info = []
    seen_colors = set()
    
    for color, info in zip(colors, color_info):
        color_tuple = tuple(color)
        if color_tuple not in seen_colors:
            unique_colors.append(color)
            unique_info.append(info)
            seen_colors.add(color_tuple)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Prepare palette data
    palette_data = {
        "source_image": os.path.basename(image_path),
        "description": "Specialized Wildflower Palette - Targeting Blues, Purples, Oranges & Vibrant Colors",
        "extraction_method": "targeted color family extraction",
        "total_colors": len(unique_colors),
        "colors": [],
        "families": {}
    }
    
    # Process colors
    families = defaultdict(list)
    for i, (rgb, info) in enumerate(zip(unique_colors, unique_info)):
        hex_color = rgb_to_hex(rgb)
        hsl = rgb_to_hsl(rgb)
        hsv = rgb_to_hsv(rgb)
        descriptive_name = get_descriptive_name(rgb, info)
        
        color_data = {
            "name": f"specialized-{i+1}",
            "descriptive_name": descriptive_name,
            "rgb": [int(x) for x in rgb],
            "hex": hex_color,
            "hsl": [int(x) for x in hsl],
            "hsv": [int(x) for x in hsv],
            "css_var": f"--specialized-{i+1}",
            "family": info['family'],
            "frequency": int(info.get('frequency', 1)),
            "total_family_pixels": int(info.get('total_pixels', 1))
        }
        palette_data["colors"].append(color_data)
        families[info['family']].append(f"specialized-{i+1}")
    
    palette_data["families"] = dict(families)
    
    # Export specialized JSON
    json_path = os.path.join(output_dir, "specialized-palette.json")
    with open(json_path, 'w') as f:
        json.dump(palette_data, f, indent=2)
    
    # Export specialized CSS
    css_path = os.path.join(output_dir, "specialized-palette.css")
    with open(css_path, 'w') as f:
        f.write("/* Specialized Wildflower Color Palette */\n")
        f.write("/* Targeting blues, purples, oranges, and vibrant wildflower colors */\n\n")
        f.write(":root {\n")
        
        for color in palette_data["colors"]:
            f.write(f"  {color['css_var']}: {color['hex']}; /* {color['descriptive_name']} - {color['family']} */\n")
        f.write("}\n")
    
    print(f"✅ Specialized wildflower palette generated!")
    print(f"   📁 Output directory: {output_dir}/")
    print(f"   📊 JSON data: {json_path}")
    print(f"   🎯 CSS variables: {css_path}")
    print(f"   🌈 Total specialized colors: {len(unique_colors)}")
    
    # Print family summary
    print(f"\n🎨 Wildflower Color Families Found:")
    for family, color_names in palette_data["families"].items():
        if color_names:
            print(f"   {family.replace('_', ' ').title()}: {len(color_names)} colors")
    
    return palette_data

if __name__ == "__main__":
    image_path = "IMG_0965.heic"
    
    if os.path.exists(image_path):
        print("🌸 Starting specialized wildflower color hunt...")
        print("🎯 Looking specifically for:")
        print("   • Blues (sky tones, powder blues)")
        print("   • Purples & Violets (lavender, violet)")
        print("   • Oranges (burnt orange, terracotta)")
        print("   • Bright & Pale Yellows")
        print("   • Reds & Pinks")
        
        palette = generate_specialized_palette(image_path)
        if palette:
            print("\n🌺 Specialized wildflower color hunt complete!")
            print("Check the JSON file to see what colors were found!")
    else:
        print(f"❌ Image not found: {image_path}") 