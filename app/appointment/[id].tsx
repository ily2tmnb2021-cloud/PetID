import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, User, Building2, FileText, Check, Trash2, Clock } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase, VetAppointment } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: textSecondary, fontWeight: '500', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, color: textColor, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [appt, setAppt] = useState<VetAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      console.log('[AppointmentDetail] Fetching appointment:', id);
      const { data, error } = await supabase
        .from('vet_appointments')
        .select('*, pet:pets(name, species)')
        .eq('id', id)
        .single();
      if (error) {
        console.error('[AppointmentDetail] Error:', error.message);
      } else {
        console.log('[AppointmentDetail] Loaded:', data?.title);
        setAppt(data as VetAppointment);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleComplete = async () => {
    console.log('[AppointmentDetail] Mark complete pressed:', id);
    const { error } = await supabase
      .from('vet_appointments')
      .update({ is_completed: true })
      .eq('id', id);
    if (error) {
      Alert.alert('Error', 'Could not mark as complete.');
    } else {
      setAppt((prev) => prev ? { ...prev, is_completed: true } : prev);
    }
  };

  const handleDelete = () => {
    console.log('[AppointmentDetail] Delete pressed:', id);
    Alert.alert(
      'Delete appointment?',
      'This will permanently remove this appointment.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete appointment',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('vet_appointments').delete().eq('id', id);
            if (error) {
              Alert.alert('Error', 'Could not delete appointment.');
            } else {
              console.log('[AppointmentDetail] Appointment deleted');
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, padding: 20, gap: 16 }}>
        <Stack.Screen options={{ title: 'Appointment' }} />
        <SkeletonLine width="60%" height={24} />
        <SkeletonLine width="40%" height={16} />
        <SkeletonLine width="80%" height={16} />
      </View>
    );
  }

  if (!appt) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: 'Appointment' }} />
        <Text style={{ color: textSecondary }}>Appointment not found</Text>
      </View>
    );
  }

  const isUpcoming = !appt.is_completed && new Date(appt.appointment_date) >= new Date();
  const statusColor = appt.is_completed ? COLORS.primary : isUpcoming ? COLORS.accent : COLORS.textTertiary;
  const statusLabel = appt.is_completed ? 'Completed' : isUpcoming ? 'Upcoming' : 'Past';
  const dateDisplay = formatDate(appt.appointment_date);
  const petName = (appt.pet as { name?: string } | undefined)?.name;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen options={{ title: 'Appointment' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 16,
            padding: 20,
            gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
            borderWidth: 1,
            borderColor: isDark ? COLORS.dark.border : COLORS.border,
            borderLeftWidth: 4,
            borderLeftColor: statusColor,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: textColor,
                letterSpacing: -0.3,
                flex: 1,
              }}
            >
              {appt.title}
            </Text>
            <View
              style={{
                backgroundColor: statusColor + '20',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                marginLeft: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color={COLORS.textTertiary} />
            <Text style={{ fontSize: 14, color: textSecondary }}>{dateDisplay}</Text>
          </View>
        </View>

        {/* Details */}
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            borderWidth: 1,
            borderColor: isDark ? COLORS.dark.border : COLORS.border,
          }}
        >
          {petName ? (
            <InfoRow
              icon={<User size={16} color={COLORS.primary} />}
              label="Pet"
              value={petName}
            />
          ) : null}
          {appt.vet_name ? (
            <InfoRow
              icon={<User size={16} color={COLORS.primary} />}
              label="Veterinarian"
              value={appt.vet_name}
            />
          ) : null}
          {appt.clinic_name ? (
            <InfoRow
              icon={<Building2 size={16} color={COLORS.primary} />}
              label="Clinic"
              value={appt.clinic_name}
            />
          ) : null}
          {appt.notes ? (
            <InfoRow
              icon={<FileText size={16} color={COLORS.primary} />}
              label="Notes"
              value={appt.notes}
            />
          ) : null}
        </View>

        {/* Actions */}
        {!appt.is_completed ? (
          <AnimatedPressable onPress={handleComplete}>
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
                Mark as completed
              </Text>
            </View>
          </AnimatedPressable>
        ) : null}

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
              Delete appointment
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}
