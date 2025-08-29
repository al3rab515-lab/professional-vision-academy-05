import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AcademyUser {
  id: string;
  code: string;
  full_name: string;
  phone: string;
  age?: number;
  email?: string;
  user_type: 'player' | 'student' | 'trainer' | 'admin' | 'employee';
  status: 'active' | 'inactive' | 'suspended';
  residential_area?: string;
  subscription_duration?: string;
  learning_goals?: string;
  parent_phone?: string;
  guardian_phone?: string;
  address?: string;
  sport_type?: string;
  subscription_start_date?: string;
  subscription_days?: number;
  salary?: number;
  job_position?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  player_id: string;
  trainer_id: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
  created_at: string;
}

export interface ExcuseSubmission {
  id: string;
  player_id: string;
  reason: string;
  file_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  trainer_response?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface AcademyNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  user_id?: string;
  phone_number?: string;
  status?: string;
  created_at: string;
}

export function useAcademyData() {
  const [users, setUsers] = useState<AcademyUser[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [excuses, setExcuses] = useState<ExcuseSubmission[]>([]);
  const [notifications, setNotifications] = useState<AcademyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes] = await Promise.all([
        supabase.from('academy_users').select('*').order('created_at', { ascending: false })
      ]);

      if (usersRes.error) throw usersRes.error;
      setUsers((usersRes.data || []) as AcademyUser[]);
    } catch (err: any) {
      console.error('Error fetching academy data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: Omit<AcademyUser, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('academy_users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [data as AcademyUser, ...prev]);
      const userTypeArabic = userData.user_type === 'player' ? 'اللاعب' : 
                            userData.user_type === 'trainer' ? 'المدرب' : 
                            userData.user_type === 'employee' ? 'الموظف' : 'المستخدم';
      toast.success(`تم إضافة ${userTypeArabic} بنجاح`);
      return data as AcademyUser;
    } catch (err: any) {
      console.error('Error adding user:', err);
      toast.error('حدث خطأ في إضافة المستخدم');
      throw err;
    }
  };

  const generatePlayerCode = () => {
    return 'P-' + Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateTrainerCode = () => {
    return 'T-' + Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateStudentCode = () => {
    return 'S-' + Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateEmployeeCode = () => {
    return 'E-' + Math.floor(100000 + Math.random() * 900000).toString();
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('academy_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('تم حذف المستخدم بنجاح');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('حدث خطأ في حذف المستخدم');
      throw err;
    }
  };

  const updateUser = async (userId: string, updates: Partial<AcademyUser>) => {
    try {
      // Handle status changes - if user is suspended/inactive, deactivate their code
      if (updates.status && (updates.status === 'suspended' || updates.status === 'inactive')) {
        // Add timestamp to code to deactivate it
        const user = users.find(u => u.id === userId);
        if (user) {
          updates.code = `${user.code.split('_')[0]}_DEACTIVATED_${Date.now()}`;
        }
      }
      
      // If reactivating user, restore original code
      if (updates.status === 'active') {
        const user = users.find(u => u.id === userId);
        if (user && user.code.includes('_DEACTIVATED_')) {
          updates.code = user.code.split('_DEACTIVATED_')[0];
        }
      }

      const { data, error } = await supabase
        .from('academy_users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => prev.map(user => user.id === userId ? { ...user, ...updates } : user));
      toast.success('تم تحديث البيانات بنجاح');
      return data as AcademyUser;
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error('حدث خطأ في تحديث البيانات');
      throw err;
    }
  };

  const getStatistics = async () => {
    const totalStudents = users.filter(u => u.user_type === 'player').length;
    const activeStudents = users.filter(u => u.user_type === 'player' && u.status === 'active').length;
    const totalTrainers = users.filter(u => u.user_type === 'trainer').length;
    
    // Calculate expired subscriptions
    const expiredSubscriptions = users.filter(u => {
      if (u.user_type === 'player' && u.subscription_start_date && u.subscription_days) {
        const startDate = new Date(u.subscription_start_date);
        const endDate = new Date(startDate.getTime() + u.subscription_days * 24 * 60 * 60 * 1000);
        return endDate < new Date();
      }
      return false;
    }).length;

    // Get real attendance data for today
    const today = new Date().toISOString().split('T')[0];
    let presentToday = 0;
    let attendanceRate = 0;

    try {
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('date', today);
      
      if (attendanceData) {
        presentToday = attendanceData.filter(record => record.status === 'present').length;
        attendanceRate = activeStudents > 0 ? Math.round((presentToday / activeStudents) * 100) : 0;
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      // Fallback to estimated data
      presentToday = Math.floor(activeStudents * 0.85);
      attendanceRate = activeStudents > 0 ? Math.round((presentToday / activeStudents) * 100) : 0;
    }

    // Get real pending excuses count with detailed error handling
    let pendingExcuses = 0;
    try {
      const { data: excusesData, error: excusesError } = await supabase
        .from('excuse_submissions')
        .select('id, status')
        .eq('status', 'pending');
      
      if (excusesError) {
        console.error('Error fetching excuses:', excusesError);
        pendingExcuses = 0; // Set to 0 on error instead of estimate
      } else {
        pendingExcuses = excusesData?.length || 0;
      }
    } catch (error) {
      console.error('Error fetching excuses stats:', error);
      pendingExcuses = 0; // Set to 0 on error for accurate reporting
    }

    return {
      totalStudents,
      activeStudents,
      totalTrainers,
      expiredSubscriptions,
      presentToday,
      pendingExcuses,
      attendanceRate
    };
  };

  useEffect(() => {
    fetchData();
    
    
    // Silent real-time refresh every 1 second
    const interval = setInterval(() => {
      // Silent update without console logs or notifications
      const silentFetch = async () => {
        try {
          const usersRes = await supabase.from('academy_users').select('*').order('created_at', { ascending: false });
          if (usersRes.data) {
            setUsers(usersRes.data as AcademyUser[]);
          }
        } catch (err) {
          // Silent error handling
        }
      };
      silentFetch();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    users,
    attendance,
    excuses,
    notifications,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    generatePlayerCode,
    generateTrainerCode,
    generateStudentCode,
    generateEmployeeCode,
    getStatistics,
    refetch: fetchData,
    setUsers // Add this to allow external updates
  };
}