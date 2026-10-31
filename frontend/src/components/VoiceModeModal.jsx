import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Square,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  PhoneOff,
} from "lucide-react";
import {
  createSpeechRecognizer,
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
} from "../utils/voice";

export default function VoiceModeModal({
  isOpen,
  onClose,
  onSendMessage,
  loading,
  currentMessages,
}) {
  const [voiceState, setVoiceState] = useState("listening"); // "listening" | "thinking" | "speaking" | "muted"
  const [transcript, setTranscript] = useState("");
  const [lastAssistantSpeech, setLastAssistantSpeech] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const recognizerRef = useRef(null);
  const cancelSpeechRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Sync with global loading state: when backend is generating, set "thinking"
  useEffect(() => {
    if (loading) {
      setVoiceState("thinking");
      stopSpeaking();
    }
  }, [loading]);

  // When a new assistant message arrives while in voice mode, speak it out!
  useEffect(() => {
    if (!isOpen) return;
    const lastMsg = currentMessages[currentMessages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && !lastMsg.isStreaming && lastMsg.content) {
      if (lastMsg.content !== lastAssistantSpeech) {
        setLastAssistantSpeech(lastMsg.content);
        setVoiceState("speaking");

        cancelSpeechRef.current = speakText(lastMsg.content, {
          onStart: () => {
            if (isComponentMounted.current) setVoiceState("speaking");
          },
          onEnd: () => {
            if (isComponentMounted.current) {
              setVoiceState("listening");
              startListening();
            }
          },
          onError: () => {
            if (isComponentMounted.current) {
              setVoiceState("listening");
              startListening();
            }
          },
        });
      }
    }
  }, [currentMessages, isOpen, lastAssistantSpeech]);

  const startListening = () => {
    if (isMuted || !isOpen) return;

    try {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
      }

      const recognizer = createSpeechRecognizer({
        onResult: (res) => {
          if (res.full) {
            setTranscript(res.full);
          }
          if (res.final && res.final.trim()) {
            handleUserSpokeFinal(res.final.trim());
          }
        },
        onError: (err) => {
          if (err.error !== "no-speech") {
            console.warn("Voice recognition error:", err.error);
          }
        },
        onEnd: () => {
          // If we are still supposed to be listening and not thinking/speaking, restart
          if (voiceState === "listening" && !isMuted && isOpen) {
            try {
              recognizer.start();
            } catch {}
          }
        },
        continuous: false,
      });

      recognizerRef.current = recognizer;
      recognizer.start();
      setVoiceState("listening");
    } catch (err) {
      setErrorMessage(err.message || "Failed to start microphone.");
    }
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.abort();
      } catch {}
      recognizerRef.current = null;
    }
  };

  const handleUserSpokeFinal = (spokenText) => {
    stopListening();
    stopSpeaking();
    setVoiceState("thinking");
    setTranscript(`"${spokenText}"`);
    onSendMessage(spokenText);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
      setVoiceState("muted");
    }
  };

  const handleInterruptSpeaking = () => {
    stopSpeaking();
    setVoiceState("listening");
    startListening();
  };

  const handleExitVoiceMode = () => {
    stopSpeaking();
    stopListening();
    onClose();
  };

  useEffect(() => {
    isComponentMounted.current = true;
    if (isOpen) {
      if (!isSpeechRecognitionSupported()) {
        setErrorMessage("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      } else {
        startListening();
      }
    } else {
      stopSpeaking();
      stopListening();
    }

    return () => {
      isComponentMounted.current = false;
      stopSpeaking();
      stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="voice-mode-backdrop fade-in">
      <div className="voice-mode-container">
        {/* Top Header */}
        <div className="voice-mode-header">
          <div className="voice-status-pill">
            <span className={`voice-state-dot state-${voiceState}`} />
            <span className="voice-state-label">
              {voiceState === "listening" && "Listening to you..."}
              {voiceState === "thinking" && "JohnGPT is thinking..."}
              {voiceState === "speaking" && "JohnGPT is speaking..."}
              {voiceState === "muted" && "Microphone paused"}
            </span>
          </div>

          <button
            className="btn-voice-close"
            onClick={handleExitVoiceMode}
            title="Exit Voice Mode"
          >
            <X size={20} />
          </button>
        </div>

        {/* Central Animated Neon Voice Orb */}
        <div className="voice-orb-wrapper">
          <div className={`voice-neon-orb state-${voiceState}`}>
            <div className="orb-core">
              <Sparkles size={36} className="orb-sparkle" />
            </div>
            <div className="orb-wave wave-1" />
            <div className="orb-wave wave-2" />
            <div className="orb-wave wave-3" />
          </div>
        </div>

        {/* Floating Captions */}
        <div className="voice-captions-box">
          {errorMessage ? (
            <p className="caption-text error-text">{errorMessage}</p>
          ) : voiceState === "speaking" ? (
            <p className="caption-text assistant-caption">
              "{lastAssistantSpeech.slice(0, 180)}..."
            </p>
          ) : transcript ? (
            <p className="caption-text user-caption">{transcript}</p>
          ) : (
            <p className="caption-text hint-caption">
              Speak naturally, JohnGPT is listening...
            </p>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="voice-controls-bar">
          <button
            className={`btn-voice-ctrl ${isMuted ? "muted" : "active"}`}
            onClick={handleToggleMute}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {voiceState === "speaking" && (
            <button
              className="btn-voice-ctrl interrupt"
              onClick={handleInterruptSpeaking}
              title="Interrupt & Speak"
            >
              <Square size={20} fill="currentColor" />
            </button>
          )}

          <button
            className="btn-voice-ctrl end-call"
            onClick={handleExitVoiceMode}
            title="End Voice Call"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
