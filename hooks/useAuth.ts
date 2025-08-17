import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '@/store';
import { restoreAuth, clearUser, setToken, setInitialized, setLoading } from '@/store/authSlice';
import { User } from '@/types/product';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, token, isLoading, isInitialized } = useSelector((state: RootState) => state.auth);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore authentication state from storage on app start
  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        setIsRestoring(true);
        dispatch(setLoading(true));
        
        // Get stored authentication data
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          try {
            const userData: User = JSON.parse(storedUser);
            // Validate that we have valid user data
            if (userData && userData._id && userData.email) {
              dispatch(restoreAuth({ user: userData, token: storedToken }));
              console.log('✅ Authentication restored successfully');
            } else {
              console.warn('⚠️ Invalid user data in storage, clearing...');
              await AsyncStorage.multiRemove(['token', 'user']);
              dispatch(setInitialized(true));
            }
          } catch (parseError) {
            console.error('❌ Failed to parse stored user data:', parseError);
            await AsyncStorage.multiRemove(['token', 'user']);
            dispatch(setInitialized(true));
          }
        } else {
          console.log('ℹ️ No stored authentication data found');
          dispatch(setInitialized(true));
        }
      } catch (error) {
        console.error('❌ Failed to restore auth state:', error);
        // Clear corrupted data
        try {
          await AsyncStorage.multiRemove(['token', 'user']);
        } catch (clearError) {
          console.error('❌ Failed to clear corrupted data:', clearError);
        }
        dispatch(setInitialized(true));
      } finally {
        setIsRestoring(false);
        dispatch(setLoading(false));
      }
    };

    // Only restore if not already initialized
    if (!isInitialized) {
      restoreAuthState();
    } else {
      setIsRestoring(false);
    }
  }, [dispatch, isInitialized]);

  // Save authentication state to storage when it changes
  useEffect(() => {
    const saveAuthState = async () => {
      // Only save if we're not in the middle of restoring
      if (isRestoring) return;
      
      try {
        if (user && token) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
          await AsyncStorage.setItem('token', token);
          console.log('💾 Authentication state saved to storage');
        } else if (!user && !token) {
          // Only clear storage if both user and token are null (logout case)
          await AsyncStorage.multiRemove(['token', 'user']);
          console.log('🗑️ Authentication storage cleared');
        }
      } catch (error) {
        console.error('❌ Failed to save auth state:', error);
      }
    };

    saveAuthState();
  }, [user, token, isRestoring]);

  const login = async (userData: User, userToken: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(setToken(userToken));
      dispatch(restoreAuth({ user: userData, token: userToken }));
      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user...');
      await AsyncStorage.multiRemove(['token', 'user']);
      dispatch(clearUser());
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Failed to clear auth storage:', error);
      // Still clear the state even if storage clearing fails
      dispatch(clearUser());
    }
  };

  const updateProfile = (profileData: Partial<User>) => {
    // This will be handled by the authSlice updateUserProfile action
    // The effect above will automatically save the updated user data
  };

  // Check if authentication is still being restored
  const isAuthRestoring = isRestoring || !isInitialized;

  return {
    user,
    isAuthenticated,
    token,
    isLoading: isLoading || isAuthRestoring,
    isInitialized,
    isAuthRestoring,
    login,
    logout,
    updateProfile
  };
};
