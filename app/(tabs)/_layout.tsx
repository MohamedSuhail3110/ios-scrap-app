import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ShoppingBag, DollarSign, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/colors';
import AuthWrapper from '@/components/common/AuthWrapper';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <AuthWrapper requireAuth={true}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#28a745',
          tabBarInactiveTintColor: colors.gray[500],
          tabBarStyle: {
            backgroundColor: colors.background.primary,
            borderTopWidth: 1,
            borderTopColor: colors.gray[200],
            height: 85,
            paddingBottom: 8,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('common.home'),
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="buy"
          options={{
            title: t('common.buy'),
            tabBarIcon: ({ size, color }) => (
              <ShoppingBag size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sell"
          options={{
            title: t('common.sell'),
            tabBarIcon: ({ size, color }) => (
              <DollarSign size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('common.settings'),
            tabBarIcon: ({ size, color }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AuthWrapper>
  );
}