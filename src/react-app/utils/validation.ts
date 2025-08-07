/**
 * Input validation and sanitization utilities
 */

export class ValidationUtils {
  /**
   * Sanitize text input to prevent XSS and clean up content
   */
  static sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate User ID format (3 words separated by hyphens)
   */
  static validateUserID(userID: string): boolean {
    return /^[a-z]+-[a-z]+-[a-z]+$/.test(userID);
  }

  /**
   * Validate display name format
   */
  static validateDisplayName(displayName: string): boolean {
    return displayName.length >= 3 && 
           displayName.length <= 20 && 
           /^[a-zA-Z0-9]+$/.test(displayName);
  }

  /**
   * Validate message content
   */
  static validateMessage(message: string): boolean {
    const cleaned = message.trim();
    return cleaned.length > 0 && cleaned.length <= 1000;
  }

  /**
   * Check if string contains inappropriate content (basic filter)
   */
  static containsInappropriateContent(text: string): boolean {
    const inappropriateWords = [
      // Add basic inappropriate words filter
      'spam', 'scam', 'hack', 'malware'
    ];
    
    const lowerText = text.toLowerCase();
    return inappropriateWords.some(word => lowerText.includes(word));
  }

  /**
   * Rate limiting check - returns true if action should be blocked
   */
  static checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    try {
      const storageKey = `rate_limit_${key}`;
      const stored = localStorage.getItem(storageKey);
      const now = Date.now();
      
      if (!stored) {
        localStorage.setItem(storageKey, JSON.stringify({ count: 1, timestamp: now }));
        return false;
      }
      
      const data = JSON.parse(stored);
      
      // Reset window if expired
      if (now - data.timestamp > windowMs) {
        localStorage.setItem(storageKey, JSON.stringify({ count: 1, timestamp: now }));
        return false;
      }
      
      // Check if limit exceeded
      if (data.count >= maxAttempts) {
        return true;
      }
      
      // Increment counter
      localStorage.setItem(storageKey, JSON.stringify({ 
        count: data.count + 1, 
        timestamp: data.timestamp 
      }));
      
      return false;
    } catch {
      return false; // Allow action if localStorage fails
    }
  }

  /**
   * Clear rate limit for a key
   */
  static clearRateLimit(key: string): void {
    try {
      localStorage.removeItem(`rate_limit_${key}`);
    } catch {
      // Ignore errors
    }
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Check if input is likely spam
   */
  static isLikelySpam(text: string): boolean {
    // Check for excessive repetition
    if (/(.)\1{10,}/.test(text)) return true;
    
    // Check for excessive caps
    if (text.length > 10 && (text.match(/[A-Z]/g) || []).length / text.length > 0.7) return true;
    
    // Check for excessive URLs
    if ((text.match(/https?:\/\//g) || []).length > 2) return true;
    
    return false;
  }

  /**
   * Format User ID for display (add proper spacing/styling)
   */
  static formatUserIDForDisplay(userID: string): string {
    return userID.split('-').join(' • ');
  }
}
