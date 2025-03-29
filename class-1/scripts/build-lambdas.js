const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Check if watch mode is enabled
const isWatchMode = process.argv.includes('--watch');
const watchFlag = isWatchMode ? '--watch' : '';

// Get all lambda directories
const lambdaDirs = glob.sync('src/lambda/*/', { posix: true });

// Ensure output directory exists
if (!fs.existsSync('out/lambda')) {
  fs.mkdirSync('out/lambda', { recursive: true });
}

console.log(`Building ${lambdaDirs.length} lambda functions${isWatchMode ? ' in watch mode' : ''}...`);

// Build each lambda function
lambdaDirs.forEach(lambdaDir => {
  const functionName = path.basename(lambdaDir.replace(/\/$/, ''));
  const entryFile = path.join(lambdaDir, 'index.ts');
  const outputDir = path.join('out/lambda', functionName);
  
  // Skip if the entry file doesn't exist
  if (!fs.existsSync(entryFile)) {
    console.log(`Skipping ${functionName}: No index.ts found`);
    return;
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Building ${functionName}...`);
  
  try {
    // Build the TypeScript code
    const outputFile = path.join(outputDir, 'index.js');
    const command = `esbuild ${entryFile} --bundle --platform=node --target=node20 --outfile=${outputFile} ${watchFlag}`;
    
    if (isWatchMode) {
      // In watch mode, we don't want to block the execution
      const childProcess = require('child_process').exec(command);
      childProcess.stdout.on('data', data => console.log(data));
      childProcess.stderr.on('data', data => console.error(data));
      console.log(`Watching ${functionName} for changes...`);
    } else {
      // In normal mode, run synchronously
      execSync(command, { stdio: 'inherit' });
      
      // Copy all non-TypeScript files (html, json, etc.)
      const nonTsFiles = glob.sync(`${lambdaDir}**/*.!(ts)`, { posix: true, nodir: true });
      
      if (nonTsFiles.length > 0) {
        console.log(`  Copying ${nonTsFiles.length} additional files for ${functionName}...`);
        
        nonTsFiles.forEach(filePath => {
          const relativePath = path.relative(lambdaDir, filePath);
          const destPath = path.join(outputDir, relativePath);
          
          // Create directory if it doesn't exist
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          // Copy the file
          fs.copyFileSync(filePath, destPath);
        });
      }
      
      console.log(`Successfully built ${functionName}`);
    }
  } catch (error) {
    console.error(`Error building ${functionName}:`, error);
    if (!isWatchMode) {
      process.exit(1);
    }
  }
});

// Copy the www directory for static content
try {
  const wwwSrcPath = path.join('src', 'www');
  const wwwDestPath = path.join('out', 'www');
  
  if (fs.existsSync(wwwSrcPath)) {
    console.log('Copying www directory for static content...');
    
    // Remove old www directory if it exists
    if (fs.existsSync(wwwDestPath)) {
      fs.rmSync(wwwDestPath, { recursive: true, force: true });
    }
    
    // Create www directory
    fs.mkdirSync(wwwDestPath, { recursive: true });
    
    // Copy all files from www
    const wwwFiles = glob.sync(`${wwwSrcPath}/**/*`, { posix: true, nodir: true });
    
    wwwFiles.forEach(filePath => {
      const relativePath = path.relative(wwwSrcPath, filePath);
      const destPath = path.join(wwwDestPath, relativePath);
      
      // Create directory if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(filePath, destPath);
    });
    
    console.log('Successfully copied www directory');
  } else {
    console.log('No www directory found, skipping...');
  }
} catch (error) {
  console.error('Error copying www directory:', error);
}

if (isWatchMode) {
  console.log('Watch mode active. Press Ctrl+C to stop.');
}