// Stub — data is stored in PostgreSQL via API routes, not the file system.
// This file is kept for type reference only; the functions are no-ops.

export interface ChatHistoryEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
}
