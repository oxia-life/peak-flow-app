/**
 * Константы для определения зон контроля PEF
 */
export const GREEN_ZONE_THRESHOLD = 0.8; // >= 80% от нормы
export const YELLOW_ZONE_THRESHOLD = 0.5; // >= 50% от нормы

/**
 * Диапазон возрастов, для которого валидны формулы Nunn & Gregg
 */
const MIN_AGE = 15;
const MAX_AGE = 85;

/**
 * Рассчитывает прогнозируемую норму пиковой экспираторной скорости (PEF)
 * по полу, возрасту и росту.
 * 
 * Использует формулы на основе исследования Nunn & Gregg (BMJ 1989):
 * - Для мужчин: log(PEF) = 0.544 * log(age) - 0.0151 * age - 74.7/height + 5.48
 * - Для женщин: log(PEF) = 0.376 * log(age) - 0.0120 * age - 58.8/height + 5.63
 * 
 * @param gender - Пол ('M' для мужчин, 'F' для женщин)
 * @param age - Возраст в годах (рекомендуется 15-85 лет)
 * @param heightCm - Рост в сантиметрах
 * @returns Прогнозируемое значение PEF в л/мин, округлённое до целого
 * 
 * @example
 * const norm = calculateNormPEF('M', 30, 180); // ~600 л/мин
 * const normFemale = calculateNormPEF('F', 25, 165); // ~450 л/мин
 */
export function calculateNormPEF(
  gender: 'M' | 'F',
  age: number,
  heightCm: number
): number {
  // Валидация входных данных
  if (age <= 0 || heightCm <= 0) {
    throw new Error('Возраст и рост должны быть положительными числами');
  }

  // Предупреждение для возрастов вне валидного диапазона (но расчёт всё равно выполним)
  if (age < MIN_AGE || age > MAX_AGE) {
    console.warn(
      `Возраст ${age} выходит за рекомендуемый диапазон ${MIN_AGE}-${MAX_AGE} лет. ` +
      'Результат может быть менее точным.'
    );
  }

  let logPEF: number;

  // Конвертируем рост из см в метры для формулы
  const heightM = heightCm / 100;

  let pefWright: number;
  
  if (gender === 'M') {
    // Формула Nunn & Gregg для мужчин (Wright)
    // EXP(0.544×LN(age)−0.0151×age−(74.7÷(height_m×100))+5.48)
    pefWright = Math.exp(
      0.544 * Math.log(age) - 
      0.0151 * age - 
      (74.7 / (heightM * 100)) + 
      5.48
    );
  } else {
    // Формула Nunn & Gregg для женщин (Wright)
    // EXP(0.376×LN(age)−0.012×age−(58.8÷(height_m×100))+5.63)
    pefWright = Math.exp(
      0.376 * Math.log(age) - 
      0.012 * age - 
      (58.8 / (heightM * 100)) + 
      5.63
    );
  }

  // Конвертация Wright -> EU (EN 13826)
  // 50.356 + 0.4×W + 0.0008814×W² − 0.0000001116×W³
  const pefEU = 
    50.356 + 
    0.4 * pefWright + 
    0.0008814 * Math.pow(pefWright, 2) - 
    0.0000001116 * Math.pow(pefWright, 3);

  // Округляем до целого
  return Math.round(pefEU);
}

/**
 * Определяет зону контроля для данного значения PEF относительно нормы.
 * 
 * Правила:
 * - Зелёная зона (green): >= 80% от нормы - хороший контроль
 * - Жёлтая зона (yellow): 50-79% от нормы - требуется внимание
 * - Красная зона (red): < 50% от нормы - опасная зона
 * 
 * @param pefValue - Текущее измеренное значение PEF в л/мин
 * @param normValue - Нормальное (прогнозируемое) значение PEF в л/мин
 * @returns Цвет зоны: 'green', 'yellow' или 'red'
 * 
 * @example
 * const norm = calculateNormPEF('M', 30, 180); // 600
 * const zone1 = getZoneColor(500, norm); // 'green' (83% от нормы)
 * const zone2 = getZoneColor(450, norm); // 'yellow' (75% от нормы)
 * const zone3 = getZoneColor(250, norm); // 'red' (42% от нормы)
 */
export function getZoneColor(
  pefValue: number,
  normValue: number
): 'green' | 'yellow' | 'red' {
  // Граничный случай: норма = 0
  if (normValue <= 0) {
    throw new Error('Нормальное значение PEF должно быть положительным числом');
  }

  // Валидация значения PEF
  if (pefValue < 0) {
    throw new Error('Значение PEF не может быть отрицательным');
  }

  // Рассчитываем процент от нормы
  const percentage = pefValue / normValue;

  // Определяем зону
  if (percentage >= GREEN_ZONE_THRESHOLD) {
    return 'green';
  } else if (percentage >= YELLOW_ZONE_THRESHOLD) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Рассчитывает процент от нормы для отображения
 * 
 * @param pefValue - Текущее измеренное значение PEF в л/мин
 * @param normValue - Нормальное (прогнозируемое) значение PEF в л/мин
 * @returns Процент от нормы (0-100+)
 * 
 * @example
 * const norm = calculateNormPEF('M', 30, 180); // 600
 * const percent = getPercentageOfNorm(450, norm); // 75
 */
export function getPercentageOfNorm(pefValue: number, normValue: number): number {
  if (normValue <= 0) {
    throw new Error('Нормальное значение PEF должно быть положительным числом');
  }

  return Math.round((pefValue / normValue) * 100);
}

/**
 * Возвращает человекочитаемое описание зоны
 * 
 * @param zone - Цвет зоны
 * @returns Описание зоны на русском языке
 * 
 * @example
 * const description = getZoneDescription('green'); // "Хороший контроль"
 */
export function getZoneDescription(zone: 'green' | 'yellow' | 'red'): string {
  switch (zone) {
    case 'green':
      return 'Хороший контроль';
    case 'yellow':
      return 'Требуется внимание';
    case 'red':
      return 'Опасная зона';
  }
}

/**
 * Возвращает цвет для UI
 * 
 * @param zone - Цвет зоны
 * @returns Hex-код цвета для отображения
 */
export function getZoneColorHex(zone: 'green' | 'yellow' | 'red'): string {
  switch (zone) {
    case 'green':
      return '#34C759'; // iOS green
    case 'yellow':
      return '#FFCC00'; // iOS yellow
    case 'red':
      return '#FF3B30'; // iOS red
  }
}

/* ====================================
   ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
   ==================================== */

// Пример 1: Расчёт нормы для мужчины 30 лет ростом 180 см
// const norm = calculateNormPEF('M', 30, 180); 
// console.log(norm); // ~600 л/мин

// Пример 2: Расчёт нормы для женщины 25 лет ростом 165 см
// const normFemale = calculateNormPEF('F', 25, 165);
// console.log(normFemale); // ~450 л/мин

// Пример 3: Определение зоны
// const currentPEF = 450;
// const zone = getZoneColor(currentPEF, norm);
// console.log(zone); // 'yellow' (450 это ~75% от 600)

// Пример 4: Полный рабочий процесс
// const profile = { gender: 'M' as const, age: 35, height: 175 };
// const normalPEF = calculateNormPEF(profile.gender, profile.age, profile.height);
// const measuredPEF = 520;
// const zone = getZoneColor(measuredPEF, normalPEF);
// const percentage = getPercentageOfNorm(measuredPEF, normalPEF);
// const description = getZoneDescription(zone);
// console.log(`PEF: ${measuredPEF} (${percentage}% от нормы ${normalPEF})`);
// console.log(`Зона: ${description}`);


