import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useTripsStore, type Trip } from '../../stores/trips';

const STATUS_COLORS = {
  planning: colors.primary,
  booked: colors.health,
  completed: colors.textMuted,
};

export default function TripsScreen() {
  const { trips, deleteTrip } = useTripsStore();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {selectedTrip && (
            <TouchableOpacity onPress={() => setSelectedTripId(null)}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={typography.h2}>{selectedTrip ? selectedTrip.destination : 'Trips'}</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/(tabs)/chat', params: { prompt: 'Help me plan a trip' } })
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.trips,
            borderRadius: radius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          }}
        >
          <Ionicons name="add" size={16} color={colors.bg} />
          <Text style={{ color: colors.bg, fontSize: 13, fontWeight: '600' }}>Plan</Text>
        </TouchableOpacity>
      </View>

      {selectedTrip ? (
        <TripDetail trip={selectedTrip} onDelete={() => { deleteTrip(selectedTrip.id); setSelectedTripId(null); }} />
      ) : (
        <TripList trips={trips} onSelect={setSelectedTripId} />
      )}
    </SafeAreaView>
  );
}

function TripList({ trips, onSelect }: { trips: Trip[]; onSelect: (id: string) => void }) {
  const active = trips.filter((t) => t.status !== 'completed');
  const past = trips.filter((t) => t.status === 'completed');

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      {trips.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
          <Text style={{ fontSize: 40, marginBottom: spacing.md }}>✈️</Text>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>No trips yet.</Text>
          <Text style={[typography.bodySmall, { textAlign: 'center', marginBottom: spacing.lg }]}>
            Tell Clarence where you want to go and I'll help you plan it.
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/(tabs)/chat', params: { prompt: "I want to plan a trip. Where should I go?" } })
            }
          >
            <Text style={{ color: colors.trips, fontWeight: '600', fontSize: 15 }}>
              Ask Clarence for ideas →
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      {active.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={typography.label}>UPCOMING</Text>
          {active.map((t) => (
            <TripCard key={t.id} trip={t} onPress={() => onSelect(t.id)} />
          ))}
        </View>
      )}

      {past.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={typography.label}>PAST</Text>
          {past.map((t) => (
            <TripCard key={t.id} trip={t} onPress={() => onSelect(t.id)} />
          ))}
        </View>
      )}

      {/* Inspiration prompts */}
      <View style={{ gap: spacing.sm }}>
        <Text style={typography.label}>GET INSPIRED</Text>
        {[
          "Suggest a weekend trip near me",
          "Best places for a solo trip this summer",
          "Budget-friendly international destinations",
          "Plan a 5-day Japan itinerary",
        ].map((p, i) => (
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
    </ScrollView>
  );
}

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const color = STATUS_COLORS[trip.status];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card accent={color}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h3, { marginBottom: 4 }]}>{trip.destination}</Text>
            <Text style={typography.bodySmall}>
              {trip.startDate && trip.endDate
                ? `${trip.startDate} → ${trip.endDate}`
                : trip.startDate ?? 'Dates TBD'}
            </Text>
            <Text style={[typography.bodySmall, { marginTop: 4 }]}>
              {trip.itinerary.length} item{trip.itinerary.length !== 1 ? 's' : ''} planned
            </Text>
          </View>
          <Badge label={trip.status} color={color} />
        </View>
        {trip.notes && (
          <Text style={[typography.bodySmall, { marginTop: spacing.sm, fontStyle: 'italic' }]}>
            {trip.notes}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function TripDetail({ trip, onDelete }: { trip: Trip; onDelete: () => void }) {
  const color = STATUS_COLORS[trip.status];
  const maxDay = Math.max(...trip.itinerary.map((i) => i.day), 1);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      {/* Trip info */}
      <Card accent={color} elevated>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Badge label={trip.status} color={color} />
            {(trip.startDate || trip.endDate) && (
              <Text style={[typography.bodySmall, { marginTop: spacing.sm }]}>
                {trip.startDate}{trip.endDate ? ` → ${trip.endDate}` : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/chat',
                params: { prompt: `Add more to my ${trip.destination} itinerary (trip ID: ${trip.id})` },
              })
            }
            style={{
              backgroundColor: color,
              borderRadius: radius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
            }}
          >
            <Text style={{ color: colors.bg, fontWeight: '600', fontSize: 13 }}>Add items</Text>
          </TouchableOpacity>
        </View>
        {trip.notes && (
          <Text style={[typography.bodySmall, { marginTop: spacing.sm, lineHeight: 20 }]}>
            {trip.notes}
          </Text>
        )}
      </Card>

      {/* Map placeholder */}
      <View
        style={{
          height: 160,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        }}
      >
        <Ionicons name="map-outline" size={32} color={colors.textMuted} />
        <Text style={typography.bodySmall}>Map view</Text>
        <Text style={[typography.caption, { textAlign: 'center', paddingHorizontal: spacing.lg }]}>
          Requires react-native-maps native build configuration
        </Text>
      </View>

      {/* Itinerary */}
      {trip.itinerary.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <Text style={[typography.bodySmall, { marginBottom: spacing.md }]}>No itinerary yet.</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/chat',
                params: { prompt: `Build a detailed itinerary for my ${trip.destination} trip (trip ID: ${trip.id})` },
              })
            }
          >
            <Text style={{ color, fontWeight: '600', fontSize: 14 }}>
              Ask Clarence to build one →
            </Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Text style={typography.label}>ITINERARY</Text>
          {days.map((day) => {
            const items = trip.itinerary
              .filter((i) => i.day === day)
              .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
            return (
              <View key={day}>
                <Text style={[typography.label, { color, marginBottom: spacing.sm }]}>
                  Day {day}
                </Text>
                <View style={{ gap: spacing.sm }}>
                  {items.map((item) => (
                    <Card key={item.id} accent={color} style={{ paddingVertical: spacing.sm }}>
                      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                        {item.time && (
                          <Text style={[typography.caption, { color, minWidth: 40, paddingTop: 2 }]}>
                            {item.time}
                          </Text>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={typography.body}>{item.activity}</Text>
                          {item.location && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                              <Text style={typography.caption}>{item.location}</Text>
                            </View>
                          )}
                          {item.notes && (
                            <Text style={[typography.bodySmall, { marginTop: 4 }]}>{item.notes}</Text>
                          )}
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Delete */}
      <TouchableOpacity
        onPress={onDelete}
        style={{
          alignItems: 'center',
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.danger + '40',
        }}
      >
        <Text style={{ color: colors.danger, fontSize: 14 }}>Delete trip</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
