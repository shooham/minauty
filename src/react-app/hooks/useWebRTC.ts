import { useState, useEffect, useRef, useCallback } from 'react';
import { UserID, Message, ConnectionState } from '@/shared/types';
import { MessageEncryption } from '@/react-app/utils/encryption';
import { ValidationUtils } from '@/react-app/utils/validation';

// WebRTC configuration with Google STUN servers
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

interface UseWebRTCProps {
  currentUserID: UserID;
  targetUserID: UserID;
  onMessage: (message: Message) => void;
  onConnectionStateChange: (state: ConnectionState) => void;
}

export function useWebRTC({ 
  currentUserID, 
  targetUserID, 
  onMessage, 
  onConnectionStateChange 
}: UseWebRTCProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update connection state and notify parent
  const updateConnectionState = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    onConnectionStateChange(state);
  }, [onConnectionStateChange]);

  // Clean up WebRTC connection
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
  }, []);

  // Handle data channel messages
  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const encryptedData = event.data;
      const decryptedContent = MessageEncryption.decrypt(
        encryptedData, 
        currentUserID, 
        targetUserID
      );
      
      const messageData = JSON.parse(decryptedContent);
      
      // Validate message
      if (!ValidationUtils.validateMessage(messageData.content)) {
        console.warn('Received invalid message');
        return;
      }
      
      const message: Message = {
        id: messageData.id || MessageEncryption.generateMessageID(),
        from: targetUserID,
        to: currentUserID,
        content: ValidationUtils.sanitizeText(messageData.content),
        timestamp: messageData.timestamp || Date.now(),
        type: messageData.type || 'text',
        delivered: true,
        read: false,
      };
      
      onMessage(message);
      
      // Send read receipt
      if (dataChannelRef.current?.readyState === 'open') {
        const receipt = {
          type: 'receipt',
          messageId: message.id,
          status: 'read'
        };
        const encryptedReceipt = MessageEncryption.encrypt(
          JSON.stringify(receipt),
          currentUserID,
          targetUserID
        );
        dataChannelRef.current.send(encryptedReceipt);
      }
    } catch (error) {
      console.error('Error handling data channel message:', error);
    }
  }, [currentUserID, targetUserID, onMessage]);

  // Setup data channel
  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    dataChannelRef.current = channel;
    
    channel.onopen = () => {
      console.log('Data channel opened');
      updateConnectionState('connected');
      reconnectAttemptsRef.current = 0;
    };
    
    channel.onclose = () => {
      console.log('Data channel closed');
      updateConnectionState('disconnected');
    };
    
    channel.onerror = (error) => {
      console.error('Data channel error:', error);
      updateConnectionState('failed');
    };
    
    channel.onmessage = handleDataChannelMessage;
    
    // Set up heartbeat to maintain connection
    const heartbeatInterval = setInterval(() => {
      if (channel.readyState === 'open') {
        try {
          const heartbeat = MessageEncryption.encrypt(
            JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }),
            currentUserID,
            targetUserID
          );
          channel.send(heartbeat);
        } catch (error) {
          console.error('Heartbeat failed:', error);
          clearInterval(heartbeatInterval);
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // 30 second heartbeat
    
    return () => clearInterval(heartbeatInterval);
  }, [currentUserID, targetUserID, updateConnectionState, handleDataChannelMessage]);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    try {
      const peerConnection = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = peerConnection;
      
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        console.log('ICE connection state:', state);
        
        switch (state) {
          case 'connected':
          case 'completed':
            updateConnectionState('connected');
            break;
          case 'disconnected':
            updateConnectionState('disconnected');
            // Attempt reconnection
            if (reconnectAttemptsRef.current < 3) {
              reconnectAttemptsRef.current++;
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`Reconnection attempt ${reconnectAttemptsRef.current}`);
                initializeConnection();
              }, Math.pow(2, reconnectAttemptsRef.current) * 1000); // Exponential backoff
            }
            break;
          case 'failed':
            updateConnectionState('failed');
            break;
        }
      };
      
      peerConnection.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };
      
      return peerConnection;
    } catch (error) {
      console.error('Error initializing peer connection:', error);
      updateConnectionState('failed');
      return null;
    }
  }, [updateConnectionState, setupDataChannel]);

  // Send message through data channel
  const sendMessage = useCallback((content: string, type: 'text' | 'typing' = 'text') => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.warn('Data channel not ready');
      return null;
    }
    
    if (!ValidationUtils.validateMessage(content)) {
      console.warn('Invalid message content');
      return null;
    }
    
    try {
      const message = {
        id: MessageEncryption.generateMessageID(),
        from: currentUserID,
        to: targetUserID,
        content: ValidationUtils.sanitizeText(content),
        timestamp: Date.now(),
        type,
        delivered: false,
        read: false,
      };
      
      const encryptedMessage = MessageEncryption.encrypt(
        JSON.stringify(message),
        currentUserID,
        targetUserID
      );
      
      dataChannelRef.current.send(encryptedMessage);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, [currentUserID, targetUserID]);

  // Initialize connection (to be called by signaling)
  const initializeConnection = useCallback(() => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    updateConnectionState('connecting');
    
    const peerConnection = initializePeerConnection();
    if (!peerConnection) {
      setIsConnecting(false);
      return;
    }
    
    // Create data channel (as initiator)
    const dataChannel = peerConnection.createDataChannel('messages', {
      ordered: true,
      maxRetransmits: 3,
    });
    
    setupDataChannel(dataChannel);
    setIsConnecting(false);
  }, [isConnecting, updateConnectionState, initializePeerConnection, setupDataChannel]);

  // Accept incoming connection (to be called by signaling)
  const acceptConnection = useCallback(() => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    updateConnectionState('connecting');
    
    initializePeerConnection();
    setIsConnecting(false);
  }, [isConnecting, updateConnectionState, initializePeerConnection]);

  // Disconnect
  const disconnect = useCallback(() => {
    cleanup();
    updateConnectionState('disconnected');
  }, [cleanup, updateConnectionState]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    connectionState,
    isConnecting,
    sendMessage,
    initializeConnection,
    acceptConnection,
    disconnect,
  };
}
