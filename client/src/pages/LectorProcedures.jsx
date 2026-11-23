import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileUp, 
  Sparkles, 
  Check, 
  Edit3, 
  Layers, 
  Send, 
  FileText,
  AlertCircle 
} from 'lucide-react';

export default function LectorProcedures() {
  const [procedures, setProcedures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [targetAudience, setTargetAudience] = useState('angajat');
  const [file, setFile] = useState(null);
  const [manualContent, setManualContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Editare curs selectat
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  const loadData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        axios.get('/api/procedures'),
        axios.get('/api/courses')
      ]);
      setProcedures(pRes.data);
      setCourses(cRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pasul 1: Încărcare & Generare Curs AI
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title) return alert('Introduceți titlul procedurii.');
    if (!file && !manualContent.trim()) return alert('Încărcați un fișier (PDF/DOCX/TXT) sau introduceți conținutul.');

    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('year', year);
    formData.append('targetAudience', targetAudience);
    if (file) formData.append('file', file);
    if (manualContent) formData.append('manualContent', manualContent);

    try {
      const res = await axios.post('/api/procedures/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFeedback({ type: 'success', text: res.data.message });
      setTitle('');
      setFile(null);
      setManualContent('');
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Eroare la generarea cursului.' });
    } finally {
      setLoading(false);
    }
  };

  // Pasul 2: Validare Curs
  const handleValidateCourse = async (courseId) => {
    try {
      const res = await axios.post(`/api/courses/${courseId}/validate`);
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la validare.');
    }
  };

  // Pasul 3: Generare Test (12 Întrebări)
  const handleGenerateTest = async (courseId) => {
    try {
      const res = await axios.post(`/api/courses/${courseId}/generate-test`);
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la generarea întrebărilor.');
    }
  };

  // Publicare Curs & Test (Înlocuire automată a celui din anul precedent)
  const handlePublish = async (courseId) => {
    if (!confirm('Doriți să publicați acest curs? Acesta va deveni activ pentru cursanți și va înlocui vechea versiune.')) return;
    try {
      const res = await axios.post(`/api/courses/${courseId}/publish`);
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la publicare.');
    }
  };

  // Ascunde / Afișează Curs (Doar Lector)
  const handleToggleHide = async (courseId) => {
    try {
      const res = await axios.post(`/api/courses/${courseId}/toggle-hide`);
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la modificarea stării cursului.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panou Lector: Creare Cursuri &amp; Examinare</h1>
        <p className="text-sm text-slate-500 mt-1">
          Flux în 3 pași: Încărcare procedură &rarr; Generare &amp; Editare Curs AI &rarr; Generare Test (12 Întrebări).
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-sm flex items-center space-x-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Pasul 1: Formular Încărcare & Generare */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <FileUp className="w-5 h-5 mr-2 text-sky-600" />
          Pasul 1 - Încărcare Procedură & Generare Curs AI
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Titlu Procedură Internă</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Procedură Verificare SBFT & KYC"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">An Calendaristic</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Public Țintă (Flux Separat)</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="angajat">Angajat (Personal Sediu)</option>
                <option value="colaborator">Colaborator (Agent Asigurări)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Fișier Procedură (PDF, TXT, DOCX)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sau Introduceți Textul Procedurii Direct</label>
            <textarea
              rows={4}
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              placeholder="Copiați aici conținutul procedurii..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'AI Transformă Procedura în Curs...' : 'Procesează & Generează Curs AI'}</span>
          </button>
        </form>
      </div>

      {/* Pasul 2 & 3: Lista Cursurilor Generate */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-emerald-600" />
          Cursuri în Lucru & Fluxul de Validare
        </h2>

        <div className="divide-y divide-slate-100">
          {courses.map(course => {
            const isHidden = course.is_hidden;

            return (
              <div 
                key={course.id} 
                className={`py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition rounded-xl px-3 ${
                  isHidden ? 'opacity-40 bg-amber-50/40 border border-dashed border-amber-300' : ''
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      course.target_audience === 'angajat' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {course.target_audience}
                    </span>
                    <span className="text-xs text-slate-400">An {course.year}</span>
                    <span className="text-xs font-semibold text-slate-600">Stare: {course.status}</span>
                    {isHidden && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                        ASCUNS DE ELEVI
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{course.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Buton Pasul 2: Validare Curs */}
                  {course.status === 'draft' && (
                    <button
                      onClick={() => handleValidateCourse(course.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow"
                    >
                      Validează Cursul
                    </button>
                  )}

                  {/* Buton Pasul 3: Generare Test (activ doar după validare curs) */}
                  {(course.status === 'validated' || course.status === 'active') && (
                    <button
                      onClick={() => handleGenerateTest(course.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generează Întrebări Examen</span>
                    </button>
                  )}

                  {/* Buton Publicare Curs & Test */}
                  {course.status === 'validated' && (
                    <button
                      onClick={() => handlePublish(course.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
                    >
                      Publică Cursul & Testul
                    </button>
                  )}

                  {course.is_active && !isHidden && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                      ✓ Activ pentru Cursanți
                    </span>
                  )}

                  {/* Buton Lector: Ascunde / Afișează */}
                  <button
                    onClick={() => handleToggleHide(course.id)}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      isHidden 
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isHidden ? 'Fă Vizibil' : 'Ascunde de Elevi'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
