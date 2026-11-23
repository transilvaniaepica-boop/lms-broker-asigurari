import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, CheckCircle2, AlertCircle, ChevronRight, Sparkles, EyeOff, Eye } from 'lucide-react';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const url = selectedYear ? `/api/courses?year=${selectedYear}` : '/api/courses';
      const res = await axios.get(url);
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHide = async (courseId) => {
    try {
      const res = await axios.post(`/api/courses/${courseId}/toggle-hide`);
      alert(res.data.message);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la modificarea stării cursului.');
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const yearsRes = await axios.get('/api/procedures/years');
        setYears(yearsRes.data);
        if (yearsRes.data.length > 0) {
          setSelectedYear(yearsRes.data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedYear !== '') {
      fetchCourses();
    }
  }, [selectedYear]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Secțiune */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sălile Virtuale de Curs</h1>
          <p className="text-sm text-slate-500 mt-1">
            {user.role === 'angajat' && 'Flux dedicat exclusiv personalului intern de sediu.'}
            {user.role === 'colaborator' && 'Flux dedicat exclusiv agenților și asistenților în brokeraj.'}
            {(user.role === 'lector' || user.role === 'observator') && 'Vizualizare generală cursuri pe categorii și ani calendaristici.'}
          </p>
        </div>

        {/* Selector An Calendaristic */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <label className="text-sm font-semibold text-slate-700">An Cursuri:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Se încarcă cursurile...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Niciun curs disponibil pentru anul {selectedYear}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {user.role === 'lector' 
              ? 'Încărcați o procedură din panoul de Lector pentru a genera primul curs.'
              : 'Lectorul nu a publicat încă procedurile aferente acestei categorii.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const modulesCount = course.modules_json ? course.modules_json.length : 0;
            const isHidden = course.is_hidden;

            return (
              <div 
                key={course.id}
                className={`bg-white rounded-2xl border transition flex flex-col justify-between overflow-hidden relative ${
                  isHidden 
                    ? 'opacity-40 border-dashed border-amber-400 bg-amber-50/20 shadow-none' 
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {isHidden && (
                  <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1 shadow-sm z-10">
                    <EyeOff className="w-3 h-3" />
                    <span>ASCUNS DE ELEVI</span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      course.target_audience === 'angajat' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {course.target_audience === 'angajat' ? 'Angajat Sediu' : 'Colaborator'}
                    </span>
                    <span className="text-xs font-medium text-slate-400">An {course.year}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {course.content}
                  </p>

                  <div className="text-xs text-slate-500 flex items-center space-x-3">
                    <span>📚 {modulesCount} Module de studiu</span>
                    <span>📝 Test 12 Întrebări</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Prag promovare: 70%</span>
                  
                  <div className="flex items-center space-x-2">
                    {/* Buton Lector: Ascunde / Reafișează */}
                    {user.role === 'lector' && (
                      <button
                        onClick={() => handleToggleHide(course.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border ${
                          isHidden 
                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                        title={isHidden ? 'Fă cursul vizibil elevilor' : 'Ascunde cursul de elevi'}
                      >
                        {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{isHidden ? 'Afișează' : 'Ascunde'}</span>
                      </button>
                    )}

                    <Link
                      to={`/classroom/${course.id}`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <span>Intră în Sală</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
