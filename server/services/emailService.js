const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'on-boarding@resend.dev';

let resend = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

/**
 * Trimite credențialele inițiale către un utilizator nou creat (Angajat sau Colaborator)
 */
async function sendWelcomeEmail({ email, fullName, password, role }) {
  if (!resend) {
    console.warn(`[Resend Simulat] Email către ${email}: Parola inițială este: ${password}`);
    return { success: true, simulated: true };
  }

  const roleLabel = role === 'angajat' ? 'Angajat (Personal Intern)' : 'Colaborator / Agent Asigurări';
  const appUrl = process.env.APP_URL || 'https://asig-lms-app.onrender.com';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Bun venit în Platforma de Instruire și Examinare</h2>
      <p>Stimate/Stimat&#259; <strong>${fullName}</strong>,</p>
      <p>A fost creat contul dumneavoastră pe platforma de instruire profesională continuă a brokerului de asigurări.</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Rol alocat:</strong> ${roleLabel}</p>
        <p style="margin: 4px 0;"><strong>Email utilizator:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Parolă inițială:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #b91c1c;">${password}</code></p>
      </div>
      <p>Vă rugăm să accesați platforma și să parcurgeți cursurile obligatorii și testele periodice de examinare (prag de promovare 70%):</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accesează Platforma LMS</a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Notă de securitate: Vă recomandăm să schimbați parola după prima autentificare. Toate încercările de examinare și sesiunile de instruire sunt înregistrate în conformitate cu normele de audit.</p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Credențiale acces Platformă Instruire & Examinare Broker Asigurări',
      html
    });
    return { success: true, data };
  } catch (error) {
    console.error('Eroare la trimiterea emailului prin Resend:', error);
    return { success: false, error };
  }
}

/**
 * Trimite notificare lectorilor când există întrebări offline în sălile de curs
 */
async function sendLecturerQuestionAlert({ lecturerEmail, studentName, courseTitle, questionText }) {
  if (!resend) {
    console.warn(`[Resend Simulat] Notificare Lector ${lecturerEmail} despre întrebare de la ${studentName}`);
    return { success: true, simulated: true };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px;">
      <h3 style="color: #1e40af;">Întrebare nouă în Sala Virtuală de Curs</h3>
      <p>Cursantul <strong>${studentName}</strong> a adresat o întrebare în cursul <strong>${courseTitle}</strong>:</p>
      <blockquote style="background: #f1f5f9; padding: 12px; border-left: 4px solid #64748b; font-style: italic;">
        "${questionText}"
      </blockquote>
      <p>Vă rugăm să vă autentificați în panoul de Lector pentru a oferi răspunsul de specialitate.</p>
    </div>
  `;

  try {
    return await resend.emails.send({
      from: fromEmail,
      to: lecturerEmail,
      subject: `[Întrebare Cursant] ${courseTitle}`,
      html
    });
  } catch (error) {
    console.error('Eroare trimitere alertă lector:', error);
  }
}

/**
 * Notificare lectori pentru actualizarea anuală din 1 Decembrie
 */
async function sendAnnualUpdateNotification({ lecturerEmail, targetYear, proceduresCount }) {
  if (!resend) {
    console.warn(`[Resend Simulat] Notificare 1 Decembrie către ${lecturerEmail} pentru anul ${targetYear}`);
    return { success: true, simulated: true };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #15803d;">Actualizare Legislativă Anuală Finalizată (${targetYear})</h2>
      <p>Stimate Lector,</p>
      <p>Conform calendarului anual din <strong>1 Decembrie</strong>, motorul de inteligență artificială a scanat modificările legislative recente din România (Legea 236/2018 - distribuția în asigurări, Normele ASF, Legea 129/2019 - SBFT, Regulamentul GDPR și Codul Civil).</p>
      <p>Au fost generate cu succes <strong>${proceduresCount} proiecte noi de proceduri</strong> în dosarul anului <strong>${targetYear}</strong>.</p>
      <p>Pașii următori:</p>
      <ol>
        <li>Accesați dosarul anului ${targetYear}.</li>
        <li>Revizuiți și validați noile proceduri.</li>
        <li>Generați noile cursuri și seturile de 12 întrebări de examinare.</li>
        <li>Publicați-le pentru a înlocui automat cursurile din anul precedent.</li>
      </ol>
    </div>
  `;

  try {
    return await resend.emails.send({
      from: fromEmail,
      to: lecturerEmail,
      subject: `[Automatizare 1 Decembrie] Proiectele de proceduri pentru anul ${targetYear} sunt pregătite`,
      html
    });
  } catch (error) {
    console.error('Eroare trimitere alertă anuală 1 Decembrie:', error);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendLecturerQuestionAlert,
  sendAnnualUpdateNotification
};
