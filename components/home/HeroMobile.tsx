import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, DollarSign, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

export default function HeroMobile() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const videoRef = useRef(null);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ku';

  const handleBuyClick = () => router.push('/(tabs)/buy');
  const handleSellClick = () => router.push('/sell');
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Use router.push with the correct params structure for Expo Router
      router.push({
        pathname: '/(tabs)/buy',
        params: {
          query: searchQuery.trim()
        }
      });
      // Clear the search input after navigation
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Video
          ref={videoRef}
          source={{ uri: 'https://sedge.in/Lokis_collections/sv.mp4' }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted
          shouldPlay
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          <Text style={styles.gradientText}>{t('home.heroTitle')}</Text>
        </Text>
        <Text style={styles.subtitle}>{t('home.heroSubtitle')}</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('home.searchPlaceholder')}
            style={[
              styles.searchInput,
              isRTL && { textAlign: 'right', writingDirection: 'rtl' }
            ]}
            placeholderTextColor="#888"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Search color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyClick}>
            <ShoppingCart color="#fff" size={20} />
            <Text style={styles.buttonText}>{t('common.buy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sellButton} onPress={handleSellClick}>
            <DollarSign color="#fff" size={20} />
            <Text style={styles.buttonText}>{t('common.sell')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000',
  },
  content: {
    zIndex: 2,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: Platform.OS === 'android' ? 30 : 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  gradientText: {
    color: '#7F5FFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#eee',
    marginBottom: 24,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#222',
    borderRadius: 16,
  },
  searchButton: {
    backgroundColor: '#7F5FFF',
    padding: 12,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
