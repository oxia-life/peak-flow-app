import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/AppNavigator';

export default function App() {
  useEffect(() => {
    // Регистрация Service Worker для PWA (только на веб)
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(registration => {
            console.log('✅ Service Worker registered:', registration);
          })
          .catch(error => {
            console.log('❌ Service Worker registration failed:', error);
          });
      });
    }

    // Vercel Analytics - работает только на веб
    if (Platform.OS === 'web') {
      import('@vercel/analytics').then(({ inject }) => {
        inject();
        console.log('✅ Vercel Analytics initialized');
      }).catch(error => {
        console.log('❌ Vercel Analytics failed:', error);
      });
    }
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}



