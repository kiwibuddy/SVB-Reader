#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/TSX files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    
    // Skip certain directories
    if (item === 'node_modules' || item === 'ios' || item === 'android' || item === '.git') {
      continue;
    }
    
    try {
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        findTsFiles(fullPath, files);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    } catch (error) {
      // Skip files that can't be accessed
      continue;
    }
  }
  
  return files;
}

// Function to fix logger method calls in a file
function fixLoggerMethods(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix logger.log -> logger.info
    if (content.includes('logger.info(')) {
      content = content.replace(/logger\.log\(/g, 'logger.info(');
      modified = true;
    }
    
    // Fix logger.consoleError -> logger.error
    if (content.includes('logger.error(')) {
      content = content.replace(/logger\.consoleError\(/g, 'logger.error(');
      modified = true;
    }
    
    // Fix logger.consoleWarn -> logger.warn
    if (content.includes('logger.warn(')) {
      content = content.replace(/logger\.consoleWarn\(/g, 'logger.warn(');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed logger methods in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Fixing logger method calls across the codebase...\n');

const projectRoot = path.resolve(__dirname, '..');
const tsFiles = findTsFiles(projectRoot);

console.log(`📁 Found ${tsFiles.length} TypeScript/TSX files\n`);

let fixedCount = 0;
for (const file of tsFiles) {
  if (fixLoggerMethods(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Logger method fixes completed!`);
console.log(`✅ Fixed ${fixedCount} files`);
console.log(`📁 Total files processed: ${tsFiles.length}`);
