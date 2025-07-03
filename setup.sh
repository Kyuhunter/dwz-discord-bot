#!/bin/bash

# DWZ Discord Bot Setup Script
# This script installs Node.js, npm, and sets up the Discord bot

echo "🤖 DWZ Discord Bot Setup"
echo "========================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please do not run this script as root"
    exit 1
fi

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install Node.js and npm
echo "🟢 Installing Node.js and npm..."
sudo apt install -y nodejs npm

# Verify installation
echo "✅ Verifying installation..."
node_version=$(node --version 2>/dev/null)
npm_version=$(npm --version 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Node.js version: $node_version"
    echo "✅ npm version: $npm_version"
else
    echo "❌ Node.js installation failed"
    exit 1
fi

# Install bot dependencies
echo "📚 Installing Discord bot dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your Discord bot credentials"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your Discord bot token and IDs"
echo "2. Deploy commands: npm run deploy"
echo "3. Start the bot: npm run dev"
echo ""
echo "For help, see README.md"
