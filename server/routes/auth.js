const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// Autentificare Utilizator
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Introduceți adresa de email și parola.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credențiale incorecte.' });
    }

    const user = result.rows[0];

    if (user.is_blocked) {
      return res.status(403).json({ 
        error: 'Acest cont a fost blocat de către un Lector. Contactați departamentul de conformitate.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credențiale incorecte.' });
    }

    // Actualizăm data ultimei logări
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Înregistrăm acțiunea în Audit (retenție 10 ani)
    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      targetEntity: 'users',
      targetId: user.id,
      details: { role: user.role, email: user.email },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Generăm Token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Eroare la autentificare:', err);
    res.status(500).json({ error: 'Eroare internă de server la autentificare.' });
  }
});

// Verificare sesiune curentă
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, email, full_name, role, is_blocked, created_at, last_login FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0 || result.rows[0].is_blocked) {
      return res.status(401).json({ error: 'Utilizator inexistent sau cont blocat.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Eroare la obținerea profilului.' });
  }
});

module.exports = router;
