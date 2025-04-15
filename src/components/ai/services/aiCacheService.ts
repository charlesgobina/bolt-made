// src/services/cacheService.ts
import { AIEmojiPuzzle, ModeratorResponse, generateEmojiPuzzleBatch, generateModeratorResponses } from './groqService';

// Cache configuration
const MIN_PUZZLES_IN_CACHE = 10;
const MIN_RESPONSES_IN_CACHE = 5;
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedItem<T> {
  data: T;
  timestamp: number;
}

class AIContentCache {
  private puzzles: CachedItem<AIEmojiPuzzle>[] = [];
  private moderatorResponses: CachedItem<ModeratorResponse>[] = [];
  private isGeneratingPuzzles = false;
  private isGeneratingResponses = false;

  constructor() {
    // Load from localStorage on initialization
    this.loadFromStorage();
    
    // Initial fill of caches
    this.ensurePuzzleCache();
    this.ensureModeratorResponseCache();
  }

  // Get a puzzle from cache
  getPuzzle(): AIEmojiPuzzle | null {
    this.cleanCache();
    
    if (this.puzzles.length === 0) {
      console.warn("Puzzle cache empty, triggering regeneration");
      this.ensurePuzzleCache();
      return null;
    }
    
    // Get and remove first puzzle from cache
    const puzzle = this.puzzles.shift();
    this.saveToStorage();
    
    // If running low on puzzles, generate more in the background
    if (this.puzzles.length < MIN_PUZZLES_IN_CACHE / 2) {
      this.ensurePuzzleCache();
    }
    
    return puzzle?.data || null;
  }

  // Get moderator responses from cache
  getModeratorResponse(): ModeratorResponse | null {
    this.cleanCache();
    
    if (this.moderatorResponses.length === 0) {
      console.warn("Response cache empty, triggering regeneration");
      this.ensureModeratorResponseCache();
      return null;
    }
    
    // Get random response from cache (don't remove)
    const randomIndex = Math.floor(Math.random() * this.moderatorResponses.length);
    return this.moderatorResponses[randomIndex].data;
  }

  // Ensure we have enough puzzles in cache
  async ensurePuzzleCache(): Promise<void> {
    if (this.isGeneratingPuzzles || this.puzzles.length >= MIN_PUZZLES_IN_CACHE) {
      return;
    }
    
    this.isGeneratingPuzzles = true;
    
    try {
      console.log("Generating new puzzles...");
      const puzzlesToGenerate = MIN_PUZZLES_IN_CACHE - this.puzzles.length;
      const newPuzzles = await generateEmojiPuzzleBatch(puzzlesToGenerate);
      
      if (newPuzzles && newPuzzles.length > 0) {
        const currentTime = Date.now();
        this.puzzles.push(
          ...newPuzzles.map(puzzle => ({
            data: puzzle,
            timestamp: currentTime
          }))
        );
        
        this.saveToStorage();
        console.log(`Added ${newPuzzles.length} new puzzles to cache`);
      } else {
        console.error("Failed to generate new puzzles");
      }
    } catch (error) {
      console.error("Error generating puzzle cache:", error);
    } finally {
      this.isGeneratingPuzzles = false;
    }
  }

  // Ensure we have enough moderator responses in cache
  async ensureModeratorResponseCache(): Promise<void> {
    if (this.isGeneratingResponses || this.moderatorResponses.length >= MIN_RESPONSES_IN_CACHE) {
      return;
    }
    
    this.isGeneratingResponses = true;
    
    try {
      console.log("Generating new moderator responses...");
      const responsesToGenerate = MIN_RESPONSES_IN_CACHE - this.moderatorResponses.length;
      
      for (let i = 0; i < responsesToGenerate; i++) {
        const response = await generateModeratorResponses();
        
        if (response) {
          this.moderatorResponses.push({
            data: response,
            timestamp: Date.now()
          });
        }
      }
      
      this.saveToStorage();
      console.log(`Added ${responsesToGenerate} new responses to cache`);
    } catch (error) {
      console.error("Error generating response cache:", error);
    } finally {
      this.isGeneratingResponses = false;
    }
  }

  // Clean expired items from cache
  private cleanCache(): void {
    const now = Date.now();
    
    this.puzzles = this.puzzles.filter(
      item => now - item.timestamp < MAX_CACHE_AGE_MS
    );
    
    this.moderatorResponses = this.moderatorResponses.filter(
      item => now - item.timestamp < MAX_CACHE_AGE_MS
    );
    
    this.saveToStorage();
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('emojiGamePuzzleCache', JSON.stringify(this.puzzles));
      localStorage.setItem('emojiGameResponseCache', JSON.stringify(this.moderatorResponses));
    } catch (error) {
      console.error("Error saving cache to storage:", error);
    }
  }

  // Load cache from localStorage
  private loadFromStorage(): void {
    try {
      const puzzleCache = localStorage.getItem('emojiGamePuzzleCache');
      const responseCache = localStorage.getItem('emojiGameResponseCache');
      
      if (puzzleCache) {
        this.puzzles = JSON.parse(puzzleCache);
      }
      
      if (responseCache) {
        this.moderatorResponses = JSON.parse(responseCache);
      }
      
      console.log(`Loaded ${this.puzzles.length} puzzles and ${this.moderatorResponses.length} responses from storage`);
    } catch (error) {
      console.error("Error loading cache from storage:", error);
    }
  }
}

// Create and export a singleton instance
export const aiContentCache = new AIContentCache();