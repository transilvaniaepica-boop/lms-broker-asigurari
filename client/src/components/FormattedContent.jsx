import React from 'react';

/**
 * Componentă pentru afișarea estetică, aerisită și elegantă a conținutului Markdown/procedural
 * Formatează automat titlurile, listele, paragrafele, articolele de lege și tabelele
 */
export default function FormattedContent({ content }) {
  if (!content) return null;

  // Împărțim conținutul pe linii sau blocuri logice
  const lines = content.split('\n');
  const elements = [];
  let listItems = [];
  let keyIndex = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${keyIndex++}`} className="space-y-2.5 my-4 pl-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start text-slate-700 leading-relaxed text-sm">
              <span className="w-2 h-2 rounded-full bg-sky-500 mt-2 mr-3 flex-shrink-0 shadow-sm" />
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
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

    // Titlu Nivel 1 (# Titlu)
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={keyIndex++} className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-200 flex items-center">
          <span className="w-1.5 h-6 bg-sky-600 rounded-full mr-3" />
          {trimmed.replace(/^#\s+/, '')}
        </h2>
      );
    }
    // Titlu Nivel 2 (## Subtitlu sau Articol)
    else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={keyIndex++} className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full mr-2.5" />
          {trimmed.replace(/^##\s+/, '')}
        </h3>
      );
    }
    // Titlu Nivel 3 (### Secțiune)
    else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={keyIndex++} className="text-sm sm:text-base font-bold text-sky-900 mt-5 mb-2 uppercase tracking-wide">
          {trimmed.replace(/^###\s+/, '')}
        </h4>
      );
    }
    // Liste cu marcatori (- sau * sau numere 1.)
    else if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
    }
    // Mențiuni speciale / Note de atenție (> Notă)
    else if (trimmed.startsWith('>')) {
      flushList();
      elements.push(
        <div key={keyIndex++} className="my-4 p-4 rounded-xl bg-amber-50/70 border-l-4 border-amber-500 text-amber-900 text-sm leading-relaxed shadow-sm">
          {trimmed.replace(/^>\s*/, '')}
        </div>
      );
    }
    // Paragraf standard
    else {
      flushList();
      elements.push(
        <p key={keyIndex++} className="text-slate-700 leading-relaxed text-sm sm:text-base mb-4 text-justify font-normal">
          {trimmed}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-1 text-slate-800">{elements}</div>;
}
