import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { useFinanceStore } from '../../stores/finance';

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔',
  transport: '🚗',
  entertainment: '🎬',
  utilities: '💡',
  health: '💊',
  clothing: '👕',
  subscriptions: '📱',
  other: '💳',
};

const GOAL_COLORS: Record<string, string> = {
  save: colors.health,
  invest: colors.finance,
  pay_debt: colors.danger,
  emergency_fund: colors.chat,
  purchase: colors.trips,
};

export default function FinanceScreen() {
  const { expenses, goals, monthlyBudget, getMonthExpenses, getMonthTotal } = useFinanceStore();
  const [tab, setTab] = useState<'overview' | 'expenses' | 'goals'>('overview');

  const monthExpenses = getMonthExpenses();
  const monthTotal = getMonthTotal();
  const budgetPct = monthlyBudget ? Math.min((monthTotal / monthlyBudget) * 100, 100) : null;

  const categoryBreakdown = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

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
        <Text style={typography.h2}>Finance</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/(tabs)/chat', params: { prompt: 'Log an expense or set a financial goal' } })
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.finance,
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
        {(['overview', 'expenses', 'goals'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
              backgroundColor: tab === t ? colors.finance : 'transparent',
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
            {/* Monthly spend card */}
            <Card accent={colors.finance} elevated>
              <Text style={typography.label}>THIS MONTH</Text>
              <Text style={[typography.h1, { color: colors.finance, marginTop: 4 }]}>
                ${monthTotal.toFixed(2)}
              </Text>
              {monthlyBudget && (
                <>
                  <Text style={typography.bodySmall}>Budget: ${monthlyBudget.toFixed(2)}</Text>
                  <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: spacing.sm }}>
                    <View
                      style={{
                        width: `${budgetPct ?? 0}%` as `${number}%`,
                        height: 6,
                        backgroundColor: (budgetPct ?? 0) > 90 ? colors.danger : colors.finance,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </>
              )}
              {!monthlyBudget && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/chat', params: { prompt: "Help me set a monthly budget" } })
                  }
                  style={{ marginTop: spacing.sm }}
                >
                  <Text style={{ color: colors.finance, fontSize: 13, fontWeight: '600' }}>
                    Set a budget →
                  </Text>
                </TouchableOpacity>
              )}
            </Card>

            {/* Category breakdown */}
            {Object.keys(categoryBreakdown).length > 0 && (
              <View>
                <Text style={[typography.label, { marginBottom: spacing.sm }]}>BY CATEGORY</Text>
                <View style={{ gap: spacing.sm }}>
                  {Object.entries(categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amt]) => (
                      <View
                        key={cat}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: colors.surface,
                          borderRadius: radius.md,
                          borderWidth: 1,
                          borderColor: colors.border,
                          padding: spacing.md,
                          gap: spacing.md,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{CATEGORY_ICONS[cat] ?? '💳'}</Text>
                        <Text style={[typography.body, { flex: 1 }]}>{cat}</Text>
                        <Text style={{ color: colors.finance, fontWeight: '700', fontSize: 15 }}>
                          ${amt.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Goals preview */}
            {goals.length > 0 && (
              <View>
                <Text style={[typography.label, { marginBottom: spacing.sm }]}>GOALS</Text>
                {goals.slice(0, 2).map((g) => {
                  const pct = Math.min(((g.current ?? 0) / g.target) * 100, 100);
                  const color = GOAL_COLORS[g.type] ?? colors.finance;
                  return (
                    <Card key={g.id} accent={color} style={{ marginBottom: spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={typography.body}>{g.title}</Text>
                        <Text style={{ color, fontWeight: '700', fontSize: 14 }}>
                          ${(g.current ?? 0).toFixed(0)} / ${g.target.toFixed(0)}
                        </Text>
                      </View>
                      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                        <View style={{ width: `${pct}%`, height: 4, backgroundColor: color, borderRadius: 2 }} />
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}

            <QuickPrompts />
          </>
        )}

        {tab === 'expenses' && (
          <>
            {expenses.length === 0 ? (
              <EmptyCard icon="💳" text="No expenses logged yet." prompt="Log an expense for me" />
            ) : (
              expenses.map((e) => (
                <Card key={e.id} accent={colors.finance}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.body}>{e.description}</Text>
                      <Text style={typography.bodySmall}>{e.category} · {e.date}</Text>
                    </View>
                    <Text style={{ color: colors.finance, fontWeight: '700', fontSize: 16, marginLeft: spacing.sm }}>
                      ${e.amount.toFixed(2)}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'goals' && (
          <>
            {goals.length === 0 ? (
              <EmptyCard icon="🎯" text="No financial goals set." prompt="Help me set a financial goal" />
            ) : (
              goals.map((g) => {
                const pct = Math.min(((g.current ?? 0) / g.target) * 100, 100);
                const color = GOAL_COLORS[g.type] ?? colors.finance;
                return (
                  <Card key={g.id} accent={color}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={typography.body}>{g.title}</Text>
                      <Text style={typography.caption}>{g.type}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color, fontWeight: '700', fontSize: 15 }}>
                        ${(g.current ?? 0).toFixed(0)}
                      </Text>
                      <Text style={typography.bodySmall}>of ${g.target.toFixed(0)}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
                      <View style={{ width: `${pct}%`, height: 6, backgroundColor: color, borderRadius: 3 }} />
                    </View>
                    {g.deadline && (
                      <Text style={[typography.caption, { marginTop: spacing.sm }]}>
                        Target: {g.deadline}
                      </Text>
                    )}
                  </Card>
                );
              })
            )}
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: '/(tabs)/chat', params: { prompt: 'Help me set a new financial goal' } })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.borderLight,
                padding: spacing.md,
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.finance} />
              <Text style={{ color: colors.finance, fontWeight: '600', fontSize: 14 }}>Add goal</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickPrompts() {
  const prompts = [
    "Am I spending too much?",
    "How can I save more this month?",
    "Explain investing basics to me",
    "Help me understand my credit score",
  ];
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

function EmptyCard({ icon, text, prompt }: { icon: string; text: string; prompt: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
      <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>{icon}</Text>
      <Text style={[typography.bodySmall, { textAlign: 'center', marginBottom: spacing.md }]}>{text}</Text>
      <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt } })}>
        <Text style={{ color: colors.finance, fontWeight: '600', fontSize: 14 }}>Ask Clarence →</Text>
      </TouchableOpacity>
    </Card>
  );
}
