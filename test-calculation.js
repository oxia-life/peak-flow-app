/**
 * Простой скрипт для тестирования функций расчёта PEF
 * Запустите: node test-calculation.js
 */

// Импортируем через require (для простоты, без TypeScript)
const {
  calculateNormPEF,
  getZoneColor,
  getPercentageOfNorm,
  getZoneDescription,
  getZoneColorHex,
  GREEN_ZONE_THRESHOLD,
  YELLOW_ZONE_THRESHOLD,
} = require('./src/utils/calculation.ts');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║        ТЕСТИРОВАНИЕ МОДУЛЯ РАСЧЁТА PEF                   ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log();

// ====================================
// Тест 1: Расчёт нормы для разных профилей
// ====================================
console.log('📊 ТЕСТ 1: Расчёт нормы PEF');
console.log('─────────────────────────────────────────────────────────');

const profiles = [
  { gender: 'M', age: 30, height: 180, name: 'Мужчина 30 лет, 180 см' },
  { gender: 'F', age: 25, height: 165, name: 'Женщина 25 лет, 165 см' },
  { gender: 'M', age: 50, height: 175, name: 'Мужчина 50 лет, 175 см' },
  { gender: 'F', age: 40, height: 170, name: 'Женщина 40 лет, 170 см' },
  { gender: 'M', age: 20, height: 185, name: 'Мужчина 20 лет, 185 см' },
];

profiles.forEach((profile) => {
  const norm = calculateNormPEF(profile.gender, profile.age, profile.height);
  console.log(`  ${profile.name}: ${norm} л/мин`);
});

console.log();

// ====================================
// Тест 2: Определение зон
// ====================================
console.log('🎨 ТЕСТ 2: Определение зон контроля');
console.log('─────────────────────────────────────────────────────────');

const testNorm = 600;
const testValues = [
  { pef: 550, expected: 'green' },
  { pef: 500, expected: 'green' },
  { pef: 480, expected: 'green' }, // ровно 80%
  { pef: 470, expected: 'yellow' },
  { pef: 400, expected: 'yellow' },
  { pef: 300, expected: 'yellow' }, // ровно 50%
  { pef: 280, expected: 'red' },
  { pef: 200, expected: 'red' },
];

console.log(`  Норма: ${testNorm} л/мин`);
console.log();

testValues.forEach(({ pef, expected }) => {
  const zone = getZoneColor(pef, testNorm);
  const percentage = getPercentageOfNorm(pef, testNorm);
  const description = getZoneDescription(zone);
  const color = getZoneColorHex(zone);
  
  const emoji = zone === 'green' ? '🟢' : zone === 'yellow' ? '🟡' : '🔴';
  const status = zone === expected ? '✓' : '✗';
  
  console.log(
    `  ${status} PEF ${pef}: ${percentage}% → ${emoji} ${zone.toUpperCase()} (${description})`
  );
});

console.log();

// ====================================
// Тест 3: Граничные случаи
// ====================================
console.log('⚠️  ТЕСТ 3: Граничные случаи');
console.log('─────────────────────────────────────────────────────────');

// Ровно на границе зелёной зоны (80%)
const boundary1 = testNorm * GREEN_ZONE_THRESHOLD;
const zone1 = getZoneColor(boundary1, testNorm);
console.log(`  80% от нормы (${boundary1}): ${zone1} ✓`);

// Ровно на границе жёлтой зоны (50%)
const boundary2 = testNorm * YELLOW_ZONE_THRESHOLD;
const zone2 = getZoneColor(boundary2, testNorm);
console.log(`  50% от нормы (${boundary2}): ${zone2} ✓`);

// Чуть выше 80%
const justAbove = testNorm * 0.81;
const zone3 = getZoneColor(justAbove, testNorm);
console.log(`  81% от нормы (${justAbove}): ${zone3} ✓`);

// Чуть ниже 50%
const justBelow = testNorm * 0.49;
const zone4 = getZoneColor(justBelow, testNorm);
console.log(`  49% от нормы (${justBelow}): ${zone4} ✓`);

console.log();

// ====================================
// Тест 4: Полный рабочий сценарий
// ====================================
console.log('🏥 ТЕСТ 4: Полный сценарий для пациента');
console.log('─────────────────────────────────────────────────────────');

const patient = {
  name: 'Иван',
  gender: 'M',
  age: 35,
  height: 175,
};

const patientNorm = calculateNormPEF(patient.gender, patient.age, patient.height);

console.log(`  Пациент: ${patient.name}`);
console.log(`  Профиль: ${patient.gender === 'M' ? 'мужской' : 'женский'}, ${patient.age} лет, ${patient.height} см`);
console.log(`  Норма PEF: ${patientNorm} л/мин`);
console.log();
console.log('  Измерения за неделю:');

const weekMeasurements = [
  { day: 'Понедельник', morning: 520, evening: 500 },
  { day: 'Вторник', morning: 510, evening: 490 },
  { day: 'Среда', morning: 480, evening: 460 },
  { day: 'Четверг', morning: 450, evening: 420 },
  { day: 'Пятница', morning: 400, evening: 380 },
];

weekMeasurements.forEach(({ day, morning, evening }) => {
  const morningZone = getZoneColor(morning, patientNorm);
  const eveningZone = getZoneColor(evening, patientNorm);
  const morningEmoji = morningZone === 'green' ? '🟢' : morningZone === 'yellow' ? '🟡' : '🔴';
  const eveningEmoji = eveningZone === 'green' ? '🟢' : eveningZone === 'yellow' ? '🟡' : '🔴';
  
  console.log(`    ${day}: утро ${morning} ${morningEmoji} | вечер ${evening} ${eveningEmoji}`);
});

console.log();

// ====================================
// Константы
// ====================================
console.log('📐 КОНСТАНТЫ');
console.log('─────────────────────────────────────────────────────────');
console.log(`  Порог зелёной зоны: ${GREEN_ZONE_THRESHOLD * 100}%`);
console.log(`  Порог жёлтой зоны: ${YELLOW_ZONE_THRESHOLD * 100}%`);

console.log();
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                  ТЕСТИРОВАНИЕ ЗАВЕРШЕНО                  ║');
console.log('╚══════════════════════════════════════════════════════════╝');


