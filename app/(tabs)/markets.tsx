import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { useWatchlistStore } from '../../stores/watchlist';
import { useOptionsStore } from '../../stores/options';

const OPTIONS_PROMPTS = [
  (t: string) => `Fetch options chain for ${t} and find put-call parity violations`,
  (t: string) => `Analyze IV skew and term structure for ${t} — any edges?`,
  (t: string) => `What options strategy makes sense for ${t} given current implied vol?`,
  (t: string) => `Run full options arbitrage analysis on ${t}`,
];

const MARKET_PROMPTS = [
  'What is the current macro regime and how should it affect positioning?',
  'Scan for sectors where put skew is unusually elevated',
  'Where is consensus most wrong right now — show me the soft assumptions',
  'Compare implied vol to realized vol across major indices',
];

export default function MarketsScreen() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'options' | 'macro'>('watchlist');
  const [searchTicker, setSearchTicker] = useState('');
  const watchlist = useWatchlistStore();
  const options = useOptionsStore();

  function Section({ label }: { label: string }) {
    return <Text style={[typography.label, { marginBottom: spacing.sm, marginTop: spacing.md }]}>{label}</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Text style={[typography.caption, { letterSpacing: 2, marginBottom: 4 }]}>MARKET INTELLIGENCE</Text>
        <Text style={typography.h2}>Markets</Text>
      </View>

      {/* Tab selector */}
      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm }}>
        {(['watchlist', 'options', 'macro'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              backgroundColor: activeTab === tab ? colors.primary : colors.surfaceElevated,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: activeTab === tab ? colors.primary : colors.border,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: activeTab === tab ? '#fff' : colors.textSecondary,
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'capitalize',
            }}>
              {tab === 'options' ? 'Options' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>

        {/* ── WATCHLIST TAB ── */}
        {activeTab === 'watchlist' && (
          <>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: spacing.sm + 4,
                gap: spacing.sm,
              }}>
                <Ionicons name="search-outline" size={14} color={colors.textMuted} />
                <TextInput
                  value={searchTicker}
                  onChangeText={(t) => setSearchTicker(t.toUpperCase())}
                  placeholder="Add ticker���"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  style={{ flex: 1, color: colors.text, fontSize: 14, paddingVertical: 8, fontFamily: 'monospace' }}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (searchTicker.trim()) {
                    router.push({ pathname: '/(tabs)/chat', params: { prompt: `Quick analysis of ${searchTicker.trim()}` } });
                    setSearchTicker('');
                  }
                }}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Analyze</Text>
              </TouchableOpacity>
            </View>

            {watchlist.entries.length === 0 ? (
              <View style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                alignItems: 'center',
              }}>
                <Text style={[typography.bodySmall, { textAlign: 'center' }]}>
                  Your watchlist is empty.{'\n'}Ask the analyst to add tickers: "Add NVDA, MSFT, and AAPL to watchlist."
                </Text>
              </View>
            ) : (
              watchlist.entries.map((entry) => (
                <View
                  key={entry.ticker}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16, fontFamily: 'monospace' }}>
                        {entry.ticker}
                      </Text>
                      {entry.tags?.map((tag) => (
                        <View key={tag} style={{ backgroundColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: colors.textMuted, fontSize: 10 }}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => watchlist.remove(entry.ticker)}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {entry.notes && (
                    <Text style={[typography.bodySmall, { marginBottom: 8, lineHeight: 17 }]}>{entry.notes}</Text>
                  )}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {[
                      { label: '📊 Analyze', prompt: `Deep analysis of ${entry.ticker} — financials, valuation, and contrarian view` },
                      { label: '⚡ Options', prompt: `Fetch options chain for ${entry.ticker} and analyze for arbitrage opportunities` },
                      { label: '📄 Report', prompt: `Generate a comprehensive PDF research report on ${entry.ticker}` },
                    ].map(({ label, prompt }) => (
                      <TouchableOpacity
                        key={label}
                        activeOpacity={0.8}
                        onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt } })}
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: radius.sm,
                          borderWidth: 1,
                          borderColor: colors.border,
                          paddingHorizontal: spacing.sm + 2,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── OPTIONS TAB ── */}
        {activeTab === 'options' && (
          <>
            <Section label="QUICK OPTIONS ANALYSIS" />
            {watchlist.entries.slice(0, 5).map((entry) => (
              <View
                key={entry.ticker}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15, fontFamily: 'monospace', marginBottom: 8 }}>
                  {entry.ticker}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {OPTIONS_PROMPTS.map((fn, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.8}
                      onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: fn(entry.ticker) } })}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: radius.sm,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 5,
                        maxWidth: 180,
                      }}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 11 }} numberOfLines={2}>{fn(entry.ticker).slice(0, 50)}…</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {watchlist.entries.length === 0 && (
              <View style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                alignItems: 'center',
              }}>
                <Text style={[typography.bodySmall, { textAlign: 'center' }]}>
                  Add tickers to your watchlist to enable quick options analysis.
                </Text>
              </View>
            )}

            {options.analyses.length > 0 && (
              <>
                <Section label="RECENT ARBITRAGE ANALYSIS" />
                {options.analyses.slice(0, 5).map((a) => (
                  <View
                    key={a.id}
                    style={{
                      backgroundColor: colors.surfaceElevated,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14, fontFamily: 'monospace' }}>{a.ticker}</Text>
                      <Text style={typography.caption}>
                        {new Date(a.analysisDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={[typography.bodySmall, { marginBottom: 8 }]}>{a.summary}</Text>
                    {a.arbitrageFlags.slice(0, 2).map((f, i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: `${colors.gold}10`,
                          borderRadius: radius.sm,
                          borderWidth: 1,
                          borderColor: `${colors.gold}30`,
                          padding: spacing.sm,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
                          {f.type.replace(/_/g, ' ').toUpperCase()} · {f.confidence.toUpperCase()}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }}>{f.description}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ── MACRO TAB ── */}
        {activeTab === 'macro' && (
          <>
            <Section label="MACRO RESEARCH PROMPTS" />
            {MARKET_PROMPTS.map((p, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: p } })}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodySmall, { color: colors.text, lineHeight: 19 }]}>{p}</Text>
                </View>
                <Ionicons name="arrow-forward-outline" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}

            <Section label="CUSTOM ANALYSIS" />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/chat')}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
                padding: spacing.lg,
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.textMuted} />
              <Text style={[typography.bodySmall, { textAlign: 'center' }]}>
                Ask anything — market regime, sector rotation, factor analysis, or macro overlays on your positions
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
