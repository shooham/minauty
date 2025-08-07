import { useState } from 'react';
import { Send, AlertCircle, Loader2 } from 'lucide-react';
import { UserID } from '@/shared/types';
import { ValidationUtils } from '@/react-app/utils/validation';

interface ConnectPanelProps {
  onConnect: (targetID: UserID) => void;
  isConnecting?: boolean;
  disabled?: boolean;
}

export default function ConnectPanel({ onConnect, isConnecting = false, disabled = false }: ConnectPanelProps) {
  const [inputID, setInputID] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateInput = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/\s+/g, '-').trim();
    setInputID(cleanValue);
    
    if (!cleanValue) {
      setError('');
      setIsValid(false);
      return;
    }

    if (!ValidationUtils.validateUserID(cleanValue)) {
      setError('Please enter 3 words like "happy-kitten-dance"');
      setIsValid(false);
      return;
    }

    setError('');
    setIsValid(true);
  };

  const handleConnect = () => {
    if (!isValid || isConnecting || disabled) return;

    // Check rate limiting
    if (ValidationUtils.checkRateLimit('connection_attempts', 5, 60000)) {
      setError('Too many attempts. Please wait a minute.');
      return;
    }

    onConnect(inputID as UserID);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isConnecting && !disabled) {
      handleConnect();
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
        Connect with a Friend
      </h2>

      <div className="space-y-4">
        {/* ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter their Chat ID
          </label>
          <input
            type="text"
            value={inputID}
            onChange={(e) => validateInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="happy-kitten-dance"
            disabled={disabled || isConnecting}
            className={`w-full px-4 py-3 rounded-xl border-2 text-center transition-all duration-200 
              ${isValid 
                ? 'border-green-300 bg-green-50 focus:border-green-500' 
                : error 
                  ? 'border-red-300 bg-red-50 focus:border-red-500'
                  : 'border-gray-200 bg-gray-50 focus:border-pink-500'
              } 
              ${disabled || isConnecting ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-pink-200'}
            `}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={!isValid || isConnecting || disabled}
          className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 transform
            ${isValid && !isConnecting && !disabled
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isConnecting ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Start Chatting</span>
            </div>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Ask your friend for their 3-word ID to connect instantly
        </p>
      </div>
    </div>
  );
}
