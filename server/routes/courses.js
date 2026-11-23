const express = require('express');
const { query } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { generateExamQuestions } = require('../services/aiService');

const router = express.Router();

// Obținerea cursurilor în funcție de rol și an
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { year } = req.query;
    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    // Cursanții (Angajat / Colaborator) văd strict categoria lor și doar cursurile active
    if (req.user.role === 'angajat') {
      params.push('angajat');
      sql += ` AND target_audience = $${params.length} AND is_active = true`;
    } else if (req.user.role === 'colaborator') {
      params.push('colaborator');
      sql += ` AND target_audience = $${params.length} AND is_active = true`;
    }

    if (year) {
      params.push(year);
      sql += ` AND year = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalii curs complet cu testul asociat
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const courseRes = await query('SELECT * FROM courses WHERE id = $1', [courseId]);

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cursul nu a fost găsit.' });
    }

    const course = courseRes.rows[0];

    // Verificare permisiuni rol
    if ((req.user.role === 'angajat' && course.target_audience !== 'angajat') ||
        (req.user.role === 'colaborator' && course.target_audience !== 'colaborator')) {
      return res.status(403).json({ error: 'Nu aveți acces la acest curs (flux dedicat altei categorii).' });
    }

    // Obținem testul asociat (dacă există)
    const testRes = await query('SELECT * FROM tests WHERE course_id = $1', [courseId]);
    const test = testRes.rows.length > 0 ? testRes.rows[0] : null;

    res.json({ course, test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pasul 2: Editare conținut curs (Lector)
router.put('/:id', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const { title, content, modules_json } = req.body;
    const courseId = req.params.id;

    const result = await query(`
      UPDATE courses
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          modules_json = COALESCE($3, modules_json)
      WHERE id = $4
      RETURNING *
    `, [title, content, modules_json ? JSON.stringify(modules_json) : null, courseId]);

    await logAudit({
      userId: req.user.id,
      action: 'COURSE_UPDATED',
      targetEntity: 'courses',
      targetId: courseId,
      details: { title }
    });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pasul 2: Validare Curs (Lector apasă butonul "Validează Cursul")
router.post('/:id/validate', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const result = await query(`
      UPDATE courses
      SET status = 'validated', validated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [courseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cursul nu a fost găsit.' });
    }

    await logAudit({
      userId: req.user.id,
      action: 'COURSE_VALIDATED',
      targetEntity: 'courses',
      targetId: courseId
    });

    res.json({ message: 'Cursul a fost validat cu succes! Acum puteți genera testul de examinare.', course: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pasul 3: Generare Test (12 Întrebări) din cursul validat
router.post('/:id/generate-test', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const courseRes = await query('SELECT * FROM courses WHERE id = $1', [courseId]);

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cursul nu există.' });
    }

    const course = courseRes.rows[0];
    if (course.status !== 'validated' && course.status !== 'active') {
      return res.status(400).json({ error: 'Trebuie să validați cursul înainte de a genera testul de examinare!' });
    }

    // Compunem textul complet al modulelor pentru AI
    const modulesText = (course.modules_json || []).map(m => `${m.title}\n${m.content_markdown}`).join('\n\n');
    const fullContent = `${course.title}\n${course.content}\n\n${modulesText}`;

    // Apel AI pentru generare 12 întrebări ușoare
    const questions = await generateExamQuestions({
      courseTitle: course.title,
      courseContent: fullContent,
      targetAudience: course.target_audience
    });

    // Verificăm dacă există deja un test asociat cursului sau creăm unul nou
    let testRes = await query('SELECT * FROM tests WHERE course_id = $1', [courseId]);
    let test;

    if (testRes.rows.length > 0) {
      test = testRes.rows[0];
      // Ștergem întrebările vechi din draft
      await query('DELETE FROM questions WHERE test_id = $1', [test.id]);
    } else {
      const newTest = await query(`
        INSERT INTO tests (course_id, title, pass_percentage, min_pass_score, total_questions, status, is_active)
        VALUES ($1, $2, 70.00, 9, 12, 'draft', false)
        RETURNING *
      `, [courseId, `Examen: ${course.title}`]);
      test = newTest.rows[0];
    }

    // Inserăm cele 12 întrebări
    for (const q of questions) {
      await query(`
        INSERT INTO questions (test_id, question_text, options, correct_answer_index, explanation)
        VALUES ($1, $2, $3, $4, $5)
      `, [test.id, q.question_text, JSON.stringify(q.options), q.correct_answer_index, q.explanation]);
    }

    await logAudit({
      userId: req.user.id,
      action: 'EXAM_TEST_GENERATED',
      targetEntity: 'tests',
      targetId: test.id,
      details: { courseId, totalQuestions: questions.length }
    });

    res.json({ message: 'Cele 12 întrebări de examinare au fost generate cu succes!', testId: test.id });
  } catch (err) {
    console.error('Eroare generare test:', err);
    res.status(500).json({ error: err.message });
  }
});

// Pasul 3: Validare Test & Publicare Curs (Înlocuiește automat vechiul curs din anul precedent)
router.post('/:id/publish', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const courseRes = await query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Cursul nu a fost găsit.' });

    const currentCourse = courseRes.rows[0];

    // Găsim testul
    const testRes = await query('SELECT * FROM tests WHERE course_id = $1', [courseId]);
    if (testRes.rows.length === 0) {
      return res.status(400).json({ error: 'Nu puteți publica un curs fără test de examinare.' });
    }
    const test = testRes.rows[0];

    // Regula de înlocuire automată a cursurilor din anii precedenți pentru aceeași audiență și titlu/domeniu:
    // Trecem cursurile anterioare active pe 'archived' și is_active = false
    await query(`
      UPDATE courses
      SET is_active = false, status = 'archived'
      WHERE target_audience = $1 AND id != $2 AND year < $3 AND is_active = true
    `, [currentCourse.target_audience, courseId, currentCourse.year]);

    // Activăm cursul curent
    await query(`
      UPDATE courses
      SET is_active = true, status = 'active', validated_at = NOW()
      WHERE id = $1
    `, [courseId]);

    // Activăm testul curent
    await query(`
      UPDATE tests
      SET is_active = true, status = 'active', validated_at = NOW()
      WHERE id = $1
    `, [test.id]);

    await logAudit({
      userId: req.user.id,
      action: 'COURSE_AND_TEST_PUBLISHED',
      targetEntity: 'courses',
      targetId: courseId,
      details: { audience: currentCourse.target_audience, year: currentCourse.year }
    });

    res.json({ message: `Cursul "${currentCourse.title}" și testul aferent sunt acum active pentru ${currentCourse.target_audience}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ștergere Curs (DOAR Lectorul are dreptul să șteargă cursuri)
router.delete('/:id', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const courseRes = await query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cursul nu a fost găsit.' });
    }

    const course = courseRes.rows[0];

    // Ștergem sesiunile asociate, mesajele chat și testul (sau cascade prin DB)
    await query('DELETE FROM courses WHERE id = $1', [courseId]);

    await logAudit({
      userId: req.user.id,
      action: 'COURSE_DELETED',
      targetEntity: 'courses',
      targetId: courseId,
      details: { title: course.title, year: course.year, audience: course.target_audience }
    });

    res.json({ message: `Cursul "${course.title}" a fost șters cu succes de către Lector.` });
  } catch (err) {
    console.error('Eroare la ștergerea cursului:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
