#!/usr/bin/env node

/**
 * Component Usage Analyzer
 * This script scans the codebase to determine which components are actually imported and used
 * vs. which ones might be redundant or abandoned.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '../../');
const COMPONENT_DIRS = [
  'app/gdyup/components',
  'app/gdyup/components/dashboard',
  'app/gdyup/components/onboarding'
];
const FILE_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build'];

console.log('🔍 GDY·UP Component Usage Analysis');
console.log('================================\n');

// Get all component files
const getComponentFiles = () => {
  const componentFiles = [];
  
  COMPONENT_DIRS.forEach(dir => {
    const fullPath = path.join(ROOT_DIR, dir);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Directory not found: ${dir}`);
      return;
    }
    
    try {
      const files = fs.readdirSync(fullPath);
      
      files.forEach(file => {
        const filePath = path.join(fullPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && FILE_EXTENSIONS.includes(path.extname(file))) {
          componentFiles.push({
            name: file,
            path: filePath,
            relativePath: path.relative(ROOT_DIR, filePath)
          });
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
  });
  
  return componentFiles;
};

// Find usage of a component across the codebase
const findComponentUsage = (componentName) => {
  const nameWithoutExtension = componentName.split('.')[0];
  
  // Skip index files or utility files that might not be directly imported
  if (['index', 'types', 'utils', 'constants', 'context', 'provider'].includes(nameWithoutExtension.toLowerCase())) {
    return { status: 'UTILITY', count: -1, files: [] };
  }
  
  try {
    // Use grep to find imports of this component
    // grep for both import statements and JSX usage
    const grepCommand = `grep -r --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" --include="*.md" "${nameWithoutExtension}" ${ROOT_DIR}/app`;
    
    try {
      const result = execSync(grepCommand, { encoding: 'utf8' });
      const lines = result.split('\n').filter(line => line.trim() !== '');
      
      // Filter out self-references and false positives
      const relevantLines = lines.filter(line => {
        // Skip the component file itself
        if (line.includes(`/${componentName}:`)) return false;
        
        // Look for import statements or JSX usage
        return (
          line.includes(`import ${nameWithoutExtension}`) || 
          line.includes(`from './${nameWithoutExtension}'`) ||
          line.includes(`from "../${nameWithoutExtension}"`) ||
          line.includes(`<${nameWithoutExtension}`) ||
          line.includes(`component={${nameWithoutExtension}}`)
        );
      });
      
      return {
        status: relevantLines.length > 0 ? 'USED' : 'UNUSED',
        count: relevantLines.length,
        files: relevantLines.map(line => line.split(':')[0])
      };
    } catch (error) {
      // grep returns non-zero exit code when no matches are found
      return { status: 'UNUSED', count: 0, files: [] };
    }
  } catch (error) {
    console.error(`Error analyzing usage for ${componentName}:`, error);
    return { status: 'ERROR', count: -1, files: [] };
  }
};

// Find duplicate/similar components
const findSimilarComponents = (components) => {
  const similarityGroups = {};
  
  // Group components by name similarity (ignoring prefixes like Enhanced, Mobile, etc.)
  components.forEach(component => {
    const name = component.name.split('.')[0];
    let baseName = name;
    
    // Remove common prefixes
    ['Enhanced', 'Mobile', 'Themed', 'Custom', 'Base', 'Jet', 'Gdyup', 'Nostr'].forEach(prefix => {
      if (baseName.startsWith(prefix)) {
        baseName = baseName.substring(prefix.length);
      }
    });
    
    // Remove common suffixes
    ['Client', 'Component', 'Container', 'Wrapper', 'View', 'Tab'].forEach(suffix => {
      if (baseName.endsWith(suffix)) {
        baseName = baseName.substring(0, baseName.length - suffix.length);
      }
    });
    
    if (!similarityGroups[baseName]) {
      similarityGroups[baseName] = [];
    }
    
    similarityGroups[baseName].push(component);
  });
  
  // Filter to only groups with multiple components
  const possibleDuplicates = Object.entries(similarityGroups)
    .filter(([_, group]) => group.length > 1)
    .map(([baseName, group]) => ({ baseName, components: group }));
  
  return possibleDuplicates;
};

// Main execution
const componentFiles = getComponentFiles();
console.log(`Found ${componentFiles.length} component files\n`);

// Analyze each component
const analysisResults = componentFiles.map(component => {
  const usage = findComponentUsage(component.name);
  
  return {
    ...component,
    ...usage
  };
});

// Group results by status
const used = analysisResults.filter(r => r.status === 'USED');
const unused = analysisResults.filter(r => r.status === 'UNUSED');
const utility = analysisResults.filter(r => r.status === 'UTILITY');
const error = analysisResults.filter(r => r.status === 'ERROR');

// Show summary
console.log('📊 SUMMARY');
console.log(`Total components analyzed: ${componentFiles.length}`);
console.log(`Used components: ${used.length}`);
console.log(`Unused components: ${unused.length}`);
console.log(`Utility files: ${utility.length}`);
console.log(`Errors: ${error.length}\n`);

// Show unused components
if (unused.length > 0) {
  console.log('🗑️ POTENTIALLY UNUSED COMPONENTS');
  unused.forEach(component => {
    console.log(`- ${component.relativePath}`);
  });
  console.log();
}

// Find possible duplicates
const possibleDuplicates = findSimilarComponents(componentFiles);

if (possibleDuplicates.length > 0) {
  console.log('🔄 POTENTIALLY REDUNDANT COMPONENTS');
  possibleDuplicates.forEach(group => {
    console.log(`\nBase functionality: ${group.baseName}`);
    group.components.forEach(component => {
      const componentResult = analysisResults.find(r => r.name === component.name);
      const usageInfo = componentResult ? ` (Usage: ${componentResult.count})` : '';
      console.log(`- ${component.relativePath}${usageInfo}`);
    });
  });
  console.log();
}

// Show most used components
const mostUsed = [...used].sort((a, b) => b.count - a.count).slice(0, 10);

console.log('🔝 MOST USED COMPONENTS');
mostUsed.forEach(component => {
  console.log(`- ${component.relativePath} (${component.count} usages)`);
});

console.log('\n✅ Analysis complete!');
console.log('For complete results, check the full report or use grep to find specific components.'); 