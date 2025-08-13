# PNG Asset Generation Guide

## 🚀 Quick Method: Online SVG to PNG Converter

### Step 1: Use Online Tool
1. Go to: https://convertio.co/svg-png/ or https://cloudconvert.com/svg-to-png
2. Upload `assets/images/SourceView Together Icon.svg`

### Step 2: Generate Each Required Asset

#### 1. icon.png (App Store Icon)
- Set size: **1024x1024px**
- Apply border-radius: **180px** (18% of 1024px)
- Download as `icon.png`

#### 2. splash-icon.png (Native Splash)
- Set size: **512x512px** 
- Apply border-radius: **80px** (16% of 512px)
- Download as `splash-icon.png`

#### 3. adaptive-icon.png (Android)
- Set size: **1024x1024px**
- No border-radius (Android handles this)
- Download as `adaptive-icon.png`

#### 4. favicon.png (Web)
- Set size: **32x32px**
- Apply border-radius: **6px** (19% of 32px)
- Download as `favicon.png`

### Step 3: Replace Files
1. Replace all files in `assets/images/` folder
2. Ensure grey background (#808080) is preserved in all versions

## 🛠️ Alternative: Figma/Sketch Method

### If you have Figma or Sketch:
1. Import `SourceView Together Icon.svg`
2. Create artboards for each size (1024x1024, 512x512, 32x32)
3. Apply rounded corners as specified above
4. Export as PNG with grey background intact

## ⚠️ Critical Requirements

- **ALL PNG files MUST have grey background (#808080)**
- **Speech bubbles colors: Pink (#FCC1C3), Green (#B8F8BA), Blue (#8CE3FF)**
- **Rounded corners as specified above**
- **High quality export (no pixelation)**

## 🔍 Verification Checklist

After generating, verify each PNG:
- [ ] Grey background visible
- [ ] All three speech bubbles present
- [ ] Correct dimensions
- [ ] Proper rounded corners (where applicable)
- [ ] High quality, no artifacts
