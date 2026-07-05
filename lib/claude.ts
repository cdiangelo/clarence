import { GOLF_TOOLS } from './tools';

const MODEL = 'claude-opus-4-8';
const API_VERSION = '2023-06-01';

type TextBlock = { type: 'text'; text: string };
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
type ContentBlock = TextBlock | ToolUseBlock | { type: string; [key: string]: unknown };
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };

export type Message =
  | { role: 'user' | 'assistant'; content: string }
  | { role: 'assistant'; content: ContentBlock[] }
  | { role: 'user'; content: ToolResultBlock[] };

export interface AnthropicResponse {
  content: ContentBlock[];
  stop_reason: string;
}

export type { TextBlock, ToolUseBlock, ContentBlock, ToolResultBlock };

export async function callClaude(system: string, messages: Message[]): Promise<AnthropicResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, system, messages, tools: GOLF_TOOLS }),
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try { detail = JSON.parse(text)?.error?.message ?? text; } catch { /* */ }
    throw new Error(`Anthropic ${res.status}: ${detail}`);
  }

  return res.json() as Promise<AnthropicResponse>;
}
