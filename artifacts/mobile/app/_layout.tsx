import '@/i18n';
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import i18n from '@/i18n';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutNav() {
  const { profile, isLoaded, verifiedPhone } = useApp();
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuth = pathname.startsWith('/auth');
    if (!profile && !inAuth) {
      router.replace(verifiedPhone ? '/auth/setup' : '/auth/phone');
    } else if (profile && inAuth) {
      router.replace('/(tabs)');
    }
  }, [profile, isLoaded, pathname, verifiedPhone]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function requestLocationPermission() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          i18n.t('weather.locationPermissionTitle'),
          i18n.t('weather.locationPermissionMessage'),
          [{ text: i18n.t('common.ok') }],
        );
      }
    }

    requestLocationPermission().catch(() => {
      // fail silently; weather hook will fallback to profile location
    });
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.primaryForeground,
        headerBackTitle: '',
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/phone" options={{ headerShown: false }} />
      <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
      <Stack.Screen name="auth/setup" options={{ headerShown: false }} />
      <Stack.Screen
        name="crops/add"
        options={{ title: i18n.t('crop.add') }}
      />
      <Stack.Screen
        name="crops/[id]"
        options={{ title: i18n.t('crop.details') }}
      />
      <Stack.Screen
        name="expenses/add"
        options={{ title: i18n.t('expense.add') }}
      />
      <Stack.Screen
        name="sales/add"
        options={{ title: i18n.t('sale.add') }}
      />
      <Stack.Screen
        name="scan"
        options={{ title: i18n.t('tools.receiptScanner') }}
      />
      <Stack.Screen
        name="budget"
        options={{ title: i18n.t('tools.budgetPlanner') }}
      />
      <Stack.Screen
        name="reports/create"
        options={{ title: i18n.t('tools.reportGenerator') }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
