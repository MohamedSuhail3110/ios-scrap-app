import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl
} from 'react-native';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { mockProducts, announcements } from '@/data/mockData';
import VideoBackground from '@/components/home/VideoBackground';
import CustomButton from '@/components/common/CustomButton';
import ProductCard from '@/components/common/ProductCard';
import AnnouncementCard from '@/components/home/AnnouncementCard';
import { fetchApprovedParts } from '@/lib/api';
import { Product } from '@/types/product';
import { api } from '@/lib/api';
import HeroMobile from '@/components/home/HeroMobile';
import AppHeader from '@/components/common/AppHeader';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { t, ready: isTranslationReady } = useTranslation();
  const scrollRef = useRef<FlatList>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    title: string;
    content: string;
    time: string;
    image: string | null;
    createdAt: string;
  }>>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handler for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAnnouncements(),
        fetchTrending()
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);  // Dependencies will be added later

  // Wait for translations to be ready
  if (!isTranslationReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Robust image URL function similar to buy.tsx
  function getImageUrl(part: any) {
    let img: any = part?.image;
    if (Array.isArray(img)) {
      const found = (img as unknown[]).find((i: unknown) => typeof i === 'string' && (i as string).trim() !== '');
      img = found;
    }
    if (!img && Array.isArray(part?.images) && part.images.length > 0) {
      const found2 = (part.images as unknown[]).find((i: unknown) => typeof i === 'string' && (i as string).trim() !== '');
      img = found2;
    }
    const base = (api as any)?.defaults?.baseURL || 'https://scv2.onrender.com';
    if (!img) return `${base}/placeholder-part.jpg`;
    if (typeof img !== 'string') return `${base}/placeholder-part.jpg`;
    if (img.startsWith('/api/images/')) return `${base}${img}`;
    if (img.startsWith('/uploads/')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    if (/^https?:\/\//i.test(img)) return img;
    return `${base}/${img}`;
  }

  // Map API response to Product interface
  function mapPartToProduct(part: any): Product {
    const price = Number(part?.salePrice ?? part?.price ?? 0) || 0;
    
    // Handle condition field with better fallbacks
    let condition: Product['condition'] = 'Used - Good';
    if (part?.condition) {
      const cond = String(part.condition).toLowerCase();
      if (cond === 'new') condition = 'New';
      else if (cond.includes('excellent')) condition = 'Used - Excellent';
      else if (cond.includes('good')) condition = 'Used - Good';
      else if (cond.includes('fair')) condition = 'Used - Fair';
      else if (cond.includes('damage')) condition = 'Damaged';
      else condition = 'Used - Good';
    }
    
    const imageUrl = getImageUrl(part);
    console.log('Mapped product image URL:', imageUrl, 'for part:', part?.partName || part?.name);
    
    return {
      _id: String(part?._id || ''),
      partName: String(part?.partName || part?.name || 'Part'),
      partNumber: String(part?.partNumber || ''),
      brand: String(part?.brand || part?.carBrand || ''),
      category: String(part?.category || ''),
      compatibleModels: [],
      yearRange: { from: Number(part?.year || 0) || 0, to: Number(part?.year || 0) || 0 },
      price,
      condition,
      stockCount: Number(part?.stockCount ?? 1) || 1,
      description: String(part?.description || ''),
      images: [imageUrl],
      specifications: {},
      features: Array.isArray(part?.features) ? part.features : [],
      sellerId: String(part?.seller || part?.userId || ''),
      sellerName: String(part?.sellerName || ''),
      sellerPhone: String(part?.sellerPhone || ''),
      sellerCity: String(part?.city || ''),
      sellerDistrict: String(part?.district || ''),
      status: part?.isActive === false ? 'expired' : 'active',
      views: Number(part?.views || 0),
      rating: Number(part?.rating || 0),
      reviewCount: Number(part?.reviewCount || 0),
      isOEM: Boolean(part?.isOEM),
      shippingOptions: ['Delivery'],
      createdAt: part?.createdAt || new Date().toISOString(),
      updatedAt: part?.updatedAt || new Date().toISOString(),
    };
  }

  // Fetch announcements from backend (same as web)
  const fetchAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError('');
      
      console.log('Fetching announcements from API...');
      console.log('API base URL:', (api as any)?.defaults?.baseURL);
      
      // Try multiple endpoints like the web app
      let res;
      let data = [];
      
      try {
        // Try main endpoint first
        res = await api.get('/api/announcements/latest', { params: { limit: 12 } });
        console.log('Main endpoint response:', res);
        data = Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (mainError) {
        console.log('Main endpoint failed, trying alternatives...');
        
        // Try alternative endpoints
        const endpoints = [
          '/api/announcements',
          '/api/announcements/all',
          '/api/admin/announcements'
        ];
        
        for (const endpoint of endpoints) {
          try {
            res = await api.get(endpoint, { params: { limit: 12 } });
            console.log(`Alternative endpoint ${endpoint} response:`, res);
            data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            if (data.length > 0) break;
          } catch (altError) {
            console.log(`Alternative endpoint ${endpoint} failed:`, altError);
            continue;
          }
        }
      }
      
      console.log('Raw API response:', res);
      console.log('Response status:', res?.status);
      console.log('Response data:', res?.data);
      console.log('Raw announcement data:', data);
      console.log('Data length:', data.length);
      
      if (data.length === 0) {
        console.log('No announcements found in API response');
        setAnnouncements([]);
        return;
      }
      
      // Transform backend data to match the expected format (same as web)
      const transformedData = data.map((item: any, index: number) => {
        console.log('Processing announcement item:', item);
        console.log('Item image field:', item.image);
        
        // Handle image URL properly
        let imageUrl = null;
        if (item.image) {
          if (item.image.startsWith('http')) {
            imageUrl = item.image; // Already a full URL
          } else if (item.image.startsWith('/')) {
            imageUrl = `${(api as any)?.defaults?.baseURL || 'https://scv2.onrender.com'}${item.image}`;
          } else {
            imageUrl = `${(api as any)?.defaults?.baseURL || 'https://scv2.onrender.com'}/${item.image}`;
          }
        }
        
        console.log('Processed image URL:', imageUrl);
        
        const transformed = {
          id: item._id || `announcement-${index}`,
          title: item.title || item.text || item.name || t('home.announcementDefaultTitle'),
          content: item.content || item.description || item.text || item.message || t('home.announcementDefaultContent'),
          time: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : t('common.recently'),
          image: imageUrl,
          createdAt: item.createdAt
        };
        
        console.log('Transformed announcement:', transformed);
        return transformed;
      });
      
      console.log('Final transformed announcement data:', transformedData);
      setAnnouncements(transformedData);
      console.log('Announcements state updated with', transformedData.length, 'items');
    } catch (e: any) {
      console.error('Failed to fetch announcements:', e);
      console.error('Error details:', e?.response?.data);
      console.error('Error status:', e?.response?.status);
      setAnnouncementsError(t('common.failedToLoadAnnouncements') + ': ' + (e?.message || t('common.unknownError')));
      
      // Fallback to mock data on error
      console.log('Using mock announcements fallback due to API error');
      const mockAnnouncements = [
        {
          id: 'mock1',
          title: t('home.welcomeToScrap'),
          content: t('home.welcomeToScrapDesc'),
          time: t('common.today'),
          image: 'https://via.placeholder.com/300x200?text=Welcome+to+Scrap',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock2',
          title: t('home.qualityParts'),
          content: t('home.qualityPartsDesc'),
          time: t('common.today'),
          image: 'https://via.placeholder.com/300x200?text=Quality+Parts',
          createdAt: new Date().toISOString()
        }
      ];
      setAnnouncements(mockAnnouncements);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [t]);

  // Debug trending products state changes
  useEffect(() => {
    console.log('Trending products state changed:', trendingProducts);
  }, [trendingProducts]);

  // Ensure currentIndex is always valid
  useEffect(() => {
    if (announcements.length > 0 && (currentIndex < 0 || currentIndex >= announcements.length)) {
      console.log('Invalid currentIndex detected, resetting to 0');
      setCurrentIndex(0);
    }
  }, [currentIndex, announcements.length]);

  // Debug announcements state changes
  useEffect(() => {
    console.log('Announcements state changed:', announcements);
    
    // Reset currentIndex to 0 when announcements change to prevent scroll errors
    if (announcements.length > 0) {
      setCurrentIndex(0);
      console.log('Reset currentIndex to 0 for new announcements');
    }
  }, [announcements]);

  // Test function to manually set trending products
  const testTrendingProducts = () => {
    const testProducts: Product[] = [
      {
        _id: 'test1',
        partName: t('home.testProductName'),
        partNumber: 'TEST001',
        brand: 'Toyota',
        category: 'brakes',
        compatibleModels: ['Camry'],
        yearRange: { from: 2012, to: 2018 },
        price: 45000,
        condition: 'New',
        stockCount: 5,
        description: t('home.testProductDesc'),
        images: ['https://via.placeholder.com/300x200?text=Test+Image'],
        specifications: {},
        features: [t('home.testFeature')],
        sellerId: '1',
        sellerName: t('home.testSeller'),
        sellerPhone: '+964 770 123 4567',
        sellerCity: 'Baghdad',
        sellerDistrict: 'Al-Karkh',
        status: 'active',
        views: 100,
        rating: 4.5,
        reviewCount: 10,
        isOEM: true,
        shippingOptions: ['Pickup'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    console.log('Setting test trending products:', testProducts);
    setTrendingProducts(testProducts);
  };

  // Test function to manually set announcements
  const testAnnouncements = () => {
    const testAnnouncements = [
              {
          id: 'test1',
          title: t('home.announcementDefaultTitle'),
          content: t('home.announcementDefaultContent'),
          time: t('common.today'),
          image: 'https://via.placeholder.com/300x200?text=Test+Image',
          createdAt: new Date().toISOString()
        }
    ];
    console.log('Setting test announcements:', testAnnouncements);
    setAnnouncements(testAnnouncements);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Handler for manual refresh is defined above

  // Auto-scroll announcements
  useEffect(() => {
    if (announcements.length === 0) {
      console.log('No announcements available, skipping auto-scroll');
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % announcements.length;
        console.log('Auto-scrolling to index:', nextIndex, 'of', announcements.length);
        
        // Only scroll if we have a valid index and announcements
        if (nextIndex >= 0 && nextIndex < announcements.length && announcements.length > 0) {
          try {
            scrollRef.current?.scrollToIndex({ 
              index: nextIndex, 
              animated: true 
            });
          } catch (error) {
            console.error('Scroll error:', error);
          }
        }
        
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  const fetchTrending = useCallback(async () => {
    setTrendingLoading(true);
    setTrendingError(null);
    try {
      const res = await fetchApprovedParts({ limit: 9 });
      console.log('Trending products API response:', res);
      
      // Handle different response structures
      let items = [];
      if (res.success && Array.isArray(res.data)) {
        items = res.data;
      } else if (Array.isArray(res)) {
        items = res;
      } else if (res.data && Array.isArray(res.data)) {
        items = res.data;
      } else if (res.sells && Array.isArray(res.sells)) {
        items = res.sells;
      }
      
      console.log('Extracted items:', items);
      
      // Filter approved items, map to Product interface, and take top 3
      const approvedItems = items
        .filter((p: any) => p.isApproved !== false)
        .map(mapPartToProduct)
        .slice(0, 3);
      
      console.log('Final trending products:', approvedItems);
      
      // If no products from API, use mock data as fallback
      if (approvedItems.length === 0) {
        console.log('No products from API, using mock data fallback');
        const mockTrending = mockProducts.slice(0, 3).map((mockProduct: any) => ({
          ...mockProduct,
          _id: mockProduct.id || mockProduct._id,
          images: [mockProduct.image || mockProduct.images?.[0] || 'https://via.placeholder.com/300x200?text=Part+Image'],
          condition: mockProduct.condition || 'Used - Good'
        }));
        setTrendingProducts(mockTrending);
      } else {
        setTrendingProducts(approvedItems);
      }
    } catch (e: any) {
      console.error('Error fetching trending products:', e);
      setTrendingError(t('common.failedToFetchProducts') + '. ' + (e?.message || ''));
      
      // Fallback to mock data on error
      console.log('Using mock data fallback due to API error');
      const mockTrending = mockProducts.slice(0, 3).map((mockProduct: any) => ({
        ...mockProduct,
        _id: mockProduct.id || mockProduct._id,
        images: [mockProduct.image || mockProduct.images?.[0] || 'https://via.placeholder.com/300x200?text=Part+Image'],
        condition: mockProduct.condition || 'Used - Good'
      }));
      setTrendingProducts(mockTrending);
    } finally {
      setTrendingLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTrending();

    // Set up an interval to fetch trending products every 5 minutes
    const interval = setInterval(() => {
      fetchTrending();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchTrending]);

  useEffect(() => {
    // Initial fetch
    fetchAnnouncements();

    // Set up an interval to fetch announcements every 5 minutes
    const interval = setInterval(() => {
      fetchAnnouncements();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  const handleBuyPress = () => {
    router.push('/buy');
  };

  const handleSellPress = () => {
    router.push('/sell');
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product-details?id=${productId}`);
  };

  const renderAnnouncementItem = ({ item }: { item: any }) => {
    // Ensure item exists and has required properties
    if (!item) {
      console.log('Received undefined announcement item');
      return null;
    }
    
    // Ensure required properties exist with fallbacks
    const safeItem = {
      id: item.id || 'default-id',
      title: item.title || t('home.announcementDefaultTitle') || 'Announcement',
      content: item.content || t('home.announcementDefaultContent') || 'No content available',
      time: item.time || t('common.recently') || 'Recently',
      image: item.image || null,
      createdAt: item.createdAt || new Date().toISOString()
    };
    
    return <AnnouncementCard announcement={safeItem} />;
  };

  return (
    <>
      
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={trendingLoading || announcementsLoading}
              onRefresh={async () => {
                await Promise.all([
                  fetchAnnouncements(),
                  fetchTrending()
                ]);
              }}
              colors={[colors.primary.blue]}
              tintColor={colors.primary.blue}
            />
          }
        >
          <View style={styles.mainContent}>
            <HeroMobile />
            
            {/* Latest Announcements */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>
                    {t('home.latestAnnouncements') || 'Latest Announcements'}
                  </Text>
                  {announcementsLoading && (
                    <Text style={styles.sectionSubtitle}>
                      {t('common.loading') || 'Loading...'}
                    </Text>
                  )}
                  {announcementsError && (
                    <Text style={styles.sectionSubtitle}>
                      {t('common.error') || 'Error'}: {announcementsError}
                    </Text>
                  )}
                  {!announcementsLoading && !announcementsError && (
                    <Text style={styles.sectionSubtitle}>
                      {announcements.length} {announcements.length !== 1 ? 
                        (t('home.announcements') || 'announcements') : 
                        (t('home.announcement') || 'announcement')} {t('common.loaded') || 'loaded'}
                    </Text>
                  )}
                </View>
              </View>
              <FlatList
                ref={scrollRef}
                data={announcements}
                renderItem={renderAnnouncementItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToInterval={width - 32}
                decelerationRate="fast"
                contentContainerStyle={styles.announcementsContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={announcementsLoading}
                    onRefresh={fetchAnnouncements}
                    colors={[colors.primary.blue]}
                    tintColor={colors.primary.blue}
                  />
                }
                getItemLayout={(data, index) => {
                  // Safety check for valid data and index
                  if (!data || index < 0 || index >= (data?.length || 0)) {
                    console.warn('Invalid getItemLayout call:', { dataLength: data?.length, index });
                    return { length: 316, offset: 0, index: 0 };
                  }
                  return {
                    length: 316, // 300 + 16 margin
                    offset: 316 * index,
                    index,
                  };
                }}
                onScrollToIndexFailed={(info) => {
                  console.log('Scroll to index failed:', info);
                  const wait = new Promise(resolve => setTimeout(resolve, 500));
                  wait.then(() => {
                    // Only attempt to scroll if we have valid data
                    if (scrollRef.current && info.index >= 0 && info.index < announcements.length) {
                      try {
                        scrollRef.current.scrollToIndex({ 
                          index: info.index, 
                          animated: true 
                        });
                      } catch (error) {
                        console.error('Recovery scroll failed:', error);
                        // Reset to a safe index
                        setCurrentIndex(0);
                      }
                    } else {
                      console.log('Invalid scroll index, resetting to 0');
                      setCurrentIndex(0);
                    }
                  });
                }}
                // Only enable scrolling when we have valid data
                scrollEnabled={announcements.length > 0}
              />
            </View>

            {/* Trending Products */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>
                    {t('home.trendingProducts') || 'Trending Products'}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Discover the most popular auto parts
                  </Text>
                </View>
                <TouchableOpacity onPress={handleBuyPress} style={styles.viewAllButtonContainer}>
                  <Text style={styles.viewAllButton}>
                    View
                  </Text>
                </TouchableOpacity>
              </View>
              {trendingLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>
                    {t('common.loading') || 'Loading...'}
                  </Text>
                </View>
              ) : trendingError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{trendingError}</Text>
                </View>
              ) : trendingProducts.length > 0 ? (
                <View style={styles.productsOuterContainer}>
                  <ScrollView
                    horizontal={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productsContainer}
                  >
                    <View style={styles.productsGrid}>
                      {trendingProducts.filter(product => product && product._id).map((product) => {
                        console.log('Rendering product:', product._id, product.partName, product.images);
                        // Ensure all required fields exist and categorize by condition
                        const safeProduct = {
                          ...product,
                          _id: product._id || 'unknown',
                          partName: product.partName || 'Unknown Part',
                          price: product.price || 0,
                          images: product.images?.length ? product.images : ['https://via.placeholder.com/300x200?text=No+Image'],
                          condition: product.condition || 'Used - Good'
                        };

                        // Determine style based on condition
                        const conditionStyle = 
                          safeProduct.condition === 'New' ? styles.newProduct :
                          safeProduct.condition === 'Used - Excellent' ? styles.excellentProduct :
                          safeProduct.condition === 'Used - Good' ? styles.goodProduct :
                          safeProduct.condition === 'Used - Fair' ? styles.fairProduct :
                          styles.defaultProduct;

                        return (
                          <View 
                            key={safeProduct._id} 
                            style={[
                              styles.productItem,
                              conditionStyle,
                            ]}
                          >
                            <ProductCard
                              product={safeProduct}
                              onPress={() => handleProductPress(safeProduct._id)}
                              showOEMBadge
                              showMeta={false}
                            />
                            <View style={styles.conditionBadge}>
                              <Text style={styles.conditionText}>
                                {safeProduct.condition}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {t('buy.noResults') || 'No products found'}
                  </Text>
                </View>
              )}
            </View>

            {/* Why Choose Scrap */}
            <View style={styles.whyChooseSection}>
              <View style={styles.whyChooseHeader}>
                <Text style={styles.sectionTitle}>
                  {t('home.whyChoose') || 'Why Choose Scrap'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {t('home.whyChooseDesc') || 'Experience the best auto parts marketplace'}
                </Text>
              </View>
              <View style={styles.whyChooseContainer}>
                <View style={styles.whyChooseVideo}>
                  <VideoBackground source="https://sedge.in/Lokis_collections/scrap/Home%20footer.mp4">
                    <View />
                  </VideoBackground>
                </View>
                
                <View style={styles.whyChooseContent}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureTitle}>
                      {t('home.easyListings') || 'Easy Listings'}
                    </Text>
                    <Text style={styles.featureDescription}>
                      {t('home.easyListingsDesc') || 'List your auto parts quickly and easily'}
                    </Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <Text style={styles.featureTitle}>
                      {t('home.smartSearch') || 'Smart Search'}
                    </Text>
                    <Text style={styles.featureDescription}>
                      {t('home.smartSearchDesc') || 'Find exactly what you need with our smart search'}
                    </Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <Text style={styles.featureTitle}>
                      {t('home.multiLanguage') || 'Multi-Language'}
                    </Text>
                    <Text style={styles.featureDescription}>
                      {t('home.multiLanguageDesc') || 'Available in multiple languages for your convenience'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: 50
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.secondary
  },
  scrollViewContent: {
    paddingBottom: 120 // Ensure content doesn't overlap with tab bar
  },
  mainContent: {
    paddingTop: 0,
    paddingBottom: 24
  },
  heroTitle: {
    fontSize: width < 400 ? 24 : 28,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: width < 400 ? 30 : 36
  },
  heroSubtitle: {
    fontSize: width < 400 ? 14 : 16,
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: width < 400 ? 20 : 22,
    opacity: 0.9
  },
  searchContainer: {
    width: '100%',
    marginBottom: 24
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: width < 400 ? 14 : 16,
    color: colors.text.primary
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: width < 400 ? 12 : 16,
    width: '100%'
  },
  actionButton: {
    flex: 1
  },
  section: {
    padding: width < 400 ? 12 : 16,
    marginBottom: 32,
    marginHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  sectionTitleContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 16
  },
  sectionTitle: {
    fontSize: width < 400 ? 22 : 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6
  },
  sectionSubtitle: {
    fontSize: width < 400 ? 13 : 14,
    color: colors.text.secondary,
    lineHeight: width < 400 ? 18 : 20
  },
  viewAllButtonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
  },
  viewAllButton: {
    fontSize: width < 400 ? 13 : 14,
    fontWeight: '600',
    color: colors.text.white
  },
  announcementsContainer: {
    paddingLeft: 0
  },
  productsOuterContainer: {
    marginHorizontal: -4, // Reduced negative margin
  },
  productsContainer: {
    paddingHorizontal: 4, // Reduced padding
    paddingBottom: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  productItem: {
    width: '48%', // Two items per row with spacing
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background.primary,
    position: 'relative', 
  },
  // Condition-based styles
  newProduct: {
    borderWidth: 2,
    borderColor: colors.primary.green,
  },
  excellentProduct: {
    borderWidth: 2,
    borderColor: '#4CAF50', // Green
  },
  goodProduct: {
    borderWidth: 2,
    borderColor: '#2196F3', // Blue
  },
  fairProduct: {
    borderWidth: 2,
    borderColor: '#FFC107', // Amber
  },
  defaultProduct: {
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  conditionText: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  whyChooseSection: {
    padding: width < 400 ? 12 : 16,
    backgroundColor: colors.background.secondary,
    marginBottom: 20,
    marginHorizontal: 8,
    borderRadius: 16,
    borderBottomWidth: 0, // Remove border for last section
    paddingBottom: 24,
  },
  whyChooseHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  whyChooseContainer: {
    flexDirection: 'column',
    gap: 24
  },
  whyChooseVideo: {
    height: width < 400 ? 180 : 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8
  },
  whyChooseContent: {
    gap: 20
  },
  featureItem: {
    gap: 8,
    paddingHorizontal: 8
  },
  featureTitle: {
    fontSize: width < 400 ? 17 : 19,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4
  },
  featureDescription: {
    fontSize: width < 400 ? 14 : 15,
    color: colors.text.secondary,
    lineHeight: width < 400 ? 20 : 22
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 8
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 8
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 8
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center'
  }
});