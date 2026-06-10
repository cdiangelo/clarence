import { useScheduleStore } from '../stores/schedule';
import { useHealthStore } from '../stores/health';
import { useFinanceStore } from '../stores/finance';
import { useTripsStore } from '../stores/trips';
import type { ClarenceContext } from './prompts';
import type { ToolHandler } from './claude';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function buildContext(): ClarenceContext {
  const schedule = useScheduleStore.getState();
  const health = useHealthStore.getState();
  const finance = useFinanceStore.getState();
  const trips = useTripsStore.getState();

  const now = new Date();

  const upcomingEvents = schedule
    .getUpcoming(7)
    .slice(0, 5)
    .map((e) => `• ${e.date}${e.time ? ' ' + e.time : ''} — ${e.title}${e.category ? ` (${e.category})` : ''}`)
    .join('\n');

  const recentMeals = health.meals
    .slice(0, 6)
    .map((m) => `• ${m.mealType ?? 'meal'}: ${m.meal}${m.calories ? ` (${m.calories} cal)` : ''}`)
    .join('\n');

  const recentWorkouts = health.workouts
    .slice(0, 4)
    .map((w) => `• ${w.type} — ${w.duration}min, ${w.intensity} intensity`)
    .join('\n');

  const latestMood = health.getLatestMood();
  const recentMoods = latestMood
    ? `Latest: ${latestMood.score}/10${latestMood.notes ? ` — "${latestMood.notes}"` : ''}`
    : '';

  const monthTotal = finance.getMonthTotal();
  const recentExpenses = finance
    .getMonthExpenses()
    .slice(0, 5)
    .map((e) => `• $${e.amount.toFixed(2)} — ${e.category}: ${e.description}`)
    .join('\n');

  const financialGoals = finance.goals
    .map((g) => `• ${g.title}: $${g.current ?? 0} / $${g.target}`)
    .join('\n');

  const activeTrips = trips.trips
    .filter((t) => t.status !== 'completed')
    .map((t) => `• ${t.destination}${t.startDate ? ` (${t.startDate})` : ''} — ${t.itinerary.length} items planned`)
    .join('\n');

  const budget = finance.monthlyBudget
    ? `$${monthTotal.toFixed(2)} / $${finance.monthlyBudget} this month`
    : `$${monthTotal.toFixed(2)} spent this month (no budget set)`;

  return {
    date: formatDate(now),
    time: now.toTimeString().slice(0, 5),
    upcomingEvents,
    recentMeals,
    recentWorkouts,
    recentMoods,
    recentExpenses,
    financialGoals,
    activeTrips,
    monthlyBudget: budget,
  };
}

export function buildToolHandler(): ToolHandler {
  return async (toolName, input) => {
    const schedule = useScheduleStore.getState();
    const health = useHealthStore.getState();
    const finance = useFinanceStore.getState();
    const trips = useTripsStore.getState();

    switch (toolName) {
      case 'add_event': {
        const id = schedule.addEvent(input as Parameters<typeof schedule.addEvent>[0]);
        return JSON.stringify({ success: true, id });
      }
      case 'delete_event': {
        schedule.deleteEvent(input.id as string);
        return JSON.stringify({ success: true });
      }
      case 'log_meal': {
        health.logMeal(input as Parameters<typeof health.logMeal>[0]);
        return JSON.stringify({ success: true });
      }
      case 'log_workout': {
        health.logWorkout(input as Parameters<typeof health.logWorkout>[0]);
        return JSON.stringify({ success: true });
      }
      case 'log_mood': {
        health.logMood(input as Parameters<typeof health.logMood>[0]);
        return JSON.stringify({ success: true });
      }
      case 'log_expense': {
        const today = new Date().toISOString().split('T')[0];
        finance.logExpense({
          ...(input as Parameters<typeof finance.logExpense>[0]),
          date: (input.date as string) ?? today,
        });
        return JSON.stringify({ success: true });
      }
      case 'set_financial_goal': {
        const id = finance.setGoal(input as Parameters<typeof finance.setGoal>[0]);
        return JSON.stringify({ success: true, id });
      }
      case 'set_budget': {
        finance.setBudget(input.monthly as number);
        return JSON.stringify({ success: true });
      }
      case 'create_trip': {
        const id = trips.createTrip(input as Parameters<typeof trips.createTrip>[0]);
        return JSON.stringify({ success: true, id, message: `Trip to ${input.destination} created with ID ${id}` });
      }
      case 'add_itinerary_item': {
        trips.addItineraryItem(
          input.tripId as string,
          input as Parameters<typeof trips.addItineraryItem>[1],
        );
        return JSON.stringify({ success: true });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  };
}
