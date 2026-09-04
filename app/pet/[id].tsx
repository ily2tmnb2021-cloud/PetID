import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Alert,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Pencil,
  Camera,
  Calendar,
  Weight,
  PawPrint,
  FileText,
  ChevronRight,
  Clock,
  Plus,
  Heart,
  Utensils,
  Bone,
  ThumbsDown,
  Activity,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPECIES_COLORS } from '@/constants/Colors';
import { supabase, Pet, VetAppointment, HealthLog } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;

  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: 14,
        padding: 14,
        flex: 1,
        gap: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: isDark ? COLORS.dark.border : COLORS.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 11, color: textSecondary, fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{value}</Text>
    </View>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: color + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

function formatAppointmentDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatLogDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pet, setPet] = useState<Pet | null>(null);
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const fetchPet = useCallback(async () => {
    if (!id) return;
    console.log('[PetDetail] Fetching pet:', id);
    const [petResult, apptResult, logsResult] = await Promise.all([
      supabase.from('pets').select('*').eq('id', id).single(),
      supabase
        .from('vet_appointments')
        .select('*')
        .eq('pet_id', id)
        .eq('is_completed', false)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true })
        .limit(2),
      supabase
        .from('health_logs')
        .select('*')
        .eq('pet_id', id)
        .order('logged_at', { ascending: false })
        .limit(5),
    ]);

    if (petResult.error) {
      console.error('[PetDetail] Error fetching pet:', petResult.error.message);
    } else {
      console.log('[PetDetail] Pet loaded:', petResult.data?.name);
      setPet(petResult.data);
    }

    if (apptResult.error) {
      console.error('[PetDetail] Error fetching appointments:', apptResult.error.message);
    } else {
      setAppointments(apptResult.data ?? []);
    }

    if (logsResult.error) {
      console.error('[PetDetail] Error fetching health logs:', logsResult.error.message);
    } else {
      setHealthLogs(logsResult.data ?? []);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const handleEdit = () => {
    console.log('[PetDetail] Edit pet pressed:', id);
    router.push(`/pet/edit/${id}`);
  };

  const handleIdentify = () => {
    console.log('[PetDetail] Identify breed pressed for pet:', id);
    router.push(`/(tabs)/identify?petId=${id}`);
  };

  const handleAddHealthLog = () => {
    console.log('[PetDetail] Add health log pressed for pet:', id);
    router.push(`/pet/health-log/add/${id}`);
  };

  const handleViewAllLogs = () => {
    console.log('[PetDetail] View all health logs pressed for pet:', id);
    router.push(`/pet/health-log/${id}`);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <Stack.Screen options={{ title: '' }} />
        <View style={{ height: 280, backgroundColor: COLORS.surfaceSecondary }} />
        <View style={{ padding: 20, gap: 16 }}>
          <SkeletonLine width="50%" height={28} />
          <SkeletonLine width="30%" height={16} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SkeletonLine width="45%" height={80} borderRadius={14} />
            <SkeletonLine width="45%" height={80} borderRadius={14} />
          </View>
        </View>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: 'Pet not found' }} />
        <Text style={{ color: textSecondary }}>Pet not found</Text>
      </View>
    );
  }

  const speciesColor = SPECIES_COLORS[pet.species] ?? COLORS.primary;
  const speciesLabel = pet.species.charAt(0).toUpperCase() + pet.species.slice(1);
  const genderLabel = pet.gender ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1) : null;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <AnimatedPressable onPress={handleEdit}>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Pencil size={14} color={COLORS.text} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>Edit</Text>
              </View>
            </AnimatedPressable>
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero */}
        <View style={{ height: 280, position: 'relative' }}>
          {pet.photo_url ? (
            <Image
              source={resolveImageSource(pet.photo_url)}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[speciesColor + '40', speciesColor + '20']}
              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: speciesColor + '30',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 48, fontWeight: '800', color: speciesColor }}>
                  {pet.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', isDark ? COLORS.dark.background : COLORS.background]}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
            }}
          />
        </View>

        <View style={{ paddingHorizontal: 20, gap: 20, marginTop: -20 }}>
          {/* Name & species */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '800',
                  color: textColor,
                  letterSpacing: -0.5,
                }}
              >
                {pet.name}
              </Text>
              <View
                style={{
                  backgroundColor: speciesColor + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: speciesColor }}>
                  {speciesLabel}
                </Text>
              </View>
            </View>
            {pet.breed ? (
              <Text style={{ fontSize: 16, color: textSecondary }}>{pet.breed}</Text>
            ) : null}
          </View>

          {/* Info grid */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {pet.age_years != null ? (
              <InfoCard
                icon={<Calendar size={18} color={COLORS.primary} />}
                label="Age"
                value={`${pet.age_years} year${pet.age_years !== 1 ? 's' : ''}`}
              />
            ) : null}
            {pet.weight_kg != null ? (
              <InfoCard
                icon={<Weight size={18} color={COLORS.primary} />}
                label="Weight"
                value={`${pet.weight_kg} kg`}
              />
            ) : null}
            {genderLabel ? (
              <InfoCard
                icon={<PawPrint size={18} color={COLORS.primary} />}
                label="Gender"
                value={genderLabel}
              />
            ) : null}
          </View>

          {/* Pet Details section */}
          {(pet.diet_summary || (pet.litter_count != null && pet.litter_count > 0) || pet.microchip_id) ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, letterSpacing: -0.2 }}>
                Pet Details
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                {pet.diet_summary ? (
                  <InfoCard
                    icon={<Utensils size={18} color={COLORS.primary} />}
                    label="Diet"
                    value={pet.diet_summary}
                  />
                ) : null}
                {pet.litter_count != null && pet.litter_count > 0 ? (
                  <InfoCard
                    icon={<Heart size={18} color={COLORS.primary} />}
                    label="Litters"
                    value={`${pet.litter_count} litter${pet.litter_count !== 1 ? 's' : ''}`}
                  />
                ) : null}
                {pet.microchip_id ? (
                  <InfoCard
                    icon={<Activity size={18} color={COLORS.primary} />}
                    label="Microchip"
                    value={pet.microchip_id}
                  />
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Notes */}
          {pet.notes ? (
            <View
              style={{
                backgroundColor: surface,
                borderRadius: 16,
                padding: 16,
                gap: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                borderWidth: 1,
                borderColor: borderColor,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color={COLORS.primary} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>Notes</Text>
              </View>
              <Text style={{ fontSize: 15, color: textSecondary, lineHeight: 22 }}>
                {pet.notes}
              </Text>
            </View>
          ) : null}

          {/* Personality section */}
          {((pet.likes && pet.likes.length > 0) || (pet.dislikes && pet.dislikes.length > 0) || (pet.fav_chew_toys && pet.fav_chew_toys.length > 0)) ? (
            <View
              style={{
                backgroundColor: surface,
                borderRadius: 16,
                padding: 16,
                gap: 14,
                borderWidth: 1,
                borderColor: borderColor,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Heart size={16} color={COLORS.primary} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>Personality</Text>
              </View>

              {pet.likes && pet.likes.length > 0 ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>LIKES</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {pet.likes.map((item, idx) => (
                      <Chip key={idx} label={item} color="#4CAF82" />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {pet.dislikes && pet.dislikes.length > 0 ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>DISLIKES</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {pet.dislikes.map((item, idx) => (
                      <Chip key={idx} label={item} color="#FC8181" />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {pet.fav_chew_toys && pet.fav_chew_toys.length > 0 ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>FAVOURITE CHEW TOYS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {pet.fav_chew_toys.map((item, idx) => (
                      <Chip key={idx} label={item} color="#F6AD55" />
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Upcoming appointments */}
          {appointments.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, letterSpacing: -0.2 }}>
                Upcoming Appointments
              </Text>
              {appointments.map((appt) => {
                const dateDisplay = formatAppointmentDate(appt.appointment_date);
                return (
                  <AnimatedPressable
                    key={appt.id}
                    onPress={() => {
                      console.log('[PetDetail] Appointment pressed:', appt.id);
                      router.push(`/appointment/${appt.id}`);
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: surface,
                        borderRadius: 14,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        borderWidth: 1,
                        borderColor: borderColor,
                        borderLeftWidth: 3,
                        borderLeftColor: COLORS.accent,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: COLORS.accentMuted,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Clock size={18} color={COLORS.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }} numberOfLines={1}>
                          {appt.title}
                        </Text>
                        <Text style={{ fontSize: 13, color: textSecondary }}>
                          {dateDisplay}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={COLORS.textTertiary} />
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          ) : null}

          {/* Health Log section */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, letterSpacing: -0.2 }}>
                Health Log
              </Text>
              <AnimatedPressable onPress={handleAddHealthLog}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: COLORS.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={16} color={COLORS.primary} />
                </View>
              </AnimatedPressable>
            </View>

            {healthLogs.length === 0 ? (
              <AnimatedPressable onPress={handleAddHealthLog}>
                <View
                  style={{
                    backgroundColor: surface,
                    borderRadius: 14,
                    padding: 16,
                    alignItems: 'center',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderStyle: 'dashed',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>📋</Text>
                  <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center' }}>
                    No health logs yet. Tap to add the first entry.
                  </Text>
                </View>
              </AnimatedPressable>
            ) : (
              <>
                {healthLogs.map((log) => {
                  const config = LOG_TYPE_CONFIG[log.log_type] ?? { label: log.log_type, color: COLORS.primary, emoji: '📝' };
                  const dateDisplay = formatLogDate(log.logged_at);
                  return (
                    <View
                      key={log.id}
                      style={{
                        backgroundColor: surface,
                        borderRadius: 14,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderWidth: 1,
                        borderColor: borderColor,
                        borderLeftWidth: 3,
                        borderLeftColor: config.color,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: config.color + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{config.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }} numberOfLines={1}>
                          {log.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={{
                              backgroundColor: config.color + '20',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: config.color }}>
                              {config.label}
                            </Text>
                          </View>
                          {log.value_numeric != null ? (
                            <Text style={{ fontSize: 12, color: textSecondary }}>
                              {log.value_numeric}
                              {log.value_unit ? ` ${log.value_unit}` : ''}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: textSecondary }}>{dateDisplay}</Text>
                    </View>
                  );
                })}

                <AnimatedPressable onPress={handleViewAllLogs}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                      View all logs
                    </Text>
                    <ChevronRight size={14} color={COLORS.primary} />
                  </View>
                </AnimatedPressable>
              </>
            )}
          </View>

          {/* Identify breed button */}
          <AnimatedPressable onPress={handleIdentify}>
            <View
              style={{
                backgroundColor: COLORS.accent,
                paddingVertical: 14,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Camera size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                Identify breed with AI
              </Text>
            </View>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}
