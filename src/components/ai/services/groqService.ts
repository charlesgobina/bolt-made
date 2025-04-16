// src/services/groqService.ts
import { Groq } from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "",
  dangerouslyAllowBrowser: true,
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
    const prompt = `Create ${count} emoji puzzles for an emoji guessing game that are visually intuitive and fun to solve.

For each puzzle:
1. Choose a category from: Movies, TV Shows, Books, Famous Places, Food & Drink, Sports, Animals, Occupations, Hobbies, Transportation, Weather, Holidays, Fairy Tales, Inventions, or Music.

2. Select a specific, well-known answer within that category that can be represented through concrete visual elements (avoid abstract concepts).

3. Create a sequence of 2-5 emojis that:
   - Use only standard emojis available on all platforms
   - Represent literal objects, characters, or elements from the answer
   - Can be combined to form a visual story or representation
   - Avoid abstract symbols that require complex interpretation
   - Are arranged in a logical sequence that helps guide the player to the answer

Examples of good puzzles:
- Category: Movies, Answer: "Finding Nemo", Emojis: "🐠🔍🌊"
- Category: Food & Drink, Answer: "Peanut Butter & Jelly Sandwich", Emojis: "🥜🧈🍇🍞"
- Category: Sports, Answer: "Ice Hockey", Emojis: "🏒🥅❄️"

Format the response as a valid JSON array:
[
  {
    "category": "category name",
    "answer": "answer text",
    "emojis": "emoji sequence"
  }
]

Make sure each puzzle is solvable but provides just enough challenge to be engaging.`;

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

/**
 * Generate an AI hint for a puzzle based on user's guess
 */
export async function getAIHintForPuzzle(
  correctAnswer: string,
  userGuess: string,
  category: string
): Promise<string | null> {
  try {
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a helpful but indirect hint giver for an emoji guessing game. Your goal is to guide players toward the correct answer without giving it away completely."
        },
        {
          role: "user",
          content: `
            In an emoji guessing game, a player is trying to guess the answer to a puzzle.
            
            Category: ${category}
            Correct Answer: ${correctAnswer}
            Player's Guess: ${userGuess}
            
            Please provide a helpful hint that:
            1. Suggests a different angle to approach the puzzle
            2. Points out what their guess might be missing
            3. Provides a subtle clue without directly revealing the answer
            
            Keep the hint under 25 words, conversational, and encouraging.
          `
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Error generating AI hint:", error);
    return null;
  }
}

// Helper function to check if a string contains only emojis
function containsOnlyEmojis(str: string): boolean {
  // Basic emoji validation - this is a simplified check
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  return emojiRegex.test(str) && str.length <= 20;
}