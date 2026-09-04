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
  Switch,
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

export default function AddPetScreen() {
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
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  // New fields
  const [dietSummary, setDietSummary] = useState('');
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [favChewToys, setFavChewToys] = useState<string[]>([]);
  const [litterCount, setLitterCount] = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [isPublic, setIsPublic] = useState(false);

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
        diet_summary: dietSummary.trim() || null,
        likes: likes.length > 0 ? likes : null,
        dislikes: dislikes.length > 0 ? dislikes : null,
        fav_chew_toys: favChewToys.length > 0 ? favChewToys : null,
        litter_count: litterCount ? parseInt(litterCount, 10) : null,
        microchip_id: microchipId.trim() || null,
        registration_number: registrationNumber.trim() || null,
        is_public: isPublic,
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
              borderColor: nameError ? COLORS.danger : borderColor,
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
              borderColor: borderColor,
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
            returnKeyType="next"
          />
        </FormField>

        {/* Likes */}
        <FormField label="Likes">
          <TagInput
            tags={likes}
            onTagsChange={(tags) => {
              console.log('[AddPet] Likes updated:', tags);
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
              console.log('[AddPet] Dislikes updated:', tags);
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
              console.log('[AddPet] Fav chew toys updated:', tags);
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
            returnKeyType="next"
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
            returnKeyType="next"
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
              console.log('[AddPet] Show on map toggled:', v);
              setIsPublic(v);
            }}
            trackColor={{ false: borderColor, true: COLORS.primary + '80' }}
            thumbColor={isPublic ? COLORS.primary : '#FFFFFF'}
          />
        </View>

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
