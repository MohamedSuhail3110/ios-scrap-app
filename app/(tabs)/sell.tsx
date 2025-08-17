import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { createSellItem, testBackendConnection } from '@/lib/api';
import { colors } from '@/constants/colors';
import { governorates, districtsByGovernorate, citiesByDistrict } from '@/lib/iraqLocations';
import { getSortedBrands, loadBrandCatalog, BrandToModels } from '@/lib/carCatalog';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

const SellPage = () => {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();
  const [backendReady, setBackendReady] = useState(true);
  const tabBarHeight = 85; // Fixed tab bar height instead of using the hook
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getInitialFormData = useMemo(() => {
    return () => ({
    partName: '',
    brand: '',
      category: '',
    model: '',
    year: '',
    price: '',
      state: '',
      district: '',
      city: '',
      image: null as any,
      condition: '',
    description: '',
      stockCount: '1',
      sellerName: user?.fullName || '',
      sellerPhone: user?.phone || '',
      sellerCity: user?.governorate || '',
      oem: false,
      specifications: [{ key: '', value: '' }],
      features: ['']
    });
  }, [user]);
  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [brandMap, setBrandMap] = useState<BrandToModels>({});
  const [brandList, setBrandList] = useState<string[]>([]);
  const [modelList, setModelList] = useState<string[]>([]);

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.replace('/signin');
      return;
    }

    // Initialize form data with user information
    setFormData(prev => ({
      ...prev,
      sellerName: user.fullName || '',
      sellerPhone: user.phone || '',
      sellerCity: user.governorate || '',
    }));
  }, [user, router]);

  // Load brands/models
  useEffect(() => {
    (async () => {
      try {
        const map = await loadBrandCatalog();
        setBrandMap(map);
        setBrandList(getSortedBrands(map));
      } catch (e) {
        console.log('Failed to load brand catalog, using fallback');
      }
    })();
  }, []);

  // Check backend connectivity
  useEffect(() => {
    (async () => {
      try {
        await testBackendConnection();
        setBackendReady(true);
      } catch (e) {
        setBackendReady(false);
      }
    })();
  }, []);

  // Update model list when brand changes
  useEffect(() => {
    const models = brandMap[formData.brand] || [];
    setModelList(models);
  }, [formData.brand, brandMap]);

  const carBrands = [
    t('sell.brands.toyota'), t('sell.brands.nissan'), t('sell.brands.hyundai'), 
    t('sell.brands.bmw'), t('sell.brands.mercedesBenz'), t('sell.brands.audi'), 
    t('sell.brands.volkswagen'), t('sell.brands.ford'), t('sell.brands.chevrolet'), 
    t('sell.brands.honda')
  ];

  const iraqStates = governorates;
  const iraqDistrictsByState: Record<string, string[]> = districtsByGovernorate;
  const iraqCitiesByDistrict: Record<string, string[]> = citiesByDistrict;

  const categoryList = [
    { value: t('sell.categories.engineDrivetrain'), label: t('sell.categories.engineDrivetrainDesc') },
    { value: t('sell.categories.suspensionSteering'), label: t('sell.categories.suspensionSteeringDesc') },
    { value: t('sell.categories.brakes'), label: t('sell.categories.brakesDesc') },
    { value: t('sell.categories.bodyParts'), label: t('sell.categories.bodyPartsDesc') },
    { value: t('sell.categories.lightsElectrical'), label: t('sell.categories.lightsElectricalDesc') },
    { value: t('sell.categories.tyresWheels'), label: t('sell.categories.tyresWheelsDesc') },
    { value: t('sell.categories.interiorParts'), label: t('sell.categories.interiorPartsDesc') },
    { value: t('sell.categories.exteriorAccessories'), label: t('sell.categories.exteriorAccessoriesDesc') },
    { value: t('sell.categories.fluidsLubricants'), label: t('sell.categories.fluidsLubricantsDesc') },
    { value: t('sell.categories.toolsEquipment'), label: t('sell.categories.toolsEquipmentDesc') },
    { value: t('sell.categories.performanceMods'), label: t('sell.categories.performanceModsDesc') },
    { value: t('sell.categories.byVehicleBrand'), label: t('sell.categories.byVehicleBrand') }
  ];

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'state' ? { district: '', city: '' } : {}),
      ...(name === 'district' ? { city: '' } : {}),
      ...(name === 'brand' && { model: '' })
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTextAreaChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('sell.permissionPhotos'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, image: result.assets[0] }));
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: '' }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('sell.imagePickFailed'));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.price) newErrors.price = t('sell.salePriceRequired');
    if (!formData.brand) newErrors.brand = t('sell.carBrandRequired');
    if (!formData.model) newErrors.model = t('sell.carModelRequired');
    if (!formData.year) newErrors.year = t('sell.yearRequired');
    if (!formData.state) newErrors.state = t('sell.selectState');
    if (!formData.district) newErrors.district = t('sell.selectDistrict');
    if (!formData.image) newErrors.image = t('sell.imageRequired');
    if (!formData.category) newErrors.category = t('sell.categoryRequired');
    if (!formData.sellerName) newErrors.sellerName = t('sell.sellerName') + ' ' + t('common.error');
    if (!formData.sellerPhone) newErrors.sellerPhone = t('sell.sellerPhone') + ' ' + t('common.error');
    if (!formData.sellerCity) newErrors.sellerCity = t('sell.sellerCity') + ' ' + t('common.error');

    // Additional validation
    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = t('sell.priceInvalid');
    }
    
    if (formData.year && (Number(formData.year) < 1900 || Number(formData.year) > 2025)) {
      newErrors.year = t('sell.yearRangeError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!formData.image) {
      Alert.alert(t('common.error'), t('sell.imageRequired'));
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      Alert.alert(t('common.error'), t('common.login'));
      setIsSubmitting(false);
      return;
    }

    if (!backendReady) {
      Alert.alert(t('common.error'), t('sell.backendUnavailable'));
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataObj = new FormData();
      formDataObj.append('userId', user._id);
      formDataObj.append('partName', formData.partName.trim());
      formDataObj.append('brand', formData.brand);
      formDataObj.append('category', formData.category);
      formDataObj.append('model', formData.model);
      formDataObj.append('year', formData.year);
      formDataObj.append('price', formData.price);
      formDataObj.append('state', formData.state);
      formDataObj.append('district', formData.district);
      formDataObj.append('city', formData.sellerCity || formData.city || '');
      // Proper file object for multipart upload
      if ((formData.image as any)?.uri) {
        const asset: any = formData.image as any;
        const fileName = asset.fileName || asset.name || `photo.${(asset.uri?.split('.')?.pop() || 'jpg')}`;
        const mimeType = asset.mimeType || asset.type || 'image/jpeg';
        formDataObj.append('image', {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        } as any);
      } else if (formData.image) {
        formDataObj.append('image', formData.image as any);
      }
      formDataObj.append('condition', (formData.condition || 'used').toLowerCase());
      formDataObj.append('description', formData.description);
      formDataObj.append('stockCount', formData.stockCount || '1');
      formDataObj.append('sellerName', formData.sellerName);
      formDataObj.append('sellerPhone', formData.sellerPhone);
      formDataObj.append('sellerCity', formData.sellerCity);
      formDataObj.append('oem', formData.oem ? 'true' : 'false');
      formDataObj.append('specifications', JSON.stringify(formData.specifications));
      formDataObj.append('features', JSON.stringify(formData.features));

      console.log('Submitting form data:', {
        userId: user._id,
        partName: formData.partName,
        brand: formData.brand,
        category: formData.category,
        model: formData.model,
        year: formData.year,
        price: formData.price,
        state: formData.state,
        district: formData.district,
        city: formData.sellerCity || formData.city,
        condition: formData.condition,
        sellerName: formData.sellerName,
        sellerPhone: formData.sellerPhone,
        sellerCity: formData.sellerCity
      });

      const res = await createSellItem(formDataObj);

      console.log('API Response:', res);

      if (res?.success || res?._id || (typeof res?.message === 'string' && res?.message?.toLowerCase().includes('submitted'))) {
        setFormData(getInitialFormData());
        setErrors({});
        setTimeout(() => {
          router.push('/sell-status');
        }, 300);
      } else {
        Alert.alert(t('common.error'), res?.message || t('sell.submitError'));
      }
    } catch (err: any) {
      console.error('Sell POST error:', err);
      Alert.alert(t('common.error'), t('sell.serverError'));
    }
    setIsSubmitting(false);
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData(prev => ({ ...prev, specifications: newSpecs }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: Math.max(24, tabBarHeight + 24) }}
          showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('sell.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('sell.subtitle')}</Text>
              </View>

        <View style={styles.formContainer}>
          {/* Part Details */}
            <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sell.listPart')}</Text>
              
            <View style={styles.formGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.partName')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.partName}
                  onChangeText={(value) => handleInputChange('partName', value)}
                  placeholder={t('sell.partNamePlaceholder')}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.carBrand')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.brand && styles.inputError]}>
                  <Picker
                    selectedValue={formData.brand}
                    onValueChange={(value) => handleInputChange('brand', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t('sell.selectBrand')} value="" />
                    {(brandList.length ? brandList : carBrands).map((brand) => (
                      <Picker.Item key={brand} label={brand} value={brand} />
                    ))}
                  </Picker>
                </View>
                {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.category')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
                  <Picker
                    selectedValue={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t('sell.category')} value="" />
                    {categoryList.map((cat) => (
                      <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                    ))}
                  </Picker>
                </View>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
                </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.carModel')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.model && styles.inputError]}>
                  <Picker
                    selectedValue={formData.model}
                    onValueChange={(value) => handleInputChange('model', value)}
                    style={styles.picker}
                    enabled={!!formData.brand}
                  >
                    <Picker.Item label={formData.brand ? t('sell.selectModel') : t('sell.selectBrand')} value="" />
                    {modelList.map((model) => (
                      <Picker.Item key={model} label={model} value={model} />
                    ))}
                  </Picker>
                </View>
                {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.selectYear')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.year && styles.inputError]}>
                  <Picker
                    selectedValue={formData.year}
                    onValueChange={(value) => handleInputChange('year', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t('sell.selectYear')} value="" />
                    {Array.from({ length: 2025 - 2000 + 1 }, (_, i) => 2000 + i).map((year) => (
                      <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                    ))}
                  </Picker>
                </View>
                {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.salePrice')} ({t('common.currency')}) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={formData.price}
                  onChangeText={(value) => handleInputChange('price', value)}
                  placeholder={t('sell.pricePlaceholder')}
                  keyboardType="numeric"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.state')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.state && styles.inputError]}>
                  <Picker
                    selectedValue={formData.state}
                    onValueChange={(value) => handleInputChange('state', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t('sell.selectState')} value="" />
                    {iraqStates.map((state) => (
                      <Picker.Item key={state} label={state} value={state} />
                    ))}
                  </Picker>
                </View>
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.district')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.district && styles.inputError]}>
                  <Picker
                    selectedValue={formData.district}
                    onValueChange={(value) => handleInputChange('district', value)}
                    style={styles.picker}
                    enabled={!!formData.state}
                  >
                    <Picker.Item label={formData.state ? t('sell.selectDistrict') : t('sell.selectState')} value="" />
                    {formData.state && iraqDistrictsByState[formData.state]?.map((district) => (
                      <Picker.Item key={district} label={district} value={district} />
                    ))}
                  </Picker>
                </View>
                {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerCity')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.sellerCity && styles.inputError]}>
                  <Picker
                    selectedValue={formData.sellerCity}
                    onValueChange={(value) => handleInputChange('sellerCity', value)}
                    style={styles.picker}
                    enabled={!!formData.district}
                  >
                    <Picker.Item label={formData.district ? t('sell.selectCity') : t('sell.selectDistrict')} value="" />
                    {formData.district && iraqCitiesByDistrict[formData.district]?.map((city) => (
                      <Picker.Item key={city} label={city} value={city} />
                    ))}
                  </Picker>
                </View>
                {errors.sellerCity && <Text style={styles.errorText}>{errors.sellerCity}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerName')} <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.sellerName && styles.inputError]}
                  value={formData.sellerName}
                  onChangeText={(value) => handleInputChange('sellerName', value)}
                  placeholder={t('sell.sellerName')}
                />
                {errors.sellerName && <Text style={styles.errorText}>{errors.sellerName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerPhone')} <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.sellerPhone && styles.inputError]}
                  value={formData.sellerPhone}
                  onChangeText={(value) => handleInputChange('sellerPhone', value)}
                  placeholder={t('sell.sellerPhone')}
                  keyboardType="phone-pad"
                />
                {errors.sellerPhone && <Text style={styles.errorText}>{errors.sellerPhone}</Text>}
                </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.condition')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.condition && styles.inputError]}>
                  <Picker
                    selectedValue={formData.condition}
                    onValueChange={(value) => handleInputChange('condition', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t('sell.condition')} value="" />
                    <Picker.Item label={t('sell.conditionOptions.new')} value="new" />
                    <Picker.Item label={t('sell.conditionOptions.usedVerified')} value="used" />
                    <Picker.Item label={t('sell.conditionOptions.refurbishedLikeNew')} value="refurbished" />
                  </Picker>
                </View>
                {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.stockCount')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stockCount}
                  onChangeText={(value) => handleInputChange('stockCount', value)}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('sell.description')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => handleTextAreaChange('description', value)}
                placeholder={t('sell.description') || ''}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('sell.partImage')} <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={styles.imagePicker} onPress={handleImageChange}>
                <Text style={styles.imagePickerText}>
                  {formData.image ? t('sell.imageSelected') : t('sell.selectImage')}
                </Text>
              </TouchableOpacity>
              {formData.image && (
                <Text style={styles.imageName}>
                  {(formData.image as any)?.fileName || (formData.image as any)?.name || ((formData.image as any)?.uri ? t('sell.imageSelected') : '')}
              </Text>
              )}
              {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sell.specifications')}</Text>
            {formData.specifications.map((spec, idx) => (
              <View key={idx} style={styles.specRow}>
                <TextInput
                  style={[styles.input, styles.specInput]}
                  placeholder={t('sell.specTitle')}
                  value={spec.key}
                  onChangeText={(value) => updateSpecification(idx, 'key', value)}
                />
                <TextInput
                  style={[styles.input, styles.specInput]}
                  placeholder={t('sell.specDescription')}
                  value={spec.value}
                  onChangeText={(value) => updateSpecification(idx, 'value', value)}
                />
                    <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeSpecification(idx)}
                >
                  <Text style={styles.removeButtonText}>{t('common.remove')}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addSpecification}>
              <Text style={styles.addButtonText}>{t('sell.addSpecification')}</Text>
                    </TouchableOpacity>
                  </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sell.features')}</Text>
            {formData.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <TextInput
                  style={[styles.input, styles.featureInput]}
                  placeholder={t('sell.feature')}
                  value={feature}
                  onChangeText={(value) => updateFeature(idx, value)}
                />
                  <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFeature(idx)}
                  >
                  <Text style={styles.removeButtonText}>{t('common.remove')}</Text>
                  </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addFeature}>
              <Text style={styles.addButtonText}>{t('sell.addFeature')}</Text>
            </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color={colors.text.white} />
                <Text style={styles.submitButtonText}>{t('sell.listingPart')}</Text>
                </View>
              ) : (
              <Text style={styles.submitButtonText}>{t('sell.listCarPart')}</Text>
              )}
            </TouchableOpacity>
        </View>
      </ScrollView>
      {isSubmitting && (
        <View style={styles.overlay}> 
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.text.white} />
            <Text style={styles.overlayText}>{t('sell.listingPart')}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary.green,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.green,
    marginBottom: 16,
  },
  formGrid: {
    gap: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  required: {
    color: colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    backgroundColor: colors.background.primary,
  },
  picker: {
    height: 48,
    color: colors.text.primary,
  },
  errorText: {
    fontSize: 11,
    color: colors.error,
    marginTop: 4,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  imagePickerText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  imageName: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 6,
    textAlign: 'center',
  },
  specRow: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 10,
  },
  specInput: {
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  featureInput: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary.green,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  addButtonText: {
    color: colors.text.white,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary.green,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  overlayText: {
    color: colors.text.white,
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SellPage;


