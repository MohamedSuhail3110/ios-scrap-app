import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { colors } from '@/constants/colors';

interface TermsAndConditionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <Text style={styles.title}>Scrap Global – Privacy Policy & Terms & Conditions</Text>
              
              <Text style={styles.sectionTitle}>Privacy Policy – Scrap Global</Text>
              <Text style={styles.bodyText}>
                Effective Date: 18/08/2025
                {
''}
                Company Name: Scrap Global
                {
''}
                Contact Email: info@scrap-global.com
                {

''}
                Scrap Global (“we,” “our,” “us”) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform, www.scrap-global.com.
              </Text>

              <Text style={styles.subHeader}>1. Information We Collect</Text>
              <Text style={styles.bodyText}>
                We may collect personal details (name, email, phone, address), vehicle information, transaction details, and technical data (cookies, IP, device info).
              </Text>

              <Text style={styles.subHeader}>2. How We Use Your Information</Text>
              <Text style={styles.bodyText}>
                - Provide and improve services
                {
''}
                - Facilitate transactions
                {
''}
                - Process payments
                {
''}
                - Communicate with users
                {
''}
                - Marketing (with consent)
                {
''}
                - Fraud prevention & legal compliance
              </Text>

              <Text style={styles.subHeader}>3. Data Sharing</Text>
              <Text style={styles.bodyText}>
                Shared with service providers, business partners, and legal authorities as required. Never sold to third parties.
              </Text>

              <Text style={styles.subHeader}>4. User Rights</Text>
              <Text style={styles.bodyText}>
                You may access, correct, delete, or restrict processing of your data by contacting info@scrap-global.com.
              </Text>

              <Text style={styles.subHeader}>5. Cookies</Text>
              <Text style={styles.bodyText}>
                We use cookies to improve functionality and user experience.
              </Text>

              <Text style={styles.subHeader}>6. Data Security</Text>
              <Text style={styles.bodyText}>
                Reasonable measures taken, but no system is 100% secure.
              </Text>

              <Text style={styles.subHeader}>7. Governing Law</Text>
              <Text style={styles.bodyText}>
                This Privacy Policy is governed by the laws of Iraq.
              </Text>

              <Text style={styles.sectionTitle}>Terms & Conditions – Scrap Global</Text>
              <Text style={styles.bodyText}>
                Effective Date: [Insert Date]
                {
''}
                Company Name: Scrap Global
                {
''}
                Contact Email: info@scrap-global.com
              </Text>

              <Text style={styles.subHeader}>1. Eligibility</Text>
              <Text style={styles.bodyText}>
                Users must be 18+. Information provided must be accurate.
              </Text>

              <Text style={styles.subHeader}>2. Services</Text>
              <Text style={styles.bodyText}>
                Scrap Global provides a platform for buying, selling, and exchanging car parts. We are not responsible for quality or accuracy of listings.
              </Text>

              <Text style={styles.subHeader}>3. User Responsibilities</Text>
              <Text style={styles.bodyText}>
                - No illegal or fraudulent use
                {
''}
                - Maintain account confidentiality
                {
''}
                - No harmful content
              </Text>

              <Text style={styles.subHeader}>4. Payments & Transactions</Text>
              <Text style={styles.bodyText}>
                Payments via secure third-party providers. Scrap Global not responsible for disputes. Refunds depend on seller policies.
              </Text>

              <Text style={styles.subHeader}>5. Intellectual Property</Text>
              <Text style={styles.bodyText}>
                All website content belongs to Scrap Global or licensors. No copying or distribution without permission.
              </Text>

              <Text style={styles.subHeader}>6. Limitation of Liability</Text>
              <Text style={styles.bodyText}>
                We are not liable for damages arising from disputes, downtime, or misuse. Liability capped at fees paid.
              </Text>

              <Text style={styles.subHeader}>7. Termination</Text>
              <Text style={styles.bodyText}>
                Accounts violating these Terms may be suspended or terminated.
              </Text>

              <Text style={styles.subHeader}>8. Governing Law</Text>
              <Text style={styles.bodyText}>
                These Terms are governed by Iraqi law. Disputes subject to Iraqi courts.
              </Text>
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: colors.text.primary,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: colors.text.primary,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: colors.primary.green,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TermsAndConditionsModal;