const { connectDB } = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcrypt');

// התחבר למסד הנתונים
connectDB().then(async () => {
  try {
    console.log('✅ Connected to SQLite database');

    // בדוק אם כבר קיים מנהל
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      process.exit(0);
    }

    // צור סיסמה מוצפנת
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // צור משתמש חדש
    await User.create({
      username: 'admin',
      password: hashedPassword,
      room: 'admin_room',
      isAdmin: true
    });

    console.log('✅ First admin user created successfully!');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Error connecting to database:', err.message);
  process.exit(1);
});
