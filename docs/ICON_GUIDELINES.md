# Icon Design Guidelines for SourceView Together

## Overview
This document provides guidelines for creating consistent logo variants across all app icon types for SourceView Together.

## Current Icon Configuration

Your app uses these icon files:
- **`icon.png`** - Main app icon (1024x1024px)
- **`splash-icon.png`** - Splash screen centered logo (512x512px)
- **`adaptive-icon.png`** - Android adaptive icon foreground (1024x1024px)
- **`splash.png`** - Full-screen splash background (optional)

## Design Specifications

### 1. App Icon (`icon.png`)
- **Dimensions**: 1024×1024px
- **Format**: PNG with transparency
- **Usage**: iOS App Store, main app icon
- **Design Requirements**:
  - Include your core logo design
  - Add sufficient padding (10-15% on all sides)
  - Ensure readability at small sizes (20x20px)
  - Consider rounded corners (iOS automatically applies)
  - Use your brand colors (#FF5733 primary)

### 2. Splash Icon (`splash-icon.png`)
- **Dimensions**: 512×512px (or 1024×1024px)
- **Format**: PNG with transparency
- **Usage**: Displayed during app launch with white background
- **Design Requirements**:
  - Simplified, clean version of your logo
  - Center-focused design (no edge elements)
  - Works well on white background
  - Transparent background
  - Bold, recognizable at any size

### 3. Android Adaptive Icon (`adaptive-icon.png`)
- **Dimensions**: 1024×1024px
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon foreground layer
- **Design Requirements**:
  - Logo must fit within safe area (66% of canvas = ~676x676px centered)
  - Transparent background (background color set in app.json)
  - Consider that Android may crop edges for various shapes
  - Test with different Android launcher shapes (circle, square, rounded)

### 4. Full Splash (`splash.png`) - Optional
- **Dimensions**: 1284×2778px (iPhone 12 Pro Max) or higher
- **Format**: PNG
- **Usage**: Full-screen splash background
- **Design Requirements**:
  - Logo centered vertically and horizontally
  - Branded background gradient or solid color
  - Consider safe areas for various screen sizes

## Design Consistency Rules

### 1. Core Logo Elements
- Maintain the same fundamental logo design across all variants
- Use consistent typography (if logo includes text)
- Preserve brand color palette (#FF5733 primary, #ffffff secondary)
- Keep the same logo proportions and relationships

### 2. Adaptation Guidelines
- **Simplify, don't redesign**: Remove fine details for smaller sizes
- **Maintain recognition**: Core elements should be immediately recognizable
- **Test at target sizes**: Always test how your logo looks at actual usage sizes
- **Consider context**: White backgrounds, dark backgrounds, various shapes

### 3. Color Guidelines
- **Primary Brand Color**: #FF5733 (Orange-red from app.json)
- **Background Colors**: White (#ffffff) for splash screens
- **Contrast**: Ensure sufficient contrast for accessibility
- **Dark Mode**: Consider how icons appear in dark system themes

## File Organization

```
assets/images/
├── icon.png              (1024x1024 - Main app icon)
├── splash-icon.png       (512x512 - Splash center logo)
├── adaptive-icon.png     (1024x1024 - Android adaptive foreground)
└── splash.png           (Optional - Full screen splash)
```

## Quality Checklist

Before finalizing your icons, verify:

- [ ] All files are in correct dimensions
- [ ] PNG format with proper transparency
- [ ] Logo is clearly visible at 20x20px (smallest usage)
- [ ] Consistent visual style across all variants
- [ ] Proper safe area margins for adaptive icon
- [ ] Colors match brand guidelines (#FF5733)
- [ ] No pixelation or blur when scaled
- [ ] Tested on both light and dark system themes

## Implementation Notes

Your current app.json configuration:
```json
{
  "icon": "./assets/images/icon.png",
  "splash": {
    "image": "./assets/images/splash-icon.png",
    "backgroundColor": "#ffffff"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  }
}
```

## Tools & Resources

### Recommended Design Tools
- **Figma** - Free, web-based design tool
- **Adobe Illustrator** - Professional vector graphics
- **Sketch** - Mac-only design tool
- **Canva** - User-friendly template-based design

### Testing Tools
- **iOS Simulator** - Test icon appearance on iOS
- **Android Studio** - Test adaptive icons on Android
- **App Icon Generator** - Online tools for generating multiple sizes

### Icon Size Generators
- [MakeAppIcon](https://makeappicon.com/) - Generates all required sizes
- [App Icon Generator](https://appicon.co/) - Free icon size generator
- [IconKitchen](https://icon.kitchen/) - Android adaptive icon tool

## Brand Alignment

Your app "SourceView Together" is:
- A Bible reading community app
- Focused on group experiences
- Values: Community, Faith, Spiritual Growth

Your icons should reflect:
- **Community**: Welcoming, inclusive design
- **Spirituality**: Respectful, meaningful imagery
- **Technology**: Modern, clean, professional
- **Accessibility**: Clear, readable, universally understood

## Next Steps

1. **Audit Current Icons**: Review your existing icon files
2. **Create Master Design**: Design one master logo that works across all contexts
3. **Generate Variants**: Create optimized versions for each use case
4. **Test Implementation**: Update files and test on actual devices
5. **Gather Feedback**: Test with users to ensure recognition and appeal

Remember: Consistency across all touchpoints strengthens your brand and creates a professional, polished user experience.
