import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Dimensions,
  Linking,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Plus, Mail, X, Navigation, Phone, Star } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase, Pet, Place, BreederProfile } from '@/utils/supabase';
import { Map } from '@/components/Map';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

type FilterType = 'all' | 'pets' | 'vets' | 'groomers' | 'parks' | 'stores';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pets', label: '🐾 Pets' },
  { key: 'vets', label: '🏥 Vets' },
  { key: 'groomers', label: '✂️ Groomers' },
  { key: 'parks', label: '🌳 Parks' },
  { key: 'stores', label: '🛒 Stores' },
];

interface PetPin {
  type: 'pet';
  pet: Pet;
  breeder?: BreederProfile;
}

interface PlacePin {
  type: 'place';
  place: Place;
}

type SelectedPin = PetPin | PlacePin | null;

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  const starIndices = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {starIndices.map((i) => (
        <Star
          key={i}
          size={14}
          color={i <= rounded ? '#F6AD55' : '#D1D5DB'}
          fill={i <= rounded ? '#F6AD55' : 'transparent'}
        />
      ))}
    </View>
  );
}

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const [filter, setFilter] = useState<FilterType>('all');
  const [publicPets, setPublicPets] = useState<Pet[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [breeders, setBreeders] = useState<BreederProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<SelectedPin>(null);

  const sheetAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    console.log('[MapScreen] Fetching map data');
    setLoading(true);
    const [petsRes, placesRes, breedersRes] = await Promise.all([
      supabase.from('pets').select('*').eq('is_public', true).not('map_latitude', 'is', null),
      supabase.from('places').select('*'),
      supabase.from('breeder_profiles').select('*'),
    ]);

    if (petsRes.error) {
      console.error('[MapScreen] Error fetching public pets:', petsRes.error.message);
    } else {
      console.log('[MapScreen] Public pets loaded:', petsRes.data?.length ?? 0);
      setPublicPets(petsRes.data ?? []);
    }

    if (placesRes.error) {
      console.error('[MapScreen] Error fetching places:', placesRes.error.message);
    } else {
      console.log('[MapScreen] Places loaded:', placesRes.data?.length ?? 0);
      setPlaces(placesRes.data ?? []);
    }

    if (breedersRes.error) {
      console.error('[MapScreen] Error fetching breeders:', breedersRes.error.message);
    } else {
      setBreeders(breedersRes.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openSheet = (pin: SelectedPin) => {
    setSelectedPin(pin);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedPin(null));
  };

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  // Build markers for the map
  const markers = React.useMemo(() => {
    const result: { id: string; latitude: number; longitude: number; title?: string; description?: string }[] = [];

    if (filter === 'all' || filter === 'pets') {
      publicPets.forEach((pet) => {
        if (pet.map_latitude && pet.map_longitude) {
          result.push({
            id: `pet-${pet.id}`,
            latitude: pet.map_latitude,
            longitude: pet.map_longitude,
            title: pet.name,
            description: pet.breed ?? pet.species,
          });
        }
      });
    }

    if (filter === 'all' || filter === 'vets') {
      places.filter(p => p.place_type === 'vet').forEach((place) => {
        result.push({ id: `place-${place.id}`, latitude: place.latitude, longitude: place.longitude, title: place.name, description: 'Vet' });
      });
    }

    if (filter === 'all' || filter === 'groomers') {
      places.filter(p => p.place_type === 'groomer').forEach((place) => {
        result.push({ id: `place-${place.id}`, latitude: place.latitude, longitude: place.longitude, title: place.name, description: 'Groomer' });
      });
    }

    if (filter === 'all' || filter === 'parks') {
      places.filter(p => p.place_type === 'dog_park' || p.place_type === 'dog_walk').forEach((place) => {
        result.push({ id: `place-${place.id}`, latitude: place.latitude, longitude: place.longitude, title: place.name, description: 'Park' });
      });
    }

    if (filter === 'all' || filter === 'stores') {
      places.filter(p => p.place_type === 'pet_store').forEach((place) => {
        result.push({ id: `place-${place.id}`, latitude: place.latitude, longitude: place.longitude, title: place.name, description: 'Store' });
      });
    }

    return result;
  }, [filter, publicPets, places]);

  const handleFilterPress = (key: FilterType) => {
    console.log('[MapScreen] Filter changed to:', key);
    setFilter(key);
  };

  const handleAddPetPin = () => {
    console.log('[MapScreen] Add pet pin pressed');
    router.push('/map/add-pet-pin');
  };

  const handleInbox = () => {
    console.log('[MapScreen] Inbox pressed');
    router.push('/(tabs)/map/inbox');
  };

  const handleGetDirections = (lat: number, lng: number, name: string) => {
    console.log('[MapScreen] Get directions pressed for:', name);
    const url = `maps://?daddr=${lat},${lng}&dirflg=d`;
    const fallback = `https://maps.google.com/?daddr=${lat},${lng}`;
    Linking.canOpenURL(url).then((supported) => {
      Linking.openURL(supported ? url : fallback);
    });
  };

  const handleCall = (phone: string) => {
    console.log('[MapScreen] Call pressed:', phone);
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessageBreeder = (breederId: string) => {
    console.log('[MapScreen] Message breeder pressed:', breederId);
    router.push(`/map/breeder/${breederId}`);
  };

  const handleViewPlace = (placeId: string) => {
    console.log('[MapScreen] View place pressed:', placeId);
    router.push(`/map/place/${placeId}`);
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Map fills the screen */}
      <Map
        markers={markers}
        style={{ flex: 1, borderRadius: 0 }}
        showsUserLocation
      />

      {/* Inbox button — top-right */}
      <AnimatedPressable
        onPress={handleInbox}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          right: 16,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? COLORS.dark.surface : COLORS.surface,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: borderColor,
          }}
        >
          <Mail size={18} color={textColor} />
        </View>
      </AnimatedPressable>

      {/* Vertical filter pills — left side */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 70,
          left: 12,
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <AnimatedPressable key={f.key} onPress={() => handleFilterPress(f.key)}>
              <View
                style={{
                  backgroundColor: isActive ? COLORS.primary : (isDark ? COLORS.dark.surface : COLORS.surface),
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isActive ? COLORS.primary : borderColor,
                  shadowColor: '#000',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isActive ? '#FFFFFF' : textColor,
                  }}
                >
                  {f.label}
                </Text>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Loading indicator */}
      {loading ? (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 60,
            alignSelf: 'center',
            backgroundColor: isDark ? COLORS.dark.surface : COLORS.surface,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={{ fontSize: 13, color: textSecondary }}>Loading map data...</Text>
        </View>
      ) : null}

      {/* FAB */}
      <AnimatedPressable
        onPress={handleAddPetPin}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 100,
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

      {/* Bottom sheet overlay */}
      {selectedPin ? (
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={closeSheet}
        />
      ) : null}

      {/* Bottom sheet */}
      {selectedPin ? (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 10,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: borderColor }} />
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={closeSheet}
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} color={textSecondary} />
            </View>
          </TouchableOpacity>

          {selectedPin.type === 'pet' ? (
            <View style={{ padding: 20, gap: 16 }}>
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                {selectedPin.pet.photo_url ? (
                  <Image
                    source={resolveImageSource(selectedPin.pet.photo_url)}
                    style={{ width: 72, height: 72, borderRadius: 36 }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: COLORS.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.primary }}>
                      {selectedPin.pet.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: textColor }}>
                    {selectedPin.pet.name}
                  </Text>
                  {selectedPin.pet.breed ? (
                    <Text style={{ fontSize: 14, color: textSecondary }}>{selectedPin.pet.breed}</Text>
                  ) : null}
                  <Text style={{ fontSize: 13, color: textSecondary, textTransform: 'capitalize' }}>
                    {selectedPin.pet.species}
                  </Text>
                </View>
              </View>

              {selectedPin.breeder ? (
                <View
                  style={{
                    backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
                    borderRadius: 12,
                    padding: 12,
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, color: textSecondary, fontWeight: '600' }}>BREEDER</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                    {selectedPin.breeder.display_name}
                  </Text>
                  {selectedPin.breeder.location_city ? (
                    <Text style={{ fontSize: 13, color: textSecondary }}>
                      {selectedPin.breeder.location_city}
                      {selectedPin.breeder.location_state ? `, ${selectedPin.breeder.location_state}` : ''}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {selectedPin.breeder ? (
                <AnimatedPressable onPress={() => handleMessageBreeder(selectedPin.breeder!.user_id)}>
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
                    <Mail size={16} color="#FFFFFF" />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                      Message Breeder
                    </Text>
                  </View>
                </AnimatedPressable>
              ) : null}
            </View>
          ) : selectedPin.type === 'place' ? (
            <View style={{ padding: 20, gap: 16 }}>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, flex: 1 }}>
                    {selectedPin.place.name}
                  </Text>
                  <View
                    style={{
                      backgroundColor: (placeTypeColor[selectedPin.place.place_type] ?? COLORS.primary) + '20',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: placeTypeColor[selectedPin.place.place_type] ?? COLORS.primary,
                      }}
                    >
                      {placeTypeLabel[selectedPin.place.place_type] ?? selectedPin.place.place_type}
                    </Text>
                  </View>
                </View>

                {selectedPin.place.address ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color={textSecondary} />
                    <Text style={{ fontSize: 14, color: textSecondary }}>
                      {selectedPin.place.address}
                      {selectedPin.place.city ? `, ${selectedPin.place.city}` : ''}
                    </Text>
                  </View>
                ) : null}

                {selectedPin.place.rating != null ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <StarRating rating={selectedPin.place.rating} />
                    <Text style={{ fontSize: 13, color: textSecondary }}>
                      {Number(selectedPin.place.rating).toFixed(1)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AnimatedPressable
                  style={{ flex: 1 }}
                  onPress={() => handleGetDirections(selectedPin.place.latitude, selectedPin.place.longitude, selectedPin.place.name)}
                >
                  <View
                    style={{
                      backgroundColor: COLORS.primary,
                      paddingVertical: 12,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Navigation size={15} color="#FFFFFF" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Directions</Text>
                  </View>
                </AnimatedPressable>

                {selectedPin.place.phone ? (
                  <AnimatedPressable
                    style={{ flex: 1 }}
                    onPress={() => handleCall(selectedPin.place.phone!)}
                  >
                    <View
                      style={{
                        backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
                        paddingVertical: 12,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        borderWidth: 1,
                        borderColor: borderColor,
                      }}
                    >
                      <Phone size={15} color={textColor} />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Call</Text>
                    </View>
                  </AnimatedPressable>
                ) : null}

                <AnimatedPressable onPress={() => handleViewPlace(selectedPin.place.id)}>
                  <View
                    style={{
                      backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>More</Text>
                  </View>
                </AnimatedPressable>
              </View>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}
