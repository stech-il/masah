const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// קביעת נתיב הדטה בייס - שימוש בנתיב מהסביבה או ברירת מחדל
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

// יצירת תיקיית הנתונים אם לא קיימת
const dataDir = path.dirname(databasePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created data directory: ${dataDir}`);
}

// יצירת חיבור Sequelize עם SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false // כיבוי לוגים של SQL
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connected successfully');
    
    // סנכרון המודלים עם מסד הנתונים
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('💡 Make sure the database file is accessible');
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };
