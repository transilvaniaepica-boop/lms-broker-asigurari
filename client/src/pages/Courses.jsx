import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Calendar, 
  Search, 
  X, 
  ChevronRight, 
  EyeOff, 
  Eye, 
  Sparkles, 
  Filter,
  CheckCircle,
  GraduationCap,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('toate');
  const [statusFilter, setStatusFilter] = useState('toate'); // 'toate', 'active', 'ascunse'
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

  // Baymard & NN/g: Instant client-side search & filtering with zero latency
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = course.title?.toLowerCase().includes(q);
        const matchesContent = course.content?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent) return false;
      }
      // 2. Audience Filter (pentru Lector/Observator)
      if (audienceFilter !== 'toate' && course.target_audience !== audienceFilter) {
        return false;
      }
      // 3. Status Filter (Lector)
      if (statusFilter === 'active' && course.is_hidden) return false;
      if (statusFilter === 'ascunse' && !course.is_hidden) return false;

      return true;
    });
  }, [courses, searchQuery, audienceFilter, statusFilter]);

  const hasActiveFilters = searchQuery !== '' || audienceFilter !== 'toate' || statusFilter !== 'toate';

  const resetFilters = () => {
    setSearchQuery('');
    setAudienceFilter('toate');
    setStatusFilter('toate');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* NN/g: Page Header with clear hierarchy and contextual reassurance */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-widest">
              <GraduationCap className="w-4 h-4 text-sky-600" />
              <span>Catalog Oficial de Instruire & Examinare</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sălile Virtuale de Curs
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {user.role === 'angajat' && 'Program de instruire profesională obligatorie pentru personalul intern de sediu.'}
              {user.role === 'colaborator' && 'Program de instruire profesională continuă pentru rețeaua de asistenți și agenți în brokeraj.'}
              {(user.role === 'lector' || user.role === 'observator') && 'Panou de supraveghere, administrare cursuri și monitorizare conformitate ASF/SBFT.'}
            </p>
          </div>

          {/* Selector An Calendaristic cu vizibilitate sporită */}
          <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 self-start lg:self-auto">
            <Calendar className="w-5 h-5 text-sky-600 ml-1.5" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">An Cursuri</div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent font-bold text-sm text-slate-800 focus:outline-none cursor-pointer pr-4"
              >
                {years.map(y => (
                  <option key={y} value={y}>Anul Calendaristic {y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Baymard UX: Search and Faceted Filtering Toolbar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Căutare instantă cu buton de ștergere (Baymard Search Usability) */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută curs după denumire sau tematică..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                title="Șterge căutarea"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtre suplimentare pentru Lector / Observator */}
          {(user.role === 'lector' || user.role === 'observator') && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center mr-1">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-500" /> Filtru:
              </span>

              {/* Filtru Audiență */}
              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-sky-500"
              >
                <option value="toate">Toate Categoriile</option>
                <option value="angajat">Doar Angajați Sediu</option>
                <option value="colaborator">Doar Colaboratori</option>
              </select>

              {/* Filtru Stare Vizibilitate */}
              {user.role === 'lector' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="toate">Toate Stările</option>
                  <option value="active">Vizibile pentru Elevi</option>
                  <option value="ascunse">Ascunse de Elevi</option>
                </select>
              )}

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition text-xs"
                >
                  Resetează
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rezultate Cursuri */}
      {loading ? (
        <div className="text-center py-24 text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span>Se încarcă catalogul cursurilor...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        /* NN/g Empty State cu sugestii constructive */
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 max-w-2xl mx-auto shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {hasActiveFilters 
              ? 'Niciun curs nu corespunde filtrelor selectate' 
              : `Niciun curs disponibil pentru anul ${selectedYear}`}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            {hasActiveFilters 
              ? 'Încercați să modificați cuvintele căutate sau resetați filtrele aplicate.'
              : user.role === 'lector' 
                ? 'Încărcați o procedură din panoul de Lector pentru a genera primul curs pe acest an.'
                : 'Cursurile pentru această perioadă nu au fost încă publicate de către Lector.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Șterge filtrele active
            </button>
          )}
        </div>
      ) : (
        /* Baymard Product/Course Grid: Claritate, ierarhie și acțiuni primare vizibile */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const modulesCount = course.modules_json ? course.modules_json.length : 0;
            const isHidden = course.is_hidden;

            return (
              <div 
                key={course.id}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative group ${
                  isHidden 
                    ? 'opacity-50 border-dashed border-amber-300 bg-amber-50/20 hover:opacity-75' 
                    : 'border-slate-200/90 shadow-sm hover:shadow-xl hover:border-sky-300 hover:-translate-y-0.5'
                }`}
              >
                {/* Badge Status Ascuns Lector */}
                {isHidden && (
                  <div className="absolute top-3 right-3 bg-amber-500/15 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center space-x-1 backdrop-blur-sm z-10">
                    <EyeOff className="w-3 h-3 text-amber-700" />
                    <span>ASCUNS ELEVI</span>
                  </div>
                )}

                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Badge Categorie & An */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                        course.target_audience === 'angajat' 
                          ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-200/60' 
                          : 'bg-indigo-500/10 text-indigo-800 border border-indigo-200/60'
                      }`}>
                        {course.target_audience === 'angajat' ? 'Angajat Sediu' : 'Colaborator'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">Anul {course.year}</span>
                    </div>

                    {/* Titlu Curs */}
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2.5 leading-snug group-hover:text-sky-700 transition line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Rezumat Curs */}
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 mb-5 leading-relaxed font-normal">
                      {course.content}
                    </p>
                  </div>

                  {/* Informații Metadate Curs (Baymard Information Clarity) */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                      {modulesCount} {modulesCount === 1 ? 'Pagină' : 'Pagini'} de studiu
                    </span>
                    <span className="flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Test 12 Întrebări
                    </span>
                  </div>
                </div>

                {/* Subsol Cartonaș & Acțiune Principală (NN/g Clear Call To Action) */}
                <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-bold text-slate-500">
                    Prag: <span className="text-emerald-700 font-extrabold">70% (min. 9/12)</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Buton Lector: Comutator Vizibilitate */}
                    {user.role === 'lector' && (
                      <button
                        onClick={() => handleToggleHide(course.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition border ${
                          isHidden 
                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={isHidden ? 'Fă cursul vizibil elevilor' : 'Ascunde cursul de elevi'}
                      >
                        {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                      </button>
                    )}

                    {/* Buton Primar Accentuare */}
                    <Link
                      to={`/classroom/${course.id}`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-xl text-xs font-black transition shadow-md shadow-sky-600/20 group-hover:shadow-lg"
                    >
                      <span>Intră în Sală</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
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
