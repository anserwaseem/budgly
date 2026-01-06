import { useState, useEffect, useCallback, useRef } from "react";
import { haptic } from "@/lib/utils";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  onResult,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStoppingIntentionallyRef = useRef(false);

  // Use refs for callbacks to avoid recreating recognition on every render
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (
        window as Window & {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (
        window as Window & {
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;

    const supported = !!SpeechRecognitionAPI;
    setIsSupported(supported);

    if (!supported) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech recognized:", transcript);
      haptic("success");
      onResultRef.current?.(transcript);
      // explicitly stop recognition after getting result
      recognition.stop();
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);

      // ignore errors when stopping intentionally (like "aborted")
      if (isStoppingIntentionallyRef.current) {
        isStoppingIntentionallyRef.current = false;
        setIsListening(false);
        return;
      }

      haptic("error");
      onErrorRef.current?.(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
    };
  }, []); // Empty deps - only create once

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.error("Speech recognition not initialized");
      return;
    }

    haptic("medium");
    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log("Speech recognition started");
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      // If already started, stop and restart
      if ((e as Error).message?.includes("already started")) {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
          setIsListening(true);
        }, 100);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // mark as intentional stop to avoid error toast
    isStoppingIntentionallyRef.current = true;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
