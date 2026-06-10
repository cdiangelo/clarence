import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useScheduleStore } from '../../stores/schedule';

const CATEGORY_COLORS: Record<string, string> = {
  work: colors.primary,
  personal: colors.chat,
  health: colors.health,
  social: colors.trips,
  finance: colors.finance,
};

function getDaysInView(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function ScheduleScreen() {
  const { events, deleteEvent, getEventsForDate } = useScheduleStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const days = getDaysInView();
  const selectedEvents = getEventsForDate(selectedDate);

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
        <Text style={typography.h2}>Schedule</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prompt: 'Help me add an event to my schedule' } })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.primary,
            borderRadius: radius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          }}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Week strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs }}
      >
        {days.map((day) => {
          const d = new Date(day);
          const isSelected = day === selectedDate;
          const isToday = day === new Date().toISOString().split('T')[0];
          const evCount = getEventsForDate(day).length;

          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDate(day)}
              style={{
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: isSelected ? colors.primary : 'transparent',
                minWidth: 52,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: isSelected ? '#fff' : colors.textMuted,
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isSelected ? '#fff' : isToday ? colors.primary : colors.text,
                }}
              >
                {d.getDate()}
              </Text>
              {evCount > 0 && (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : colors.primary,
                    marginTop: 3,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events for selected day */}
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, flexGrow: 1 }}>
        <Text style={[typography.label, { marginBottom: spacing.xs }]}>
          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        </Text>

        {selectedEvents.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>📅</Text>
            <Text style={typography.bodySmall}>Nothing scheduled.</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/chat',
                  params: { prompt: `Add an event on ${selectedDate}` },
                })
              }
              style={{ marginTop: spacing.md }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                Ask Clarence to add one →
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          selectedEvents
            .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
            .map((e) => (
              <Card key={e.id} accent={CATEGORY_COLORS[e.category ?? ''] ?? colors.primary}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { marginBottom: 4 }]}>{e.title}</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                      {e.time && (
                        <Text style={typography.bodySmall}>
                          {e.time}{e.duration ? ` · ${e.duration}min` : ''}
                        </Text>
                      )}
                      {e.category && (
                        <Badge
                          label={e.category}
                          color={CATEGORY_COLORS[e.category] ?? colors.primary}
                        />
                      )}
                    </View>
                    {e.description && (
                      <Text style={[typography.bodySmall, { marginTop: 6, lineHeight: 18 }]}>
                        {e.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => deleteEvent(e.id)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
