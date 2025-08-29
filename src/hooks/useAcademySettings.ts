import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AcademySetting {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

export function useAcademySettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academy_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });

      setSettings(settingsMap);
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update setting
  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('academy_settings')
        .update({ value: value })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('تم حفظ الإعداد بنجاح');
    } catch (err: any) {
      console.error('Error updating setting:', err);
      toast.error('حدث خطأ في حفظ الإعداد');
      throw err;
    }
  };

  // Get setting value with fallback
  const getSetting = (key: string, fallback = '') => {
    return settings[key] || fallback;
  };

  // Maintenance mode helpers
  const isMaintenanceMode = () => {
    return getSetting('maintenance_mode') === 'true';
  };

  const setMaintenanceMode = async (enabled: boolean) => {
    await updateSetting('maintenance_mode', enabled ? 'true' : 'false');
  };

  // Admin code helpers
  const getAdminCode = () => {
    return getSetting('admin_code', 'V9-912000');
  };

  const updateAdminCode = async (newCode: string) => {
    if (!newCode.startsWith('V9-912')) {
      throw new Error('كود الإدارة يجب أن يبدأ بـ V9-912');
    }
    await updateSetting('admin_code', newCode);
    // Also update in localStorage for immediate effect
    localStorage.setItem('adminCode', newCode);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSetting,
    getSetting,
    isMaintenanceMode,
    setMaintenanceMode,
    getAdminCode,
    updateAdminCode,
    refetch: fetchSettings
  };
}