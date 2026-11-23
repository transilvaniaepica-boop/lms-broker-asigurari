# LMS Asigurări - Sistem de Instruire și Examinare Periodică

Aplicație web Full-Stack concepută pentru brokerii de asigurări din România, destinată instruirii și examinării periodice a personalului intern și a rețelei de colaboratori.

Proiectul este **100% pregătit pentru cloud deployment pe Render** (Web Service + Managed PostgreSQL), cu integrare **Resend** (emailing credențiale) și **Google Gemini API** (generare cursuri, teste de 12 întrebări și actualizare legislativă anuală la 1 Decembrie).

---

## 🌟 Funcționalități Principale

1. **Control Acces pe Roluri (RBAC)**:
   - **Angajat**: Acces exclusiv la fluxul de cursuri pentru sediu / personal intern.
   - **Colaborator**: Acces separat la fluxul agenților și asistenților în brokeraj.
   - **Lector**: Încarcă proceduri (PDF/DOCX/TXT), generează cursuri AI, editează, validează cursul, generează testul de 12 întrebări, gestionează utilizatorii (import Excel masiv / blocare), participă în chat și răspunde asincron la întrebările cursanților.
   - **Observator**: Panou Live Audit (Read-Only) - monitorizează în timp real utilizatorii conectați, cursul deschis, durata de instruire și istoricul complet.

2. **Flux Didactic & Examinare (Prag 70%)**:
   - Cursuri structurate pe module didactice, obiective și noțiuni cheie.
   - Test grilă de **12 întrebări ușoare**, formulate strict din procedura validată.
   - Prag de promovare: **70% (minim 9 întrebări corecte din 12)**. Sub 70% este **Respins**, de la 70% în sus este **Admis**.
   - **Reluare nelimitată**: Cursantul respins poate reface testul imediat. Întrebările sunt amestecate aleatoriu la fiecare încercare.

3. **Sală Virtuală Live & Q&A Asincron**:
   - Indicator în timp real cu utilizatorii și lectorii prezenți pe același curs (`Socket.io`).
   - Chatroom dedicat fiecărui curs. Dacă Lectorul este offline, întrebările rămân marcate deschise, iar Lectorul primește alertă prin Resend și poate oferi răspunsul oficial la următoarea autentificare.

4. **Retenție Date & Audit pe 10 Ani**:
   - Nicio înregistrare de logare, sesiune de instruire, timp petrecut sau încercare de examen (chiar și picată) nu se șterge timp de minimum 10 ani.
   - Rapoarte individuale complete și statistici de promovabilitate cu export **Excel (.xlsx)**.

5. **Automatizare Anuală la 1 Decembrie**:
   - În fiecare an, pe data de 1 Decembrie, un cron-job declanșează AI-ul care scanează modificările legislative la zi din România (Legea 236/2018, Normele ASF, Legea 129/2019 SBFT, Regulamentul GDPR și Codul Civil).
   - Generează proiectele noi de proceduri în directorul noului an (ex: 2027) și alertează Lectorii pe email prin Resend.
   - La publicarea noului curs și a testului, acesta înlocuiește automat cursul anului anterior în interfața cursanților.

---

## 🚀 Ghid de Deployment în Cloud (Render + GitHub)

Aplicația este configurată să ruleze **total independent de laptopul dumneavoastră**, direct în cloud.

### Pasul 1: Urcarea Proiectului pe GitHub

1. Creați un repository nou pe contul dvs. de [GitHub](https://github.com) (de exemplu: `lms-asigurari`).
2. Deschideți un terminal în folderul proiectului și rulați:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Full-Stack LMS Asigurări"
   git branch -M main
   git remote add origin https://github.com/UTILIZATOR_GITHUB/lms-asigurari.git
   git push -u origin main
   ```

### Pasul 2: Crearea Serviciilor pe Render (render.com)

1. Autentificați-vă pe [Render.com](https://render.com).
2. Apăsați pe **New +** -> **Blueprint**.
3. Conectați repository-ul GitHub creat la Pasul 1.
4. Render va detecta automat fișierul inclus `render.yaml` și va propune crearea a două servicii:
   - **PostgreSQL Database** (`asig-lms-db`) - Bază de date persistentă managed (retenție 10 ani).
   - **Web Service** (`asig-lms-app`) - Aplicația Node.js + Socket.io + Frontend React integrat.

### Pasul 3: Configurarea Variabilelor de Mediu în Render

În Panoul Render (la serviciul `asig-lms-app` -> secțiunea **Environment**), completați cheile secrete:

| Variabilă | Rol / Unde se obține |
| :--- | :--- |
| `GEMINI_API_KEY` | Cheia gratuită sau comercială din [Google AI Studio](https://aistudio.google.com/) |
| `RESEND_API_KEY` | Cheia API din panoul [Resend.com](https://resend.com/api-keys) (ex: `re_...`) |
| `RESEND_FROM_EMAIL` | Adresa expeditorului (ex: `on-boarding@resend.dev` sau adresa domeniului dvs. verificat) |
| `APP_URL` | URL-ul public generat de Render (ex: `https://asig-lms-app.onrender.com`) |

*(Notă: `DATABASE_URL` și `JWT_SECRET` sunt injectate automat de Blueprint-ul `render.yaml`)*

### Pasul 4: Pornire & Verificare Producție

1. La finalizarea build-ului, Render rulează automat migrarea tabelelor (`npm run db:migrate`) și popularea cu conturile demo (`npm run db:seed`).
2. Accesați link-ul aplicației în browser (pe telefon, tabletă sau desktop):
   - **Lector Formator**: `lector@brokerasig.ro` | Parolă: `Admin2026!`
   - **Observator Audit**: `observator@brokerasig.ro` | Parolă: `Audit2026!`
   - **Cursant Angajat**: `angajat.demo@brokerasig.ro` | Parolă: `User2026!`
   - **Cursant Colaborator**: `colaborator.demo@brokerasig.ro` | Parolă: `User2026!`

---

## 🛠️ Comenzi Locale pentru Dezvoltare

Dacă doriți să inspectați sau să rulați aplicația pe o mașină locală:

```bash
# Copiați fișierul de configurare
cp .env.example .env

# Rulați migrarea bazei de date (necesită PostgreSQL local)
npm run db:migrate
npm run db:seed

# Porniți serverul backend și frontend-ul integrat
npm start
```
Aplicația va fi accesibilă la `http://localhost:5000`.
