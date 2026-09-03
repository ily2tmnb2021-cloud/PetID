import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  useColorScheme,
  TouchableOpacity,
  RefreshControl,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, PawPrint, Camera, ChevronRight, Dog } from 'lucide-react-native';
import { Image } from 'expo-image';
import { COLORS, SPECIES_COLORS } from '@/constants/Colors';
import { supabase, Pet } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PetCardSkeleton } from '@/components/SkeletonLoader';

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
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function PetAvatar({ pet, size = 64 }: { pet: Pet; size?: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const speciesColor = SPECIES_COLORS[pet.species] ?? COLORS.primary;

  if (pet.photo_url) {
    return (
      <Image
        source={resolveImageSource(pet.photo_url)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.surfaceSecondary,
        }}
        contentFit="cover"
      />
    );
  }

  const initial = pet.name.charAt(0).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: speciesColor + '20',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: speciesColor + '40',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          fontWeight: '700',
          color: speciesColor,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

function PetCard({ pet, index }: { pet: Pet; index: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const speciesColor = SPECIES_COLORS[pet.species] ?? COLORS.primary;

  const speciesLabel = pet.species.charAt(0).toUpperCase() + pet.species.slice(1);

  const ageText = pet.age_years != null ? `${pet.age_years}y` : null;
  const weightText = pet.weight_kg != null ? `${pet.weight_kg}kg` : null;
  const metaText = [ageText, weightText].filter(Boolean).join(' · ');

  const handleViewDetails = () => {
    console.log('[MyPets] View details pressed for pet:', pet.id, pet.name);
    router.push(`/pet/${pet.id}`);
  };

  const handleIdentifyBreed = () => {
    console.log('[MyPets] Identify breed pressed for pet:', pet.id, pet.name);
    router.push(`/(tabs)/identify?petId=${pet.id}`);
  };

  return (
    <AnimatedListItem index={index}>
      <AnimatedPressable onPress={handleViewDetails}>
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
            borderWidth: 1,
            borderColor: isDark ? COLORS.dark.border : COLORS.border,
          }}
        >
          <PetAvatar pet={pet} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: textColor,
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
              >
                {pet.name}
              </Text>
              <View
                style={{
                  backgroundColor: speciesColor + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: speciesColor }}>
                  {speciesLabel}
                </Text>
              </View>
            </View>
            {pet.breed ? (
              <Text
                style={{ fontSize: 14, color: textSecondary }}
                numberOfLines={1}
              >
                {pet.breed}
              </Text>
            ) : null}
            {metaText ? (
              <Text style={{ fontSize: 13, color: textSecondary }}>
                {metaText}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <AnimatedPressable onPress={handleViewDetails}>
                <View
                  style={{
                    backgroundColor: COLORS.primaryMuted,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary }}>
                    View Details
                  </Text>
                  <ChevronRight size={12} color={COLORS.primary} />
                </View>
              </AnimatedPressable>
              <AnimatedPressable onPress={handleIdentifyBreed}>
                <View
                  style={{
                    backgroundColor: COLORS.accentMuted,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Camera size={12} color={COLORS.accent} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.accent }}>
                    Identify
                  </Text>
                </View>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </AnimatedListItem>
  );
}

function EmptyState({ onAddPet }: { onAddPet: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 100,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          backgroundColor: COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <PawPrint size={36} color={COLORS.primary} />
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: textColor,
          marginBottom: 8,
          textAlign: 'center',
          letterSpacing: -0.3,
        }}
      >
        No pets yet
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 28,
          maxWidth: 260,
        }}
      >
        Add your first furry friend to get started tracking their health and wellness
      </Text>
      <AnimatedPressable onPress={onAddPet}>
        <View
          style={{
            backgroundColor: COLORS.primary,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
            Add your first pet
          </Text>
        </View>
      </AnimatedPressable>
    </View>
  );
}

export default function MyPetsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bg = isDark ? COLORS.dark.background : COLORS.background;

  const fetchPets = useCallback(async () => {
    console.log('[MyPets] Fetching pets...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('[MyPets] No session, skipping fetch');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MyPets] Error fetching pets:', error.message);
    } else {
      console.log('[MyPets] Fetched', data?.length ?? 0, 'pets');
      setPets(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleRefresh = async () => {
    console.log('[MyPets] Refreshing pets list...');
    setRefreshing(true);
    await fetchPets();
    setRefreshing(false);
  };

  const handleAddPet = () => {
    console.log('[MyPets] Add pet button pressed');
    router.push('/pet/add');
  };

  const AddButton = () => (
    <TouchableOpacity
      onPress={handleAddPet}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
      }}
      accessibilityLabel="Add pet"
    >
      <Plus size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen
        options={{
          title: 'My Pets',
          headerRight: () => <AddButton />,
        }}
      />
      {loading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => String(item)}
          renderItem={() => <PetCardSkeleton />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 120,
          }}
          contentInsetAdjustmentBehavior="automatic"
        />
      ) : pets.length === 0 ? (
        <EmptyState onAddPet={handleAddPet} />
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <PetCard pet={item} index={index} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 120,
          }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
