const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all the route.ts files in the app directory
const routeFiles = execSync('find /Users/maiyash/jetstream/app -name "route.ts" | grep "\\["')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${routeFiles.length} dynamic route files to process`);

// Import statement to add
const importStatement = `import { GetRouteHandler, PostRouteHandler, PatchRouteHandler, DeleteRouteHandler, PutRouteHandler, IdParam } from '@/lib/types/route-types';`;

// Process each file
routeFiles.forEach(filePath => {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Skip files that already use our new types
  if (content.includes('import { GetRouteHandler') || 
      content.includes('import {GetRouteHandler') ||
      content.includes('RouteHandler')) {
    console.log(`Skipping already updated file: ${filePath}`);
    return;
  }

  // Check if the file has any HTTP method handlers with params
  const hasParamsPattern = /export (async )?function (GET|POST|PUT|PATCH|DELETE)\([^)]*params[^)]*\)/;
  if (!hasParamsPattern.test(content)) {
    console.log(`Skipping file with no dynamic params: ${filePath}`);
    return;
  }

  console.log(`Processing: ${filePath}`);
  
  // Extract parameter type from route path
  let paramType = 'id';
  const match = filePath.match(/\[([^\]]+)\]/);
  if (match) {
    paramType = match[1];
  }

  // Add import if not already present
  if (!content.includes('import { GetRouteHandler')) {
    const importIndex = content.lastIndexOf('import');
    if (importIndex !== -1) {
      const importEndIndex = content.indexOf('\n', importIndex);
      content = content.slice(0, importEndIndex + 1) + 
                importStatement + '\n' + 
                content.slice(importEndIndex + 1);
      modified = true;
    } else {
      content = importStatement + '\n\n' + content;
      modified = true;
    }
  }

  // Update GET handlers
  content = content.replace(
    /export (async )?function GET\(\s*request: (Next)?Request,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*(\w+):\s*string\s*}\s*}\s*\)/g,
    `export const GET: GetRouteHandler<{ $3: string }> = async (
  request: NextRequest,
  context: IdParam
) =>`
  );

  // Update POST handlers
  content = content.replace(
    /export (async )?function POST\(\s*request: (Next)?Request,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*(\w+):\s*string\s*}\s*}\s*\)/g,
    `export const POST: PostRouteHandler<{ $3: string }> = async (
  request: NextRequest,
  context: IdParam
) =>`
  );

  // Update PUT handlers
  content = content.replace(
    /export (async )?function PUT\(\s*request: (Next)?Request,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*(\w+):\s*string\s*}\s*}\s*\)/g,
    `export const PUT: PutRouteHandler<{ $3: string }> = async (
  request: NextRequest,
  context: IdParam
) =>`
  );

  // Update PATCH handlers
  content = content.replace(
    /export (async )?function PATCH\(\s*request: (Next)?Request,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*(\w+):\s*string\s*}\s*}\s*\)/g,
    `export const PATCH: PatchRouteHandler<{ $3: string }> = async (
  request: NextRequest,
  context: IdParam
) =>`
  );

  // Update DELETE handlers
  content = content.replace(
    /export (async )?function DELETE\(\s*request: (Next)?Request,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*(\w+):\s*string\s*}\s*}\s*\)/g,
    `export const DELETE: DeleteRouteHandler<{ $3: string }> = async (
  request: NextRequest,
  context: IdParam
) =>`
  );

  // Replace params access with await context.params
  content = content.replace(
    /const (\w+) = params\.(\w+);/g,
    `const { $2 } = await context.params;\nconst $1 = $2;`
  );

  // If we can't match the exact pattern, look for other references to params
  if (content.includes('params.')) {
    content = content.replace(
      /const (\w+) = params\.(\w+);/g,
      `const { $2 } = await context.params;\nconst $1 = $2;`
    );
  }

  // Replace function closing with arrow function closing
  content = content.replace(/}\s*$/g, '};');

  // Write the modified content back to file
  if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed for: ${filePath}`);
  }
});

console.log('Route handler update complete!'); 