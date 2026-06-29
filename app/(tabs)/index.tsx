import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { usePortfolioStore } from '../../stores/portfolio';
import { useResearchStore } from '../../stores/research';
import { useWatchlistStore } from '../../stores/watchlist';
import { useOptionsStore } from '../../stores/options';

const QUICK_PROMPTS = [
  'What are the softest assumptions in current AI chip valuations?',
  'Find put-call parity violations in SPY options',
  'Analyze NVDA financials — revenue quality and margin trajectory',
  'Where is the market pricing in too much optimism right now?',
  'Build a DCF for MSFT with bear/base/bull scenarios',
  'Pressure test my most recent thesis',
];

export default function DashboardScreen() {
  const portfolio = usePortfolioStore();
  const research = useResearchStore();
  const watchlist = useWatchlistStore();
  const options = useOptionsStore();

  const activeTheses = research.theses.filter((t) => t.stage !== 'closed');
  const longTheses = activeTheses.filter((t) => t.direction === 'long');
  const shortTheses = activeTheses.filter((t) => t.direction === 'short');
  const recentAnalyses = options.analyses.slice(0, 3);

  function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.sm + 2,
          minWidth: 90,
        }}
      >
        <Text style={[typography.caption, { marginBottom: 4 }]}>{label.toUpperCase()}</Text>
        <Text style={{ color: color ?? colors.text, fontSize: 18, fontWeight: '700', fontFamily: 'monospace' }}>
          {value}
        </Text>
        {sub && <Text style={[typography.caption, { marginTop: 2 }]}>{sub}</Text>}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <Text style={[typography.caption, { letterSpacing: 2, marginBottom: 4 }]}>INVESTMENT RESEARCH</Text>
          <Text style={typography.h1}>Dashboard</Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
          <StatCard
            label="Positions"
            value={String(portfolio.positions.length)}
            sub={portfolio.positions.length ? portfolio.positions.map((p) => p.ticker).join(' · ').slice(0, 20) : 'None tracked'}
          />
          <StatCard
            label="Theses"
            value={String(activeTheses.length)}
            sub={`${longTheses.length}L · ${shortTheses.length}S`}
            color={colors.gold}
          />
          <StatCard
            label="Watchlist"
            value={String(watchlist.entries.length)}
            sub="tracked"
          />
        </View>

        {/* Quick access to chat */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/chat')}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.lg,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 }}>
              Ask the Analyst
            </Text>
            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Quick prompts */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
          <Text style={[typography.label, { marginBottom: spacing.sm }]}>QUICK ANALYSIS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md }}>
              {QUICK_PROMPTS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: p } })}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    maxWidth: 220,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Active Theses */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={typography.label}>ACTIVE THESES</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/research')}>
              <Text style={{ color: colors.primary, fontSize: 12 }}>View all →</Text>
            </TouchableOpacity>
          </View>

          {activeTheses.length === 0 ? (
            <View style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              alignItems: 'center',
            }}>
              <Text style={[typography.bodySmall, { textAlign: 'center' }]}>
                No active theses yet.{'\n'}Start by asking the analyst to develop a thesis on any stock.
              </Text>
            </View>
          ) : (
            activeTheses.slice(0, 3).map((t) => (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/research')}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderLeftWidth: 3,
                  borderLeftColor: t.direction === 'long' ? colors.gain : t.direction === 'short' ? colors.loss : colors.textMuted,
                  padding: spacing.sm + 4,
                  marginBottom: spacing.xs,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.primary, fontSize: 11, fontFamily: 'monospace', fontWeight: '700' }}>
                    {t.ticker ?? 'MACRO'} · {t.direction.toUpperCase()}
                  </Text>
                  <Text style={[typography.bodySmall, { color: colors.text, marginTop: 1 }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  {t.timingRange && (
                    <Text style={[typography.caption, { marginTop: 2 }]}>{t.timingRange}</Text>
                  )}
                </View>
                <Text style={{ color: colors.gold, fontSize: 11 }}>
                  {'★'.repeat(t.conviction)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Watchlist */}
        {watchlist.entries.length > 0 && (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={typography.label}>WATCHLIST</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/markets')}>
                <Text style={{ color: colors.primary, fontSize: 12 }}>Markets →</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {watchlist.entries.map((e) => (
                <TouchableOpacity
                  key={e.ticker}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: `Quick analysis of ${e.ticker}` } })}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.sm + 4,
                    paddingVertical: spacing.sm,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13, fontFamily: 'monospace' }}>
                    {e.ticker}
                  </Text>
                  {e.notes && (
                    <Text style={[typography.caption, { marginTop: 2, maxWidth: 100 }]} numberOfLines={1}>
                      {e.notes}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recent Options Analyses */}
        {recentAnalyses.length > 0 && (
          <View style={{ paddingHorizontal: spacing.md }}>
            <Text style={[typography.label, { marginBottom: spacing.sm }]}>RECENT OPTIONS ANALYSIS</Text>
            {recentAnalyses.map((a) => (
              <View
                key={a.id}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.sm + 4,
                  marginBottom: spacing.xs,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontFamily: 'monospace', fontSize: 13 }}>
                    {a.ticker}
                  </Text>
                  <Text style={typography.caption}>
                    {new Date(a.analysisDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={[typography.bodySmall, { color: colors.text }]}>{a.summary}</Text>
                {a.arbitrageFlags.length > 0 && (
                  <Text style={{ color: colors.gold, fontSize: 11, marginTop: 4 }}>
                    ⚡ {a.arbitrageFlags.length} edge{a.arbitrageFlags.length !== 1 ? 's' : ''} flagged
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
