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
];
