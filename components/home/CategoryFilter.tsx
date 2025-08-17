import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { categories } from '@/constants/data';
import { colors } from '@/constants/colors';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { t, i18n } = useTranslation();
  const isKurdish = i18n.language === 'ku';

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryItem,
            selectedCategory === null && styles.selectedCategory
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Text style={[
            styles.categoryText,
            selectedCategory === null && styles.selectedText
          ]}>
            {t('common.all', 'All')}
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategory === category.id && styles.selectedCategory
            ]}
            onPress={() => onSelectCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.selectedText
            ]}>
              {isKurdish ? category.nameKu : category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16
  },
  scrollContent: {
    paddingHorizontal: 16
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200]
  },
  selectedCategory: {
    backgroundColor: '#28a745',
    borderColor: '#28a745'
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary
  },
  selectedText: {
    color: colors.text.white
  }
});