const express = require('express');
const session = require('express-session');
const path = require('path');
const { connectDB } = require('./config/db');
const queueRoutes = require('./routes/queue'); // ייבוא מסלול queue
const authRoutes = require('./routes/auth'); // ייבוא מסלול auth
const adminRoutes = require('./routes/admin'); // ייבוא מסלול admin

const app = express();

// התחברות למסד הנתונים
connectDB();

// הגדרת מנוע תבניות
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware לטיפול ב-MIME types
app.use((req, res, next) => {
  if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  } else if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.path.endsWith('.png')) {
    res.setHeader('Content-Type', 'image/png');
  } else if (req.path.endsWith('.jpg') || req.path.endsWith('.jpeg')) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (req.path.endsWith('.gif')) {
    res.setHeader('Content-Type', 'image/gif');
  } else if (req.path.endsWith('.svg')) {
    res.setHeader('Content-Type', 'image/svg+xml');
  } else if (req.path.endsWith('.woff')) {
    res.setHeader('Content-Type', 'font/woff');
  } else if (req.path.endsWith('.woff2')) {
    res.setHeader('Content-Type', 'font/woff2');
  } else if (req.path.endsWith('.ttf')) {
    res.setHeader('Content-Type', 'font/ttf');
  }
  next();
});

// הגדרת session עם תמיכה בייצור
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS בלבד בייצור
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 שעות
  }
};

// אם אנחנו בייצור, השתמש ב-Redis או store אחר
if (process.env.NODE_ENV === 'production') {
  // בינתיים נשתמש ב-MemoryStore אבל עם אזהרה
  console.log('⚠️  Warning: Using MemoryStore in production. Consider using Redis or another persistent store.');
} else {
  console.log('✅ Using MemoryStore for development');
}

app.use(session(sessionConfig));

// הגדרת קבצים סטטיים - חשוב שזה יהיה לפני המסלולים
app.use('/css', express.static(path.join(__dirname, 'public/css'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.use('/js', express.static(path.join(__dirname, 'public/js'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use('/images', express.static(path.join(__dirname, 'public/images')));

// הגדרת התיקייה 'audio' כתיקייה סטטית
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// הגדרת קבצים סטטיים כלליים
app.use(express.static(path.join(__dirname, 'public')));

// הגדרת המסלולים
app.use('/', authRoutes);
app.use('/', queueRoutes); // ודא שהמסלול נוסף כאן
app.use('/', adminRoutes);

// הפעלת השרת תתבצע ב-server.js

module.exports = app;
