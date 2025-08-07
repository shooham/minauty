import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Phone, PhoneOff, Wifi, WifiOff } from 'lucide-react';
import { UserData, UserID, Message, ConnectionState } from '@/shared/types';
import AnimatedBackground from '@/react-app/components/AnimatedBackground';
import VoiceRecorder from '@/react-app/components/VoiceRecorder';
import VoiceMessage from '@/react-app/components/VoiceMessage';
import { useOfflineMessages } from '@/react-app/hooks/useOfflineMessages';
import { usePresence } from '@/react-app/hooks/usePresence';

interface ChatProps {
  userData: UserData;
  targetID: UserID;
  onBack: () => void;
}

export default function Chat({ userData, targetID, onBack }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [targetDisplayName, setTargetDisplayName] = useState('');
  const [targetPresence, setTargetPresence] = useState<{ isOnline: boolean; lastSeen: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks for offline messaging and presence
  const { sendOfflineMessage } = useOfflineMessages({
    currentUserID: userData.userID,
    onMessage: (message) => {
      setMessages(prev => [...prev, message]);
    }
  });

  const { getPresence, formatLastSeen } = usePresence({
    currentUserID: userData.userID
  });

  useEffect(() => {
    // Simulate connection process
    setConnectionState('connecting');
    
    // Set target display name based on ID
    if (targetID === 'sweet-kitten-dance') {
      setTargetDisplayName('TestFriend');
    } else {
      // Generate a display name for other IDs
      setTargetDisplayName('Friend');
    }

    // Fetch target presence
    const fetchPresence = async () => {
      const presence = await getPresence(targetID);
      if (presence) {
        setTargetPresence({
          isOnline: presence.isOnline,
          lastSeen: presence.lastSeenAt
        });
      }
    };

    fetchPresence();

    // Simulate successful connection after 2 seconds
    const timer = setTimeout(() => {
      setConnectionState('connected');
      
      // Add a welcome message from the target
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        from: targetID,
        to: userData.userID,
        content: `Hey ${userData.displayName}! Welcome to our private chat. Messages sent while offline will be delivered when your friend comes back online.`,
        timestamp: Date.now(),
        type: 'text',
        delivered: true,
        read: true,
      };
      setMessages([welcomeMessage]);
    }, 2000);

    // Refresh presence every 2 minutes
    const presenceInterval = setInterval(fetchPresence, 120000);

    return () => {
      clearTimeout(timer);
      clearInterval(presenceInterval);
    };
  }, [targetID, userData, getPresence]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    const message: Message = {
      id: 'msg-' + Date.now(),
      from: userData.userID,
      to: targetID,
      content: messageContent,
      timestamp: Date.now(),
      type: 'text',
      delivered: false,
      read: false,
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, message]);

    // If target is offline or connection is not established, send as offline message
    if (connectionState !== 'connected' || !targetPresence?.isOnline) {
      const success = await sendOfflineMessage(targetID, messageContent);
      if (success) {
        // Update message as delivered
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, delivered: true } : msg
        ));
      }
    } else {
      // Send via WebRTC (simulate for now)
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, delivered: true } : msg
        ));
      }, 500);
    }

    // Simulate a response after 1-3 seconds (for demo)
    const responses = [
      "That's interesting!",
      "Tell me more about that.",
      "I see what you mean.",
      "Absolutely!",
      "That's a great point.",
      "I hadn't thought of it that way.",
      "Thanks for sharing that!",
    ];

    setTimeout(() => {
      const response: Message = {
        id: 'response-' + Date.now(),
        from: targetID,
        to: userData.userID,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
        type: 'text',
        delivered: true,
        read: true,
      };
      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 2000);
  };

  const handleVoiceMessage = (audioBlob: Blob, duration: number) => {
    if (connectionState !== 'connected') return;

    // Create audio URL for the voice message
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const message: Message = {
      id: 'voice-' + Date.now(),
      from: userData.userID,
      to: targetID,
      content: `Voice message (${Math.floor(duration)}s)`,
      timestamp: Date.now(),
      type: 'voice',
      delivered: true,
      read: false,
      audioUrl,
      duration,
    };

    setMessages(prev => [...prev, message]);

    // Simulate a voice response after 2-4 seconds (for demo)
    setTimeout(() => {
      // Create a simple response audio (in real app, this would be actual audio from peer)
      const responses = [
        "Thanks for the voice message!",
        "Got it, that's helpful.",
        "I hear you loud and clear!",
        "Great voice message!",
      ];
      
      const response: Message = {
        id: 'voice-response-' + Date.now(),
        from: targetID,
        to: userData.userID,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
        type: 'text',
        delivered: true,
        read: true,
      };
      setMessages(prev => [...prev, response]);
    }, 2000 + Math.random() * 2000);

    // Simulate a response after 1-3 seconds (for demo)
    const responses = [
      "That's interesting!",
      "Tell me more about that.",
      "I see what you mean.",
      "Absolutely!",
      "That's a great point.",
      "I hadn't thought of it that way.",
      "Thanks for sharing that!",
    ];

    setTimeout(() => {
      const response: Message = {
        id: 'response-' + Date.now(),
        from: targetID,
        to: userData.userID,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
        type: 'text',
        delivered: true,
        read: true,
      };
      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      
      {/* Header */}
      <div className="relative z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {targetDisplayName.slice(0, 2).toUpperCase()}
            </div>
            
            <div>
              <h1 className="font-semibold text-gray-800 dark:text-gray-100">{targetDisplayName}</h1>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connectionState === 'connecting' && 'Connecting...'}
                  {connectionState === 'connected' && targetPresence?.isOnline && (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Online
                    </>
                  )}
                  {connectionState === 'connected' && !targetPresence?.isOnline && targetPresence?.lastSeen && (
                    <>
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                      {formatLastSeen(targetPresence.lastSeen)}
                    </>
                  )}
                  {connectionState === 'failed' && 'Connection failed'}
                </p>
                {!targetPresence?.isOnline && (
                  <WifiOff className="w-3 h-3 text-gray-400" />
                )}
                {targetPresence?.isOnline && (
                  <Wifi className="w-3 h-3 text-green-500" />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {connectionState === 'connected' ? (
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <Phone className="w-5 h-5 text-green-600" />
              </button>
            ) : (
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <PhoneOff className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {connectionState === 'connecting' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-pink-200 dark:border-pink-800 border-t-pink-500 dark:border-t-pink-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Establishing secure connection...</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.from === userData.userID ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'voice' && message.audioUrl ? (
                <VoiceMessage
                  audioUrl={message.audioUrl}
                  duration={message.duration || 0}
                  isFromCurrentUser={message.from === userData.userID}
                  timestamp={message.timestamp}
                />
              ) : (
                <div className="flex flex-col">
                  {/* Offline message indicator */}
                  {(message as any).isOfflineMessage && (
                    <div className="text-center mb-2">
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                        📦 Offline Message
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.from === userData.userID
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                        : 'bg-white/90 dark:bg-gray-700/90 border border-white/20 dark:border-gray-600/20 text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        message.from === userData.userID ? 'text-pink-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                      {message.from === userData.userID && (
                        <span className={`text-xs ${
                          message.delivered ? 'text-pink-200' : 'text-pink-300'
                        }`}>
                          {message.delivered ? '✓' : '⏳'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="relative z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <VoiceRecorder 
              onVoiceMessage={handleVoiceMessage}
              disabled={false}
            />
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={targetPresence?.isOnline ? 'Type a message...' : 'Message will be delivered when online...'}
              className="flex-1 px-4 py-3 rounded-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800"
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`p-3 rounded-full transition-all duration-200 ${
                newMessage.trim()
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-lg hover:scale-105'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              🔒 {targetPresence?.isOnline 
                ? 'Messages are encrypted and will disappear when you close this chat'
                : 'Messages are encrypted and will be delivered when your friend comes online'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
