import React, { useState, useEffect, useCallback } from 'react';
import { Timer } from './components/Timer';
import { EmojiDisplay } from './components/EmojiDisplay';
import { GuessInput } from './components/GuessInput';
import { HintDisplay } from './components/HintDisplay';
import { WaterSimulation } from './components/WaterSimulation';
import { Confetti } from './components/animations/Confetti';
import { Trophy, RefreshCw, Volume2, VolumeX, Zap, SkipForward, X, Lightbulb } from 'lucide-react';
import { GameAIProvider, useGameAI } from './components/GameAIProvider';

// Main app wrapped with the GameAIProvider
function App() {
  return (
    <GameAIProvider>
      <GameContent />
    </GameAIProvider>
  );
}

// Confirmation Modal Component
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Enable AI Mode
          </button>
        </div>
      </div>
    </div>
  );
}

// Interactive AI Hint Component
function AIHintModal({
  isOpen,
  onClose,
  hint
}: {
  isOpen: boolean;
  onClose: () => void;
  hint: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Hint
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <p className="text-gray-700 mb-6 italic">{hint}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

// Separate component for the game content to access the GameAIContext
function GameContent() {
  // Get AI features from context
  const {
    getNextAIPuzzle,
    getModeratorResponse,
    getAIHint,
    aiEnabled,
    toggleAI
  } = useGameAI();

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
  const [currentPuzzle, setCurrentPuzzle] = useState<any>(null);

  // For AI hints
  const [aiHint, setAiHint] = useState('');
  const [showAiHintModal, setShowAiHintModal] = useState(false);
  const [wrongGuessCount, setWrongGuessCount] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get a new AI puzzle
  const getNewPuzzle = useCallback(() => {
    const newPuzzle = getNextAIPuzzle();
    if (newPuzzle) {
      setCurrentPuzzle(newPuzzle);
      return true;
    }
    return false;
  }, [getNextAIPuzzle]);

  // Initialize the first puzzle when component mounts
  useEffect(() => {
    if (!currentPuzzle) {
      if (!getNewPuzzle()) {
        // If no puzzle is available, set game status to 'won' to show end screen
        setGameStatus('won');
      }
    }
  }, [currentPuzzle, getNewPuzzle]);

  useEffect(() => {
    if (timeLeft === 0 && gameStatus === 'playing') {
      setGameStatus('lost');
    }
  }, [timeLeft, gameStatus]);

  const handleGuess = (guess: string) => {
    if (!currentPuzzle) return;

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
      const moderatorResponse = getModeratorResponse('correct');
      setFeedback(`${moderatorResponse} +${puzzleScore} points`);
      setPuzzlesCompleted(puzzlesCompleted + 1);

      // Trigger confetti on correct answer
      setShowConfetti(true);

      // Play correct sound
      playSound('correct');

      // Reset wrong guess counter
      setWrongGuessCount(0);

      setTimeout(() => {
        // Get next AI puzzle
        if (!getNewPuzzle()) {
          setGameStatus('won');
        } else {
          setTimeLeft(60);
          setHintsRemaining(3);
          setRevealedIndices([]);
          setFeedback('');
          setShowConfetti(false);
        }
      }, 3000);
    } else if (correctWordCount > 0) {
      // Use AI moderator response for close answer
      const moderatorResponse = getModeratorResponse('close');
      setFeedback(`${moderatorResponse} You got ${correctWordCount} word(s) right`);

      // Play wrong sound for close answers
      playSound('wrong');

      // Increment wrong guess counter
      setWrongGuessCount(wrongGuessCount + 1);

      // Offer AI hint if they've made multiple wrong guesses
      if (wrongGuessCount >= 2) {
        // Initialize the hint with a placeholder
        setAiHint("I'm thinking of a clever hint for you...");

        // Show the hint modal after feedback clears
        setTimeout(() => {
          setShowAiHintModal(true);

          // Request the AI hint and update the modal when it's ready
          getAIHint(currentPuzzle.answer, guess, currentPuzzle.category, (hint) => {
            setAiHint(hint);
          });
        }, 3500);
      }

      // Clear feedback after 3 seconds for wrong answers
      setTimeout(() => {
        setFeedback('');
      }, 3000);
    } else {
      // Use AI moderator response for wrong answer
      const moderatorResponse = getModeratorResponse('wrong');
      setFeedback(moderatorResponse);

      // Play wrong sound
      playSound('wrong');

      // Increment wrong guess counter
      setWrongGuessCount(wrongGuessCount + 1);

      // Offer AI hint if they've made multiple wrong guesses
      if (wrongGuessCount >= 2) {
        // Initialize the hint with a placeholder
        setAiHint("I'm thinking of a clever hint for you...");
        
        // Show the hint modal after feedback clears
        setTimeout(() => {
          setShowAiHintModal(true);
          
          // Request the AI hint and update the modal when it's ready
          getAIHint(currentPuzzle.answer, guess, currentPuzzle.category, (hint) => {
            setAiHint(hint);
          });
        }, 3500);
      }

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

  const requestHint = () => {
    if (!currentPuzzle) return;

    playSound('hint');
    if (hintsRemaining > 0) {
      const unrevealedIndices = currentPuzzle.answer
        .split('')
        .map((_: string, i: number) => i)
        .filter((i: number) => !revealedIndices.includes(i) && currentPuzzle.answer[i] !== ' ');

      if (unrevealedIndices.length > 0) {
        const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        setRevealedIndices([...revealedIndices, randomIndex]);
        setHintsRemaining(hintsRemaining - 1);
      }
    }
  };

  const resetGame = () => {
    getNewPuzzle();
    setScore(0);
    setTimeLeft(60);
    setHintsRemaining(3);
    setRevealedIndices([]);
    setGameStatus('playing');
    setFeedback('');
    setShowConfetti(false);
    setPuzzlesCompleted(0);
    setWrongGuessCount(0);
  };

  const toggleSound = () => {
    setIsSoundOn(!isSoundOn);
  };

  // Skip current puzzle
  const skipPuzzle = () => {
    // Apply a small score penalty for skipping
    const skipPenalty = 10;
    if (score >= skipPenalty) {
      setScore(score - skipPenalty);
    }

    // Get next AI puzzle
    getNewPuzzle();

    // Reset for next puzzle
    setTimeLeft(60);
    setHintsRemaining(3);
    setRevealedIndices([]);
    setFeedback(`Skipped! -${skipPenalty} points`);
    setShowConfetti(false);
    setWrongGuessCount(0);

    // Clear feedback after 3 seconds
    setTimeout(() => {
      setFeedback('');
    }, 3000);
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
          <p className="text-lg text-gray-600">Puzzles Completed: {puzzlesCompleted}</p>
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

  if (!currentPuzzle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <p className="text-xl text-gray-700">Loading puzzles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      {/* AI Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={toggleAI}
        title="Enable AI Mode"
        message="This will hand over puzzle generation and moderation to AI. The AI will create unique puzzles and provide feedback on your answers. Do you want to continue?"
      />

      {/* AI Hint Modal */}
      <AIHintModal
        isOpen={showAiHintModal}
        onClose={() => setShowAiHintModal(false)}
        hint={aiHint}
      />

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
                onClick={() => {
                  setAiHint("I'm thinking of a clever hint for you...");
                  setShowAiHintModal(true);

                  // Get the latest guess from state or use an empty string if none
                  const latestGuess = ""; // You might need to track the latest guess in state

                  getAIHint(currentPuzzle.answer, latestGuess, currentPuzzle.category, (hint) => {
                    setAiHint(hint);
                  });
                }}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${wrongGuessCount >= 2 ? 'animate-pulse' : ''}`}
                title="Get AI Hint"
                disabled={wrongGuessCount < 2}
              >
                <Lightbulb className={`w-5 h-5 ${wrongGuessCount >= 2 ? 'text-yellow-500' : 'text-gray-300'}`} />
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
            <div className="flex w-full justify-center gap-4">
              <GuessInput
                onSubmit={handleGuess}
                disabled={gameStatus !== 'playing'}
                currentPuzzle={currentPuzzle}
              />

              {/* Skip button */}
              <button
                onClick={skipPuzzle}
                disabled={gameStatus !== 'playing'}
                className="flex items-center justify-center bg-purple-100 text-purple-600 font-semibold px-4 rounded-lg hover:bg-purple-200 transition-colors"
                title="Skip this puzzle (-10 points)"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {feedback && (
              <p className={`text-lg absolute bottom-5 pb-4 font-semibold ${feedback.includes('Correct') || feedback.includes('Brilliant') || feedback.includes('Amazing') ? 'text-green-500' :
                  feedback.includes('Close') || feedback.includes('Almost') ? 'text-yellow-500' :
                    'text-red-500'
                }`}>
                {feedback}
              </p>
            )}
          </div>

          <div className="text-center text-sm text-gray-500 mt-8">
            <span className="inline-flex items-center gap-1">
              AI-Generated Puzzle <Zap className="w-3 h-3 text-purple-500" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;