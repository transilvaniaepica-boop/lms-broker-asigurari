const express = require('express');
const { query } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Obținere întrebări test pentru Lector (include răspunsurile corecte pentru revizuire/editare)
router.get('/:testId/lector-questions', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const { testId } = req.params;
    const questionsRes = await query('SELECT * FROM questions WHERE test_id = $1 ORDER BY id ASC', [testId]);
    res.json(questionsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editare întrebare de către Lector
router.put('/questions/:questionId', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const { questionId } = req.params;
    const { question_text, options, correct_answer_index, explanation } = req.body;

    const result = await query(`
      UPDATE questions
      SET question_text = COALESCE($1, question_text),
          options = COALESCE($2, options),
          correct_answer_index = COALESCE($3, correct_answer_index),
          explanation = COALESCE($4, explanation)
      WHERE id = $5
      RETURNING *
    `, [question_text, options ? JSON.stringify(options) : null, correct_answer_index, explanation, questionId]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Începere Examen de către Cursant (Returnează întrebările amestecate FĂRĂ răspunsul corect)
router.get('/:testId/start', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;
    const testRes = await query(`
      SELECT t.*, c.target_audience, c.title as course_title 
      FROM tests t 
      JOIN courses c ON t.course_id = c.id 
      WHERE t.id = $1
    `, [testId]);

    if (testRes.rows.length === 0) {
      return res.status(404).json({ error: 'Testul nu a fost găsit.' });
    }

    const test = testRes.rows[0];

    // Verificare categorie rol
    if ((req.user.role === 'angajat' && test.target_audience !== 'angajat') ||
        (req.user.role === 'colaborator' && test.target_audience !== 'colaborator')) {
      return res.status(403).json({ error: 'Nu aveți dreptul să susțineți acest test.' });
    }

    const questionsRes = await query('SELECT id, question_text, options FROM questions WHERE test_id = $1', [testId]);
    
    // Amestecăm ordinea întrebărilor pentru fiecare încercare
    const shuffled = [...questionsRes.rows].sort(() => Math.random() - 0.5);

    res.json({
      test: {
        id: test.id,
        title: test.title,
        course_title: test.course_title,
        total_questions: test.total_questions,
        pass_percentage: test.pass_percentage,
        min_pass_score: test.min_pass_score
      },
      questions: shuffled
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trimitere Răspunsuri & Evaluare Automată (Prag 70%, 9/12, Retenție 10 ani)
router.post('/:testId/submit', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body; // Map: { [questionId]: selectedIndex }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Răspunsurile nu au fost transmise.' });
    }

    const questionsRes = await query('SELECT * FROM questions WHERE test_id = $1', [testId]);
    const questions = questionsRes.rows;

    let correctCount = 0;
    const detailedAuditAnswers = [];

    questions.forEach(q => {
      const selectedIndex = answers[q.id];
      const isCorrect = selectedIndex !== undefined && parseInt(selectedIndex) === q.correct_answer_index;
      if (isCorrect) correctCount++;

      detailedAuditAnswers.push({
        questionId: q.id,
        questionText: q.question_text,
        options: q.options,
        userSelected: selectedIndex !== undefined ? parseInt(selectedIndex) : null,
        correctIndex: q.correct_answer_index,
        isCorrect,
        explanation: q.explanation
      });
    });

    const total = questions.length || 12;
    const percentage = Number(((correctCount / total) * 100).toFixed(2));
    const isPassed = percentage >= 70.00; // Prag minim 70% (min 9 din 12)
    const status = isPassed ? 'admis' : 'respins';

    // Salvare permanentă în baza de date (Audit 10 ani, chiar și încercările picate)
    const attemptRes = await query(`
      INSERT INTO exam_attempts (user_id, test_id, score, total_questions, percentage, status, answers_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.user.id, testId, correctCount, total, percentage, status, JSON.stringify(detailedAuditAnswers)]);

    await logAudit({
      userId: req.user.id,
      action: 'EXAM_ATTEMPT_SUBMITTED',
      targetEntity: 'exam_attempts',
      targetId: attemptRes.rows[0].id,
      details: { score: correctCount, percentage, status }
    });

    res.json({
      attemptId: attemptRes.rows[0].id,
      score: correctCount,
      total,
      percentage,
      status, // 'admis' sau 'respins'
      isPassed,
      message: isPassed 
        ? `Felicitări! Ați promovat examenul cu scorul de ${correctCount}/${total} (${percentage}%).` 
        : `Ați obținut ${correctCount}/${total} (${percentage}%). Pragul minim este 70% (9 din 12). Puteți relua testul imediat!`,
      details: detailedAuditAnswers
    });
  } catch (err) {
    console.error('Eroare la corectarea testului:', err);
    res.status(500).json({ error: err.message });
  }
});

// Istoricul încercărilor cursantului logat la un test
router.get('/:testId/my-attempts', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;
    const result = await query(`
      SELECT id, score, total_questions, percentage, status, completed_at
      FROM exam_attempts
      WHERE user_id = $1 AND test_id = $2
      ORDER BY completed_at DESC
    `, [req.user.id, testId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
