@AGENTS.md

# Clarence — Personal Support App

React Native / Expo app with Claude AI deeply integrated as a personal life companion.

## Stack
- **Framework**: Expo SDK 56 + React Native 0.85 (TypeScript)
- **Navigation**: Expo Router v4 (file-based, `app/` directory)
- **AI**: `@anthropic-ai/sdk` — `claude-opus-4-8` model with full tool use
- **State**: Zustand (in-memory; add AsyncStorage persistence if desired)

## Key files
- `lib/claude.ts` — Claude API client + agentic tool-use loop
- `lib/tools.ts` — All tool definitions (schedule, health, finance, trips)
- `lib/prompts.ts` — System prompt builder with context injection
- `lib/context.ts` — Builds context from all stores + tool handler
- `stores/` — Zustand stores (chat, schedule, health, finance, trips)
- `constants/theme.ts` — Design system (colors, spacing, typography)
- `app/(tabs)/` — 6 tab screens

## Setup
1. Copy `.env.example` → `.env` and add your Anthropic API key
2. `npm install`
3. `npx expo start`

## Architecture: how Claude integration works
Every chat message goes through `lib/claude.ts:sendMessage()`:
1. Builds system prompt with live context from all 5 stores
2. Calls `claude-opus-4-8` with all tool definitions
3. If Claude uses tools → `lib/context.ts:buildToolHandler()` executes them (writes to stores)
4. Loop continues until Claude stops calling tools
5. Final text response is shown in chat

Tools Claude can call: `add_event`, `delete_event`, `log_meal`, `log_workout`, `log_mood`, `log_expense`, `set_financial_goal`, `set_budget`, `create_trip`, `add_itinerary_item`

## Adding a feature
1. Add tool definition in `lib/tools.ts`
2. Add handler case in `lib/context.ts:buildToolHandler()`
3. Add state to the relevant store in `stores/`
4. Update context builder in `lib/context.ts:buildContext()` so Claude knows about the new data
