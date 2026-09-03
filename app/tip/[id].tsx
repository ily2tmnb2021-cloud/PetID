import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Clock, Check } from 'lucide-react-native';
import { COLORS, CATEGORY_COLORS, DIFFICULTY_COLORS } from '@/constants/Colors';
import { supabase, AnxietyTip } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';

export default function TipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [tip, setTip] = useState<AnxietyTip | null>(null);
  const [loading, setLoading] = useState(true);
  const [tried, setTried] = useState(false);

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      console.log('[TipDetail] Fetching tip:', id);
      const { data, error } = await supabase
        .from('anxiety_tips')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('[TipDetail] Error:', error.message);
      } else {
        console.log('[TipDetail] Loaded tip:', data?.title);
        setTip(data);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleMarkTried = () => {
    console.log('[TipDetail] Mark as tried pressed:', id);
    setTried(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, padding: 20, gap: 16 }}>
        <Stack.Screen options={{ title: '' }} />
        <SkeletonLine width="80%" height={28} />
        <SkeletonLine width="40%" height={16} />
        <SkeletonLine width="100%" height={16} />
        <SkeletonLine width="90%" height={16} />
        <SkeletonLine width="70%" height={16} />
      </View>
    );
  }

  if (!tip) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: '' }} />
        <Text style={{ color: textSecondary }}>Tip not found</Text>
      </View>
    );
  }

  const categoryColor = CATEGORY_COLORS[tip.category] ?? COLORS.primary;
  const difficultyColor = DIFFICULTY_COLORS[tip.difficulty] ?? COLORS.primary;
  const categoryLabel = tip.category.charAt(0).toUpperCase() + tip.category.slice(1);
  const difficultyLabel = tip.difficulty.charAt(0).toUpperCase() + tip.difficulty.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View
              style={{
                backgroundColor: categoryColor + '20',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: categoryColor }}>
                {categoryLabel}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: difficultyColor + '20',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: difficultyColor }}>
                {difficultyLabel}
              </Text>
            </View>
            {tip.duration_minutes != null ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Clock size={12} color={COLORS.textTertiary} />
                <Text style={{ fontSize: 13, color: COLORS.textTertiary }}>
                  {tip.duration_minutes} min
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: textColor,
              letterSpacing: -0.5,
              lineHeight: 34,
            }}
          >
            {tip.title}
          </Text>
        </View>

        {/* Description */}
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            borderWidth: 1,
            borderColor: isDark ? COLORS.dark.border : COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: textSecondary,
              lineHeight: 26,
            }}
          >
            {tip.description}
          </Text>
        </View>

        {/* Species badge */}
        {tip.species !== 'all' ? (
          <View
            style={{
              backgroundColor: COLORS.primaryMuted,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '600' }}>
              Best for: {tip.species.charAt(0).toUpperCase() + tip.species.slice(1)}s
            </Text>
          </View>
        ) : null}

        {/* Mark as tried */}
        <AnimatedPressable onPress={tried ? undefined : handleMarkTried} disabled={tried}>
          <View
            style={{
              backgroundColor: tried ? COLORS.primaryMuted : COLORS.primary,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Check size={18} color={tried ? COLORS.primary : '#FFFFFF'} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: tried ? COLORS.primary : '#FFFFFF',
              }}
            >
              {tried ? 'Marked as tried!' : 'Mark as tried'}
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}
