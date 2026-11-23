const cron = require('node-cron');
const { query } = require('../db');
const { generateAnnualLegislativeUpdate } = require('./aiService');
const { sendAnnualUpdateNotification } = require('./emailService');
const { logAudit } = require('../middleware/audit');

/**
 * Declanșează manual sau automat procesul de actualizare din 1 Decembrie
 */
async function triggerAnnualUpdate(forcedYear = null) {
  const currentCalendarYear = new Date().getFullYear();
  const targetYear = forcedYear || (currentCalendarYear + 1);

  console.log(`[Scheduler 1 Decembrie] Inițiere scanare legislativă pentru anul ${targetYear}...`);

  try {
    // 1. Obținem procedurile din anul curent
    const currentYearProcedures = await query(`
      SELECT * FROM procedures 
      WHERE year = $1
    `, [targetYear - 1]);

    const baseProcedures = currentYearProcedures.rows.length > 0 
      ? currentYearProcedures.rows 
      : [{ title: 'Procedură Distribuție Asigurări și Conformitate', target_audience: 'angajat', raw_content: 'Procedură generală distribuție' }];

    // 2. Apelăm AI pentru scanare legislativă și generare proiecte noi
    const aiResult = await generateAnnualLegislativeUpdate({
      targetYear,
      currentProcedures: baseProcedures
    });

    // 3. Salvăm proiectele de proceduri noi în DB pentru targetYear
    let createdCount = 0;
    for (const p of aiResult.updated_procedures) {
      await query(`
        INSERT INTO procedures (title, year, target_audience, raw_content, status)
        VALUES ($1, $2, $3, $4, 'draft')
      `, [p.title, targetYear, p.target_audience, p.updated_content]);
      createdCount++;
    }

    // 4. Notificăm toți lectorii prin Resend
    const lecturers = await query(`SELECT email FROM users WHERE role = 'lector' AND is_blocked = false`);
    for (const lec of lecturers.rows) {
      await sendAnnualUpdateNotification({
        lecturerEmail: lec.email,
        targetYear,
        proceduresCount: createdCount
      });
    }

    await logAudit({
      userId: null,
      action: 'ANNUAL_UPDATE_1_DECEMBER_TRIGGERED',
      targetEntity: 'procedures',
      details: { targetYear, proceduresCreated: createdCount, summary: aiResult.summary_of_changes }
    });

    console.log(`✅ [Scheduler 1 Decembrie] Finalizat cu succes: ${createdCount} proceduri create pentru anul ${targetYear}!`);
    return { success: true, targetYear, createdCount, summary: aiResult.summary_of_changes };
  } catch (error) {
    console.error('❌ Eroare la rularea actualizării anuale:', error);
    return { success: false, error: error.message };
  }
}

// Configurare Cron Job: rulează în fiecare an pe data de 1 Decembrie la ora 02:00 dimineața ('0 2 1 12 *')
function initScheduler() {
  cron.schedule('0 2 1 12 *', async () => {
    console.log('⏰ [Cron 1 Decembrie] Declanșare automată a actualizării legislative...');
    await triggerAnnualUpdate();
  });
  console.log('🕒 Scheduler anual activat: Programat pentru 1 Decembrie la ora 02:00.');
}

module.exports = {
  initScheduler,
  triggerAnnualUpdate
};
