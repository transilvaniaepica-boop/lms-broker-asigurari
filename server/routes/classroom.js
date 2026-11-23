const express = require('express');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Heartbeat pentru înregistrarea duratei de studiu
router.post('/heartbeat', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId necesar.' });

    // Căutăm o sesiune activă în ultimele 5 minute
    const sessionRes = await query(`
      SELECT id, duration_seconds 
      FROM course_study_sessions
      WHERE user_id = $1 AND course_id = $2 AND last_heartbeat > NOW() - INTERVAL '5 minutes'
      ORDER BY last_heartbeat DESC LIMIT 1
    `, [req.user.id, courseId]);

    if (sessionRes.rows.length > 0) {
      // Adăugăm 30 de secunde la durata sesiunii
      await query(`
        UPDATE course_study_sessions
        SET duration_seconds = duration_seconds + 30,
            last_heartbeat = NOW()
        WHERE id = $1
      `, [sessionRes.rows[0].id]);
    } else {
      // Creăm o nouă sesiune
      await query(`
        INSERT INTO course_study_sessions (user_id, course_id, duration_seconds)
        VALUES ($1, $2, 30)
      `, [req.user.id, courseId]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Istoricul mesajelor din sala de curs
router.get('/chat/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await query(`
      SELECT cm.*, u.full_name as sender_name, u.role as sender_role,
             ans.full_name as answered_by_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN users ans ON cm.answered_by = ans.id
      WHERE cm.course_id = $1
      ORDER BY cm.created_at ASC
    `, [courseId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Întrebări offline/neînchise pentru Lector
router.get('/pending-questions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'lector') {
    return res.status(403).json({ error: 'Doar lectorii pot accesa întrebările restante.' });
  }

  try {
    const result = await query(`
      SELECT cm.*, u.full_name as student_name, u.email as student_email,
             c.title as course_title, c.year
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      JOIN courses c ON cm.course_id = c.id
      WHERE cm.is_question = true AND cm.status = 'open'
      ORDER BY cm.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Răspuns dat de Lector la o întrebare din curs
router.post('/chat/answer', authenticateToken, async (req, res) => {
  if (req.user.role !== 'lector') {
    return res.status(403).json({ error: 'Doar lectorii pot marca răspunsuri oficiale.' });
  }

  try {
    const { messageId, answerText } = req.body;
    if (!messageId || !answerText) {
      return res.status(400).json({ error: 'Date incomplete.' });
    }

    const result = await query(`
      UPDATE chat_messages
      SET answer_text = $1, answered_by = $2, answered_at = NOW(), status = 'answered'
      WHERE id = $3
      RETURNING *
    `, [answerText, req.user.id, messageId]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
