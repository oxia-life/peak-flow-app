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
      try {
        import('@vercel/analytics').then((module) => {
          if (module && module.inject) {
            module.inject();
            console.log('✅ Vercel Analytics initialized');
          }
        }).catch(error => {
          console.log('❌ Vercel Analytics failed:', error);
        });
      } catch (error) {
        console.log('❌ Vercel Analytics import failed:', error);
      }

      // Yandex.Metrika - работает только на веб
      try {
        // Инициализируем функцию ym до загрузки скрипта
        (window as any).ym = (window as any).ym || function() {
          ((window as any).ym.a = (window as any).ym.a || []).push(arguments);
        };
        (window as any).ym.l = 1 * new Date();
        
        // Загружаем скрипт Яндекс.Метрики
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://mc.yandex.ru/metrika/tag.js';
        script.onload = () => {
          console.log('✅ Yandex.Metrika script loaded');
        };
        script.onerror = () => {
          console.log('❌ Yandex.Metrika script failed to load');
        };
        document.head.appendChild(script);
        
        // Инициализируем счетчик
        (window as any).ym(105448967, 'init', {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true
        });
        
        // Добавляем noscript fallback
        const noscript = document.createElement('noscript');
        noscript.innerHTML = '<div><img src="https://mc.yandex.ru/watch/105448967" style="position:absolute; left:-9999px;" alt="" /></div>';
        document.body.appendChild(noscript);
        
        console.log('✅ Yandex.Metrika initialized');
      } catch (error) {
        console.log('❌ Yandex.Metrika failed:', error);
      }
    }
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}



