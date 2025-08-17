import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthWrapper({ 
  children, 
  requireAuth = false, 
  redirectTo = '/signin' 
}: AuthWrapperProps) {
  const { isAuthenticated, isLoading, isInitialized, isAuthRestoring } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if authentication has been initialized and we're not in the middle of restoring
    if (isInitialized && !isAuthRestoring && requireAuth && !isAuthenticated) {
      console.log('🔄 Redirecting to login - authentication required but user not authenticated');
      // Type assertion to fix TypeScript error
      router.replace(redirectTo as any);
    }
  }, [isAuthenticated, isLoading, isInitialized, isAuthRestoring, requireAuth, redirectTo, router]);

  // Show loading while authentication is being restored or initialized
  if (isLoading || isAuthRestoring || !isInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background.primary 
      }}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: colors.text.secondary,
          textAlign: 'center'
        }}>
          {isAuthRestoring ? 'Restoring session...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // If authentication is required and user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
}
