export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const CLARENCE_TOOLS: ToolDef[] = [
  {
    name: 'add_event',
    description: "Add an event or appointment to the user's schedule.",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        time: { type: 'string', description: 'HH:MM (24h)' },
        duration: { type: 'number', description: 'Duration in minutes' },
        description: { type: 'string' },
        category: { type: 'string', enum: ['work', 'personal', 'health', 'social', 'finance'] },
      },
      required: ['title', 'date'],
    },
  },
  {
    name: 'delete_event',
    description: 'Delete a calendar event by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'log_meal',
    description: 'Log a meal or snack the user ate.',
    input_schema: {
      type: 'object',
      properties: {
        meal: { type: 'string', description: 'Description of what was eaten' },
        calories: { type: 'number' },
        mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
        notes: { type: 'string' },
      },
      required: ['meal'],
    },
  },
  {
    name: 'log_workout',
    description: 'Log a workout or physical activity.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'e.g. running, gym, yoga, walk, cycling' },
        duration: { type: 'number', description: 'Duration in minutes' },
        intensity: { type: 'string', enum: ['low', 'medium', 'high'] },
        notes: { type: 'string' },
      },
      required: ['type', 'duration'],
    },
  },
  {
    name: 'log_mood',
    description: "Log the user's mood or emotional check-in.",
    input_schema: {
      type: 'object',
      properties: {
        score: { type: 'number', description: '1–10 where 10 is best' },
        notes: { type: 'string', description: 'What is going on emotionally' },
      },
      required: ['score'],
    },
  },
  {
    name: 'log_expense',
    description: 'Log a financial expense or purchase.',
    input_schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Amount in dollars' },
        category: {
          type: 'string',
          description: 'e.g. food, transport, entertainment, utilities, health, clothing, subscriptions',
        },
        description: { type: 'string' },
        date: { type: 'string', description: 'ISO date YYYY-MM-DD, defaults to today' },
      },
      required: ['amount', 'category', 'description'],
    },
  },
  {
    name: 'set_financial_goal',
    description: 'Create or update a financial goal.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['save', 'invest', 'pay_debt', 'emergency_fund', 'purchase'] },
        target: { type: 'number' },
        current: { type: 'number' },
        deadline: { type: 'string', description: 'ISO date YYYY-MM-DD' },
      },
      required: ['title', 'type', 'target'],
    },
  },
  {
    name: 'create_trip',
    description: 'Create a new trip plan.',
    input_schema: {
      type: 'object',
      properties: {
        destination: { type: 'string' },
        startDate: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        endDate: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        notes: { type: 'string', description: 'Why this destination, highlights, vibe' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
      required: ['destination'],
    },
  },
  {
    name: 'add_itinerary_item',
    description: "Add an activity or item to a trip's itinerary.",
    input_schema: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        day: { type: 'number', description: 'Day number starting at 1' },
        time: { type: 'string', description: 'HH:MM' },
        activity: { type: 'string' },
        location: { type: 'string' },
        notes: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
      required: ['tripId', 'day', 'activity'],
    },
  },
  {
    name: 'set_budget',
    description: "Set the user's monthly budget.",
    input_schema: {
      type: 'object',
      properties: {
        monthly: { type: 'number', description: 'Monthly budget in dollars' },
      },
      required: ['monthly'],
    },
  },
];
