import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { API_BASE_URL } from '@/lib/api';

interface ImageTestProps {
  imageUrl: string | null | undefined;
}

export default function ImageTest({ imageUrl }: ImageTestProps) {
  const [testResult, setTestResult] = useState<string>('');

  const testImageUrl = async () => {
    if (!imageUrl) {
      setTestResult('No image URL provided');
      return;
    }

    try {
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
      console.log('Testing image URL:', fullUrl);
      
      const response = await fetch(fullUrl, { method: 'HEAD' });
      console.log('Image test response:', response.status, response.statusText);
      
      if (response.ok) {
        setTestResult(`✅ Image accessible (${response.status})`);
      } else {
        setTestResult(`❌ Image not accessible (${response.status})`);
      }
    } catch (error) {
      console.error('Image test error:', error);
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Image URL Test:</Text>
      <Text style={styles.url}>{imageUrl || 'No URL'}</Text>
      <TouchableOpacity style={styles.testButton} onPress={testImageUrl}>
        <Text style={styles.testButtonText}>Test URL</Text>
      </TouchableOpacity>
      {testResult ? (
        <Text style={styles.result}>{testResult}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    marginVertical: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  url: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: colors.primary.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  result: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
});
