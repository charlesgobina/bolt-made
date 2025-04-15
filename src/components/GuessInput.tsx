import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { puzzles } from '../data/puzzles';

interface GuessInputProps {
  currentPuzzle: typeof puzzles[number];
  onSubmit: (guess: string) => void;
  disabled: boolean;
}

export function GuessInput({ currentPuzzle, onSubmit, disabled }: GuessInputProps) {
  const [guess, setGuess] = useState('');
  const [correctLetterCount, setCorrectLetterCount] = useState(0);
  
  // Calculate progress whenever guess changes
  useEffect(() => {
    if (!guess) {
      setCorrectLetterCount(0);
      return;
    }
    
    const answer = currentPuzzle.answer.toLowerCase();
    const guessLower = guess.toLowerCase();
    
    // Count how many characters from the guess appear in the answer
    let correctCount = 0;
    let answerCopy = answer;
    
    for (const char of guessLower) {
      if (answerCopy.includes(char)) {
        correctCount++;
        // Remove the first occurrence to avoid double counting
        answerCopy = answerCopy.replace(char, '');
      }
    }
    
    setCorrectLetterCount(correctCount);
  }, [guess, currentPuzzle.answer]);
  
  // Calculate percentage of correct letters
  const maxPossibleCorrect = currentPuzzle.answer.replace(/\s/g, '').length;
  const progressPercentage = Math.min(
    (correctLetterCount / maxPossibleCorrect) * 100, 
    100
  );
  
  // Determine color based on progress
  const getProgressColor = (percentage: number) => {
    if (percentage < 33) return 'rgba(239, 68, 68, 0.1)'; // red with opacity
    if (percentage < 66) return 'rgba(249, 115, 22, 0.1)'; // orange with opacity
    return 'rgba(34, 197, 94, 0.1)'; // green with opacity
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onSubmit(guess.trim().toLowerCase());
      setGuess('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{ zIndex: 0 }}
        >
          <div 
            className="h-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: getProgressColor(progressPercentage)
            }}
          />
        </div>
        
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your guess..."
          disabled={disabled}
          className="relative w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed bg-transparent"
          style={{ zIndex: 1, fontWeight: 'bold' }}
        />
        
        <button
          type="submit"
          disabled={disabled || !guess.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-purple-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors"
          style={{ zIndex: 2 }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}