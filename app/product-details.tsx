import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  Eye,
  Phone,
  MessageCircle,
  ShoppingCart,
  Heart,
  Share,
  CircleCheck as CheckCircle,
  Package,
  Calendar,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/colors';
import { mockProducts } from '@/data/mockData';
import CustomButton from '@/components/common/CustomButton';
import { fetchPartById } from '@/lib/api';
import { Product } from '@/types/product';
import api from '@/lib/api';
import SafeImage from '@/components/common/SafeImage';
import AppHeader from '@/components/common/AppHeader';

const { width } = Dimensions.get('window');

// Helper function to get proper image URL
function getImageUrl(image: any) {
  if (!image) return '';
  if (typeof image === 'string') {
    const base = (api as any)?.defaults?.baseURL || 'https://scv2.onrender.com';
    if (image.startsWith('/api/images/')) return `${base}${image}`;
    if (image.startsWith('/uploads/')) return `${base}${image}`;
    if (image.startsWith('uploads/')) return `${base}/${image}`;
    if (/^https?:\/\//i.test(image)) return image;
    return `${base}/${image}`;
  }
  return '';
}

export default function ProductDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('details');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);

  // Function to refresh seller details
  const refreshSellerDetails = async () => {
    if (!product?.sellerId) return;
    
    setSellerLoading(true);
    try {
      const updatedSellerDetails = await fetchSellerDetails(product.sellerId, product);
      if (updatedSellerDetails) {
        setProduct(prev => prev ? {
          ...prev,
          ...updatedSellerDetails
        } : prev);
        showMessage('Seller details updated');
      }
    } catch (error) {
      console.error('Error refreshing seller details:', error);
      showMessage('Could not refresh seller details');
    } finally {
      setSellerLoading(false);
    }
  };

  // Function to fetch seller details
  const fetchSellerDetails = async (userId: string, partData?: any) => {
    console.log('🔍 Fetching seller details for userId:', userId);
    try {
      let sellerData = null;
      let additionalInfo = null;
      let activeListingsCount = 0;

      // First, try to get seller info from the part data if available
      if (partData?.seller) {
        sellerData = partData.seller;
        console.log('✅ Found seller data in part response:', sellerData);
      } else {
        console.log('⚠️ No seller data found in part response');
      }

      // Try different user endpoints to get additional seller info
      if (userId && userId !== '[object Object]') {
        const userEndpoints = [
          `/api/admin/users/${userId}`,
          `/api/users/${userId}`,
          `/api/auth/users/${userId}`
        ];

        for (const endpoint of userEndpoints) {
          try {
            const userResponse = await api.get(endpoint);
            if (userResponse.data) {
              additionalInfo = userResponse.data;
              console.log(`Successfully fetched user info from ${endpoint}`);
              break;
            }
          } catch (userError: any) {
            console.warn(`Failed to fetch from ${endpoint}:`, userError?.response?.status);
            continue;
          }
        }
      } else {
        console.log('Invalid or missing userId:', userId);
      }

      // Try to get seller's active listings count
      const listingEndpoints = [
        `/api/parts?seller=${userId}&status=active`,
        `/api/parts?userId=${userId}&isActive=true`,
        `/api/sell/user/${userId}`
      ];

      for (const endpoint of listingEndpoints) {
        try {
          const listingsResponse = await api.get(endpoint);
          if (listingsResponse.data) {
            if (Array.isArray(listingsResponse.data)) {
              activeListingsCount = listingsResponse.data.length;
            } else if (listingsResponse.data.sells && Array.isArray(listingsResponse.data.sells)) {
              activeListingsCount = listingsResponse.data.sells.filter((item: any) => item.isActive !== false).length;
            } else if (listingsResponse.data.data && Array.isArray(listingsResponse.data.data)) {
              activeListingsCount = listingsResponse.data.data.length;
            }
            console.log(`Successfully fetched listings from ${endpoint}, count: ${activeListingsCount}`);
            break;
          }
        } catch (listingsError: any) {
          console.warn(`Failed to fetch listings from ${endpoint}:`, listingsError?.response?.status);
          continue;
        }
      }

      // Combine all available seller data
      const combinedSellerData = sellerData || additionalInfo || {};
      
      const userData: {
        sellerName: string;
        sellerPhone: string;
        sellerEmail: string;
        sellerCity: string;
        sellerDistrict: string;
        sellerAvatar: string;
        sellerVerified: boolean;
        sellerStatus: string;
        sellerType: string;
        sellerRating: number;
        totalReviews: number;
        totalSales: number;
        activeListings: number;
        sellerJoinDate: string | null;
        lastActive: string | undefined;
        businessName: string;
        websiteUrl: string;
      } = {
        sellerName: combinedSellerData.name || combinedSellerData.fullName || partData?.sellerName || 'Seller',
        sellerPhone: combinedSellerData.phone || partData?.sellerPhone || '',
        sellerEmail: combinedSellerData.email || partData?.sellerEmail || '',
        sellerCity: combinedSellerData.city || combinedSellerData.governorate || partData?.city || '',
        sellerDistrict: combinedSellerData.district || partData?.district || '',
        sellerAvatar: combinedSellerData.avatar || '',
        sellerVerified: combinedSellerData.isVerified || false,
        sellerStatus: combinedSellerData.status || 'active',
        sellerType: combinedSellerData.type || 'individual',
        sellerRating: Number(combinedSellerData.rating || 0),
        totalReviews: Number(combinedSellerData.reviewCount || 0),
        totalSales: Number(combinedSellerData.totalSales || 0),
        activeListings: activeListingsCount,
        sellerJoinDate: combinedSellerData.createdAt || null,
        lastActive: combinedSellerData.lastActive,
        businessName: combinedSellerData.businessName || '',
        websiteUrl: combinedSellerData.website || '',
      };

      return userData;
    } catch (error) {
      console.error('Error fetching seller details:', error);
      // Return basic seller info with defaults
      return {
        sellerName: partData?.sellerName || 'Seller',
        sellerPhone: partData?.sellerPhone || '',
        sellerEmail: partData?.sellerEmail || '',
        sellerCity: partData?.city || '',
        sellerDistrict: partData?.district || '',
        sellerAvatar: '',
        sellerVerified: false,
        sellerStatus: 'active',
        sellerType: 'individual',
        sellerRating: 0,
        totalReviews: 0,
        totalSales: 0,
        activeListings: 0,
        sellerJoinDate: null,
        lastActive: null,
        businessName: '',
        websiteUrl: '',
      };
    }
  };

  // Fetch product data from API
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchPartById(id as string);

        if (response.success && response.data) {
          // Map the API response to Product type
          const apiProduct = response.data;
          
          // Fetch seller details if we have a seller ID
          const sellerId = String(apiProduct.seller || apiProduct.userId || '');
          let sellerDetails = null;
          
          if (sellerId) {
            sellerDetails = await fetchSellerDetails(sellerId, apiProduct);
          }

          const mappedProduct: Product = {
            _id: String(apiProduct._id || ''),
            partName: String(apiProduct.partName || apiProduct.name || 'Part'),
            partNumber: String(apiProduct.partNumber || ''),
            brand: String(apiProduct.brand || apiProduct.carBrand || ''),
            category: String(apiProduct.category || ''),
            compatibleModels: Array.isArray(apiProduct.compatibleModels)
              ? apiProduct.compatibleModels
              : [],
            yearRange: {
              from: Number(apiProduct.year || apiProduct.yearRange?.from || 0),
              to: Number(apiProduct.year || apiProduct.yearRange?.to || 0),
            },
            price: Number(apiProduct.salePrice ?? apiProduct.price ?? 0) || 0,
            condition: apiProduct.condition || 'Used - Good',
            stockCount: Number(apiProduct.stockCount ?? 1) || 1,
            description: String(apiProduct.description || ''),
            images: Array.isArray(apiProduct.images)
              ? apiProduct.images.map(getImageUrl)
              : Array.isArray(apiProduct.image)
              ? apiProduct.image.map(getImageUrl)
              : [getImageUrl(apiProduct.image) || ''],
            specifications: apiProduct.specifications || {},
            features: Array.isArray(apiProduct.features)
              ? apiProduct.features
              : [],
            sellerId: sellerId,
            sellerName: sellerDetails?.sellerName || String(apiProduct.sellerName || ''),
            sellerPhone: sellerDetails?.sellerPhone || String(apiProduct.sellerPhone || ''),
            sellerEmail: sellerDetails?.sellerEmail || String(apiProduct.sellerEmail || ''),
            sellerCity: sellerDetails?.sellerCity || String(apiProduct.city || ''),
            sellerDistrict: sellerDetails?.sellerDistrict || String(apiProduct.district || ''),
            sellerAvatar: sellerDetails?.sellerAvatar || '',
            sellerVerified: sellerDetails?.sellerVerified || false,
            sellerStatus: sellerDetails?.sellerStatus || 'active',
            sellerType: sellerDetails?.sellerType as 'individual' | 'business' || 'individual',
            sellerRating: sellerDetails?.sellerRating || 0,
            totalReviews: sellerDetails?.totalReviews || 0,
            totalSales: sellerDetails?.totalSales || 0,
            activeListings: sellerDetails?.activeListings || 0,
            sellerJoinDate: sellerDetails?.sellerJoinDate || null,
            lastActive: sellerDetails?.lastActive || null,
            businessName: sellerDetails?.businessName || '',
            websiteUrl: sellerDetails?.websiteUrl || '',
            status: apiProduct.isActive === false ? 'expired' : 'active',
            views: Number(apiProduct.views || 0),
            rating: Number(apiProduct.rating || 0),
            reviewCount: Number(apiProduct.reviewCount || 0),
            isOEM: Boolean(apiProduct.isOEM),
            shippingOptions: ['Delivery'],
            createdAt: apiProduct.createdAt || new Date().toISOString(),
            updatedAt: apiProduct.updatedAt || new Date().toISOString(),
          };
          setProduct(mappedProduct);
        } else {
          // Fallback to mock data if API fails
          const mockProduct = mockProducts.find((p) => p._id === id);
          if (mockProduct) {
            setProduct(mockProduct);
          } else {
            setError('Product not found');
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        // Fallback to mock data
        const mockProduct = mockProducts.find((p) => p._id === id);
        if (mockProduct) {
          setProduct(mockProduct);
        } else {
          setError('Failed to load product');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New':
        return colors.success;
      case 'Used - Excellent':
        return colors.primary.green;
      case 'Used - Good':
        return colors.warning;
      case 'Used - Fair':
        return colors.primary.redLight;
      case 'Damaged':
        return colors.error;
      default:
        return colors.gray[500];
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleContactSeller = async () => {
    // Use the same WhatsApp contact functionality
    await handleWhatsAppContact();
  };

  // Toast message handler
  const showMessage = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Message', message);
    }
  };

  const handleWhatsAppContact = async () => {
    if (!product.sellerId) {
      showMessage('Seller information not available');
      return;
    }

    try {
      let sellerWhatsApp = product.sellerPhone;
      let sellerProfile = null;

      // Try multiple endpoints to fetch the latest seller profile
      const userEndpoints = [
        `/api/admin/users/${product.sellerId}`,
        `/api/users/${product.sellerId}`,
        `/api/auth/users/${product.sellerId}`
      ];

      for (const endpoint of userEndpoints) {
        try {
          const response = await api.get(endpoint);
          if (response.data) {
            sellerProfile = response.data;
            sellerWhatsApp = sellerProfile?.phone || sellerWhatsApp;
            console.log(`Successfully fetched seller profile from ${endpoint}`);
            break;
          }
        } catch (apiError: any) {
          console.warn(`Failed to fetch seller from ${endpoint}:`, apiError?.response?.status);
          continue;
        }
      }

      // If no phone number found, try to get it from the part data again
      if (!sellerWhatsApp && id) {
        try {
          const partResponse = await api.get(`/api/parts/${id}`);
          if (partResponse.data) {
            const partData = partResponse.data;
            sellerWhatsApp = partData.sellerPhone || partData.seller?.phone || partData.phone;
          }
        } catch (partError) {
          console.warn('Could not fetch part data for phone number:', partError);
        }
      }

      if (!sellerWhatsApp) {
        throw new Error('Seller contact information not available');
      }

      // Format the WhatsApp number
      const formattedNumber = sellerWhatsApp.replace(/\s+/g, '');
      let whatsAppNumber = formattedNumber;
      
      // Handle Iraqi phone number formatting
      if (!formattedNumber.startsWith('+')) {
        if (formattedNumber.startsWith('0')) {
          whatsAppNumber = `+964${formattedNumber.substring(1)}`;
        } else if (formattedNumber.startsWith('964')) {
          whatsAppNumber = `+${formattedNumber}`;
        } else if (formattedNumber.length >= 10) {
          whatsAppNumber = `+964${formattedNumber}`;
        }
      }
      
      const sellerName = sellerProfile?.name || sellerProfile?.fullName || product.sellerName || '';
      const message = `Hi${sellerName ? ` ${sellerName}` : ''}, I'm interested in your ${
        product.partName
      } for ${formatPrice(product.price)}. Can you provide more details?`;
      
      const whatsappUrl = `whatsapp://send?phone=${whatsAppNumber}&text=${encodeURIComponent(message)}`;

      // Update product state with seller info if available
      if (sellerProfile) {
        setProduct(prev => prev ? {
          ...prev,
          sellerPhone: sellerProfile.phone || prev.sellerPhone,
          sellerName: sellerProfile.name || sellerProfile.fullName || prev.sellerName,
          sellerCity: sellerProfile.city || sellerProfile.governorate || prev.sellerCity,
          sellerDistrict: sellerProfile.district || prev.sellerDistrict,
        } : prev);
      }

      // Try to open WhatsApp
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappUrl);
        showMessage('Opening WhatsApp...');
      } else {
        // Fallback to regular phone call if WhatsApp is not available
        const telUrl = `tel:${whatsAppNumber}`;
        const canMakeCall = await Linking.canOpenURL(telUrl);
        if (canMakeCall) {
          await Linking.openURL(telUrl);
          showMessage('Opening phone dialer...');
        } else {
          throw new Error('Cannot open WhatsApp or phone dialer');
        }
      }
      
    } catch (error: any) {
      console.error('Contact error:', error);
      
      if (error?.message?.includes('contact information')) {
        showMessage(error.message);
      } else if (product.sellerPhone) {
        // Final fallback to regular phone call
        try {
          const telUrl = `tel:${product.sellerPhone}`;
          const canMakeCall = await Linking.canOpenURL(telUrl);
          if (canMakeCall) {
            await Linking.openURL(telUrl);
            showMessage('Opening phone dialer...');
          } else {
            showMessage('Phone dialer not available');
          }
        } catch (callError) {
          showMessage('Could not make the call. Please try again later.');
        }
      } else {
        showMessage('Could not contact seller. Please try again later.');
      }
    }
  };

  const handleBuyNow = async () => {
    // Use the same WhatsApp contact functionality for Buy Now
    await handleWhatsAppContact();
  };

  const tabs = [
    { id: 'details', title: t('product.details') },
    { id: 'specifications', title: t('product.specifications') },
    { id: 'seller', title: t('product.sellerInfo') },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.description}>{product.description}</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Part Number</Text>
                <Text style={styles.detailValue}>{product.partNumber}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Brand</Text>
                <Text style={styles.detailValue}>{product.brand}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Compatible Models</Text>
                <Text style={styles.detailValue}>
                  {Array.isArray(product.compatibleModels)
                    ? product.compatibleModels
                        .map((model) =>
                          typeof model === 'string'
                            ? model
                            : typeof model === 'object' && model !== null
                            ? (model as any).name ||
                              (model as any).value ||
                              (model as any)._id ||
                              JSON.stringify(model)
                            : String(model || '')
                        )
                        .join(', ')
                    : 'No compatible models listed'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Year Range</Text>
                <Text style={styles.detailValue}>
                  {product.yearRange.from} - {product.yearRange.to}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'specifications':
        return (
          <View style={styles.tabContent}>
            {Object.keys(product.specifications).length > 0 ? (
              Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} style={styles.specItem}>
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.specValue}>
                    {typeof value === 'string'
                      ? value
                      : typeof value === 'object' && value !== null
                      ? (value as any)._id ||
                        (value as any).value ||
                        (value as any).key ||
                        JSON.stringify(value)
                      : String(value || '')}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noSpecsContainer}>
                <Text style={styles.noSpecsText}>No specifications found</Text>
              </View>
            )}
          </View>
        );

      case 'seller':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sellerInfo}>
              {/* Seller Profile Section */}
              <View style={styles.sellerProfileCard}>
                <View style={styles.sellerAvatarContainer}>
                  {product.sellerAvatar ? (
                    <Image 
                      source={{ uri: product.sellerAvatar }} 
                      style={styles.sellerAvatar}
                    />
                  ) : (
                    <Text style={styles.sellerAvatarText}>
                      {product.sellerName ? product.sellerName[0].toUpperCase() : 'S'}
                    </Text>
                  )}
                </View>
                
                <View style={styles.sellerDetailsContainer}>
                  <View style={styles.sellerHeaderRow}>
                    <Text style={styles.sellerNameLarge}>
                      {product.sellerType === 'business' ? product.businessName : product.sellerName || 'Seller'}
                    </Text>
                    {product.sellerVerified && <CheckCircle size={20} color={colors.success} />}
                  </View>
                  
                  {/* Seller metrics */}
                  {/* <View style={styles.sellerMetrics}>
                    {product.sellerRating !== undefined && (
                      <View style={styles.metricItem}>
                        <Star size={16} color={colors.warning} fill={colors.warning} />
                        <Text style={styles.metricValue}>
                          {product.sellerRating.toFixed(1)}
                        </Text>
                        <Text style={styles.metricLabel}>
                          ({product.totalReviews || 0} reviews)
                        </Text>
                      </View>
                    )}
                    
                    {product.totalSales !== undefined && (
                      <View style={styles.metricItem}>
                        <Package size={16} color={colors.primary.green} />
                        <Text style={styles.metricValue}>{product.totalSales}</Text>
                        <Text style={styles.metricLabel}>sales</Text>
                      </View>
                    )}
                  </View> */}

                  {/* Success and response rates */}
                  {(product.successRate || product.responseRate) && (
                    <View style={styles.ratesContainer}>
                      {product.successRate && (
                        <View style={styles.rateItem}>
                          <Text style={styles.rateLabel}>Success Rate</Text>
                          <Text style={styles.rateValue}>{product.successRate}%</Text>
                        </View>
                      )}
                      {product.responseRate && (
                        <View style={styles.rateItem}>
                          <Text style={styles.rateLabel}>Response Rate</Text>
                          <Text style={styles.rateValue}>{product.responseRate}%</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Business Information (if applicable) */}
              {product.sellerType === 'business' && product.businessRegistration && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Business Information</Text>
                  <View style={styles.contactItem}>
                    <Text style={styles.contactLabel}>Registration:</Text>
                    <Text style={styles.contactValue}>{product.businessRegistration}</Text>
                  </View>
                  {product.websiteUrl && (
                    <TouchableOpacity 
                      style={styles.websiteLink}
                      onPress={() => product.websiteUrl ? Linking.openURL(product.websiteUrl) : null}
                    >
                      <Text style={styles.websiteLinkText}>Visit Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Location and Contact Hours */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Location & Availability</Text>
                {(product.sellerCity || product.sellerDistrict) && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactLabel}>Location:</Text>
                    <Text style={styles.contactValue}>
                      {[product.sellerCity, product.sellerDistrict].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}
                {product.availableHours && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactLabel}>Available Hours:</Text>
                    <Text style={styles.contactValue}>{product.availableHours}</Text>
                  </View>
                )}
                {product.lastActive && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactLabel}>Last Active:</Text>
                    <Text style={styles.contactValue}>
                      {new Date(product.lastActive).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Contact Information */}
              <View style={styles.sellerContact}>
                <View style={styles.contactTitleRow}>
                  <Text style={styles.contactTitle}>Contact Information</Text>
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={refreshSellerDetails}
                    disabled={sellerLoading}
                  >
                    <Text style={[styles.refreshButtonText, sellerLoading && styles.refreshButtonDisabled]}>
                      {sellerLoading ? 'Refreshing...' : 'Refresh'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {!product.sellerPhone ? (
                  <Text style={styles.noContactText}>
                    Contact information will be available after clicking Buy Now
                  </Text>
                ) : (
                  <>
                    <View style={styles.contactItem}>
                      <Text style={styles.contactLabel}>Name:</Text>
                      <Text style={styles.contactValue}>{product.sellerName || 'Seller'}</Text>
                    </View>
                    
                    <View style={styles.contactItem}>
                      <Text style={styles.contactLabel}>Mobile:</Text>
                      <Text style={styles.contactValue}>{product.sellerPhone}</Text>
                    </View>

                    {product.sellerEmail && (
                      <View style={styles.contactItem}>
                        <Text style={styles.contactLabel}>Email:</Text>
                        <Text style={styles.contactValue}>{product.sellerEmail}</Text>
                      </View>
                    )}
                    
                    {product.preferredContactMethod && (
                      <View style={styles.contactItem}>
                        <Text style={styles.contactLabel}>Preferred Contact:</Text>
                        <Text style={styles.contactValue}>{product.preferredContactMethod}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* WhatsApp Contact Button */}
              <TouchableOpacity 
                style={styles.whatsappButton}
                onPress={handleWhatsAppContact}
              >
                <MessageCircle size={20} color={colors.text.white} />
                <Text style={styles.whatsappButtonText}>Contact via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <AppHeader />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('product.details')}</Text>
          <View style={styles.headerActions}></View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Gallery */}
          <View style={styles.imageGallery}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / width
                );
                setCurrentImageIndex(index);
              }}
            >
              {product.images.filter(
                (image) => image && typeof image === 'string'
              ).length > 0 ? (
                product.images
                  .filter((image) => image && typeof image === 'string')
                  .map((image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      style={styles.productImage}
                    />
                  ))
              ) : (
                <View
                  style={[
                    styles.productImage,
                    {
                      backgroundColor: colors.gray[200],
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: colors.gray[500] }}>
                    No image available
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Image Indicators */}
            {product.images.filter(
              (image) => image && typeof image === 'string'
            ).length > 1 && (
              <View style={styles.imageIndicators}>
                {product.images
                  .filter((image) => image && typeof image === 'string')
                  .map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentImageIndex && styles.activeIndicator,
                      ]}
                    />
                  ))}
              </View>
            )}

            {/* OEM Badge */}
            {product.isOEM && (
              <View style={styles.oemBadge}>
                <Text style={styles.oemText}>{t('product.oem')}</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.partName}</Text>
            <Text style={styles.productBrand}>{product.brand}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              <View
                style={[
                  styles.conditionBadge,
                  { backgroundColor: getConditionColor(product.condition) },
                ]}
              >
                <Text style={styles.conditionText}>{product.condition}</Text>
              </View>
            </View>

            {/* Stock Status */}
            <View style={styles.stockContainer}>
              <Text
                style={[
                  styles.stockText,
                  {
                    color:
                      product.stockCount > 0 ? colors.success : colors.error,
                  },
                ]}
              >
                {product.stockCount > 0
                  ? `${product.stockCount} ${t('product.inStock')}`
                  : t('product.outOfStock')}
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.id && styles.activeTabText,
                    ]}
                  >
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                setQuantity(Math.min(product.stockCount, quantity + 1))
              }
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleWhatsAppContact}
            >
              <Phone size={20} color={colors.primary.green} />
            </TouchableOpacity>

            <CustomButton
              title={t('buy.buyNow')}
              variant="success"
              size="medium"
              onPress={handleBuyNow}
              style={styles.buyButton}
            />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  imageGallery: {
    position: 'relative',
    height: 300,
  },
  productImage: {
    width,
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: colors.text.white,
  },
  oemBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  oemText: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: '700',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary.green,
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  conditionText: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },

  stockContainer: {
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary.green,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary.green,
    fontWeight: '600',
  },
  tabContent: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: 20,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  specKey: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  noSpecsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSpecsText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  sellerInfo: {
    gap: 16,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },

  sellerLocation: {
    padding: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },
  sellerContact: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  contactTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary.green,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: colors.text.white,
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  contactLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },

  bottomActions: {
    backgroundColor: colors.background.primary,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  contactButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  noContactText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.green,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  whatsappButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sellerProfileCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sellerAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.white,
  },
  sellerDetailsContainer: {
    flex: 1,
  },
  sellerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sellerNameLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sellerPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerPhoneText: {
    fontSize: 16,
    color: colors.primary.green,
    fontWeight: '600',
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sellerRatingText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  sellerJoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sellerJoinText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  infoCardValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sellerMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  ratesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  rateItem: {
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.green,
  },
  websiteLink: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
    alignItems: 'center',
  },
  websiteLinkText: {
    color: colors.text.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
