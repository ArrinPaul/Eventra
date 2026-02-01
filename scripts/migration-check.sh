#!/bin/bash
# Eventra Migration Script - Auto-fixes for import paths and component consolidation

echo "🔄 Starting Eventra Migration..."

# Step 1: Find all files with @/lib imports
echo "📍 Searching for @/lib imports..."
grep -r "@/lib/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u > /tmp/lib_imports.txt

if [ -s /tmp/lib_imports.txt ]; then
    echo "❌ Found files with @/lib/ imports (should not exist):"
    cat /tmp/lib_imports.txt
    echo ""
    echo "⚠️ These imports should have been updated to @/core/"
else
    echo "✅ No @/lib/ imports found - Good!"
fi

# Step 2: Check for duplicate components
echo ""
echo "🔍 Checking for duplicate components..."

DUPLICATES=(
    "src/components/chat/chat-client.tsx"
    "src/components/ai/ai-chatbot.tsx"
    "src/components/integrations/ai-chatbot.tsx"
    "src/components/workspace/google-workspace.tsx"
    "src/components/integrations/google-workspace-integration.tsx"
    "src/components/integrations/notation-system.tsx"
    "src/components/notation/notation-system.tsx"
)

for file in "${DUPLICATES[@]}"; do
    if [ -f "$file" ]; then
        echo "⚠️ Found duplicate: $file"
    fi
done

# Step 3: Check build status
echo ""
echo "🏗️ Building project..."
npm run build 2>&1 | tail -20

echo ""
echo "✨ Migration scan complete!"
