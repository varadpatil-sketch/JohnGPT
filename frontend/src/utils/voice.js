// Web Speech API Utilities for Mollie AI Voice Mode

export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.speechSynthesis);
}

// Clean markdown syntax so spoken audio sounds natural
export function cleanTextForSpeech(text) {
  if (!text) return "";
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "Code omitted.")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown image/link tags
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Remove headers, bold, italics, strikethrough
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    // Remove blockquotes and list bullets
    .replace(/>\s+/g, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // Remove extra whitespaces
    .replace(/\s+/g, " ")
    .trim();
}

let activeUtterance = null;

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

// Speak text using browser speech synthesis with sentence chunking
export function speakText(text, { onStart, onEnd, onError, voiceName } = {}) {
  stopSpeaking();

  if (!isSpeechSynthesisSupported()) {
    if (onError) onError(new Error("Speech synthesis not supported in this browser"));
    return () => {};
  }

  const clean = cleanTextForSpeech(text);
  if (!clean) {
    if (onEnd) onEnd();
    return () => {};
  }

  // Get best available voice
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();

  let selectedVoice = null;
  if (voiceName) {
    selectedVoice = voices.find((v) => v.name.toLowerCase().includes(voiceName.toLowerCase()));
  }

  // Priority order for natural-sounding English voices
  if (!selectedVoice) {
    selectedVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Online"))) ||
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Jenny"))) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
  }

  // Split into sentences so Chromium doesn't time out on long paragraphs
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [clean];
  let sentenceIndex = 0;

  function speakNext() {
    if (sentenceIndex >= sentences.length) {
      activeUtterance = null;
      if (onEnd) onEnd();
      return;
    }

    const chunk = sentences[sentenceIndex].trim();
    if (!chunk) {
      sentenceIndex++;
      speakNext();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (sentenceIndex === 0 && onStart) onStart();
    };

    utterance.onend = () => {
      sentenceIndex++;
      speakNext();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis chunk error:", e);
      sentenceIndex++;
      speakNext();
    };

    activeUtterance = utterance;
    synth.speak(utterance);
  }

  // Handle asynchronous voice loading
  if (voices.length === 0) {
    synth.onvoiceschanged = () => {
      speakNext();
    };
  } else {
    speakNext();
  }

  return () => {
    stopSpeaking();
  };
}

// Create a Speech Recognition instance
export function createSpeechRecognizer({ onResult, onError, onEnd, continuous = false }) {
  if (!isSpeechRecognitionSupported()) {
    throw new Error("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
  }

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = continuous;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (onResult) {
      onResult({
        final: finalTranscript,
        interim: interimTranscript,
        full: (finalTranscript + " " + interimTranscript).trim(),
      });
    }
  };

  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
