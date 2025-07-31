const express = require('express');
const Appointment = require('../models/Appointment');
const Room = require('../models/Room');
const News = require('../models/News'); // ייבוא המודל של החדשות

const router = express.Router();

let lastUpdateTime = Date.now();
let notificationQueue = []; // רשימת ההודעות שנשלחות ללקוחות
// נתיב להצגת העמוד overview
router.get('/overview', async (req, res) => {
  try {
    const news = await News.findAll(); // שליפת כל החדשות מהמסד נתונים
    const rooms = await Room.findAll(); // נניח שגם החדרים נשלפים כאן

    res.render('overview', { rooms, news }); // העברת החדרים והחדשות לתבנית EJS
  } catch (error) {
    console.error('Error loading overview:', error);
    res.status(500).send('Error loading overview');
  }
});

module.exports = router;

// פונקציה שמחזירה את המספר הרץ הבא
async function getNextPatientNumber() {
  const lastAppointment = await Appointment.findOne({ 
    order: [['patientNumber', 'DESC']] 
  });
  let nextNumber = 100;

  if (lastAppointment && lastAppointment.patientNumber) {
    nextNumber = lastAppointment.patientNumber + 1;
    if (nextNumber > 999) {
      nextNumber = 100; // אפס את המספר ל-100 אם הגיע ל-999
    }
  }

  return nextNumber;
}

// פונקציה להוספת הודעה
function addNotification(patientNumber, roomName) {
  notificationQueue.push({ patientNumber, roomName });
}

// מסלול לטיפול בהזנת מספר הטלפון
router.post('/checkin', async (req, res) => {
  const { phoneNumber } = req.body;
  const defaultRoom = 'קבלה';

  try {
    const patientNumber = await getNextPatientNumber();

    await Appointment.create({
      phoneNumber,
      room: defaultRoom,
      status: 'waiting',
      patientNumber: patientNumber,
      isPrioritized: false
    });
    lastUpdateTime = Date.now(); // עדכון זמן אחרון שבו נעשה שינוי

    res.json({ 
      success: true, 
      queueNumber: patientNumber,
      message: 'ההרשמה הושלמה בהצלחה'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בהרשמה. אנא נסה שוב.' 
    });
  }
});

// Middleware לבדוק אם המשתמש מחובר
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// הצגת רשימת המתינים ומטופלים לפי חדרים
router.get('/', isAuthenticated, async (req, res) => {
  const rooms = [];

  try {
    const appointments = await Appointment.findAll();

    appointments.forEach(appointment => {
      let room = rooms.find(r => r.name === appointment.room);
      if (!room) {
        room = { name: appointment.room, waitingList: [], currentPatient: null };
        rooms.push(room);
      }
      if (appointment.status === 'in-process') {
        room.currentPatient = appointment;
      } else {
        room.waitingList.push(appointment);
      }
    });

    // סידור רשימת ההמתנה כך שהמטופלים מקופצים לראש התור מופיעים בראש
    rooms.forEach(room => {
      room.waitingList.sort((a, b) => {
        if (a.isPromotedToTop && !b.isPromotedToTop) return -1;
        if (!a.isPromotedToTop && b.isPromotedToTop) return 1;
        if (a.isPrioritized && !b.isPrioritized) return -1;
        if (!a.isPrioritized && b.isPrioritized) return 1;
        return a.patientNumber - b.patientNumber;
      });
    });

    res.render('index', { rooms });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).send("Error fetching appointments");
  }
});

// הצגת עמוד ה-overview עם כל החדרים והמטופלים
router.get('/overview', async (req, res) => {
  const rooms = [];

  try {
    const allRooms = await Room.findAll();
    const appointments = await Appointment.findAll();

    allRooms.forEach(roomData => {
      const room = { name: roomData.name, waitingList: [], currentPatient: null };
      rooms.push(room);
    });

    appointments.forEach(appointment => {
      let room = rooms.find(r => r.name === appointment.room);
      if (room) {
        if (appointment.status === 'in-process') {
          room.currentPatient = appointment;
                 } else if (appointment.status === 'waiting') {
          room.waitingList.push(appointment);
        }
      }
    });

    // סידור רשימת ההמתנה כך שהמטופלים מקופצים לראש התור מופיעים בראש
    rooms.forEach(room => {
      room.waitingList.sort((a, b) => {
        if (a.isPromotedToTop && !b.isPromotedToTop) return -1;
        if (!a.isPromotedToTop && b.isPromotedToTop) return 1;
        if (a.isPrioritized && !b.isPrioritized) return -1;
        if (!a.isPrioritized && b.isPrioritized) return 1;
        return a.patientNumber - b.patientNumber;
      });
    });

    res.render('overview', { rooms });
  } catch (err) {
    console.error("Error fetching appointments or rooms:", err);
    res.status(500).send("Error fetching data");
  }
});

// הצגת דף ניהול החדר למשתמש
router.get('/room', isAuthenticated, async (req, res) => {
  const roomName = req.session.user.room;
  try {
    const waitingList = await Appointment.findAll({ 
      where: { 
        room: roomName, 
        status: ['waiting', 'priority'] 
      },
      order: [['isPrioritized', 'DESC'], ['patientNumber', 'ASC']]
    });
    const currentPatient = await Appointment.findOne({ where: { room: roomName, status: 'in-process' } });
    const rooms = await Room.findAll();

    res.render('roomPanel', { user: req.session.user, waitingList, currentPatient, rooms });
  } catch (err) {
    console.error("Error fetching room data:", err);
    res.status(500).send("Error fetching room data");
  }
});

// מסלול להקפצת מטופל לתיעדוף בכל החדרים
router.post('/room/promote/:id', isAuthenticated, async (req, res) => {
  const roomName = req.session.user.room;

  try {
    const currentPatient = await Appointment.findOne({ where: { room: roomName, status: 'in-process' } });

    if (currentPatient) {
      return res.status(400).json({
        success: false,
        message: `כרגע מטופל מספר ${currentPatient.patientNumber} מטופל. אנא סיים את הטיפול או העבר חדר.`
      });
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (appointment) {
      await appointment.update({ status: 'in-process' });
    }
    lastUpdateTime = Date.now(); // עדכון זמן אחרון שבו נעשה שינוי

    // הוסף הודעה על קבלת המטופל
    addNotification(appointment.patientNumber, roomName);

    res.json({ success: true });
  } catch (err) {
    console.error("Error promoting patient:", err);
    res.status(500).send("Error promoting patient");
  }
});

// מסלול להקפצת מטופל לראש התור בתוך החדר
router.post('/room/promoteToTop/:id', isAuthenticated, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);

    if (!appointment) {
      return res.status(404).send('Appointment not found');
    }

    await appointment.update({ isPromotedToTop: true });
    lastUpdateTime = Date.now(); // עדכון זמן אחרון שבו נעשה שינוי
    res.redirect('/room');
  } catch (err) {
    console.error("Error promoting patient to top:", err);
    res.status(500).send("Error promoting patient to top");
  }
});

// מסלול לביטול תיעדוף מטופל
router.post('/room/unprioritize/:id', isAuthenticated, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (appointment) {
      await appointment.update({ isPrioritized: false });
    }
    res.redirect('/room');
  } catch (err) {
    console.error("Error unprioritizing patient:", err);
    res.status(500).send("Error unprioritizing patient");
  }
});

// מסלול להעברת מטופל לחדר אחר
router.post('/room/move/:id', isAuthenticated, async (req, res) => {
  const { newRoom } = req.body;

  try {
    const appointment = await Appointment.findByPk(req.params.id);

    if (!appointment) {
      return res.status(404).send('Appointment not found');
    }

    await appointment.update({ 
      room: newRoom,
      status: 'waiting' // שינוי הסטטוס ל"המתנה"
    });
    lastUpdateTime = Date.now(); // עדכון זמן אחרון שבו נעשה שינוי
    res.status(200).send({ success: true });
  } catch (err) {
    console.error("Error moving patient:", err);
    res.status(500).send("Error moving patient");
  }
});

// השלמת טיפול והסרת המטופל
router.post('/room/complete', isAuthenticated, async (req, res) => {
  const roomName = req.session.user.room;
  try {
    await Appointment.destroy({ where: { room: roomName, status: 'in-process' } });
    lastUpdateTime = Date.now(); // עדכון זמן אחרון שבו נעשה שינוי
    res.redirect('/room');
  } catch (err) {
    console.error("Error completing treatment:", err);
    res.status(500).send("Error completing treatment");
  }
});

// מחיקת מטופל מהרשימה
router.post('/room/delete/:id', isAuthenticated, async (req, res) => {
  try {
    await Appointment.destroy({ where: { id: req.params.id } });
    lastUpdateTime = Date.now(); // עדכון זמן אחרון שבו נעשה שינוי
    res.redirect('/room');
  } catch (err) {
    console.error("Error deleting patient:", err);
    res.status(500).send("Error deleting patient");
  }
});

// מסלול לבדיקת עדכונים
router.get('/room/checkUpdates', isAuthenticated, async (req, res) => {
  const roomName = req.session.user.room;
  try {
    const currentPatient = await Appointment.findOne({ where: { room: roomName, status: 'in-process' } });
    const waitingList = await Appointment.findAll({ where: { room: roomName, status: 'waiting' } });

    // החזרת תשובה אם יש עדכונים
    res.json({
      updated: currentPatient !== null || waitingList.length > 0
    });
  } catch (err) {
    console.error("Error checking for updates:", err);
    res.status(500).json({ error: 'Error checking for updates' });
  }
});

// מסלול לקבלת הודעות על קבלת מטופלים
router.get('/room/getNotifications', (req, res) => {
  res.json(notificationQueue);
  notificationQueue = []; // נקה את התור לאחר שליחה
});

// מסלול לקבלת נתוני החדרים
router.get('/rooms/data', async (req, res) => {
  try {
    console.log('🔄 Fetching rooms data...');
    const rooms = await Room.findAll();
    const appointments = await Appointment.findAll();
    
    console.log('📊 Found rooms:', rooms.length);
    console.log('📊 Found appointments:', appointments.length);

    const roomData = rooms.map(room => {
      const roomAppointments = appointments.filter(appt => appt.room === room.name);
      const currentPatient = roomAppointments.find(appt => appt.status === 'in-process');
      const waitingList = roomAppointments.filter(appt => appt.status === 'waiting');
      
      const roomInfo = {
        name: room.name,
        currentPatient: currentPatient ? currentPatient.patientNumber : null,
        waitingList: waitingList.map(appt => ({ patientNumber: appt.patientNumber, id: appt.id }))
      };
      
      console.log(`🏥 Room ${room.name}:`, roomInfo);
      return roomInfo;
    });

    console.log('📤 Sending room data:', roomData);
    res.json(roomData);
  } catch (error) {
    console.error('❌ Error fetching room data:', error);
    res.status(500).json({ error: 'Error fetching room data' });
  }
});

// מסלול להחזרת מטופל לתור
router.post('/room/returnToQueue/:id', isAuthenticated, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (appointment) {
      await appointment.update({ status: 'waiting' });
    }
    lastUpdateTime = Date.now(); // עדכון זמן אחרון שבו נעשה שינוי
    res.redirect('/room');
  } catch (err) {
    console.error("Error returning patient to queue:", err);
    res.status(500).send("Error returning patient to queue");
  }
});

// מסלול להעדפת מטופל בכל החדרים
router.post('/room/prioritize/:id', isAuthenticated, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (appointment) {
      await appointment.update({ isPrioritized: true });
    }
    lastUpdateTime = Date.now(); // עדכון זמן אחרון שבו נעשה שינוי
    res.redirect('/room');
  } catch (err) {
    console.error("Error prioritizing patient:", err);
    res.status(500).send("Error prioritizing patient");
  }
});
function playAudioSequence(patientNumber, roomNumber) {
  const audioFiles = [
    `/audio/patient_number.mp3`,
    `/audio/number_${patientNumber}.mp3`,
    `/audio/room_number.mp3`,
    `/audio/number_${roomNumber}.mp3`
  ];

  let index = 0;
  const audio = new Audio(audioFiles[index]);
  audio.play();

  audio.addEventListener('ended', function () {
    index++;
    if (index < audioFiles.length) {
      audio.src = audioFiles[index];
      audio.play();
    }
  });

  audio.addEventListener('error', function (e) {
    console.error('Error playing audio:', e);
  });
}
// בקובץ queue.js

router.get('/playNotification', (req, res) => {
  const { patientNumber, roomName } = req.query;
  res.render('playNotification', { patientNumber, roomName });
});
function promotePatient(patientId) {
  fetch(`/room/promote/${patientId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (!data.success) {
      showError(data.message);
    } else {
      // טען מחדש את הדף לאחר ההקפצה
      window.location.reload();
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showError('תקלה בקבלת המטופל. נסה שוב.');
  });
}

// מסלול לקבלת עמוד הזנת מספר הטלפון
router.get('/checkin', (req, res) => {
  res.render('appointment');
});
// מסלול להפניית ההכרזה לדף ההכרזה
router.get('/announce', (req, res) => {
  const { patientNumber, roomName } = req.query;
  res.render('announcement', { patientNumber, roomName });
});

router.get('/admin/news', isAuthenticated, async (req, res) => {
  const news = await News.findAll();
  res.render('manageNews', { news });
});

// הוספת חדשות
router.post('/admin/addNews', isAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  await News.create({ title, content });
  res.redirect('/admin');
});

// מחיקת חדשות
router.post('/admin/deleteNews/:id', isAuthenticated, async (req, res) => {
  await News.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/news');
});

// עריכת חדשות
router.get('/admin/editNews/:id', isAuthenticated, async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) {
      return res.status(404).send('החדשות לא נמצאו');
    }
    res.render('editNews', { news });
  } catch (error) {
    console.error('Error fetching news item:', error);
    res.status(500).send('Error fetching news item');
  }
});
// מסלול לעדכון חדשות
router.post('/admin/editNews/:id', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    const news = await News.findByPk(req.params.id);
    if (news) {
      await news.update({ title, content });
    }
    res.redirect('/admin');
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).send('Error updating news');
  }
});



module.exports = router;
