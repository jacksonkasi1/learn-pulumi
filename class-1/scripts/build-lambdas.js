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
  const outputFile = path.join(outputDir, 'index.js');
  
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
      console.log(`Successfully built ${functionName}`);
    }
  } catch (error) {
    console.error(`Error building ${functionName}:`, error);
    if (!isWatchMode) {
      process.exit(1);
    }
  }
});

if (isWatchMode) {
  console.log('Watch mode active. Press Ctrl+C to stop.');
}