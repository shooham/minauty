import { useState, useEffect, useCallback } from 'react';
import { UserID } from '@/shared/types';

interface PresenceData {
  userID: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

interface UsePresenceProps {
  currentUserID: UserID;
}

export function usePresence({ currentUserID }: UsePresenceProps) {
  const [presenceCache, setPresenceCache] = useState<Map<string, { data: PresenceData; timestamp: number }>>(new Map());
  
  // Set user as online
  const setOnline = useCallback(async () => {
    if (!currentUserID) return;
    
    try {
      await fetch('/api/presence/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: currentUserID })
      });
    } catch (error) {
      console.error('Failed to set online status:', error);
    }
  }, [currentUserID]);

  // Set user as offline
  const setOffline = useCallback(async () => {
    if (!currentUserID) return;
    
    try {
      await fetch('/api/presence/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: currentUserID })
      });
    } catch (error) {
      console.error('Failed to set offline status:', error);
    }
  }, [currentUserID]);

  // Send heartbeat to maintain online status
  const sendHeartbeat = useCallback(async () => {
    if (!currentUserID) return;
    
    try {
      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: currentUserID })
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }, [currentUserID]);

  // Get presence for a specific user
  const getPresence = useCallback(async (userID: string): Promise<PresenceData | null> => {
    if (!userID) return null;
    
    // Check cache first (2 minute cache)
    const cached = presenceCache.get(userID);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < 120000) {
      return cached.data;
    }
    
    try {
      const response = await fetch(`/api/presence/${userID}`);
      const data = await response.json();
      
      if (response.ok) {
        const presenceData: PresenceData = {
          userID: data.userID,
          isOnline: data.isOnline,
          lastSeenAt: data.lastSeenAt
        };
        
        // Update cache
        setPresenceCache(prev => new Map(prev.set(userID, { 
          data: presenceData, 
          timestamp: now 
        })));
        
        return presenceData;
      }
    } catch (error) {
      console.error('Failed to fetch presence:', error);
    }
    
    return null;
  }, [presenceCache]);

  // Format last seen time
  const formatLastSeen = useCallback((lastSeenAt: string | null): string => {
    if (!lastSeenAt) return 'Never seen';
    
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) {
      return 'Last seen just now';
    } else if (diffMinutes < 60) {
      return `Last seen ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `Last seen ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Last seen yesterday';
    } else if (diffDays < 7) {
      return `Last seen ${diffDays} days ago`;
    } else {
      return `Last seen on ${lastSeen.toLocaleDateString()}`;
    }
  }, []);

  // Set up heartbeat interval and online/offline handlers
  useEffect(() => {
    if (!currentUserID) return;
    
    // Set online status on mount
    setOnline();
    
    // Set up heartbeat every 30 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);
    
    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };
    
    // Handle page unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status update
      navigator.sendBeacon('/api/presence/offline', JSON.stringify({ userID: currentUserID }));
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [currentUserID, setOnline, setOffline, sendHeartbeat]);

  return {
    setOnline,
    setOffline,
    sendHeartbeat,
    getPresence,
    formatLastSeen,
  };
}
