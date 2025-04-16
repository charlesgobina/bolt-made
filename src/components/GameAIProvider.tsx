// src/components/GameAIProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiContentCache } from '../components/ai/services/aiCacheService';
import { AIEmojiPuzzle, ModeratorResponse, getAIHintForPuzzle } from '../components/ai/services/groqService';

interface GameAIContextType {
  loading: boolean;
  aiPuzzles: AIEmojiPuzzle[];
  getNextAIPuzzle: () => AIEmojiPuzzle | null;
  getModeratorResponse: (type: 'correct' | 'close' | 'wrong') => string;
  getAIHint: (correctAnswer: string, userGuess: string, category: string, callback: (hint: string) => void) => void;
  aiEnabled: boolean;
  toggleAI: () => void;
}

const GameAIContext = createContext<GameAIContextType>({
  loading: true,
  aiPuzzles: [],
  getNextAIPuzzle: () => null,
  getModeratorResponse: () => '',
  getAIHint: () => {},
  aiEnabled: true,
  toggleAI: () => {},
});

export const useGameAI = () => useContext(GameAIContext);

interface GameAIProviderProps {
  children: ReactNode;
}

export const GameAIProvider: React.FC<GameAIProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [aiPuzzles, setAIPuzzles] = useState<AIEmojiPuzzle[]>([]);
  const [moderatorResponses, setModeratorResponses] = useState<ModeratorResponse | null>(null);
  const [aiEnabled, setAIEnabled] = useState(true);
  const [hintCache, setHintCache] = useState<Record<string, string>>({});
  const [usedAnswers, setUsedAnswers] = useState<Set<string>>(new Set());

  // Initialize AI content on component mount
  useEffect(() => {
    // Try to load used answers from localStorage
    try {
      const storedUsedAnswers = localStorage.getItem('emojiGameUsedAnswers');
      if (storedUsedAnswers) {
        setUsedAnswers(new Set(JSON.parse(storedUsedAnswers)));
      }
    } catch (e) {
      console.error("Failed to load used answers:", e);
    }

    // Try to get default responses immediately
    const response = aiContentCache.getModeratorResponse();
    if (response) {
      setModeratorResponses(response);
    }
    
    // Try to load initial puzzles
    const loadInitialPuzzles = async () => {
      // Try to get 5 puzzles for immediate use
      const puzzles: AIEmojiPuzzle[] = [];
      
      for (let i = 0; i < 5; i++) {
        const puzzle = aiContentCache.getPuzzle();
        if (puzzle && isQualityPuzzle(puzzle)) {
          puzzles.push(puzzle);
        }
      }
      
      setAIPuzzles(puzzles);
      setLoading(false);
    };
    
    loadInitialPuzzles();
    
    // Set up a periodic cache check
    const intervalId = setInterval(() => {
      aiContentCache.ensurePuzzleCache();
      aiContentCache.ensureModeratorResponseCache();
      
      // Update moderator responses if we don't have any
      if (!moderatorResponses) {
        const response = aiContentCache.getModeratorResponse();
        if (response) {
          setModeratorResponses(response);
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Save used answers to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('emojiGameUsedAnswers', JSON.stringify(Array.from(usedAnswers)));
    } catch (e) {
      console.error("Failed to save used answers:", e);
    }
  }, [usedAnswers]);

  // Quality assessment function
  const isQualityPuzzle = (puzzle: AIEmojiPuzzle): boolean => {
    if (!puzzle) return false;

    // Check if answer has already been used
    if (usedAnswers.has(puzzle.answer.toLowerCase())) {
      return false;
    }

    // Check emoji count
    const emojiCount = countEmojis(puzzle.emojis);
    if (emojiCount < 3 || emojiCount > 5) {
      return false;
    }

    // Check for duplicate emojis in the same puzzle
    const uniqueEmojis = new Set(Array.from(puzzle.emojis).filter(c => isEmoji(c)));
    if (uniqueEmojis.size < emojiCount * 0.8) { // Allow some flexibility, but mostly unique
      return false;
    }

    // Check that the answer is not too short or too long
    if (puzzle.answer.length < 3 || puzzle.answer.length > 30) {
      return false;
    }

    return true;
  };

  // Helper function to count actual emojis in a string
  const countEmojis = (str: string): number => {
    const emojiRegex = /\p{Emoji}/gu;
    const matches = str.match(emojiRegex);
    return matches ? matches.length : 0;
  };

  // Helper function to check if a character is an emoji
  const isEmoji = (char: string): boolean => {
    const emojiRegex = /\p{Emoji}/u;
    return emojiRegex.test(char);
  };

  // Get the next AI puzzle
  const getNextAIPuzzle = (): AIEmojiPuzzle | null => {
    if (!aiEnabled) return null;
    
    // Check if we have puzzles in our state first
    if (aiPuzzles.length > 0) {
      // Find first quality puzzle
      const qualityPuzzleIndex = aiPuzzles.findIndex(isQualityPuzzle);
      
      if (qualityPuzzleIndex !== -1) {
        // Extract the puzzle and update the state
        const [nextPuzzle, ...remainingPuzzles] = aiPuzzles.filter((_, i) => i !== qualityPuzzleIndex);
        setAIPuzzles(remainingPuzzles);
        
        // Mark this answer as used
        setUsedAnswers(prev => new Set([...prev, nextPuzzle.answer.toLowerCase()]));
        
        return nextPuzzle;
      }
    }
    
    // Otherwise try to get one directly from cache
    let attempts = 0;
    let puzzle = null;
    
    // Try up to 3 times to get a quality puzzle
    while (attempts < 3) {
      puzzle = aiContentCache.getPuzzle();
      if (puzzle && isQualityPuzzle(puzzle)) {
        // Mark this answer as used
        setUsedAnswers(prev => new Set([...prev, puzzle!.answer.toLowerCase()]));
        break;
      }
      attempts++;
    }
    
    // Refill our state cache in the background if we're running low
    if (aiPuzzles.length < 3) {
      setTimeout(() => {
        const newPuzzles: AIEmojiPuzzle[] = [];
        for (let i = 0; i < 5; i++) {
          const puzzle = aiContentCache.getPuzzle();
          if (puzzle && isQualityPuzzle(puzzle)) {
            newPuzzles.push(puzzle);
          }
        }
        
        if (newPuzzles.length > 0) {
          setAIPuzzles(prev => [...prev, ...newPuzzles]);
        }
      }, 100);
    }
    
    return puzzle;
  };

  // Get a moderator response for the current feedback type
  const getModeratorResponse = (type: 'correct' | 'close' | 'wrong'): string => {
    if (!aiEnabled) {
      return type === 'correct' 
        ? 'Correct!' 
        : type === 'close' 
          ? 'Close!' 
          : 'Try again!';
    }
    
    // Try to use our current responses
    if (moderatorResponses && moderatorResponses[type]) {
      return moderatorResponses[type];
    }
    
    // Try to get new responses from cache
    const newResponses = aiContentCache.getModeratorResponse();
    if (newResponses) {
      setModeratorResponses(newResponses);
      return newResponses[type];
    }
    
    // Fallback responses
    return type === 'correct' 
      ? 'Brilliant! You nailed it!' 
      : type === 'close' 
        ? 'So close, keep trying!' 
        : 'Not quite, give it another shot!';
  };

  // Get an AI-generated hint for the current puzzle
  const getAIHint = (correctAnswer: string, userGuess: string, category: string, callback: (hint: string) => void): void => {
    if (!aiEnabled) {
      // Provide a simple hint if AI is disabled
      const simpleHint = "Think about what these emojis might represent together. Look for themes or connections.";
      callback(simpleHint);
      return;
    }
    
    // Create a cache key from the answer and guess
    const cacheKey = `${correctAnswer}|${userGuess}`;
    
    // Check if we already have a hint for this combination
    if (hintCache[cacheKey]) {
      callback(hintCache[cacheKey]);
      return;
    }
    
    // If we don't have a cached hint, generate one
    const placeholder = "I'm thinking of a clever hint for you...";
    callback(placeholder);
    
    // Generate hint in the background
    const generateHint = async () => {
      try {
        const hint = await getAIHintForPuzzle(correctAnswer, userGuess, category);
        const finalHint = hint || "Try focusing on what these emojis might represent when combined. Look for wordplay or connections between them.";
        
        // Update the cache
        setHintCache(prev => ({
          ...prev,
          [cacheKey]: finalHint
        }));
        
        // Call the callback with the new hint
        callback(finalHint);
      } catch (error) {
        console.error("Error generating hint:", error);
        callback("Focus on what the emojis mean as a combination, not individually.");
      }
    };
    
    generateHint();
  };

  // Toggle AI features on/off
  const toggleAI = () => {
    setAIEnabled(!aiEnabled);
  };

  return (
    <GameAIContext.Provider
      value={{
        loading,
        aiPuzzles,
        getNextAIPuzzle,
        getModeratorResponse,
        getAIHint,
        aiEnabled,
        toggleAI,
      }}
    >
      {children}
    </GameAIContext.Provider>
  );
};