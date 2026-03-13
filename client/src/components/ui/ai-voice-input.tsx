import { Mic, Square, AlertCircle, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onTranscript?: (text: string) => void;
  visualizerBars?: number;
  className?: string;
  language?: string;
}

export function AIVoiceInput({
  onStart,
  onStop,
  onTranscript,
  visualizerBars = 48,
  className,
  language = "en-IN"
}: AIVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heights, setHeights] = useState<number[]>(Array(visualizerBars).fill(20));

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const isRecordingRef = useRef(isRecording);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    setIsClient(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError("Speech recognition not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      
      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (onTranscriptRef.current) {
          onTranscriptRef.current(fullTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setError("Microphone access denied. Please check site permissions.");
        } else if (event.error === 'no-speech') {
          // Keep recording, but maybe show a subtle hint
        } else if (event.error === 'network') {
          setError("Network error. Speech recognition requires internet.");
        } else {
          setError(`Error: ${event.error}`);
        }
        
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        }
      };
      
      recognition.onend = () => {
        // Only restart if we're supposed to be recording and it wasn't a manual stop
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart recognition", e);
            setIsRecording(false);
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to initialize speech recognition", err);
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let visIntervalId: NodeJS.Timeout;

    if (isRecording) {
      setError(null);
      onStart?.();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch(e) {
          console.error("Start error:", e);
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch(e) {
          // Recognition might already be stopped
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
  }, [isRecording, visualizerBars]);

  const toggleRecording = () => {
    if (!isSupported) return;
    setIsRecording((prev) => !prev);
  };

  if (!isClient) return null;

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-start overflow-hidden px-2 h-8">
          {isRecording && (
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
          {!isRecording && error && (
            <div className="flex items-center gap-2 text-xs text-red-500 animate-in fade-in slide-in-from-left-2 transition-all">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          {!isRecording && !error && !isSupported && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info size={14} />
              <span>Use Chrome/Edge for voice input.</span>
            </div>
          )}
        </div>

        <button
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 group pointer-events-auto",
            isRecording
              ? "bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-900/30 shadow-inner"
              : isSupported 
                ? "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" 
                : "bg-slate-50 text-slate-300 cursor-not-allowed"
          )}
          type="button"
          onClick={toggleRecording}
          title={!isSupported ? "Not supported in this browser" : isRecording ? "Stop recording" : "Start voice-to-text"}
          disabled={!isSupported}
        >
          {isRecording ? (
            <Square className="w-4 h-4 fill-current animate-pulse" />
          ) : (
            <Mic className={cn(
              "w-5 h-5 transition-colors",
              isSupported && "group-hover:text-saffron-600 dark:group-hover:text-saffron-400"
            )} />
          )}
        </button>
      </div>
    </div>
  );
}
