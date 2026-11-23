const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { query } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { generateCourseFromProcedure } = require('../services/aiService');

const router = express.Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

// Obține lista anilor existenți
router.get('/years', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT year FROM procedures 
      UNION 
      SELECT DISTINCT year FROM courses 
      ORDER BY year DESC
    `);
    const years = result.rows.map(r => r.year);
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) {
      years.unshift(currentYear);
    }
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obține procedurile (cu filtru pe an și target_audience)
router.get('/', authenticateToken, authorizeRoles('lector', 'observator'), async (req, res) => {
  const { year, targetAudience } = req.query;
  try {
    let sql = 'SELECT * FROM procedures WHERE 1=1';
    const params = [];

    if (year) {
      params.push(year);
      sql += ` AND year = $${params.length}`;
    }
    if (targetAudience) {
      params.push(targetAudience);
      sql += ` AND target_audience = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pasul 1 - Încărcare & Generare Curs (Lector)
router.post('/upload', authenticateToken, authorizeRoles('lector'), upload.single('file'), async (req, res) => {
  try {
    const { title, year, targetAudience, manualContent } = req.body;
    let rawContent = manualContent || '';

    if (!title || !targetAudience) {
      return res.status(400).json({ error: 'Titlul și publicul țintă sunt obligatorii.' });
    }

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        rawContent = parsed.text;
      } else {
        rawContent = req.file.buffer.toString('utf-8');
      }
    }

    if (!rawContent || rawContent.trim().length === 0) {
      return res.status(400).json({ error: 'Conținutul procedurii este gol. Încărcați un fișier valid sau introduceți textul.' });
    }

    const procedureYear = parseInt(year) || new Date().getFullYear();

    // 1. Salvare Procedură în DB
    const procRes = await query(`
      INSERT INTO procedures (title, year, target_audience, original_file_path, raw_content, status, created_by)
      VALUES ($1, $2, $3, $4, $5, 'draft', $6)
      RETURNING *
    `, [title, procedureYear, targetAudience, req.file ? req.file.originalname : 'manual_entry', rawContent, req.user.id]);

    const procedure = procRes.rows[0];

    // 2. Apel AI pentru generare Curs structurat pe module
    const aiCourseData = await generateCourseFromProcedure({
      title,
      rawContent,
      targetAudience
    });

    // 3. Salvare Curs generat în draft (editabil)
    const courseRes = await query(`
      INSERT INTO courses (procedure_id, title, year, target_audience, content, modules_json, status, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', false, $7)
      RETURNING *
    `, [procedure.id, title, procedureYear, targetAudience, aiCourseData.summary, JSON.stringify(aiCourseData.modules), req.user.id]);

    await logAudit({
      userId: req.user.id,
      action: 'PROCEDURE_AND_COURSE_GENERATED',
      targetEntity: 'procedures',
      targetId: procedure.id,
      details: { title, year: procedureYear, targetAudience, courseId: courseRes.rows[0].id }
    });

    res.json({
      message: 'Procedura a fost procesată și cursul a fost generat cu succes!',
      procedure,
      course: courseRes.rows[0]
    });
  } catch (err) {
    console.error('Eroare încărcare procedură:', err);
    res.status(500).json({ error: err.message || 'Eroare la procesarea procedurii.' });
  }
});

module.exports = router;
