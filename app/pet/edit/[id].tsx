import React, { useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Check, Trash2, Plus } from 'lucide-react-native';
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

function TagInput({
  tags,
  onTagsChange,
  placeholder,
  color,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
  color: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [inputValue, setInputValue] = useState('');
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const inputBg = isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    console.log('[TagInput] Remove tag:', tag);
    onTagsChange(tags.filter((t) => t !== tag));
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          style={{
            flex: 1,
            backgroundColor: inputBg,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 15,
            color: textColor,
            borderWidth: 1,
            borderColor: borderColor,
          }}
          returnKeyType="done"
          onSubmitEditing={addTag}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={addTag}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: color + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={18} color={color} />
        </TouchableOpacity>
      </View>
      {tags.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: color + '20',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color }}>{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(tag)}>
                <X size={12} color={color} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const inputBg = isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

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

  // New fields
  const [dietSummary, setDietSummary] = useState('');
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [favChewToys, setFavChewToys] = useState<string[]>([]);
  const [litterCount, setLitterCount] = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [isPublic, setIsPublic] = useState(false);

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
        setDietSummary(pet.diet_summary ?? '');
        setLikes(pet.likes ?? []);
        setDislikes(pet.dislikes ?? []);
        setFavChewToys(pet.fav_chew_toys ?? []);
        setLitterCount(pet.litter_count != null ? String(pet.litter_count) : '');
        setMicrochipId(pet.microchip_id ?? '');
        setRegistrationNumber(pet.registration_number ?? '');
        setIsPublic(pet.is_public ?? false);
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
        diet_summary: dietSummary.trim() || null,
        likes: likes.length > 0 ? likes : null,
        dislikes: dislikes.length > 0 ? dislikes : null,
        fav_chew_toys: favChewToys.length > 0 ? favChewToys : null,
        litter_count: litterCount ? parseInt(litterCount, 10) : null,
        microchip_id: microchipId.trim() || null,
        registration_number: registrationNumber.trim() || null,
        is_public: isPublic,
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
              borderColor: borderColor,
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
                  borderColor: borderColor,
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
                  borderColor: borderColor,
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

        {/* Diet summary */}
        <FormField label="Diet Summary">
          <TextInput
            value={dietSummary}
            onChangeText={setDietSummary}
            placeholder="e.g. Raw diet, twice daily"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: borderColor,
            }}
          />
        </FormField>

        {/* Likes */}
        <FormField label="Likes">
          <TagInput
            tags={likes}
            onTagsChange={(tags) => {
              console.log('[EditPet] Likes updated:', tags);
              setLikes(tags);
            }}
            placeholder="e.g. Fetch, swimming..."
            color="#4CAF82"
          />
        </FormField>

        {/* Dislikes */}
        <FormField label="Dislikes">
          <TagInput
            tags={dislikes}
            onTagsChange={(tags) => {
              console.log('[EditPet] Dislikes updated:', tags);
              setDislikes(tags);
            }}
            placeholder="e.g. Loud noises..."
            color="#FC8181"
          />
        </FormField>

        {/* Favourite chew toys */}
        <FormField label="Favourite Chew Toys">
          <TagInput
            tags={favChewToys}
            onTagsChange={(tags) => {
              console.log('[EditPet] Fav chew toys updated:', tags);
              setFavChewToys(tags);
            }}
            placeholder="e.g. Rope toy, Kong..."
            color="#F6AD55"
          />
        </FormField>

        {/* Litter count (female only) */}
        {gender === 'female' ? (
          <FormField label="Litter Count">
            <TextInput
              value={litterCount}
              onChangeText={setLitterCount}
              placeholder="e.g. 2"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="number-pad"
              style={{
                backgroundColor: inputBg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: textColor,
                borderWidth: 1,
                borderColor: borderColor,
              }}
            />
          </FormField>
        ) : null}

        {/* Microchip ID */}
        <FormField label="Microchip ID">
          <TextInput
            value={microchipId}
            onChangeText={setMicrochipId}
            placeholder="e.g. 985112345678901"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: borderColor,
            }}
          />
        </FormField>

        {/* Registration number */}
        <FormField label="Registration Number">
          <TextInput
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="e.g. AKC-123456"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: borderColor,
            }}
          />
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
              borderColor: borderColor,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />
        </FormField>

        {/* Show on breeder map toggle */}
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 14,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: borderColor,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
              Show on breeder map
            </Text>
            <Text style={{ fontSize: 13, color: textSecondary }}>
              Make this pet visible to other breeders on the map
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={(v) => {
              console.log('[EditPet] Show on map toggled:', v);
              setIsPublic(v);
            }}
            trackColor={{ false: borderColor, true: COLORS.primary + '80' }}
            thumbColor={isPublic ? COLORS.primary : '#FFFFFF'}
          />
        </View>

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
