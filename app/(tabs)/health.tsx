import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { useHealthStore } from '../../stores/health';

const MOOD_EMOJI = (score: number) => {
  if (score >= 9) return '😄';
  if (score >= 7) return '🙂';
  if (score >= 5) return '😐';
  if (score >= 3) return '😔';
  return '😞';
};

export default function HealthScreen() {
  const { meals, workouts, moods, getTodayMeals, getTodayWorkouts, getLatestMood, getWorkoutStreak } =
    useHealthStore();

  const todayMeals = getTodayMeals();
  const todayWorkouts = getTodayWorkouts();
  const latestMood = getLatestMood();
  const streak = getWorkoutStreak();

  const [tab, setTab] = useState<'overview' | 'meals' | 'workouts' | 'mood'>('overview');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={typography.h2}>Health</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/(tabs)/chat', params: { prompt: 'Log a meal or workout' } })
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.health,
            borderRadius: radius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          }}
        >
          <Ionicons name="add" size={16} color={colors.bg} />
          <Text style={{ color: colors.bg, fontSize: 13, fontWeight: '600' }}>Log</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.xs,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {(['overview', 'meals', 'workouts', 'mood'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
              backgroundColor: tab === t ? colors.health : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: tab === t ? colors.bg : colors.textMuted,
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {tab === 'overview' && (
          <>
            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <StatTile label="Workout streak" value={streak > 0 ? `${streak}d` : '—'} color={colors.health} icon="flame" />
              <StatTile label="Today's meals" value={`${todayMeals.length}`} color={colors.primary} icon="restaurant" />
              <StatTile label="Workouts today" value={`${todayWorkouts.length}`} color={colors.chat} icon="barbell" />
            </View>

            {/* Mood */}
            {latestMood ? (
              <Card accent={colors.primary}>
                <Text style={typography.label}>LATEST MOOD</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
                  <Text style={{ fontSize: 32 }}>{MOOD_EMOJI(latestMood.score)}</Text>
                  <View>
                    <Text style={[typography.h3, { color: colors.primary }]}>{latestMood.score}/10</Text>
                    {latestMood.notes && <Text style={typography.bodySmall}>{latestMood.notes}</Text>}
                  </View>
                </View>
              </Card>
            ) : (
              <Card>
                <Text style={typography.bodySmall}>No mood check-ins yet.</Text>
              </Card>
            )}

            {/* Today meals */}
            {todayMeals.length > 0 && (
              <View>
                <Text style={[typography.label, { marginBottom: spacing.sm }]}>TODAY'S MEALS</Text>
                <View style={{ gap: spacing.sm }}>
                  {todayMeals.map((m) => (
                    <Card key={m.id} accent={colors.health}>
                      <Text style={typography.body}>{m.meal}</Text>
                      <Text style={typography.bodySmall}>
                        {m.mealType ?? 'meal'}{m.calories ? ` · ${m.calories} cal` : ''}
                      </Text>
                    </Card>
                  ))}
                </View>
              </View>
            )}

            {/* Today workouts */}
            {todayWorkouts.length > 0 && (
              <View>
                <Text style={[typography.label, { marginBottom: spacing.sm }]}>TODAY'S WORKOUTS</Text>
                <View style={{ gap: spacing.sm }}>
                  {todayWorkouts.map((w) => (
                    <Card key={w.id} accent={colors.chat}>
                      <Text style={typography.body}>{w.type}</Text>
                      <Text style={typography.bodySmall}>{w.duration}min · {w.intensity} intensity</Text>
                    </Card>
                  ))}
                </View>
              </View>
            )}

            <QuickPromptBlock
              prompts={['What should I eat today?', 'I want to work out, suggest something', 'Check in on my mood']}
            />
          </>
        )}

        {tab === 'meals' && (
          <>
            {meals.length === 0 ? (
              <EmptyState icon="🥗" text="No meals logged yet. Tell Clarence what you ate." prompt="Log a meal for me" />
            ) : (
              meals.map((m) => (
                <Card key={m.id} accent={colors.health}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={typography.body}>{m.meal}</Text>
                    {m.calories && <Text style={{ color: colors.health, fontWeight: '600', fontSize: 14 }}>{m.calories} cal</Text>}
                  </View>
                  <Text style={typography.bodySmall}>
                    {m.mealType ?? 'meal'} · {new Date(m.timestamp).toLocaleDateString()}
                  </Text>
                  {m.notes && <Text style={[typography.bodySmall, { marginTop: 4 }]}>{m.notes}</Text>}
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'workouts' && (
          <>
            {workouts.length === 0 ? (
              <EmptyState icon="🏃" text="No workouts logged yet." prompt="Log a workout for me" />
            ) : (
              workouts.map((w) => (
                <Card key={w.id} accent={colors.chat}>
                  <Text style={typography.body}>{w.type}</Text>
                  <Text style={typography.bodySmall}>
                    {w.duration}min · {w.intensity} · {new Date(w.timestamp).toLocaleDateString()}
                  </Text>
                  {w.notes && <Text style={[typography.bodySmall, { marginTop: 4 }]}>{w.notes}</Text>}
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'mood' && (
          <>
            {moods.length === 0 ? (
              <EmptyState icon="💭" text="No mood check-ins yet." prompt="How am I feeling today?" />
            ) : (
              moods.map((m) => (
                <Card key={m.id} accent={colors.primary}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={{ fontSize: 24 }}>{MOOD_EMOJI(m.score)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.h3, { color: colors.primary }]}>{m.score}/10</Text>
                      <Text style={typography.caption}>{new Date(m.timestamp).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  {m.notes && (
                    <Text style={[typography.bodySmall, { marginTop: spacing.sm }]}>{m.notes}</Text>
                  )}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: 4,
      }}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ fontSize: 20, fontWeight: '700', color }}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, text, prompt }: { icon: string; text: string; prompt: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
      <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>{icon}</Text>
      <Text style={[typography.bodySmall, { textAlign: 'center', marginBottom: spacing.md }]}>{text}</Text>
      <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt } })}>
        <Text style={{ color: colors.health, fontWeight: '600', fontSize: 14 }}>Ask Clarence →</Text>
      </TouchableOpacity>
    </Card>
  );
}

function QuickPromptBlock({ prompts }: { prompts: string[] }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {prompts.map((p, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: p } })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{p}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
