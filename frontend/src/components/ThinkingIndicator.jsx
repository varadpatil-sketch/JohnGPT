import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const DEFAULT_PHRASES = [
  "Thinking...",
  "Analyzing context...",
  "Putting things together...",
  "Synthesizing response...",
  "Formulating ideas...",
  "Drafting answer...",
];

export default function ThinkingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentPhrase = DEFAULT_PHRASES[phraseIndex % DEFAULT_PHRASES.length];

  // Rotate thoughts smoothly every 2.4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % DEFAULT_PHRASES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Track elapsed seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mollie-thinking-container">
      <div className="mollie-thinking-orb">
        <Sparkles size={14} className="thinking-sparkle-icon" />
      </div>
      <div className="mollie-thinking-content">
        <span className="mollie-thinking-phrase" key={currentPhrase}>
          {currentPhrase}
        </span>
        {elapsedSeconds > 1 && (
          <span className="mollie-thinking-timer">{elapsedSeconds}s</span>
        )}
      </div>
    </div>
  );
}
