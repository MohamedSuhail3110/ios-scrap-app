import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const SellStatusPage = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const steps = [
    { id: 'posted', label: t('sellStatus.steps.posted'), status: 'completed', icon: 'checkmark-circle' },
    { id: 'review', label: t('sellStatus.steps.review'), status: 'in_progress', icon: 'time' },
    { id: 'completed', label: t('sellStatus.steps.completed'), status: 'pending', icon: 'checkmark-circle' }
  ];

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <LinearGradient
          colors={[ '#7C3AED', '#2563EB', '#06B6D4' ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {t('sellStatus.title')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t('sellStatus.subtitle')}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Status Timeline */}
          <View style={styles.statusCard}>
            <View style={styles.timelineContainer}>
              <View style={styles.timelineLine} />
              
              <View style={styles.stepsContainer}>
                {steps.map((step, index) => (
                  <View key={step.id} style={styles.stepItem}>
                    <View 
                      style={[
                        styles.stepIcon,
                        step.status === 'completed' && styles.stepIconCompleted,
                        step.status === 'in_progress' && styles.stepIconInProgress,
                        step.status === 'pending' && styles.stepIconPending
                      ]}
                    >
                      <Ionicons 
                        name={step.icon as any} 
                        size={32} 
                        color={
                          step.status === 'completed' 
                            ? colors.text.white 
                            : step.status === 'in_progress'
                              ? colors.text.white
                              : colors.text.secondary
                        } 
                      />
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[
                        styles.stepLabel,
                        step.status === 'completed' && styles.stepLabelCompleted,
                        step.status === 'in_progress' && styles.stepLabelInProgress,
                        step.status === 'pending' && styles.stepLabelPending
                      ]}>
                        {step.label}
                      </Text>
                      {step.status === 'in_progress' && (
                        <Text style={styles.stepDescription}>
                          {t('sellStatus.reviewMessage')}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>
              {t('sellStatus.assistance.title')}
            </Text>
            <View style={styles.contactItems}>
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <Ionicons name="call" size={24} color={colors.primary.green} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>{t('sellStatus.assistance.phone')}</Text>
                  <Text style={styles.contactValue}>+1 (555) 123-4567</Text>
                </View>
              </View>
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <Ionicons name="mail" size={24} color={colors.primary.green} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>{t('sellStatus.assistance.email')}</Text>
                  <Text style={styles.contactValue}>support@scrap.com</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Back to Home Button */}
          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <Text style={styles.homeButtonText}>{t('sellStatus.backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'relative',
    paddingTop: 96,
    paddingBottom: 48,
    overflow: 'hidden',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 44,
    fontWeight: 'bold',
    color: colors.text.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.white,
    opacity: 0.95,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 32,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.gray[400],
  },
  stepsContainer: {
    gap: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[400],
    marginRight: 24,
    zIndex: 1,
  },
  stepIconCompleted: {
    backgroundColor: colors.primary.green,
  },
  stepIconInProgress: {
    backgroundColor: colors.primary.blue || '#3B82F6',
  },
  stepIconPending: {
    backgroundColor: colors.gray[400],
  },
  stepContent: {
    flex: 1,
    paddingTop: 8,
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  stepLabelCompleted: {
    color: colors.primary.green,
  },
  stepLabelInProgress: {
    color: colors.primary.blue || '#3B82F6',
  },
  stepLabelPending: {
    color: colors.text.secondary,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  contactCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  contactTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.white,
    marginBottom: 24,
  },
  contactItems: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.white,
  },
  homeButton: {
    backgroundColor: colors.primary.green,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  homeButtonText: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SellStatusPage;
