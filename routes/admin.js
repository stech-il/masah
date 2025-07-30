const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Room = require('../models/Room');
const News = require('../models/News'); // ייבוא המודל של החדשות
const router = express.Router();

// Middleware לבדוק אם המשתמש מחובר ומנהל
function isAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.redirect('/login');
  }
}

// דף הפאנל לניהול משתמשים, חדרים וחדשות
router.get('/admin', isAuthenticated, async (req, res) => {
  try {
    const users = await User.findAll();
    const rooms = await Room.findAll();
    const news = await News.findAll(); // שליפת כל החדשות מהמסד נתונים
    
    res.render('adminPanel', { 
      user: req.session.user, 
      users, 
      rooms, 
      news // העברת החדשות לתבנית EJS
    });
  } catch (error) {
    console.error('Error loading admin panel:', error);
    res.status(500).send('Error loading admin panel');
  }
});

// הוספת חדר חדש
router.post('/admin/addRoom', isAuthenticated, async (req, res) => {
  const { roomName } = req.body;

  try {
    const existingRoom = await Room.findOne({ where: { name: roomName } });
    if (existingRoom) {
      return res.status(400).send('Room already exists');
    }

    await Room.create({ name: roomName });
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding room');
  }
});

// הוספת משתמש חדש
router.post('/admin/addUser', isAuthenticated, async (req, res) => {
  try {
    const { username, password, room, isAdmin } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hashedPassword,
      room,
      isAdmin: isAdmin ? true : false
    });

    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// עריכת משתמש קיים
router.get('/admin/editUser/:id', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    const rooms = await Room.findAll(); // שליפת החדרים ממסד הנתונים
    res.render('editUser', { user, rooms }); // העברת המשתמש והחדרים לתבנית
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.post('/admin/editUser/:id', isAuthenticated, async (req, res) => {
  try {
    const { username, password, room, isAdmin } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    await user.update({
      username,
      room,
      isAdmin: isAdmin ? true : false
    });

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({ password: hashedPassword });
    }

    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// מחיקת משתמש
router.post('/admin/deleteUser/:id', isAuthenticated, async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// מחיקת חדר
router.post('/admin/deleteRoom/:id', isAuthenticated, async (req, res) => {
  try {
    await Room.destroy({ where: { id: req.params.id } });
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// הוספת חדשות
router.post('/admin/addNews', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    await News.create({ title, content });
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding news');
  }
});

// עריכת חדשות
router.get('/admin/editNews/:id', isAuthenticated, async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) {
      return res.status(404).send('News not found');
    }
    res.render('editNews', { news });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.post('/admin/editNews/:id', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    const news = await News.findByPk(req.params.id);

    if (!news) {
      return res.status(404).send('News not found');
    }

    await news.update({ title, content });
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// מחיקת חדשות
router.post('/admin/deleteNews/:id', isAuthenticated, async (req, res) => {
  try {
    await News.destroy({ where: { id: req.params.id } });
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
