import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch
} from 'react-native';
import { ArrowLeft, Bell, ShoppingCart, MessageCircle, Star, Truck, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { markAsRead as markAsReadAction } from '@/store/notificationsSlice';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: any;
  enabled: boolean;
  type: 'push' | 'email' | 'sms';
}

// Notifications now come from Redux store

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notifications.items);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: '1',
      title: 'Order Updates',
      description: 'Get notified about order status changes',
      icon: ShoppingCart,
      enabled: true,
      type: 'push'
    },
    {
      id: '2',
      title: 'New Messages',
      description: 'Receive notifications for new messages',
      icon: MessageCircle,
      enabled: true,
      type: 'push'
    },
    {
      id: '3',
      title: 'Review Requests',
      description: 'Get reminded to review your purchases',
      icon: Star,
      enabled: false,
      type: 'push'
    },
    {
      id: '4',
      title: 'Delivery Updates',
      description: 'Track your delivery status',
      icon: Truck,
      enabled: true,
      type: 'push'
    },
    {
      id: '5',
      title: 'System Alerts',
      description: 'Important system notifications',
      icon: AlertCircle,
      enabled: true,
      type: 'push'
    }
  ]);

  const handleBack = () => {
    router.back();
  };

  const toggleNotificationSetting = (id: string) => {
    setNotificationSettings((settings: NotificationSetting[]) =>
      settings.map((setting: NotificationSetting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const markAsRead = (id: string) => {
    dispatch(markAsReadAction(id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'message': return MessageCircle;
      case 'review': return Star;
      case 'delivery': return Truck;
      case 'system': return AlertCircle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return colors.primary.green;
      case 'message': return colors.info;
      case 'review': return colors.warning;
      case 'delivery': return colors.success;
      case 'system': return colors.error;
      default: return colors.gray[500];
    }
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.notifications')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            <View style={styles.settingsContainer}>
              {notificationSettings.map((setting: NotificationSetting) => {
                const IconComponent = setting.icon;
                return (
                  <View key={setting.id} style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                      <View style={styles.settingIconContainer}>
                        <IconComponent size={20} color={colors.primary.green} />
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingTitle}>{setting.title}</Text>
                        <Text style={styles.settingDescription}>{setting.description}</Text>
                      </View>
                    </View>
                    <Switch
                      value={setting.enabled}
                      onValueChange={() => toggleNotificationSetting(setting.id)}
                      trackColor={{ false: colors.gray[300], true: colors.primary.green }}
                      thumbColor={colors.background.primary}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Notifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.notificationsContainer}>
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification
                    ]}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <View style={styles.notificationLeft}>
                      <View style={[styles.notificationIconContainer, { backgroundColor: `${iconColor}20` }]}>
                        <IconComponent size={20} color={iconColor} />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={[
                          styles.notificationTitle,
                          !notification.read && styles.unreadTitle
                        ]}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>{notification.time}</Text>
                      </View>
                    </View>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.white
  },
  settingsContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden'
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100]
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  settingContent: {
    flex: 1
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2
  },
  settingDescription: {
    fontSize: 12,
    color: colors.text.secondary
  },
  notificationsContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden'
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100]
  },
  unreadNotification: {
    backgroundColor: colors.gray[50]
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4
  },
  unreadTitle: {
    fontWeight: '600'
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 4
  },
  notificationTime: {
    fontSize: 11,
    color: colors.text.secondary
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.green
  }
});