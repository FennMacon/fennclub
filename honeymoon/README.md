# 🌸 Grand Tetons Honeymoon Project

A beautiful web project inspired by wildflowers from the Grand Tetons, featuring an extracted color palette from your honeymoon memories.

## 📁 Project Structure

```
honeymoon/
├── PROJECT_OVERVIEW.md      # Main planning and vision document
├── README.md               # This file - quick start guide
├── demo.html              # Beautiful demo showing color palette in action
├── project-template.html   # Clean starter template for your project
├── color_extractor.py     # Python script to extract colors from images
├── requirements.txt       # Python dependencies
├── venv/                 # Python virtual environment
├── IMG_0965.heic         # Your original wildflower image
└── colors/               # Generated color palette files
    ├── palette.json      # Color data in JSON format
    ├── palette.css       # CSS variables and utility classes
    ├── palette.scss      # SCSS variables
    └── preview.html      # Color palette preview page
```

## 🎨 Your Wildflower Color Palette

Your Grand Tetons wildflower image yielded these beautiful natural colors:

- **Sage** (`#84846c`) - Soft sage green from mountain foliage
- **Mountain** (`#041119`) - Deep blue-black from mountain shadows
- **Shadow** (`#05121a`) - Rich dark tones from valley depths
- **Meadow** (`#8d9073`) - Warm meadow green from grasslands
- **Prairie** (`#888c73`) - Muted prairie tones
- **Willow** (`#848870`) - Silvery willow green
- **Stone** (`#7e8066`) - Mountain stone gray-green
- **Earth** (`#878a6f`) - Rich earth tones

## 🚀 Quick Start

### 1. View the Demo
Open `demo.html` to see a beautiful example of what's possible with your color palette.

### 2. Start Building
Open `project-template.html` as your starting point - it's pre-configured with:
- Your wildflower color palette loaded
- Responsive design framework
- Example components
- Development notes

### 3. Use Your Colors
The color palette is available as CSS variables:
```css
background: var(--wildflower-1);  /* Sage */
color: var(--wildflower-2);       /* Mountain */
```

### 4. Extract More Colors
Run the color extractor on other honeymoon photos:
```bash
# Activate virtual environment
source venv/bin/activate

# Extract colors from another image
python3 color_extractor.py
```

## 💡 Project Ideas

Refer to `PROJECT_OVERVIEW.md` for detailed project ideas including:
- Photo galleries with wildflower themes
- Interactive memory timelines
- Travel journals and maps
- Custom mood boards
- Digital scrapbooks

## 🛠 Technical Features

- **Responsive Design**: Works on all devices
- **Color Palette Integration**: Extracted from your actual photo
- **Multiple Export Formats**: JSON, CSS, SCSS
- **Modern Web Standards**: CSS Grid, Flexbox, CSS Variables
- **Beautiful Animations**: Subtle interactions and transitions

## 📝 Next Steps

1. **Customize** `PROJECT_OVERVIEW.md` with your specific vision
2. **Choose** a project direction from the ideas provided
3. **Start** with `project-template.html` as your foundation
4. **Add** your own photos and content
5. **Deploy** your finished project

## 🌟 Features of Your Setup

- ✅ Color palette extracted from real honeymoon photo
- ✅ Multiple file formats for different workflows
- ✅ Beautiful demo showing possibilities
- ✅ Clean template ready for customization
- ✅ Python tools for extracting more palettes
- ✅ Comprehensive project planning document
- ✅ Responsive, modern web design

---

*Created with love and inspired by Grand Tetons wildflowers* 🏔️🌸 