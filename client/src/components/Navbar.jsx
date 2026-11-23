import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Activity, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  Calendar,
  Layers
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadges = {
    angajat: { label: 'Angajat (Sediu)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    colaborator: { label: 'Colaborator (Agent)', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    lector: { label: 'Lector Formator', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    observator: { label: 'Observator Audit', bg: 'bg-rose-100 text-rose-800 border-rose-300' }
  };

  const badge = roleBadges[user.role] || { label: user.role, bg: 'bg-slate-100 text-slate-800' };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Titlu */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-sky-700 flex items-center justify-center text-white shadow">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">LMS Asigurări</h1>
            <p className="text-xs text-slate-500 font-medium">Instruire & Examinare Periodică</p>
          </div>
        </Link>

        {/* Link-uri de Navigare pe bază de Rol */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/courses"
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition ${
              isActive('/courses') ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sălile Mele de Curs</span>
          </Link>

          {/* Navigare exclusivă Lector */}
          {user.role === 'lector' && (
            <>
              <Link
                to="/lector/procedures"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition ${
                  isActive('/lector/procedures') ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Proceduri & Generare AI</span>
              </Link>
              <Link
                to="/lector/users"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition ${
                  isActive('/lector/users') ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Management Utilizatori</span>
              </Link>
              <Link
                to="/lector/annual"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition ${
                  isActive('/lector/annual') ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="text-amber-800 font-semibold">1 Decembrie AI</span>
              </Link>
            </>
          )}

          {/* Navigare Lector & Observator (Rapoarte și Monitorizare Live) */}
          {(user.role === 'lector' || user.role === 'observator') && (
            <>
              <Link
                to="/observer/live"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition ${
                  isActive('/observer/live') ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Monitorizare Live (Audit)</span>
              </Link>
              <Link
                to="/reports"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition ${
                  isActive('/reports') ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Rapoarte (10 Ani)</span>
              </Link>
            </>
          )}
        </nav>

        {/* Profil & Logout */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800 leading-snug">{user.full_name || user.fullName}</div>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Deconectare sigură"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
}
