const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// קביעת נתיב הדטה בייס - שימוש בנתיב מהסביבה או ברירת מחדל
let databasePath = process.env.DATABASE_PATH;

// אם אנחנו בייצור (Render) ולא הוגדר DATABASE_PATH, נשתמש בנתיב הדיסק הקבוע
if (!databasePath && process.env.NODE_ENV === 'production') {
  // בדיקה אם הדיסק הקבוע קיים
  const persistentDiskPath = '/opt/render/project/src/data';
  if (fs.existsSync(persistentDiskPath)) {
    databasePath = path.join(persistentDiskPath, 'database.sqlite');
    console.log('🔧 Using persistent disk path for production');
  } else {
    // אם הדיסק הקבוע לא קיים, נשתמש בנתיב ברירת מחדל
    databasePath = path.join(__dirname, '../database.sqlite');
    console.log('⚠️  Persistent disk not found, using default path');
  }
} else if (!databasePath) {
  // פיתוח - נתיב ברירת מחדל
  databasePath = path.join(__dirname, '../database.sqlite');
}

console.log('🔍 Database Configuration:');
console.log(`   Environment DATABASE_PATH: ${process.env.DATABASE_PATH}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   Final database path: ${databasePath}`);
console.log(`   Current working directory: ${process.cwd()}`);
console.log(`   __dirname: ${__dirname}`);

// יצירת תיקיית הנתונים אם לא קיימת
const dataDir = path.dirname(databasePath);
console.log(`📁 Data directory: ${dataDir}`);
console.log(`📁 Data directory exists: ${fs.existsSync(dataDir)}`);

if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Created data directory: ${dataDir}`);
  } catch (error) {
    console.error(`❌ Failed to create data directory: ${error.message}`);
  }
}

// בדיקה אם קובץ הדטה בייס קיים
const dbFileExists = fs.existsSync(databasePath);
console.log(`📄 Database file exists: ${dbFileExists}`);
console.log(`📄 Database file path: ${databasePath}`);

// יצירת חיבור Sequelize עם SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false // כיבוי לוגים של SQL
});

const connectDB = async () => {
  try {
    console.log('🔌 Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('✅ SQLite database connected successfully');
    
    // סנכרון המודלים עם מסד הנתונים
    console.log('🔄 Synchronizing database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');
    
    // בדיקה נוספת אחרי החיבור
    const dbFileExistsAfter = fs.existsSync(databasePath);
    console.log(`📄 Database file exists after connection: ${dbFileExistsAfter}`);
    
    if (dbFileExistsAfter) {
      const stats = fs.statSync(databasePath);
      console.log(`📊 Database file size: ${stats.size} bytes`);
      console.log(`📅 Database file last modified: ${stats.mtime}`);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('💡 Make sure the database file is accessible');
    console.error('🔍 Full error details:', error);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };
