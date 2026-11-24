import React from 'react';

/**
 * Elimină simbolurile `*` din text dacă nu reprezintă operație de înmulțire între numere (ex: 2 * 3).
 * Tratează markdown bold (**text**), italic (*text*), marcatori reziduali etc.
 */
function cleanAsterisks(text) {
  if (!text || typeof text !== 'string') return text;

  // Pasul 1: Înlocuim temporar înmulțirile matematice valide (cifre separate de *)
  // ex: "5 * 10" sau "5*10"
  const mathPlaceholder = '___MATH_MULT___';
  let processed = text.replace(/(\d+)\s*\*\s*(\d+)/g, `$1 ${mathPlaceholder} $2`);

  // Pasul 2: Eliminăm toate celelalte apariții de * (inclusiv **, *** etc.)
  processed = processed.replace(/\*+/g, '');

  // Pasul 3: Restaurăm semnul de înmulțire matematică
  processed = processed.replace(new RegExp(mathPlaceholder, 'g'), '×');

  return processed.trim();
}

/**
 * Componentă rafinată pentru afișarea conținutului cursului:
 * - Titluri îngroșate (font-black / font-extrabold)
 * - Background colorat translucid / pastelat pentru titluri
 * - Fără asteriscuri reziduale (*) din markdown/raw text
 * - Aranjament modern în pagină, spațiere aerisită și elemente vizuale de accent
 */
export default function FormattedContent({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let listItems = [];
  let keyIndex = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <div key={`list-wrap-${keyIndex++}`} className="my-5 bg-slate-50/50 rounded-2xl p-4 border border-slate-100/80">
          <ul className="space-y-3">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start text-slate-700 leading-relaxed text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500/80 mt-1.5 mr-3 flex-shrink-0 ring-4 ring-sky-100" />
                <span className="flex-1 font-medium">{cleanAsterisks(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
      listItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Titlu Principal Nivel 1 (# Titlu)
    if (trimmed.startsWith('# ')) {
      flushList();
      const text = cleanAsterisks(trimmed.replace(/^#\s+/, ''));
      elements.push(
        <div 
          key={keyIndex++} 
          className="mt-8 mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border-l-4 border-sky-600 shadow-sm"
        >
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
            {text}
          </h2>
        </div>
      );
    }
    // Titlu Secțiune Nivel 2 (## Subtitlu / Articol)
    else if (trimmed.startsWith('## ')) {
      flushList();
      const text = cleanAsterisks(trimmed.replace(/^##\s+/, ''));
      elements.push(
        <div 
          key={keyIndex++} 
          className="mt-7 mb-4 p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border-l-4 border-emerald-500"
        >
          <h3 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight flex items-center">
            {text}
          </h3>
        </div>
      );
    }
    // Titlu Sub-Secțiune Nivel 3 (### Punct procedural)
    else if (trimmed.startsWith('### ')) {
      flushList();
      const text = cleanAsterisks(trimmed.replace(/^###\s+/, ''));
      elements.push(
        <div 
          key={keyIndex++} 
          className="mt-6 mb-3 px-3.5 py-2 rounded-lg bg-indigo-500/10 inline-block border border-indigo-200/50"
        >
          <h4 className="text-xs sm:text-sm font-extrabold text-indigo-900 uppercase tracking-wider">
            {text}
          </h4>
        </div>
      );
    }
    // Liste cu marcatori (- sau * sau numere 1.)
    else if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
    }
    // Note de atenționare / Avertismente legale (> Notă)
    else if (trimmed.startsWith('>')) {
      flushList();
      const text = cleanAsterisks(trimmed.replace(/^>\s*/, ''));
      elements.push(
        <div 
          key={keyIndex++} 
          className="my-5 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-950 text-sm leading-relaxed shadow-sm font-medium"
        >
          {text}
        </div>
      );
    }
    // Paragraf standard cu interlinie și spațiere armonioasă
    else {
      flushList();
      const text = cleanAsterisks(trimmed);
      elements.push(
        <p key={keyIndex++} className="text-slate-700 leading-relaxed text-sm sm:text-base mb-4 text-justify font-normal">
          {text}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-2 text-slate-800">{elements}</div>;
}
