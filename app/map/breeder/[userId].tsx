import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  ImageSourcePropType,
  GestureResponderEvent,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, MapPin, Award, CheckCircle } from 'lucide-react-native';
import { COLORS, SPECIES_COLORS } from '@/constants/Colors';
import { supabase, BreederProfile, Pet } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import PawBurst, { PawBurstHandle } from '@/components/PawBurst';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function BreederProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const [breeder, setBreeder] = useState<BreederProfile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const pawBurstRef = useRef<PawBurstHandle>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    console.log('[BreederProfile] Fetching breeder:', userId);

    const [sessionRes, breederRes, petsRes] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from('breeder_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('pets').select('*').eq('user_id', userId).eq('is_public', true),
    ]);

    setCurrentUserId(sessionRes.data.session?.user?.id ?? null);

    if (breederRes.error) {
      console.error('[BreederProfile] Error fetching breeder:', breederRes.error.message);
    } else {
      console.log('[BreederProfile] Breeder loaded:', breederRes.data?.display_name);
      setBreeder(breederRes.data);
    }

    if (petsRes.error) {
      console.error('[BreederProfile] Error fetching pets:', petsRes.error.message);
    } else {
      setPets(petsRes.data ?? []);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMessage = async (evt: GestureResponderEvent) => {
    console.log('[BreederProfile] Send Message pressed for user:', userId);
    pawBurstRef.current?.burst(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
    if (!currentUserId || !userId) return;

    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_a.eq.${currentUserId},participant_b.eq.${userId}),and(participant_a.eq.${userId},participant_b.eq.${currentUserId})`
      )
      .limit(1)
      .single();

    if (existing) {
      console.log('[BreederProfile] Existing conversation found:', existing.id);
      router.push(`/map/chat/${existing.id}`);
    } else {
      console.log('[BreederProfile] Creating new conversation');
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ participant_a: currentUserId, participant_b: userId })
        .select('id')
        .single();

      if (error) {
        console.error('[BreederProfile] Error creating conversation:', error.message);
      } else if (newConv) {
        router.push(`/map/chat/${newConv.id}`);
      }
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!breeder) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: 'Breeder' }} />
        <Text style={{ color: textSecondary }}>Breeder profile not found</Text>
      </View>
    );
  }

  const isOwnProfile = currentUserId === userId;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen options={{ title: breeder.display_name, headerShown: true }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View
          style={{
            backgroundColor: surface,
            padding: 24,
            alignItems: 'center',
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}
        >
          {breeder.avatar_url ? (
            <Image
              source={resolveImageSource(breeder.avatar_url)}
              style={{ width: 88, height: 88, borderRadius: 44 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: COLORS.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.primary }}>
                {breeder.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>
                {breeder.display_name}
              </Text>
              {breeder.is_verified ? (
                <CheckCircle size={18} color={COLORS.primary} fill={COLORS.primary} />
              ) : null}
            </View>

            {(breeder.location_city || breeder.location_state) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} color={textSecondary} />
                <Text style={{ fontSize: 14, color: textSecondary }}>
                  {breeder.location_city}
                  {breeder.location_state ? `, ${breeder.location_state}` : ''}
                </Text>
              </View>
            ) : null}

            {breeder.years_experience != null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Award size={13} color={textSecondary} />
                <Text style={{ fontSize: 14, color: textSecondary }}>
                  {breeder.years_experience} year{breeder.years_experience !== 1 ? 's' : ''} experience
                </Text>
              </View>
            ) : null}
          </View>

          {!isOwnProfile ? (
            <AnimatedPressable onPress={(evt) => handleMessage(evt as unknown as GestureResponderEvent)} style={{ width: '100%' }}>
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <MessageCircle size={16} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                  Send Message
                </Text>
              </View>
            </AnimatedPressable>
          ) : null}
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          {/* Bio */}
          {breeder.bio ? (
            <View
              style={{
                backgroundColor: surface,
                borderRadius: 16,
                padding: 16,
                gap: 8,
                borderWidth: 1,
                borderColor: borderColor,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>About</Text>
              <Text style={{ fontSize: 15, color: textSecondary, lineHeight: 22 }}>{breeder.bio}</Text>
            </View>
          ) : null}

          {/* Specialties */}
          {breeder.specialties && breeder.specialties.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>Specialties</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {breeder.specialties.map((s, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: COLORS.primaryMuted,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Public pets */}
          {pets.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                Pets ({pets.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {pets.map((pet) => {
                  const speciesColor = SPECIES_COLORS[pet.species] ?? COLORS.primary;
                  return (
                    <AnimatedPressable
                      key={pet.id}
                      onPress={() => {
                        console.log('[BreederProfile] Pet pressed:', pet.id);
                        router.push(`/pet/${pet.id}`);
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: surface,
                          borderRadius: 14,
                          padding: 12,
                          alignItems: 'center',
                          gap: 8,
                          width: 100,
                          borderWidth: 1,
                          borderColor: borderColor,
                        }}
                      >
                        {pet.photo_url ? (
                          <Image
                            source={resolveImageSource(pet.photo_url)}
                            style={{ width: 56, height: 56, borderRadius: 28 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 28,
                              backgroundColor: speciesColor + '20',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 22, fontWeight: '800', color: speciesColor }}>
                              {pet.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text
                          style={{ fontSize: 13, fontWeight: '700', color: textColor, textAlign: 'center' }}
                          numberOfLines={1}
                        >
                          {pet.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: textSecondary, textTransform: 'capitalize' }}>
                          {pet.species}
                        </Text>
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <PawBurst ref={pawBurstRef} />
    </View>
  );
}
