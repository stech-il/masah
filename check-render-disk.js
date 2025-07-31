const fs = require('fs');
const path = require('path');

console.log('🔍 Render Disk Status Check');
console.log('==========================');

// בדיקת משתני הסביבה
console.log('\n📋 Environment Variables:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   DATABASE_PATH: ${process.env.DATABASE_PATH}`);
console.log(`   PWD: ${process.env.PWD}`);
console.log(`   CWD: ${process.cwd()}`);

// רשימת נתיבים לבדיקה
const pathsToCheck = [
  '/opt/render/project/src/data',
  '/opt/render/project/data', 
  '/opt/render/project/src',
  '/opt/render/project',
  '/opt/render/project/src/database.sqlite',
  '/opt/render/project/database.sqlite'
];

console.log('\n📁 File System Check:');
pathsToCheck.forEach(checkPath => {
  const exists = fs.existsSync(checkPath);
  const isDir = exists ? fs.statSync(checkPath).isDirectory() : false;
  const isFile = exists ? fs.statSync(checkPath).isFile() : false;
  
  console.log(`   ${checkPath}:`);
  console.log(`     Exists: ${exists}`);
  if (exists) {
    console.log(`     Type: ${isDir ? 'Directory' : isFile ? 'File' : 'Other'}`);
    
    if (isDir) {
      try {
        const contents = fs.readdirSync(checkPath);
        console.log(`     Contents: ${contents.length} items`);
        if (contents.length > 0) {
          console.log(`     Sample: ${contents.slice(0, 3).join(', ')}${contents.length > 3 ? '...' : ''}`);
        }
      } catch (error) {
        console.log(`     Error reading contents: ${error.message}`);
      }
    }
    
    if (isFile) {
      try {
        const stats = fs.statSync(checkPath);
        console.log(`     Size: ${stats.size} bytes`);
        console.log(`     Modified: ${stats.mtime}`);
      } catch (error) {
        console.log(`     Error reading file: ${error.message}`);
      }
    }
  }
});

// בדיקת הרשאות כתיבה
console.log('\n✍️  Write Permissions Test:');
const testPaths = [
  '/opt/render/project/src/data',
  '/opt/render/project/data',
  '/opt/render/project/src',
  '/opt/render/project'
];

testPaths.forEach(testPath => {
  if (fs.existsSync(testPath)) {
    try {
      const testFile = path.join(testPath, 'write-test.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`   ✅ ${testPath}: Writable`);
    } catch (error) {
      console.log(`   ❌ ${testPath}: Not writable - ${error.message}`);
    }
  } else {
    console.log(`   ❌ ${testPath}: Does not exist`);
  }
});

// המלצות
console.log('\n💡 Recommendations:');
console.log('1. Check Render dashboard for disk configuration');
console.log('2. Verify persistent disk is mounted correctly');
console.log('3. Check environment variables in Render dashboard');
console.log('4. If persistent disk is not working, consider using a different storage solution');

console.log('\n🔗 Useful URLs:');
console.log('- Render Dashboard: https://dashboard.render.com');
console.log('- Service Status: https://masah.onrender.com/status');
console.log('- Disk Debug: https://masah.onrender.com/debug/disk'); 