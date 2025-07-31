const fs = require('fs');
const path = require('path');

// נתיב הדטה בייס
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
const backupDir = path.join(__dirname, 'backups');

// יצירת תיקיית גיבויים אם לא קיימת
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`📁 Created backup directory: ${backupDir}`);
}

// יצירת שם קובץ הגיבוי עם תאריך
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupPath = path.join(backupDir, `database-backup-${timestamp}.sqlite`);

// בדיקה אם קובץ הדטה בייס קיים
if (!fs.existsSync(databasePath)) {
  console.log('❌ Database file not found:', databasePath);
  process.exit(1);
}

try {
  // העתקת קובץ הדטה בייס
  fs.copyFileSync(databasePath, backupPath);
  console.log(`✅ Database backed up successfully to: ${backupPath}`);
  
  // הצגת גודל הקובץ
  const stats = fs.statSync(backupPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Backup file size: ${fileSizeInMB} MB`);
  
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
} 