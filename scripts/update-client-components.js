const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all client component page files with dynamic segments
const clientPageFiles = execSync('find /Users/maiyash/jetstream/app -path "*/\\[*\\]/page.tsx" -type f | xargs grep -l "\'use client\'"')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${clientPageFiles.length} client component pages with dynamic params`);

// Process each file
clientPageFiles.forEach(filePath => {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Extract parameter name from route path
  let paramName = 'id';
  const match = filePath.match(/\[([^\]]+)\]/);
  if (match) {
    paramName = match[1];
  }

  // Determine which client param type to use
  let clientParamType = 'ClientIdParams';
  if (paramName === 'slug') {
    clientParamType = 'ClientSlugParams';
  } else if (paramName === 'userId') {
    clientParamType = 'ClientUserIdParams';
  } else if (paramName === 'flightId') {
    clientParamType = 'ClientFlightIdParams';
  } else if (paramName === 'jetShareId') {
    clientParamType = 'ClientJetShareIdParams';
  }
  
  // Check if we already added the import
  if (!content.includes('import { Client')) {
    const importMatch = content.match(/import [^;]+from [^;]+;/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
      
      // Add our import after the last import
      content = content.slice(0, lastImportIndex) + 
                `\nimport { ${clientParamType} } from '@/lib/types/route-types'` + 
                content.slice(lastImportIndex);
      modified = true;
    }
  }
  
  // Remove any existing 'declare module' override
  const declareModulePattern = /\/\/ Add type declaration[\s\S]*?declare module 'next'[\s\S]*?}\s*}\s*\n/;
  if (declareModulePattern.test(content)) {
    content = content.replace(declareModulePattern, '');
    modified = true;
  }
  
  // Update the component props type
  const propsPattern = new RegExp(`export default function \\w+\\(\\{\\s*params\\s*\\}:\\s*\\{\\s*params:\\s*\\{\\s*${paramName}:\\s*string(\\s*\\|\\s*undefined)?\\s*\\}\\s*\\}\\)`, 'g');
  if (propsPattern.test(content)) {
    content = content.replace(propsPattern, `export default function $1({ params }: ${clientParamType})`);
    modified = true;
  }
  
  // If we made changes, write them back to the file
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated client component: ${filePath}`);
  } else {
    console.log(`No changes needed for: ${filePath}`);
  }
});

console.log('Client component update complete!'); 