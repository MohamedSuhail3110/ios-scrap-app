import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, Platform } from 'react-native';
import { Home, ShoppingBag, DollarSign, Settings, LogIn } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { t = (key: string) => key } = useTranslation();
  const { isAuthenticated = false } = useAuth() || {};
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#28a745',
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          height: Platform.OS === 'android' ? 98 : 85,
          paddingBottom: Platform.OS === 'android' ? 12 : 8,
          paddingTop: Platform.OS === 'android' ? 10 : 8,
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
          tabBarLabel: t('common.sell'),
          tabBarIcon: ({ size, color }) => (
            <DollarSign size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        listeners={{
          tabPress: (e) => {
            // Prevent navigating to settings page if not authenticated
            if (!isAuthenticated) {
              e.preventDefault();
              router.push('/signin');
            }
          },
        }}
        options={{
          title: isAuthenticated ? t('common.settings') : t('common.login'),
          tabBarIcon: ({ size, color }) => (
            isAuthenticated ? <Settings size={size} color={color} /> : <LogIn size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}