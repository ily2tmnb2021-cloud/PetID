import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/utils/supabase';
import { COLORS } from '@/constants/Colors';

const DevErrorBoundary = __DEV__
  ? ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'SpaceMono-Bold': require('../assets/fonts/SpaceMono-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize anonymous auth session
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] Checking for existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[Auth] No session found, signing in anonymously...');
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('[Auth] Anonymous sign-in error:', error.message);
        } else {
          console.log('[Auth] Anonymous session created:', data.session?.user?.id);
        }
      } else {
        console.log('[Auth] Existing session found:', session.user?.id);
      }
    };
    initAuth();
  }, []);



  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.surface,
      text: COLORS.text,
      border: COLORS.border,
      notification: COLORS.danger,
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: COLORS.primary,
      background: COLORS.dark.background,
      card: COLORS.dark.surface,
      text: COLORS.dark.text,
      border: COLORS.dark.border,
      notification: COLORS.danger,
    },
  };

  if (!loaded) return null;

  return (
    <DevErrorBoundary>
      <StatusBar style="auto" animated />
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
        <SafeAreaProvider>
          <WidgetProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="pet/add"
                  options={{
                    presentation: 'formSheet',
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.85, 1.0],
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="pet/[id]"
                  options={{
                    headerTransparent: true,
                    headerBackButtonDisplayMode: 'minimal',
                    headerTitle: '',
                  }}
                />
                <Stack.Screen
                  name="pet/edit/[id]"
                  options={{
                    presentation: 'formSheet',
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.85, 1.0],
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="appointment/add"
                  options={{
                    presentation: 'formSheet',
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.85, 1.0],
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="appointment/[id]"
                  options={{
                    headerTransparent: true,
                    headerLargeTitle: false,
                    headerBackButtonDisplayMode: 'minimal',
                    headerTitle: 'Appointment',
                  }}
                />
                <Stack.Screen
                  name="tip/[id]"
                  options={{
                    headerTransparent: true,
                    headerLargeTitle: false,
                    headerBackButtonDisplayMode: 'minimal',
                    headerTitle: '',
                  }}
                />
                <Stack.Screen
                  name="park/[id]"
                  options={{
                    headerTransparent: true,
                    headerLargeTitle: false,
                    headerBackButtonDisplayMode: 'minimal',
                    headerTitle: '',
                  }}
                />
              </Stack>
              <SystemBars style="auto" />
            </GestureHandlerRootView>
          </WidgetProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </DevErrorBoundary>
  );
}
