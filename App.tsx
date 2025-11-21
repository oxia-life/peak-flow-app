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
        // Добавляем скрипт Яндекс.Метрики
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = `
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=105448967', 'ym');
          ym(105448967, 'init', {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true
          });
        `;
        document.head.appendChild(script);
        
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



