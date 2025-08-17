import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '@/store/authSlice';
import { RootState } from '@/store';
import { colors } from '@/constants/colors';
import { iraqiGovernorates } from '@/constants/data';
import CustomButton from '@/components/common/CustomButton';
import KeyboardAvoidingWrapper from '@/components/common/KeyboardAvoidingWrapper';
import { useAuth } from '@/hooks/useAuth';

const validationSchema = Yup.object({
  fullName: Yup.string().required('Full name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  governorate: Yup.string().required('City is required'),
  district: Yup.string().required('District is required')
});

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState(user?.governorate || '');

  const initialValues = {
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    governorate: user?.governorate || '',
    district: user?.district || ''
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = (values: any) => {
    if (user) {
      // Update the user profile in the store
      dispatch(updateUserProfile({
        fullName: values.fullName,
        phone: values.phone,
        governorate: values.governorate,
        district: values.district
      }));
      
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert('Change Avatar', 'Avatar change functionality will be implemented');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.editProfile')}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingWrapper>
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: user?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150' }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraButton} onPress={handleChangeAvatar}>
                <Camera size={20} color={colors.text.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.changeAvatarText}>{t('settings.changeAvatar')}</Text>
          </View>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSave}
          >
            {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View style={styles.form}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t('auth.fullName')} *</Text>
                  <TextInput
                    style={[styles.input, errors.fullName && touched.fullName && styles.inputError]}
                    value={values.fullName}
                    onChangeText={handleChange('fullName')}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && touched.fullName && (
                    <Text style={styles.errorText}>{errors.fullName}</Text>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t('auth.email')} *</Text>
                  <TextInput
                    style={[styles.input, errors.email && touched.email && styles.inputError]}
                    value={values.email}
                    onChangeText={handleChange('email')}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && touched.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t('auth.phone')} *</Text>
                  <TextInput
                    style={[styles.input, errors.phone && touched.phone && styles.inputError]}
                    value={values.phone}
                    onChangeText={handleChange('phone')}
                    placeholder="+964 XXX XXX XXXX"
                    keyboardType="phone-pad"
                  />
                  {errors.phone && touched.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t('auth.city')} *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={String(values.governorate || '')}
                      onValueChange={(value) => {
                        setFieldValue('governorate', value);
                        setSelectedCity(value);
                        setFieldValue('district', '');
                      }}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select city" value="" />
                      {iraqiGovernorates.map((gov) => (
                        <Picker.Item key={gov.name} label={gov.name} value={gov.name} />
                      ))}
                    </Picker>
                  </View>
                  {errors.governorate && touched.governorate && (
                    <Text style={styles.errorText}>{errors.governorate}</Text>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t('auth.district')} *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={String(values.district || '')}
                      onValueChange={handleChange('district')}
                      style={styles.picker}
                      enabled={!!selectedCity}
                    >
                      <Picker.Item label="Select district" value="" />
                      {selectedCity && iraqiGovernorates
                        .find(gov => gov.name === selectedCity)
                        ?.districts.map((district) => (
                          <Picker.Item key={district.name} label={district.name} value={district.name} />
                        ))}
                    </Picker>
                  </View>
                  {errors.district && touched.district && (
                    <Text style={styles.errorText}>{errors.district}</Text>
                  )}
                </View>

                <View style={styles.buttonContainer}>
                  <CustomButton
                    title={t('settings.updateProfile')}
                    variant="success"
                    size="large"
                    onPress={() => handleSubmit()}
                  />
                </View>
              </View>
            )}
          </Formik>
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200]
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary
  },
  placeholder: {
    width: 40
  },
  content: {
    padding: 20,
    paddingBottom: 120
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary.green,
    borderRadius: 20,
    padding: 10
  },
  changeAvatarText: {
    fontSize: 14,
    color: colors.primary.green,
    fontWeight: '600'
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
    borderColor: colors.error
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 12,
    backgroundColor: colors.background.primary
  },
  picker: {
    height: 50
  },
  errorText: {
    fontSize: 12,
    color: colors.error
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 40
  }
});