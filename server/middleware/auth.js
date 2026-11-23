const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_lms_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Autentificare necesară. Token lipsă.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Sesiune expirată sau token invalid.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Verifică dacă utilizatorul are unul din rolurile specificate
 * @param  {...string} roles - 'angajat', 'colaborator', 'lector', 'observator'
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Utilizator neautentificat.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Acces interzis. Rolul tău (${req.user.role}) nu are permisiunea necesară pentru această operațiune.` 
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
