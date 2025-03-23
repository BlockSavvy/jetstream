#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate a simple SVG profile avatar with initials
const generateProfileSVG = (name, outputPath) => {
  const width = 200;
  const height = 200;
  
  // Choose a random color scheme
  const colorSchemes = [
    ['#f59e0b', '#d97706'], // amber
    ['#3b82f6', '#1d4ed8'], // blue
    ['#10b981', '#059669'], // emerald
    ['#8b5cf6', '#6d28d9'], // purple
    ['#f43f5e', '#be123c'], // rose
    ['#64748b', '#475569'], // slate
  ];
  
  const colors = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
  
  // Get initials
  const initials = name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
  
  // Create SVG content
  const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad)" />
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  
  // Save to file
  fs.writeFileSync(outputPath, svgContent);
  console.log(`Generated ${outputPath}`);
};

// Profile data from the compatibleTravelers array
const profiles = [
  { name: 'Alex Marshall', filename: 'alex.svg' },
  { name: 'Sophia Chen', filename: 'sophia.svg' },
  { name: 'Marcus Johnson', filename: 'marcus.svg' },
  { name: 'Olivia Rodriguez', filename: 'olivia.svg' },
  { name: 'James Wilson', filename: 'james.svg' },
  { name: 'Emma Davis', filename: 'emma.svg' },
];

// Create the profile images directory if it doesn't exist
const profileImagesDir = path.join(__dirname, '../public/images/profile');
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

// Generate all profile images
profiles.forEach(profile => {
  const outputPath = path.join(profileImagesDir, profile.filename);
  generateProfileSVG(profile.name, outputPath);
});

console.log('Profile images generated successfully!'); 