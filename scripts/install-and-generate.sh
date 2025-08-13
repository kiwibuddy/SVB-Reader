#!/bin/bash

echo "🚀 SourceView Together PNG Asset Generator"
echo "=========================================="

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ macOS detected"
    
    # Check if Homebrew is installed
    if command -v brew >/dev/null 2>&1; then
        echo "✅ Homebrew found"
        
        # Install ImageMagick
        echo "📦 Installing ImageMagick..."
        brew install imagemagick
        
        # Verify installation
        if command -v convert >/dev/null 2>&1; then
            echo "✅ ImageMagick installed successfully"
            
            # Generate PNG assets
            echo "🎨 Generating PNG assets from SVG..."
            
            SVG_FILE="assets/images/SourceView Together Icon.svg"
            
            if [ -f "$SVG_FILE" ]; then
                echo "✅ Found SVG file: $SVG_FILE"
                
                # Generate icon.png (1024x1024, rounded corners)
                echo "🔄 Generating icon.png..."
                convert "$SVG_FILE" -resize 1024x1024 \
                    \( +clone -alpha extract \
                    -draw 'fill black polygon 0,0 0,180 180,0 fill white circle 180,180 180,0' \
                    -draw 'fill black polygon 1024,1024 1024,844 844,1024 fill white circle 844,844 844,1024' \
                    \) -alpha off -compose CopyOpacity -composite \
                    "assets/images/icon.png"
                
                # Generate splash-icon.png (512x512, rounded corners)
                echo "🔄 Generating splash-icon.png..."
                convert "$SVG_FILE" -resize 512x512 \
                    \( +clone -alpha extract \
                    -draw 'fill black polygon 0,0 0,80 80,0 fill white circle 80,80 80,0' \
                    -draw 'fill black polygon 512,512 512,432 432,512 fill white circle 432,432 432,512' \
                    \) -alpha off -compose CopyOpacity -composite \
                    "assets/images/splash-icon.png"
                
                # Generate adaptive-icon.png (1024x1024, no rounding)
                echo "🔄 Generating adaptive-icon.png..."
                convert "$SVG_FILE" -resize 1024x1024 "assets/images/adaptive-icon.png"
                
                # Generate favicon.png (32x32, rounded corners)
                echo "🔄 Generating favicon.png..."
                convert "$SVG_FILE" -resize 32x32 \
                    \( +clone -alpha extract \
                    -draw 'fill black polygon 0,0 0,6 6,0 fill white circle 6,6 6,0' \
                    -draw 'fill black polygon 32,32 32,26 26,32 fill white circle 26,26 26,32' \
                    \) -alpha off -compose CopyOpacity -composite \
                    "assets/images/favicon.png"
                
                echo "✅ All PNG assets generated successfully!"
                echo "📁 Generated files:"
                echo "   - assets/images/icon.png (1024x1024)"
                echo "   - assets/images/splash-icon.png (512x512)"
                echo "   - assets/images/adaptive-icon.png (1024x1024)"
                echo "   - assets/images/favicon.png (32x32)"
                
            else
                echo "❌ SVG file not found: $SVG_FILE"
                echo "Please ensure the SVG file exists in the correct location."
            fi
        else
            echo "❌ ImageMagick installation failed"
        fi
    else
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    fi
else
    echo "❌ This script is designed for macOS. For other systems:"
    echo "   - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "   - CentOS/RHEL: sudo yum install imagemagick"
    echo "   - Windows: Download from https://imagemagick.org/script/download.php"
fi
