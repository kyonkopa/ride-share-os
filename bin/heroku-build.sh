#!/bin/bash
set -e

echo "🔧 Building frontend..."
cd frontend
yarn install --production=false
yarn build
echo "✅ Frontend build complete."

echo "📦 Copying assets to backend/public..."
cp -r dist/* ../backend/public/

echo "🚀 Proceeding with Rails build..."