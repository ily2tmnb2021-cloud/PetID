import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS } from '@/constants/Colors';

const TABS = [
  {
    name: '(home)',
    route: '/(tabs)/(home)' as const,
    icon: 'pets' as const,
    label: 'My Pets',
  },
  {
    name: 'identify',
    route: '/(tabs)/identify' as const,
    icon: 'photo-camera' as const,
    label: 'Identify',
  },
  {
    name: 'wellness',
    route: '/(tabs)/wellness' as const,
    icon: 'favorite' as const,
    label: 'Wellness',
  },
  {
    name: 'schedule',
    route: '/(tabs)/schedule' as const,
    icon: 'event' as const,
    label: 'Schedule',
  },
  {
    name: 'map',
    route: '/(tabs)/map' as const,
    icon: 'map' as const,
    label: 'Map',
  },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? COLORS.dark.background : COLORS.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="identify" />
        <Stack.Screen name="wellness" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="map" />
      </Stack>
      <FloatingTabBar
        tabs={TABS}
        containerWidth={360}
        borderRadius={35}
        bottomMargin={20}
      />
    </View>
  );
}
