import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  { question: 'How do I send crypto?', answer: 'Go to the Send tab, enter the recipient address or scan a QR code, enter the amount, and confirm the transaction.' },
  { question: 'How do I receive crypto?', answer: 'Share your wallet address or QR code from the Receive screen. The sender can scan your QR code or use your address.' },
  { question: 'What is an escrow payment?', answer: 'An escrow payment holds funds securely until the recipient claims them. The sender can set an expiration time.' },
  { question: 'How do I claim a payment?', answer: 'If you received a payment link, open it to claim the funds. The funds will be sent to your embedded wallet.' },
  { question: 'What networks are supported?', answer: 'Base Sepolia, Celo Alfajores, and Polygon Amoy testnets are currently supported.' },
  { question: 'Is my wallet secure?', answer: 'Yes, your wallet is secured by Privy with encryption. Never share your recovery phrase.' },
];

export default function HelpSupportScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@peysos.com?subject=PeysOS%20Support%20Request').catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  const handleOpenDiscord = () => {
    Linking.openURL('https://discord.gg/peysos').catch(() => {
      Alert.alert('Error', 'Could not open Discord');
    });
  };

  const handleOpenTwitter = () => {
    Linking.openURL('https://twitter.com/peysos').catch(() => {
      Alert.alert('Error', 'Could not open Twitter');
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Quick Help</Text>
        
        <TouchableOpacity style={[styles.helpCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.helpIcon, { backgroundColor: '#007AFF20' }]}>
            <Ionicons name="document-text-outline" size={24} color="#007AFF" />
          </View>
          <View style={styles.helpContent}>
            <Text style={[styles.helpTitle, { color: theme.text }]}>FAQ</Text>
            <Text style={[styles.helpDesc, { color: theme.textSecondary }]}>Find answers to common questions</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.helpCard, { backgroundColor: theme.surface }]} onPress={handleContactSupport}>
          <View style={[styles.helpIcon, { backgroundColor: '#34C75920' }]}>
            <Ionicons name="mail-outline" size={24} color="#34C759" />
          </View>
          <View style={styles.helpContent}>
            <Text style={[styles.helpTitle, { color: theme.text }]}>Contact Support</Text>
            <Text style={[styles.helpDesc, { color: theme.textSecondary }]}>Email our support team</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>FAQ</Text>
        
        {FAQS.map((faq, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.faqItem, { backgroundColor: theme.surface }]}
            onPress={() => toggleFAQ(index)}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.question}</Text>
              <Ionicons 
                name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.textTertiary} 
              />
            </View>
            {expandedFAQ === index && (
              <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Community</Text>
        
        <TouchableOpacity style={[styles.communityCard, { backgroundColor: theme.surface }]} onPress={handleOpenDiscord}>
          <View style={[styles.communityIcon, { backgroundColor: '#5865F220' }]}>
            <Ionicons name="logo-discord" size={24} color="#5865F2" />
          </View>
          <View style={styles.communityContent}>
            <Text style={[styles.communityTitle, { color: theme.text }]}>Discord</Text>
            <Text style={[styles.communityDesc, { color: theme.textSecondary }]}>Join our community</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={theme.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.communityCard, { backgroundColor: theme.surface }]} onPress={handleOpenTwitter}>
          <View style={[styles.communityIcon, { backgroundColor: '#1DA1F220' }]}>
            <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
          </View>
          <View style={styles.communityContent}>
            <Text style={[styles.communityTitle, { color: theme.text }]}>Twitter</Text>
            <Text style={[styles.communityDesc, { color: theme.textSecondary }]}>Follow us for updates</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Legal</Text>
        
        <TouchableOpacity style={[styles.legalItem, { backgroundColor: theme.surface }]} onPress={() => Alert.alert('Terms', 'Terms of Service content would be shown here')}>
          <Text style={[styles.legalText, { color: theme.text }]}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.legalItem, { backgroundColor: theme.surface }]} onPress={() => Alert.alert('Privacy', 'Privacy Policy content would be shown here')}>
          <Text style={[styles.legalText, { color: theme.text }]}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.legalItem, { backgroundColor: theme.surface }]} onPress={() => Alert.alert('License', 'Open source licenses')}>
          <Text style={[styles.legalText, { color: theme.text }]}>Open Source Licenses</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: theme.textTertiary }]}>PeysOS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.md },
  helpCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  helpIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  helpContent: { flex: 1, marginLeft: spacing.md },
  helpTitle: { fontSize: 16, fontWeight: '600' },
  helpDesc: { fontSize: 13, marginTop: 2 },
  faqItem: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 15, fontWeight: '500', flex: 1, marginRight: spacing.md },
  faqAnswer: { fontSize: 14, marginTop: spacing.md, lineHeight: 20 },
  communityCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  communityIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  communityContent: { flex: 1, marginLeft: spacing.md },
  communityTitle: { fontSize: 16, fontWeight: '600' },
  communityDesc: { fontSize: 13, marginTop: 2 },
  legalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  legalText: { fontSize: 15 },
  version: { textAlign: 'center', fontSize: 12, padding: spacing.xl, paddingBottom: 40 },
});