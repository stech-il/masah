const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Room = require('./models/Room');
const queueRoutes = require('./routes/queue'); // ייבוא מסלול queue
const authRoutes = require('./routes/auth'); // ייבוא מסלול auth
const adminRoutes = require('./routes/admin'); // ייבוא מסלול admin

const app = express();

// התחברות למסד הנתונים ויצירת משתמש מנהל ראשון
async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // בדוק אם יש משתמשים במסד הנתונים
    const usersCount = await User.count();
    console.log(`📊 Found ${usersCount} users in database`);
    
    if (usersCount === 0) {
      console.log('👤 Creating initial admin user...');
      
      // צור סיסמה מוצפנת
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // צור משתמש מנהל ראשון
      await User.create({
        username: 'admin',
        password: hashedPassword,
        room: 'admin_room',
        isAdmin: true
      });
      
      console.log('✅ Initial admin user created successfully!');
      console.log('👤 Username: admin');
      console.log('🔑 Password: admin123');
      
      // צור חדרים ראשוניים
      console.log('🏥 Creating initial rooms...');
      const rooms = [
        { name: 'חדר 1' },
        { name: 'חדר 2' },
        { name: 'חדר 3' }
      ];
      
      for (const roomData of rooms) {
        await Room.create(roomData);
        console.log(`✅ Created room: ${roomData.name}`);
      }
      
      // צור משתמשי חדר
      console.log('👥 Creating room users...');
      const roomUsers = [
        { username: 'room1', password: 'room123', room: 'חדר 1', isAdmin: false },
        { username: 'room2', password: 'room123', room: 'חדר 2', isAdmin: false },
        { username: 'room3', password: 'room123', room: 'חדר 3', isAdmin: false }
      ];
      
      for (const userData of roomUsers) {
        const hashedUserPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          username: userData.username,
          password: hashedUserPassword,
          room: userData.room,
          isAdmin: userData.isAdmin
        });
        console.log(`✅ Created user: ${userData.username} for ${userData.room}`);
      }
      
      console.log('🎉 Database initialization completed successfully!');
      
      // בדיקה סופית
      const finalUsersCount = await User.count();
      const finalRoomsCount = await Room.count();
      console.log(`📊 Final database state: ${finalUsersCount} users, ${finalRoomsCount} rooms`);
      
    } else {
      console.log('✅ Database already has users, skipping initialization');
      
      // בדיקת מצב הדטה בייס
      const roomsCount = await Room.count();
      const adminUsers = await User.findAll({ where: { isAdmin: true } });
      const roomUsers = await User.findAll({ where: { isAdmin: false } });
      
      console.log(`📊 Database status: ${usersCount} users, ${roomsCount} rooms`);
      console.log(`👑 Admin users: ${adminUsers.length}`);
      console.log(`👥 Room users: ${roomUsers.length}`);
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.error('🔍 Full error details:', error);
    
    // נסה שוב אחרי 5 שניות
    console.log('🔄 Retrying database initialization in 5 seconds...');
    setTimeout(initializeDatabase, 5000);
  }
}

// הפעל את האתחול
initializeDatabase();

// הגדרת מנוע תבניות
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הגדרת session עם תמיכה בייצור
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: true, // שינוי ל-true
  saveUninitialized: true, // שינוי ל-true
  cookie: {
    secure: false, // שינוי ל-false כדי שיעבוד גם ב-HTTP
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 שעות
  }
};

// אם אנחנו בייצור, השתמש ב-Redis או store אחר
if (process.env.NODE_ENV === 'production') {
  // בינתיים נשתמש ב-MemoryStore אבל עם אזהרה
  console.log('⚠️  Warning: Using MemoryStore in production. Consider using Redis or another persistent store.');
  console.log('🔧 Session config:', sessionConfig);
} else {
  console.log('✅ Using MemoryStore for development');
}

app.use(session(sessionConfig));

// Route פשוט לבדיקה
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Route לבדיקת מצב המערכת
app.get('/status', async (req, res) => {
  try {
    const usersCount = await User.count();
    const roomsCount = await Room.count();
    const adminUsers = await User.findAll({ where: { isAdmin: true } });
    const roomUsers = await User.findAll({ where: { isAdmin: false } });
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        users: usersCount,
        rooms: roomsCount,
        adminUsers: adminUsers.length,
        roomUsers: roomUsers.length
      },
      users: {
        admin: adminUsers.map(u => ({ username: u.username, room: u.room })),
        rooms: roomUsers.map(u => ({ username: u.username, room: u.room }))
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route לבדיקת מצב הדיסק והדטה בייס
app.get('/debug/disk', (req, res) => {
  let databasePath = process.env.DATABASE_PATH;
  
  // אם אנחנו בייצור (Render) ולא הוגדר DATABASE_PATH, נשתמש בנתיב הדיסק הקבוע
  if (!databasePath && process.env.NODE_ENV === 'production') {
    const persistentDiskPath = '/opt/render/project/src/data';
    if (fs.existsSync(persistentDiskPath)) {
      databasePath = path.join(persistentDiskPath, 'database.sqlite');
    } else {
      databasePath = path.join(__dirname, '../database.sqlite');
    }
  } else if (!databasePath) {
    databasePath = path.join(__dirname, '../database.sqlite');
  }
  
  const dataDir = path.dirname(databasePath);
  const persistentDiskPath = '/opt/render/project/src/data';
  
  try {
    const diskInfo = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_PATH: process.env.DATABASE_PATH,
        PWD: process.env.PWD,
        CWD: process.cwd()
      },
      paths: {
        databasePath: databasePath,
        dataDir: dataDir,
        __dirname: __dirname,
        persistentDiskPath: persistentDiskPath
      },
      fileSystem: {
        dataDirExists: fs.existsSync(dataDir),
        databaseFileExists: fs.existsSync(databasePath),
        persistentDiskExists: fs.existsSync(persistentDiskPath),
        canWriteToDataDir: false,
        canWriteToDatabase: false,
        canWriteToPersistentDisk: false
      },
      permissions: {}
    };
    
    // בדיקת הרשאות כתיבה
    try {
      const testFile = path.join(dataDir, 'test-write.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      diskInfo.fileSystem.canWriteToDataDir = true;
    } catch (error) {
      diskInfo.fileSystem.canWriteToDataDir = false;
      diskInfo.permissions.dataDirError = error.message;
    }
    
    try {
      const testFile = path.join(path.dirname(databasePath), 'test-db-write.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      diskInfo.fileSystem.canWriteToDatabase = true;
    } catch (error) {
      diskInfo.fileSystem.canWriteToDatabase = false;
      diskInfo.permissions.databaseError = error.message;
    }
    
    try {
      const testFile = path.join(persistentDiskPath, 'test-persistent-write.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      diskInfo.fileSystem.canWriteToPersistentDisk = true;
    } catch (error) {
      diskInfo.fileSystem.canWriteToPersistentDisk = false;
      diskInfo.permissions.persistentDiskError = error.message;
    }
    
    // מידע על קובץ הדטה בייס אם קיים
    if (fs.existsSync(databasePath)) {
      const stats = fs.statSync(databasePath);
      diskInfo.databaseFile = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
      };
    }
    
    // מידע על תיקיית הדיסק הקבוע אם קיימת
    if (fs.existsSync(persistentDiskPath)) {
      try {
        const diskStats = fs.statSync(persistentDiskPath);
        const diskContents = fs.readdirSync(persistentDiskPath);
        diskInfo.persistentDisk = {
          exists: true,
          isDirectory: diskStats.isDirectory(),
          permissions: diskStats.mode,
          contents: diskContents
        };
      } catch (error) {
        diskInfo.persistentDisk = {
          exists: true,
          error: error.message
        };
      }
    }
    
    res.json(diskInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route לבדיקת מיקום קבצים (לבדיקה בלבד)
app.get('/debug/files', (req, res) => {
  const debugInfo = {
    __dirname: __dirname,
    currentWorkingDirectory: process.cwd(),
    publicPath: path.join(__dirname, 'public'),
    cssPath: path.join(__dirname, 'public/css'),
    styleCssExists: fs.existsSync(path.join(__dirname, 'public/css/style.css')),
    publicStyleCssExists: fs.existsSync(path.join(__dirname, 'public/styles.css')),
    rootStyleCssExists: fs.existsSync(path.join(__dirname, 'styles.css')),
    publicDirContents: fs.readdirSync(path.join(__dirname, 'public')),
    cssDirContents: fs.existsSync(path.join(__dirname, 'public/css')) ? fs.readdirSync(path.join(__dirname, 'public/css')) : 'CSS directory not found'
  };
  
  res.json(debugInfo);
});

// Route ספציפי לקבצי CSS - מנסה מספר נתיבים
app.get('/css/:filename', (req, res) => {
  const filename = req.params.filename;
  const possiblePaths = [
    path.join(__dirname, 'public/css', filename),
    path.join(__dirname, 'public', filename),
    path.join(__dirname, filename)
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`✅ Found CSS file at: ${filePath}`);
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      res.sendFile(filePath);
      return;
    }
  }
  
  console.log(`❌ CSS file not found: ${filename}`);
  console.log(`🔍 Searched paths:`, possiblePaths);
  res.status(404).send('CSS file not found');
});

// הגדרת קבצים סטטיים - חשוב שזה יהיה לפני המסלולים
app.use('/css', express.static(path.join(__dirname, 'public/css'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// נתיב נוסף לקבצי CSS
app.use('/css', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

app.use('/js', express.static(path.join(__dirname, 'public/js'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

app.use('/images', express.static(path.join(__dirname, 'public/images')));

// הגדרת התיקייה 'audio' כתיקייה סטטית
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// הגדרת קבצים סטטיים כלליים
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.woff')) {
      res.setHeader('Content-Type', 'font/woff');
    } else if (filePath.endsWith('.woff2')) {
      res.setHeader('Content-Type', 'font/woff2');
    } else if (filePath.endsWith('.ttf')) {
      res.setHeader('Content-Type', 'font/ttf');
    }
  }
}));

// הגדרת המסלולים
app.use('/', authRoutes);
app.use('/', queueRoutes); // ודא שהמסלול נוסף כאן
app.use('/', adminRoutes);

// הפעלת השרת תתבצע ב-server.js

module.exports = app;
