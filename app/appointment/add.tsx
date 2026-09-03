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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Check, Calendar } from 'lucide-react-native';
import { COLORS, SPECIES_COLORS } from '@/constants/Colors';
import { supabase, Pet } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';

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

export default function AddAppointmentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const inputBg = isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [vetName, setVetName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    const fetchPets = async () => {
      console.log('[AddAppointment] Fetching pets for picker...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name');
      if (data && data.length > 0) {
        setPets(data);
        setSelectedPetId(data[0].id);
      }
    };
    fetchPets();
  }, []);

  const handleSave = async () => {
    console.log('[AddAppointment] Save appointment pressed');
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setTitleError('');
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apptData = {
        user_id: session.user.id,
        pet_id: selectedPetId,
        title: title.trim(),
        vet_name: vetName.trim() || null,
        clinic_name: clinicName.trim() || null,
        appointment_date: appointmentDate.toISOString(),
        notes: notes.trim() || null,
        is_completed: false,
      };

      console.log('[AddAppointment] Inserting appointment:', apptData.title, apptData.appointment_date);
      const { error } = await supabase.from('vet_appointments').insert(apptData);

      if (error) {
        console.error('[AddAppointment] Error saving:', error.message);
        Alert.alert('Error', `Couldn't save appointment: ${error.message}`);
      } else {
        console.log('[AddAppointment] Appointment saved successfully');
        router.back();
      }
    } finally {
      setSaving(false);
    }
  };

  const dateDisplay = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

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
        <AnimatedPressable onPress={() => {
          console.log('[AddAppointment] Close pressed');
          router.back();
        }}>
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Add Appointment</Text>
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
        {/* Pet picker */}
        {pets.length > 0 ? (
          <FormField label="Pet">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {pets.map((pet) => {
                const isSelected = selectedPetId === pet.id;
                const speciesColor = SPECIES_COLORS[pet.species] ?? COLORS.primary;
                return (
                  <AnimatedPressable
                    key={pet.id}
                    onPress={() => {
                      console.log('[AddAppointment] Pet selected:', pet.id, pet.name);
                      setSelectedPetId(pet.id);
                    }}
                  >
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: isSelected ? speciesColor + '20' : (isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary),
                        borderWidth: 1.5,
                        borderColor: isSelected ? speciesColor : (isDark ? COLORS.dark.border : COLORS.border),
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: speciesColor + '30',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: speciesColor }}>
                          {pet.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? speciesColor : textSecondary,
                        }}
                      >
                        {pet.name}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </FormField>
        ) : (
          <View
            style={{
              backgroundColor: COLORS.warningMuted,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 14, color: COLORS.warning, fontWeight: '600' }}>
              No pets found. Add a pet first to link this appointment.
            </Text>
          </View>
        )}

        {/* Title */}
        <FormField label="Title" required>
          <TextInput
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (text.trim()) setTitleError('');
            }}
            placeholder="e.g. Annual Checkup, Vaccination"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: titleError ? COLORS.danger : (isDark ? COLORS.dark.border : COLORS.border),
            }}
            autoFocus
          />
          {titleError ? <Text style={{ fontSize: 12, color: COLORS.danger }}>{titleError}</Text> : null}
        </FormField>

        {/* Vet & Clinic */}
        <FormField label="Vet name">
          <TextInput
            value={vetName}
            onChangeText={setVetName}
            placeholder="e.g. Dr. Smith"
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

        <FormField label="Clinic name">
          <TextInput
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="e.g. Happy Paws Veterinary"
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

        {/* Date/time picker */}
        <FormField label="Date & time">
          <View
            style={{
              backgroundColor: surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? COLORS.dark.border : COLORS.border,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingTop: 12,
                gap: 8,
              }}
            >
              <Calendar size={16} color={COLORS.primary} />
              <Text style={{ fontSize: 14, color: textSecondary }}>{dateDisplay}</Text>
            </View>
            <DateTimePicker
              value={appointmentDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, date) => {
                if (date) {
                  console.log('[AddAppointment] Date changed:', date.toISOString());
                  setAppointmentDate(date);
                }
              }}
              minimumDate={new Date()}
              themeVariant={isDark ? 'dark' : 'light'}
              accentColor={COLORS.primary}
            />
          </View>
        </FormField>

        {/* Notes */}
        <FormField label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes for this appointment..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: isDark ? COLORS.dark.border : COLORS.border,
              minHeight: 80,
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
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Check size={18} color="#FFFFFF" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
              {saving ? 'Saving...' : 'Save appointment'}
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
