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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPECIES_COLORS } from '@/constants/Colors';
import { supabase, Pet, VetAppointment } from '@/utils/supabase';
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

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pet, setPet] = useState<Pet | null>(null);
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  const fetchPet = useCallback(async () => {
    if (!id) return;
    console.log('[PetDetail] Fetching pet:', id);
    const [petResult, apptResult] = await Promise.all([
      supabase.from('pets').select('*').eq('id', id).single(),
      supabase
        .from('vet_appointments')
        .select('*')
        .eq('pet_id', id)
        .eq('is_completed', false)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true })
        .limit(2),
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
                borderColor: isDark ? COLORS.dark.border : COLORS.border,
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
                        borderColor: isDark ? COLORS.dark.border : COLORS.border,
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
