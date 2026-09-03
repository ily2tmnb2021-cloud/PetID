import { Stack } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export default function WellnessLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerLargeTitle: true,
        headerBlurEffect: 'systemMaterial',
        headerBackButtonDisplayMode: 'minimal',
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerTintColor: COLORS.primary,
        headerLargeTitleStyle: {
          color: isDark ? COLORS.dark.text : COLORS.text,
          fontWeight: '800',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Wellness',
        }}
      />
    </Stack>
  );
}
