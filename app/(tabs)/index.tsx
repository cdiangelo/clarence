import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { useScheduleStore } from '../../stores/schedule';
import { useHealthStore } from '../../stores/health';
import { useFinanceStore } from '../../stores/finance';
import { useTripsStore } from '../../stores/trips';

const QUICK_PROMPTS = [
  "What should I focus on today?",
  "How am I doing this week?",
  "Suggest something to do this weekend",
  "Help me plan a trip",
];

export default function HomeScreen() {
  const schedule = useScheduleStore();
  const health = useHealthStore();
  const finance = useFinanceStore();
  const trips = useTripsStore();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = now.toISOString().split('T')[0];
  const todayEvents = schedule.getEventsForDate(today);
  const streak = health.getWorkoutStreak();
  const monthSpent = finance.getMonthTotal();
  const latestMood = health.getLatestMood();
  const planningTrips = trips.trips.filter((t) => t.status !== 'completed');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={[typography.h1]}>{greeting}.</Text>
        </View>

        {/* Quick chat prompts */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <Text style={[typography.label, { marginBottom: spacing.sm }]}>Ask Clarence</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {QUICK_PROMPTS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: p } })}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Today's schedule */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <SectionHeader title="Today" onPress={() => router.push('/(tabs)/schedule')} />
          {todayEvents.length === 0 ? (
            <Card>
              <Text style={typography.bodySmall}>Nothing scheduled today.</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: "Help me plan my day" } })}
                style={{ marginTop: spacing.sm }}
              >
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                  Ask Clarence to help plan it →
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {todayEvents.slice(0, 3).map((e) => (
                <Card key={e.id} accent={colors.primary}>
                  <Text style={typography.body}>{e.title}</Text>
                  {e.time && (
                    <Text style={[typography.bodySmall, { marginTop: 2 }]}>{e.time}</Text>
                  )}
                </Card>
              ))}
              {todayEvents.length > 3 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', padding: spacing.sm }}>
                    +{todayEvents.length - 3} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <SectionHeader title="At a glance" />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <StatCard
              label="Workout streak"
              value={streak > 0 ? `${streak}d` : '—'}
              color={colors.health}
              icon="flame"
              onPress={() => router.push('/(tabs)/health')}
            />
            <StatCard
              label="Month spend"
              value={`$${monthSpent.toFixed(0)}`}
              color={colors.finance}
              icon="wallet"
              onPress={() => router.push('/(tabs)/finance')}
            />
            <StatCard
              label="Mood"
              value={latestMood ? `${latestMood.score}/10` : '—'}
              color={colors.primary}
              icon="heart"
              onPress={() => router.push('/(tabs)/health')}
            />
          </View>
        </View>

        {/* Trips */}
        {planningTrips.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <SectionHeader title="Trips" onPress={() => router.push('/(tabs)/trips')} />
            <View style={{ gap: spacing.sm }}>
              {planningTrips.slice(0, 2).map((t) => (
                <Card key={t.id} accent={colors.trips}>
                  <Text style={typography.body}>{t.destination}</Text>
                  <Text style={typography.bodySmall}>
                    {t.startDate ?? 'Dates TBD'} · {t.itinerary.length} items planned
                  </Text>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Financial goals */}
        {finance.goals.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <SectionHeader title="Goals" onPress={() => router.push('/(tabs)/finance')} />
            <View style={{ gap: spacing.sm }}>
              {finance.goals.slice(0, 2).map((g) => {
                const pct = Math.min((g.current / g.target) * 100, 100);
                return (
                  <Card key={g.id} accent={colors.finance}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={typography.body}>{g.title}</Text>
                      <Text style={[typography.bodySmall, { color: colors.finance }]}>
                        ${g.current.toFixed(0)} / ${g.target.toFixed(0)}
                      </Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                      <View
                        style={{
                          width: `${pct}%`,
                          height: 4,
                          backgroundColor: colors.finance,
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
      <Text style={typography.label}>{title.toUpperCase()}</Text>
      {onPress && (
        <TouchableOpacity onPress={onPress}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>See all →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.xs,
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[typography.h3, { color, fontSize: 20 }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );
}
