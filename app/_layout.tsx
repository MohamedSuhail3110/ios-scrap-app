import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { store } from '@/store';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import i18n from '@/i18n';
import '@/i18n';
import AuthWrapper from '@/components/common/AuthWrapper';

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="sell" />
      <Stack.Screen name="product-details" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="my-ads" />
      <Stack.Screen name="purchase-history" />
      <Stack.Screen name="my-addresses" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <AuthWrapper requireAuth={false}>
          <RootLayoutNav />
          <StatusBar style="auto" />
          <Toast />
        </AuthWrapper>
      </I18nextProvider>
    </Provider>
  );
}