import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';

interface ScreenContainerProps {
  children: React.ReactNode;
  title?: string;
  scrollable?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export default function ScreenContainer({ 
  children, 
  title, 
  scrollable = true,
  showCloseButton = false,
  onClose
}: ScreenContainerProps) {
  const Content = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {showCloseButton && onClose && (
              <Pressable 
                onPress={onClose} 
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed
                ]}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            )}
          </View>
        )}
        <Content style={styles.content} contentContainerStyle={scrollable ? styles.contentContainer : undefined}>
          {children}
        </Content>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonPressed: {
    backgroundColor: '#E0E0E0',
  },
  closeButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 20,
    color: '#666',
    fontWeight: FONT_WEIGHTS.regular,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});



