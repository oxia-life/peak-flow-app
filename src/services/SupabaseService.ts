import { supabase } from '../config/supabase';
import { Profile, PEFRecord } from '../types/models';
import { Session, User } from '@supabase/supabase-js';

class SupabaseService {
  // ==================== АВТОРИЗАЦИЯ ====================
  
  /**
   * Отправить magic link на email
   */
  async sendMagicLink(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window?.location?.origin || 'peakflowdiary://auth',
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Получить текущую сессию
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Получить текущего пользователя
   */
  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  /**
   * Выйти из аккаунта
   */
  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /**
   * Подписаться на изменения состояния авторизации
   */
  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session);
    });
  }

  // ==================== ПРОФИЛЬ ====================

  /**
   * Сохранить профиль пользователя
   */
  async saveProfile(profile: Profile): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('saveProfile: User not authenticated');
        return { error: new Error('User not authenticated') };
      }

      console.log('saveProfile: Saving profile for user:', user.id);
      console.log('saveProfile: Profile data:', profile);

      const profileData = {
        user_id: user.id,
        gender: profile.gender,
        birth_date: profile.birthDate,
        height_cm: profile.heightCm,
        norm_method: profile.normMethod,
        manual_norm_value: profile.manualNormValue,
        updated_at: new Date().toISOString(),
      };

      console.log('saveProfile: Data to save:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'user_id',
        })
        .select();

      if (error) {
        console.error('saveProfile: Supabase error:', error);
      } else {
        console.log('saveProfile: Successfully saved, returned data:', data);
      }

      return { error };
    } catch (error) {
      console.error('saveProfile: Exception:', error);
      return { error: error as Error };
    }
  }

  /**
   * Получить профиль пользователя
   */
  async getProfile(): Promise<Profile | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('getProfile: No user');
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('getProfile: Supabase error:', error);
        return null;
      }

      if (!data) {
        console.log('getProfile: No profile found');
        return null;
      }

      console.log('getProfile: Retrieved profile data:', data);

      return {
        gender: data.gender,
        birthDate: data.birth_date,
        heightCm: data.height_cm,
        normMethod: data.norm_method,
        manualNormValue: data.manual_norm_value,
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  // ==================== ЗАПИСИ PEF ====================

  /**
   * Сохранить ОДНУ новую запись PEF (безопасно, не удаляет существующие)
   */
  async saveRecord(record: PEFRecord): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('saveRecord: No user authenticated');
        return { error: new Error('User not authenticated') };
      }

      console.log('saveRecord: Saving single record:', record);

      const recordWithUserId = {
        id: record.id,
        user_id: user.id,
        date: record.date,
        time: record.time,
        value: record.value,
        cough: record.cough,
        breathlessness: record.breathlessness,
        sputum: record.sputum,
      };

      const { error } = await supabase.from('pef_records').insert([recordWithUserId]);

      if (error) {
        console.error('saveRecord: Supabase error:', error);
      } else {
        console.log('saveRecord: Successfully saved record');
      }

      return { error };
    } catch (error) {
      console.error('saveRecord: Exception:', error);
      return { error: error as Error };
    }
  }

  /**
   * ⚠️ ОПАСНО! Перезаписывает ВСЕ записи пользователя (для синхронизации)
   * Используйте saveRecord() для добавления одной записи!
   */
  async saveRecords(records: PEFRecord[]): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: new Error('User not authenticated') };
      }

      console.warn('saveRecords: ⚠️ REPLACING ALL USER RECORDS with', records.length, 'records');

      // Удаляем старые записи пользователя
      await supabase.from('pef_records').delete().eq('user_id', user.id);

      // Добавляем новые записи
      const recordsWithUserId = records.map((record) => ({
        id: record.id,
        user_id: user.id,
        date: record.date,
        time: record.time,
        value: record.value,
        cough: record.cough,
        breathlessness: record.breathlessness,
        sputum: record.sputum,
      }));

      const { error } = await supabase.from('pef_records').insert(recordsWithUserId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Получить все записи PEF пользователя
   */
  async getAllRecords(): Promise<PEFRecord[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('pef_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((record) => ({
        id: record.id,
        date: record.date,
        time: record.time,
        value: record.value,
        cough: record.cough,
        breathlessness: record.breathlessness,
        sputum: record.sputum,
      }));
    } catch (error) {
      console.error('Error getting records:', error);
      return [];
    }
  }

  /**
   * Добавить одну запись PEF
   */
  async addRecord(record: PEFRecord): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: new Error('User not authenticated') };
      }

      const { error } = await supabase.from('pef_records').insert({
        id: record.id,
        user_id: user.id,
        date: record.date,
        time: record.time,
        value: record.value,
        cough: record.cough,
        breathlessness: record.breathlessness,
        sputum: record.sputum,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Обновить существующую запись PEF
   */
  async updateRecord(record: PEFRecord): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('updateRecord: No user authenticated');
        return { error: new Error('User not authenticated') };
      }

      console.log('updateRecord: Updating record:', record);

      const { error } = await supabase
        .from('pef_records')
        .update({
          date: record.date,
          time: record.time,
          value: record.value,
          cough: record.cough,
          breathlessness: record.breathlessness,
          sputum: record.sputum,
        })
        .eq('id', record.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('updateRecord: Supabase error:', error);
      } else {
        console.log('updateRecord: Successfully updated record');
      }

      return { error };
    } catch (error) {
      console.error('updateRecord: Exception:', error);
      return { error: error as Error };
    }
  }

  /**
   * Удалить запись PEF
   */
  async deleteRecord(recordId: string): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: new Error('User not authenticated') };
      }

      console.log('deleteRecord: Deleting record:', recordId);

      const { error } = await supabase
        .from('pef_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user.id);

      if (error) {
        console.error('deleteRecord: Supabase error:', error);
      } else {
        console.log('deleteRecord: Successfully deleted record');
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // ==================== НАСТРОЙКИ ====================

  /**
   * Сохранить тип графика
   */
  async setChartType(chartType: 'bar' | 'line'): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('setChartType: User not authenticated');
        return { error: new Error('User not authenticated') };
      }

      console.log('setChartType: Saving chart type:', chartType, 'for user:', user.id);

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            chart_type: chartType,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select();

      if (error) {
        console.error('setChartType: Error from Supabase:', error);
      } else {
        console.log('setChartType: Successfully saved, data:', data);
      }

      return { error };
    } catch (error) {
      console.error('setChartType: Exception:', error);
      return { error: error as Error };
    }
  }

  /**
   * Получить тип графика
   */
  async getChartType(): Promise<'bar' | 'line'> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('getChartType: No user, returning default bar');
        return 'bar';
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('chart_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('getChartType: Error from Supabase:', error);
        return 'bar';
      }

      console.log('getChartType: Retrieved data:', data);
      return data?.chart_type || 'bar';
    } catch (error) {
      console.error('getChartType: Exception:', error);
      return 'bar';
    }
  }

  // ==================== УДАЛЕНИЕ ДАННЫХ ====================

  /**
   * Удалить все данные пользователя
   */
  async clearAllUserData(): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: new Error('User not authenticated') };
      }

      // Удаляем записи PEF
      await supabase.from('pef_records').delete().eq('user_id', user.id);

      // Удаляем профиль
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Удаляем настройки
      await supabase.from('user_settings').delete().eq('user_id', user.id);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

export default new SupabaseService();

