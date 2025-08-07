import z from "zod";

// User ID and Display Name schemas - now using 3-word format
export const UserIDSchema = z.string().regex(/^[a-z]+-[a-z]+-[a-z]+$/, "Invalid User ID format");
export const DisplayNameSchema = z.string().min(3).max(20);

// Message schemas
export const MessageSchema = z.object({
  id: z.string(),
  from: UserIDSchema,
  to: UserIDSchema,
  content: z.string().max(1000),
  timestamp: z.number(),
  type: z.enum(['text', 'voice', 'typing', 'status']),
  delivered: z.boolean().default(false),
  read: z.boolean().default(false),
  // Voice message specific fields
  audioUrl: z.string().optional(),
  duration: z.number().optional(),
  // Offline message flag
  isOfflineMessage: z.boolean().optional(),
});

export const ConnectionRequestSchema = z.object({
  fromID: UserIDSchema,
  toID: UserIDSchema,
  fromDisplayName: DisplayNameSchema,
});

export const UserStatusSchema = z.object({
  userID: UserIDSchema,
  displayName: DisplayNameSchema,
  status: z.enum(['online', 'away', 'offline', 'invisible']),
  lastSeen: z.number(),
  socketID: z.string().optional(),
});

// Derived types
export type UserID = z.infer<typeof UserIDSchema>;
export type DisplayName = z.infer<typeof DisplayNameSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ConnectionRequest = z.infer<typeof ConnectionRequestSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;

// Client-side user data
export interface UserData {
  userID: UserID;
  displayName: DisplayName;
  createdAt: number;
}

// Connection states
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

// Chat session data
export interface ChatSession {
  peerID: UserID;
  peerDisplayName: DisplayName;
  messages: Message[];
  connectionState: ConnectionState;
  lastActivity: number;
}
