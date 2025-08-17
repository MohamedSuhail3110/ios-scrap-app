import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

interface AppHeaderProps {
  notificationCount?: number;
}

const AppHeader: React.FC<AppHeaderProps> = ({ notificationCount = 0 }) => {
  const router = useRouter();

  const handleNotificationPress = () => {
    // Navigate to settings and activate notifications tab
    router.push({ pathname: '/settings', params: { tab: 'notifications' } });
  };

  return (
    <View style={styles.header}>
      {/* Logo Video on the left */}
      <View style={styles.logoContainer}>
        <Video
          source={{ uri: 'https://sedge.in/Lokis_collections/scrap-video.mp4' }}
          style={styles.logo}
          resizeMode="contain"
          isLooping
          isMuted
          shouldPlay
        />
      </View>
      {/* Notification icon on the right */}
      <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress} activeOpacity={0.7}>
        <Bell size={Platform.OS === 'ios' ? 22 : 20} color="#fff" />
        {notificationCount > 0 && (
          <View style={styles.notificationDot} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 16, // Safe for notch
    paddingBottom: 8,
    backgroundColor: '#000', // solid black
    zIndex: 100,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logo: {
    width: Platform.OS === 'ios' ? Math.min(screenWidth * 0.28, 110) : 90,
    height: Platform.OS === 'ios' ? 44 : 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});

export default AppHeader;
