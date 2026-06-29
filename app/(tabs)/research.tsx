import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { useResearchStore, type ThesisStage } from '../../stores/research';
import { ThesisCard } from '../../components/research/ThesisCard';

const STAGES: { key: ThesisStage | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'developing', label: 'Developing' },
  { key: 'testing', label: 'Testing' },
  { key: 'watching', label: 'Watching' },
  { key: 'closed', label: 'Closed' },
];

const THESIS_PROMPTS = [
  'Develop a short thesis on commercial real estate',
  'Build a long thesis on nuclear energy stocks',
  'Analyze the contrarian case for regional banks',
  'What\'s the bear case for AI infrastructure capex?',
];

export default function ResearchScreen() {
  const [activeFilter, setActiveFilter] = useState<ThesisStage | 'all'>('active');
  const { theses, deleteThesis } = useResearchStore();

  const filtered = activeFilter === 'all'
    ? theses
    : theses.filter((t) => t.stage === activeFilter);

  const sorted = [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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
        <Text style={[typography.caption, { letterSpacing: 2, marginBottom: 4 }]}>THESIS MANAGEMENT</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={typography.h2}>Research</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: 'I want to develop a new investment thesis. Ask me about what sector or security to focus on.' } })}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 2,
            }}
          >
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>New Thesis</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stage filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, flexDirection: 'row' }}
      >
        {STAGES.map((s) => {
          const count = s.key === 'all' ? theses.length : theses.filter((t) => t.stage === s.key).length;
          const isActive = activeFilter === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              onPress={() => setActiveFilter(s.key)}
              style={{
                backgroundColor: isActive ? colors.primary : colors.surfaceElevated,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: isActive ? colors.primary : colors.border,
                paddingHorizontal: spacing.md,
                paddingVertical: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text style={{
                color: isActive ? '#fff' : colors.textSecondary,
                fontSize: 12,
                fontWeight: isActive ? '700' : '500',
              }}>
                {s.label}
              </Text>
              {count > 0 && (
                <View style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.border,
                  borderRadius: radius.full,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}>
                  <Text style={{ color: isActive ? '#fff' : colors.textMuted, fontSize: 10 }}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
        {sorted.length === 0 ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <Text style={[typography.bodySmall, { textAlign: 'center', marginBottom: spacing.lg }]}>
              {activeFilter === 'active'
                ? 'No active theses. Develop one in the Analyst chat.'
                : `No ${activeFilter} theses.`}
            </Text>

            {activeFilter !== 'closed' && (
              <>
                <Text style={[typography.label, { marginBottom: spacing.sm }]}>TRY ASKING:</Text>
                {THESIS_PROMPTS.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: p } })}
                    style={{
                      backgroundColor: colors.surfaceElevated,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: spacing.sm + 4,
                      width: '100%',
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        ) : (
          sorted.map((t) => (
            <View key={t.id}>
              <ThesisCard thesis={t} />
              {/* Action row */}
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: -spacing.xs, marginBottom: spacing.sm, paddingLeft: 4 }}>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: `Pressure test my thesis: "${t.title}" (thesis ID: ${t.id}). Challenge the weakest assumptions with data.` } })}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.sm + 2,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '600' }}>⚡ Pressure Test</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: `Generate a full PDF report for my thesis: "${t.title}" (thesis ID: ${t.id})` } })}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.sm + 2,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '600' }}>📄 PDF Report</Text>
                </TouchableOpacity>
                {t.ticker && (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: `Fetch latest data for ${t.ticker} and update the performance notes on thesis ${t.id}` } })}
                    style={{
                      backgroundColor: colors.surfaceElevated,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: spacing.sm + 2,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ color: colors.gain, fontSize: 11, fontWeight: '600' }}>📈 Track</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
