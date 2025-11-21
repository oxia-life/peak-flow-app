import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, PEFRecord } from '../types/models';
import SupabaseService from './SupabaseService';

const KEYS = {
  HAS_ONBOARDED: 'hasOnboarded',
  CHART_TYPE: 'chartType',
};

class StorageService {
  /**
   * Get user profile
   * Теперь данные берутся из Supabase
   */
  async getProfile(): Promise<Profile | null> {
    try {
      return await SupabaseService.getProfile();
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * Save user profile
   * Теперь данные сохраняются в Supabase
   */
  async saveProfile(profile: Profile): Promise<void> {
    try {
      const { error } = await SupabaseService.saveProfile(profile);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }

  /**
   * Get all PEF records
   * Теперь данные берутся из Supabase
   */
  async getAllRecords(): Promise<PEFRecord[]> {
    try {
      return await SupabaseService.getAllRecords();
    } catch (error) {
      console.error('Error getting records:', error);
      return [];
    }
  }

  /**
   * Save a new PEF record
   * Теперь данные сохраняются в Supabase
   */
  async saveRecord(record: PEFRecord): Promise<void> {
    try {
      const { error } = await SupabaseService.addRecord(record);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving record:', error);
      throw error;
    }
  }

  /**
   * Save ONE new PEF record (safely adds without deleting existing)
   * Теперь данные сохраняются в Supabase
   */
  async saveRecord(record: PEFRecord): Promise<void> {
    try {
      const { error } = await SupabaseService.saveRecord(record);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving record:', error);
      throw error;
    }
  }

  /**
   * Update existing PEF record
   * Теперь данные обновляются в Supabase
   */
  async updateRecord(record: PEFRecord): Promise<void> {
    try {
      const { error } = await SupabaseService.updateRecord(record);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  /**
   * ⚠️ DANGEROUS! Save all PEF records (replaces ALL existing records)
   * Use saveRecord() to add a single record instead!
   * Теперь данные сохраняются в Supabase
   */
  async saveRecords(records: PEFRecord[]): Promise<void> {
    try {
      const { error } = await SupabaseService.saveRecords(records);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving records:', error);
      throw error;
    }
  }

  /**
   * Delete a PEF record by ID
   * Теперь данные удаляются из Supabase
   */
  async deleteRecord(id: string): Promise<void> {
    try {
      const { error } = await SupabaseService.deleteRecord(id);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(KEYS.HAS_ONBOARDED);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Set onboarding as completed
   */
  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.HAS_ONBOARDED, 'true');
    } catch (error) {
      console.error('Error setting onboarding status:', error);
      throw error;
    }
  }

  /**
   * Get chart type preference (bar or line)
   * Теперь данные берутся из Supabase
   */
  async getChartType(): Promise<'bar' | 'line'> {
    try {
      return await SupabaseService.getChartType();
    } catch (error) {
      console.error('Error getting chart type:', error);
      return 'bar';
    }
  }

  /**
   * Set chart type preference
   * Теперь данные сохраняются в Supabase
   */
  async setChartType(type: 'bar' | 'line'): Promise<void> {
    try {
      const { error } = await SupabaseService.setChartType(type);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error setting chart type:', error);
      throw error;
    }
  }

  /**
   * Clear all data
   * Удаляет все данные пользователя из Supabase и локальные настройки
   */
  async clearAll(): Promise<void> {
    try {
      console.log('Clearing all user data...');
      
      // Удаляем все данные пользователя из Supabase
      const { error } = await SupabaseService.clearAllUserData();
      if (error) {
        console.error('Error clearing Supabase data:', error);
        throw error;
      }
      
      // Очищаем локальные настройки (onboarding)
      await AsyncStorage.removeItem(KEYS.HAS_ONBOARDED);
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export default new StorageService();



