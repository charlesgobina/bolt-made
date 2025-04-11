import React from 'react';
import { Lightbulb } from 'lucide-react';

interface HintDisplayProps {
  answer: string;
  revealedIndices: number[];
  hintsRemaining: number;
  onRequestHint: () => void;
}

export function HintDisplay({ answer, revealedIndices, hintsRemaining, onRequestHint }: HintDisplayProps) {
  const displayText = answer.split('').map((char, index) => {
    if (char === ' ') return ' ';
    return revealedIndices.includes(index) ? char : '_';
  }).join('');

  return (
    <div className="text-center space-y-4">
      <div className="font-mono text-2xl tracking-wider">{displayText}</div>
      <button
        onClick={onRequestHint}
        disabled={hintsRemaining === 0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Lightbulb className="w-5 h-5" />
        <span>Hint ({hintsRemaining} left)</span>
      </button>
    </div>
  );
}