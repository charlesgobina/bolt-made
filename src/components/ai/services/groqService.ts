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
          content: "You are an emoji game creator expert. Generate precise, descriptive emojis that represent specific phrases or concepts clearly."
        },
        {
          role: "user",
          content: `Create a sequence of 3-5 emojis to represent "${answer}" in the category "${category}".
          
          Requirements:
          - Focus on visual storytelling - each emoji should add meaning
          - Include distinctive details that differentiate this from similar concepts
          - Use emojis that represent key visual elements of the answer
          - Avoid repetitive or redundant emojis
          - The sequence should tell a story or represent components in a logical order
          
          Return ONLY the emojis without any explanation or additional text.`
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
    const prompt = `Create ${count} high-quality emoji puzzles for a guessing game. Each puzzle must use descriptive and distinctive emojis.

For each puzzle:
1. Choose a specific category from: Movies, TV Shows, Books, Famous Places, Food & Drink, Sports, Animals, Occupations, Hobbies, Transportation, Technology, Holidays, Fairy Tales, Inventions, Music, Historical Events, or Famous People.

2. Select a concrete, well-known answer within that category that has distinctive visual elements. Avoid generic or abstract concepts.

3. Create a sequence of 3-5 emojis that:
   - Tell a visual story that guides the player to the answer
   - Include specific details that make the answer unique and identifiable
   - Represent key components or visual elements of the answer
   - Use emojis in a logical sequence or relationship
   - Avoid using the same emoji twice in one puzzle

Quality Criteria:
- Emojis should be precise enough that once the answer is known, it makes perfect sense
- Each emoji should contribute meaningful information to the puzzle
- The combination should be distinctive enough to lead to exactly one answer
- The difficulty should be moderate - challenging but solvable

Format the response as a valid JSON object with a "puzzles" array:
{
  "puzzles": [
    {
      "category": "category name",
      "answer": "answer text",
      "emojis": "emoji sequence"
    }
  ]
}

Make each puzzle descriptive and memorable.`;

    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert emoji puzzle designer. You create highly descriptive, visually intuitive emoji sequences that represent concepts clearly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(content);
      const puzzles = parsed.puzzles || [];

      // Filter out any invalid puzzles or ones with insufficient emojis
      return puzzles.filter((puzzle: any) =>
        puzzle.category &&
        puzzle.answer &&
        puzzle.emojis &&
        containsOnlyEmojis(puzzle.emojis) &&
        countEmojis(puzzle.emojis) >= 3 && 
        countEmojis(puzzle.emojis) <= 5
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
  // Enhanced emoji validation
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  return emojiRegex.test(str) && str.length <= 30 && str.length > 0;
}

// Helper function to count actual emojis in a string
function countEmojis(str: string): number {
  const emojiRegex = /\p{Emoji}/gu;
  const matches = str.match(emojiRegex);
  return matches ? matches.length : 0;
}