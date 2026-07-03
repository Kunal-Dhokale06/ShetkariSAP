import '@/i18n';
import React, { useEffect } from 'react';
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
