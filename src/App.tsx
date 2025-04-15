import React, { useState, useEffect, useCallback } from 'react';
import { puzzles } from './data/puzzles';
import { Timer } from './components/Timer';
import { EmojiDisplay } from './components/EmojiDisplay';
import { GuessInput } from './components/GuessInput';
import { HintDisplay } from './components/HintDisplay';
import { WaterSimulation } from './components/WaterSimulation';
import { Confetti } from './components/animations/Confetti';
import { Trophy, RefreshCw, Volume2, VolumeX, Zap } from 'lucide-react';
import { GameAIProvider, useGameAI } from './components/GameAIProvider';

interface soundType {
  correct: HTMLAudioElement;
  wrong: HTMLAudioElement;
  hint: HTMLAudioElement;
  tick: HTMLAudioElement;
  timeUp: HTMLAudioElement;
  combo: HTMLAudioElement;
}

// Main app wrapped with the GameAIProvider
function App() {
  return (
    <GameAIProvider>
      <GameContent />
    </GameAIProvider>
  );
}

// Separate component for the game content to access the GameAIContext
function GameContent() {
  // Get AI features from context
  const { 
    getNextAIPuzzle, 
    getModeratorResponse, 
    aiEnabled, 
    toggleAI 
  } = useGameAI();

  // Track used puzzles to avoid repetition in a single game session
  const [usedPuzzleIndices, setUsedPuzzleIndices] = useState<number[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(-1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [feedback, setFeedback] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [puzzlesCompleted, setPuzzlesCompleted] = useState(0);
  
  // For AI puzzles
  const [currentAIPuzzle, setCurrentAIPuzzle] = useState<any>(null);
  const [usingAIPuzzle, setUsingAIPuzzle] = useState(false);

  // Function to get a random unused puzzle index
  const getRandomPuzzleIndex = useCallback(() => {
    // If all puzzles have been used, try AI puzzles or consider the game won
    if (usedPuzzleIndices.length >= puzzles.length) {
      if (aiEnabled) {
        // Try to get an AI puzzle
        const aiPuzzle = getNextAIPuzzle();
        if (aiPuzzle) {
          setCurrentAIPuzzle(aiPuzzle);
          setUsingAIPuzzle(true);
          return -1; // Signal that we're using an AI puzzle
        }
      }
      setGameStatus('won');
      return -1;
    }
    
    // Filter out already used indices
    const availableIndices = [...Array(puzzles.length).keys()]
      .filter(index => !usedPuzzleIndices.includes(index));
    
    // Select a random index from available ones
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    setUsingAIPuzzle(false);
    return randomIndex;
  }, [usedPuzzleIndices, aiEnabled, getNextAIPuzzle]);

  // Initialize the first puzzle when component mounts
  useEffect(() => {
    if (currentPuzzleIndex === -1) {
      // Randomly decide if we want to start with an AI puzzle (25% chance)
      const useAIPuzzle = aiEnabled && Math.random() < 0.95;
      
      if (useAIPuzzle) {
        const aiPuzzle = getNextAIPuzzle();
        if (aiPuzzle) {
          setCurrentAIPuzzle(aiPuzzle);
          setUsingAIPuzzle(true);
        } else {
          // Fallback to regular puzzle if AI puzzle not available
          const firstPuzzleIndex = getRandomPuzzleIndex();
          setCurrentPuzzleIndex(firstPuzzleIndex);
          setUsedPuzzleIndices([firstPuzzleIndex]);
        }
      } else {
        const firstPuzzleIndex = getRandomPuzzleIndex();
        setCurrentPuzzleIndex(firstPuzzleIndex);
        setUsedPuzzleIndices([firstPuzzleIndex]);
      }
    }
  }, [currentPuzzleIndex, getRandomPuzzleIndex, aiEnabled, getNextAIPuzzle]);

  // Get the current puzzle (either from predefined list or AI-generated)
  const currentPuzzle = usingAIPuzzle 
    ? currentAIPuzzle 
    : (currentPuzzleIndex >= 0 ? puzzles[currentPuzzleIndex] : puzzles[0]);

  useEffect(() => {
    if (timeLeft === 0 && gameStatus === 'playing') {
      setGameStatus('lost');
    }
  }, [timeLeft, gameStatus]);

  const handleGuess = (guess: string) => {
    const correctWords = currentPuzzle.answer.toLowerCase().split(' ');
    const guessWords = guess.toLowerCase().split(' ');
    
    const correctWordCount = guessWords.filter(word => 
      correctWords.includes(word)
    ).length;
  
    if (guess.toLowerCase() === currentPuzzle.answer.toLowerCase()) {
      const timeBonus = Math.floor(timeLeft * 0.5);
      const hintPenalty = (3 - hintsRemaining) * 5;
      const puzzleScore = 100 + timeBonus - hintPenalty;
      
      setScore(score + puzzleScore);
      
      // Use AI moderator response for correct answer
      const moderatorResponse = aiEnabled ? getModeratorResponse('correct') : 'Correct!';
      setFeedback(`${moderatorResponse} +${puzzleScore} points`);
      setPuzzlesCompleted(puzzlesCompleted + 1);
      
      // Trigger confetti on correct answer
      setShowConfetti(true);
      
      // Check if all puzzles have been used and no AI puzzles available
      if (usedPuzzleIndices.length >= puzzles.length - 1 && (!aiEnabled || !getNextAIPuzzle())) {
        setGameStatus('won');
      } else {
        setTimeout(() => {
          // Get next random puzzle that hasn't been used yet
          const nextPuzzleIndex = getRandomPuzzleIndex();
          
          if (!usingAIPuzzle) {
            setCurrentPuzzleIndex(nextPuzzleIndex);
            if (nextPuzzleIndex !== -1) {
              setUsedPuzzleIndices([...usedPuzzleIndices, nextPuzzleIndex]);
            }
          }
          
          setTimeLeft(60);
          setHintsRemaining(3);
          setRevealedIndices([]);
          setFeedback('');
          setShowConfetti(false);
        }, 3000);
      }
    } else if (correctWordCount > 0) {
      // Use AI moderator response for close answer
      const moderatorResponse = aiEnabled ? getModeratorResponse('close') : 'Close!';
      setFeedback(`${moderatorResponse} You got ${correctWordCount} word(s) right`);
      
      // Clear feedback after 3 seconds for wrong answers
      setTimeout(() => {
        setFeedback('');
      }, 3000);
    } else {
      // Use AI moderator response for wrong answer
      const moderatorResponse = aiEnabled ? getModeratorResponse('wrong') : 'Try again!';
      setFeedback(moderatorResponse);
      
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

  // Add sound usage to feedback and game events
  useEffect(() => {
    if (feedback.includes('Correct') || feedback.includes('Brilliant') || feedback.includes('Amazing')) {
      playSound('correct');
    } else if (feedback.includes('Close') || feedback.includes('Almost')) {
      playSound('wrong');
    } else if (feedback.includes('Try again') || feedback.includes('Not quite')) {
      playSound('wrong');
    }
  }, [feedback, playSound]);

  const requestHint = () => {
    playSound('hint');
    if (hintsRemaining > 0) {
      const unrevealedIndices = currentPuzzle.answer
          .split('')
          .map((_:string, i:number) => i)
          .filter((i: number) => !revealedIndices.includes(i) && currentPuzzle.answer[i] !== ' ');
      
      if (unrevealedIndices.length > 0) {
        const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        setRevealedIndices([...revealedIndices, randomIndex]);
        setHintsRemaining(hintsRemaining - 1);
      }
    }
  };

  const resetGame = () => {
    // Get a fresh random puzzle to start
    const useAIPuzzle = aiEnabled && Math.random() < 0.25;
    
    if (useAIPuzzle) {
      const aiPuzzle = getNextAIPuzzle();
      if (aiPuzzle) {
        setCurrentAIPuzzle(aiPuzzle);
        setUsingAIPuzzle(true);
      } else {
        // Fallback to regular puzzle if AI puzzle not available
        const firstPuzzleIndex = Math.floor(Math.random() * puzzles.length);
        setCurrentPuzzleIndex(firstPuzzleIndex);
        setUsedPuzzleIndices([firstPuzzleIndex]);
        setUsingAIPuzzle(false);
      }
    } else {
      const firstPuzzleIndex = Math.floor(Math.random() * puzzles.length);
      setCurrentPuzzleIndex(firstPuzzleIndex);
      setUsedPuzzleIndices([firstPuzzleIndex]);
      setUsingAIPuzzle(false);
    }
    
    setScore(0);
    setTimeLeft(60);
    setHintsRemaining(3);
    setRevealedIndices([]);
    setGameStatus('playing');
    setFeedback('');
    setShowConfetti(false);
    setPuzzlesCompleted(0);
  };

  const toggleSound = () => {
    setIsSoundOn(!isSoundOn);
  };

  if (gameStatus === 'won' || gameStatus === 'lost') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
        <Confetti 
          active={gameStatus === 'won'} 
          intensity="high"
          duration={6000}
        />
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 relative">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            {gameStatus === 'won' ? 'Congratulations!' : 'Game Over!'}
          </h1>
          <p className="text-xl text-gray-600">Final Score: {score}</p>
          {gameStatus === 'won' && (
            <p className="text-lg text-gray-600">You completed all the puzzles!</p>
          )}
          {gameStatus === 'lost' && (
            <p className="text-lg text-gray-600">Puzzles Completed: {puzzlesCompleted}</p>
          )}
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
        
        {/* Add confetti for correct answers */}
        <Confetti 
          active={showConfetti} 
          duration={3000}
          onComplete={() => setShowConfetti(false)}
        />
        
        <div className="relative z-10 space-y-12">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-purple-500">Score: {score}</div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleAI}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title={aiEnabled ? "AI Mode: On" : "AI Mode: Off"}
              >
                <Zap className={`w-5 h-5 ${aiEnabled ? 'text-purple-500' : 'text-gray-400'}`} />
              </button>
              <button 
                onClick={toggleSound}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                {isSoundOn ? (
                  <Volume2 className="w-5 h-5 text-purple-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <Timer 
                playSound={playSound} 
                timeLeft={timeLeft} 
                setTimeLeft={setTimeLeft} 
                isActive={gameStatus === 'playing'} 
              />
            </div>
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
                feedback.includes('Correct') || feedback.includes('Brilliant') || feedback.includes('Amazing') ? 'text-green-500' : 
                feedback.includes('Close') || feedback.includes('Almost') ? 'text-yellow-500' : 
                'text-red-500'
              }`}>
                {feedback}
              </p>
            )}
          </div>

          <div className="text-center text-sm text-gray-500 mt-8">
            {usingAIPuzzle ? (
              <span className="inline-flex items-center gap-1">
                AI-Generated Puzzle <Zap className="w-3 h-3 text-purple-500" />
              </span>
            ) : (
              `Puzzle ${puzzlesCompleted + 1} of ${puzzles.length}`
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;