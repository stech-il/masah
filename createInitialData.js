const { connectDB } = require('./config/db');
const Room = require('./models/Room');
const User = require('./models/User');
const bcrypt = require('bcrypt');

// התחבר למסד הנתונים
connectDB().then(async () => {
  try {
    console.log('✅ Connected to SQLite database');

    // יצירת חדרים ראשוניים
    const initialRooms = [
      'קבלה',
      'חדר 1',
      'חדר 2', 
      'חדר 3',
      'חדר 4',
      'חדר 5',
      'חדר 6'
    ];

    for (const roomName of initialRooms) {
      const existingRoom = await Room.findOne({ where: { name: roomName } });
      if (!existingRoom) {
        await Room.create({ name: roomName });
        console.log(`✅ Created room: ${roomName}`);
      } else {
        console.log(`ℹ️ Room already exists: ${roomName}`);
      }
    }

    // יצירת משתמשים ראשוניים
    const initialUsers = [
      {
        username: 'room1',
        password: 'room123',
        room: 'חדר 1',
        isAdmin: false
      },
      {
        username: 'room2',
        password: 'room123',
        room: 'חדר 2',
        isAdmin: false
      },
      {
        username: 'room3',
        password: 'room123',
        room: 'חדר 3',
        isAdmin: false
      },
      {
        username: 'room4',
        password: 'room123',
        room: 'חדר 4',
        isAdmin: false
      },
      {
        username: 'room5',
        password: 'room123',
        room: 'חדר 5',
        isAdmin: false
      },
      {
        username: 'room6',
        password: 'room123',
        room: 'חדר 6',
        isAdmin: false
      }
    ];

    for (const userData of initialUsers) {
      const existingUser = await User.findOne({ where: { username: userData.username } });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          username: userData.username,
          password: hashedPassword,
          room: userData.room,
          isAdmin: userData.isAdmin
        });
        console.log(`✅ Created user: ${userData.username} (${userData.room})`);
      } else {
        console.log(`ℹ️ User already exists: ${userData.username}`);
      }
    }

    console.log('\n🎉 Initial data created successfully!');
    console.log('\n📋 Available users:');
    console.log('👤 Admin: admin / admin123');
    console.log('🏥 Room 1: room1 / room123');
    console.log('🏥 Room 2: room2 / room123');
    console.log('🏥 Room 3: room3 / room123');
    console.log('🏥 Room 4: room4 / room123');
    console.log('🏥 Room 5: room5 / room123');
    console.log('🏥 Room 6: room6 / room123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating initial data:', error.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Error connecting to database:', err.message);
  process.exit(1);
}); 