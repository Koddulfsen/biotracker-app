#!/bin/bash

# Downgrade React to stable version to fix Supabase compatibility
echo "Downgrading React to fix Supabase compatibility issue..."

# Update package.json with stable React version
npm install react@18.3.1 react-dom@18.3.1 --save --save-exact

# Commit the change
git add package.json package-lock.json
git commit -m "Downgrade React from 19.1.0 to 18.3.1 to fix Supabase SDK compatibility"
git push

echo "Done! React downgraded to stable version 18.3.1"