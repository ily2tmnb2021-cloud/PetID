import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Heart, Clock, ChevronRight, Leaf } from 'lucide-react-native';
import { COLORS, CATEGORY_COLORS, DIFFICULTY_COLORS } from '@/constants/Colors';
import { supabase, AnxietyTip } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { TipCardSkeleton } from '@/components/SkeletonLoader';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'calming', label: 'Calming' },
  { key: 'training', label: 'Training' },
  { key: 'environment', label: 'Environment' },
  { key: 'exercise', label: 'Exercise' },
  { key: 'diet', label: 'Diet' },
  { key: 'medical', label: 'Medical' },
];

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function TipCard({ tip, index }: { tip: AnxietyTip; index: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;

  const categoryColor = CATEGORY_COLORS[tip.category] ?? COLORS.primary;
  const difficultyColor = DIFFICULTY_COLORS[tip.difficulty] ?? COLORS.primary;
  const categoryLabel = tip.category.charAt(0).toUpperCase() + tip.category.slice(1);
  const difficultyLabel = tip.difficulty.charAt(0).toUpperCase() + tip.difficulty.slice(1);

  const handlePress = () => {
    console.log('[Wellness] Tip card pressed:', tip.id, tip.title);
    router.push(`/tip/${tip.id}`);
  };

  return (
    <AnimatedListItem index={index}>
      <AnimatedPressable onPress={handlePress}>
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            gap: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
            borderWidth: 1,
            borderColor: isDark ? COLORS.dark.border : COLORS.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: categoryColor + '20',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: categoryColor, letterSpacing: 0.3 }}>
                {categoryLabel}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {tip.duration_minutes != null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Clock size={12} color={COLORS.textTertiary} />
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>
                    {tip.duration_minutes} min
                  </Text>
                </View>
              ) : null}
              <View
                style={{
                  backgroundColor: difficultyColor + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: difficultyColor }}>
                  {difficultyLabel}
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: textColor,
              letterSpacing: -0.2,
            }}
          >
            {tip.title}
          </Text>

          <Text
            style={{ fontSize: 14, color: textSecondary, lineHeight: 20 }}
            numberOfLines={2}
          >
            {tip.description}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                Read more
              </Text>
              <ChevronRight size={14} color={COLORS.primary} />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </AnimatedListItem>
  );
}

export default function WellnessScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  const [tips, setTips] = useState<AnxietyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchTips = useCallback(async () => {
    console.log('[Wellness] Fetching anxiety tips, category:', selectedCategory);
    let query = supabase.from('anxiety_tips').select('*').order('created_at', { ascending: true });
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[Wellness] Error fetching tips:', error.message);
    } else {
      console.log('[Wellness] Fetched', data?.length ?? 0, 'tips');
      setTips(data ?? []);
    }
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    setLoading(true);
    fetchTips();
  }, [fetchTips]);

  const handleRefresh = async () => {
    console.log('[Wellness] Refreshing tips...');
    setRefreshing(true);
    await fetchTips();
    setRefreshing(false);
  };

  const handleCategoryPress = (key: string) => {
    console.log('[Wellness] Category filter pressed:', key);
    setSelectedCategory(key);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen options={{ title: 'Wellness' }} />
      <FlatList
        data={loading ? [] : tips}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <TipCard tip={item} index={index} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            {/* Intro card */}
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 20,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Leaf size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 }}>
                  Pet Wellness Tips
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18, marginTop: 2 }}>
                  Help your pet feel calm and happy every day
                </Text>
              </View>
            </View>

            {/* Category filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 4 }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const catColor = CATEGORY_COLORS[cat.key] ?? COLORS.primary;
                return (
                  <AnimatedPressable key={cat.key} onPress={() => handleCategoryPress(cat.key)}>
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isSelected ? catColor : (isDark ? COLORS.dark.surface : COLORS.surface),
                        borderWidth: 1,
                        borderColor: isSelected ? catColor : (isDark ? COLORS.dark.border : COLORS.border),
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: isSelected ? '#FFFFFF' : (isDark ? COLORS.dark.textSecondary : COLORS.textSecondary),
                        }}
                      >
                        {cat.label}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 0 }}>
              {[1, 2, 3, 4].map((i) => <TipCardSkeleton key={i} />)}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: COLORS.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Heart size={28} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, marginBottom: 6 }}>
                No tips found
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? COLORS.dark.textSecondary : COLORS.textSecondary, textAlign: 'center' }}>
                Try selecting a different category
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
