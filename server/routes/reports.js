const express = require('express');
const ExcelJS = require('exceljs');
const { query } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// 1. Panou Live Observator / Lector (Cine este logat, cursuri accesate, durată exactă, istoric)
router.get('/observer-live', authenticateToken, authorizeRoles('lector', 'observator'), async (req, res) => {
  try {
    // Utilizatori activi în ultimele 15 minute
    const activeUsers = await query(`
      SELECT DISTINCT ON (u.id) 
        u.id, u.email, u.full_name, u.role, u.last_login,
        css.course_id, c.title as current_course_title,
        css.session_start, css.duration_seconds, css.last_heartbeat
      FROM users u
      LEFT JOIN course_study_sessions css ON u.id = css.user_id AND css.last_heartbeat > NOW() - INTERVAL '15 minutes'
      LEFT JOIN courses c ON css.course_id = c.id
      WHERE u.last_login > NOW() - INTERVAL '1 day'
      ORDER BY u.id, css.last_heartbeat DESC
    `);

    // Statistică rapidă
    const counts = await query(`
      SELECT 
        COUNT(DISTINCT id) FILTER (WHERE role = 'angajat') as total_angajati,
        COUNT(DISTINCT id) FILTER (WHERE role = 'colaborator') as total_colaboratori,
        COUNT(DISTINCT id) FILTER (WHERE role = 'lector') as total_lectori,
        COUNT(DISTINCT id) FILTER (WHERE is_blocked = true) as total_blocati
      FROM users
    `);

    res.json({
      activeNow: activeUsers.rows,
      summary: counts.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Raport Individual (Căutare după user: cursuri, timp, încercări examene, procentaje, Admis/Respins, greșeli)
router.get('/individual/:userId', authenticateToken, authorizeRoles('lector', 'observator'), async (req, res) => {
  try {
    const { userId } = req.params;

    const userRes = await query('SELECT id, email, full_name, role, is_blocked, created_at, last_login FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'Utilizatorul nu a fost găsit.' });

    // Sesiuni de curs & timp total petrecut
    const studyRes = await query(`
      SELECT c.id as course_id, c.title as course_title, c.year,
             SUM(css.duration_seconds) as total_duration_seconds,
             MIN(css.session_start) as first_accessed,
             MAX(css.last_heartbeat) as last_accessed
      FROM course_study_sessions css
      JOIN courses c ON css.course_id = c.id
      WHERE css.user_id = $1
      GROUP BY c.id, c.title, c.year
      ORDER BY last_accessed DESC
    `, [userId]);

    // Toate încercările la examene (Audit 10 ani)
    const attemptsRes = await query(`
      SELECT ea.id, ea.test_id, t.title as test_title, c.title as course_title,
             ea.score, ea.total_questions, ea.percentage, ea.status,
             ea.completed_at, ea.answers_payload
      FROM exam_attempts ea
      JOIN tests t ON ea.test_id = t.id
      JOIN courses c ON t.course_id = c.id
      WHERE ea.user_id = $1
      ORDER BY ea.completed_at DESC
    `, [userId]);

    res.json({
      user: userRes.rows[0],
      studySessions: studyRes.rows,
      examAttempts: attemptsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Statistici pe Curs / Test (Unici, Angajați vs Colaboratori, Admiși, Respinși, Rata Promovabilitate)
router.get('/course-stats/:courseId', authenticateToken, authorizeRoles('lector', 'observator'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const statsRes = await query(`
      SELECT 
        c.id as course_id, c.title, c.year, c.target_audience,
        COUNT(DISTINCT ea.user_id) as total_participants,
        COUNT(DISTINCT ea.user_id) FILTER (WHERE u.role = 'angajat') as participants_angajati,
        COUNT(DISTINCT ea.user_id) FILTER (WHERE u.role = 'colaborator') as participants_colaboratori,
        COUNT(DISTINCT ea.user_id) FILTER (WHERE ea.status = 'admis') as total_passed_users,
        COUNT(DISTINCT ea.user_id) FILTER (WHERE ea.status = 'respins' AND ea.user_id NOT IN (
          SELECT user_id FROM exam_attempts WHERE test_id = t.id AND status = 'admis'
        )) as total_failed_users,
        COUNT(ea.id) as total_attempts_made,
        ROUND(AVG(ea.percentage), 2) as avg_score_percentage
      FROM courses c
      JOIN tests t ON t.course_id = c.id
      LEFT JOIN exam_attempts ea ON ea.test_id = t.id
      LEFT JOIN users u ON ea.user_id = u.id
      WHERE c.id = $1
      GROUP BY c.id, c.title, c.year, c.target_audience, t.id
    `, [courseId]);

    res.json(statsRes.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Export Excel Raport Curs (Auditare 10 ani)
router.get('/export-excel/:courseId', authenticateToken, authorizeRoles('lector', 'observator'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const attempts = await query(`
      SELECT u.full_name, u.email, u.role,
             c.title as course_title, c.year,
             ea.score, ea.total_questions, ea.percentage, ea.status,
             ea.completed_at
      FROM exam_attempts ea
      JOIN tests t ON ea.test_id = t.id
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON ea.user_id = u.id
      WHERE c.id = $1
      ORDER BY ea.completed_at DESC
    `, [courseId]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Raport Examinare');

    worksheet.columns = [
      { header: 'Nume Complet', key: 'full_name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Rol', key: 'role', width: 15 },
      { header: 'Curs Asigurări', key: 'course_title', width: 30 },
      { header: 'An', key: 'year', width: 10 },
      { header: 'Scor (din 12)', key: 'score', width: 15 },
      { header: 'Procentaj', key: 'percentage', width: 15 },
      { header: 'Rezultat', key: 'status', width: 15 },
      { header: 'Data & Ora Examinării', key: 'completed_at', width: 25 }
    ];

    attempts.rows.forEach(r => {
      worksheet.addRow({
        full_name: r.full_name,
        email: r.email,
        role: r.role.toUpperCase(),
        course_title: r.course_title,
        year: r.year,
        score: `${r.score} / ${r.total_questions}`,
        percentage: `${r.percentage}%`,
        status: r.status.toUpperCase(),
        completed_at: new Date(r.completed_at).toLocaleString('ro-RO')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Raport_Audit_Curs_${courseId}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
