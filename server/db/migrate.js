const { query, pool } = require('./index');

async function migrate() {
  console.log('--- Inițializare Migrare Bază de Date PostgreSQL (Retenție 10 ani) ---');
  try {
    // 1. Tabela Utilizatori cu RBAC (Angajat, Colaborator, Lector, Observator)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('angajat', 'colaborator', 'lector', 'observator')),
        is_blocked BOOLEAN DEFAULT FALSE,
        blocked_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // 2. Tabela Proceduri (organizate pe ani, ex: 2026, 2027)
    await query(`
      CREATE TABLE IF NOT EXISTS procedures (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        target_audience VARCHAR(50) NOT NULL CHECK (target_audience IN ('angajat', 'colaborator')),
        original_file_path TEXT,
        raw_content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'archived')),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        validated_at TIMESTAMP WITH TIME ZONE NULL
      );
      CREATE INDEX IF NOT EXISTS idx_procedures_year_audience ON procedures(year, target_audience);
    `);

    // 3. Tabela Cursuri (structurate pe module, editabile și validate)
    await query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        procedure_id INTEGER REFERENCES procedures(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        target_audience VARCHAR(50) NOT NULL CHECK (target_audience IN ('angajat', 'colaborator')),
        content TEXT NOT NULL,
        modules_json JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'active', 'archived')),
        is_active BOOLEAN DEFAULT FALSE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        validated_at TIMESTAMP WITH TIME ZONE NULL
      );
      CREATE INDEX IF NOT EXISTS idx_courses_year_audience_active ON courses(year, target_audience, is_active);
    `);

    // 4. Tabela Teste de Examinare (12 întrebări per procedură/curs)
    await query(`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        pass_percentage NUMERIC(5,2) DEFAULT 70.00,
        min_pass_score INTEGER DEFAULT 9,
        total_questions INTEGER DEFAULT 12,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'active', 'archived')),
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        validated_at TIMESTAMP WITH TIME ZONE NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tests_course_id ON tests(course_id);
    `);

    // 5. Tabela Întrebări Examen (opțiuni multiple, grilă)
    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL, -- Array de string-uri: ["Opțiunea A", "Opțiunea B", "Opțiunea C", "Opțiunea D"]
        correct_answer_index INTEGER NOT NULL, -- 0, 1, 2, sau 3
        explanation TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
    `);

    // 6. Tabela Încercări de Test (Audit complet 10 ani: Admis/Respins, Punctaje, Detalii Răspunsuri)
    await query(`
      CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        test_id INTEGER REFERENCES tests(id),
        score INTEGER NOT NULL, -- Număr răspunsuri corecte din 12
        total_questions INTEGER NOT NULL DEFAULT 12,
        percentage NUMERIC(5,2) NOT NULL, -- ex: 75.00
        status VARCHAR(20) NOT NULL CHECK (status IN ('admis', 'respins')),
        answers_payload JSONB NOT NULL, -- salvăm exact ce a selectat cursantul și ce era corect
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_exam_attempts_test ON exam_attempts(test_id);
      CREATE INDEX IF NOT EXISTS idx_exam_attempts_date ON exam_attempts(completed_at);
    `);

    // 7. Tabela Sesiuni Studiu & Timp petrecut pe Curs (Audit Observator & Lector)
    await query(`
      CREATE TABLE IF NOT EXISTS course_study_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        course_id INTEGER REFERENCES courses(id),
        session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        session_end TIMESTAMP WITH TIME ZONE NULL,
        duration_seconds INTEGER DEFAULT 0,
        last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_study_sessions_user_course ON course_study_sessions(user_id, course_id);
      CREATE INDEX IF NOT EXISTS idx_study_sessions_dates ON course_study_sessions(session_start);
    `);

    // 8. Tabela Mesaje Chat / Q&A Asincron în Sălile Virtuale
    await query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        is_question BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
        answered_by INTEGER REFERENCES users(id) NULL,
        answer_text TEXT NULL,
        answered_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_chat_course ON chat_messages(course_id);
      CREATE INDEX IF NOT EXISTS idx_chat_status ON chat_messages(status);
    `);

    // 9. Tabela Jurnal de Audit General (Garanție retenție 10 ani)
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NULL,
        action VARCHAR(100) NOT NULL,
        target_entity VARCHAR(100) NOT NULL,
        target_id INTEGER NULL,
        details JSONB NULL,
        ip_address VARCHAR(100) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    `);

    console.log('✅ Migrarea bazei de date PostgreSQL a fost finalizată cu succes!');
  } catch (err) {
    console.error('❌ Eroare la migrarea bazei de date:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate().then(() => pool.end());
}

module.exports = migrate;
