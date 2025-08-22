#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up development logs for production OTA update...\n');

// Function to recursively find all TypeScript/TSX files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    
    // Skip certain directories
    if (item === 'node_modules' || item === 'ios' || item === 'android' || item === '.git' || item === 'Pods' || item === 'scripts') {
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

// Function to clean up development logs in a file
function cleanupDevelopmentLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove all logger calls with emojis and development-style logging
    const developmentLogPatterns = [
      // Remove all logger.info calls with emojis and brackets
      /logger\.info\([^)]*[🔍🎯📊🧪📚📜🎯📍✅🔄📱📦⬇️📅📖👥][^)]*\);?\s*/g,
      // Remove all logger.warn calls with emojis and brackets  
      /logger\.warn\([^)]*[🔍🎯📊🧪📚📜🎯📍✅🔄📱📦⬇️📅📖👥][^)]*\);?\s*/g,
      // Remove all logger.debug calls with emojis and brackets
      /logger\.debug\([^)]*[🔍🎯📊🧪📚📜🎯📍✅🔄📱📦⬇️📅📖👥][^)]*\);?\s*/g,
      // Remove specific development log patterns
      /logger\.info\([^)]*\[[^\]]+\][^)]*\);?\s*/g,
      /logger\.warn\([^)]*\[[^\]]+\][^)]*\);?\s*/g,
      /logger\.debug\([^)]*\[[^\]]+\][^)]*\);?\s*/g,
      // Remove animation and UI debug logs
      /logger\.info\([^)]*Animation[^)]*\);?\s*/g,
      /logger\.info\([^)]*Modal[^)]*\);?\s*/g,
      /logger\.info\([^)]*ScrollView[^)]*\);?\s*/g,
      /logger\.info\([^)]*handleLongPress[^)]*\);?\s*/g,
      // Remove database operation logs
      /logger\.info\([^)]*Database[^)]*\);?\s*/g,
      /logger\.info\([^)]*Migration[^)]*\);?\s*/g,
      /logger\.info\([^)]*Initialized[^)]*\);?\s*/g,
      // Remove QR code debug logs
      /logger\.info\([^)]*QR[^)]*\);?\s*/g,
      /logger\.info\([^)]*Session[^)]*\);?\s*/g,
      // Remove test-related logs
      /logger\.info\([^)]*Test[^)]*\);?\s*/g,
      /logger\.info\([^)]*🧪[^)]*\);?\s*/g,
      // Remove transaction logs
      /logger\.info\([^)]*Transaction[^)]*\);?\s*/g,
      /logger\.info\([^)]*Rollback[^)]*\);?\s*/g,
      // Remove completion logs
      /logger\.info\([^)]*Completion[^)]*\);?\s*/g,
      /logger\.info\([^)]*Successfully[^)]*\);?\s*/g,
      // Remove position and scroll logs
      /logger\.info\([^)]*Position[^)]*\);?\s*/g,
      /logger\.info\([^)]*Scroll[^)]*\);?\s*/g,
      /logger\.info\([^)]*Verse[^)]*\);?\s*/g,
      // Remove context logs
      /logger\.info\([^)]*Context[^)]*\);?\s*/g,
      /logger\.info\([^)]*Plan[^)]*\);?\s*/g,
      /logger\.info\([^)]*Challenge[^)]*\);?\s*/g
    ];
    
    for (const pattern of developmentLogPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    }
    
    // Remove empty lines that might be left after log removal
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Save the modified file
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
try {
  const projectRoot = process.cwd();
  console.log(`📁 Searching in: ${projectRoot}\n`);
  
  const files = findTsFiles(projectRoot);
  console.log(`📁 Found ${files.length} TypeScript/TSX files\n`);
  
  let cleanedFiles = 0;
  const cleanedFilesList = [];
  
  for (const file of files) {
    if (cleanupDevelopmentLogs(file)) {
      cleanedFiles++;
      cleanedFilesList.push(file);
      console.log(`🧹 Cleaned development logs in: ${file}`);
    }
  }
  
  console.log(`\n🎉 Development log cleanup completed!`);
  console.log(`🧹 Cleaned ${cleanedFiles} files`);
  console.log(`📁 Total files processed: ${files.length}`);
  
  if (cleanedFilesList.length > 0) {
    console.log('\n📋 Files that were cleaned:');
    cleanedFilesList.forEach((file, index) => {
      console.log(`   ${index + 1}. ${path.relative(projectRoot, file)}`);
    });
  }
  
  console.log('\n✅ Ready for OTA update! All development logs have been removed.');
  
} catch (error) {
  console.error('💥 Script execution failed:', error);
  process.exit(1);
}
