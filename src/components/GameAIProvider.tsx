// src/components/GameAIProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiContentCache } from '../components/ai/services/aiCacheService';
import { AIEmojiPuzzle, ModeratorResponse } from '../components/ai/services/groqService';

interface GameAIContextType {
  loading: boolean;
  aiPuzzles: AIEmojiPuzzle[];
  getNextAIPuzzle: () => AIEmojiPuzzle | null;
  getModeratorResponse: (type: 'correct' | 'close' | 'wrong') => string;
  aiEnabled: boolean;
  toggleAI: () => void;
}

const GameAIContext = createContext<GameAIContextType>({
  loading: true,
  aiPuzzles: [],
  getNextAIPuzzle: () => null,
  getModeratorResponse: () => '',
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

  // Initialize AI content on component mount
  useEffect(() => {
    // Try to get default responses immediately
    const response = aiContentCache.getModeratorResponse();
    if (response) {
      setModeratorResponses(response);
    }
    
    // Try to load initial puzzles
    const loadInitialPuzzles = async () => {
      // Try to get 3 puzzles for immediate use
      const puzzles: AIEmojiPuzzle[] = [];
      
      for (let i = 0; i < 3; i++) {
        const puzzle = aiContentCache.getPuzzle();
        if (puzzle) {
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

  // Get the next AI puzzle
  const getNextAIPuzzle = (): AIEmojiPuzzle | null => {
    if (!aiEnabled) return null;
    
    // Check if we have puzzles in our state first
    if (aiPuzzles.length > 0) {
      const [nextPuzzle, ...remainingPuzzles] = aiPuzzles;
      setAIPuzzles(remainingPuzzles);
      return nextPuzzle;
    }
    
    // Otherwise try to get one directly from cache
    return aiContentCache.getPuzzle();
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
        aiEnabled,
        toggleAI,
      }}
    >
      {children}
    </GameAIContext.Provider>
  );
};