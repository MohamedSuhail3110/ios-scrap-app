import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '@/store/authSlice';
import { RootState } from '@/store';
import { colors } from '@/constants/colors';
import { governorates as iraqGovernorates, districtsByGovernorate } from '@/lib/iraqLocations';
import Toast from 'react-native-toast-message';
import { signup as apiSignup } from '@/lib/api';
import KeyboardAvoidingWrapper from '@/components/common/KeyboardAvoidingWrapper';
import AppHeader from '@/components/common/AppHeader';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

// Validation schema will be created inside the component to access translations

export default function SignupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized } = useAuth();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

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
    fullName: Yup.string().required(t('auth.fullNameRequired')),
    email: Yup.string().email(t('auth.invalidEmailFormat')).required(t('auth.emailRequired')),
    phone: Yup.string()
      .matches(/^\d{11}$/g, t('auth.phoneMustBeDigits'))
      .required(t('auth.phoneRequired')),
    governorate: Yup.string().required(t('auth.governorateRequired')),
    district: Yup.string().required(t('auth.districtRequired')),
    password: Yup.string().min(6, t('auth.passwordTooShort')).required(t('auth.passwordRequired'))
  });

  const initialValues = {
    fullName: '',
    email: '',
    phone: '',
    governorate: '',
    district: '',
    password: ''
  };

  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (values: any) => {
    dispatch(setLoading(true));
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        governorate: values.governorate,
        city: values.district, // API expects 'city' not 'district'
        password: values.password
      };
      const res = await apiSignup(payload);
      if (res) {
        Toast.show({ type: 'success', text1: t('auth.accountCreated') || 'Account Created Successfully!' });
        router.replace('/signin');
      } else {
        Toast.show({ 
          type: 'error', 
          text1: t('auth.signupFailed') || 'Signup Failed', 
          text2: t('auth.pleaseTryAgain') || 'Please try again later.' 
        });
      }
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err?.response?.status === 400) {
        errorMessage = 'Please check your input data and try again.';
      } else if (err?.response?.status === 409) {
        errorMessage = 'An account with this email already exists. Please use a different email.';
      } else if (err?.response?.status === 422) {
        errorMessage = 'Invalid data provided. Please check your information.';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      Toast.show({ 
        type: 'error', 
        text1: t('common.error') || 'Signup Error', 
        text2: errorMessage 
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSignIn = () => {
    router.push('/signin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <KeyboardAvoidingWrapper>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.headerGradient}>
              <Text style={styles.headerTitle}>{t('auth.createAccount')}</Text>
              <Text style={styles.headerSubtitle}>{t('auth.joinMarketplace')}</Text>
            </View>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSignup}
            >
              {({ handleChange, handleSubmit, values, errors, touched, setFieldTouched, setFieldValue }) => (
                <View style={styles.form}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{t('auth.fullName')} *</Text>
                    <TextInput
                      style={[styles.input, errors.fullName && touched.fullName && styles.inputError]}
                      value={values.fullName}
                      onChangeText={handleChange('fullName')}
                      onBlur={() => setFieldTouched('fullName', true)}
                      placeholder={t('auth.enterYourFullName')}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{t('auth.email')} *</Text>
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
                    <Text style={styles.label}>{t('auth.phone')} *</Text>
                    <TextInput
                      style={[styles.input, errors.phone && touched.phone && styles.inputError]}
                      value={values.phone}
                      onChangeText={handleChange('phone')}
                      onBlur={() => setFieldTouched('phone', true)}
                      placeholder={t('auth.enterYourPhone')}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{t('auth.governorate')} *</Text>
                    <Picker
                      selectedValue={values.governorate}
                      onValueChange={(value) => {
                        setFieldValue('governorate', value);
                        setFieldValue('district', ''); // Reset district when governorate changes
                      }}
                      style={styles.picker}
                      onBlur={() => setFieldTouched('governorate', true)}
                    >
                      <Picker.Item label={t('auth.selectGovernorate') || 'Select Governorate'} value="" />
                      {iraqGovernorates.map((gov) => (
                        <Picker.Item key={gov} label={gov} value={gov} />
                      ))}
                    </Picker>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{t('auth.district')} *</Text>
                    <Picker
                      selectedValue={values.district}
                      onValueChange={(value) => setFieldValue('district', value)}
                      style={styles.picker}
                      enabled={!!values.governorate}
                      onBlur={() => setFieldTouched('district', true)}
                    >
                      <Picker.Item label={t('auth.selectDistrict') || 'Select District'} value="" />
                      {values.governorate && districtsByGovernorate[values.governorate]?.map((district) => (
                        <Picker.Item key={district} label={district} value={district} />
                      ))}
                    </Picker>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>{t('auth.password')} *</Text>
                    <TextInput
                      style={[styles.input, errors.password && touched.password && styles.inputError]}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={() => setFieldTouched('password', true)}
                      placeholder={t('auth.enterYourPassword')}
                      secureTextEntry={!showPassword}
                    />
                    <Pressable onPress={() => setShowPassword(prev => !prev)}>
                      <Text style={{ color: colors.primary.green, fontWeight: '600' }}>
                        {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={[styles.signupTouchable, styles.signupButton, isLoading && { opacity: 0.7 }]}
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
                    pointerEvents={isLoading ? 'none' : 'auto'}
                  >
                    <View style={styles.btnContent}>
                      {isLoading ? (
                        <>
                          <ActivityIndicator size="small" color={colors.text.white} />
                          <Text style={styles.btnText}>{t('common.loading')}</Text>
                        </>
                      ) : (
                        <Text style={styles.btnText}>{t('auth.createAccount')}</Text>
                      )}
                    </View>
                  </Pressable>

                  <Pressable style={styles.signInPrompt} onPress={handleSignIn}>
                    <Text style={styles.signInText}>{t('auth.alreadyHaveAccount')} {t('auth.signInHere')}</Text>
                  </Pressable>
                </View>
              )}
            </Formik>
          </View>
        </View>
      </KeyboardAvoidingWrapper>
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary.green} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 120
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    paddingBottom: 24,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden'
  },
  headerGradient: {
    backgroundColor: colors.primary.blue,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 6
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0F2FF'
  },
  form: {
    paddingHorizontal: 20,
    gap: 24
  },
  formIntro: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8
  },
  fieldContainer: {
    gap: 10
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: colors.background.primary,
    minHeight: 52
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    minHeight: 52
  },
  picker: {
    height: 52
  },
  // Remove errorText style since we're using toast now
  // errorText: {
  //   fontSize: 12,
  //   color: colors.error,
  //   marginTop: 4,
  //   marginLeft: 4
  // },
  signupButton: {
    marginTop: 8
  },
  signupTouchable: {
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
  signInPrompt: {
    alignItems: 'center',
    marginTop: 16
  },
  signInText: {
    fontSize: 16,
    color: colors.primary.green,
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
  }
});