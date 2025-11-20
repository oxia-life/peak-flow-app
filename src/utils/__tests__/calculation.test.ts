/**
 * Тесты для модуля calculation.ts
 * Это демонстрационный файл с примерами использования функций
 */

import {
  calculateNormPEF,
  getZoneColor,
  getPercentageOfNorm,
  getZoneDescription,
  GREEN_ZONE_THRESHOLD,
  YELLOW_ZONE_THRESHOLD,
} from '../calculation';

// ====================================
// Примеры расчёта нормы PEF
// ====================================

console.log('=== Тесты calculateNormPEF ===');

// Мужчина, 30 лет, 180 см
const norm1 = calculateNormPEF('M', 30, 180);
console.log(`Мужчина 30 лет, 180 см: ${norm1} л/мин`); // Ожидается ~600

// Женщина, 25 лет, 165 см
const norm2 = calculateNormPEF('F', 25, 165);
console.log(`Женщина 25 лет, 165 см: ${norm2} л/мин`); // Ожидается ~450

// Мужчина, 50 лет, 175 см
const norm3 = calculateNormPEF('M', 50, 175);
console.log(`Мужчина 50 лет, 175 см: ${norm3} л/мин`);

// Женщина, 40 лет, 170 см
const norm4 = calculateNormPEF('F', 40, 170);
console.log(`Женщина 40 лет, 170 см: ${norm4} л/мин`);

console.log();

// ====================================
// Примеры определения зон
// ====================================

console.log('=== Тесты getZoneColor ===');

const testNorm = 600;

// Зелёная зона (>= 80%)
const zone1 = getZoneColor(500, testNorm);
console.log(`PEF 500 при норме 600: ${zone1} (${getPercentageOfNorm(500, testNorm)}%)`);
// Ожидается: green (83%)

// Жёлтая зона (50-79%)
const zone2 = getZoneColor(450, testNorm);
console.log(`PEF 450 при норме 600: ${zone2} (${getPercentageOfNorm(450, testNorm)}%)`);
// Ожидается: yellow (75%)

// Красная зона (< 50%)
const zone3 = getZoneColor(250, testNorm);
console.log(`PEF 250 при норме 600: ${zone3} (${getPercentageOfNorm(250, testNorm)}%)`);
// Ожидается: red (42%)

// Граница между зелёной и жёлтой (ровно 80%)
const zone4 = getZoneColor(480, testNorm);
console.log(`PEF 480 при норме 600: ${zone4} (${getPercentageOfNorm(480, testNorm)}%)`);
// Ожидается: green (80%)

// Граница между жёлтой и красной (ровно 50%)
const zone5 = getZoneColor(300, testNorm);
console.log(`PEF 300 при норме 600: ${zone5} (${getPercentageOfNorm(300, testNorm)}%)`);
// Ожидается: yellow (50%)

console.log();

// ====================================
// Полный рабочий сценарий
// ====================================

console.log('=== Полный сценарий ===');

const userProfile = {
  gender: 'M' as const,
  age: 35,
  height: 175,
};

const normalPEF = calculateNormPEF(userProfile.gender, userProfile.age, userProfile.height);
console.log(`Норма для пользователя: ${normalPEF} л/мин`);

const measurements = [520, 450, 380, 280];

measurements.forEach((pef) => {
  const zone = getZoneColor(pef, normalPEF);
  const percentage = getPercentageOfNorm(pef, normalPEF);
  const description = getZoneDescription(zone);
  
  console.log(`  PEF ${pef}: ${percentage}% от нормы - ${zone.toUpperCase()} (${description})`);
});

console.log();

// ====================================
// Проверка констант
// ====================================

console.log('=== Константы зон ===');
console.log(`Порог зелёной зоны: ${GREEN_ZONE_THRESHOLD * 100}%`);
console.log(`Порог жёлтой зоны: ${YELLOW_ZONE_THRESHOLD * 100}%`);

export {}; // Делаем файл модулем


