const { Sequelize } = require('sequelize');
const path = require('path');

// יצירת חיבור Sequelize עם SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
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
