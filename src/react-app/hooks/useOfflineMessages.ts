import { useState, useEffect, useCallback } from 'react';
import { UserID, Message } from '@/shared/types';
import { MessageEncryption } from '@/shared/utils/encryption';

interface OfflineMessage {
  message_id: string;
  from_user_id: string;
  ciphertext: string;
  timestamp: number;
}

interface UseOfflineMessagesProps {
  currentUserID: UserID;
  onMessage: (message: Message) => void;
}

export function useOfflineMessages({ currentUserID, onMessage }: UseOfflineMessagesProps) {
  const [offlineCount, setOfflineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOfflineMessages = useCallback(async () => {
    if (!currentUserID || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages?userID=${currentUserID}`);
      const data = await response.json();
      
      if (response.ok && data.messages) {
        const messages = data.messages as OfflineMessage[];
        setOfflineCount(messages.length);
        
        if (messages.length > 0) {
          // Process each offline message
          const processedMessages: Message[] = [];
          const msgIDs: string[] = [];
          
          for (const offlineMsg of messages) {
            try {
              // Decrypt the message content
              const decryptedContent = MessageEncryption.decrypt(
                offlineMsg.ciphertext,
                offlineMsg.from_user_id,
                currentUserID
              );
              
              const message: Message = {
                id: offlineMsg.message_id,
                from: offlineMsg.from_user_id as UserID,
                to: currentUserID,
                content: decryptedContent,
                timestamp: offlineMsg.timestamp,
                type: 'text',
                delivered: true,
                read: false,
                isOfflineMessage: true, // Flag to show it's an offline message
              };
              
              processedMessages.push(message);
              msgIDs.push(offlineMsg.message_id);
              onMessage(message);
            } catch (error) {
              console.error('Failed to decrypt offline message:', error);
            }
          }
          
          // Send acknowledgment
          if (msgIDs.length > 0) {
            try {
              await fetch('/api/ack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID: currentUserID, msgIDs })
              });
            } catch (error) {
              console.error('Failed to acknowledge messages:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch offline messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserID, onMessage, isLoading]);

  const sendOfflineMessage = useCallback(async (
    toUserID: UserID, 
    content: string
  ): Promise<boolean> => {
    try {
      // Encrypt the message content
      const ciphertext = MessageEncryption.encrypt(content, currentUserID, toUserID);
      const messageID = MessageEncryption.generateMessageID();
      
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromID: currentUserID,
          toID: toUserID,
          ciphertext,
          timestamp: Date.now(),
          messageID
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to send offline message:', result.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error sending offline message:', error);
      return false;
    }
  }, [currentUserID]);

  // Fetch offline messages on mount and when user ID changes
  useEffect(() => {
    fetchOfflineMessages();
  }, [fetchOfflineMessages]);

  return {
    offlineCount,
    isLoading,
    fetchOfflineMessages,
    sendOfflineMessage,
  };
}
