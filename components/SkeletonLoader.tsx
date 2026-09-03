import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

interface SkeletonLineProps {
  width: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLine({ width, height = 14, borderRadius, style }: SkeletonLineProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const bg = isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary;

  return (
    <View style={[{ width: width as number, height, borderRadius: borderRadius ?? height / 2, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: bg,
          opacity,
        }}
      />
    </View>
  );
}

export function PetCardSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      <SkeletonLine width={64} height={64} borderRadius={32} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonLine width="60%" height={18} />
        <SkeletonLine width="40%" height={13} />
        <SkeletonLine width="50%" height={13} />
      </View>
    </View>
  );
}

export function TipCardSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SkeletonLine width="30%" height={12} />
        <SkeletonLine width="20%" height={12} />
      </View>
      <SkeletonLine width="80%" height={18} />
      <SkeletonLine width="100%" height={13} />
      <SkeletonLine width="70%" height={13} />
    </View>
  );
}

export function AppointmentCardSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      <SkeletonLine width="50%" height={13} />
      <SkeletonLine width="70%" height={18} />
      <SkeletonLine width="40%" height={13} />
    </View>
  );
}
