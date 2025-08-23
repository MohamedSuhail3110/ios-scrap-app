import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl
} from 'react-native';
import { Search, Filter, Grid2x2 as Grid, List, TrendingUp, Star, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { mockProducts } from '@/data/mockData';
import { fetchApprovedParts } from '@/lib/api';
import { districtsByGovernorate } from '@/lib/iraqLocations';
import Modal from 'react-native-modal';
import { loadBrandCatalog, getSortedBrands, BrandToModels } from '@/lib/carCatalog';
import CategoryFilter from '@/components/home/CategoryFilter';
import ProductCard from '@/components/common/ProductCard';
import api from '@/lib/api';
import { Product } from '@/types/product';
import VideoBackground from '@/components/home/VideoBackground';
import AppHeader from '@/components/common/AppHeader';

const { width } = Dimensions.get('window');

export default function BuyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    searchQuery: '',
    district: '',
    brand: '',
    model: '',
  });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandMap, setBrandMap] = useState<BrandToModels>({});
  const brandList = useMemo(() => getSortedBrands(brandMap), [brandMap]);
  const modelList = useMemo(() => brandMap[filters.brand] || [], [brandMap, filters.brand]);

  // Robust image URL as in web BuyPage
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

  function toTitleCaseCondition(cond?: string): Product['condition'] {
    const c = String(cond || '').toLowerCase();
    if (c === 'new') return 'New';
    if (c.includes('excellent')) return 'Used - Excellent';
    if (c.includes('good')) return 'Used - Good';
    if (c.includes('fair')) return 'Used - Fair';
    if (c.includes('damage')) return 'Damaged';
    // default bucket for unknown used
    if (c === 'used') return 'Used - Good';
    return 'Used - Good';
  }

  function mapPartToProduct(part: any): Product {
    const price = Number(part?.salePrice ?? part?.price ?? 0) || 0;
    return {
      _id: String(part?._id || ''),
      partName: String(part?.partName || part?.name || 'Part'),
      partNumber: String(part?.partNumber || ''),
      brand: String(part?.brand || part?.carBrand || ''),
      category: String(part?.category || ''),
      compatibleModels: [],
      yearRange: { from: Number(part?.year || 0) || 0, to: Number(part?.year || 0) || 0 },
      price,
      condition: toTitleCaseCondition(part?.condition),
      stockCount: Number(part?.stockCount ?? 1) || 1,
      description: String(part?.description || ''),
      images: [getImageUrl(part)],
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  useEffect(() => {
    (async () => {
      try {
        const map = await loadBrandCatalog();
        setBrandMap(map);
      } catch { }
    })();
  }, []);

  const filteredProducts = parts.filter((p) => {
    const s = filters.searchQuery.trim().toLowerCase();
    if (s) {
      const any = [p.partName, p.description, p.brand, p.carBrand, p.carModel]
        .some((v: any) => v && String(v).toLowerCase().includes(s));
      if (!any) return false;
    }
    if (selectedCategory && selectedCategory !== 'by-brand') {
      if (!p.category || String(p.category) !== selectedCategory) return false;
    }
    if (filters.district) {
      const d = String(filters.district).toLowerCase();
      const pd = String(p.district || p.city || '').toLowerCase();
      if (d && pd && d !== pd) return false;
    }
    if (filters.brand) {
      const fb = String(filters.brand).toLowerCase();
      if (!((p.brand && String(p.brand).toLowerCase() === fb) || (p.carBrand && String(p.carBrand).toLowerCase() === fb))) return false;
    }
    if (filters.model) {
      const fm = String(filters.model).toLowerCase();
      if (!((p.model && String(p.model).toLowerCase() === fm) || (p.carModel && String(p.carModel).toLowerCase() === fm))) return false;
    }
    return true;
  });

  const handleProductPress = (productId: string) => {
    router.push(`/product-details?id=${productId}`);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchApprovedParts();
        const data = Array.isArray(res?.data) ? res.data : [];
        setParts(data.map(mapPartToProduct));
      } catch {
        setParts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (

    <>

      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Video Header */}
          <VideoBackground source="https://sedge.in/Lokis_collections/scrap/Buy%20page%20header.mp4">
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.heroTitle}>{t('buy.title')}</Text>
                <Text style={styles.heroSubtitle}>{t('buy.subtitle')}</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <TrendingUp size={16} color={colors.text.white} />
                    <Text style={styles.statText}>{t('buy.partsCount')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Star size={16} color={colors.text.white} />
                    <Text style={styles.statText}>4.8 {t('buy.rating')}</Text>
                  </View>
                </View>
              </View>

              {/* Search Section */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Search size={20} color={colors.gray[500]} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('buy.searchPlaceholder') || 'Search parts...'}
                    placeholderTextColor={colors.gray[500]}
                    value={filters.searchQuery}
                    onChangeText={(v) => setFilters(prev => ({ ...prev, searchQuery: v }))}
                  />
                  {filters.searchQuery ? (
                    <TouchableOpacity
                      onPress={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                      style={styles.clearSearch}
                    >
                      <X size={16} color={colors.gray[500]} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity 
                  style={[
                    styles.filterButton,
                    (selectedCategory || filters.district || filters.brand || filters.model) && styles.filterButtonActive
                  ]} 
                  onPress={() => setIsFilterVisible(true)}
                >
                  <Filter size={20} color={
                    (selectedCategory || filters.district || filters.brand || filters.model)
                      ? colors.text.white
                      : colors.primary.green
                  } />
                </TouchableOpacity>
              </View>
            </View>
          </VideoBackground>

          {/* Filters hidden; opened via modal */}

          {/* View Controls */}
          <View style={styles.viewControls}>
            <View style={styles.controlsLeft}>
                              <Text style={styles.resultsCount}>{filteredProducts.length} {t('buy.productsFound')}</Text>
            </View>

            {/* <View style={styles.controlsRight}>
              <View style={styles.viewModeContainer}>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
                  onPress={() => setViewMode('grid')}
                >
                  <Grid size={18} color={viewMode === 'grid' ? colors.text.white : colors.gray[500]} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
                  onPress={() => setViewMode('list')}
                >
                  <List size={18} color={viewMode === 'list' ? colors.text.white : colors.gray[500]} />
                </TouchableOpacity>
              </View>
            </View> */}
          </View>

          {/* Products Grid */}
          <View style={styles.productsSection}>
            {loading ? (
              <View style={styles.emptyContainer}><Text style={styles.emptyText}>{t('common.loading')}</Text></View>
            ) : filteredProducts.length > 0 ? (
              <View style={styles.productsGrid}>
                {filteredProducts.map((product) => (
                  <View key={product._id} style={styles.productItem}>
                    <ProductCard
                      product={product}
                      onPress={() => handleProductPress(product._id)}
                      showOEMBadge
                      showMeta={false}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('buy.noResults')}</Text>
              </View>
            )}
          </View>

          {/* Filter Modal */}
          <Modal isVisible={isFilterVisible} onBackdropPress={() => setIsFilterVisible(false)} backdropOpacity={0.3}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('buy.filters')}</Text>
                <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                  <X size={22} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Category */}
              <View style={styles.modalSection}>
                <Text style={styles.filterLabel}>{t('buy.category')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
                </ScrollView>
              </View>

              {/* District */}
              <View style={styles.modalSection}>
                <Text style={styles.filterLabel}>{t('buy.district')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.pillRow}>
                    <TouchableOpacity style={[styles.pill, !filters.district && styles.pillActive]} onPress={() => setFilters(prev => ({ ...prev, district: '' }))}>
                      <Text style={[styles.pillText, !filters.district && styles.pillTextActive]}>{t('buy.all')}</Text>
                    </TouchableOpacity>
                    {Object.values(districtsByGovernorate).flat().map((d) => (
                      <TouchableOpacity key={d} style={[styles.pill, filters.district === d && styles.pillActive]} onPress={() => setFilters(prev => ({ ...prev, district: d }))}>
                        <Text style={[styles.pillText, filters.district === d && styles.pillTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Brand */}
              <View style={styles.modalSection}>
                <Text style={styles.filterLabel}>{t('buy.brand')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.pillRow}>
                    <TouchableOpacity style={[styles.pill, !filters.brand && styles.pillActive]} onPress={() => setFilters(prev => ({ ...prev, brand: '', model: '' }))}>
                      <Text style={[styles.pillText, !filters.brand && styles.pillTextActive]}>{t('buy.all')}</Text>
                    </TouchableOpacity>
                    {brandList.map((b) => (
                      <TouchableOpacity key={b} style={[styles.pill, filters.brand === b && styles.pillActive]} onPress={() => setFilters(prev => ({ ...prev, brand: b, model: '' }))}>
                        <Text style={[styles.pillText, filters.brand === b && styles.pillTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

                              {/* Model */}
                {filters.brand ? (
                  <View style={styles.modalSection}>
                    <Text style={styles.filterLabel}>{t('buy.model')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.pillRow}>
                      <TouchableOpacity style={[styles.pill, !filters.model && styles.pillActive]} onPress={() => setFilters(prev => ({ ...prev, model: '' }))}>
                        <Text style={[styles.pillText, !filters.model && styles.pillTextActive]}>{t('buy.allModels')}</Text>
                      </TouchableOpacity>
                      {modelList.map((m) => (
                        <TouchableOpacity key={m} style={[styles.pill, filters.model === m && styles.pillActive]} onPress={() => setFilters(prev => ({ ...prev, model: m }))}>
                          <Text style={[styles.pillText, filters.model === m && styles.pillTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.resetBtn]} 
                  onPress={() => {
                    // Reset all filters
                    setFilters({ searchQuery: '', district: '', brand: '', model: '' });
                    setSelectedCategory(null);
                    // Close the modal after reset
                    setIsFilterVisible(false);
                  }}
                >
                  <Text style={styles.resetBtnText}>{t('buy.reset')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.applyBtn]} onPress={() => setIsFilterVisible(false)}>
                  <Text style={styles.applyBtnText}>{t('buy.apply')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </ScrollView>
      </TouchableWithoutFeedback>
    </>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: 50
  },
  scrollView: {
    flex: 1
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    gap: 20
  },
  headerTextContainer: {
    alignItems: 'center',
    gap: 12
  },
  heroTitle: {
    fontSize: width < 400 ? 24 : 28,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center'
  },
  heroSubtitle: {
    fontSize: width < 400 ? 14 : 16,
    color: colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statText: {
    color: colors.text.white,
    fontSize: 14,
    fontWeight: '600'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: width < 400 ? 14 : 16,
    color: colors.text.primary
  },
  clearSearch: {
    padding: 8,
  },
  filterButton: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  filterButtonActive: {
    backgroundColor: colors.primary.green,
  },
  filtersSection: {
    backgroundColor: colors.background.primary,
    paddingVertical: 8
  },
  modalCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary
  },
  modalSection: {
    marginVertical: 8
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.gray[100]
  },
  resetBtnText: {
    color: colors.text.primary,
    fontWeight: '700'
  },
  applyBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.primary.green
  },
  applyBtnText: {
    color: colors.text.white,
    fontWeight: '700'
  },
  filtersRow: {
    gap: 12,
    paddingHorizontal: 12
  },
  filterBox: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingVertical: 8,
    gap: 8
  },
  filterLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    paddingHorizontal: 4
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100]
  },
  pillActive: {
    backgroundColor: colors.primary.green
  },
  pillText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600'
  },
  pillTextActive: {
    color: colors.text.white
  },
  viewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  controlsLeft: {
    flex: 1
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  resultsCount: {
    fontSize: width < 400 ? 13 : 14,
    color: colors.text.secondary,
    fontWeight: '600'
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    padding: 3
  },
  viewModeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7
  },
  activeViewMode: {
    backgroundColor: colors.primary.green,
    elevation: 2,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  productsSection: {
    flex: 1,
    paddingBottom: 120
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  productItem: {
    width: (width - 48) / 2,
    marginBottom: 16,
    marginHorizontal: 4
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    marginHorizontal: 16
  },
  emptyText: {
    fontSize: width < 400 ? 15 : 16,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500'
  }
});