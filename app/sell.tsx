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
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { createSellItem, testBackendConnection } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/colors';
import { governorates, districtsByGovernorate, citiesByDistrict } from '@/lib/iraqLocations';
import { getSortedBrands, loadBrandCatalog, BrandToModels } from '@/lib/carCatalog';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/hooks/useAuth';

const SafePicker = ({ 
  selectedValue, 
  onValueChange, 
  items, 
  placeholder,
  ...props 
}: { 
  selectedValue: any;
  onValueChange: (value: string) => void;
  items: Array<{ label: string; value: string; }>;
  placeholder: string;
  [key: string]: any;
}) => {
  // Ensure we always have a valid string value
  const safeValue = Platform.OS === 'ios' 
    ? (selectedValue === undefined ? '' : String(selectedValue || ''))
    : (String(selectedValue || ''));

  return (
    <Picker
      selectedValue={safeValue}
      onValueChange={(value) => onValueChange(String(value || ''))}
      {...props}
    >
      <Picker.Item label={placeholder} value="" />
      {(items || []).map((item, index) => (
        <Picker.Item 
          key={String(item.value || index)} 
          label={String(item.label || '')} 
          value={String(item.value || '')} 
        />
      ))}
    </Picker>
  );
};

const SellPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t, ready } = useTranslation();
  const [backendReady, setBackendReady] = useState(true);
  const tabBarHeight = useBottomTabBarHeight();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Initialize form data safely
  useEffect(() => {
    if (!isFormInitialized) {
      const safeInitialData = {
        ...getInitialFormData(),
        brand: '',
        model: '',
        category: '',
        year: '',
        state: '',
        district: '',
        city: '',
        condition: '',
      };
      setFormData(safeInitialData);
      setIsFormInitialized(true);
    }
  }, [isFormInitialized]);

  // Error boundary for iOS compatibility
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('SellPage Error:', error);
      // Instead of showing error state, reinitialize the form
      const safeInitialData = {
        ...getInitialFormData(),
        brand: '',
        model: '',
        category: '',
        year: '',
        state: '',
        district: '',
        city: '',
        condition: '',
      };
      setFormData(safeInitialData);
    };

    if (Platform.OS === 'ios') {
      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }
  }, []);

  // Safety check for undefined values
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const checkAndFixFormData = () => {
        setFormData(current => {
          const hasUndefinedValues = Object.values(current).some(value => value === undefined);
          if (hasUndefinedValues) {
            return {
              ...getInitialFormData(),
              brand: current.brand || '',
              model: current.model || '',
              category: current.category || '',
              year: current.year || '',
              state: current.state || '',
              district: current.district || '',
              city: current.city || '',
              condition: current.condition || '',
            };
          }
          return current;
        });
      };
      checkAndFixFormData();
    }
  }, []);

  // Fallback data in case imports fail
  const fallbackCarBrands = [
    'Toyota', 'Nissan', 'Hyundai', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Honda'
  ];

  const fallbackGovernorates = [
    'Baghdad', 'Basra', 'Mosul', 'Erbil', 'Sulaymaniyah', 'Duhok', 'Kirkuk', 'Najaf', 'Karbala', 'Wasit'
  ];

  const fallbackDistricts: Record<string, string[]> = {
    'Baghdad': ['Central', 'North', 'South', 'East', 'West'],
    'Basra': ['Central', 'North', 'South'],
    'Mosul': ['Central', 'North', 'South'],
    'Erbil': ['Central', 'North', 'South'],
    'Sulaymaniyah': ['Central', 'North', 'South'],
    'Duhok': ['Central', 'North', 'South'],
    'Kirkuk': ['Central', 'North', 'South'],
    'Najaf': ['Central', 'North', 'South'],
    'Karbala': ['Central', 'North', 'South'],
    'Wasit': ['Central', 'North', 'South']
  };

  const fallbackCities: Record<string, string[]> = {
    'Central': ['Central City', 'Main District'],
    'North': ['North City', 'Upper District'],
    'South': ['South City', 'Lower District'],
    'East': ['East City', 'Eastern District'],
    'West': ['West City', 'Western District']
  };

  const fallbackCategories = [
    { value: 'Engine & Drivetrain', label: 'Engine & Drivetrain (Includes engine, gearbox, clutch, turbo, etc.)' },
    { value: 'Suspension & Steering', label: 'Suspension & Steering (Shocks, control arms, steering racks)' },
    { value: 'Brakes', label: 'Brakes (Pads, discs, calipers, cylinders)' },
    { value: 'Body Parts', label: 'Body Parts (Doors, bumpers, fenders, bonnet, mirrors)' },
    { value: 'Lights & Electrical', label: 'Lights & Electrical (Headlights, tail lights, batteries, alternators)' },
    { value: 'Tyres & Wheels', label: 'Tyres & Wheels (Rims, tyres, alloys)' },
    { value: 'Interior Parts', label: 'Interior Parts (Seats, dashboards, steering wheels, infotainment)' },
    { value: 'Exterior Accessories', label: 'Exterior Accessories (Roof racks, spoilers, number plates, mud flaps)' },
    { value: 'Fluids & Lubricants', label: 'Fluids & Lubricants (Engine oil, coolant, brake fluid)' },
    { value: 'Tools & Equipment', label: 'Tools & Equipment (Jacks, diagnostic tools, wrenches)' },
    { value: 'Performance Mods', label: 'Performance Mods (Aftermarket filters, exhausts, tuning parts)' },
    { value: 'By Vehicle Brand', label: 'By Vehicle Brand' }
  ];

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
      sellerName: user?.name || '',
      sellerPhone: user?.phone || '',
      sellerCity: user?.city || '',
      oem: false,
      specifications: [{ key: '', value: '' }],
      features: [''],
      // Safe defaults for iOS picker values
      selectedBrand: '',
      selectedModel: '',
      selectedCategory: '',
      selectedYear: '',
      selectedState: '',
      selectedDistrict: '',
      selectedCity: ''
    });
  }, [user]);

  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [brandMap, setBrandMap] = useState<BrandToModels>({});
  const [brandList, setBrandList] = useState<string[]>([]);
  
  // Ensure form data is properly initialized for iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const initialData = getInitialFormData();
      setFormData(prev => {
        // Only update if there are missing or undefined values
        if (!prev || Object.values(prev).some(value => value === undefined)) {
          return initialData;
        }
        return prev;
      });
    }
  }, []);
  const [modelList, setModelList] = useState<string[]>([]);

  // Ensure formData has the required structure
  const safeFormData = useMemo(() => {
    if (!formData) return getInitialFormData();
    return {
      ...getInitialFormData(),
      ...formData,
      specifications: formData.specifications || [{ key: '', value: '' }],
      features: formData.features || ['']
    };
  }, [formData, getInitialFormData]);

  // Safely get location data with fallbacks
  const carBrands = useMemo(() => {
    try {
      return brandList && brandList.length > 0 ? brandList : fallbackCarBrands;
    } catch (error) {
      console.warn('Error getting car brands, using fallback:', error);
      return fallbackCarBrands;
    }
  }, [brandList]);

  const iraqStates = useMemo(() => {
    try {
      return governorates && governorates.length > 0 ? governorates : fallbackGovernorates;
    } catch (error) {
      console.warn('Error getting governorates, using fallback:', error);
      return fallbackGovernorates;
    }
  }, [governorates]);

  const iraqDistrictsByState = useMemo(() => {
    try {
      return districtsByGovernorate && Object.keys(districtsByGovernorate).length > 0 
        ? districtsByGovernorate 
        : fallbackDistricts;
    } catch (error) {
      console.warn('Error getting districts, using fallback:', error);
      return fallbackDistricts;
    }
  }, [districtsByGovernorate]);

  const iraqCitiesByDistrict = useMemo(() => {
    try {
      return citiesByDistrict && Object.keys(citiesByDistrict).length > 0 
        ? citiesByDistrict 
        : fallbackCities;
    } catch (error) {
      console.warn('Error getting cities, using fallback:', error);
      return fallbackCities;
    }
  }, [citiesByDistrict]);

  const categoryList = useMemo(() => {
    try {
      return fallbackCategories;
    } catch (error) {
      console.warn('Error getting categories, using fallback:', error);
      return fallbackCategories;
    }
  }, []);

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.replace('/signin');
      return;
    }
    
    // Initialize form data with user information
    setFormData(prev => ({
      ...prev,
      sellerName: user?.fullName || '',
      sellerPhone: user?.phone || '',
      sellerCity: user?.governorate || '',
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
        console.warn('Failed to load brand catalog, using fallbacks:', e);
        setBrandList(fallbackCarBrands);
      }
    })();
  }, []);

  // Debug logging for iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      console.log('iOS Debug - Available data:', {
        governorates: governorates?.length || 0,
        districtsByGovernorate: Object.keys(districtsByGovernorate || {}).length,
        citiesByDistrict: Object.keys(citiesByDistrict || {}).length,
        brandList: brandList?.length || 0,
        modelList: modelList?.length || 0
      });
    }
  }, [governorates, districtsByGovernorate, citiesByDistrict, brandList, modelList]);

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
    if (!brandMap || !safeFormData.brand) {
      setModelList([]);
      return;
    }
    const models = brandMap[safeFormData.brand] || [];
    setModelList(models);
  }, [safeFormData.brand, brandMap]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => {
      // Ensure we have a valid previous state
      const safePrev = prev || getInitialFormData();
      
      // Create the base update
      const update = {
        ...safePrev,
        [name]: value,
        [`selected${name.charAt(0).toUpperCase() + name.slice(1)}`]: value, // For iOS picker state
      };

      // Handle dependent field resets
      if (name === 'state') {
        update.district = '';
        update.city = '';
        update.selectedDistrict = '';
        update.selectedCity = '';
      } else if (name === 'district') {
        update.city = '';
        update.selectedCity = '';
      } else if (name === 'brand') {
        update.model = '';
        update.selectedModel = '';
      }

      return update;
    });

    // Clear any errors for this field
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
        Alert.alert(t('common.error'), t('sell.permissionPhotos') || 'Please grant permission to access your photo library');
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
      Alert.alert(t('common.error'), t('sell.imagePickFailed') || 'Failed to pick image. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required field validation with improved error messages
    if (!safeFormData.partName?.trim()) {
      newErrors.partName = t('sell.partNameRequired') || 'Part name is required';
    } else if (safeFormData.partName.trim().length < 3) {
      newErrors.partName = t('sell.partNameTooShort') || 'Part name must be at least 3 characters';
    }

    if (!safeFormData.price) {
      newErrors.price = t('sell.salePriceRequired') || 'Price is required';
    } else {
      const price = Number(safeFormData.price);
      if (isNaN(price)) {
        newErrors.price = t('sell.priceInvalid') || 'Price must be a valid number';
      } else if (price <= 0) {
        newErrors.price = t('sell.pricePositive') || 'Price must be greater than 0';
      } else if (price > 1000000000) { // 1 billion limit
        newErrors.price = t('sell.priceTooHigh') || 'Price is too high';
      }
    }

    if (!safeFormData.brand) {
      newErrors.brand = t('sell.carBrandRequired') || 'Car brand is required';
    }

    if (!safeFormData.model) {
      newErrors.model = t('sell.carModelRequired') || 'Car model is required';
    }

    if (!safeFormData.category) {
      newErrors.category = t('sell.categoryRequired') || 'Category is required';
    }

    if (!safeFormData.year) {
      newErrors.year = t('sell.yearRequired') || 'Year is required';
    } else {
      const year = Number(safeFormData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        newErrors.year = t('sell.yearInvalid') || `Year must be between 1900 and ${currentYear + 1}`;
      }
    }

    if (!safeFormData.state) {
      newErrors.state = t('sell.selectState') || 'State is required';
    }

    if (!safeFormData.district) {
      newErrors.district = t('sell.selectDistrict') || 'District is required';
    }

    // Image validation with size and format check
    if (!safeFormData.image) {
      newErrors.image = t('sell.imageRequired') || 'Image is required';
    } else if (safeFormData.image?.uri) {
      const asset: any = safeFormData.image;
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { // 5MB limit
        newErrors.image = t('sell.imageTooLarge') || 'Image size should be less than 5MB';
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (asset.type && !allowedTypes.includes(asset.type)) {
        newErrors.image = t('sell.imageTypeInvalid') || 'Only JPG and PNG images are allowed';
      }
    }

    // Contact information validation
    if (!safeFormData.sellerName?.trim()) {
      newErrors.sellerName = t('sell.sellerNameRequired') || 'Seller name is required';
    } else if (safeFormData.sellerName.trim().length < 2) {
      newErrors.sellerName = t('sell.sellerNameTooShort') || 'Seller name must be at least 2 characters';
    }

    if (!safeFormData.sellerPhone?.trim()) {
      newErrors.sellerPhone = t('sell.sellerPhoneRequired') || 'Phone number is required';
    } else {
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
      if (!phoneRegex.test(safeFormData.sellerPhone.trim())) {
        newErrors.sellerPhone = t('sell.phoneInvalid') || 'Please enter a valid phone number';
      }
    }

    if (!safeFormData.sellerCity) {
      newErrors.sellerCity = t('sell.sellerCityRequired') || 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate form before showing loading state
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        // Show error message for better UX
        Alert.alert(
          t('common.error') || 'Error',
          t('sell.pleaseFixErrors') || 'Please fix the highlighted errors before submitting.'
        );
      }
      return;
    }

    setIsSubmitting(true);

    if (!user || !user._id) {
      Alert.alert(t('common.error'), t('common.login') || 'Please login to continue');
      setIsSubmitting(false);
      return;
    }

    if (!backendReady) {
      Alert.alert(
        t('common.error'), 
        t('sell.backendUnavailable') || 'Backend is not reachable. Please check your internet connection and try again.'
      );
      setIsSubmitting(false);
      return;
    }

    if (!safeFormData.image) {
      Alert.alert(
        t('common.error'), 
        t('sell.imageRequired') || 'Please select an image of your part'
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataObj = new FormData();
      formDataObj.append('userId', user._id);
      formDataObj.append('partName', safeFormData.partName.trim());
      formDataObj.append('brand', safeFormData.brand);
      formDataObj.append('category', safeFormData.category);
      formDataObj.append('model', safeFormData.model);
      formDataObj.append('year', safeFormData.year);
      formDataObj.append('price', safeFormData.price);
      formDataObj.append('state', safeFormData.state);
      formDataObj.append('district', safeFormData.district);
      formDataObj.append('city', safeFormData.sellerCity || safeFormData.city || '');
      // Proper file object for multipart upload
      if ((safeFormData.image as any)?.uri) {
        const asset: any = safeFormData.image as any;
        const fileName = asset.fileName || asset.name || `photo.${(asset.uri?.split('.')?.pop() || 'jpg')}`;
        const mimeType = asset.mimeType || asset.type || 'image/jpeg';
        formDataObj.append('image', {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        } as any);
      } else if (safeFormData.image) {
        formDataObj.append('image', safeFormData.image as any);
      }
      formDataObj.append('condition', (safeFormData.condition || 'used').toLowerCase());
      formDataObj.append('description', safeFormData.description);
      formDataObj.append('stockCount', safeFormData.stockCount || '1');
      formDataObj.append('sellerName', safeFormData.sellerName);
      formDataObj.append('sellerPhone', safeFormData.sellerPhone);
      formDataObj.append('sellerCity', safeFormData.sellerCity);
      formDataObj.append('oem', safeFormData.oem ? 'true' : 'false');
      formDataObj.append('specifications', JSON.stringify(safeFormData.specifications));
      formDataObj.append('features', JSON.stringify(safeFormData.features));

      console.log('Submitting form data:', {
        userId: user._id,
        partName: safeFormData.partName,
        brand: safeFormData.brand,
        category: safeFormData.category,
        model: safeFormData.model,
        year: safeFormData.year,
        price: safeFormData.price,
        state: safeFormData.state,
        district: safeFormData.district,
        city: safeFormData.sellerCity || safeFormData.city,
        condition: safeFormData.condition,
        sellerName: safeFormData.sellerName,
        sellerPhone: safeFormData.sellerPhone,
        sellerCity: safeFormData.sellerCity
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
        Alert.alert(t('common.error'), res?.message || (t('sell.submitError') as string) || 'Error submitting product');
      }
    } catch (err: any) {
      console.error('Sell POST error:', err);
      Alert.alert(t('common.error'), t('sell.serverError') || 'Server error. Please try again.');
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
    if (!formData.specifications) return;
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    if (!formData.specifications || !formData.specifications[index]) return;
    const newSpecs = [...formData.specifications];
    if (newSpecs[index]) {
      newSpecs[index][field] = value;
      setFormData(prev => ({ ...prev, specifications: newSpecs }));
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    if (!formData.features) return;
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    if (!formData.features || !formData.features[index]) return;
    const newFeatures = [...formData.features];
    if (newFeatures[index] !== undefined) {
      newFeatures[index] = value;
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };

  if (!user) {
    return null;
  }

  // Wait for translations to be ready
  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
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
          <Text style={styles.headerTitle}>{t('sell.title') || 'Sell Your Car Parts'}</Text>
          <Text style={styles.headerSubtitle}>{t('sell.subtitle') || 'Sell your automotive parts easily and securely'}</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Part Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sell.listPart') || 'List Your Car Part'}</Text>
            
            <View style={styles.formGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.partName')}</Text>
                <TextInput
                  style={styles.input}
                  value={safeFormData.partName}
                  onChangeText={(value) => handleInputChange('partName', value)}
                  placeholder={t('sell.partNamePlaceholder') || 'Enter part name'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.carBrand')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.brand && styles.inputError]}>
                  {Platform.OS === 'ios' ? (
                    <Picker
                      selectedValue={safeFormData.brand ?? ''}
                      onValueChange={(value) => handleInputChange('brand', value || '')}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('sell.selectBrand') || 'Select Brand'} value="" />
                      {(carBrands || []).map((brand) => (
                        <Picker.Item key={brand} label={brand} value={brand} />
                      ))}
                    </Picker>
                  ) : (
                    <Picker
                      selectedValue={safeFormData.brand || ''}
                      onValueChange={(value) => handleInputChange('brand', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('sell.selectBrand') || 'Select Brand'} value="" />
                      {(carBrands || []).map((brand) => (
                        <Picker.Item key={brand} label={brand} value={brand} />
                      ))}
                    </Picker>
                  )}
                  <View style={styles.pickerIndicator} />
                </View>
                {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.category')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
                  {Platform.OS === 'ios' ? (
                    <Picker
                      selectedValue={safeFormData.category ?? ''}
                      onValueChange={(value) => handleInputChange('category', value || '')}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('sell.category') || 'Category'} value="" />
                      {(categoryList || []).map((cat) => (
                        <Picker.Item 
                          key={cat?.value || 'unknown'} 
                          label={cat?.label || cat?.value || 'Unknown'} 
                          value={cat?.value || ''} 
                        />
                      ))}
                    </Picker>
                  ) : (
                    <Picker
                      selectedValue={safeFormData.category || ''}
                      onValueChange={(value) => handleInputChange('category', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('sell.category') || 'Category'} value="" />
                      {(categoryList || []).map((cat) => (
                        <Picker.Item 
                          key={cat?.value || 'unknown'} 
                          label={cat?.label || cat?.value || 'Unknown'} 
                          value={cat?.value || ''} 
                        />
                      ))}
                    </Picker>
                  )}
                </View>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.carModel') || 'Car Model'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.model && styles.inputError]}>
                  {Platform.OS === 'ios' ? (
                    <Picker
                      selectedValue={safeFormData.model ?? ''}
                      onValueChange={(value) => handleInputChange('model', value || '')}
                      style={styles.picker}
                      enabled={!!safeFormData.brand}
                    >
                      <Picker.Item 
                        label={safeFormData.brand ? (t('sell.selectModel') || 'Select model') : (t('sell.selectBrand') || 'Select brand')} 
                        value="" 
                      />
                      {(modelList || []).map((model) => (
                        <Picker.Item key={model} label={model} value={model} />
                      ))}
                    </Picker>
                  ) : (
                    <Picker
                      selectedValue={safeFormData.model || ''}
                      onValueChange={(value) => handleInputChange('model', value)}
                      style={styles.picker}
                      enabled={!!safeFormData.brand}
                    >
                      <Picker.Item 
                        label={safeFormData.brand ? (t('sell.selectModel') || 'Select model') : (t('sell.selectBrand') || 'Select brand')} 
                        value="" 
                      />
                      {(modelList || []).map((model) => (
                        <Picker.Item key={model} label={model} value={model} />
                      ))}
                    </Picker>
                  )}
                </View>
                {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.selectYear') || 'Select Year'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.year && styles.inputError]}>
                  {Platform.OS === 'ios' ? (
                    <Picker
                      selectedValue={safeFormData.year ?? ''}
                      onValueChange={(value) => handleInputChange('year', value || '')}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('sell.selectYear') || 'Select Year'} value="" />
                      {Array.from({ length: 2025 - 2000 + 1 }, (_, i) => 2000 + i).map((year) => (
                        <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                      ))}
                    </Picker>
                  ) : (
                    <Picker
                      selectedValue={safeFormData.year || ''}
                      onValueChange={(value) => handleInputChange('year', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('sell.selectYear') || 'Select Year'} value="" />
                      {Array.from({ length: 2025 - 2000 + 1 }, (_, i) => 2000 + i).map((year) => (
                        <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                      ))}
                    </Picker>
                  )}
                </View>
                {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.salePrice') || 'Sale Price'} ({t('common.currency') || 'IQD'}) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={safeFormData.price || ''}
                  onChangeText={(value) => handleInputChange('price', value)}
                  placeholder={t('sell.pricePlaceholder') || 'Enter price'}
                  keyboardType="numeric"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.state') || 'State'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.state && styles.inputError]}>
                  <Picker
                    selectedValue={safeFormData.state || ''}
                    onValueChange={(value) => handleInputChange('state', value)}
                    style={styles.picker}
                    itemStyle={Platform.OS === 'ios' ? { fontSize: 16, color: colors.text.primary } : undefined}
                  >
                    <Picker.Item label={t('sell.selectState') || 'Select State'} value="" />
                    {iraqStates && iraqStates.length > 0 && iraqStates.map((state) => (
                      <Picker.Item key={state} label={state} value={state} />
                    ))}
                  </Picker>
                </View>
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.district') || 'District'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.district && styles.inputError]}>
                  <Picker
                    selectedValue={safeFormData.district || ''}
                    onValueChange={(value) => handleInputChange('district', value)}
                    style={styles.picker}
                    enabled={!!safeFormData.state}
                    itemStyle={Platform.OS === 'ios' ? { fontSize: 16, color: colors.text.primary } : undefined}
                  >
                    <Picker.Item label={safeFormData.state ? (t('sell.selectDistrict') || 'Select district') : (t('sell.selectState') || 'Select state')} value="" />
                    {safeFormData.state && iraqDistrictsByState[safeFormData.state] && iraqDistrictsByState[safeFormData.state].length > 0 && iraqDistrictsByState[safeFormData.state].map((district) => (
                      <Picker.Item key={district} label={district} value={district} />
                    ))}
                  </Picker>
                </View>
                {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerCity') || 'Seller City'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.sellerCity && styles.inputError]}>
                  <Picker
                    selectedValue={safeFormData.sellerCity || ''}
                    onValueChange={(value) => handleInputChange('sellerCity', value)}
                    style={styles.picker}
                    enabled={!!safeFormData.district}
                    itemStyle={Platform.OS === 'ios' ? { fontSize: 16, color: colors.text.primary } : undefined}
                  >
                    <Picker.Item label={safeFormData.state ? (t('sell.selectCity') || 'Select city') : (t('sell.selectDistrict') || 'Select district')} value="" />
                    {safeFormData.state && iraqCitiesByDistrict[safeFormData.state] && iraqCitiesByDistrict[safeFormData.state].length > 0 && iraqCitiesByDistrict[safeFormData.state].map((city) => (
                      <Picker.Item key={city} label={city} value={city} />
                    ))}
                  </Picker>
                </View>
                {errors.sellerCity && <Text style={styles.errorText}>{errors.sellerCity}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerName') || 'Seller Name'} <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.sellerName && styles.inputError]}
                  value={safeFormData.sellerName || ''}
                  onChangeText={(value) => handleInputChange('sellerName', value)}
                  placeholder={t('sell.sellerName') || 'Seller Name'}
                />
                {errors.sellerName && <Text style={styles.errorText}>{errors.sellerName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerPhone') || 'Phone Number'} <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.sellerPhone && styles.inputError]}
                  value={safeFormData.sellerPhone || ''}
                  onChangeText={(value) => handleInputChange('sellerPhone', value)}
                  placeholder={t('sell.sellerPhone') || 'Phone Number'}
                  keyboardType="phone-pad"
                />
                {errors.sellerPhone && <Text style={styles.errorText}>{errors.sellerPhone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.condition') || 'Condition'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.condition && styles.inputError]}>
                  <Picker
                    selectedValue={safeFormData.condition || ''}
                    onValueChange={(value) => handleInputChange('condition', value)}
                    style={styles.picker}
                    itemStyle={Platform.OS === 'ios' ? { fontSize: 16, color: colors.text.primary } : undefined}
                  >
                    <Picker.Item label={t('sell.condition') || 'Condition'} value="" />
                    <Picker.Item label={t('sell.conditionOptions.new') || 'New'} value="new" />
                    <Picker.Item label={t('sell.conditionOptions.usedVerified') || 'Used - Verified'} value="used" />
                    <Picker.Item label={t('sell.conditionOptions.refurbishedLikeNew') || 'Refurbished - Like New'} value="refurbished" />
                  </Picker>
                </View>
                {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.stockCount') || 'Stock Count'}</Text>
                <TextInput
                  style={styles.input}
                  value={safeFormData.stockCount || ''}
                  onChangeText={(value) => handleInputChange('stockCount', value)}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.description') || 'Description'}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={safeFormData.description || ''}
                  onChangeText={(value) => handleTextAreaChange('description', value)}
                  placeholder={t('sell.descriptionPlaceholder') || 'Describe your part...'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.image') || 'Part Image'} <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.imagePickerButton, safeFormData.image && styles.imageSelected]}
                  onPress={handleImageChange}
                >
                  {safeFormData.image ? (
                    <View style={styles.imagePreview}>
                      <Text style={styles.imagePreviewText}>Image Selected</Text>
                    </View>
                  ) : (
                    <Text style={styles.imagePickerText}>{t('sell.selectImage') || 'Select Image'}</Text>
                  )}
                </TouchableOpacity>
                {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
              </View>
            </View>

            {/* Specifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('sell.specifications') || 'Specifications'}</Text>
              {safeFormData.specifications && safeFormData.specifications.length > 0 && safeFormData.specifications.map((spec, idx) => (
                <View key={idx} style={styles.specRow}>
                  <TextInput
                    style={[styles.input, styles.specInput]}
                    placeholder={t('sell.specTitle') || 'Title'}
                    value={spec?.key || ''}
                    onChangeText={(value) => updateSpecification(idx, 'key', value)}
                  />
                  <TextInput
                    style={[styles.input, styles.specInput]}
                    placeholder={t('sell.specDescription') || 'Description'}
                    value={spec?.value || ''}
                    onChangeText={(value) => updateSpecification(idx, 'value', value)}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeSpecification(idx)}
                  >
                    <Text style={styles.removeButtonText}>{t('common.remove') || 'Remove'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addSpecification}>
                <Text style={styles.addButtonText}>{t('sell.addSpecification') || 'Add Specification'}</Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('sell.features') || 'Features'}</Text>
              {safeFormData.features && safeFormData.features.length > 0 && safeFormData.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <TextInput
                    style={[styles.input, styles.featureInput]}
                    placeholder={t('sell.feature') || 'Feature'}
                    value={feature || ''}
                    onChangeText={(value) => updateFeature(idx, value)}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFeature(idx)}
                  >
                    <Text style={styles.removeButtonText}>{t('common.remove') || 'Remove'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addFeature}>
                <Text style={styles.addButtonText}>{t('sell.addFeature') || 'Add Feature'}</Text>
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
                  <Text style={styles.submitButtonText}>{t('sell.listingPart') || 'Listing Part'}</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>{t('sell.listCarPart') || 'List Car Part'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {isSubmitting && (
        <View style={styles.overlay}> 
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.text.white} />
            <Text style={styles.overlayText}>{t('sell.listingPart') || 'Listing Part'}</Text>
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
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
    overflow: 'hidden',
    position: 'relative',
    minHeight: Platform.OS === 'ios' ? 50 : 56,
    justifyContent: 'center',
    ...(Platform.OS === 'ios' && {
      shadowColor: colors.gray[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 2,
    }),
  },
  picker: {
    height: Platform.OS === 'ios' ? 50 : 56,
    color: colors.text.primary,
    backgroundColor: 'transparent',
    flex: 1,
    ...(Platform.OS === 'ios' && {
      fontSize: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
      paddingRight: 32, // Make room for dropdown indicator
    }),
    ...(Platform.OS === 'android' && {
      height: 56,
      fontSize: 16,
      paddingHorizontal: 12,
      paddingRight: 32, // Make room for dropdown indicator
    }),
  },
  pickerIndicator: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -6 }],
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.gray[500],
    zIndex: 1,
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
  imagePickerButton: {
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  imageSelected: {
    borderColor: colors.primary.green,
    borderStyle: 'solid',
  },
  imagePreview: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewText: {
    fontSize: 12,
    color: colors.text.secondary,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary.green,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  contactSupportButton: {
    marginTop: 8,
    backgroundColor: colors.primary.blue || '#4A90E2',
  },
});

export default SellPage;
