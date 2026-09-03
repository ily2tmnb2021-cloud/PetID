import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Check, Plus } from 'lucide-react-native';
import { COLORS, SPECIES_COLORS } from '@/constants/Colors';
import { supabase } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const SPECIES_OPTIONS = ['dog', 'cat', 'bird', 'rabbit', 'other'] as const;
const GENDER_OPTIONS = ['male', 'female', 'unknown'] as const;

type Species = typeof SPECIES_OPTIONS[number];
type Gender = typeof GENDER_OPTIONS[number];

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labelMap,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelMap?: Record<string, string>;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const isSelected = value === opt;
        const label = labelMap?.[opt] ?? (opt.charAt(0).toUpperCase() + opt.slice(1));
        return (
          <AnimatedPressable key={opt} onPress={() => onChange(opt)} style={{ flex: 1 }}>
            <View
              style={{
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: isSelected ? (isDark ? COLORS.dark.surface : COLORS.surface) : 'transparent',
                boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.08)' : undefined,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? COLORS.primary : (isDark ? COLORS.dark.textSecondary : COLORS.textSecondary),
                }}
              >
                {label}
              </Text>
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? COLORS.dark.text : COLORS.text;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{label}</Text>
        {required ? (
          <Text style={{ fontSize: 14, color: COLORS.danger }}>*</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export default function AddPetScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const inputBg = isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary;

  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [gender, setGender] = useState<Gender>('unknown');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const handlePickPhoto = async () => {
    console.log('[AddPet] Pick photo pressed');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      console.log('[AddPet] Photo selected:', result.assets[0].uri);
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    console.log('[AddPet] Take photo pressed');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      console.log('[AddPet] Photo taken:', result.assets[0].uri);
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string, userId: string): Promise<string | null> => {
    console.log('[AddPet] Uploading photo to Supabase Storage...');
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop() ?? 'jpg';
      const fileName = `${userId}/${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, blob, { contentType: `image/${ext}` });

      if (error) {
        console.error('[AddPet] Upload error:', error.message);
        return null;
      }

      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(data.path);
      console.log('[AddPet] Photo uploaded, URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err) {
      console.error('[AddPet] Upload exception:', err);
      return null;
    }
  };

  const handleSave = async () => {
    console.log('[AddPet] Save pet pressed');
    if (!name.trim()) {
      setNameError('Pet name is required');
      return;
    }
    setNameError('');
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'No session found. Please restart the app.');
        setSaving(false);
        return;
      }

      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadPhoto(photoUri, session.user.id);
      }

      const petData = {
        user_id: session.user.id,
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        age_years: ageYears ? parseFloat(ageYears) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        gender,
        notes: notes.trim() || null,
        photo_url: photoUrl,
      };

      console.log('[AddPet] Inserting pet:', petData.name, petData.species);
      const { error } = await supabase.from('pets').insert(petData);

      if (error) {
        console.error('[AddPet] Error saving pet:', error.message);
        Alert.alert('Error', `Couldn't save pet: ${error.message}`);
      } else {
        console.log('[AddPet] Pet saved successfully');
        router.back();
      }
    } catch (err) {
      console.error('[AddPet] Exception:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    console.log('[AddPet] Close pressed');
    router.back();
  };

  const speciesColor = SPECIES_COLORS[species] ?? COLORS.primary;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? COLORS.dark.border : COLORS.border,
        }}
      >
        <AnimatedPressable onPress={handleClose}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color={textSecondary} />
          </View>
        </AnimatedPressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Add Pet</Text>
        <AnimatedPressable onPress={handleSave} disabled={saving}>
          <View
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </View>
        </AnimatedPressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo picker */}
        <View style={{ alignItems: 'center', gap: 12 }}>
          <AnimatedPressable onPress={handlePickPhoto}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: speciesColor + '20',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: speciesColor + '40',
                borderStyle: 'dashed',
                overflow: 'hidden',
              }}
            >
              {photoUri ? (
                <Image
                  source={resolveImageSource(photoUri)}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Camera size={24} color={speciesColor} />
                  <Text style={{ fontSize: 11, color: speciesColor, fontWeight: '600' }}>Add photo</Text>
                </View>
              )}
            </View>
          </AnimatedPressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <AnimatedPressable onPress={handlePickPhoto}>
              <View
                style={{
                  backgroundColor: COLORS.primaryMuted,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                  Choose photo
                </Text>
              </View>
            </AnimatedPressable>
            <AnimatedPressable onPress={handleTakePhoto}>
              <View
                style={{
                  backgroundColor: COLORS.primaryMuted,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                  Take photo
                </Text>
              </View>
            </AnimatedPressable>
          </View>
        </View>

        {/* Name */}
        <FormField label="Name" required>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (text.trim()) setNameError('');
            }}
            placeholder="e.g. Buddy"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: nameError ? COLORS.danger : (isDark ? COLORS.dark.border : COLORS.border),
            }}
            autoFocus
            returnKeyType="next"
          />
          {nameError ? (
            <Text style={{ fontSize: 12, color: COLORS.danger }}>{nameError}</Text>
          ) : null}
        </FormField>

        {/* Species */}
        <FormField label="Species">
          <SegmentedControl
            options={SPECIES_OPTIONS}
            value={species}
            onChange={(v) => {
              console.log('[AddPet] Species changed to:', v);
              setSpecies(v);
            }}
          />
        </FormField>

        {/* Breed */}
        <FormField label="Breed">
          <TextInput
            value={breed}
            onChangeText={setBreed}
            placeholder="e.g. Golden Retriever"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: isDark ? COLORS.dark.border : COLORS.border,
            }}
            returnKeyType="next"
          />
        </FormField>

        {/* Age & Weight */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormField label="Age (years)">
              <TextInput
                value={ageYears}
                onChangeText={setAgeYears}
                placeholder="e.g. 3"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: inputBg,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: textColor,
                  borderWidth: 1,
                  borderColor: isDark ? COLORS.dark.border : COLORS.border,
                }}
              />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label="Weight (kg)">
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder="e.g. 12.5"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: inputBg,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: textColor,
                  borderWidth: 1,
                  borderColor: isDark ? COLORS.dark.border : COLORS.border,
                }}
              />
            </FormField>
          </View>
        </View>

        {/* Gender */}
        <FormField label="Gender">
          <SegmentedControl
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(v) => {
              console.log('[AddPet] Gender changed to:', v);
              setGender(v);
            }}
          />
        </FormField>

        {/* Notes */}
        <FormField label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes about your pet..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: isDark ? COLORS.dark.border : COLORS.border,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />
        </FormField>

        {/* Save button */}
        <AnimatedPressable onPress={handleSave} disabled={saving}>
          <View
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Check size={18} color="#FFFFFF" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
              {saving ? 'Saving pet...' : 'Save pet'}
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
