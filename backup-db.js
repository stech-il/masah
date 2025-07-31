const fs = require('fs');
const path = require('path');

// קביעת נתיב הדטה בייס
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
const backupDir = path.join(__dirname, 'backups');

console.log('🔄 Starting database backup...');
console.log(`📄 Source database: ${databasePath}`);
console.log(`📁 Backup directory: ${backupDir}`);

// בדיקה אם קובץ הדטה בייס קיים
if (!fs.existsSync(databasePath)) {
  console.error('❌ Database file not found!');
  console.error(`🔍 Expected path: ${databasePath}`);
  process.exit(1);
}

// יצירת תיקיית גיבוי אם לא קיימת
if (!fs.existsSync(backupDir)) {
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`✅ Created backup directory: ${backupDir}`);
  } catch (error) {
    console.error(`❌ Failed to create backup directory: ${error.message}`);
    process.exit(1);
  }
}

// יצירת שם קובץ הגיבוי עם תאריך ושעה
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFileName = `database-backup-${timestamp}.sqlite`;
const backupPath = path.join(backupDir, backupFileName);

try {
  // העתקת קובץ הדטה בייס
  fs.copyFileSync(databasePath, backupPath);
  
  // בדיקת הקובץ המועתק
  const sourceStats = fs.statSync(databasePath);
  const backupStats = fs.statSync(backupPath);
  
  console.log('✅ Database backup completed successfully!');
  console.log(`📄 Backup file: ${backupFileName}`);
  console.log(`📊 Original size: ${sourceStats.size} bytes`);
  console.log(`📊 Backup size: ${backupStats.size} bytes`);
  console.log(`📅 Backup created: ${backupStats.birthtime}`);
  
  // הצגת רשימת כל הגיבויים
  const backupFiles = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.sqlite'))
    .sort()
    .reverse();
  
  console.log(`📋 Total backups: ${backupFiles.length}`);
  if (backupFiles.length > 0) {
    console.log('📋 Recent backups:');
    backupFiles.slice(0, 5).forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   ${file} (${stats.size} bytes, ${stats.birthtime.toISOString()})`);
    });
  }
  
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
} 
} 