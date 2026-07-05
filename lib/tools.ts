export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const GOLF_TOOLS: ToolDef[] = [
  {
    name: 'get_weather',
    description: 'Get current conditions and hourly forecast for a course location. Call before round planning.',
    input_schema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lng: { type: 'number', description: 'Longitude' },
        location: { type: 'string', description: 'Human-readable name for display' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'search_courses',
    description: 'Search golf courses by name or city. Returns basic info: name, location, par, rating, slope.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Course name or city' },
        state: { type: 'string', description: 'Optional 2-letter state code to narrow search' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_course_holes',
    description: 'Get hole-by-hole scorecard: par, yardage from multiple tees, handicap index per hole. Use for hole-by-hole strategy.',
    input_schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string', description: 'Course ID from search_courses result' },
      },
      required: ['courseId'],
    },
  },
  {
    name: 'get_user_rounds',
    description: "Get the player's logged rounds. Use before performance analysis, trend spotting, or setting improvement goals.",
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max rounds to return (default 20, max 50)' },
      },
    },
  },
  {
    name: 'get_user_bag',
    description: "Get all clubs in the player's bag with carry distances. Use for gapping analysis, club selection, and equipment advice.",
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_chat_history',
    description: "Fetch the full transcript of a prior conversation with this player, when they reference something discussed before (e.g. 'like you said last time', 'what was that drill you gave me'). The system prompt already lists recent chat titles/dates for context — call this when you need the actual message content of one of them.",
    input_schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID from the "Recent Conversations" list in your context. Omit to get the single most recent prior session.' },
      },
    },
  },
  {
    name: 'get_user_document',
    description: "Fetch the full extracted text of a document this player uploaded (swing notes, lesson summaries, individual performance data, or any other personal reference material). The system prompt lists the titles of uploaded documents — call this with a document's id whenever the question touches something a personal document might cover, so you're advising from their own material rather than generic knowledge.",
    input_schema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: "Document ID from the \"Player's Uploaded Documents\" list in your context." },
      },
      required: ['documentId'],
    },
  },
];
