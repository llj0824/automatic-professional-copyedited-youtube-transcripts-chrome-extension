#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ZIP_NAME="youtube_professional_transcript_chrome_extension.zip"

echo -e "${GREEN}🚀 Starting production build process...${NC}"

# Create clean dist directory
echo "📁 Creating clean dist directory..."
rm -rf dist
mkdir dist

# Remove existing zip if it exists
if [ -f "$ZIP_NAME" ]; then
    echo "🗑️  Removing existing zip file..."
    rm "$ZIP_NAME"
fi

# Copy essential files
echo "📋 Copying essential files..."
cp manifest.json dist/
cp -r background dist/
cp -r popup dist/
cp -r content.js dist/
cp -r icons dist/

# Remove any development/test files from dist
echo "🧹 Cleaning up development files..."
find dist -name "*.test.js" -type f -delete
find dist -name "*.map" -type f -delete
find dist -name "*.log" -type f -delete

# Create production zip
echo "🗜️ Creating ${ZIP_NAME}..."
cd dist
zip -r "../${ZIP_NAME}" . -x "**/.DS_Store" "**/__MACOSX/*"
cd ..

# Verify zip contents
echo -e "\n${GREEN}📦 Zip contents:${NC}"
unzip -l "${ZIP_NAME}"

# Clean up
echo "🧹 Cleaning up dist directory..."
rm -rf dist

echo -e "\n${GREEN}✅ Build complete!${NC}"
echo "📍 Your ${ZIP_NAME} is ready for submission"
echo "   Size: $(du -h "${ZIP_NAME}" | cut -f1)"