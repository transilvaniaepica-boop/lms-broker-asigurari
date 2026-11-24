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
 * Reconstruiește fluxul de text normal:
 * - Unește rândurile frânte artificial (de la extragerea tabelelor/PDF) într-o singură frază continuă.
 * - Fiecare frază / paragraf se extinde de la un capăt la celălalt al ecranului (w-full).
 * - O nouă linie începe doar când se termină o propoziție (. ! ?) sau când apare o etapă/titlu nou.
 */
function reflowBrokenLines(rawText) {
  if (!rawText) return [];

  const rawLines = rawText.split('\n');
  const normalizedBlocks = [];
  let currentSentence = '';

  const flushSentence = () => {
    if (currentSentence.trim()) {
      normalizedBlocks.push({ type: 'p', text: currentSentence.trim() });
      currentSentence = '';
    }
  };

  rawLines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // Dacă propoziția curentă se termină cu punct/semn de punctuație, o eliberăm ca paragraf complet
      if (currentSentence && /[.!?:]$/.test(currentSentence.trim())) {
        flushSentence();
      }
      return;
    }

    // Detectare Titluri Markdown (#, ##, ###)
    if (trimmed.startsWith('# ')) {
      flushSentence();
      normalizedBlocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') });
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushSentence();
      normalizedBlocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushSentence();
      normalizedBlocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      return;
    }

    // Detectare Citate / Avertismente (>)
    if (trimmed.startsWith('>')) {
      flushSentence();
      normalizedBlocks.push({ type: 'quote', text: trimmed.replace(/^>\s*/, '') });
      return;
    }

    // Detectare liste cu liniuță sau glonț (- sau *)
    if (/^[-*]\s+/.test(trimmed)) {
      flushSentence();
      normalizedBlocks.push({ type: 'li', text: trimmed.replace(/^[-*]\s+/, '') });
      return;
    }

    // Detectare Pași Procedurali / Cifre de etape (ex: "4", "5", "6", "Etapa 4", "Pasul 4")
    if (/^\d+$/.test(trimmed)) {
      flushSentence();
      currentSentence = `Etapa ${trimmed}: `;
      return;
    }
    if (/^\d+[\.\)]\s+/.test(trimmed)) {
      flushSentence();
      currentSentence = trimmed + ' ';
      return;
    }

    // Dacă avem deja text acumulat:
    if (currentSentence) {
      const prevTrimmed = currentSentence.trim();
      const endsWithSentencePunctuation = /[.!?]$/.test(prevTrimmed);
      const startsWithCapital = /^[A-ZĂÎÂȘȚ]/.test(trimmed);

      // Dacă propoziția anterioară s-a terminat cu punct și noul rând începe cu literă mare, facem un nou paragraf
      if (endsWithSentencePunctuation && startsWithCapital) {
        flushSentence();
        currentSentence = trimmed;
      } else {
        // Altfel, unim cuvintele într-un singur rând continuu
        currentSentence += ' ' + trimmed;
      }
    } else {
      currentSentence = trimmed;
    }
  });

  flushSentence();
  return normalizedBlocks;
}

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
        <p 
          key={keyIndex++} 
          className="w-full text-slate-800 leading-relaxed text-sm sm:text-base mb-4 text-justify font-normal"
          style={{ textJustify: 'inter-word' }}
        >
          {text}
        </p>
      );
    }
  });

  flushListBuffer();

  return <div className="space-y-3 text-slate-800 w-full">{elements}</div>;
}
