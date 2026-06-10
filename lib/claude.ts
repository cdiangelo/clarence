import { CLARENCE_TOOLS } from './tools';
import { buildSystemPrompt, type ClarenceContext } from './prompts';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-8';
const API_VERSION = '2023-06-01';

export type ToolHandler = (toolName: string, input: Record<string, unknown>) => Promise<string>;

export interface SendMessageResult {
  text: string;
  toolsUsed: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Anthropic content block shapes we care about
type TextBlock = { type: 'text'; text: string };
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
type ContentBlock = TextBlock | ToolUseBlock | { type: string; [key: string]: unknown };

type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

type Message =
  | { role: 'user' | 'assistant'; content: string }
  | { role: 'assistant'; content: ContentBlock[] }
  | { role: 'user'; content: ToolResultBlock[] };

interface AnthropicResponse {
  content: ContentBlock[];
  stop_reason: string;
}

function getApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set. Add it to your environment / .env file.');
  }
  return apiKey;
}

async function callAnthropic(system: string, messages: Message[]): Promise<AnthropicResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages,
      tools: CLARENCE_TOOLS,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let detail = errText;
    try {
      const parsed = JSON.parse(errText);
      detail = parsed?.error?.message ?? errText;
    } catch {
      // keep raw text
    }
    throw new Error(`Anthropic API error (${res.status}): ${detail}`);
  }

  return (await res.json()) as AnthropicResponse;
}

export async function sendMessage(
  userContent: string,
  history: ConversationMessage[],
  ctx: ClarenceContext,
  onToolCall: ToolHandler,
): Promise<SendMessageResult> {
  const toolsUsed: string[] = [];
  const system = buildSystemPrompt(ctx);

  let messages: Message[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userContent },
  ];

  while (true) {
    const response = await callAnthropic(system, messages);

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is ToolUseBlock => b.type === 'tool_use',
      );
      const toolResults: ToolResultBlock[] = [];

      for (const block of toolUseBlocks) {
        toolsUsed.push(block.name);
        try {
          const result = await onToolCall(block.name, block.input);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: ${err instanceof Error ? err.message : 'unknown error'}`,
            is_error: true,
          });
        }
      }

      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
    } else {
      const textBlock = response.content.find((b): b is TextBlock => b.type === 'text');
      return { text: textBlock?.text ?? '', toolsUsed };
    }
  }
}
