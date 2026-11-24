const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const { query } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// Listare toți utilizatorii (cu filtru rol, stare, căutare email)
router.get('/', authenticateToken, authorizeRoles('lector', 'observator'), async (req, res) => {
  try {
    const { role, isBlocked, search } = req.query;
    let sql = `
      SELECT id, email, full_name, role, is_blocked, blocked_at, created_at, last_login 
      FROM users WHERE 1=1
    `;
    const params = [];

    if (role) {
      params.push(role);
      sql += ` AND role = $${params.length}`;
    }
    if (isBlocked !== undefined && isBlocked !== '') {
      params.push(isBlocked === 'true');
      sql += ` AND is_blocked = $${params.length}`;
    }
    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(email) LIKE $${params.length} OR LOWER(full_name) LIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Adăugare Utilizator Individual Manual (DOAR Lector)
router.post('/create-manual', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const { email, fullName, role, customPassword } = req.body;

    if (!email || !fullName || !role) {
      return res.status(400).json({ error: 'Numele complet, emailul și rolul sunt câmpuri obligatorii.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!['angajat', 'colaborator', 'observator'].includes(role)) {
      return res.status(400).json({ error: 'Rol invalid. Alegeți: angajat, colaborator sau observator.' });
    }

    // Verificăm dacă adresa de email există deja
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `Adresa de email ${cleanEmail} este deja înregistrată în sistem.` });
    }

    // Dacă lectorul nu a specificat o parolă, generăm una sigură aleatorie
    const finalPassword = customPassword && customPassword.trim() 
      ? customPassword.trim() 
      : 'Asig#' + crypto.randomBytes(3).toString('hex') + '!';

    const passwordHash = await bcrypt.hash(finalPassword, 10);

    const insertRes = await query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, role, created_at
    `, [cleanEmail, passwordHash, cleanName, role]);

    const newUser = insertRes.rows[0];

    // Trimitem emailul de bun venit cu parola generată prin Resend
    sendWelcomeEmail({
      email: cleanEmail,
      fullName: cleanName,
      password: finalPassword,
      role
    }).catch(err => console.error('Eroare trimitere email manual:', err));

    await logAudit({
      userId: req.user.id,
      action: 'USER_CREATED_MANUAL',
      targetEntity: 'users',
      targetId: newUser.id,
      details: { email: cleanEmail, fullName: cleanName, role }
    });

    res.json({
      message: `Utilizatorul ${cleanName} (${cleanEmail}) a fost creat cu succes! Credențialele au fost transmise prin email.`,
      user: {
        ...newUser,
        initialPassword: finalPassword
      }
    });
  } catch (err) {
    console.error('Eroare adăugare manuală utilizator:', err);
    res.status(500).json({ error: 'Eroare internă la crearea utilizatorului: ' + err.message });
  }
});

// Import Masiv din Excel / CSV (.xlsx)
router.post('/import-excel', authenticateToken, authorizeRoles('lector'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Încărcați un fișier Excel (.xlsx) sau CSV.' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    const importedUsers = [];
    const skippedEmails = [];

    // Iterare rânduri (Coloane așteptate: Email | Nume Prenume | Rol [angajat/colaborator])
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const emailRaw = row.getCell(1).text;
      const fullNameRaw = row.getCell(2).text;
      const roleRaw = row.getCell(3).text;

      if (!emailRaw) continue;
      const email = emailRaw.trim().toLowerCase();
      const fullName = fullNameRaw ? fullNameRaw.trim() : email.split('@')[0];
      let role = roleRaw ? roleRaw.trim().toLowerCase() : 'angajat';

      if (!['angajat', 'colaborator'].includes(role)) {
        role = 'angajat';
      }

      // Verificăm dacă există deja
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        skippedEmails.push(email);
        continue;
      }

      // Generare parolă aleatorie sigură (ex: Asig#92aF81)
      const randomPassword = 'Asig#' + crypto.randomBytes(3).toString('hex') + '!';
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const insertRes = await query(`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, full_name, role
      `, [email, passwordHash, fullName, role]);

      // Trimitere email prin Resend cu datele de logare
      sendWelcomeEmail({
        email,
        fullName,
        password: randomPassword,
        role
      }).catch(err => console.error('Eroare trimitere bun venit:', err));

      importedUsers.push({
        ...insertRes.rows[0],
        initialPassword: randomPassword
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'USERS_IMPORTED_EXCEL',
      targetEntity: 'users',
      details: { importedCount: importedUsers.length, skippedCount: skippedEmails.length }
    });

    res.json({
      message: `Au fost importați ${importedUsers.length} utilizatori noi. Duplicate ignorate: ${skippedEmails.length}.`,
      importedCount: importedUsers.length,
      skippedCount: skippedEmails.length,
      importedUsers
    });
  } catch (err) {
    console.error('Eroare import Excel:', err);
    res.status(500).json({ error: 'Eroare la procesarea fișierului Excel: ' + err.message });
  }
});

// Blocare Utilizator Individual
router.post('/block-individual', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Introduceți adresa de email.' });

    const targetEmail = email.trim().toLowerCase();
    const result = await query(`
      UPDATE users
      SET is_blocked = true, blocked_at = NOW()
      WHERE email = $1 AND role IN ('angajat', 'colaborator')
      RETURNING id, email, full_name, is_blocked
    `, [targetEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit sau nu poate fi blocat.' });
    }

    await logAudit({
      userId: req.user.id,
      action: 'USER_BLOCKED_INDIVIDUAL',
      targetEntity: 'users',
      targetId: result.rows[0].id,
      details: { email: targetEmail }
    });

    res.json({ message: `Utilizatorul ${targetEmail} a fost blocat cu succes (istoricul rămâne intact).`, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deblocare Utilizator Individual
router.post('/unblock-individual', authenticateToken, authorizeRoles('lector'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Introduceți adresa de email.' });

    const targetEmail = email.trim().toLowerCase();
    const result = await query(`
      UPDATE users
      SET is_blocked = false, blocked_at = NULL
      WHERE email = $1
      RETURNING id, email, full_name, is_blocked
    `, [targetEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit.' });
    }

    await logAudit({
      userId: req.user.id,
      action: 'USER_UNBLOCKED_INDIVIDUAL',
      targetEntity: 'users',
      targetId: result.rows[0].id,
      details: { email: targetEmail }
    });

    res.json({ message: `Utilizatorul ${targetEmail} a fost deblocat.`, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blocare Utilizatori în Masă (Bulk din fișier Excel / Text)
router.post('/block-bulk-excel', authenticateToken, authorizeRoles('lector'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Încărcați fișierul Excel cu adresele de blocat.' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    const emailsToBlock = [];
    for (let r = 1; r <= worksheet.rowCount; r++) {
      const email = worksheet.getRow(r).getCell(1).text;
      if (email && email.includes('@')) {
        emailsToBlock.push(email.trim().toLowerCase());
      }
    }

    if (emailsToBlock.length === 0) {
      return res.status(400).json({ error: 'Nu au fost identificate adrese de email valide în fișier.' });
    }

    const result = await query(`
      UPDATE users
      SET is_blocked = true, blocked_at = NOW()
      WHERE email = ANY($1::text[]) AND role IN ('angajat', 'colaborator')
      RETURNING email
    `, [emailsToBlock]);

    await logAudit({
      userId: req.user.id,
      action: 'USERS_BLOCKED_BULK',
      targetEntity: 'users',
      details: { blockedCount: result.rows.length, targetEmails: emailsToBlock }
    });

    res.json({
      message: `Au fost blocați ${result.rows.length} utilizatori dintr-un total de ${emailsToBlock.length} adrese transmise.`,
      blockedCount: result.rows.length,
      blockedEmails: result.rows.map(r => r.email)
    });
  } catch (err) {
    res.status(500).json({ error: 'Eroare la blocarea în masă: ' + err.message });
  }
});

module.exports = router;
