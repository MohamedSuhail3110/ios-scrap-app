import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Video } from 'expo-av';

interface VideoBackgroundProps {
  source: string;
  children: React.ReactNode;
  overlayOpacity?: number;
}

export default function VideoBackground({ source, children, overlayOpacity = 0.5 }: VideoBackgroundProps) {
  // For web platform, we'll use a background image instead of video to avoid issues
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View 
          style={[
            styles.video, 
            { 
              backgroundImage: `url(${source})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: 'transparent'
            }
          ]} 
        />
        
        <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]} />
        
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  // For native platforms, use the Video component
  return (
    <View style={styles.container}>
      <Video
        source={{ uri: source }}
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping
        isMuted
        onError={(error) => console.log('Video error:', error)}
      />
      
      <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]} />
      
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 300,
    position: 'relative',
    overflow: 'hidden'
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  }
});