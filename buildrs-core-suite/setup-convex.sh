#!/bin/bash

echo "🚀 Setting up Convex for Buildrs Core Suite..."
echo ""

# Create a temporary config to avoid the interactive prompt
cat > convex.config.js << 'EOF'
module.exports = {
  team: "djoerebloemheuvel-2a2", // Your Convex team
  project: "buildrs-core-suite", // Project name
};
EOF

echo "📦 Starting Convex development server..."
echo "This will create a new project called 'buildrs-core-suite'"
echo ""

# Run convex dev which should pick up our config
npx convex dev --once --configure=new

# Clean up temporary config
rm -f convex.config.js

echo ""
echo "✅ Convex setup complete!"
echo "📝 The deployment URL has been added to .env.local"
echo "🔄 You can now run 'npm run dev' to start development"