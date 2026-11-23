import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  Users, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export default function ObserverLive() {
  const [data, setData] = useState({ activeNow: [], summary: {} });
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    try {
      const res = await axios.get('/api/reports/observer-live');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 10000); // Actualizare automată la fiecare 10 secunde
    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (sec) => {
    if (!sec) return '0 min';
    const m = Math.floor(sec / 60);
    return `${m} minute`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-emerald-600 animate-pulse" />
            Panou Monitorizare Live & Auditare (Read-Only)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Transmisie în timp real a prezenței, cursurilor accesate și duratei exacte de instruire.
          </p>
        </div>

        <button
          onClick={fetchLive}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
          title="Reîmprospătează"
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Statistici agregat */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Angajați Sediu</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{data.summary?.total_angajati || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Colaboratori / Agenți</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{data.summary?.total_colaboratori || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Lectori Formatori</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{data.summary?.total_lectori || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Conturi Blocate</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{data.summary?.total_blocati || 0}</div>
        </div>
      </div>

      {/* Tabel Utilizatori Activi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
          <span>Utilizatori Activi în Platformă ({data.activeNow.length})</span>
          <span className="text-xs text-slate-400 font-normal">Păstrare date audit: 10 ani</span>
        </h2>

        {data.activeNow.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Niciun utilizator activ în ultimele 24 de ore.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-3">Utilizator</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Curs Accesat Curent</th>
                  <th className="p-3">Durată Totală Studiu</th>
                  <th className="p-3">Ultimul Semnal (Heartbeat)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.activeNow.map(u => (
                  <tr key={u.id}>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-3 font-semibold uppercase">{u.role}</td>
                    <td className="p-3">
                      {u.current_course_title ? (
                        <span className="text-sky-700 font-medium">{u.current_course_title}</span>
                      ) : (
                        <span className="text-slate-400 italic">În navigare generală</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {formatSeconds(u.duration_seconds)}
                    </td>
                    <td className="p-3 text-slate-500">
                      {u.last_heartbeat ? new Date(u.last_heartbeat).toLocaleTimeString('ro-RO') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
