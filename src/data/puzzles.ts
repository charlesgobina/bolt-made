export interface Puzzle {
  emojis: string;
  answer: string;
  category: 
    'Movies' | 'Phrases' | 'Concepts' | 'Books' | 'Famous People' | 
    'Brands' | 'Song Titles' | 'TV Shows' | 'Food & Drink' | 'Idioms' |
    'Historical Events' | 'Technology Terms' | 'Sports' | 'Science' | 'Geography';
}

export const puzzles: Puzzle[] = [
  { emojis: '🧙‍♂️💍🗻🔥👁️', answer: 'lord of the rings', category: 'Movies' },
  { emojis: '🦁👑', answer: 'the lion king', category: 'Movies' },
  { emojis: '🌹👻', answer: 'beauty and the beast', category: 'Movies' },
  { emojis: '🚢❄️💔', answer: 'titanic', category: 'Movies' },
  { emojis: '👻👻🔫', answer: 'ghostbusters', category: 'Movies' },
  { emojis: '🕷️🧑', answer: 'spiderman', category: 'Movies' },
  { emojis: '🎭🃏', answer: 'joker', category: 'Movies' },
  { emojis: '⏰🐰🫖', answer: 'alice in wonderland', category: 'Movies' },
  { emojis: '🧊👸', answer: 'frozen', category: 'Movies' },
  { emojis: '🔨⚡️🏹', answer: 'thor', category: 'Movies' },
  { emojis: '🌟⚔️', answer: 'star wars', category: 'Movies' },
  { emojis: '🧠💭💰', answer: 'money talks', category: 'Phrases' },
  { emojis: '⏰💰', answer: 'time is money', category: 'Phrases' },
  { emojis: '🌳🍎📱', answer: 'apple', category: 'Concepts' },
  { emojis: '📱💬', answer: 'social media', category: 'Concepts' },
  { emojis: '☁️💻', answer: 'cloud computing', category: 'Concepts' },
  { emojis: '🤖💡', answer: 'artificial intelligence', category: 'Concepts' },
  { emojis: '🌍🌡️☀️', answer: 'global warming', category: 'Concepts' },
  { emojis: '🔒💻', answer: 'cyber security', category: 'Concepts' },
  { emojis: '📱💳', answer: 'digital payment', category: 'Concepts' },
  { emojis: '🏰👸🐉', answer: 'shrek', category: 'Movies' },
  { emojis: '🦇👤🃏', answer: 'the dark knight', category: 'Movies' },
  { emojis: '👽📞🏠', answer: 'E.T.', category: 'Movies' },
  { emojis: '🦖🌴🏞️', answer: 'jurassic park', category: 'Movies' },
  { emojis: '👗👠💃', answer: 'cinderella', category: 'Movies' },

  // Books (5)
  { emojis: '👓⚡️', answer: 'harry potter', category: 'Books' },
  { emojis: '🐺👧🌹', answer: 'little red riding hood', category: 'Books' },
  { emojis: '🌍🐋', answer: 'moby dick', category: 'Books' },
  { emojis: '🎩🐇🕳️', answer: 'alice in wonderland', category: 'Books' },
  { emojis: '🕵️♂️🔍', answer: 'sherlock holmes', category: 'Books' },

  // Famous People (5)
  { emojis: '👑👸👸👸👸', answer: 'queen elizabeth ii', category: 'Famous People' },
  { emojis: '🎤🌍👑', answer: 'michael jackson', category: 'Famous People' },
  { emojis: '🚀👨🚀🌕', answer: 'neil armstrong', category: 'Famous People' },
  { emojis: '🎾👸', answer: 'serena williams', category: 'Famous People' },
  { emojis: '🎨👨🎨', answer: 'pablo picasso', category: 'Famous People' },

  // Brands (5)
  { emojis: '🍏⌚️', answer: 'apple watch', category: 'Brands' },
  { emojis: '🍟🔴', answer: 'mcdonalds', category: 'Brands' },
  { emojis: '👟⏩', answer: 'nike', category: 'Brands' },
  { emojis: '🚗🔌', answer: 'tesla', category: 'Brands' },
  { emojis: '📱❌', answer: 'xbox', category: 'Brands' },

  // Song Titles (5)
  { emojis: '🎤💃', answer: 'dancing queen', category: 'Song Titles' },
  { emojis: '🌧️👩', answer: 'rain on me', category: 'Song Titles' },
  { emojis: '🕺🎶', answer: 'uptown funk', category: 'Song Titles' },
  { emojis: '🚕💃', answer: 'despacito', category: 'Song Titles' },
  { emojis: '🔥🔥🔥', answer: 'firework', category: 'Song Titles' },

  // TV Shows (5)
  { emojis: '👨👩👧👦🍝', answer: 'the sopranos', category: 'TV Shows' },
  { emojis: '👑🎮', answer: 'the crown', category: 'TV Shows' },
  { emojis: '🔍🩸', answer: 'true blood', category: 'TV Shows' },
  { emojis: '🧟♂️🏙️', answer: 'the walking dead', category: 'TV Shows' },
  { emojis: '👽📡', answer: 'the x-files', category: 'TV Shows' },
];