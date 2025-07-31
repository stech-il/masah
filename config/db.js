const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// קביעת נתיב הדטה בייס - שימוש בנתיב מהסביבה או ברירת מחדל
let databasePath = process.env.DATABASE_PATH;

// אם אנחנו בייצור (Render) ולא הוגדר DATABASE_PATH, נשתמש בנתיב הדיסק הקבוע
if (!databasePath && process.env.NODE_ENV === 'production') {
  // רשימת נתיבים אפשריים לדיסק הקבוע
  const possiblePersistentPaths = [
    '/opt/render/project/src/data',
    '/opt/render/project/data',
    '/opt/render/project/src',
    '/opt/render/project'
  ];
  
  let foundPersistentPath = null;
  
  // בדיקה איזה נתיב קיים וניתן לכתיבה
  for (const persistentPath of possiblePersistentPaths) {
    if (fs.existsSync(persistentPath)) {
      try {
        // בדיקה אם ניתן לכתוב לנתיב
        const testFile = path.join(persistentPath, 'test-write.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        foundPersistentPath = persistentPath;
        console.log(`🔧 Found writable persistent path: ${persistentPath}`);
        break;
      } catch (error) {
        console.log(`⚠️  Path ${persistentPath} exists but not writable: ${error.message}`);
      }
    } else {
      console.log(`❌ Path ${persistentPath} does not exist`);
    }
  }
  
  if (foundPersistentPath) {
    databasePath = path.join(foundPersistentPath, 'database.sqlite');
    console.log(`🔧 Using persistent disk path: ${databasePath}`);
  } else {
    // אם הדיסק הקבוע לא קיים, נשתמש בנתיב ברירת מחדל
    databasePath = path.join(__dirname, '../database.sqlite');
    console.log('⚠️  No persistent disk found, using default path');
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
