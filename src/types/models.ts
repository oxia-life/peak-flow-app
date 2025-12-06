export interface Profile {
  gender: 'M' | 'F';
  birthDate: string | null;  // ISO YYYY-MM-DD
  heightCm: number | null;
  normMethod: 'auto' | 'manual';
  manualNormValue?: number | null;
  registeredPlatform?: 'web' | 'ios' | 'android' | null;  // Платформа регистрации
}

export interface PEFRecord {
  id: string;                // uuid
  date: string;              // ISO YYYY-MM-DD
  time: string;              // HH:MM
  value: number;             // PEF, L/min
  cough: boolean;
  breathlessness: boolean;
  sputum: boolean;
}



