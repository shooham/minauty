import { UserData, UserID, DisplayName } from '@/shared/types';

// Cute words for 3-word IDs
const CUTE_ADJECTIVES = [
  'happy', 'fluffy', 'bouncy', 'sparkly', 'dreamy', 'bubbly', 'sunny', 'magic',
  'sweet', 'cozy', 'lovely', 'bright', 'gentle', 'cheerful', 'playful', 'misty',
  'golden', 'silky', 'dainty', 'peppy', 'jolly', 'merry', 'giggly', 'sleepy',
  'fuzzy', 'shiny', 'pretty', 'cuddly', 'snuggly', 'twinkly'
];

const CUTE_ANIMALS = [
  'kitten', 'puppy', 'bunny', 'fox', 'panda', 'koala', 'owl', 'duck',
  'hamster', 'otter', 'deer', 'lamb', 'chick', 'seal', 'turtle', 'bear',
  'unicorn', 'dragon', 'penguin', 'dolphin', 'butterfly', 'hedgehog', 'robin', 'squirrel',
  'mouse', 'frog', 'bee', 'cat', 'dog', 'bird'
];

const CUTE_ACTIONS = [
  'dance', 'jump', 'play', 'sing', 'fly', 'swim', 'run', 'skip',
  'giggle', 'smile', 'dream', 'bounce', 'wiggle', 'cuddle', 'snuggle', 'twirl',
  'hop', 'spin', 'laugh', 'explore', 'adventure', 'wander', 'float', 'glide',
  'sparkle', 'shine', 'glow', 'beam', 'cheer', 'celebrate'
];

// Predefined test friend for instant chatting
const TEST_FRIEND: UserData = {
  userID: 'sweet-kitten-dance' as UserID,
  displayName: 'TestFriend' as DisplayName,
  createdAt: Date.now() - 1000000, // Created earlier
};

export class UserManager {
  private static readonly STORAGE_KEY = 'minauty_user_data';
  private static readonly SESSION_KEY = 'minauty_session_data';

  /**
   * Generate a cute 3-word User ID like "happy-kitten-dance"
   */
  static generateUniqueUserID(): UserID {
    const adjective = CUTE_ADJECTIVES[Math.floor(Math.random() * CUTE_ADJECTIVES.length)];
    const animal = CUTE_ANIMALS[Math.floor(Math.random() * CUTE_ANIMALS.length)];
    const action = CUTE_ACTIONS[Math.floor(Math.random() * CUTE_ACTIONS.length)];
    return `${adjective}-${animal}-${action}` as UserID;
  }

  /**
   * Generate a cute, memorable display name
   */
  static generateDisplayName(): DisplayName {
    const adjective = CUTE_ADJECTIVES[Math.floor(Math.random() * CUTE_ADJECTIVES.length)];
    const animal = CUTE_ANIMALS[Math.floor(Math.random() * CUTE_ANIMALS.length)];
    const number = Math.floor(Math.random() * 99) + 1;
    
    // Capitalize first letters
    const capAdjective = adjective.charAt(0).toUpperCase() + adjective.slice(1);
    const capAnimal = animal.charAt(0).toUpperCase() + animal.slice(1);
    
    return `${capAdjective}${capAnimal}${number}` as DisplayName;
  }

  /**
   * Create a new user with generated ID and display name
   */
  static createNewUser(): UserData {
    const userData: UserData = {
      userID: this.generateUniqueUserID(),
      displayName: this.generateDisplayName(),
      createdAt: Date.now(),
    };
    
    this.saveUserData(userData);
    return userData;
  }

  /**
   * Get test friend data for immediate testing
   */
  static getTestFriend(): UserData {
    return TEST_FRIEND;
  }

  /**
   * Save user data to localStorage (persistent)
   */
  static saveUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  /**
   * Load user data from localStorage
   */
  static loadUserData(): UserData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load user data:', error);
      return null;
    }
  }

  /**
   * Load user by ID (for login functionality)
   */
  static loadUserByID(userID: UserID): UserData | null {
    const existing = this.loadUserData();
    if (existing && existing.userID === userID) {
      return existing;
    }
    return null;
  }

  /**
   * Login with existing ID
   */
  static loginWithID(userID: UserID): UserData | null {
    if (!this.validateUserID(userID)) {
      return null;
    }

    // Check if it's the test friend
    if (userID === TEST_FRIEND.userID) {
      return TEST_FRIEND;
    }

    // For demo purposes, create a new user with the provided ID
    // In a real app, this would verify the ID exists on the server
    const userData: UserData = {
      userID,
      displayName: this.generateDisplayName(),
      createdAt: Date.now(),
    };
    
    this.saveUserData(userData);
    return userData;
  }

  /**
   * Clear user data (logout)
   */
  static clearUserData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem('minauty_id_confirmed');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  /**
   * Validate User ID format (3 words separated by hyphens)
   */
  static validateUserID(userID: string): boolean {
    return /^[a-z]+-[a-z]+-[a-z]+$/.test(userID);
  }

  /**
   * Check if user has saved their ID (for first-time users)
   */
  static hasConfirmedIDSaved(): boolean {
    try {
      return localStorage.getItem('minauty_id_confirmed') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark that user has confirmed saving their ID
   */
  static confirmIDSaved(): void {
    try {
      localStorage.setItem('minauty_id_confirmed', 'true');
    } catch (error) {
      console.error('Failed to confirm ID saved:', error);
    }
  }

  /**
   * Get or create user data
   */
  static getOrCreateUser(): UserData {
    const existing = this.loadUserData();
    if (existing && this.validateUserID(existing.userID)) {
      return existing;
    }
    return this.createNewUser();
  }

  /**
   * Save session data (temporary, cleared on browser close)
   */
  static saveSessionData(key: string, data: any): void {
    try {
      sessionStorage.setItem(`${this.SESSION_KEY}_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  /**
   * Load session data
   */
  static loadSessionData(key: string): any {
    try {
      const stored = sessionStorage.getItem(`${this.SESSION_KEY}_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load session data:', error);
      return null;
    }
  }

  /**
   * Clear all session data
   */
  static clearSessionData(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.SESSION_KEY)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }
}
