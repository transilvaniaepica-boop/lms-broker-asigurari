import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  CheckSquare, 
  Award, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function Exam() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadExam = async () => {
    setLoading(true);
    setResult(null);
    setSelectedAnswers({});
    try {
      const res = await axios.get(`/api/tests/${testId}/start`);
      setTestInfo(res.data.test);
      setQuestions(res.data.questions);
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la pornirea testului');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExam();
  }, [testId]);

  const handleSelectOption = (questionId, optionIndex) => {
    if (result) return; // Blocat după submit
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(selectedAnswers).length < questions.length) {
      if (!confirm(`Ați răspuns doar la ${Object.keys(selectedAnswers).length} din cele ${questions.length} întrebări. Doriți să trimiteți testul?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`/api/tests/${testId}/submit`, {
        answers: selectedAnswers
      });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la trimiterea răspunsurilor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Se pregătește setul de examinare...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Header Examen */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{testInfo?.title}</h1>
        <p className="text-xs text-slate-500 mt-1">Curs: {testInfo?.course_title}</p>
        
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="px-3 py-1 bg-sky-50 text-sky-800 rounded-lg border border-sky-200">
            Total: 12 Întrebări Grilă
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
            Prag Promovare: 70% (Min. 9 Corecte)
          </span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-200">
            Încercări Nelimitate
          </span>
        </div>
      </div>

      {/* Rezultat Examen după predare */}
      {result && (
        <div className={`p-6 rounded-2xl border mb-8 shadow-sm ${
          result.isPassed 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center space-x-3 mb-3">
            {result.isPassed ? (
              <Award className="w-8 h-8 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            )}
            <div>
              <h2 className="text-xl font-bold">
                {result.isPassed ? 'PROMOVAT (ADMIS)' : 'NEPROMOVAT (RESPINS)'}
              </h2>
              <p className="text-xs">
                Scor: <strong>{result.score} / {result.total}</strong> ({result.percentage}%)
              </p>
            </div>
          </div>

          <p className="text-sm mb-4">{result.message}</p>

          <div className="flex items-center space-x-3">
            {!result.isPassed && (
              <button
                onClick={loadExam}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reia Testul Imediat</span>
              </button>
            )}
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              Înapoi la Cursuri
            </button>
          </div>
        </div>
      )}

      {/* Formular Întrebări */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          const detail = result?.details?.find(d => d.questionId === q.id);

          return (
            <div 
              key={q.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm transition ${
                detail 
                  ? (detail.isCorrect ? 'border-emerald-300 bg-emerald-50/20' : 'border-rose-300 bg-rose-50/20')
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  <span className="text-sky-600 mr-2">#{idx + 1}</span> {q.question_text}
                </h3>
                {detail && (
                  detail.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  )
                )}
              </div>

              <div className="space-y-2 mt-4">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[q.id] === optIdx;
                  let optStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700';

                  if (detail) {
                    if (optIdx === detail.correctIndex) {
                      optStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                    } else if (isSelected && !detail.isCorrect) {
                      optStyle = 'border-rose-500 bg-rose-100 text-rose-900 line-through';
                    }
                  } else if (isSelected) {
                    optStyle = 'border-sky-600 bg-sky-50 text-sky-900 font-semibold';
                  }

                  return (
                    <label
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full p-3 rounded-xl border text-xs flex items-center space-x-3 cursor-pointer transition ${optStyle}`}
                    >
                      <input
                        type="radio"
                        name={`question_${q.id}`}
                        checked={isSelected}
                        onChange={() => {}}
                        disabled={!!result}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>

              {detail && (
                <div className="mt-4 p-3 bg-slate-100 rounded-xl text-xs text-slate-700">
                  <strong>Explicație:</strong> {detail.explanation || 'Răspunsul corect reflectă normele aplicabile distribuției în asigurări.'}
                </div>
              )}
            </div>
          );
        })}

        {!result && (
          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/30 transition disabled:opacity-50"
            >
              {submitting ? 'Se evaluează răspunsurile...' : 'Trimite Testul pentru Corectare'}
            </button>
          </div>
        )}
      </form>

    </div>
  );
}
