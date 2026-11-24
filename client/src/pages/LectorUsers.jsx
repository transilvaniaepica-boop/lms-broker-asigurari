import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  UserX, 
  Upload, 
  Search, 
  ShieldAlert, 
  Mail, 
  CheckCircle,
  FileSpreadsheet,
  KeyRound,
  Sparkles
} from 'lucide-react';

export default function LectorUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [blockEmail, setBlockEmail] = useState('');
  const [bulkBlockFile, setBulkBlockFile] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Stare pentru Adăugare Manuală Utilizator Nou (Exclusiv Lector)
  const [manualFullName, setManualFullName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualRole, setManualRole] = useState('angajat');
  const [manualPassword, setManualPassword] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users', {
        params: { search, role: roleFilter }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  // Creare Utilizator Manual (Exclusiv Lector)
  const handleCreateManualUser = async (e) => {
    e.preventDefault();
    if (!manualFullName.trim() || !manualEmail.trim()) {
      return alert('Completați numele complet și adresa de email.');
    }

    setSubmittingManual(true);
    setFeedback(null);

    try {
      const res = await axios.post('/api/users/create-manual', {
        fullName: manualFullName,
        email: manualEmail,
        role: manualRole,
        customPassword: manualPassword
      });

      setFeedback({ 
        type: 'success', 
        text: res.data.message + (res.data.user.initialPassword ? ` Parolă setată: ${res.data.user.initialPassword}` : '') 
      });

      // Resetare formular
      setManualFullName('');
      setManualEmail('');
      setManualPassword('');
      setManualRole('angajat');

      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Eroare la crearea utilizatorului.' });
    } finally {
      setSubmittingManual(false);
    }
  };

  // Import Excel Masiv
  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!excelFile) return alert('Selectați fișierul Excel.');

    const formData = new FormData();
    formData.append('file', excelFile);

    try {
      const res = await axios.post('/api/users/import-excel', formData);
      setFeedback({ type: 'success', text: res.data.message });
      setExcelFile(null);
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Eroare la import.' });
    }
  };

  // Blocare Individuală
  const handleBlockIndividual = async (e) => {
    e.preventDefault();
    if (!blockEmail) return;

    try {
      const res = await axios.post('/api/users/block-individual', { email: blockEmail });
      setFeedback({ type: 'success', text: res.data.message });
      setBlockEmail('');
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Eroare la blocare.' });
    }
  };

  // Deblocare Individuală
  const handleUnblock = async (email) => {
    try {
      const res = await axios.post('/api/users/unblock-individual', { email });
      setFeedback({ type: 'success', text: res.data.message });
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Eroare la deblocare.' });
    }
  };

  // Blocare Masivă Excel
  const handleBulkBlock = async (e) => {
    e.preventDefault();
    if (!bulkBlockFile) return alert('Selectați fișierul de blocare.');

    const formData = new FormData();
    formData.append('file', bulkBlockFile);

    try {
      const res = await axios.post('/api/users/block-bulk-excel', formData);
      setFeedback({ type: 'success', text: res.data.message });
      setBulkBlockFile(null);
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Eroare la blocarea masivă.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Management Utilizatori (Lector)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Înregistrare manuală utilizatori noi, import masiv Excel cu trimitere automată de parole prin Resend și blocare conturi cu retenția intactă a istoricului.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-sm flex items-center space-x-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Secțiunea 1: Adăugare Manuală Utilizator Nou (Exclusiv Lector) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-sky-600/10 text-sky-700 flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Înregistrare Manuală Utilizator Nou (Cont Individual)
            </h2>
            <p className="text-xs text-slate-500">
              Completează datele cursantului. Sistemul trimite automat datele de logare pe email prin Resend.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateManualUser} className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nume & Prenume *
            </label>
            <input
              type="text"
              required
              value={manualFullName}
              onChange={(e) => setManualFullName(e.target.value)}
              placeholder="ex: Andrei Popescu"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Adresă Email *
            </label>
            <input
              type="email"
              required
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="andrei.popescu@brokerasig.ro"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rol & Flux Alocat *
            </label>
            <select
              value={manualRole}
              onChange={(e) => setManualRole(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 font-medium"
            >
              <option value="angajat">Angajat (Sediu / Intern)</option>
              <option value="colaborator">Colaborator (Agent Asigurări)</option>
              <option value="observator">Observator (Audit Read-Only)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Parolă (Opțional)
            </label>
            <input
              type="text"
              value={manualPassword}
              onChange={(e) => setManualPassword(e.target.value)}
              placeholder="Lăsați gol pt. generare automată"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submittingManual}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submittingManual ? 'Se creează contul...' : 'Creează Utilizator & Trimite Credențiale'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Grid: 2 Secțiuni (Import Masiv & Blocare) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Import Excel */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-emerald-600" />
              Import Masiv din Excel (.xlsx / .csv)
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Generează automat conturi noi, parole sigure și trimite email de bun venit prin Resend. (Coloane: Email | Nume | Rol)
            </p>
          </div>

          <form onSubmit={handleImportExcel} className="space-y-3">
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
            >
              Importă Masiv din Fișier
            </button>
          </form>
        </div>

        {/* Card 2: Blocare Utilizatori */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-rose-600" />
            Blocare Acces Utilizatori
          </h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Blochează accesul la examinare fără a șterge istoricul de 10 ani din baza de date.
          </p>

          <div className="space-y-4">
            {/* Blocare Individuală */}
            <form onSubmit={handleBlockIndividual} className="flex space-x-2">
              <input
                type="email"
                placeholder="email.utilizator@brokerasig.ro"
                value={blockEmail}
                onChange={(e) => setBlockEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow"
              >
                Blochează
              </button>
            </form>

            {/* Blocare Masivă Excel */}
            <form onSubmit={handleBulkBlock} className="pt-3 border-t border-slate-100 flex items-center space-x-2">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setBulkBlockFile(e.target.files[0])}
                className="flex-1 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition"
              >
                Blocare Masivă
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Tabel Utilizatori Înregistrați */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-lg font-bold text-slate-900">Utilizatori Înregistrați ({users.length})</h2>

          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Căutare email sau nume..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
            >
              <option value="">Toate Rolurile</option>
              <option value="angajat">Angajat</option>
              <option value="colaborator">Colaborator</option>
              <option value="lector">Lector</option>
              <option value="observator">Observator</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-3">Nume & Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Stare</th>
                <th className="p-3">Creat la</th>
                <th className="p-3">Ultima Logare</th>
                <th className="p-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map(u => (
                <tr key={u.id} className={u.is_blocked ? 'bg-rose-50/30' : ''}>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{u.full_name}</div>
                    <div className="text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-3 font-semibold uppercase">{u.role}</td>
                  <td className="p-3">
                    {u.is_blocked ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">BLOCAT</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">ACTIV</span>
                    )}
                  </td>
                  <td className="p-3">{new Date(u.created_at).toLocaleDateString('ro-RO')}</td>
                  <td className="p-3">{u.last_login ? new Date(u.last_login).toLocaleString('ro-RO') : 'Niciodată'}</td>
                  <td className="p-3 text-right">
                    {u.is_blocked ? (
                      <button
                        onClick={() => handleUnblock(u.email)}
                        className="text-xs text-emerald-600 hover:underline font-bold"
                      >
                        Deblochează
                      </button>
                    ) : (
                      u.role !== 'lector' && (
                        <button
                          onClick={() => {
                            if (confirm(`Sigur doriți să blocați utilizatorul ${u.email}?`)) {
                              axios.post('/api/users/block-individual', { email: u.email }).then(loadUsers);
                            }
                          }}
                          className="text-xs text-rose-600 hover:underline font-bold"
                        >
                          Blochează
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
