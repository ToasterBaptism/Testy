/**
 * About Screen - App information and ethics statement
 * Comprehensive information about FortniteAssist's mission and ethical boundaries
 */

import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Components
import AccessibleButton from '@/components/AccessibleButton';

// Services
import {announceToUser} from '@/services/audio';

// Store
import {selectSettings} from '@/services/store';

// Types
import type {ScreenProps} from '@/types';

const AboutScreen: React.FC<ScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const settings = useSelector(selectSettings);

  useEffect(() => {
    announceToUser('About FortniteAssist screen loaded. Learn about our mission and ethical commitment.');
  }, []);

  /**
   * Open external link with confirmation
   */
  const openLink = (url: string, title: string) => {
    Alert.alert(
      'Open External Link',
      `This will open ${title} in your browser. Continue?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Open',
          onPress: () => {
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Could not open the link');
            });
          },
        },
      ],
    );
  };

  /**
   * Render a section with title and content
   */
  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          settings.largeTextMode && styles.largeText,
          settings.highContrastMode && styles.highContrastText,
        ]}
        accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );

  /**
   * Render paragraph text
   */
  const renderParagraph = (text: string, style?: any) => (
    <Text
      style={[
        styles.paragraph,
        settings.largeTextMode && styles.largeParagraph,
        settings.highContrastMode && styles.highContrastText,
        style,
      ]}
      accessible={true}
      accessibilityRole="text">
      {text}
    </Text>
  );

  return (
    <ScrollView
      style={[styles.container, {paddingTop: insets.top}]}
      contentContainerStyle={styles.contentContainer}
      accessibilityRole="main">

      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>FA</Text>
        </View>
        <Text
          style={[
            styles.appTitle,
            settings.largeTextMode && styles.largeTitle,
            settings.highContrastMode && styles.highContrastText,
          ]}>
          FortniteAssist
        </Text>
        <Text
          style={[
            styles.version,
            settings.largeTextMode && styles.largeText,
            settings.highContrastMode && styles.highContrastText,
          ]}>
          Version 1.0.0
        </Text>
      </View>

      {/* Mission Statement */}
      {renderSection(
        '🎯 Our Mission',
        <>
          {renderParagraph(
            'FortniteAssist empowers blind, visually impaired, and physically disabled individuals to play Fortnite Mobile independently through real-time on-device AI vision that detects enemies, weapons, and critical game elements — then provides adaptive aim guidance via simulated input using Android\'s Accessibility Service.',
            styles.missionText,
          )}
          {renderParagraph(
            'This is NOT a cheat tool. It is an assistive technology designed to level the playing field for players who cannot see or operate standard controls due to disability.',
            styles.emphasisText,
          )}
        </>,
      )}

      {/* Core Principles */}
      {renderSection(
        '⚖️ Core Principles',
        <>
          <View style={styles.principleItem}>
            <Text style={[styles.principleTitle, settings.largeTextMode && styles.largeText]}>
              🔍 Accessibility First
            </Text>
            {renderParagraph(
              'UI/UX fully navigable via TalkBack, switch control, voice navigation, haptics, and audio cues. Prioritizes users with low/no vision or motor limitations.',
            )}
          </View>

          <View style={styles.principleItem}>
            <Text style={[styles.principleTitle, settings.largeTextMode && styles.largeText]}>
              🔒 Privacy by Design
            </Text>
            {renderParagraph(
              'Zero off-device data transmission without explicit consent. All AI inference, screen capture, and input simulation occur locally on your device.',
            )}
          </View>

          <View style={styles.principleItem}>
            <Text style={[styles.principleTitle, settings.largeTextMode && styles.largeText]}>
              🛡️ Ethical Boundaries
            </Text>
            {renderParagraph(
              'Must not provide unfair competitive advantage. Designed strictly as an assistive tool, not a cheat engine. Includes third-party ethics review.',
            )}
          </View>

          <View style={styles.principleItem}>
            <Text style={[styles.principleTitle, settings.largeTextMode && styles.largeText]}>
              ⚡ Performance Optimized
            </Text>
            {renderParagraph(
              'Runs smoothly on mid-tier devices. Minimizes battery drain, frame latency (<100ms), and memory usage.',
            )}
          </View>
        </>,
      )}

      {/* What FortniteAssist Does */}
      {renderSection(
        '✅ What FortniteAssist Does',
        <>
          {renderParagraph('• Detects enemies and weapons using on-device AI')}
          {renderParagraph('• Provides aim guidance through accessibility services')}
          {renderParagraph('• Offers audio and haptic feedback for game events')}
          {renderParagraph('• Operates entirely on your device for privacy')}
          {renderParagraph('• Assists players with visual or motor disabilities')}
          {renderParagraph('• Includes anti-abuse safeguards and behavioral monitoring')}
        </>,
      )}

      {/* What FortniteAssist Does NOT Do */}
      {renderSection(
        '❌ What FortniteAssist Does NOT Do',
        <>
          {renderParagraph('• Modify game files or memory', styles.warningText)}
          {renderParagraph('• Send packets to servers beyond normal gameplay', styles.warningText)}
          {renderParagraph('• Provide aimbot-style targeting or ESP features', styles.warningText)}
          {renderParagraph('• Bypass anti-cheat systems intentionally', styles.warningText)}
          {renderParagraph('• Transmit your data to external servers', styles.warningText)}
          {renderParagraph('• Give unfair advantages to non-disabled players', styles.warningText)}
        </>,
      )}

      {/* Technical Information */}
      {renderSection(
        '🔧 Technical Information',
        <>
          {renderParagraph('Built with React Native and Kotlin for optimal performance and accessibility.')}
          {renderParagraph('Uses TensorFlow Lite for on-device AI inference with GPU acceleration when available.')}
          {renderParagraph('Implements Android\'s MediaProjection API for screen capture and AccessibilityService for input assistance.')}
          {renderParagraph('All processing occurs locally - no cloud services or external data transmission.')}
        </>,
      )}

      {/* Legal and Ethics */}
      {renderSection(
        '⚖️ Legal and Ethics',
        <>
          {renderParagraph(
            'FortniteAssist has undergone third-party ethics review to ensure it remains within the bounds of assistive technology. It is designed to help players with disabilities participate in gaming, not to provide competitive advantages.',
          )}
          {renderParagraph(
            'Use of this application should comply with Epic Games\' Terms of Service and Community Guidelines. Users are responsible for ensuring their use aligns with applicable game rules and regulations.',
          )}
        </>,
      )}

      {/* Support and Contact */}
      {renderSection(
        '📞 Support and Contact',
        <>
          {renderParagraph(
            'For technical support, accessibility assistance, or to report issues, please use the built-in feedback system or contact us through your device\'s accessibility settings.',
          )}
          
          <View style={styles.linksContainer}>
            <AccessibleButton
              title="Privacy Policy"
              onPress={() => openLink('https://example.com/privacy', 'Privacy Policy')}
              variant="secondary"
              size="medium"
              style={styles.linkButton}
              accessibilityHint="Opens privacy policy in browser"
            />
            
            <AccessibleButton
              title="Terms of Service"
              onPress={() => openLink('https://example.com/terms', 'Terms of Service')}
              variant="secondary"
              size="medium"
              style={styles.linkButton}
              accessibilityHint="Opens terms of service in browser"
            />
            
            <AccessibleButton
              title="Accessibility Guide"
              onPress={() => openLink('https://example.com/accessibility', 'Accessibility Guide')}
              variant="secondary"
              size="medium"
              style={styles.linkButton}
              accessibilityHint="Opens accessibility guide in browser"
            />
          </View>
        </>,
      )}

      {/* Acknowledgments */}
      {renderSection(
        '🙏 Acknowledgments',
        <>
          {renderParagraph(
            'FortniteAssist was developed with input from the disability gaming community, accessibility experts, and ethics reviewers. We thank all contributors who helped ensure this tool serves its intended purpose responsibly.',
          )}
          {renderParagraph(
            'Special thanks to organizations advocating for accessible gaming and the developers of the open-source libraries that make this project possible.',
          )}
        </>,
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.footerText,
            settings.largeTextMode && styles.largeText,
            settings.highContrastMode && styles.highContrastText,
          ]}>
          © 2025 FortniteAssist Team
        </Text>
        <Text
          style={[
            styles.footerText,
            settings.largeTextMode && styles.largeText,
            settings.highContrastMode && styles.highContrastText,
          ]}>
          Assistive Technology • Privacy First • Ethics Reviewed
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#757575',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
    marginBottom: 12,
  },
  missionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1976D2',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  emphasisText: {
    fontWeight: 'bold',
    color: '#F44336',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  warningText: {
    color: '#F44336',
    fontWeight: '500',
  },
  principleItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  principleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  linksContainer: {
    marginTop: 16,
  },
  linkButton: {
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 4,
  },
  largeText: {
    fontSize: 18,
  },
  largeTitle: {
    fontSize: 32,
  },
  largeParagraph: {
    fontSize: 18,
  },
  highContrastText: {
    color: '#000000',
    fontWeight: 'bold',
  },
});

export default AboutScreen;