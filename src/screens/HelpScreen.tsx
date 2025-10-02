import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const HelpScreen: React.FC = () => {
  const helpSections = [
    {
      title: 'Getting Started',
      content: [
        '1. Grant all required permissions in the Permissions screen',
        '2. Configure your settings in the Settings screen',
        '3. Start Fortnite Mobile and return to this app',
        '4. Tap "Start Assistance" to begin AI-powered aim assistance',
      ],
    },
    {
      title: 'Features',
      content: [
        '• Real-time enemy detection using on-device AI',
        '• Adaptive aim guidance for improved accuracy',
        '• Customizable sensitivity and response settings',
        '• Full accessibility support with TalkBack',
        '• Privacy-first design with no data transmission',
      ],
    },
    {
      title: 'Accessibility Features',
      content: [
        '• Full TalkBack screen reader support',
        '• High contrast mode for better visibility',
        '• Large text options for easier reading',
        '• Haptic feedback for important actions',
        '• Audio cues for game events',
      ],
    },
    {
      title: 'Troubleshooting',
      content: [
        '• If aim assistance is not working, check permissions',
        '• Ensure Fortnite Mobile is running in the foreground',
        '• Try adjusting sensitivity settings if responses feel off',
        '• Restart the app if you experience any issues',
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} accessibilityLabel="Help screen">
      <Text style={styles.title} accessibilityRole="header">
        Help & Support
      </Text>
      
      <Text style={styles.subtitle}>
        Learn how to use FortniteAssist effectively
      </Text>

      {helpSections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {section.title}
          </Text>
          {section.content.map((item, itemIndex) => (
            <Text key={itemIndex} style={styles.sectionContent}>
              {item}
            </Text>
          ))}
        </View>
      ))}

      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Need More Help?</Text>
        <Text style={styles.sectionContent}>
          This is an assistive technology designed to help players with disabilities.
          For technical support or feedback, please refer to the project documentation.
        </Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => console.log('Opening documentation')}
          accessibilityRole="button"
          accessibilityLabel="View documentation"
        >
          <Text style={styles.buttonText}>View Documentation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  sectionContent: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpScreen;