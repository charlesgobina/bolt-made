import React from 'react';

interface EmojiDisplayProps {
  emojis: string;
  category: string;
}

export function EmojiDisplay({ emojis, category }: EmojiDisplayProps) {
  return (
    <div className="text-center">
      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold mb-4">
        {category}
      </span>
      <div className="text-6xl md:text-7xl lg:text-8xl animate-bounce-slow">
        {emojis}
      </div>
    </div>
  );
}