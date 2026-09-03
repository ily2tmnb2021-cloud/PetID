import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  useColorScheme,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Plus,
  Calendar,
  MapPin,
  Star,
  Search,
  Check,
  Clock,
  ChevronRight,
  TreePine,
} from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase, VetAppointment, DogPark } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppointmentCardSkeleton, SkeletonLine } from '@/components/SkeletonLoader';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
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

function AppointmentCard({ appt, index, onComplete }: { appt: VetAppointment; index: number; onComplete: (id: string) => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;

  const isUpcoming = !appt.is_completed && new Date(appt.appointment_date) >= new Date();
  const statusColor = appt.is_completed ? COLORS.primary : isUpcoming ? COLORS.accent : COLORS.textTertiary;
  const statusLabel = appt.is_completed ? 'Completed' : isUpcoming ? 'Upcoming' : 'Past';
  const dateDisplay = formatAppointmentDate(appt.appointment_date);

  const handlePress = () => {
    console.log('[Schedule] Appointment card pressed:', appt.id, appt.title);
    router.push(`/appointment/${appt.id}`);
  };

  const handleComplete = () => {
    console.log('[Schedule] Mark appointment complete pressed:', appt.id);
    onComplete(appt.id);
  };

  return (
    <AnimatedListItem index={index}>
      <AnimatedPressable onPress={handlePress}>
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 10,
            gap: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
            borderWidth: 1,
            borderColor: isDark ? COLORS.dark.border : COLORS.border,
            borderLeftWidth: 3,
            borderLeftColor: statusColor,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={12} color={COLORS.textTertiary} />
                <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>
                  {dateDisplay}
                </Text>
              </View>
              <Text
                style={{ fontSize: 17, fontWeight: '700', color: textColor, letterSpacing: -0.2 }}
                numberOfLines={1}
              >
                {appt.title}
              </Text>
              {appt.vet_name || appt.clinic_name ? (
                <Text style={{ fontSize: 13, color: textSecondary }} numberOfLines={1}>
                  {[appt.vet_name, appt.clinic_name].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View
                style={{
                  backgroundColor: statusColor + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor }}>
                  {statusLabel}
                </Text>
              </View>
              {!appt.is_completed ? (
                <AnimatedPressable onPress={handleComplete}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: COLORS.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={14} color={COLORS.primary} />
                  </View>
                </AnimatedPressable>
              ) : null}
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </AnimatedListItem>
  );
}

function StarRating({ rating }: { rating: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map((s) => (
        <Star
          key={s}
          size={12}
          color={s <= Math.round(rating) ? COLORS.warning : COLORS.textTertiary}
          fill={s <= Math.round(rating) ? COLORS.warning : 'transparent'}
        />
      ))}
    </View>
  );
}

function ParkCard({ park, index }: { park: DogPark; index: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;

  const visibleAmenities = (park.amenities ?? []).slice(0, 3);
  const ratingDisplay = typeof park.rating === 'number' ? park.rating.toFixed(1) : '—';

  const handlePress = () => {
    console.log('[Schedule] Park card pressed:', park.id, park.name);
    router.push(`/park/${park.id}`);
  };

  return (
    <AnimatedListItem index={index}>
      <AnimatedPressable onPress={handlePress}>
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 16,
            marginBottom: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
            borderWidth: 1,
            borderColor: isDark ? COLORS.dark.border : COLORS.border,
          }}
        >
          {park.photo_url ? (
            <Image
              source={resolveImageSource(park.photo_url)}
              style={{ width: '100%', height: 120, backgroundColor: COLORS.surfaceSecondary }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: 100,
                backgroundColor: COLORS.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TreePine size={36} color={COLORS.primary} />
            </View>
          )}
          <View style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: '700', color: textColor, letterSpacing: -0.2 }}
                  numberOfLines={1}
                >
                  {park.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} color={COLORS.textTertiary} />
                  <Text style={{ fontSize: 13, color: textSecondary }} numberOfLines={1}>
                    {park.city}{park.state ? `, ${park.state}` : ''}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <StarRating rating={park.rating} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>
                    {ratingDisplay}
                  </Text>
                </View>
                {park.is_off_leash ? (
                  <View
                    style={{
                      backgroundColor: COLORS.primaryMuted,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.primary }}>
                      OFF-LEASH
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            {visibleAmenities.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {visibleAmenities.map((amenity, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: textSecondary }}>
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </AnimatedPressable>
    </AnimatedListItem>
  );
}

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  const [activeTab, setActiveTab] = useState<'vets' | 'parks'>('vets');
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [parks, setParks] = useState<DogPark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parkSearch, setParkSearch] = useState('');

  const fetchData = useCallback(async () => {
    console.log('[Schedule] Fetching data, tab:', activeTab);
    if (activeTab === 'vets') {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('vet_appointments')
        .select('*, pet:pets(name, species)')
        .eq('user_id', session.user.id)
        .order('appointment_date', { ascending: true });
      if (error) {
        console.error('[Schedule] Error fetching appointments:', error.message);
      } else {
        console.log('[Schedule] Fetched', data?.length ?? 0, 'appointments');
        setAppointments((data ?? []) as VetAppointment[]);
      }
    } else {
      const { data, error } = await supabase
        .from('dog_parks')
        .select('*')
        .order('rating', { ascending: false });
      if (error) {
        console.error('[Schedule] Error fetching parks:', error.message);
      } else {
        console.log('[Schedule] Fetched', data?.length ?? 0, 'parks');
        setParks(data ?? []);
      }
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    console.log('[Schedule] Refreshing...');
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCompleteAppointment = async (id: string) => {
    console.log('[Schedule] Completing appointment:', id);
    const { error } = await supabase
      .from('vet_appointments')
      .update({ is_completed: true })
      .eq('id', id);
    if (error) {
      console.error('[Schedule] Error completing appointment:', error.message);
    } else {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_completed: true } : a))
      );
    }
  };

  const handleAddAppointment = () => {
    console.log('[Schedule] Add appointment button pressed');
    router.push('/appointment/add');
  };

  const handleTabSwitch = (tab: 'vets' | 'parks') => {
    console.log('[Schedule] Tab switched to:', tab);
    setActiveTab(tab);
  };

  const filteredParks = parks.filter((p) => {
    if (!parkSearch) return true;
    const q = parkSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
  });

  const upcomingAppts = appointments.filter(
    (a) => !a.is_completed && new Date(a.appointment_date) >= new Date()
  );
  const pastAppts = appointments.filter(
    (a) => a.is_completed || new Date(a.appointment_date) < new Date()
  );

  const AddButton = () => (
    <TouchableOpacity
      onPress={handleAddAppointment}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
      }}
      accessibilityLabel="Add appointment"
    >
      <Plus size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen
        options={{
          title: 'Schedule',
          headerRight: activeTab === 'vets' ? () => <AddButton /> : undefined,
        }}
      />
      <FlatList
        data={[]}
        renderItem={null}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {/* Segmented control */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
                borderRadius: 12,
                padding: 4,
              }}
            >
              {(['vets', 'parks'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === 'vets' ? 'Vet Schedule' : 'Dog Parks';
                return (
                  <AnimatedPressable
                    key={tab}
                    onPress={() => handleTabSwitch(tab)}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        backgroundColor: isActive ? (isDark ? COLORS.dark.surface : COLORS.surface) : 'transparent',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isActive ? '700' : '500',
                          color: isActive ? COLORS.primary : (isDark ? COLORS.dark.textSecondary : COLORS.textSecondary),
                        }}
                      >
                        {label}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Vet Schedule content */}
            {activeTab === 'vets' ? (
              loading ? (
                <View style={{ gap: 0 }}>
                  {[1, 2, 3].map((i) => <AppointmentCardSkeleton key={i} />)}
                </View>
              ) : appointments.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      backgroundColor: COLORS.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Calendar size={28} color={COLORS.primary} />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, marginBottom: 6 }}>
                    No appointments yet
                  </Text>
                  <Text style={{ fontSize: 14, color: isDark ? COLORS.dark.textSecondary : COLORS.textSecondary, textAlign: 'center', marginBottom: 20 }}>
                    Schedule your first vet visit to keep track of your pet's health
                  </Text>
                  <AnimatedPressable onPress={handleAddAppointment}>
                    <View
                      style={{
                        backgroundColor: COLORS.primary,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Plus size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                        Add appointment
                      </Text>
                    </View>
                  </AnimatedPressable>
                </View>
              ) : (
                <View style={{ gap: 0 }}>
                  {upcomingAppts.length > 0 ? (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 10 }}>
                        Upcoming
                      </Text>
                      {upcomingAppts.map((appt, i) => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          index={i}
                          onComplete={handleCompleteAppointment}
                        />
                      ))}
                    </View>
                  ) : null}
                  {pastAppts.length > 0 ? (
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 10 }}>
                        Past & Completed
                      </Text>
                      {pastAppts.map((appt, i) => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          index={i}
                          onComplete={handleCompleteAppointment}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              )
            ) : null}

            {/* Dog Parks content */}
            {activeTab === 'parks' ? (
              <View style={{ gap: 12 }}>
                {/* Search bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    gap: 8,
                    borderWidth: 1,
                    borderColor: isDark ? COLORS.dark.border : COLORS.border,
                  }}
                >
                  <Search size={16} color={COLORS.textTertiary} />
                  <TextInput
                    value={parkSearch}
                    onChangeText={(text) => {
                      console.log('[Schedule] Park search changed:', text);
                      setParkSearch(text);
                    }}
                    placeholder="Search parks by name or city..."
                    placeholderTextColor={COLORS.textTertiary}
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: isDark ? COLORS.dark.text : COLORS.text,
                    }}
                  />
                </View>

                {loading ? (
                  <View style={{ gap: 12 }}>
                    {[1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: surface,
                          borderRadius: 16,
                          overflow: 'hidden',
                        }}
                      >
                        <SkeletonLine width="100%" height={100} borderRadius={0} />
                        <View style={{ padding: 14, gap: 8 }}>
                          <SkeletonLine width="60%" height={16} />
                          <SkeletonLine width="40%" height={13} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : filteredParks.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        backgroundColor: COLORS.primaryMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <TreePine size={28} color={COLORS.primary} />
                    </View>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, marginBottom: 6 }}>
                      No parks found
                    </Text>
                    <Text style={{ fontSize: 14, color: isDark ? COLORS.dark.textSecondary : COLORS.textSecondary, textAlign: 'center' }}>
                      Try a different search term
                    </Text>
                  </View>
                ) : (
                  filteredParks.map((park, i) => (
                    <ParkCard key={park.id} park={park} index={i} />
                  ))
                )}
              </View>
            ) : null}
          </View>
        }
      />
    </View>
  );
}
