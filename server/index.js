const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { query } = require('./db');
const authRoutes = require('./routes/auth');
const procedureRoutes = require('./routes/procedures');
const courseRoutes = require('./routes/courses');
const testRoutes = require('./routes/tests');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const classroomRoutes = require('./routes/classroom');
const { initScheduler, triggerAnnualUpdate } = require('./services/annualScheduler');
const { sendLecturerQuestionAlert } = require('./services/emailService');
const { authenticateToken, authorizeRoles } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Configurare CORS & parsere
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Configurare Socket.io pentru Prezență Live și Chat în Timp Real
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Mapă pentru monitorizarea utilizatorilor online pe fiecare curs: courseId -> Map(socketId -> userInfo)
const courseOnlineUsers = new Map();

io.on('connection', (socket) => {
  // Alăturare într-o sală de curs
  socket.on('join_course', ({ courseId, user }) => {
    if (!courseId || !user) return;
    socket.join(`course_${courseId}`);
    socket.courseId = courseId;
    socket.user = user;

    if (!courseOnlineUsers.has(courseId)) {
      courseOnlineUsers.set(courseId, new Map());
    }
    courseOnlineUsers.get(courseId).set(socket.id, user);

    // Emite lista actualizată a cursanților și lectorilor prezenți în acest curs
    const activeList = Array.from(courseOnlineUsers.get(courseId).values());
    io.to(`course_${courseId}`).emit('course_users_updated', activeList);
  });

  // Trimitere mesaj / întrebare în chatul sălii
  socket.on('send_message', async ({ courseId, user, message, isQuestion }) => {
    if (!courseId || !user || !message) return;

    try {
      const msgRes = await query(`
        INSERT INTO chat_messages (course_id, sender_id, message, is_question, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [courseId, user.id, message, !!isQuestion, isQuestion ? 'open' : 'answered']);

      const fullMsg = {
        ...msgRes.rows[0],
        sender_name: user.fullName || user.full_name,
        sender_role: user.role
      };

      // Notificăm toți participanții din sală
      io.to(`course_${courseId}`).emit('new_message', fullMsg);

      // Dacă este întrebare și lectorul poate fi offline, verificăm dacă e vreun lector în sală
      if (isQuestion) {
        const roomUsers = courseOnlineUsers.get(courseId) ? Array.from(courseOnlineUsers.get(courseId).values()) : [];
        const isLecturerPresent = roomUsers.some(u => u.role === 'lector');

        if (!isLecturerPresent) {
          // Lectorul este offline -> Trimitem alertă prin Resend către lectori
          const courseData = await query('SELECT title FROM courses WHERE id = $1', [courseId]);
          const courseTitle = courseData.rows[0] ? courseData.rows[0].title : 'Curs Asigurări';
          const lecturers = await query(`SELECT email FROM users WHERE role = 'lector' AND is_blocked = false`);

          lecturers.rows.forEach(lec => {
            sendLecturerQuestionAlert({
              lecturerEmail: lec.email,
              studentName: user.fullName || user.full_name,
              courseTitle,
              questionText: message
            }).catch(e => console.error(e));
          });
        }
      }
    } catch (err) {
      console.error('Eroare salvare mesaj chat:', err);
    }
  });

  // Deconectare
  socket.on('disconnect', () => {
    if (socket.courseId && courseOnlineUsers.has(socket.courseId)) {
      const roomMap = courseOnlineUsers.get(socket.courseId);
      roomMap.delete(socket.id);
      if (roomMap.size === 0) {
        courseOnlineUsers.delete(socket.courseId);
      } else {
        io.to(`course_${socket.courseId}`).emit('course_users_updated', Array.from(roomMap.values()));
      }
    }
  });
});

// Rute API Backend
app.use('/api/auth', authRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/classroom', classroomRoutes);

// Rută specială: Declanșare manuală de test pentru actualizarea anuală din 1 Decembrie (Lector)
app.post('/api/annual-update/trigger', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  const { targetYear } = req.body;
  const result = await triggerAnnualUpdate(targetYear ? parseInt(targetYear) : null);
  res.json(result);
});

// Verificare sănătate server (pentru monitorizarea Render)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Servire fișiere statice Frontend (după npm run build în folderul client)
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  // Ignorăm apelurile de API inexistente pentru a nu servi HTML
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint API negăsit' });
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Pornire cron job anual
initScheduler();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server LMS Asigurări rulând pe portul ${PORT} (Node.js & Socket.io)`);
});
