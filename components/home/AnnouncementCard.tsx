import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/colors';

interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    time: string;
    image?: string | null;
    createdAt?: string;
  };
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Date Tag - Top Left */}
      <View style={styles.dateTag}>
        <Text style={styles.dateText}>{announcement.time}</Text>
      </View>
      {/* Content or Image */}
      {announcement.image && !imageError ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: announcement.image }}
            style={styles.image}
            resizeMode="cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageLoading && (
            <View style={styles.imageLoading}>
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          )}
          <Text style={styles.title}>{announcement.title || t('home.announcementDefaultTitle')}</Text>
        </View>
      ) : (
        <View style={styles.textContainer}>
          <Text style={styles.title}>{announcement.title || t('home.announcementDefaultTitle')}</Text>
          <Text style={styles.content}>{announcement.content || t('home.announcementDefaultContent')}</Text>
          {announcement.image && imageError && (
            <Text style={styles.imageErrorText}>{t('common.imageLoadError')}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 160,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginTop:20,
    marginBottom:20,
    marginHorizontal: 8,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden'
  },
  dateTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200]
  },
  dateText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.gray[700]
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8
  },
  content: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20
  },
  imageErrorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 8
  }
});