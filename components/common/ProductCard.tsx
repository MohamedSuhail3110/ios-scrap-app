import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Star, Eye } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types/product';
import { colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  showOEMBadge?: boolean;
  showMeta?: boolean;
}

export default function ProductCard({ product, onPress, showOEMBadge = false, showMeta = true }: ProductCardProps) {
  const { t } = useTranslation();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New': return colors.success;
      case 'Used - Excellent': return colors.primary.green;
      case 'Used - Good': return colors.warning;
      case 'Used - Fair': return colors.primary.redLight;
      case 'Damaged': return colors.error;
      default: return colors.gray[500];
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.images[0] }} style={styles.image} />
        {showOEMBadge && product.isOEM && (
          <View style={styles.oemBadge}>
            <Text style={styles.oemText}>OEM</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{product.partName}</Text>
        <Text style={styles.brand}>{product.brand}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(product.condition) }]}>
            <Text style={styles.conditionText}>{product.condition}</Text>
          </View>
        </View>
        
        {showMeta && (
          <View style={styles.footer}>
            <View style={styles.rating}>
              <Star size={14} color={colors.warning} fill={colors.warning} />
              <Text style={styles.ratingText}>{product.rating}</Text>
              <Text style={styles.reviewCount}>({product.reviewCount})</Text>
            </View>
            
            <View style={styles.views}>
              <Eye size={14} color={colors.gray[500]} />
              <Text style={styles.viewsText}>{product.views}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Text style={styles.viewDetailsButton}>{t('buy.viewDetails')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    maxWidth: (width - 48) / 2
  },
  imageContainer: {
    position: 'relative'
  },
  image: {
    width: '100%',
    height: width < 400 ? 140 : 160,
    resizeMode: 'cover'
  },
  oemBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  oemText: {
    color: colors.text.white,
    fontSize: 10,
    fontWeight: '700'
  },
  content: {
    padding: width < 400 ? 12 : 16
  },
  title: {
    fontSize: width < 400 ? 14 : 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4
  },
  brand: {
    fontSize: width < 400 ? 12 : 14,
    color: colors.text.secondary,
    marginBottom: 8
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  price: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: '700',
    color: '#28a745'
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  conditionText: {
    color: colors.text.white,
    fontSize: width < 400 ? 9 : 10,
    fontWeight: '600'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingText: {
    marginLeft: 4,
    fontSize: width < 400 ? 12 : 14,
    fontWeight: '600',
    color: colors.text.primary
  },
  reviewCount: {
    marginLeft: 4,
    fontSize: width < 400 ? 10 : 12,
    color: colors.text.secondary
  },
  views: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewsText: {
    marginLeft: 4,
    fontSize: width < 400 ? 10 : 12,
    color: colors.text.secondary
  },
  buttonContainer: {
    alignItems: 'flex-end'
  },
  viewDetailsButton: {
    color: '#28a745',
    fontSize: width < 400 ? 12 : 14,
    fontWeight: '600'
  }
});