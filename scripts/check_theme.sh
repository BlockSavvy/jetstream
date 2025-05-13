#!/bin/bash
echo "Checking component theme usage..."
echo "Components using useGdyupTheme:"
find app/gdyup -type f -name "*.tsx" | grep -v "node_modules" | xargs grep -l "useGdyupTheme" | wc -l
echo "Total client components:"
find app/gdyup -type f -name "*.tsx" | grep -v "node_modules" | xargs grep -l "'use client'" | wc -l
