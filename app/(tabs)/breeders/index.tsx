import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  GestureResponderEvent,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { supabase, BreederProfile } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import PawBurst, { PawBurstHandle } from '@/components/PawBurst';

const CARD_GRADIENTS: [string, string][] = [
  ['#FFF0F5', '#FFE4E1'],
  ['#F0FFF4', '#E6FFFA'],
  ['#EBF8FF', '#E9D8FD'],
  ['#FFFAF0', '#FEFCBF'],
];

const CARD_GRADIENTS_DARK: [string, string][] = [
  ['#2D1B22', '#2A1A1A'],
  ['#1A2D22', '#1A2A28'],
  ['#1A2230', '#1E1A2D'],
  ['#2D2A1A', '#2A2A14'],
];

const SPECIES_FILTERS = [
  { label: 'All', emoji: '🐾', value: 'all' },
  { label: 'Dogs', emoji: '🐶', value: 'dog' },
  { label: 'Cats', emoji: '🐱', value: 'cat' },
  { label: 'Rabbits', emoji: '🐰', value: 'rabbit' },
  { label: 'Birds', emoji: '🐦', value: 'bird' },
  { label: 'Other', emoji: '🦎', value: 'other' },
];

const SPECIALTY_COLORS = [
  { bg: '#FFE4E1', text: '#C0392B' },
  { bg: '#E8F5E9', text: '#2E7D32' },
  { bg: '#E3F2FD', text: '#1565C0' },
  { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#F3E5F5', text: '#6A1B9A' },
  { bg: '#E0F7FA', text: '#00695C' },
];

interface BreederWithPetCount extends BreederProfile {
  petCount: number;
}

function BreederCard({
  breeder,
  index,
  isDark,
  onViewProfile,
}: {
  breeder: BreederWithPetCount;
  index: number;
  isDark: boolean;
  onViewProfile: (evt: GestureResponderEvent) => void;
}) {
  const gradients = isDark ? CARD_GRADIENTS_DARK : CARD_GRADIENTS;
  const gradient = gradients[index % gradients.length];
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;

  const initial = breeder.display_name.charAt(0).toUpperCase();
  const locationParts = [breeder.location_city, breeder.location_state].filter(Boolean);
  const locationText = locationParts.join(', ');
  const specialties = (breeder.specialties ?? []).slice(0, 3);
  const experienceText =
    breeder.years_experience != null
      ? `${breeder.years_experience} yr${breeder.years_experience !== 1 ? 's' : ''} exp`
      : null;
  const petCountLabel = `🐾 ${breeder.petCount} pet${breeder.petCount !== 1 ? 's' : ''}`;

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      }}
    >
      {/* Top row: avatar + info */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
        {/* Avatar */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: COLORS.primary + '22',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: COLORS.primary + '44',
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.primary }}>
            {initial}
          </Text>
        </View>

        {/* Name + location + experience */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{ fontSize: 17, fontWeight: '700', color: textColor, letterSpacing: -0.3 }}
              numberOfLines={1}
            >
              {breeder.display_name}
            </Text>
            {breeder.is_verified ? (
              <View
                style={{
                  backgroundColor: '#E8F5E9',
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#2E7D32' }}>✓</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#2E7D32' }}>Verified</Text>
              </View>
            ) : null}
          </View>

          {locationText ? (
            <Text style={{ fontSize: 13, color: textSecondary }} numberOfLines={1}>
              📍 {locationText}
            </Text>
          ) : null}

          {experienceText ? (
            <Text style={{ fontSize: 13, color: textSecondary }}>
              🏅 {experienceText}
            </Text>
          ) : null}
        </View>

        {/* Pet count badge */}
        <View
          style={{
            backgroundColor: COLORS.primaryMuted,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>
            {petCountLabel}
          </Text>
        </View>
      </View>

      {/* Specialty chips */}
      {specialties.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {specialties.map((s, i) => {
            const colorPair = SPECIALTY_COLORS[i % SPECIALTY_COLORS.length];
            return (
              <View
                key={i}
                style={{
                  backgroundColor: colorPair.bg,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: colorPair.text }}>
                  {s}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* View Profile button */}
      <AnimatedPressable onPress={onViewProfile} style={{ marginTop: 14 }}>
        <View
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 11,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
            View Profile
          </Text>
        </View>
      </AnimatedPressable>
    </LinearGradient>
  );
}

export default function BreedersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pawBurstRef = useRef<PawBurstHandle>(null);

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const [breeders, setBreeders] = useState<BreederWithPetCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('all');

  const fetchBreeders = useCallback(async () => {
    console.log('[Breeders] Fetching breeder profiles...');
    const [breederRes, petRes] = await Promise.all([
      supabase.from('breeder_profiles').select('*'),
      supabase.from('pets').select('user_id').eq('is_public', true),
    ]);

    if (breederRes.error) {
      console.error('[Breeders] Error fetching breeders:', breederRes.error.message);
      setLoading(false);
      return;
    }

    if (petRes.error) {
      console.error('[Breeders] Error fetching pet counts:', petRes.error.message);
    }

    const petCountMap: Record<string, number> = {};
    for (const pet of petRes.data ?? []) {
      petCountMap[pet.user_id] = (petCountMap[pet.user_id] ?? 0) + 1;
    }

    const enriched: BreederWithPetCount[] = (breederRes.data ?? []).map((b) => ({
      ...b,
      petCount: petCountMap[b.user_id] ?? 0,
    }));

    console.log('[Breeders] Fetched', enriched.length, 'breeders');
    setBreeders(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBreeders();
  }, [fetchBreeders]);

  const handleRefresh = async () => {
    console.log('[Breeders] Pull-to-refresh triggered');
    setRefreshing(true);
    await fetchBreeders();
    setRefreshing(false);
  };

  const handleSpeciesFilter = (value: string) => {
    console.log('[Breeders] Species filter selected:', value);
    setSelectedSpecies(value);
  };

  const handleSearchChange = (text: string) => {
    console.log('[Breeders] Search query changed:', text);
    setSearchQuery(text);
  };

  const filteredBreeders = breeders.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.display_name.toLowerCase().includes(q) ||
      (b.location_city ?? '').toLowerCase().includes(q) ||
      (b.specialties ?? []).some((s) => s.toLowerCase().includes(q));

    const matchesSpecies =
      selectedSpecies === 'all' ||
      (b.specialties ?? []).some((s) => s.toLowerCase().includes(selectedSpecies));

    return matchesSearch && matchesSpecies;
  });

  const handleViewProfile = (breeder: BreederWithPetCount, evt: GestureResponderEvent) => {
    console.log('[Breeders] View Profile pressed for breeder:', breeder.user_id, breeder.display_name);
    pawBurstRef.current?.burst(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
    router.push(`/map/breeder/${breeder.user_id}`);
  };

  const renderBreeder = ({ item, index }: { item: BreederWithPetCount; index: number }) => (
    <BreederCard
      breeder={item}
      index={index}
      isDark={isDark}
      onViewProfile={(evt) => handleViewProfile(item, evt)}
    />
  );

  const ListHeader = (
    <View style={{ paddingBottom: 8 }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, letterSpacing: -0.5 }}>
          🐾 Breeder Hub
        </Text>
        <Text style={{ fontSize: 15, color: textSecondary, marginTop: 4 }}>
          Find trusted breeders near you
        </Text>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 11,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: borderColor,
          }}
        >
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search by name, city, or specialty..."
            placeholderTextColor={textSecondary}
            style={{ flex: 1, fontSize: 15, color: textColor }}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Species filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}
        style={{ marginBottom: 16 }}
      >
        {SPECIES_FILTERS.map((filter) => {
          const isActive = selectedSpecies === filter.value;
          return (
            <TouchableOpacity
              key={filter.value}
              onPress={() => handleSpeciesFilter(filter.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive ? COLORS.primary : surface,
                borderWidth: 1,
                borderColor: isActive ? COLORS.primary : borderColor,
              }}
            >
              <Text style={{ fontSize: 15 }}>{filter.emoji}</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: isActive ? '#FFFFFF' : textColor,
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const EmptyState = (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 }}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>🐾</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, textAlign: 'center', marginBottom: 8 }}>
        No breeders found
      </Text>
      <Text style={{ fontSize: 15, color: textSecondary, textAlign: 'center', lineHeight: 22 }}>
        Try adjusting your search or filter to find breeders
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <FlatList
        data={filteredBreeders}
        keyExtractor={(item) => item.id}
        renderItem={renderBreeder}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={loading ? null : EmptyState}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      />
      <PawBurst ref={pawBurstRef} />
    </View>
  );
}
