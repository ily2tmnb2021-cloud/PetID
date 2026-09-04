import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  useColorScheme,
  Alert,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Check } from 'lucide-react-native';
import { COLORS, SPECIES_COLORS } from '@/constants/Colors';
import { supabase, Pet } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Map } from '@/components/Map';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function AddPetPinScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publicToggles, setPublicToggles] = useState<Record<string, boolean>>({});
  const [pinLat, setPinLat] = useState(37.78825);
  const [pinLng, setPinLng] = useState(-122.4324);

  const fetchPets = useCallback(async () => {
    console.log('[AddPetPin] Fetching user pets');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name');

    if (error) {
      console.error('[AddPetPin] Error fetching pets:', error.message);
    } else {
      console.log('[AddPetPin] Pets loaded:', data?.length ?? 0);
      setPets(data ?? []);
      const toggles: Record<string, boolean> = {};
      (data ?? []).forEach((p) => {
        toggles[p.id] = p.is_public ?? false;
      });
      setPublicToggles(toggles);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleToggle = (petId: string, value: boolean) => {
    console.log('[AddPetPin] Toggle pet public:', petId, value);
    setPublicToggles((prev) => ({ ...prev, [petId]: value }));
  };

  const handleSave = async () => {
    console.log('[AddPetPin] Save pressed, pin location:', pinLat, pinLng);
    setSaving(true);
    try {
      const updates = pets.map((pet) =>
        supabase.from('pets').update({
          is_public: publicToggles[pet.id] ?? false,
          map_latitude: publicToggles[pet.id] ? pinLat : null,
          map_longitude: publicToggles[pet.id] ? pinLng : null,
        }).eq('id', pet.id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);
      if (hasError) {
        console.error('[AddPetPin] Some updates failed');
        Alert.alert('Error', 'Some pets could not be updated. Please try again.');
      } else {
        console.log('[AddPetPin] All pets updated successfully');
        Alert.alert('Saved', 'Your pets have been updated on the map.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.error('[AddPetPin] Exception:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const mapMarkers = pets
    .filter((p) => publicToggles[p.id])
    .map((p) => ({
      id: p.id,
      latitude: pinLat,
      longitude: pinLng,
      title: p.name,
    }));

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen
        options={{
          title: 'Add to Map',
          headerShown: true,
          headerRight: () => (
            <AnimatedPressable onPress={handleSave} disabled={saving}>
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Check size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </View>
            </AnimatedPressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Map preview */}
        <View style={{ height: 220, margin: 16, borderRadius: 16, overflow: 'hidden' }}>
          <Map
            markers={mapMarkers}
            initialRegion={{ latitude: pinLat, longitude: pinLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            style={{ flex: 1, borderRadius: 16 }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              backgroundColor: isDark ? COLORS.dark.surface : COLORS.surface,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MapPin size={13} color={COLORS.primary} />
            <Text style={{ fontSize: 12, color: textSecondary }}>
              {pinLat.toFixed(4)}, {pinLng.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: COLORS.primaryMuted,
              borderRadius: 12,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <MapPin size={16} color={COLORS.primary} />
            <Text style={{ fontSize: 13, color: COLORS.primary, flex: 1, lineHeight: 18 }}>
              Toggle which pets appear on the breeder map. All enabled pets share the same pin location.
            </Text>
          </View>
        </View>

        {/* Pets list */}
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, marginBottom: 4 }}>
            Your Pets
          </Text>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : pets.length === 0 ? (
            <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center', marginTop: 20 }}>
              No pets found. Add a pet first.
            </Text>
          ) : (
            pets.map((pet) => {
              const speciesColor = SPECIES_COLORS[pet.species] ?? COLORS.primary;
              const isPublic = publicToggles[pet.id] ?? false;
              return (
                <View
                  key={pet.id}
                  style={{
                    backgroundColor: surface,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderWidth: 1,
                    borderColor: isPublic ? COLORS.primary + '40' : borderColor,
                  }}
                >
                  {pet.photo_url ? (
                    <Image
                      source={resolveImageSource(pet.photo_url)}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: speciesColor + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: '800', color: speciesColor }}>
                        {pet.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{pet.name}</Text>
                    <Text style={{ fontSize: 13, color: textSecondary, textTransform: 'capitalize' }}>
                      {pet.breed ?? pet.species}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Switch
                      value={isPublic}
                      onValueChange={(v) => handleToggle(pet.id, v)}
                      trackColor={{ false: borderColor, true: COLORS.primary + '80' }}
                      thumbColor={isPublic ? COLORS.primary : '#FFFFFF'}
                    />
                    <Text style={{ fontSize: 11, color: isPublic ? COLORS.primary : textSecondary }}>
                      {isPublic ? 'Visible' : 'Hidden'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
