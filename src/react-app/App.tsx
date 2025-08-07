import { useState, useEffect } from 'react';
import { UserData, UserID } from '@/shared/types';
import { UserManager } from '@/react-app/utils/userManager';
import Welcome from '@/react-app/pages/Welcome';
import Dashboard from '@/react-app/pages/Dashboard';
import Chat from '@/react-app/pages/Chat';
import ThemeToggle from '@/react-app/components/ThemeToggle';

type AppState = 'loading' | 'welcome' | 'dashboard' | 'chat';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [targetID, setTargetID] = useState<UserID | null>(null);

  useEffect(() => {
    // Check for existing user and confirmation
    const existing = UserManager.loadUserData();
    const isConfirmed = UserManager.hasConfirmedIDSaved();
    
    if (existing && isConfirmed) {
      setUserData(existing);
      setAppState('dashboard');
    } else {
      setAppState('welcome');
    }
  }, []);

  const handleWelcomeComplete = (user: UserData) => {
    setUserData(user);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    UserManager.clearUserData();
    setUserData(null);
    setAppState('welcome');
  };

  const handleStartChat = (target: string) => {
    setTargetID(target as UserID);
    setAppState('chat');
  };

  const handleBackToDashboard = () => {
    setTargetID(null);
    setAppState('dashboard');
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-purple-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 dark:border-pink-800 dark:border-t-pink-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading minauty...</p>
        </div>
      </div>
    );
  }

  if (appState === 'welcome') {
    return <Welcome onComplete={handleWelcomeComplete} />;
  }

  if (appState === 'dashboard' && userData) {
    return (
      <>
        <ThemeToggle />
        <Dashboard 
          userData={userData} 
          onLogout={handleLogout}
          onStartChat={handleStartChat}
        />
      </>
    );
  }

  if (appState === 'chat' && userData && targetID) {
    return (
      <Chat
        userData={userData}
        targetID={targetID}
        onBack={handleBackToDashboard}
      />
    );
  }

  return null;
}
