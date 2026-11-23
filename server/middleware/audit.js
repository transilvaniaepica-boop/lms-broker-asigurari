const { query } = require('../db');

/**
 * Înregistrează o acțiune în tabela de audit (Retenție 10 ani)
 */
async function logAudit({ userId, action, targetEntity, targetId = null, details = {}, ip = null, userAgent = null }) {
  try {
    await query(`
      INSERT INTO audit_logs (user_id, action, target_entity, target_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, action, targetEntity, targetId, JSON.stringify(details), ip, userAgent]);
  } catch (err) {
    console.error('Eroare salvare log audit:', err.message);
  }
}

module.exports = { logAudit };
