import React, { useState } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  Mail, 
  Layers, 
  ArrowRight,
  ShieldAlert 
} from 'lucide-react';

export default function LectorAnnual() {
  const currentYear = new Date().getFullYear();
  const [targetYear, setTargetYear] = useState(currentYear + 1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTrigger = async () => {
    if (!confirm(`Sunteți sigur că doriți să declanșați scanarea legislativă AI pentru anul ${targetYear}?`)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post('/api/annual-update/trigger', { targetYear });
      setResult(res.data);
    } catch (err) {
      alert('Eroare la rularea actualizării anuale: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <Calendar className="w-8 h-8 text-amber-200" />
          <h1 className="text-2xl font-bold">Automatizare Anuală (1 Decembrie)</h1>
        </div>
        <p className="text-sm text-amber-100 max-w-2xl leading-relaxed">
          În fiecare an, la 1 Decembrie, sistemul declanșează automat un proces AI care scanează modificările legislative la zi din România (Legea 236/2018 - distribuția în asigurări, Normele ASF, SBFT Legea 129/2019, GDPR și Codul Civil).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900">Declanșare Proactivă / Testare 1 Decembrie</h2>
        <p className="text-xs text-slate-500">
          Puteți declanșa manual acest proces oricând pentru a pregăti procedurile și cursurile pentru noul an calendaristic.
        </p>

        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Anul Calendaristic Următor</label>
            <input
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-5">
            <button
              onClick={handleTrigger}
              disabled={loading}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'AI Scanează Legislația Română...' : `Generează Procedurile pentru ${targetYear}`}</span>
            </button>
          </div>
        </div>

        {result && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold">
              <CheckCircle className="w-5 h-5" />
              <span>Procesul de Actualizare pentru anul {result.targetYear} a fost finalizat!</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              <strong>Sinteza modificărilor legislative identificate:</strong><br />
              {result.summary}
            </p>
            <p className="text-xs text-emerald-900 font-semibold">
              Au fost salvate {result.createdCount} proiecte de proceduri noi în dosarul anului {result.targetYear}. 
              Toți lectorii au primit notificare prin Resend.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
