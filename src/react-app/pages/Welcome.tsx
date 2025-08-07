import { useState, useEffect } from 'react';
import { ArrowRight, MessageCircle, LogIn } from 'lucide-react';
import { UserData, UserID } from '@/shared/types';
import { UserManager } from '@/react-app/utils/userManager';
import { ValidationUtils } from '@/react-app/utils/validation';
import AnimatedBackground from '@/react-app/components/AnimatedBackground';

interface WelcomeProps {
  onComplete: (userData: UserData) => void;
}

export default function Welcome({ onComplete }: WelcomeProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [step, setStep] = useState<'welcome' | 'setup' | 'login' | 'ready'>('welcome');
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [loginID, setLoginID] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Check for existing user
    const existing = UserManager.loadUserData();
    const isConfirmed = UserManager.hasConfirmedIDSaved();
    
    if (existing && ValidationUtils.validateUserID(existing.userID) && isConfirmed) {
      // Returning user - show welcome back briefly then proceed
      setUserData(existing);
      setStep('ready');
      setTimeout(() => onComplete(existing), 1500);
    }
  }, [onComplete]);

  const handleGetStarted = () => {
    const newUser = UserManager.createNewUser();
    setUserData(newUser);
    setStep('setup');
  };

  const handleLogin = () => {
    setStep('login');
  };

  const handleLoginSubmit = () => {
    const cleanID = loginID.toLowerCase().replace(/\s+/g, '-').trim();
    setLoginError('');

    if (!ValidationUtils.validateUserID(cleanID)) {
      setLoginError('Please enter a valid 3-word ID like "happy-kitten-dance"');
      return;
    }

    const userData = UserManager.loginWithID(cleanID as UserID);
    if (userData) {
      UserManager.confirmIDSaved();
      onComplete(userData);
    } else {
      setLoginError('Could not find that ID. Please check and try again.');
    }
  };

  const handleConfirmAndStart = () => {
    if (!hasConfirmed || !userData) return;
    
    UserManager.confirmIDSaved();
    onComplete(userData);
  };

  const handleTryTestFriend = () => {
    const newUser = UserManager.createNewUser();
    setUserData(newUser);
    UserManager.confirmIDSaved();
    onComplete(newUser);
  };

  // Returning user welcome
  if (step === 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AnimatedBackground />
        <div className="text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-6 animate-bounce">
              {userData?.displayName.slice(0, 2).toUpperCase()}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome back!
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {userData?.displayName}
            </p>
            <div className="text-green-600 font-medium">
              Taking you to your chats...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-purple-900">
      <AnimatedBackground />
      
      <div className="w-full max-w-md mx-auto">
        {step === 'welcome' ? (
          /* Main Welcome Screen - Simplified */
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl mb-6 shadow-lg">
              <MessageCircle className="w-8 h-8" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                minauty
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Private chat that disappears
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleGetStarted}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
              
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                <div className="flex items-center justify-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>I have an ID</span>
                </div>
              </button>
            </div>

            {/* Quick test option */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Just want to test?</p>
              <button
                onClick={handleTryTestFriend}
                className="text-sm px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              >
                Try with test friend: sweet-kitten-dance
              </button>
            </div>
          </div>
        ) : step === 'login' ? (
          /* Login Screen */
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Enter Your ID
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Type your 3-word chat ID
              </p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={loginID}
                onChange={(e) => setLoginID(e.target.value)}
                placeholder="happy-kitten-dance"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 text-center text-lg"
              />
              
              {loginError && (
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{loginError}</p>
              )}
              
              <button
                onClick={handleLoginSubmit}
                disabled={!loginID.trim()}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                  loginID.trim()
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
              
              <button
                onClick={() => setStep('welcome')}
                className="w-full py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          /* Setup Your ID Screen - Simplified */
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg mb-4">
                {userData?.displayName.slice(0, 2).toUpperCase()}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                You're {userData?.displayName}!
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your chat ID is:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {userData?.userID}
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(userData?.userID || '');
                    } catch (error) {
                      console.error('Failed to copy:', error);
                    }
                  }}
                  className="px-3 py-1 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Save this ID!</strong> You'll need it to chat again later.
              </p>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 text-pink-500 rounded focus:ring-pink-200 dark:focus:ring-pink-800"
              />
              <span className="text-gray-700 dark:text-gray-300 text-sm">
                I've saved my ID and I'm ready to chat
              </span>
            </label>

            <button
              onClick={handleConfirmAndStart}
              disabled={!hasConfirmed}
              className={`w-full py-3 font-medium rounded-xl transition-all duration-200 ${
                hasConfirmed
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Start Chatting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
