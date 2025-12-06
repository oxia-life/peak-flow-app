import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Размер иконки (масштабируем с 24 до большего размера)
const ICON_SCALE = 5;
const ICON_SIZE = 24 * ICON_SCALE;

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={['#1E4C60', '#3E9DC6']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Svg 
          width={ICON_SIZE} 
          height={ICON_SIZE} 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <Path 
            d="M4.54199 8.48733H14.8499C16.3332 8.48733 17.1882 7.64906 17.1882 6.22267C17.1882 4.79629 15.9741 4.01685 14.8499 4.01685C13.7256 4.01685 12.7513 4.84569 12.7513 5.89504" 
            stroke="#FFFFFF" 
            strokeWidth={1.5} 
            strokeLinejoin="round"
          />
          <Path 
            d="M3.05273 11.7209H18.4594C19.9427 11.7209 20.9476 12.8924 20.9476 14.3188C20.9476 15.7452 19.5836 16.6107 18.4594 16.6107C17.3352 16.6107 16.1928 15.7502 16.1928 14.7008" 
            stroke="#FFFFFF" 
            strokeWidth={1.5} 
            strokeLinejoin="round"
          />
          <Path 
            d="M4.56055 14.8459H11.3771C12.8605 14.8459 13.7154 15.6842 13.7154 17.1106C13.7154 18.537 12.5014 19.3164 11.3771 19.3164C10.2529 19.3164 9.27858 18.4876 9.27858 17.4382" 
            stroke="#FFFFFF" 
            strokeWidth={1.5} 
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

