const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// קביעת נתיב הדטה בייס - שימוש בנתיב מהסביבה או ברירת מחדל
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

console.log('🔍 Database Configuration:');
console.log(`   Environment DATABASE_PATH: ${process.env.DATABASE_PATH}`);
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
