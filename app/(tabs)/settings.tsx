import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  RefreshControl,
  Platform
} from 'react-native';
import {
  User,
  FileText,
  MapPin,
  Bell,
  LogOut,
  ChevronRight,
  Edit,
  Save,
  X,
  Trash2,
  Eye,
  Package,
  Calendar,
  RefreshCw,
  CheckCircle
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { updateUserProfile } from '@/store/authSlice';
import { colors } from '@/constants/colors';
import CustomButton from '@/components/common/CustomButton';
import SafeImage from '@/components/common/SafeImage';
import { fetchUserSellItems, deletePartById, api, updateUserById, API_BASE_URL } from '@/lib/api';
import { governorates } from '@/lib/iraqLocations';
import AppHeader from '@/components/common/AppHeader';
import { useAuth } from '@/hooks/useAuth';

// Types
type Sell = {
  _id: string;
  userId: string;
  partName: string;
  brand: string;
  category: string;
  model: string;
  year: number;
  price: number;
  city: string;
  image?: string;
  condition?: string;
  description?: string;
  stockCount?: number;
  sellerName?: string;
  sellerPhone?: string;
  sellerCity?: string;
  deliveryStandard?: string;
  deliveryInstallation?: string;
  specifications?: { key: string; value: string }[];
  features?: string[];
  offers?: string[];
  createdAt: string;
};

type Notification = {
  id: string;
  type: "ad_upload" | "login" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, logout } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.fullName || '',
    phone: user?.phone || '',
    city: (user as any)?.city || '',
  });
  const [sellItems, setSellItems] = useState<any[]>([]);
  const [loadingSell, setLoadingSell] = useState(false);
  const [deletingAdIds, setDeletingAdIds] = useState<Set<string>>(new Set());
  const [selectedSell, setSelectedSell] = useState<Sell | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'ad_upload' | 'login' | 'system'>('all');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Helper functions
  const getCurrentUserId = (): string | null => {
    const anyUser: any = user as any;
    const computedId: string | undefined = anyUser?.id || anyUser?._id;
    return typeof computedId === 'string' && computedId.length > 0 ? computedId : null;
  };

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
      createdAt: part?.createdAt || new Date().toISOString(),
      updatedAt: part?.updatedAt || new Date().toISOString(),
    };
  }

  // Extract sell items from API response
  const extractSellItems = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res.map(mapPartToProduct);

    const candidateArrays: any[] = [
      res.sells, res.items, res.parts, res.results, res.list, res.data,
    ].filter(Array.isArray);

    if (candidateArrays.length > 0) return candidateArrays[0].map(mapPartToProduct);

    const data = res.data;
    if (data) {
      const nestedCandidates: any[] = [
        data.sells, data.items, data.parts, data.results, data.list,
      ].filter(Array.isArray);
      if (nestedCandidates.length > 0) return nestedCandidates[0].map(mapPartToProduct);
      if (Array.isArray(data)) return data.map(mapPartToProduct);
    }

    return [];
  };

  // Fetch user sell items
  const fetchUserSellItemsData = async (userId: string) => {
    setLoadingSell(true);
    try {
      console.log('Settings: Fetching sell items for user:', userId);
      const res: any = await fetchUserSellItems(userId);
      console.log('Settings: Received response:', res);

      const items: Sell[] = extractSellItems(res);
      setSellItems(items || []);

      if (items.length === 0) {
        console.log('Settings: No sell items found for user');
      } else {
        console.log(`Settings: Found ${items.length} sell items`);
      }
    } catch (error: any) {
      console.error('Settings: Error fetching user sell items:', error);
      setSellItems([]);

      // Show error to user
      const errorMessage = error?.response?.data?.message || t('settings.failedToLoadAds');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoadingSell(false);
    }
  };

  // Delete ad
  const handleDeleteAd = async (adId: string) => {
    Alert.alert(
      t('settings.deleteAd'),
      t('settings.confirmDeleteAd'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeletingAdIds((prev) => new Set(prev).add(adId));
            try {
              await deletePartById(adId, true);
              Alert.alert(t('common.success'), t('settings.adDeleted'));
              setSellItems((prev) => prev.filter((ad) => ad._id !== adId));
            } catch (err: any) {
              const message = err?.response?.data?.message || 'Failed to delete ad';
              Alert.alert(t('common.error'), message);
            } finally {
              setDeletingAdIds((prev) => {
                const next = new Set(prev);
                next.delete(adId);
                return next;
              });
            }
          }
        }
      ]
    );
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    // Form validation
    if (!editData.name.trim()) {
      Alert.alert(t('common.error'), t('settings.enterFullName'));
      return;
    }

    if (!editData.phone.trim()) {
      Alert.alert(t('common.error'), t('settings.enterPhone'));
      return;
    }

    if (!editData.city.trim()) {
      Alert.alert(t('common.error'), t('settings.selectCity'));
      return;
    }

    setSavingProfile(true);
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        Alert.alert(t('common.error'), t('settings.userIdNotFound'));
        return;
      }

      // Update profile via API
      await updateUserById(currentUserId, {
        name: editData.name.trim(),
        phone: editData.phone.trim(),
        city: editData.city.trim()
      });

      // Update local state without clearing user
      dispatch(updateUserProfile({
        fullName: editData.name.trim(),
        phone: editData.phone.trim(),
        governorate: editData.city.trim()
      }));
      
      setIsEditing(false);
      Alert.alert(t('common.success'), t('settings.profileUpdated'));
    } catch (err: any) {
      const message = err?.response?.data?.message || t('settings.profileUpdateFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
              Alert.alert(t('common.error'), t('settings.userIdNotFound'));
      return;
    }

    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.confirmDeleteAccount'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              // Implement account deletion API call here
              // For now, just logout the user
              Alert.alert(t('common.success'), t('settings.accountDeleted'));
              dispatch(updateUserProfile({})); // Clear user profile on account deletion
              router.push('/');
            } catch (err: any) {
              const message = err?.response?.data?.message || t('settings.accountDeleteFailed');
              Alert.alert(t('common.error'), message);
            } finally {
              setIsDeletingAccount(false);
            }
          }
        }
      ]
    );
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    const currentUserId = getCurrentUserId();
    if (currentUserId && activeTab === 'myAds') {
      await fetchUserSellItemsData(currentUserId);
    }
    setRefreshing(false);
  };

  // Test backend connectivity
  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      const response = await api.get('/api/sell/health');
      console.log('Backend health check response:', response.data);
      Alert.alert(t('common.success'), t('settings.backendWorking'));
    } catch (error: any) {
      console.error('Backend connection test failed:', error);
      Alert.alert(t('common.error'), t('settings.backendConnectionFailed') + ': ' + (error?.response?.data?.message || error.message));
    }
  };

  // Effects - All hooks must be called before any conditional returns
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (activeTab === 'myAds' && currentUserId) {
      fetchUserSellItemsData(currentUserId);
    }
  }, [activeTab, user?._id]);

  // 2. Fix notifications to display real notifications for the user
  useEffect(() => {
    // Example: fetch notifications from backend or local storage
    // Replace this with your actual notification fetching logic
    const fetchNotifications = async () => {
      // Simulate fetching notifications for the current user
      // Replace with real API call if available
      const currentUserId = getCurrentUserId();
      if (!currentUserId) return;
      try {
        // Example: const res = await api.get(`/api/notifications/${currentUserId}`);
        // setUserNotifications(res.data.notifications);
        // For now, simulate with empty array or mock data
        setUserNotifications([]); // Replace with real data
      } catch (err) {
        setUserNotifications([]);
      }
    };
    fetchNotifications();
  }, [user?._id]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <View style={styles.header}>
          <Text style={styles.title}>{t('common.settings')}</Text>
        </View>

        <View style={styles.authPrompt}>
          <Text style={styles.authTitle}>{t('common.login')}</Text>
          <Text style={styles.authSubtitle}>{t('settings.loginToAccessSettings')}</Text>

          <CustomButton
            title={t('common.login')}
            variant="success"
            size="large"
            onPress={() => router.push('/signin')}
            style={styles.loginButton}
          />
        </View>
      </>

    );
  }

  // Fixed logout function
  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.areYouSureLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/signin');
          }
        }
      ]
    );
  };

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                              <Text style={styles.tabTitle}>{t('settings.profileInfo')}</Text>
              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Edit size={16} color={colors.text.white} />
                  <Text style={styles.editButtonText}>{t('settings.edit')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveButton]}
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    <Save size={16} color={colors.text.white} />
                                          <Text style={styles.editButtonText}>
                        {savingProfile ? t('settings.saving') : t('settings.save')}
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={() => setIsEditing(false)}
                  >
                    <X size={16} color={colors.text.white} />
                                          <Text style={styles.editButtonText}>{t('settings.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.profileForm}>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>{t('settings.fullName')}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.formInput}
                    value={editData.name}
                    onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
                                          placeholder={t('settings.enterFullName')}
                  />
                ) : (
                                      <Text style={styles.formValue}>{user?.fullName || t('settings.notProvided')}</Text>
                )}
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>{t('settings.email')}</Text>
                                  <Text style={styles.formValue}>{user?.email || t('settings.notProvided')}</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>{t('settings.phone')}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.formInput}
                    value={editData.phone}
                    onChangeText={(text) => setEditData(prev => ({ ...prev, phone: text }))}
                                          placeholder={t('settings.enterPhone')}
                    keyboardType="phone-pad"
                  />
                ) : (
                                      <Text style={styles.formValue}>{user?.phone || t('settings.notProvided')}</Text>
                )}
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>{t('settings.city')}</Text>
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.formInput}
                    onPress={() => {
                      // Show city picker
                      Alert.alert(
                        t('settings.selectCity'),
                        t('settings.chooseYourCity'),
                        [
                          ...governorates.map(city => ({
                            text: city,
                            onPress: () => setEditData(prev => ({ ...prev, city }))
                          })),
                          { text: t('common.cancel'), style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.formValue, { color: editData.city ? colors.text.primary : colors.text.secondary }]}>
                      {editData.city || t('settings.selectCity')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.formValue}>{(user as any)?.city || t('settings.notProvided')}</Text>
                )}
              </View>
            </View>
          </View>
        );

      case 'myAds':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>{t('settings.myAds')}</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => {
                  const currentUserId = getCurrentUserId();
                  if (currentUserId) fetchUserSellItemsData(currentUserId);
                }}
              >
                <RefreshCw size={16} color={colors.primary.green} />
                <Text style={styles.refreshButtonText}>{t('settings.refresh')}</Text>
              </TouchableOpacity>
            </View>

            {loadingSell ? (
              <View style={styles.emptyState}>
                <Package size={48} color={colors.gray[300]} />
                <Text style={styles.emptyStateText}>{t('settings.loadingAds')}</Text>
              </View>
            ) : sellItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={48} color={colors.gray[300]} />
                <Text style={styles.emptyStateText}>{t('settings.noAdsFound')}</Text>
                <Text style={styles.emptyStateSubtext}>{t('settings.startSelling')}</Text>
              </View>
            ) : (
              <ScrollView style={styles.adsList}>
                {sellItems.map((ad) => (
                  <TouchableOpacity
                    key={ad._id}
                    style={styles.adCard}
                    onPress={() => {
                      setSelectedSell(ad);
                      setIsSellModalOpen(true);
                    }}
                  >
                    <SafeImage
                      source={{ uri: ad.image }}
                      style={styles.adImage}
                      placeholderSize={60}
                    />
                    <View style={styles.adInfo}>
                      <Text style={styles.adTitle}>{ad.partName}</Text>
                      <Text style={styles.adDetails}>
                        {ad.brand} {ad.model} {ad.year} - {ad.city}
                      </Text>
                      <Text style={styles.adPrice}>{ad.price?.toLocaleString()} IQD</Text>
                      <Text style={styles.adDate}>
                        {t('settings.postedOn')} {new Date(ad.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteAdButton}
                      onPress={() => handleDeleteAd(ad._id)}
                      disabled={deletingAdIds.has(ad._id)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        );

      case 'addresses':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>{t('settings.myAddresses')}</Text>

            <View style={styles.profileInfoCard}>
                              <Text style={styles.sectionTitle}>{t('settings.profileInfo')}</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{t('settings.fullName')}</Text>
                                      <Text style={styles.infoValue}>{user?.fullName || t('settings.notProvided')}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{t('settings.email')}</Text>
                                      <Text style={styles.infoValue}>{user?.email || t('settings.notProvided')}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{t('settings.phone')}</Text>
                                      <Text style={styles.infoValue}>{user?.phone || t('settings.notProvided')}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{t('settings.city')}</Text>
                  <Text style={styles.infoValue}>{(user as any)?.city || t('settings.notProvided')}</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'notifications':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>{t('settings.notifications')}</Text>
              <Text style={styles.notificationCount}>{t('settings.newNotifications')}</Text>
            </View>

            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['all', 'unread', 'ad_upload', 'login', 'system'] as const).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterButton,
                      notificationFilter === filter && styles.activeFilterButton
                    ]}
                    onPress={() => setNotificationFilter(filter)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      notificationFilter === filter && styles.activeFilterButtonText
                    ]}>
                      {filter === 'all' ? t('settings.all') :
                        filter === 'unread' ? t('settings.unread') :
                          filter === 'ad_upload' ? t('settings.ads') :
                            filter === 'login' ? t('settings.login') : t('settings.system')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.emptyState}>
              <Bell size={48} color={colors.gray[300]} />
              <Text style={styles.emptyStateText}>{t('settings.noNotificationsFound')}</Text>
              <Text style={styles.emptyStateSubtext}>{t('settings.notificationsWillAppear')}</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'myAds', label: t('settings.myAds'), icon: FileText },
    { id: 'addresses', label: t('settings.myAddresses'), icon: MapPin },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
  ];

  return (
    <>
      <AppHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('common.settings')}</Text>
        </View>

        {/* Profile Card */}
        {/* Avatar and profileCard removed */}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  activeTab === tab.id && styles.activeTabButton
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <tab.icon
                  size={20}
                  color={activeTab === tab.id ? colors.text.white : colors.primary.green}
                />
                <Text style={[
                  styles.tabButtonText,
                  activeTab === tab.id && styles.activeTabButtonText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>

        {/* Language Toggle */}
        <View style={styles.languageContainer}>
          <Text style={styles.languageTitle}>{t('settings.language') || 'Language'}</Text>
          <View style={styles.languageOptionsContainer}>
            {[
              { code: 'en', label: t('settings.english') || 'English', flag: '🇺🇸' },
              { code: 'ar', label: t('settings.arabic') || 'العربية', flag: '🇸🇦' },
              { code: 'ku', label: t('settings.kurdish') || 'کوردی', flag: '🇮🇶' }
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  i18n.language === lang.code && styles.languageOptionActive
                ]}
                onPress={() => i18n.changeLanguage(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageLabel,
                  i18n.language === lang.code && styles.languageLabelActive
                ]}>
                  {lang.label}
                </Text>
                {i18n.language === lang.code && (
                  <View style={styles.languageCheckmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Backend Connection */}
        {/* Test Backend Connection button/section removed */}

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={colors.error} />
            <Text style={styles.logoutText}>{t('common.logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account Button */}
        {/* Delete Account button/section removed */}
      </ScrollView>

      {/* Ad Details Modal */}
      <Modal
        visible={isSellModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSellModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                              <Text style={styles.modalTitle}>{t('settings.adDetails')}</Text>
              <TouchableOpacity onPress={() => setIsSellModalOpen(false)}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedSell && (
              <ScrollView style={styles.modalBody}>
                <SafeImage
                  source={{ uri: selectedSell.image || '' }}
                  style={styles.modalImage}
                  placeholderSize={200}
                />
                <Text style={styles.modalAdTitle}>{selectedSell.partName}</Text>
                <Text style={styles.modalAdDetails}>
                  {selectedSell.brand} {selectedSell.model} {selectedSell.year} - {selectedSell.city}
                </Text>
                <Text style={styles.modalAdPrice}>{selectedSell.price?.toLocaleString()} IQD</Text>
                <Text style={styles.modalAdDescription}>{selectedSell.description}</Text>
                <Text style={styles.modalAdDate}>
                  {t('settings.postedOn')} {new Date(selectedSell.createdAt).toLocaleDateString()}
                </Text>

                {selectedSell.stockCount !== undefined && (
                                          <Text style={styles.modalAdInfo}>{t('settings.stock')}: {selectedSell.stockCount}</Text>
                )}
                {selectedSell.sellerName && (
                                          <Text style={styles.modalAdInfo}>{t('settings.seller')}: {selectedSell.sellerName}</Text>
                )}
                {selectedSell.sellerPhone && (
                                          <Text style={styles.modalAdInfo}>{t('settings.phoneNumber')}: {selectedSell.sellerPhone}</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    flex: 1,
    paddingBottom: 120
  },
  scrollViewContent: {
    paddingBottom: 120 // Ensure content doesn't overlap with tab bar
  },
  header: {
    padding: 20,
    backgroundColor: colors.background.primary
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center'
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16
  },
  authSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22
  },
  loginButton: {
    minWidth: 200
  },
  profileCard: {
    backgroundColor: colors.background.primary,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16
  },
  profileInfo: {
    flex: 1
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary
  },

  // Tab Navigation
  tabContainer: {
    backgroundColor: colors.background.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 8
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 8
  },
  activeTabButton: {
    backgroundColor: colors.primary.green
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.green
  },
  activeTabButtonText: {
    color: colors.text.white
  },

  // Content Container
  contentContainer: {
    backgroundColor: colors.background.primary,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16
  },

  // Tab Content
  tabContent: {
    padding: 20
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary
  },

  // Profile Tab
  profileForm: {
    gap: 16
  },
  formRow: {
    gap: 8
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary
  },
  formValue: {
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  editButtonText: {
    color: colors.text.white,
    fontSize: 14,
    fontWeight: '600'
  },
  editActions: {
    flexDirection: 'row',
    gap: 8
  },
  saveButton: {
    backgroundColor: colors.success
  },
  cancelButton: {
    backgroundColor: colors.gray[500]
  },

  // My Ads Tab
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  refreshButtonText: {
    color: colors.primary.green,
    fontSize: 14,
    fontWeight: '600'
  },
  adsList: {
    maxHeight: 400
  },
  adCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12
  },
  adImage: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  adInfo: {
    flex: 1
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4
  },
  adDetails: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4
  },
  adPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.green,
    marginBottom: 2
  },
  adDate: {
    fontSize: 12,
    color: colors.text.secondary
  },
  deleteAdButton: {
    padding: 8,
    backgroundColor: colors.error + '20',
    borderRadius: 8
  },

  // Addresses Tab
  profileInfoCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16
  },
  infoGrid: {
    gap: 12
  },
  infoItem: {
    gap: 4
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background.primary,
    borderRadius: 8
  },

  // Notifications Tab
  notificationCount: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600'
  },
  filterContainer: {
    marginBottom: 20
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8
  },
  activeFilterButton: {
    backgroundColor: colors.primary.green
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text.secondary
  },
  activeFilterButtonText: {
    color: colors.text.white
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center'
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center'
  },

  // Language and Logout
  languageContainer: {
    marginHorizontal: 16,
    marginBottom: 16
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12
  },
  languageOptionsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    width: '33.33%', // For 3 options
  },
  languageOptionActive: {
    backgroundColor: colors.primary.green,
    borderColor: colors.primary.green,
    borderWidth: 1,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  languageLabelActive: {
    color: colors.text.white,
  },
  languageCheckmark: {
    position: 'absolute',
    right: 12,
    backgroundColor: colors.success + '20',
    borderRadius: 8,
    padding: 4,
  },
  checkmarkText: {
    fontSize: 16,
    color: colors.success,
  },
  testContainer: {
    marginHorizontal: 16,
    marginBottom: 16
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.green
  },
  logoutContainer: {
    marginHorizontal: 16,
    marginBottom: 16
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error
  },

  // Delete Account
  deleteAccountContainer: {
    marginHorizontal: 16,
    marginBottom: 32
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '20',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200]
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary
  },
  modalBody: {
    padding: 20
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16
  },
  modalAdTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8
  },
  modalAdDetails: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8
  },
  modalAdPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.green,
    marginBottom: 8
  },
  modalAdDescription: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
    lineHeight: 20
  },
  modalAdDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8
  },
  modalAdInfo: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 4
  },
});