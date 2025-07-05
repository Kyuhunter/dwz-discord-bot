#!/bin/bash

# Quick test to verify bot setup
echo "🧪 Discord Bot Setup Test"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please run: sudo apt install nodejs npm"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo "Please run: sudo apt install npm"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    echo "Please create .env file with your DISCORD_TOKEN"
    exit 1
fi

# Check if DISCORD_TOKEN is set
if ! grep -q "DISCORD_TOKEN=.*[^[:space:]]" .env; then
    echo "⚠️  DISCORD_TOKEN appears to be empty in .env"
    echo "Please add your Discord bot token to .env"
    exit 1
fi

echo "✅ .env file exists with token"

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Dependencies installed"

# Test bot info retrieval
echo "🤖 Testing bot connection..."
timeout 10s npm run info

if [ $? -eq 0 ]; then
    echo "✅ Bot connection test successful!"
    echo ""
    echo "🎉 Setup appears to be working correctly!"
    echo ""
    echo "Next steps:"
    echo "1. npm run deploy  # Deploy commands"
    echo "2. npm run dev     # Start the bot"
else
    echo "⚠️  Bot connection test failed"
    echo "This might be due to:"
    echo "- Invalid token"
    echo "- Missing Message Content Intent"
    echo "- Network issues"
    echo ""
    echo "Check the error above and see INTENTS.md for help"
fi
