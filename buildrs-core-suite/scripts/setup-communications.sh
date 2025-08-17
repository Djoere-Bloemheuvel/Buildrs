#!/bin/bash

# =================================
# BUILDRS COMMUNICATIONS SYSTEM
# Production Setup Script
# =================================

set -e  # Exit on any error

echo "🚀 Setting up Buildrs Communications System..."
echo "=============================================="

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ Error: $1 is not installed"
        echo "Please install $1 and try again"
        exit 1
    fi
}

echo "📋 Checking required tools..."
check_tool "node"
check_tool "npm"
check_tool "npx"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Error: Node.js version $NODE_VERSION is too old"
    echo "Please upgrade to Node.js 18 or higher"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating environment configuration..."
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo ""
    echo "🔧 IMPORTANT: Please edit .env.local and fill in your API keys and configuration"
    echo "   Required configurations:"
    echo "   - CONVEX_DEPLOYMENT"
    echo "   - VITE_CONVEX_URL"
    echo "   - VITE_CLERK_PUBLISHABLE_KEY"
    echo "   - CLERK_SECRET_KEY"
    echo "   - Gmail OAuth credentials (if using email monitoring)"
    echo "   - Outlook OAuth credentials (if using email monitoring)"
    echo "   - PhantomBuster API key (if using LinkedIn automation)"
    echo "   - AirCall credentials (if using phone integration)"
    echo "   - Instantly.ai API key (if using email campaigns)"
    echo ""
    
    # Ask if user wants to open the file for editing
    read -p "Would you like to open .env.local for editing now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v code &> /dev/null; then
            code .env.local
        elif command -v nano &> /dev/null; then
            nano .env.local
        elif command -v vim &> /dev/null; then
            vim .env.local
        else
            echo "Please edit .env.local manually with your preferred editor"
        fi
    fi
else
    echo "✅ .env.local already exists"
fi

# Check if Convex is configured
echo "🔗 Checking Convex configuration..."
if [ ! -f ".convex/auth.config.ts" ]; then
    echo "⚙️  Convex not configured. Please run:"
    echo "   npx convex dev --configure=new"
    echo "   Then re-run this setup script"
    exit 1
fi

# Set up Convex environment variables
echo "🔧 Setting up Convex environment variables..."
echo "Please make sure you have configured your .env.local file first!"
echo ""

read -p "Have you configured your .env.local file with all required API keys? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please configure .env.local first, then re-run this script"
    exit 1
fi

# Source .env.local to get environment variables
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Set Convex environment variables
echo "Setting Convex environment variables..."

if [ ! -z "$CLERK_SECRET_KEY" ]; then
    npx convex env set CLERK_SECRET_KEY "$CLERK_SECRET_KEY"
    echo "✅ Set CLERK_SECRET_KEY"
fi

if [ ! -z "$GMAIL_CLIENT_ID" ]; then
    npx convex env set GMAIL_CLIENT_ID "$GMAIL_CLIENT_ID"
    echo "✅ Set GMAIL_CLIENT_ID"
fi

if [ ! -z "$GMAIL_CLIENT_SECRET" ]; then
    npx convex env set GMAIL_CLIENT_SECRET "$GMAIL_CLIENT_SECRET"
    echo "✅ Set GMAIL_CLIENT_SECRET"
fi

if [ ! -z "$OUTLOOK_CLIENT_ID" ]; then
    npx convex env set OUTLOOK_CLIENT_ID "$OUTLOOK_CLIENT_ID"
    echo "✅ Set OUTLOOK_CLIENT_ID"
fi

if [ ! -z "$OUTLOOK_CLIENT_SECRET" ]; then
    npx convex env set OUTLOOK_CLIENT_SECRET "$OUTLOOK_CLIENT_SECRET"
    echo "✅ Set OUTLOOK_CLIENT_SECRET"
fi

if [ ! -z "$PHANTOMBUSTER_API_KEY" ]; then
    npx convex env set PHANTOMBUSTER_API_KEY "$PHANTOMBUSTER_API_KEY"
    echo "✅ Set PHANTOMBUSTER_API_KEY"
fi

if [ ! -z "$AIRCALL_API_ID" ]; then
    npx convex env set AIRCALL_API_ID "$AIRCALL_API_ID"
    echo "✅ Set AIRCALL_API_ID"
fi

if [ ! -z "$AIRCALL_API_TOKEN" ]; then
    npx convex env set AIRCALL_API_TOKEN "$AIRCALL_API_TOKEN"
    echo "✅ Set AIRCALL_API_TOKEN"
fi

if [ ! -z "$INSTANTLY_API_KEY" ]; then
    npx convex env set INSTANTLY_API_KEY "$INSTANTLY_API_KEY"
    echo "✅ Set INSTANTLY_API_KEY"
fi

# Deploy Convex functions
echo "🚀 Deploying Convex functions..."
npx convex deploy

# Build the application
echo "🏗️  Building application..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Start Convex in another terminal: npx convex dev"
echo "3. Open http://localhost:8081 in your browser"
echo ""
echo "📝 To configure integrations:"
echo "1. Gmail/Outlook: Set up OAuth apps and configure redirect URIs"
echo "2. PhantomBuster: Create LinkedIn automation agents"
echo "3. AirCall: Configure webhooks in AirCall admin panel"
echo "4. Instantly.ai: Get API key from account settings"
echo ""
echo "🔗 OAuth Redirect URIs to configure:"
echo "   Gmail: http://localhost:8081/oauth/gmail/callback"
echo "   Outlook: http://localhost:8081/oauth/outlook/callback"
echo ""
echo "🪝 Webhook URLs to configure:"
echo "   PhantomBuster: http://localhost:8081/api/webhooks/phantombuster"
echo "   AirCall: http://localhost:8081/api/webhooks/aircall"
echo "   Instantly: http://localhost:8081/api/webhooks/instantly"
echo ""
echo "For production deployment, update the URLs in your .env.local file"
echo ""
echo "Happy communicating! 🚀"