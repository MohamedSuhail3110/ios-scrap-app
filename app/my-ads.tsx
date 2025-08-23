import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { ArrowLeft, CreditCard as Edit, Trash2, Eye, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { mockProducts } from '@/data/mockData';
import SafeImage from '@/components/common/SafeImage';
import { API_BASE_URL } from '@/lib/api';
import AppHeader from '@/components/common/AppHeader';

// Robust image URL as in buy page
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
  const base = API_BASE_URL;
  if (!img) return `${base}/placeholder-part.jpg`;
  if (typeof img !== 'string') return `${base}/placeholder-part.jpg`;
  if (img.startsWith('/api/images/')) return `${base}${img}`;
  if (img.startsWith('/uploads/')) return `${base}${img}`;
  if (img.startsWith('uploads/')) return `${base}/${img}`;
  if (/^https?:\/\//i.test(img)) return img;
  return `${base}/${img}`;
}

export default function MyAdsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // Map part to product format (same as buy page)
  function mapPartToProduct(part: any): any {
    const price = Number(part?.salePrice ?? part?.price ?? 0) || 0;
    return {
      _id: String(part?._id || ''),
      partName: String(part?.partName || part?.name || 'Part'),
      brand: String(part?.brand || part?.carBrand || ''),
      category: String(part?.category || ''),
      model: String(part?.model || part?.carModel || ''),
      year: Number(part?.year || 0) || 0,
      price,
      condition: String(part?.condition || 'used'),
      stockCount: Number(part?.stockCount ?? 1) || 1,
      description: String(part?.description || ''),
      image: getImageUrl(part),
      images: [getImageUrl(part)],
      city: String(part?.city || ''),
      sellerName: String(part?.sellerName || ''),
      sellerPhone: String(part?.sellerPhone || ''),
      status: part?.status || 'active',
      views: Number(part?.views || 0),
      createdAt: part?.createdAt || new Date().toISOString(),
      updatedAt: part?.updatedAt || new Date().toISOString(),
    };
  }

  // Show all products for testing purposes - map them to the new format
  const userAds = mockProducts.map(mapPartToProduct);

  const handleBack = () => {
    router.back();
  };

  const handleEditAd = (adId: string) => {
    Alert.alert('Edit Ad', `Edit functionality for ad ${adId} will be implemented`);
  };

  const handleDeleteAd = (adId: string) => {
    Alert.alert(
      'Delete Ad',
      'Are you sure you want to delete this ad?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'Ad deleted successfully');
        }}
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'sold': return colors.primary.green;
      case 'expired': return colors.error;
      default: return colors.gray[500];
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.myAds')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userAds.length}</Text>
              <Text style={styles.statLabel}>Total Ads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userAds.filter(ad => ad.status === 'active').length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userAds.filter(ad => ad.status === 'sold').length}</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
          </View>

          {userAds.length > 0 ? (
            <ScrollView style={{ maxHeight: 600 }} showsVerticalScrollIndicator={true}>
              <View style={styles.adsContainer}>
                {userAds.map((ad) => (
                  <View key={ad._id} style={styles.adCard}>
                  <SafeImage 
                    source={{ uri: ad.images?.[0] || ad.image }} 
                    style={styles.adImage}
                    placeholderSize={120}
                  />
                  
                  <View style={styles.adContent}>
                    <View style={styles.adHeader}>
                      <Text style={styles.adTitle} numberOfLines={2}>{ad.partName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ad.status) }]}>
                        <Text style={styles.statusText}>{ad.status}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.adBrand}>{ad.brand}</Text>
                    <Text style={styles.adPrice}>{formatPrice(ad.price)}</Text>
                    
                    <View style={styles.adStats}>
                      <View style={styles.statItem}>
                        <Eye size={16} color={colors.gray[500]} />
                        <Text style={styles.statText}>{ad.views} views</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Clock size={16} color={colors.gray[500]} />
                        <Text style={styles.statText}>2 days ago</Text>
                      </View>
                    </View>
                    
                    <View style={styles.adActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditAd(ad._id)}
                      >
                        <Edit size={16} color={colors.primary.green} />
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteAd(ad._id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                        <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No ads found</Text>
              <Text style={styles.emptySubtext}>Start selling your car parts to see them here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary
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
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary
  },
  adsContainer: {
    gap: 16
  },
  adCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  adImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover'
  },
  adContent: {
    padding: 16
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  adTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 12
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.white,
    textTransform: 'uppercase'
  },
  adBrand: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4
  },
  adPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.green,
    marginBottom: 12
  },
  adStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statText: {
    fontSize: 12,
    color: colors.text.secondary
  },
  adActions: {
    flexDirection: 'row',
    gap: 16
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.green
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center'
  }
});