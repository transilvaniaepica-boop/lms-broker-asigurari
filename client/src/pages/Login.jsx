import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/courses');
    } catch (err) {
      setError(err.response?.data?.error || 'Eroare la autentificare. Verificați datele.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-600/30 mb-4">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Portal Instruire Broker</h2>
          <p className="text-sm text-slate-500 mt-1">Examinare periodică și conformitate legală</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Email Utilizator
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplu@brokerasig.ro"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Parolă
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Se autentifică...' : 'Intră în Cont'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-400 text-center mb-3">Acces Rapid Roluri Demonstrative:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('lector@brokerasig.ro', 'Admin2026!')}
              className="p-2 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 hover:bg-amber-100 font-medium text-left truncate"
            >
              🎓 Lector Formator
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('observator@brokerasig.ro', 'Audit2026!')}
              className="p-2 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 hover:bg-rose-100 font-medium text-left truncate"
            >
              🛡️ Observator Audit
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('angajat.demo@brokerasig.ro', 'User2026!')}
              className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 hover:bg-emerald-100 font-medium text-left truncate"
            >
              💼 Cursant Angajat
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('colaborator.demo@brokerasig.ro', 'User2026!')}
              className="p-2 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-200 hover:bg-indigo-100 font-medium text-left truncate"
            >
              🤝 Cursant Colaborator
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
