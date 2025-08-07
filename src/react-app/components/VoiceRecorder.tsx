import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceRecorderProps {
  onVoiceMessage: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onVoiceMessage, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize microphone access
  const initializeMicrophone = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      console.log('Microphone access granted');
      return stream;
    } catch (error) {
      console.error('Microphone access denied:', error);
      setHasPermission(false);
      return null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (disabled || isRecording) return;
    
    console.log('Starting recording...');
    let stream = streamRef.current;
    
    // Get microphone access if we don't have it
    if (!stream) {
      stream = await initializeMicrophone();
      if (!stream) return;
    }

    try {
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Create MediaRecorder with the best available format
      let mimeType = '';
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mimeType || 'audio/webm' 
        });
        
        console.log('Audio blob created:', audioBlob.size, 'bytes');
        
        // Calculate duration
        const duration = (Date.now() - startTimeRef.current) / 1000;
        
        // Only send if we have actual audio data
        if (audioBlob.size > 0 && duration > 0.1) {
          console.log('Sending voice message, duration:', duration);
          onVoiceMessage(audioBlob, duration);
        } else {
          console.warn('Recording too short or empty, not sending');
        }
        
        // Reset state
        setIsRecording(false);
        setRecordingTime(0);
        audioChunksRef.current = [];
      };
      
      // Start recording
      startTimeRef.current = Date.now();
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Start timer for UI
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 1000);
      
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, [disabled, isRecording, initializeMicrophone, onVoiceMessage]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    console.log('Stopping recording...');
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop the MediaRecorder
    try {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  }, [isRecording]);

  // Handle mouse/touch events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    startRecording();
  }, [startRecording]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    stopRecording();
  }, [stopRecording]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Request microphone permission on first interaction
  const handleFirstClick = useCallback(async () => {
    if (hasPermission === null) {
      await initializeMicrophone();
    }
  }, [hasPermission, initializeMicrophone]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (hasPermission === false) {
    return (
      <button
        disabled
        className="p-3 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        title="Microphone permission denied. Please refresh and allow microphone access."
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onPointerDown={hasPermission ? handlePointerDown : handleFirstClick}
        onPointerUp={hasPermission ? handlePointerUp : undefined}
        onPointerLeave={hasPermission ? handlePointerUp : undefined}
        disabled={disabled}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 select-none touch-none
          ${isRecording 
            ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/50 scale-110' 
            : 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${hasPermission === null ? 'animate-pulse' : ''}
        `}
        style={{ userSelect: 'none' }}
      >
        <Mic className="w-5 h-5 text-white" />
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap shadow-lg">
            🔴 {formatTime(recordingTime)}
          </div>
        )}
      </button>
      
      {/* Instructions */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {hasPermission === null && 'Tap to enable microphone'}
        {hasPermission && !isRecording && 'Hold to record'}
        {isRecording && 'Release to send'}
      </div>
    </div>
  );
}
