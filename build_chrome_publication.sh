#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ZIP_NAME="youtube_professional_transcript_chrome_extension.zip"

echo -e "${GREEN}🚀 Starting production build process...${NC}"

# Check for required tools
echo "🔍 Checking for required tools..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Install minification tools if not already installed
echo "📦 Installing minification tools..."
npm install -g terser html-minifier clean-css-cli

# Create clean dist directory
echo "📁 Creating clean dist directory..."
rm -rf dist
mkdir -p dist/popup

# Copy essential files
echo "📋 Copying essential files..."
cp manifest.json dist/
cp -r background dist/
cp -r icons dist/
cp content.js dist/

# Minify JavaScript files
echo "🔨 Minifying JavaScript files..."
for js_file in popup/*.js; do
    filename=$(basename "$js_file")
    terser "$js_file" \
        --compress \
        --mangle \
        --output "dist/popup/${filename}" \
        --toplevel \
        --format quote_style=1
done

# Minify CSS files
echo "🎨 Minifying CSS files..."
for css_file in popup/*.css; do
    filename=$(basename "$css_file")
    cleancss -o "dist/popup/${filename}" "$css_file"
done

# Minify HTML files
echo "📄 Minifying HTML files..."
for html_file in popup/*.html; do
    filename=$(basename "$html_file")
    html-minifier \
        --collapse-whitespace \
        --remove-comments \
        --remove-optional-tags \
        --remove-redundant-attributes \
        --remove-script-type-attributes \
        --remove-tag-whitespace \
        --use-short-doctype \
        --minify-css true \
        --minify-js true \
        "$html_file" -o "dist/popup/${filename}"
done

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