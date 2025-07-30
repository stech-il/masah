const http = require('http'); // שינוי מ-https ל-http
const app = require('./app');
const socketIo = require('socket.io'); // שימוש ב-Socket.IO

// יצירת שרת HTTP
const server = http.createServer(app);
const io = socketIo(server); // חיבור ה-Socket.IO לשרת ה-HTTP

let queue = []; // אחסון התורים בזיכרון
let rooms = {}; // אחסון החדרים והתורים שלהם בזיכרון

// קביעת פורט ברירת מחדל
const PORT = process.env.PORT || 8080;

// הפעלת השרת HTTP
server.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on port ${PORT}`);
  console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
  console.log(`🔧 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🏥 Room panel: http://localhost:${PORT}/room`);
});

// טיפול בשגיאות שרת
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// טיפול בסגירת שרת
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// חיבור ל-Socket.IO
io.on('connection', (socket) => {
  console.log('👤 New user connected:', socket.id);
  
  const userRoom = socket.handshake.query.room;

  if (!rooms[userRoom]) {
    rooms[userRoom] = [];
  }

  // שליחת התור הנוכחי ללקוח המחובר
  socket.emit('updateQueue', queue);
  socket.emit('updateRoom', { room: userRoom, tickets: rooms[userRoom] });

  // קבלת תור חדש
  socket.on('newTicket', (ticket) => {
    queue.push(ticket);
    io.emit('updateQueue', queue); // עדכון כל הלקוחות עם התור החדש
  });

  // העברת תור לחדר
  socket.on('moveTicket', (data) => {
    const { ticketId, room } = data;
    const ticketIndex = queue.findIndex((ticket) => ticket.id === ticketId);

    if (ticketIndex !== -1) {
      if (!rooms[room]) {
        rooms[room] = [];
      }

      // ווידוא שאין תור אחר בתהליך בחדר הזה
      if (rooms[room].some(ticket => ticket.status === 'in-process')) {
        socket.emit('error', 'יש כבר תור בתהליך בחדר הזה.');
        return;
      }

      const ticket = queue[ticketIndex];
      ticket.status = 'in-process';
      rooms[room].push(ticket);
      queue.splice(ticketIndex, 1); // הסרת התור מהרשימה הכללית
      io.emit('updateQueue', queue);
      io.emit('updateRoom', { room, tickets: rooms[room] });
    }
  });

  // טיפול בניתוק המשתמש
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});
