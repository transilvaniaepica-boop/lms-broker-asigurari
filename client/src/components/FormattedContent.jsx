import React from 'react';

/**
 * Elimină simbolurile `*` din text dacă nu reprezintă operație de înmulțire între numere (ex: 2 * 3).
 */
function cleanAsterisks(text) {
  if (!text || typeof text !== 'string') return text;
  const mathPlaceholder = '___MATH_MULT___';
  let processed = text.replace(/(\d+)\s*\*\s*(\d+)/g, `$1 ${mathPlaceholder} $2`);
  processed = processed.replace(/\*+/g, '');
  processed = processed.replace(new RegExp(mathPlaceholder, 'g'), '×');
  return processed.trim();
}

/**
 * Reconstruiește fluxul de text normal (dezlipește ruperile artificiale de rând generate de extragerea din PDF/tabele):
 * Unește rândurile frânte la mijlocul propoziției într-un text fluid și continuu pe tot rândul ecranului.
 */
function reflowBrokenLines(rawText) {
  if (!rawText) return [];

  const rawLines = rawText.split('\n');
  const normalizedBlocks = [];
  let currentParagraph = '';

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      normalizedBlocks.push({ type: 'p', text: currentParagraph.trim() });
      currentParagraph = '';
    }
  };

  rawLines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      return;
    }

    // Detectare Titlu Nivel 1
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      normalizedBlocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') });
      return;
    }

    // Detectare Titlu Nivel 2
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      normalizedBlocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
      return;
    }

    // Detectare Titlu Nivel 3
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      normalizedBlocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      return;
    }

    // Detectare Note / Citate
    if (trimmed.startsWith('>')) {
      flushParagraph();
      normalizedBlocks.push({ type: 'quote', text: trimmed.replace(/^>\s*/, '') });
      return;
    }

    // Detectare Rânduri de Listă (- sau * sau 1. etc.)
    if (/^[-*]\s+/.test(trimmed) || /^\d+[\.\)]\s+/.test(trimmed)) {
      flushParagraph();
      normalizedBlocks.push({ type: 'li', text: trimmed.replace(/^[-*]\s+|\d+[\.\)]\s+/, '') });
      return;
    }

    // Dacă este o continuare a unui rând anterior din PDF, unim cu spațiu
    if (currentParagraph) {
      // Dacă rândul curent începe cu o cifră izolată sau etapă nouă (ex: "4", "5", "6") o tratăm ca început nou
      if (/^\d+$/.test(trimmed)) {
        flushParagraph();
        currentParagraph = `Pasul / Etapa ${trimmed}: `;
      } else {
        currentParagraph += ' ' + trimmed;
      }
    } else {
      if (/^\d+$/.test(trimmed)) {
        currentParagraph = `Pasul / Etapa ${trimmed}: `;
      } else {
        currentParagraph = trimmed;
      }
    }
  });

  flushParagraph();
  return normalizedBlocks;
}

/**
 * Componentă rafinată pentru afișarea conținutului cursului:
 * - Fluidizează textul pe toată lățimea rândului (fără tăieri ciudate de la PDF)
 * - Titluri îngroșate (font-black / font-extrabold)
 * - Background colorat translucid / pastelat pentru titluri
 * - Fără asteriscuri reziduale (*)
 */
export default function FormattedContent({ content }) {
  if (!content) return null;

  const blocks = reflowBrokenLines(content);
  const elements = [];
  let listBuffer = [];
  let keyIndex = 0;

  const flushListBuffer = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <div key={`list-wrap-${keyIndex++}`} className="my-5 bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <ul className="space-y-3">
            {listBuffer.map((item, idx) => (
              <li key={idx} className="flex items-start text-slate-800 leading-relaxed text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1.5 mr-3 flex-shrink-0 ring-4 ring-sky-100" />
                <span className="flex-1 font-medium">{cleanAsterisks(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
      listBuffer = [];
    }
  };

  blocks.forEach((block) => {
    if (block.type === 'li') {
      listBuffer.push(block.text);
      return;
    }

    flushListBuffer();

    if (block.type === 'h1') {
      const text = cleanAsterisks(block.text);
      elements.push(
        <div 
          key={keyIndex++} 
          className="mt-8 mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border-l-4 border-sky-600 shadow-sm"
        >
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {text}
          </h2>
        </div>
      );
    } else if (block.type === 'h2') {
      const text = cleanAsterisks(block.text);
      elements.push(
        <div 
          key={keyIndex++} 
          className="mt-7 mb-4 p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border-l-4 border-emerald-500"
        >
          <h3 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight">
            {text}
          </h3>
        </div>
      );
    } else if (block.type === 'h3') {
      const text = cleanAsterisks(block.text);
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
    } else if (block.type === 'quote') {
      const text = cleanAsterisks(block.text);
      elements.push(
        <div 
          key={keyIndex++} 
          className="my-5 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-950 text-sm leading-relaxed shadow-sm font-semibold"
        >
          {text}
        </div>
      );
    } else if (block.type === 'p') {
      const text = cleanAsterisks(block.text);
      elements.push(
        <p key={keyIndex++} className="text-slate-800 leading-relaxed text-sm sm:text-base mb-4 text-justify font-normal tracking-normal">
          {text}
        </p>
      );
    }
  });

  flushListBuffer();

  return <div className="space-y-2 text-slate-800">{elements}</div>;
}
