#!/usr/bin/env python3
"""
Enhanced Color Palette Extractor for Honeymoon Project
Extracts diverse wildflower colors including vibrant accent colors
"""

import os
import json
from PIL import Image
import colorsys
from collections import Counter
import numpy as np
from sklearn.cluster import KMeans

def heic_to_rgb(image_path):
    """Convert HEIC image to RGB format"""
    try:
        # Try to open HEIC directly (requires pillow-heif)
        from pillow_heif import register_heif_opener
        register_heif_opener()
        image = Image.open(image_path)
    except ImportError:
        print("pillow-heif not installed. Please install with: pip install pillow-heif")
        return None
    except Exception as e:
        print(f"Error opening image: {e}")
        return None
    
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    return image

def extract_diverse_colors(image, num_colors=16, resize_width=300):
    """Extract diverse colors using k-means clustering for better color diversity"""
    # Resize image for processing (larger than before for better color detection)
    aspect_ratio = image.height / image.width
    new_height = int(resize_width * aspect_ratio)
    image_resized = image.resize((resize_width, new_height))
    
    # Convert to numpy array
    data = np.array(image_resized)
    data = data.reshape((-1, 3))
    
    # Use k-means clustering to find diverse color centers
    try:
        kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=10)
        kmeans.fit(data)
        colors = kmeans.cluster_centers_
        
        # Convert to integers
        colors = [[int(c[0]), int(c[1]), int(c[2])] for c in colors]
        
        # Sort by frequency (how many pixels are closest to each cluster center)
        labels = kmeans.labels_
        color_counts = Counter(labels)
        sorted_colors = []
        for i in range(num_colors):
            if i in color_counts:
                sorted_colors.append((colors[i], color_counts[i]))
        
        # Sort by count (most common first) but keep all colors
        sorted_colors.sort(key=lambda x: x[1], reverse=True)
        final_colors = [color for color, count in sorted_colors]
        
        return final_colors
        
    except ImportError:
        print("scikit-learn not available, falling back to simple method")
        return extract_simple_colors(image_resized, num_colors)

def extract_simple_colors(image, num_colors=16):
    """Fallback method using quantization"""
    # Quantize the image to reduce colors
    quantized = image.quantize(colors=num_colors)
    # Get the palette
    palette = quantized.getpalette()
    
    # Convert palette to list of RGB tuples
    colors = []
    for i in range(0, len(palette), 3):
        if i + 2 < len(palette):
            colors.append([palette[i], palette[i+1], palette[i+2]])
    
    return colors[:num_colors]

def categorize_colors(colors):
    """Categorize colors into families (greens, blues, purples, oranges, yellows, etc.)"""
    categorized = {
        'greens': [],
        'blues': [],
        'purples': [],
        'oranges': [],
        'yellows': [],
        'reds': [],
        'browns': [],
        'grays': [],
        'others': []
    }
    
    for i, rgb in enumerate(colors):
        r, g, b = rgb
        h, l, s = rgb_to_hsl(rgb)
        
        # Categorize based on hue and saturation
        if s < 15:  # Low saturation = grays/browns
            if l < 30:
                categorized['grays'].append((i, rgb, 'dark-gray'))
            elif l > 70:
                categorized['grays'].append((i, rgb, 'light-gray'))
            else:
                categorized['browns'].append((i, rgb, 'brown'))
        else:  # Higher saturation colors
            if 45 <= h <= 75:  # Yellow range
                categorized['yellows'].append((i, rgb, 'yellow'))
            elif 15 <= h <= 45:  # Orange range
                categorized['oranges'].append((i, rgb, 'orange'))
            elif 345 <= h <= 360 or 0 <= h <= 15:  # Red range
                categorized['reds'].append((i, rgb, 'red'))
            elif 270 <= h <= 330:  # Purple/magenta range
                categorized['purples'].append((i, rgb, 'purple'))
            elif 210 <= h <= 270:  # Blue range
                categorized['blues'].append((i, rgb, 'blue'))
            elif 120 <= h <= 180:  # Green range
                categorized['greens'].append((i, rgb, 'green'))
            else:
                categorized['others'].append((i, rgb, 'other'))
    
    return categorized

def rgb_to_hex(rgb):
    """Convert RGB tuple to hex string"""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def rgb_to_hsl(rgb):
    """Convert RGB to HSL"""
    r, g, b = [x/255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return (int(h*360), int(s*100), int(l*100))

def get_color_name(rgb, category_info=None):
    """Generate descriptive color names"""
    h, l, s = rgb_to_hsl(rgb)
    
    if category_info:
        base_name = category_info
    else:
        # Fallback naming
        if s < 15:
            base_name = 'neutral'
        elif 45 <= h <= 75:
            base_name = 'yellow'
        elif 15 <= h <= 45:
            base_name = 'orange'
        elif 345 <= h <= 360 or 0 <= h <= 15:
            base_name = 'red'
        elif 270 <= h <= 330:
            base_name = 'purple'
        elif 210 <= h <= 270:
            base_name = 'blue'
        elif 120 <= h <= 180:
            base_name = 'green'
        else:
            base_name = 'wildflower'
    
    # Add descriptive prefixes based on lightness and saturation
    if l > 80:
        return f"light-{base_name}"
    elif l < 25:
        return f"dark-{base_name}"
    elif s > 70:
        return f"vibrant-{base_name}"
    elif s < 30:
        return f"muted-{base_name}"
    else:
        return base_name

def generate_enhanced_palette(image_path, output_dir="colors"):
    """Generate enhanced color palette with diverse wildflower colors"""
    print(f"🌸 Processing: {image_path}")
    
    # Load and process image
    image = heic_to_rgb(image_path)
    if image is None:
        return None
    
    # Extract diverse colors
    print("🎨 Extracting diverse color palette...")
    colors = extract_diverse_colors(image, num_colors=16)
    
    # Categorize colors
    print("🔍 Categorizing colors by families...")
    categorized = categorize_colors(colors)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Prepare enhanced color data
    palette_data = {
        "source_image": os.path.basename(image_path),
        "description": "Enhanced Wildflowers in Grand Tetons - Diverse Color Palette",
        "extraction_method": "k-means clustering for color diversity",
        "total_colors": len(colors),
        "colors": [],
        "categories": {}
    }
    
    # Process all colors
    for i, rgb in enumerate(colors):
        hex_color = rgb_to_hex(rgb)
        hsl = rgb_to_hsl(rgb)
        
        # Find category info for this color
        category_info = None
        for category, color_list in categorized.items():
            for idx, color_rgb, color_type in color_list:
                if idx == i:
                    category_info = color_type
                    break
        
        color_name = get_color_name(rgb, category_info)
        
        color_info = {
            "name": f"wildflower-{i+1}",
            "descriptive_name": color_name,
            "rgb": [int(rgb[0]), int(rgb[1]), int(rgb[2])],
            "hex": hex_color,
            "hsl": hsl,
            "css_var": f"--wildflower-{i+1}",
            "category": category_info or "other"
        }
        palette_data["colors"].append(color_info)
    
    # Add category summaries
    for category, color_list in categorized.items():
        if color_list:
            palette_data["categories"][category] = {
                "count": len(color_list),
                "colors": [f"wildflower-{idx+1}" for idx, rgb, color_type in color_list]
            }
    
    # Export enhanced JSON
    json_path = os.path.join(output_dir, "enhanced-palette.json")
    with open(json_path, 'w') as f:
        json.dump(palette_data, f, indent=2)
    
    # Export enhanced CSS
    css_path = os.path.join(output_dir, "enhanced-palette.css")
    with open(css_path, 'w') as f:
        f.write("/* Enhanced Grand Tetons Wildflower Color Palette */\n")
        f.write("/* Extracted using k-means clustering for maximum diversity */\n\n")
        f.write(":root {\n")
        
        # Main color variables
        for color in palette_data["colors"]:
            f.write(f"  {color['css_var']}: {color['hex']}; /* {color['descriptive_name']} */\n")
        
        f.write("\n  /* Color category shortcuts */\n")
        
        # Category shortcuts
        for category, info in palette_data["categories"].items():
            if info["colors"]:
                first_color = info["colors"][0]
                color_data = next(c for c in palette_data["colors"] if c["name"] == first_color)
                f.write(f"  --{category}-primary: {color_data['hex']};\n")
        
        f.write("}\n\n")
        
        # Enhanced utility classes
        f.write("/* Enhanced color utility classes */\n")
        for color in palette_data["colors"]:
            f.write(f".bg-{color['name']} {{ background-color: var({color['css_var']}); }}\n")
            f.write(f".text-{color['name']} {{ color: var({color['css_var']}); }}\n")
            f.write(f".border-{color['name']} {{ border-color: var({color['css_var']}); }}\n")
    
    # Create enhanced preview
    html_path = os.path.join(output_dir, "enhanced-preview.html")
    with open(html_path, 'w') as f:
        f.write(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Grand Tetons Wildflower Palette</title>
    <link rel="stylesheet" href="enhanced-palette.css">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 2rem; background: #f5f5f5; }}
        .header {{ text-align: center; margin-bottom: 2rem; }}
        .category-section {{ margin: 2rem 0; background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .color-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin: 1rem 0; }}
        .color-card {{ 
            border-radius: 8px; 
            padding: 1rem; 
            text-align: center; 
            color: white; 
            text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
            min-height: 100px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            transition: transform 0.2s ease;
        }}
        .color-card:hover {{ transform: scale(1.05); }}
        .color-info {{ background: rgba(255,255,255,0.9); color: #333; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; font-size: 0.8rem; }}
        h1 {{ color: var(--wildflower-1); }}
        h2 {{ color: #666; border-bottom: 2px solid #ddd; padding-bottom: 0.5rem; }}
        .stats {{ display: flex; gap: 2rem; justify-content: center; margin: 1rem 0; }}
        .stat {{ text-align: center; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🌸 Enhanced Grand Tetons Wildflower Palette</h1>
        <p>Extracted using advanced clustering to capture color diversity</p>
        <div class="stats">
            <div class="stat"><strong>{len(colors)}</strong><br>Total Colors</div>
            <div class="stat"><strong>{len([c for c in categorized.values() if c])}</strong><br>Categories</div>
            <div class="stat"><strong>K-Means</strong><br>Extraction Method</div>
        </div>
    </div>
    
    <div class="category-section">
        <h2>🎨 All Colors</h2>
        <div class="color-grid">
""")
        
        for color in palette_data["colors"]:
            f.write(f"""            <div class="color-card" style="background-color: {color['hex']};">
                <strong>{color['descriptive_name'].replace('-', ' ').title()}</strong>
                <div class="color-info">
                    <strong>{color['hex']}</strong><br>
                    RGB: {color['rgb'][0]}, {color['rgb'][1]}, {color['rgb'][2]}<br>
                    {color['category'].title()}
                </div>
            </div>
""")
        
        f.write("        </div>\n    </div>\n")
        
        # Add category sections
        for category, info in palette_data["categories"].items():
            if info["colors"]:
                f.write(f"""    <div class="category-section">
        <h2>{category.title()} ({info["count"]} colors)</h2>
        <div class="color-grid">
""")
                for color_name in info["colors"]:
                    color_data = next(c for c in palette_data["colors"] if c["name"] == color_name)
                    f.write(f"""            <div class="color-card" style="background-color: {color_data['hex']};">
                <strong>{color_data['descriptive_name'].replace('-', ' ').title()}</strong>
                <div class="color-info">
                    <strong>{color_data['hex']}</strong><br>
                    CSS: var({color_data['css_var']})
                </div>
            </div>
""")
                f.write("        </div>\n    </div>\n")
        
        f.write("""</body>
</html>""")
    
    print(f"✅ Enhanced color palette generated successfully!")
    print(f"   📁 Output directory: {output_dir}/")
    print(f"   🎨 Enhanced preview: {html_path}")
    print(f"   📊 Enhanced JSON: {json_path}")
    print(f"   🎯 Enhanced CSS: {css_path}")
    print(f"   🌈 Total colors extracted: {len(colors)}")
    
    # Print category summary
    print(f"\n🎨 Color Categories Found:")
    for category, info in palette_data["categories"].items():
        if info["colors"]:
            print(f"   {category.title()}: {info['count']} colors")
    
    return palette_data

if __name__ == "__main__":
    # Extract enhanced colors from the honeymoon image
    image_path = "IMG_0965.heic"
    
    if os.path.exists(image_path):
        palette = generate_enhanced_palette(image_path)
        if palette:
            print("\n🌸 Your enhanced Grand Tetons wildflower palette is ready!")
            print("Open colors/enhanced-preview.html to see all the colors including")
            print("those beautiful blues, purples, oranges, and yellows!")
    else:
        print(f"❌ Image not found: {image_path}")
        print("Make sure you're running this script from the honeymoon directory.") 