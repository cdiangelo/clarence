import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { useResearchStore } from '../../stores/research';
import { useOptionsStore } from '../../stores/options';
import { useChatStore } from '../../stores/chat';
import { generateAndSharePdf, buildThesisReport } from '../../lib/reports';

const REPORT_TEMPLATES = [
  {
    title: 'Comprehensive Stock Analysis',
    description: 'Full deep-dive: financials, valuation, thesis, options positioning, and timing',
    icon: 'analytics-outline',
    prompt: (ticker: string) => `Generate a comprehensive PDF research report on ${ticker || '[specify ticker]'} including: executive summary, 3-year financial analysis with charts, DCF valuation with bear/base/bull, thesis with assumption mapping, options positioning strategy, and risk register`,
  },
  {
    title: 'Options Arbitrage Report',
    description: 'Full options chain analysis, IV surface, and arbitrage opportunities',
    icon: 'git-branch-outline',
    prompt: (ticker: string) => `Run full options arbitrage analysis on ${ticker || '[specify ticker]'} and generate a PDF report with: IV rank, skew analysis, put-call parity checks, and specific trade recommendations`,
  },
  {
    title: 'Thesis Document',
    description: 'Professional investment thesis with assumptions and pressure test',
    icon: 'document-text-outline',
    prompt: () => 'Generate a PDF report for my most recently developed thesis. Include the hypothesis, key assumptions with softness flags, catalysts, risks, and timing analysis.',
  },
  {
    title: 'Portfolio Review',
    description: 'Current positions vs. thesis expectations and market conditions',
    icon: 'briefcase-outline',
    prompt: () => 'Generate a portfolio review PDF: for each position compare current price vs. thesis target, assess whether the original thesis still holds, and flag any positions where assumptions have changed.',
  },
  {
    title: 'Macro Research Note',
    description: 'Macro regime analysis and implication for current positions',
    icon: 'globe-outline',
    prompt: () => 'Write a macro research note as a PDF: current economic regime, key leading indicators, where consensus is wrong, and implications for our watchlist and portfolio positions.',
  },
];

export default function ReportsScreen() {
  const research = useResearchStore();
  const options = useOptionsStore();
  const chat = useChatStore();

  const closedTheses = research.theses.filter((t) => t.stage === 'closed');
  const recentCharts = chat.messages
    .filter((m) => m.charts && m.charts.length > 0)
    .slice(-5)
    .reverse();

  async function exportThesisPdf(thesisId: string) {
    const thesis = research.getThesis(thesisId);
    if (!thesis) return;
    const opts = buildThesisReport(thesis);
    await generateAndSharePdf(opts);
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
        <Text style={[typography.caption, { letterSpacing: 2, marginBottom: 4 }]}>ANALYTICS & REPORTS</Text>
        <Text style={typography.h2}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>

        {/* Generate New Report */}
        <Text style={[typography.label, { marginTop: spacing.md, marginBottom: spacing.sm }]}>GENERATE REPORT</Text>
        {REPORT_TEMPLATES.map((tmpl, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: tmpl.prompt('') } })}
            style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              marginBottom: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: radius.md,
              backgroundColor: `${colors.primary}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={tmpl.icon as React.ComponentProps<typeof Ionicons>['name']} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { fontSize: 14, marginBottom: 2 }]}>{tmpl.title}</Text>
              <Text style={[typography.bodySmall, { lineHeight: 17 }]}>{tmpl.description}</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Export saved theses */}
        {research.theses.length > 0 && (
          <>
            <Text style={[typography.label, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
              EXPORT THESIS AS PDF
            </Text>
            {research.theses.slice(0, 5).map((t) => (
              <View
                key={t.id}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: 3 }}>
                    {t.ticker && (
                      <Text style={{ color: colors.primary, fontWeight: '700', fontFamily: 'monospace', fontSize: 12 }}>
                        {t.ticker}
                      </Text>
                    )}
                    <Text style={{ color: t.direction === 'long' ? colors.gain : t.direction === 'short' ? colors.loss : colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                      {t.direction.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[typography.bodySmall, { color: colors.text }]} numberOfLines={1}>{t.title}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => exportThesisPdf(t.id)}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.sm + 2,
                    paddingVertical: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Ionicons name="share-outline" size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Export</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Recent charts from chat */}
        {recentCharts.length > 0 && (
          <>
            <Text style={[typography.label, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
              RECENT CHARTS
            </Text>
            {recentCharts.map((msg) =>
              msg.charts?.map((chart) => (
                <View
                  key={chart.id}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                  }}
                >
                  <Ionicons
                    name={chart.type === 'candlestick' ? 'stats-chart-outline' : chart.type === 'radar' ? 'radio-outline' : 'bar-chart-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodySmall, { color: colors.text }]}>{chart.title}</Text>
                    {chart.subtitle && <Text style={typography.caption}>{chart.subtitle}</Text>}
                    <Text style={[typography.caption, { marginTop: 2 }]}>{chart.type} chart</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: `Recreate the ${chart.type} chart: "${chart.title}"` } })}
                    style={{ backgroundColor: colors.surfaceElevated, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 6 }}
                  >
                    <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* Setup for Claude Projects */}
        <View style={{
          marginTop: spacing.xl,
          backgroundColor: `${colors.primary}10`,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: `${colors.primary}30`,
          padding: spacing.md,
        }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm }}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primaryLight} />
            <Text style={{ color: colors.primaryLight, fontWeight: '700', fontSize: 13 }}>Claude Projects Setup</Text>
          </View>
          <Text style={[typography.bodySmall, { lineHeight: 18 }]}>
            To use this analyst system in Claude.ai Projects, see CLAUDE_PROJECTS_SETUP.md in the project root for the system prompt to paste.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: 'How do I set this up as a Claude Project?' } })}
            style={{ marginTop: spacing.sm }}
          >
            <Text style={{ color: colors.primary, fontSize: 12 }}>Ask the analyst for setup instructions →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
