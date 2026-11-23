import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  MessageSquare, 
  Send, 
  FileCheck, 
  CheckCircle, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  ArrowLeft 
} from 'lucide-react';

let socket = null;

export default function Classroom() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [test, setTest] = useState(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [studyTimeSeconds, setStudyTimeSeconds] = useState(0);

  // 1. Încărcare Date Curs și Test
  useEffect(() => {
    async function loadCourse() {
      try {
        const res = await axios.get(`/api/courses/${courseId}`);
        setCourse(res.data.course);
        setTest(res.data.test);
      } catch (err) {
        console.error(err);
      }
    }
    loadCourse();
  }, [courseId]);

  // 2. Heartbeat Studiu (Retenție timp 10 ani)
  useEffect(() => {
    const timer = setInterval(() => {
      setStudyTimeSeconds(s => s + 1);
    }, 1000);

    const heartbeatInterval = setInterval(() => {
      axios.post('/api/classroom/heartbeat', { courseId }).catch(e => console.error(e));
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeatInterval);
    };
  }, [courseId]);

  // 3. Conexiune WebSocket Live Chat & Prezență
  useEffect(() => {
    socket = io();

    socket.emit('join_course', { courseId, user });

    socket.on('course_users_updated', (users) => {
      setOnlineUsers(users);
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Încărcăm istoricul mesajelor
    axios.get(`/api/classroom/chat/${courseId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error(err));

    return () => {
      socket.disconnect();
    };
  }, [courseId, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('send_message', {
      courseId,
      user,
      message: newMessage,
      isQuestion
    });

    setNewMessage('');
    setIsQuestion(false);
  };

  if (!course) {
    return <div className="text-center py-20 text-slate-400">Se deschide sala de curs virtuală...</div>;
  }

  const modules = course.modules_json || [];
  const activeModule = modules[activeModuleIndex] || {};

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner Sala Virtuală */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link to="/courses" className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-800 mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Înapoi la Lista Cursurilor
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Procedură oficială valabilă pentru anul {course.year} • Public: <span className="font-semibold uppercase">{course.target_audience}</span>
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Timp Sesiune Curentă</div>
            <div className="text-sm font-bold text-slate-800 flex items-center justify-end">
              <Clock className="w-4 h-4 mr-1 text-sky-600" />
              {formatSeconds(studyTimeSeconds)}
            </div>
          </div>

          {test && (
            <Link
              to={`/exam/${test.id}`}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-600/20 flex items-center space-x-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Susține Examenul (12 Întrebări)</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid: 3 Coloane (Module stânga, Conținut centru, Prezență & Chat dreapta) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coloana 1: Module Didactice */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              Module de Învățare ({modules.length})
            </h3>
            <div className="space-y-2">
              {modules.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveModuleIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                    activeModuleIndex === idx
                      ? 'bg-sky-50 text-sky-800 border border-sky-300'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{m.title}</span>
                  {activeModuleIndex === idx && <CheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Coloana 2: Conținut Modul Activ */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{activeModule.title}</h2>
          
          {activeModule.objectives && (
            <div className="mb-6 p-4 bg-sky-50 rounded-xl border border-sky-200">
              <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-2">Obiective Didactice:</h4>
              <ul className="list-disc list-inside text-xs text-sky-800 space-y-1">
                {activeModule.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-700 mb-8">
            {activeModule.content_markdown || course.content}
          </div>

          {activeModule.key_takeaways && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">Puncte Cheie de Reținut:</h4>
              <ul className="list-disc list-inside text-xs text-emerald-800 space-y-1">
                {activeModule.key_takeaways.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Coloana 3: Prezență Live & Chat / Q&A */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Prezență Live */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center"><Users className="w-4 h-4 mr-1 text-emerald-600" /> Prezenți în Sală</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">{onlineUsers.length}</span>
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {onlineUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <span className="font-medium text-slate-700 truncate">{u.fullName || u.full_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    u.role === 'lector' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat & Q&A Asincron */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col h-[450px]">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-1 text-sky-600" /> Chat & Q&A Sală
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 p-1">
              {messages.map((m, i) => (
                <div key={i} className={`p-2.5 rounded-xl text-xs ${
                  m.is_question 
                    ? 'bg-amber-50 border border-amber-200 text-amber-900' 
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                    <span>{m.sender_name} ({m.sender_role})</span>
                    {m.is_question && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 rounded">Întrebare</span>}
                  </div>
                  <p>{m.message}</p>

                  {/* Răspuns oficial lector */}
                  {m.answer_text && (
                    <div className="mt-2 pt-2 border-t border-amber-200 text-[11px] text-emerald-800 bg-white/60 p-2 rounded">
                      <strong>Răspuns Lector:</strong> {m.answer_text}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isQ"
                  checked={isQuestion}
                  onChange={(e) => setIsQuestion(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <label htmlFor="isQ" className="text-xs font-medium text-slate-600">
                  Marchează ca Întrebare pentru Lector
                </label>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Scrie un mesaj sau o întrebare..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
