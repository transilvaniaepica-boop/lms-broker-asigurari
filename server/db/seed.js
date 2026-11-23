const bcrypt = require('bcryptjs');
const { query, pool } = require('./index');

async function seed() {
  console.log('--- Inițializare Utilizatori Default (Lector & Observator) ---');
  try {
    const passwordHash = await bcrypt.hash('Admin2026!', 10);
    const observerHash = await bcrypt.hash('Audit2026!', 10);
    const userHash = await bcrypt.hash('User2026!', 10);

    // 1. Lector Administrator
    await query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    `, ['lector@brokerasig.ro', passwordHash, 'Lector Principal Asigurări', 'lector']);

    // 2. Observator (Audit / Supraveghere Read-Only)
    await query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    `, ['observator@brokerasig.ro', observerHash, 'Inspector Audit & Conformitate', 'observator']);

    // 3. Exemplu Angajat
    await query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    `, ['angajat.demo@brokerasig.ro', userHash, 'Ion Popescu (Angajat Sediu)', 'angajat']);

    // 4. Exemplu Colaborator
    await query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    `, ['colaborator.demo@brokerasig.ro', userHash, 'Maria Ionescu (Agent Colaborator)', 'colaborator']);

    console.log('✅ Datele demonstrative de seed au fost adăugate cu succes:');
    console.log('   - Lector: lector@brokerasig.ro / Admin2026!');
    console.log('   - Observator: observator@brokerasig.ro / Audit2026!');
    console.log('   - Angajat: angajat.demo@brokerasig.ro / User2026!');
    console.log('   - Colaborator: colaborator.demo@brokerasig.ro / User2026!');
  } catch (err) {
    console.error('❌ Eroare la rularea scriptului de seed:', err);
  }
}

if (require.main === module) {
  seed().then(() => pool.end());
}

module.exports = seed;
