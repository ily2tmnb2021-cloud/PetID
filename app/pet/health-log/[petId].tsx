import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase, HealthLog } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const LOG_TYPE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  diet: { label: 'Diet', color: '#68D391', emoji: '🥗' },
  weight: { label: 'Weight', color: '#7B9FE0', emoji: '⚖️' },
  medication: { label: 'Medication', color: '#FC8181', emoji: '💊' },
  allergy: { label: 'Allergy', color: '#F6AD55', emoji: '⚠️' },
  pregnancy: { label: 'Pregnancy', color: '#F687B3', emoji: '🤰' },
  vet_note: { label: 'Vet Note', color: '#4CAF82', emoji: '🏥' },
  vaccination: { label: 'Vaccination', color: '#63B3ED', emoji: '💉' },
  other: { label: 'Other', color: '#9AB09A', emoji: '📝' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HealthLogScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!petId) return;
    console.log('[HealthLog] Fetching logs for pet:', petId);
    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('pet_id', petId)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('[HealthLog] Error fetching logs:', error.message);
    } else {
      console.log('[HealthLog] Logs loaded:', data?.length ?? 0);
      setLogs(data ?? []);
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleAddLog = () => {
    console.log('[HealthLog] Add log pressed for pet:', petId);
    router.push(`/pet/health-log/add/${petId}`);
  };

  // Group by log_type
  const grouped = React.useMemo(() => {
    const groups: Record<string, HealthLog[]> = {};
    logs.forEach((log) => {
      if (!groups[log.log_type]) groups[log.log_type] = [];
      groups[log.log_type].push(log);
    });
    return groups;
  }, [logs]);

  const groupKeys = Object.keys(grouped);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen
        options={{
          title: 'Health Log',
          headerShown: true,
          headerRight: () => (
            <AnimatedPressable onPress={handleAddLog}>
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={18} color="#FFFFFF" />
              </View>
            </AnimatedPressable>
          ),
        }}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : logs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
          <Text style={{ fontSize: 40 }}>📋</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>No health logs yet</Text>
          <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center' }}>
            Start tracking your pet's health by adding the first log entry.
          </Text>
          <AnimatedPressable onPress={handleAddLog}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Add first entry</Text>
            </View>
          </AnimatedPressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {groupKeys.map((type) => {
            const config = LOG_TYPE_CONFIG[type] ?? { label: type, color: COLORS.primary, emoji: '📝' };
            const entries = grouped[type];
            return (
              <View key={type} style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>{config.emoji}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{config.label}</Text>
                  <View
                    style={{
                      backgroundColor: config.color + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: config.color }}>
                      {entries.length}
                    </Text>
                  </View>
                </View>

                {entries.map((log) => {
                  const dateDisplay = formatDate(log.logged_at);
                  return (
                    <View
                      key={log.id}
                      style={{
                        backgroundColor: surface,
                        borderRadius: 14,
                        padding: 14,
                        gap: 6,
                        borderWidth: 1,
                        borderColor: borderColor,
                        borderLeftWidth: 3,
                        borderLeftColor: config.color,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, flex: 1 }}>
                          {log.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: textSecondary }}>{dateDisplay}</Text>
                      </View>

                      {log.description ? (
                        <Text style={{ fontSize: 14, color: textSecondary, lineHeight: 20 }}>
                          {log.description}
                        </Text>
                      ) : null}

                      {log.value_numeric != null ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: config.color }}>
                            {log.value_numeric}
                          </Text>
                          {log.value_unit ? (
                            <Text style={{ fontSize: 13, color: textSecondary }}>{log.value_unit}</Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      <AnimatedPressable
        onPress={handleAddLog}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 20,
          right: 20,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Plus size={24} color="#FFFFFF" />
        </View>
      </AnimatedPressable>
    </View>
  );
}
