import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { ArrowLeft, Plus, MapPin, CreditCard as Edit, Trash2, Chrome as Home, Building } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import CustomButton from '@/components/common/CustomButton';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  title: string;
  fullAddress: string;
  city: string;
  district: string;
  phone: string;
  isDefault: boolean;
}

const mockAddresses: Address[] = [
  {
    id: '1',
    type: 'home',
    title: 'Home',
    fullAddress: 'Street 15, Building 42, Apartment 3',
    city: 'Baghdad',
    district: 'Al-Karkh',
    phone: '+964 770 123 4567',
    isDefault: true
  },
  {
    id: '2',
    type: 'work',
    title: 'Office',
    fullAddress: 'Al-Mansour District, Commercial Street 7',
    city: 'Baghdad',
    district: 'Al-Mansour',
    phone: '+964 750 987 6543',
    isDefault: false
  },
  {
    id: '3',
    type: 'other',
    title: 'Warehouse',
    fullAddress: 'Industrial Zone, Block 12, Unit 5',
    city: 'Erbil',
    district: 'Erbil Center',
    phone: '+964 751 456 7890',
    isDefault: false
  },
  {
    id: '4',
    type: 'home',
    title: 'Family House',
    fullAddress: 'Old City, Traditional Street 8',
    city: 'Sulaymaniyah',
    district: 'Sulaymaniyah Center',
    phone: '+964 770 111 2233',
    isDefault: false
  }
];

export default function MyAddressesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [addresses, setAddresses] = useState(mockAddresses);

  const handleBack = () => {
    router.back();
  };

  const handleAddAddress = () => {
    Alert.alert('Add Address', 'Add new address functionality will be implemented');
  };

  const handleEditAddress = (addressId: string) => {
    Alert.alert('Edit Address', `Edit functionality for address ${addressId} will be implemented`);
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setAddresses(addresses.filter(addr => addr.id !== addressId));
          Alert.alert('Success', 'Address deleted successfully');
        }}
      ]
    );
  };

  const handleSetDefault = (addressId: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
    Alert.alert('Success', 'Default address updated');
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return Home;
      case 'work': return Building;
      default: return MapPin;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.myAddresses')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
          <Plus size={24} color={colors.primary.green} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {addresses.length > 0 ? (
            <View style={styles.addressesContainer}>
              {addresses.map((address) => {
                const IconComponent = getAddressIcon(address.type);
                return (
                  <View key={address.id} style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                      <View style={styles.addressTitleContainer}>
                        <View style={styles.iconContainer}>
                          <IconComponent size={20} color={colors.primary.green} />
                        </View>
                        <View style={styles.titleContainer}>
                          <Text style={styles.addressTitle}>{address.title}</Text>
                          {address.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultText}>Default</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.addressActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEditAddress(address.id)}
                        >
                          <Edit size={18} color={colors.gray[600]} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDeleteAddress(address.id)}
                        >
                          <Trash2 size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.addressDetails}>
                      <Text style={styles.fullAddress}>{address.fullAddress}</Text>
                      <Text style={styles.cityDistrict}>{address.city}, {address.district}</Text>
                      <Text style={styles.phone}>{address.phone}</Text>
                    </View>
                    
                    {!address.isDefault && (
                      <TouchableOpacity 
                        style={styles.setDefaultButton}
                        onPress={() => handleSetDefault(address.id)}
                      >
                        <Text style={styles.setDefaultText}>Set as Default</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MapPin size={64} color={colors.gray[400]} />
              <Text style={styles.emptyText}>No addresses found</Text>
              <Text style={styles.emptySubtext}>Add your delivery addresses to make ordering easier</Text>
              
              <CustomButton
                title="Add Address"
                variant="success"
                size="medium"
                onPress={handleAddAddress}
                style={styles.addAddressButton}
              />
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
  addButton: {
    padding: 8
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16
  },
  addressesContainer: {
    gap: 16
  },
  addressCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  addressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  titleContainer: {
    flex: 1
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4
  },
  defaultBadge: {
    backgroundColor: colors.primary.green,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.white
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    padding: 8
  },
  addressDetails: {
    marginBottom: 12
  },
  fullAddress: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 4
  },
  cityDistrict: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4
  },
  phone: {
    fontSize: 14,
    color: colors.text.secondary
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary.green,
    borderRadius: 20
  },
  setDefaultText: {
    fontSize: 12,
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
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24
  },
  addAddressButton: {
    minWidth: 150
  }
});