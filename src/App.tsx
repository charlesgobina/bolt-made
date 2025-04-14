import React, { useState, useEffect, useCallback } from 'react';
import { puzzles } from './data/puzzles';
import { Timer } from './components/Timer';
import { EmojiDisplay } from './components/EmojiDisplay';
import { GuessInput } from './components/GuessInput';
import { HintDisplay } from './components/HintDisplay';
import { WaterSimulation } from './components/WaterSimulation';
import { Trophy, RefreshCw } from 'lucide-react';

interface soundType {
  correct: HTMLAudioElement;
  wrong: HTMLAudioElement;
  hint: HTMLAudioElement;
  tick: HTMLAudioElement;
  timeUp: HTMLAudioElement;
  combo: HTMLAudioElement;
}

function App() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [feedback, setFeedback] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(true);

  const currentPuzzle = puzzles[currentPuzzleIndex];

  useEffect(() => {
    if (timeLeft === 0 && gameStatus === 'playing') {
      setGameStatus('lost');
    }
  }, [timeLeft, gameStatus]);

  const handleGuess = (guess: string) => {
    const correctWords = currentPuzzle.answer.split(' ');
    const guessWords = guess.split(' ');
    
    const correctWordCount = guessWords.filter(word => 
      correctWords.includes(word)
    ).length;
  
    if (guess === currentPuzzle.answer) {
      const timeBonus = Math.floor(timeLeft * 0.5);
      const hintPenalty = (3 - hintsRemaining) * 5;
      const puzzleScore = 100 + timeBonus - hintPenalty;
      
      setScore(score + puzzleScore);
      setFeedback(`Correct! +${puzzleScore} points`);
      
      if (currentPuzzleIndex === puzzles.length - 1) {
        setGameStatus('won');
      } else {
        setTimeout(() => {
          setCurrentPuzzleIndex(currentPuzzleIndex + 1);
          setTimeLeft(60);
          setHintsRemaining(3);
          setRevealedIndices([]);
          setFeedback('');
        }, 1500);
      }
    } else if (correctWordCount > 0) {
      setFeedback(`Close! You got ${correctWordCount} word(s) right`);
      // Clear feedback after 3 seconds for wrong answers
      setTimeout(() => {
        setFeedback('');
      }, 3000);
    } else {
      setFeedback('Try again!');
      // Clear feedback after 3 seconds for wrong answers
      setTimeout(() => {
        setFeedback('');
      }, 3000);
    }
  };

  const [sounds] = useState<Record<string, HTMLAudioElement>>(() => ({
    correct: new Audio('/sounds/correct.mp3'),
    wrong: new Audio('/sounds/wrong.mp3'),
    hint: new Audio('/sounds/hint.mp3'),
    tick: new Audio('/sounds/tick.mp3'),
    timeUp: new Audio('/sounds/timeup.mp3'),
    combo: new Audio('/sounds/combo.mp3')
  }));

  const playSound = useCallback((soundName: keyof typeof sounds) => {
    if (!isSoundOn) return;
    
    const sound = sounds[soundName];
    if (sound) {
      // Reset the audio to the beginning if it's already playing
      sound.currentTime = 0;
      sound.play().catch(e => console.error("Error playing sound:", e));
    }
  }, [isSoundOn, sounds]);

  // // Add sound usage to feedback and game events
  // useEffect(() => {
  //   if (timeLeft === 0 && gameStatus === 'playing') {
  //     playSound('timeUp');
  //     setGameStatus('lost');
  //   }
  // }, [timeLeft, gameStatus, playSound]);

  // // paly sound on correct guess
  useEffect(() => {
    if (feedback.startsWith('Correct')) {
      playSound('correct');
    } else if (feedback.startsWith('Close')) {
      playSound('wrong');
    } else if (feedback.startsWith('Try again')) {
      playSound('wrong');
    }
  }, [feedback, playSound]);

  const requestHint = () => {
    playSound('hint');
    if (hintsRemaining > 0) {
      const unrevealedIndices = currentPuzzle.answer
        .split('')
        .map((_, i) => i)
        .filter(i => !revealedIndices.includes(i) && currentPuzzle.answer[i] !== ' ');
      
      if (unrevealedIndices.length > 0) {
        const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        setRevealedIndices([...revealedIndices, randomIndex]);
        setHintsRemaining(hintsRemaining - 1);
      }
    }
  };

  const resetGame = () => {
    setCurrentPuzzleIndex(0);
    setScore(0);
    setTimeLeft(60);
    setHintsRemaining(3);
    setRevealedIndices([]);
    setGameStatus('playing');
    setFeedback('');
  };

  if (gameStatus === 'won' || gameStatus === 'lost') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center space-y-6">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            {gameStatus === 'won' ? 'Congratulations!' : 'Game Over!'}
          </h1>
          <p className="text-xl text-gray-600">Final Score: {score}</p>
          <button
            onClick={resetGame}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative">
        <WaterSimulation timeLeft={timeLeft} />
        
        <div className="relative z-10 space-y-12">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-purple-500">Score: {score}</div>
            <Timer playSound={playSound} timeLeft={timeLeft} setTimeLeft={setTimeLeft} isActive={gameStatus === 'playing'} />
          </div>
          
          <EmojiDisplay 
            emojis={currentPuzzle.emojis} 
            category={currentPuzzle.category} 
          />
          
          <HintDisplay 
            answer={currentPuzzle.answer}
            revealedIndices={revealedIndices}
            hintsRemaining={hintsRemaining}
            onRequestHint={requestHint}
          />
          
          <div className="flex flex-col items-center gap-6 py-6">
            <GuessInput 
              onSubmit={handleGuess}
              disabled={gameStatus !== 'playing'}
              currentPuzzle={currentPuzzle}
            />
            
            {feedback && (
              <p className={`text-lg absolute bottom-5 pb-4 font-semibold ${
                feedback.startsWith('Correct') ? 'text-green-500' : 
                feedback.startsWith('Close') ? 'text-yellow-500' : 
                'text-red-500'
              }`}>
                {feedback}
              </p>
            )}
          </div>

          <div className="text-center text-sm text-gray-500 mt-8">
            Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;