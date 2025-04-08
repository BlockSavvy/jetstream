const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all the page.tsx files in app directory that have dynamic segments
const pageFiles = execSync('find /Users/maiyash/jetstream/app -path "*/\\[*\\]/page.tsx" -type f')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${pageFiles.length} dynamic page files to process`);

// Process each file
pageFiles.forEach(filePath => {
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip client components - they can't be async
  if (content.includes("'use client'") || content.includes('"use client"')) {
    console.log(`Skipping client component: ${filePath}`);
    return;
  }
  
  console.log(`Processing server component: ${filePath}`);
  
  // Update generateMetadata functions to use Promise-based params
  let updatedContent = content.replace(
    /export (async )?function generateMetadata\(\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*(\w+):\s*string(\s*\|\s*undefined)?\s*\}\s*\}\)/g,
    'export async function generateMetadata({ params }: { params: Promise<{ $2: string$3 }> })'
  );
  
  // Update page components to use Promise-based params
  updatedContent = updatedContent.replace(
    /export default (async )?function \w+\(\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*(\w+):\s*string(\s*\|\s*undefined)?\s*\}\s*\}\)/g,
    'export default async function $1({ params }: { params: Promise<{ $2: string$3 }> })'
  );
  
  // Add await to params access (if not already there)
  if (!updatedContent.includes('await params')) {
    updatedContent = updatedContent.replace(
      /const (\w+) = params\.(\w+);/g,
      'const { $2 } = await params;\nconst $1 = $2;'
    );
    
    // Direct usage of params
    updatedContent = updatedContent.replace(
      /params\.(\w+)/g,
      '(await params).$1'
    );
  }
  
  // Check if anything was updated
  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed for: ${filePath}`);
  }
});

console.log('Page component update complete!'); 