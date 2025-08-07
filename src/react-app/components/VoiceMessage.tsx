import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceMessageProps {
  audioUrl: string;
  duration: number;
  isFromCurrentUser: boolean;
  timestamp: number;
}

export default function VoiceMessage({ 
  audioUrl, 
  duration, 
  isFromCurrentUser, 
  timestamp 
}: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [realDuration, setRealDuration] = useState(duration);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onloadstart = () => setIsLoading(true);
    audio.oncanplay = () => setIsLoading(false);
    audio.onloadedmetadata = () => {
      setRealDuration(audio.duration || duration);
    };
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const progressPercentage = realDuration > 0 ? (currentTime / realDuration) * 100 : 0;

  return (
    <div className={`
      flex items-center space-x-3 p-3 rounded-2xl max-w-xs
      ${isFromCurrentUser 
        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
        : 'bg-white/90 border border-white/20 text-gray-800'
      }
    `}>
      <button
        onClick={togglePlayback}
        disabled={isLoading}
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
          ${isFromCurrentUser
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-pink-100 hover:bg-pink-200 text-pink-600'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <Volume2 className="w-3 h-3 opacity-70" />
          <div className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-150 ${
                isFromCurrentUser ? 'bg-white/70' : 'bg-pink-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className={`text-xs font-mono ${
            isFromCurrentUser ? 'text-pink-100' : 'text-gray-500'
          }`}>
            {formatTime(currentTime)} / {formatTime(realDuration)}
          </div>
          
          {/* Animated sound waves when playing */}
          {isPlaying && (
            <div className="flex items-center space-x-0.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-all duration-150 ${
                    isFromCurrentUser ? 'bg-white/70' : 'bg-pink-400'
                  }`}
                  style={{
                    height: `${4 + Math.sin(Date.now() * 0.01 + i) * 3}px`,
                    animation: `voiceWave 1s infinite ease-in-out`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className={`text-xs mt-1 ${
          isFromCurrentUser ? 'text-pink-100' : 'text-gray-500'
        }`}>
          {formatTimestamp(timestamp)}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes voiceWave {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.5); }
          }
        `
      }} />
    </div>
  );
}
