import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import { ArrowLeft, Package, Calendar, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';

interface Purchase {
  id: string;
  productName: string;
  productImage: string;
  brand: string;
  price: number;
  quantity: number;
  orderDate: string;
  status: 'delivered' | 'shipped' | 'processing';
  seller: string;
}

const mockPurchases: Purchase[] = [
  {
    id: '1',
    productName: 'Toyota Camry Front Brake Pads',
    productImage: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400',
    brand: 'Toyota',
    price: 45000,
    quantity: 1,
    orderDate: '2024-11-25',
    status: 'delivered',
    seller: 'Ahmed Hassan'
  },
  {
    id: '2',
    productName: 'Honda Civic Engine Oil Filter',
    productImage: 'https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=400',
    brand: 'Honda',
    price: 12000,
    quantity: 2,
    orderDate: '2024-11-20',
    status: 'shipped',
    seller: 'Sara Mohammed'
  },
  {
    id: '3',
    productName: 'Nissan Altima Headlight Assembly',
    productImage: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400',
    brand: 'Nissan',
    price: 125000,
    quantity: 1,
    orderDate: '2024-11-15',
    status: 'processing',
    seller: 'Omar Ali'
  },
  {
    id: '4',
    productName: 'Hyundai Elantra Side Mirror',
    productImage: 'https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=400',
    brand: 'Hyundai',
    price: 85000,
    quantity: 1,
    orderDate: '2024-11-10',
    status: 'delivered',
    seller: 'Fatima Hassan'
  }
];

export default function PurchaseHistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return colors.success;
      case 'shipped': return colors.primary.green;
      case 'processing': return colors.warning;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.purchaseHistory')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{mockPurchases.length}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {formatPrice(mockPurchases.reduce((sum, purchase) => sum + (purchase.price * purchase.quantity), 0))}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>

          {mockPurchases.length > 0 ? (
            <View style={styles.purchasesContainer}>
              {mockPurchases.map((purchase) => (
                <View key={purchase.id} style={styles.purchaseCard}>
                  <Image source={{ uri: purchase.productImage }} style={styles.productImage} />
                  
                  <View style={styles.purchaseContent}>
                    <View style={styles.purchaseHeader}>
                      <Text style={styles.productName} numberOfLines={2}>{purchase.productName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(purchase.status) }]}>
                        <Text style={styles.statusText}>{purchase.status}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.brandText}>{purchase.brand}</Text>
                    <Text style={styles.sellerText}>Sold by: {purchase.seller}</Text>
                    
                    <View style={styles.purchaseDetails}>
                      <View style={styles.detailItem}>
                        <Package size={16} color={colors.gray[500]} />
                        <Text style={styles.detailText}>Qty: {purchase.quantity}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Calendar size={16} color={colors.gray[500]} />
                        <Text style={styles.detailText}>{formatDate(purchase.orderDate)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{formatPrice(purchase.price * purchase.quantity)}</Text>
                      {purchase.status === 'delivered' && (
                        <TouchableOpacity style={styles.reviewButton}>
                          <Star size={16} color={colors.warning} />
                          <Text style={styles.reviewText}>Rate</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No purchases found</Text>
              <Text style={styles.emptySubtext}>Your purchase history will appear here</Text>
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center'
  },
  purchasesContainer: {
    gap: 16
  },
  purchaseCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover'
  },
  purchaseContent: {
    padding: 16
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  productName: {
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
  brandText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4
  },
  sellerText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 12
  },
  purchaseDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.green
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 16
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary
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