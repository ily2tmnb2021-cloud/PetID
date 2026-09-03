import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  useColorScheme,
  Alert,
  Modal,
  FlatList,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera, ImageIcon, Zap, X, Check, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase, BreedIdentification, Pet } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';
import * as FileSystem from 'expo-file-system/legacy';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const width = useRef(new Animated.Value(0)).current;
  const pct = Math.min(Math.max(confidence, 0), 1);
  const pctDisplay = Math.round(pct * 100);

  useEffect(() => {
    Animated.timing(width, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barColor = pct >= 0.8 ? COLORS.primary : pct >= 0.5 ? COLORS.warning : COLORS.danger;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' }}>
          Confidence
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: barColor }}>
          {pctDisplay}%
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: COLORS.surfaceSecondary,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 4,
            backgroundColor: barColor,
            width: width.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
}

function LoadingPaw() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: COLORS.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={36} color={COLORS.primary} />
        </View>
      </Animated.View>
      <Text
        style={{
          marginTop: 16,
          fontSize: 16,
          fontWeight: '600',
          color: COLORS.textSecondary,
        }}
      >
        Analyzing breed...
      </Text>
      <Text style={{ marginTop: 4, fontSize: 13, color: COLORS.textTertiary }}>
        This may take a moment
      </Text>
    </View>
  );
}

interface IdentifyResult {
  breed: string;
  confidence: number;
  description: string;
  traits: string[];
  species: string;
  imageUri: string;
}

function ResultCard({
  result,
  onSaveToPet,
  onTryAnother,
}: {
  result: IdentifyResult;
  onSaveToPet: () => void;
  onTryAnother: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;

  return (
    <View style={{ gap: 16 }}>
      <Image
        source={resolveImageSource(result.imageUri)}
        style={{
          width: '100%',
          height: 240,
          borderRadius: 16,
          backgroundColor: COLORS.surfaceSecondary,
        }}
        contentFit="cover"
      />
      <View
        style={{
          backgroundColor: surface,
          borderRadius: 16,
          padding: 20,
          gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          borderWidth: 1,
          borderColor: isDark ? COLORS.dark.border : COLORS.border,
        }}
      >
        <View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
            Identified Breed
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: textColor,
              letterSpacing: -0.5,
            }}
          >
            {result.breed}
          </Text>
          {result.species ? (
            <View
              style={{
                backgroundColor: COLORS.primaryMuted,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 6,
                alignSelf: 'flex-start',
                marginTop: 6,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary }}>
                {result.species}
              </Text>
            </View>
          ) : null}
        </View>

        <ConfidenceBar confidence={result.confidence} />

        {result.description ? (
          <Text style={{ fontSize: 15, color: textSecondary, lineHeight: 22 }}>
            {result.description}
          </Text>
        ) : null}

        {result.traits && result.traits.length > 0 ? (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: textSecondary, marginBottom: 8 }}>
              Traits
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {result.traits.map((trait, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: COLORS.primaryMuted,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
                    {trait}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <AnimatedPressable onPress={onSaveToPet}>
        <View
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Check size={18} color="#FFFFFF" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
            Save to pet profile
          </Text>
        </View>
      </AnimatedPressable>

      <AnimatedPressable onPress={onTryAnother}>
        <View
          style={{
            backgroundColor: COLORS.surfaceSecondary,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textSecondary }}>
            Try another photo
          </Text>
        </View>
      </AnimatedPressable>
    </View>
  );
}

function RecentIdentificationCard({ item }: { item: BreedIdentification }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const pct = Math.round(Math.min(Math.max(item.result_confidence, 0), 1) * 100);

  const dateStr = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: isDark ? COLORS.dark.border : COLORS.border,
      }}
    >
      {item.image_url ? (
        <Image
          source={resolveImageSource(item.image_url)}
          style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: COLORS.surfaceSecondary }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            backgroundColor: COLORS.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={22} color={COLORS.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }} numberOfLines={1}>
          {item.result_breed}
        </Text>
        <Text style={{ fontSize: 13, color: textSecondary }}>
          {pct}% confidence · {dateStr}
        </Text>
      </View>
      <ChevronRight size={16} color={COLORS.textTertiary} />
    </View>
  );
}

export default function IdentifyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [recentIds, setRecentIds] = useState<BreedIdentification[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [petPickerVisible, setPetPickerVisible] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    fetchRecentIdentifications();
  }, []);

  const fetchRecentIdentifications = async () => {
    console.log('[Identify] Fetching recent identifications...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setRecentLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('breed_identifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[Identify] Error fetching recent IDs:', error.message);
    } else {
      console.log('[Identify] Fetched', data?.length ?? 0, 'recent identifications');
      setRecentIds(data ?? []);
    }
    setRecentLoading(false);
  };

  const processImage = async (uri: string) => {
    console.log('[Identify] Processing image for breed identification...');
    setLoading(true);
    setResult(null);

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      console.log('[Identify] Calling identify-breed edge function...');
      const response = await fetch(
        'https://sycswusdpxhwfoibornt.supabase.co/functions/v1/identify-breed',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ image_base64: base64 }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Identify] Edge function error:', response.status, errText);
        throw new Error(`Identification failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Identify] Breed identified:', data.breed, 'confidence:', data.confidence);

      const identifyResult: IdentifyResult = {
        breed: data.breed ?? 'Unknown',
        confidence: typeof data.confidence === 'number' ? data.confidence : parseFloat(String(data.confidence)) || 0,
        description: data.description ?? '',
        traits: Array.isArray(data.traits) ? data.traits : [],
        species: data.species ?? '',
        imageUri: uri,
      };

      setResult(identifyResult);

      // Save to database
      if (session) {
        const { error: saveError } = await supabase.from('breed_identifications').insert({
          user_id: session.user.id,
          image_url: uri,
          result_breed: identifyResult.breed,
          result_confidence: identifyResult.confidence,
          result_description: identifyResult.description,
          result_traits: identifyResult.traits,
          result_raw: data,
        });
        if (saveError) {
          console.error('[Identify] Error saving identification:', saveError.message);
        } else {
          console.log('[Identify] Identification saved to database');
          fetchRecentIdentifications();
        }
      }
    } catch (err) {
      console.error('[Identify] Error during identification:', err);
      Alert.alert(
        "Couldn't identify breed",
        "There was a problem analyzing the photo. Please try again.",
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    console.log('[Identify] Take photo button pressed');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access needed', 'Please allow camera access to take photos.');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!pickerResult.canceled && pickerResult.assets[0]) {
      await processImage(pickerResult.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
    console.log('[Identify] Choose from library button pressed');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photo library access needed', 'Please allow photo library access.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!pickerResult.canceled && pickerResult.assets[0]) {
      await processImage(pickerResult.assets[0].uri);
    }
  };

  const handleSaveToPet = async () => {
    console.log('[Identify] Save to pet profile pressed');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', session.user.id);
    setPets(data ?? []);
    setPetPickerVisible(true);
  };

  const handleSelectPet = async (pet: Pet) => {
    console.log('[Identify] Saving breed to pet:', pet.id, pet.name);
    setPetPickerVisible(false);
    if (!result) return;
    const { error } = await supabase
      .from('pets')
      .update({ breed: result.breed })
      .eq('id', pet.id);
    if (error) {
      console.error('[Identify] Error updating pet breed:', error.message);
      Alert.alert('Error', 'Could not save breed to pet profile.');
    } else {
      console.log('[Identify] Breed saved to pet profile successfully');
      Alert.alert('Saved!', `${result.breed} has been saved to ${pet.name}'s profile.`);
    }
  };

  const handleTryAnother = () => {
    console.log('[Identify] Try another photo pressed');
    setResult(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen options={{ title: 'Identify Breed' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingPaw />
        ) : result ? (
          <ResultCard
            result={result}
            onSaveToPet={handleSaveToPet}
            onTryAnother={handleTryAnother}
          />
        ) : (
          <>
            {/* Hero card */}
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={32} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  letterSpacing: -0.3,
                }}
              >
                AI Breed Identifier
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.85)',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Take a photo of any animal to instantly identify its breed with AI
              </Text>
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <AnimatedPressable onPress={handleTakePhoto} style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: surface,
                    borderRadius: 16,
                    padding: 20,
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
                    borderWidth: 1,
                    borderColor: isDark ? COLORS.dark.border : COLORS.border,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: COLORS.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Camera size={22} color={COLORS.primary} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                    Take Photo
                  </Text>
                </View>
              </AnimatedPressable>

              <AnimatedPressable onPress={handleChooseFromLibrary} style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: surface,
                    borderRadius: 16,
                    padding: 20,
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
                    borderWidth: 1,
                    borderColor: isDark ? COLORS.dark.border : COLORS.border,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: COLORS.accentMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImageIcon size={22} color={COLORS.accent} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                    From Library
                  </Text>
                </View>
              </AnimatedPressable>
            </View>

            {/* Recent identifications */}
            {recentLoading ? (
              <View style={{ gap: 10 }}>
                <SkeletonLine width="40%" height={16} style={{ marginBottom: 8 }} />
                {[1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: surface,
                      borderRadius: 14,
                      padding: 14,
                      flexDirection: 'row',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <SkeletonLine width={52} height={52} borderRadius={10} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <SkeletonLine width="60%" height={15} />
                      <SkeletonLine width="40%" height={13} />
                    </View>
                  </View>
                ))}
              </View>
            ) : recentIds.length > 0 ? (
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: textColor,
                    marginBottom: 12,
                    letterSpacing: -0.2,
                  }}
                >
                  Recent Identifications
                </Text>
                {recentIds.map((item) => (
                  <RecentIdentificationCard key={item.id} item={item} />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Pet picker modal */}
      <Modal
        visible={petPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPetPickerVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? COLORS.dark.surface : COLORS.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? COLORS.dark.text : COLORS.text }}>
                Save to pet
              </Text>
              <AnimatedPressable onPress={() => setPetPickerVisible(false)}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: COLORS.surfaceSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} color={COLORS.textSecondary} />
                </View>
              </AnimatedPressable>
            </View>
            {pets.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                No pets found. Add a pet first.
              </Text>
            ) : (
              pets.map((pet) => (
                <AnimatedPressable key={pet.id} onPress={() => handleSelectPet(pet)}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? COLORS.dark.divider : COLORS.divider,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.primaryMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>
                        {pet.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? COLORS.dark.text : COLORS.text }}>
                      {pet.name}
                    </Text>
                  </View>
                </AnimatedPressable>
              ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
