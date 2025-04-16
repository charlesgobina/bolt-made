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
  private usedPuzzleRegistry: Set<string> = new Set(); // Track used puzzles
  private isGeneratingPuzzles = false;
  private isGeneratingResponses = false;
  private qualityThreshold = 3; // Minimum emojis required for a quality puzzle

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
    
    // Find a puzzle that hasn't been used before
    const unusedPuzzleIndex = this.puzzles.findIndex(item => 
      !this.usedPuzzleRegistry.has(this.createPuzzleKey(item.data))
    );
    
    // If all puzzles have been used, generate new ones
    if (unusedPuzzleIndex === -1) {
      console.warn("All puzzles have been used, regenerating");
      this.ensurePuzzleCache(true); // Force regeneration
      
      // Get the first available puzzle as fallback
      const puzzle = this.puzzles.shift();
      this.saveToStorage();
      
      if (puzzle) {
        // Mark this puzzle as used
        this.usedPuzzleRegistry.add(this.createPuzzleKey(puzzle.data));
        return puzzle.data;
      }
      
      return null;
    }
    
    // Get and remove the unused puzzle
    const [puzzle] = this.puzzles.splice(unusedPuzzleIndex, 1);
    this.saveToStorage();
    
    // Mark this puzzle as used
    this.usedPuzzleRegistry.add(this.createPuzzleKey(puzzle.data));
    
    // If running low on puzzles, generate more in the background
    if (this.puzzles.length < MIN_PUZZLES_IN_CACHE / 2) {
      this.ensurePuzzleCache();
    }
    
    return puzzle?.data || null;
  }

  // Create a unique key for a puzzle to track if it's been used
  private createPuzzleKey(puzzle: AIEmojiPuzzle): string {
    return `${puzzle.category}:${puzzle.answer.toLowerCase()}`;
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

  // Filter puzzles for quality
  private isQualityPuzzle(puzzle: AIEmojiPuzzle): boolean {
    // Must have minimum number of emojis
    if (countEmojis(puzzle.emojis) < this.qualityThreshold) {
      return false;
    }
    
    // Avoid duplicate emojis in the same puzzle
    const uniqueEmojis = new Set(Array.from(puzzle.emojis).filter(c => isEmoji(c)));
    if (uniqueEmojis.size < countEmojis(puzzle.emojis)) {
      return false;
    }
    
    // Avoid using puzzles we've seen before
    if (this.usedPuzzleRegistry.has(this.createPuzzleKey(puzzle))) {
      return false;
    }
    
    return true;
  }

  // Ensure we have enough puzzles in cache
  async ensurePuzzleCache(forceRegenerate: boolean = false): Promise<void> {
    if (this.isGeneratingPuzzles && !forceRegenerate) {
      return;
    }
    
    if (this.puzzles.length >= MIN_PUZZLES_IN_CACHE && !forceRegenerate) {
      return;
    }
    
    this.isGeneratingPuzzles = true;
    
    try {
      console.log("Generating new puzzles...");
      const puzzlesToGenerate = Math.max(MIN_PUZZLES_IN_CACHE - this.puzzles.length, 5);
      
      // Request extra puzzles to account for quality filtering
      const newPuzzles = await generateEmojiPuzzleBatch(puzzlesToGenerate * 2);
      
      if (newPuzzles && newPuzzles.length > 0) {
        // Filter for quality puzzles
        const qualityPuzzles = newPuzzles.filter(puzzle => this.isQualityPuzzle(puzzle));
        
        const currentTime = Date.now();
        this.puzzles.push(
          ...qualityPuzzles.map(puzzle => ({
            data: puzzle,
            timestamp: currentTime
          }))
        );
        
        this.saveToStorage();
        console.log(`Added ${qualityPuzzles.length} new quality puzzles to cache`);
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
      localStorage.setItem('emojiGameUsedPuzzles', JSON.stringify(Array.from(this.usedPuzzleRegistry)));
    } catch (error) {
      console.error("Error saving cache to storage:", error);
    }
  }

  // Load cache from localStorage
  private loadFromStorage(): void {
    try {
      const puzzleCache = localStorage.getItem('emojiGamePuzzleCache');
      const responseCache = localStorage.getItem('emojiGameResponseCache');
      const usedPuzzleRegistry = localStorage.getItem('emojiGameUsedPuzzles');
      
      if (puzzleCache) {
        this.puzzles = JSON.parse(puzzleCache);
      }
      
      if (responseCache) {
        this.moderatorResponses = JSON.parse(responseCache);
      }
      
      if (usedPuzzleRegistry) {
        this.usedPuzzleRegistry = new Set(JSON.parse(usedPuzzleRegistry));
      }
      
      console.log(`Loaded ${this.puzzles.length} puzzles, ${this.moderatorResponses.length} responses, and ${this.usedPuzzleRegistry.size} used puzzles from storage`);
    } catch (error) {
      console.error("Error loading cache from storage:", error);
    }
  }
}

// Helper functions for emoji quality checks
function isEmoji(char: string): boolean {
  const emojiRegex = /\p{Emoji}/u;
  return emojiRegex.test(char);
}

function countEmojis(str: string): number {
  return Array.from(str).filter(c => isEmoji(c)).length;
}

// Create and export a singleton instance
export const aiContentCache = new AIContentCache();