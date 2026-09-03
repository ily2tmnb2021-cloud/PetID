import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  Linking,
  Alert,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, Star, Navigation, TreePine } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { supabase, DogPark } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function StarRating({ rating }: { rating: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {stars.map((s) => (
        <Star
          key={s}
          size={16}
          color={s <= Math.round(rating) ? COLORS.warning : COLORS.textTertiary}
          fill={s <= Math.round(rating) ? COLORS.warning : 'transparent'}
        />
      ))}
    </View>
  );
}

export default function ParkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [park, setPark] = useState<DogPark | null>(null);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      console.log('[ParkDetail] Fetching park:', id);
      const { data, error } = await supabase
        .from('dog_parks')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('[ParkDetail] Error:', error.message);
      } else {
        console.log('[ParkDetail] Loaded park:', data?.name);
        setPark(data);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleGetDirections = () => {
    if (!park) return;
    console.log('[ParkDetail] Get directions pressed for park:', park.id, park.name);
    const lat = park.latitude;
    const lng = park.longitude;
    const label = encodeURIComponent(park.name);
    const url = `maps://?q=${label}&ll=${lat},${lng}`;
    const fallbackUrl = `https://maps.google.com/?q=${lat},${lng}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(fallbackUrl);
      }
    }).catch(() => {
      Linking.openURL(fallbackUrl);
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <Stack.Screen options={{ title: '' }} />
        <View style={{ height: 240, backgroundColor: COLORS.surfaceSecondary }} />
        <View style={{ padding: 20, gap: 16 }}>
          <SkeletonLine width="60%" height={28} />
          <SkeletonLine width="40%" height={16} />
        </View>
      </View>
    );
  }

  if (!park) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: '' }} />
        <Text style={{ color: textSecondary }}>Park not found</Text>
      </View>
    );
  }

  const ratingDisplay = typeof park.rating === 'number' ? park.rating.toFixed(1) : '—';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero */}
        <View style={{ height: 260, position: 'relative' }}>
          {park.photo_url ? (
            <Image
              source={resolveImageSource(park.photo_url)}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[COLORS.primary + '40', COLORS.primary + '20']}
              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <TreePine size={64} color={COLORS.primary} />
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
          {/* Name & location */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: textColor,
                  letterSpacing: -0.5,
                  flex: 1,
                }}
              >
                {park.name}
              </Text>
              {park.is_off_leash ? (
                <View
                  style={{
                    backgroundColor: COLORS.primaryMuted,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    marginLeft: 8,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 }}>
                    OFF-LEASH
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color={COLORS.textTertiary} />
              <Text style={{ fontSize: 15, color: textSecondary }}>
                {park.address}{park.city ? `, ${park.city}` : ''}{park.state ? `, ${park.state}` : ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <StarRating rating={park.rating} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                {ratingDisplay}
              </Text>
            </View>
          </View>

          {/* Description */}
          {park.description ? (
            <View
              style={{
                backgroundColor: surface,
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                borderWidth: 1,
                borderColor: isDark ? COLORS.dark.border : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 15, color: textSecondary, lineHeight: 24 }}>
                {park.description}
              </Text>
            </View>
          ) : null}

          {/* Amenities */}
          {park.amenities && park.amenities.length > 0 ? (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, letterSpacing: -0.2 }}>
                Amenities
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {park.amenities.map((amenity, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: COLORS.primaryMuted,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Get directions */}
          <AnimatedPressable onPress={handleGetDirections}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 16,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Navigation size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                Get directions
              </Text>
            </View>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}
