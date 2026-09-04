import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Linking,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Phone, Globe, Navigation, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { supabase, Place } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  const starIndices = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {starIndices.map((i) => (
        <Star
          key={i}
          size={16}
          color={i <= rounded ? '#F6AD55' : '#D1D5DB'}
          fill={i <= rounded ? '#F6AD55' : 'transparent'}
        />
      ))}
    </View>
  );
}

const placeTypeLabel: Record<string, string> = {
  vet: 'Veterinarian',
  groomer: 'Groomer',
  dog_park: 'Dog Park',
  pet_store: 'Pet Store',
  dog_walk: 'Dog Walk',
};

const placeTypeColor: Record<string, string> = {
  vet: '#FC8181',
  groomer: '#B794F4',
  dog_park: '#68D391',
  pet_store: '#F6AD55',
  dog_walk: '#68D391',
};

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlace = async () => {
      if (!id) return;
      console.log('[PlaceDetail] Fetching place:', id);
      const { data, error } = await supabase.from('places').select('*').eq('id', id).single();
      if (error) {
        console.error('[PlaceDetail] Error:', error.message);
      } else {
        console.log('[PlaceDetail] Place loaded:', data?.name);
        setPlace(data);
      }
      setLoading(false);
    };
    fetchPlace();
  }, [id]);

  const handleDirections = () => {
    if (!place) return;
    console.log('[PlaceDetail] Get directions pressed for:', place.name);
    const url = `maps://?daddr=${place.latitude},${place.longitude}&dirflg=d`;
    const fallback = `https://maps.google.com/?daddr=${place.latitude},${place.longitude}`;
    Linking.canOpenURL(url).then((supported) => {
      Linking.openURL(supported ? url : fallback);
    });
  };

  const handleCall = () => {
    if (!place?.phone) return;
    console.log('[PlaceDetail] Call pressed:', place.phone);
    Linking.openURL(`tel:${place.phone}`);
  };

  const handleWebsite = () => {
    if (!place?.website) return;
    console.log('[PlaceDetail] Website pressed:', place.website);
    Linking.openURL(place.website);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!place) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={{ color: textSecondary }}>Place not found</Text>
      </View>
    );
  }

  const typeColor = placeTypeColor[place.place_type] ?? COLORS.primary;
  const typeLabel = placeTypeLabel[place.place_type] ?? place.place_type;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen options={{ title: place.name, headerShown: true }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ height: 240, position: 'relative' }}>
          {place.photo_url ? (
            <Image
              source={resolveImageSource(place.photo_url)}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[typeColor + '40', typeColor + '20']}
              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: typeColor + '30',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin size={36} color={typeColor} />
              </View>
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', isDark ? COLORS.dark.background : COLORS.background]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
          />
        </View>

        <View style={{ paddingHorizontal: 20, gap: 20, marginTop: -10 }}>
          {/* Name & type */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: textColor, letterSpacing: -0.5, flex: 1 }}>
                {place.name}
              </Text>
              <View
                style={{
                  backgroundColor: typeColor + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: typeColor }}>{typeLabel}</Text>
              </View>
            </View>

            {place.rating != null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <StarRating rating={place.rating} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: textSecondary }}>
                  {Number(place.rating).toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AnimatedPressable style={{ flex: 1 }} onPress={handleDirections}>
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
                <Navigation size={16} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Directions</Text>
              </View>
            </AnimatedPressable>

            {place.phone ? (
              <AnimatedPressable style={{ flex: 1 }} onPress={handleCall}>
                <View
                  style={{
                    backgroundColor: surface,
                    paddingVertical: 14,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}
                >
                  <Phone size={16} color={textColor} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>Call</Text>
                </View>
              </AnimatedPressable>
            ) : null}
          </View>

          {/* Info card */}
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
            {place.address ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: textSecondary, fontWeight: '600', marginBottom: 2 }}>
                    ADDRESS
                  </Text>
                  <Text style={{ fontSize: 15, color: textColor }}>
                    {place.address}
                    {place.city ? `\n${place.city}` : ''}
                    {place.state ? `, ${place.state}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            {place.phone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Phone size={16} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: textSecondary, fontWeight: '600', marginBottom: 2 }}>
                    PHONE
                  </Text>
                  <Text style={{ fontSize: 15, color: textColor }}>{place.phone}</Text>
                </View>
              </View>
            ) : null}

            {place.website ? (
              <AnimatedPressable onPress={handleWebsite}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Globe size={16} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: textSecondary, fontWeight: '600', marginBottom: 2 }}>
                      WEBSITE
                    </Text>
                    <Text style={{ fontSize: 15, color: COLORS.primary }} numberOfLines={1}>
                      {place.website}
                    </Text>
                  </View>
                </View>
              </AnimatedPressable>
            ) : null}
          </View>

          {/* Description */}
          {place.description ? (
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
              <Text style={{ fontSize: 15, color: textSecondary, lineHeight: 22 }}>
                {place.description}
              </Text>
            </View>
          ) : null}

          {/* Amenities */}
          {place.amenities && place.amenities.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>Amenities</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {place.amenities.map((amenity, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: COLORS.primaryMuted,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
