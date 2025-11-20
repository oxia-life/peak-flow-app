#!/bin/bash
set -e

echo "🔨 Building Expo web app..."
npx expo export --platform web

echo "📦 Copying public assets..."
mkdir -p dist
cp -r public/* dist/ || true

echo "✅ Build complete!"

