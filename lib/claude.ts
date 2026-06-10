import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  ToolResultBlockParam,
  ContentBlock,
} from '@anthropic-ai/sdk/resources/messages';
import { CLARENCE_TOOLS } from './tools';
import { buildSystemPrompt, type ClarenceContext } from './prompts';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set. Add it to your .env file.');
    _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return _client;
}

export type ToolHandler = (toolName: string, input: Record<string, unknown>) => Promise<string>;

export interface SendMessageResult {
  text: string;
  toolsUsed: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessage(
  userContent: string,
  history: ConversationMessage[],
  ctx: ClarenceContext,
  onToolCall: ToolHandler,
): Promise<SendMessageResult> {
  const client = getClient();
  const toolsUsed: string[] = [];

  const messages: MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent },
  ];

  let currentMessages = [...messages];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: buildSystemPrompt(ctx),
      messages: currentMessages,
      tools: CLARENCE_TOOLS,
    });

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Extract<ContentBlock, { type: 'tool_use' }> => b.type === 'tool_use',
      );
      const toolResults: ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        toolsUsed.push(block.name);
        try {
          const result = await onToolCall(block.name, block.input as Record<string, unknown>);
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

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
    } else {
      const textBlock = response.content.find(
        (b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text',
      );
      return { text: textBlock?.text ?? '', toolsUsed };
    }
  }
}
