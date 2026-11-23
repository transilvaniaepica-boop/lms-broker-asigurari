import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Search, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Download
} from 'lucide-react';

export default function Reports() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [individualReport, setIndividualReport] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const [cRes, uRes] = await Promise.all([
          axios.get('/api/courses'),
          axios.get('/api/users')
        ]);
        setCourses(cRes.data);
        setUsers(uRes.data);
        if (cRes.data.length > 0) setSelectedCourseId(cRes.data[0].id);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      axios.get(`/api/reports/course-stats/${selectedCourseId}`)
        .then(res => setStats(res.data))
        .catch(err => console.error(err));
    }
  }, [selectedCourseId]);

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      const res = await axios.get(`/api/reports/individual/${selectedUserId}`);
      setIndividualReport(res.data);
    } catch (err) {
      alert('Eroare la obținerea raportului individual.');
    }
  };

  const handleExportExcel = () => {
    if (!selectedCourseId) return;
    window.open(`/api/reports/export-excel/${selectedCourseId}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rapoarte & Auditare (Retenție 10 Ani)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Statistici detaliate pe cursuri, promovabilitate (prag 70%) și fișe individuale complete.
        </p>
      </div>

      {/* Secțiunea 1: Raport pe Curs / Test */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Statistici Examen & Promovare</h2>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-xl font-medium"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title} ({c.year})</option>
              ))}
            </select>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Participanți Unici</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{stats.total_participants || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {stats.participants_angajati || 0} angajați / {stats.participants_colaboratori || 0} colab.
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase">Promovați (&ge; 70%)</div>
              <div className="text-xl font-bold text-emerald-900 mt-1">{stats.total_passed_users || 0}</div>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="text-[11px] font-semibold text-rose-700 uppercase">Nepromovați (&lt; 70%)</div>
              <div className="text-xl font-bold text-rose-900 mt-1">{stats.total_failed_users || 0}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Încercări</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{stats.total_attempts_made || 0}</div>
            </div>

            <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
              <div className="text-[11px] font-semibold text-sky-700 uppercase">Scor Mediu Obținut</div>
              <div className="text-xl font-bold text-sky-900 mt-1">{stats.avg_score_percentage || 0}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Secțiunea 2: Raport Individual Cursant */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center">
          <Search className="w-5 h-5 mr-2 text-sky-600" />
          Fișă Individuală Cursant (Istoric Încercări & Timp Studiu)
        </h2>

        <form onSubmit={handleSearchUser} className="flex space-x-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
          >
            <option value="">Selectați un utilizator din sistem...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.email}) - {u.role.toUpperCase()}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow"
          >
            Afișează Fișa
          </button>
        </form>

        {individualReport && (
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{individualReport.user.full_name}</h3>
                <p className="text-xs text-slate-500">{individualReport.user.email} • Rol: {individualReport.user.role}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                individualReport.user.is_blocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {individualReport.user.is_blocked ? 'CONT BLOCAT' : 'CONT ACTIV'}
              </span>
            </div>

            {/* Încercări la Examinări */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Toate Încercările la Examene (Audit 10 Ani)
              </h4>
              <div className="space-y-2">
                {individualReport.examAttempts.map(attempt => (
                  <div key={attempt.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{attempt.test_title}</div>
                      <div className="text-[11px] text-slate-400">
                        Data: {new Date(attempt.completed_at).toLocaleString('ro-RO')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold">{attempt.score} / {attempt.total_questions} ({attempt.percentage}%)</span>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        attempt.status === 'admis' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {attempt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
