/**
 * Simple XOR encryption for message content
 * This provides basic obfuscation - not military-grade security
 * but sufficient for privacy in P2P chat
 */

export class MessageEncryption {
  private static readonly DEFAULT_KEY = 'minauty2024';
  
  /**
   * Generate a simple encryption key based on user IDs
   */
  static generateKey(userID1: string, userID2: string): string {
    // Create a deterministic key from both user IDs
    const combined = [userID1, userID2].sort().join('');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36) + this.DEFAULT_KEY;
  }

  /**
   * XOR encrypt/decrypt (same operation for both)
   */
  static xorCipher(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return result;
  }

  /**
   * Encode to base64 for safe transmission
   */
  static encode(text: string): string {
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch {
      return text; // Fallback if encoding fails
    }
  }

  /**
   * Decode from base64
   */
  static decode(encoded: string): string {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return encoded; // Fallback if decoding fails
    }
  }

  /**
   * Encrypt message content
   */
  static encrypt(message: string, userID1: string, userID2: string): string {
    const key = this.generateKey(userID1, userID2);
    const encrypted = this.xorCipher(message, key);
    return this.encode(encrypted);
  }

  /**
   * Decrypt message content
   */
  static decrypt(encryptedMessage: string, userID1: string, userID2: string): string {
    const key = this.generateKey(userID1, userID2);
    const decoded = this.decode(encryptedMessage);
    return this.xorCipher(decoded, key);
  }

  /**
   * Generate a random message ID
   */
  static generateMessageID(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
