// src/services/groqService.ts
import { Groq } from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY || "",
});

// Default model - LLaMA3-8B is one of the most cost-effective
const DEFAULT_MODEL = "llama3-8b-8192";

export interface AIEmojiPuzzle {
  emojis: string;
  answer: string;
  category: string;
}

export interface ModeratorResponse {
  correct: string;
  close: string;
  wrong: string;
}

/**
 * Generate emojis for a specific answer and category
 */
export async function generateEmojiPuzzle(
  category: string,
  answer: string
): Promise<AIEmojiPuzzle | null> {
  try {
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an emoji game creator. Generate emojis that represent specific phrases or concepts."
        },
        {
          role: "user",
          content: `Create emojis to represent "${answer}" in the category "${category}". 
          Return ONLY 2-5 emojis without any explanation or additional text. 
          The emojis should be challenging but fair to guess.`
        }
      ],
      temperature: 0.7,
      max_tokens: 20,
    });

    const emojis = completion.choices[0]?.message?.content?.trim() || "";
    
    // Validate that we got actual emojis
    if (!emojis || !containsOnlyEmojis(emojis)) {
      console.error("Invalid emoji response from AI");
      return null;
    }

    return {
      emojis,
      answer,
      category,
    };
  } catch (error) {
    console.error("Error generating emoji puzzle:", error);
    return null;
  }
}

/**
 * Generate a batch of emoji puzzles for various categories
 */
export async function generateEmojiPuzzleBatch(
  count: number = 5
): Promise<AIEmojiPuzzle[]> {
  try {
    const prompt = `Create ${count} emoji puzzles for an emoji guessing game. 
    For each puzzle, provide:
    1. A category (choose from: Movies, Phrases, Concepts, Books, Famous People, Brands, Song Titles, TV Shows, Food & Drink, Idioms, Historical Events, Technology Terms, Sports, Science, Geography)
    2. The answer (a term, phrase, title, or name)
    3. 2-5 emojis that represent the answer

    Format the response as a valid JSON array: 
    [
      {
        "category": "category name",
        "answer": "answer text",
        "emojis": "emoji sequence"
      }
    ]`;

    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an emoji game creator. Generate fun and challenging emoji puzzles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "";
    
    try {
      const parsed = JSON.parse(content);
      const puzzles = parsed.puzzles || [];
      
      // Filter out any invalid puzzles
      return puzzles.filter((puzzle: any) => 
        puzzle.category && 
        puzzle.answer && 
        puzzle.emojis && 
        containsOnlyEmojis(puzzle.emojis)
      );
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return [];
    }
  } catch (error) {
    console.error("Error generating emoji puzzle batch:", error);
    return [];
  }
}

/**
 * Generate witty moderator responses for different game scenarios
 */
export async function generateModeratorResponses(): Promise<ModeratorResponse | null> {
  try {
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a witty game show host for an emoji guessing game. Create funny, short responses for different gameplay scenarios."
        },
        {
          role: "user",
          content: `Create three short, humorous responses for an emoji guessing game:
          1. When a player gets the answer correct
          2. When a player is close (has some words correct)
          3. When a player's guess is completely wrong
          
          Keep each response under 10 words and make them lighthearted and encouraging.
          Format as JSON with keys: correct, close, wrong.`
        }
      ],
      temperature: 0.8,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "";
    
    try {
      const responses = JSON.parse(content);
      if (responses.correct && responses.close && responses.wrong) {
        return responses as ModeratorResponse;
      }
      return null;
    } catch (error) {
      console.error("Error parsing moderator responses:", error);
      return null;
    }
  } catch (error) {
    console.error("Error generating moderator responses:", error);
    return null;
  }
}

// Helper function to check if a string contains only emojis
function containsOnlyEmojis(str: string): boolean {
  // Basic emoji validation - this is a simplified check
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  return emojiRegex.test(str) && str.length <= 20;
}