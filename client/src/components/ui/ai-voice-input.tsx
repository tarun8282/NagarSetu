"use client";

import { Mic, Square } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onTranscript?: (text: string) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
}

export function AIVoiceInput({
  onStart,
  onStop,
  onTranscript,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(demoMode);
  const [heights, setHeights] = useState<number[]>(Array(visualizerBars).fill(20));

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submittedRef = useRef(submitted);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-IN"; // Set Indian English for better local recognition
        
        recognitionRef.current.onresult = (event: any) => {
          let text = "";
          for (let i = 0; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          if (onTranscriptRef.current) {
            onTranscriptRef.current(text);
          }
          
          // Reset the 2-minute auto-off timeout whenever voice is recognized
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            setSubmitted(false);
          }, 120000); // 2 minutes
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            setSubmitted(false);
          }
          // Do not toggle off on 'no-speech', 'aborted', or 'network'.
          // Let onend handle restarting if submittedRef is still true.
        };
        
        recognitionRef.current.onend = () => {
          // If browser naturally stops recognition but user hasn't stopped it manually, force restart it
          if (submittedRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error("Failed to restart recognition", e);
            }
          }
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let visIntervalId: NodeJS.Timeout;

    if (submitted) {
      onStart?.();
      
      // Start initial 2-minute silence timeout
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        setSubmitted(false);
      }, 120000);

      if (recognitionRef.current && !isDemo) {
        try {
          recognitionRef.current.start();
        } catch(e) {
          console.error(e);
        }
      }
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
      
      visIntervalId = setInterval(() => {
        setHeights(Array.from({ length: visualizerBars }).map(() => 20 + Math.random() * 80));
      }, 150);
    } else {
      if (time > 0) {
        onStop?.(time);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current && !isDemo) {
        try {
          recognitionRef.current.stop();
        } catch(e) {
          console.error(e);
        }
      }
      setTime(0);
      setHeights(Array(visualizerBars).fill(20));
    }

    return () => {
      clearInterval(intervalId);
      clearInterval(visIntervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, isDemo, visualizerBars]);

  useEffect(() => {
    if (!isDemo) return;

    let timeoutId: NodeJS.Timeout;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };

    const initialTimeout = setTimeout(runAnimation, 100);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo, demoInterval]);



  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setSubmitted(false);
    } else {
      setSubmitted((prev) => !prev);
    }
  };

  return (
    <div className={cn("w-full flex items-center justify-between gap-4", className)}>
      <div className="flex-1 flex items-center justify-start overflow-hidden px-2 h-8 mask-fade-right">
        {submitted && (
          <div className="flex items-center justify-between gap-[3px] w-full h-full overflow-hidden pr-4">
            {heights.map((h, i) => (
              <div
                key={i}
                className="flex-1 min-w-[2px] max-w-[4px] rounded-full bg-saffron-500 transition-all ease-in-out"
                style={{
                  height: `${h}%`,
                  transitionDuration: '150ms'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <button
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 group pointer-events-auto",
          submitted
            ? "bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 shadow-sm"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 shadow-sm"
        )}
        type="button"
        onClick={handleClick}
      >
        {submitted ? (
          <Square className="w-4 h-4 fill-current animate-pulse" />
        ) : (
          <Mic className="w-5 h-5 group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition-colors" />
        )}
      </button>
    </div>
  );
}
