import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Pressable,
  Platform,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '@/store/authSlice';
import { RootState } from '@/store';
import { login as apiLogin } from '@/lib/api';
import { User } from '@/types/product';
import { colors } from '@/constants/colors';
import CustomButton from '@/components/common/CustomButton';
import KeyboardAvoidingWrapper from '@/components/common/KeyboardAvoidingWrapper';
import AppHeader from '@/components/common/AppHeader';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import TermsAndConditionsModal from '@/components/common/TermsAndConditionsModal';

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { login, isAuthenticated, isInitialized } = useAuth();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const [isModalVisible, setModalVisible] = useState(false);

  // Redirect authenticated users to main app
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Don't render if user is already authenticated
  if (isInitialized && isAuthenticated) {
    return null;
  }

  const validationSchema = Yup.object({
    email: Yup.string().email(t('auth.invalidEmailFormat')).required(t('auth.emailRequired')),
    password: Yup.string().min(6, t('auth.passwordTooShort')).required(t('auth.passwordRequired'))
  });

  const mapServerUserToMobileUser = (u: any): User => ({
    _id: String(u?._id || ''),
    fullName: u?.fullName || u?.name || '',
    email: u?.email || '',
    phone: u?.phone || '',
    governorate: u?.governorate || '',
    district: u?.district || '',
    avatar: u?.avatar,
    isVerified: Boolean(u?.isVerified),
    rating: typeof u?.rating === 'number' ? u.rating : 0,
    totalSales: typeof u?.totalSales === 'number' ? u.totalSales : 0,
    createdAt: u?.createdAt || new Date().toISOString(),
    updatedAt: u?.updatedAt || new Date().toISOString()
  });

  const handleSignIn = async (values: { email: string; password: string }) => {
    dispatch(setLoading(true));
    try {
      // Admin bypass (to match web LoginPage.tsx behavior)
      if (
        values.email === 'scrapadmin@gmail.com' &&
        values.password === '12345678'
      ) {
        const adminUser: User = {
          _id: 'admin',
          fullName: 'Admin',
          email: values.email,
          phone: '',
          governorate: '',
          district: '',
          avatar: undefined,
          isVerified: true,
          rating: 0,
          totalSales: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await login(adminUser, 'admin-token');
        Toast.show({ type: 'success', text1: 'Welcome, Admin!' });
        router.replace('/(tabs)');
        return;
      }

      // Real backend login
      const res = await apiLogin({ email: values.email, password: values.password });
      if (res?.token && res?.user) {
        const mappedUser = mapServerUserToMobileUser(res.user);
        await login(mappedUser, String(res.token));
        Toast.show({ type: 'success', text1: 'Welcome!' });
        router.replace('/(tabs)');
      } else {
        const errorMessage = res?.message || 'Invalid email or password. Please try again.';
        Toast.show({ 
          type: 'error', 
          text1: 'Login Failed', 
          text2: errorMessage 
        });
      }
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err?.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err?.response?.status === 404) {
        errorMessage = 'User not found. Please check your email address.';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      Toast.show({ 
        type: 'error', 
        text1: 'Login Error', 
        text2: errorMessage 
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateAccount = () => {
    router.push('/signup');
  };

  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <KeyboardAvoidingWrapper scrollEnabled={false}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Pressable style={styles.createAccountButton} onPress={handleCreateAccount}>
                  <Text style={styles.createAccountText}>{t('auth.createAccount')}</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                <View style={styles.formHeader}>
                  <Text style={styles.title}>{t('auth.signIn')}</Text>
                  <Text style={styles.subtitle}>{t('auth.welcomeBackMessage')}</Text>
                </View>

                <Formik
                  initialValues={{ email: '', password: '' }}
                  validationSchema={validationSchema}
                  onSubmit={handleSignIn}
                >
                  {({ handleChange, handleSubmit, values, errors, touched, setFieldTouched }) => (
                    <View style={styles.form}>
                      <View style={styles.fieldContainer}>
                        <Text style={styles.label}>{t('auth.email')}</Text>
                        <TextInput
                          style={[styles.input, errors.email && touched.email && styles.inputError]}
                          value={values.email}
                          onChangeText={handleChange('email')}
                          onBlur={() => setFieldTouched('email', true)}
                          placeholder={t('auth.enterYourEmail')}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      <View style={styles.fieldContainer}>
                        <Text style={styles.label}>{t('auth.password')}</Text>
                        <TextInput
                          style={[styles.input, errors.password && touched.password && styles.inputError]}
                          value={values.password}
                          onChangeText={handleChange('password')}
                          onBlur={() => setFieldTouched('password', true)}
                          placeholder={t('auth.enterYourPassword')}
                          secureTextEntry
                        />
                      </View>

                      <Pressable
                        style={[styles.signInTouchable, styles.signInButton, isLoading && { opacity: 0.7 }]}
                        onPress={() => { 
                          if (!isLoading) {
                            // Check for validation errors and show toast if any
                            if (Object.keys(errors).length > 0) {
                              const firstError = Object.values(errors)[0];
                              Toast.show({ 
                                type: 'error', 
                                text1: t('common.validationError') || 'Validation Error', 
                                text2: firstError 
                              });
                              return;
                            }
                            handleSubmit(); 
                          }
                        }}
                        disabled={isLoading}
                      >
                        <View style={styles.btnContent}>
                          {isLoading ? (
                            <>
                              <ActivityIndicator size="small" color={colors.text.white} />
                              <Text style={styles.btnText}>{t('common.loading')}</Text>
                            </>
                          ) : (
                            <Text style={styles.btnText}>{t('auth.signIn')}</Text>
                          )}
                        </View>
                      </Pressable>
                    </View>
                  )}
                </Formik>
                <Pressable style={styles.termsContainer} onPress={() => setModalVisible(true)}>
                  <Text style={styles.termsText}>
                    <Text style={styles.termsLink}>{t('auth.termsAndConditions')}</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingWrapper>
        </ScrollView>
      </KeyboardAvoidingView>
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary.green} />
        </View>
      )}
       <TermsAndConditionsModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 32
  },
  createAccountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  createAccountText: {
    fontSize: 16,
    color: colors.primary.green,
    fontWeight: '600'
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    // Web compatibility
    ...(Platform.OS === 'web' && {
      boxShadow: `0 4px 12px ${colors.gray[900]}1A`
    })
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center'
  },
  form: {
    gap: 20
  },
  fieldContainer: {
    gap: 8
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.background.primary
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2
  },
  // Remove errorText style since we're using toast now
  // errorText: {
  //   color: colors.error,
  //   fontSize: 12,
  //   marginTop: 4,
  //   marginLeft: 4
  // },
  signInButton: {
    marginTop: 20
  },
  signInTouchable: {
    backgroundColor: colors.primary.green,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)'
  },
  termsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  termsText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.primary.green,
    textDecorationLine: 'underline',
  },
});