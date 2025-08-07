import { useState, useEffect } from 'react';
import { UserData, ChatSession } from '@/shared/types';
import { UserManager } from '@/react-app/utils/userManager';
import AnimatedBackground from '@/react-app/components/AnimatedBackground';
import { Copy, LogOut, MessageCircle, Send, Mail } from 'lucide-react';
import { ValidationUtils } from '@/react-app/utils/validation';
import { useOfflineMessages } from '@/react-app/hooks/useOfflineMessages';
import { usePresence } from '@/react-app/hooks/usePresence';

interface DashboardProps {
  userData: UserData;
  onLogout: () => void;
  onStartChat: (targetID: string) => void;
}

export default function Dashboard({ userData, onLogout, onStartChat }: DashboardProps) {
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friendID, setFriendID] = useState('');
  const [connectError, setConnectError] = useState('');

  // Hooks for offline messaging and presence
  const { offlineCount } = useOfflineMessages({
    currentUserID: userData.userID,
    onMessage: () => {} // Messages handled in chat component
  });

  const { setOnline } = usePresence({
    currentUserID: userData.userID
  });

  useEffect(() => {
    // Load any existing chat sessions from sessionStorage
    const savedSessions = UserManager.loadSessionData('chat_sessions') || [];
    setActiveSessions(savedSessions);
    
    // Set user as online when accessing dashboard
    setOnline();
  }, [setOnline]);

  const handleConnect = () => {
    const cleanID = friendID.toLowerCase().replace(/\s+/g, '-').trim();
    setConnectError('');

    if (!ValidationUtils.validateUserID(cleanID)) {
      setConnectError('Please enter a valid 3-word ID');
      return;
    }

    if (cleanID === userData.userID) {
      setConnectError("You can't connect to yourself!");
      return;
    }

    setIsConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setFriendID('');
      onStartChat(cleanID);
    }, 1000);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout? Make sure you have saved your ID!')) {
      UserManager.clearSessionData();
      UserManager.clearUserData();
      onLogout();
    }
  };

  const handleCopyID = async () => {
    try {
      await navigator.clipboard.writeText(userData.userID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleQuickConnect = () => {
    const testFriend = UserManager.getTestFriend();
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      onStartChat(testFriend.userID);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-purple-900">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header - Simplified */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {userData.displayName.slice(0, 2).toUpperCase()}
              </div>
              {/* Offline messages indicator */}
              {offlineCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                  {offlineCount}
                </div>
              )}
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Hey, {userData.displayName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300">Ready to chat?</p>
              {offlineCount > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                  <Mail className="w-3 h-3" />
                  <span>{offlineCount} offline message{offlineCount !== 1 ? 's' : ''}</span>
                </p>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <LogOut className="w-4 h-4 inline mr-1" />
            Logout
          </button>
        </div>

        {/* Main Content - Simplified */}
        <div className="space-y-6">
          {/* Your ID Card - Compact */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
              Your Chat ID
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                {userData.userID}
              </div>
              <button
                onClick={handleCopyID}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Copied!' : 'Copy ID'}</span>
              </button>
            </div>
          </div>

          {/* Connect to Friend - Simplified */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
              Connect with a Friend
            </h2>
            
            <div className="space-y-4">
              <input
                type="text"
                value={friendID}
                onChange={(e) => setFriendID(e.target.value)}
                placeholder="happy-kitten-dance"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 text-center"
              />
              
              {connectError && (
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{connectError}</p>
              )}
              
              <button
                onClick={handleConnect}
                disabled={!friendID.trim() || isConnecting}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                  friendID.trim() && !isConnecting
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Start Chat</span>
                  </div>
                )}
              </button>

              {/* Quick test option */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Want to test?</p>
                <button
                  onClick={handleQuickConnect}
                  disabled={isConnecting}
                  className="text-sm px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  Connect to: sweet-kitten-dance
                </button>
              </div>
            </div>
          </div>

          {/* Active Chats */}
          {activeSessions.length > 0 && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Your Chats</span>
              </h2>
              
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div 
                    key={session.peerID}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => onStartChat(session.peerID)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {session.peerDisplayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 dark:text-gray-100 truncate">
                        {session.peerDisplayName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {session.connectionState === 'connected' ? (
                          <span className="text-green-600 dark:text-green-400">Connected</span>
                        ) : (
                          <span className="text-gray-400">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Note - Compact */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-pink-100 dark:border-pink-800 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              🔒 <strong>Private & Secure</strong> - Messages are encrypted and offline messages are delivered when friends come online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
