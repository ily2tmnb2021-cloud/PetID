import React, { useState } from 'react';
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';

type LogType = 'diet' | 'weight' | 'medication' | 'allergy' | 'pregnancy' | 'vet_note' | 'vaccination' | 'other';

const LOG_TYPES: { key: LogType; label: string; emoji: string }[] = [
  { key: 'diet', label: 'Diet', emoji: '🥗' },
  { key: 'weight', label: 'Weight', emoji: '⚖️' },
  { key: 'medication', label: 'Medication', emoji: '💊' },
  { key: 'allergy', label: 'Allergy', emoji: '⚠️' },
  { key: 'pregnancy', label: 'Pregnancy', emoji: '🤰' },
  { key: 'vet_note', label: 'Vet Note', emoji: '🏥' },
  { key: 'vaccination', label: 'Vaccination', emoji: '💉' },
  { key: 'other', label: 'Other', emoji: '📝' },
];

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? COLORS.dark.text : COLORS.text }}>
          {label}
        </Text>
        {required ? <Text style={{ fontSize: 14, color: COLORS.danger }}>*</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function AddHealthLogScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const inputBg = isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const [logType, setLogType] = useState<LogType>('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [valueNumeric, setValueNumeric] = useState('');
  const [valueUnit, setValueUnit] = useState('');
  const [loggedAt, setLoggedAt] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState('');

  const handleSave = async () => {
    console.log('[AddHealthLog] Save pressed, type:', logType, 'title:', title);
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setTitleError('');
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'No session found.');
        setSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {
        pet_id: petId,
        user_id: session.user.id,
        log_type: logType,
        title: title.trim(),
        description: description.trim() || null,
        value_numeric: valueNumeric ? parseFloat(valueNumeric) : null,
        value_unit: valueUnit.trim() || null,
        logged_at: loggedAt.toISOString(),
      };

      console.log('[AddHealthLog] Inserting health log:', payload.log_type, payload.title);
      const { error } = await supabase.from('health_logs').insert(payload);

      if (error) {
        console.error('[AddHealthLog] Error saving log:', error.message);
        Alert.alert('Error', `Couldn't save log: ${error.message}`);
      } else {
        console.log('[AddHealthLog] Health log saved successfully');
        router.back();
      }
    } catch (err) {
      console.error('[AddHealthLog] Exception:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Add Health Log',
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
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Log type picker */}
        <FormField label="Type">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LOG_TYPES.map((t) => {
              const isSelected = logType === t.key;
              return (
                <AnimatedPressable
                  key={t.key}
                  onPress={() => {
                    console.log('[AddHealthLog] Log type selected:', t.key);
                    setLogType(t.key);
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isSelected ? COLORS.primary : (isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary),
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      borderWidth: 1,
                      borderColor: isSelected ? COLORS.primary : borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: isSelected ? '#FFFFFF' : textColor,
                      }}
                    >
                      {t.label}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </FormField>

        {/* Title */}
        <FormField label="Title" required>
          <TextInput
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (text.trim()) setTitleError('');
            }}
            placeholder="e.g. Morning medication"
            placeholderTextColor={COLORS.textTertiary}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: textColor,
              borderWidth: 1,
              borderColor: titleError ? COLORS.danger : borderColor,
            }}
            autoFocus
            returnKeyType="next"
          />
          {titleError ? (
            <Text style={{ fontSize: 12, color: COLORS.danger }}>{titleError}</Text>
          ) : null}
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Additional notes..."
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
              borderColor: borderColor,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
        </FormField>

        {/* Value & Unit */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 2 }}>
            <FormField label="Value (optional)">
              <TextInput
                value={valueNumeric}
                onChangeText={setValueNumeric}
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
          <View style={{ flex: 1 }}>
            <FormField label="Unit">
              <TextInput
                value={valueUnit}
                onChangeText={setValueUnit}
                placeholder="kg, mg..."
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
          </View>
        </View>

        {/* Date/time picker */}
        <FormField label="Date & Time">
          <View
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderColor,
              overflow: 'hidden',
            }}
          >
            <DateTimePicker
              value={loggedAt}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                if (date) {
                  console.log('[AddHealthLog] Date changed:', date.toISOString());
                  setLoggedAt(date);
                }
              }}
              maximumDate={new Date()}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          </View>
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
              {saving ? 'Saving...' : 'Save entry'}
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
