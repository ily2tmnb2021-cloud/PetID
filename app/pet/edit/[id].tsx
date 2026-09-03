import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Check, Trash2 } from 'lucide-react-native';
import { COLORS, SPECIES_COLORS } from '@/constants/Colors';
import { supabase, Pet } from '@/utils/supabase';
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
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
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
        const label = opt.charAt(0).toUpperCase() + opt.slice(1);
        return (
          <AnimatedPressable key={opt} onPress={() => onChange(opt)} style={{ flex: 1 }}>
            <View
              style={{
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: isSelected ? (isDark ? COLORS.dark.surface : COLORS.surface) : 'transparent',
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

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? COLORS.dark.text : COLORS.text }}>{label}</Text>
        {required ? <Text style={{ fontSize: 14, color: COLORS.danger }}>*</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
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
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;
      console.log('[EditPet] Loading pet:', id);
      const { data, error } = await supabase.from('pets').select('*').eq('id', id).single();
      if (error) {
        console.error('[EditPet] Error loading pet:', error.message);
      } else if (data) {
        const pet = data as Pet;
        setName(pet.name);
        setSpecies(pet.species);
        setBreed(pet.breed ?? '');
        setAgeYears(pet.age_years != null ? String(pet.age_years) : '');
        setWeightKg(pet.weight_kg != null ? String(pet.weight_kg) : '');
        setGender(pet.gender ?? 'unknown');
        setNotes(pet.notes ?? '');
        setExistingPhotoUrl(pet.photo_url ?? null);
      }
      setLoading(false);
    };
    fetchPet();
  }, [id]);

  const handlePickPhoto = async () => {
    console.log('[EditPet] Pick photo pressed');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string, userId: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop() ?? 'jpg';
      const fileName = `${userId}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, blob, { contentType: `image/${ext}` });
      if (error) return null;
      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    console.log('[EditPet] Save pressed for pet:', id);
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for your pet.');
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let photoUrl = existingPhotoUrl;
      if (photoUri) {
        photoUrl = await uploadPhoto(photoUri, session.user.id);
      }

      const { error } = await supabase.from('pets').update({
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        age_years: ageYears ? parseFloat(ageYears) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        gender,
        notes: notes.trim() || null,
        photo_url: photoUrl,
      }).eq('id', id);

      if (error) {
        console.error('[EditPet] Error saving:', error.message);
        Alert.alert('Error', `Couldn't save changes: ${error.message}`);
      } else {
        console.log('[EditPet] Pet updated successfully');
        router.back();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    console.log('[EditPet] Delete pet pressed:', id);
    Alert.alert(
      'Delete pet?',
      `This will permanently delete ${name || 'this pet'} and all their data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete pet',
          style: 'destructive',
          onPress: async () => {
            console.log('[EditPet] Confirming delete for pet:', id);
            const { error } = await supabase.from('pets').delete().eq('id', id);
            if (error) {
              Alert.alert('Error', 'Could not delete pet.');
            } else {
              console.log('[EditPet] Pet deleted successfully');
              router.dismissAll();
            }
          },
        },
      ]
    );
  };

  const displayPhoto = photoUri ?? existingPhotoUrl;
  const speciesColor = SPECIES_COLORS[species] ?? COLORS.primary;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
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
        <AnimatedPressable onPress={() => router.back()}>
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Edit Pet</Text>
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
        {/* Photo */}
        <View style={{ alignItems: 'center' }}>
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
                overflow: 'hidden',
              }}
            >
              {displayPhoto ? (
                <Image
                  source={resolveImageSource(displayPhoto)}
                  style={{ width: 100, height: 100 }}
                  contentFit="cover"
                />
              ) : (
                <Camera size={28} color={speciesColor} />
              )}
            </View>
          </AnimatedPressable>
        </View>

        <FormField label="Name" required>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Pet name"
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
          />
        </FormField>

        <FormField label="Species">
          <SegmentedControl options={SPECIES_OPTIONS} value={species} onChange={(v) => {
            console.log('[EditPet] Species changed:', v);
            setSpecies(v);
          }} />
        </FormField>

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
          />
        </FormField>

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

        <FormField label="Gender">
          <SegmentedControl options={GENDER_OPTIONS} value={gender} onChange={(v) => {
            console.log('[EditPet] Gender changed:', v);
            setGender(v);
          }} />
        </FormField>

        <FormField label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes..."
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

        <AnimatedPressable onPress={handleSave} disabled={saving}>
          <View
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
              {saving ? 'Saving...' : 'Save changes'}
            </Text>
          </View>
        </AnimatedPressable>

        <AnimatedPressable onPress={handleDelete}>
          <View
            style={{
              backgroundColor: COLORS.dangerMuted,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Trash2 size={16} color={COLORS.danger} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.danger }}>
              Delete pet
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
