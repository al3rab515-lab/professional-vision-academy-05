import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Check } from "lucide-react";

interface AttendanceSaverProps {
  selectedDate: string;
  attendanceRecords: any[];
  totalPlayers: number;
  disabled?: boolean;
}

export function AttendanceSaver({ 
  selectedDate, 
  attendanceRecords, 
  totalPlayers,
  disabled = false 
}: AttendanceSaverProps) {
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const { toast } = useToast();

  const checkIfAlreadySaved = async () => {
    try {
      // Check if there are saved settings for this date
      const { data, error } = await supabase
        .from('academy_settings')
        .select('value')
        .eq('key', `saved_attendance_${selectedDate}`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking saved attendance:', error);
      return false;
    }
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);

      // Check if already saved today
      const isSaved = await checkIfAlreadySaved();
      if (isSaved) {
        toast({
          title: "تم الحفظ مسبقاً",
          description: "تم حفظ تحضير هذا اليوم من قبل",
          variant: "destructive",
        });
        setAlreadySaved(true);
        return;
      }

      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;
      const attendanceRate = totalPlayers > 0 ? Math.round((presentCount / totalPlayers) * 100) : 0;

      const attendanceData = {
        date: selectedDate,
        total_players: totalPlayers,
        present_count: presentCount,
        absent_count: absentCount,
        excused_count: excusedCount,
        attendance_rate: attendanceRate,
        saved_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('academy_settings')
        .insert([{
          key: `saved_attendance_${selectedDate}`,
          value: JSON.stringify(attendanceData)
        }]);

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم حفظ تحضير يوم ${new Date(selectedDate).toLocaleDateString('ar-SA')}`,
      });

      setAlreadySaved(true);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التحضير، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Check if already saved on mount and auto-save if end of day
  useEffect(() => {
    checkIfAlreadySaved().then(setAlreadySaved);
    
    // Auto-save at end of day (23:00)
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 0, 0, 0);
    
    const timeUntilEndOfDay = endOfDay.getTime() - now.getTime();
    
    if (timeUntilEndOfDay > 0 && timeUntilEndOfDay < 24 * 60 * 60 * 1000) {
      const autoSaveTimer = setTimeout(async () => {
        const isSaved = await checkIfAlreadySaved();
        if (!isSaved && attendanceRecords.length > 0) {
          await saveAttendance();
        }
      }, timeUntilEndOfDay);
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [attendanceRecords, selectedDate]);

  return (
    <Button
      onClick={saveAttendance}
      disabled={disabled || saving || alreadySaved || attendanceRecords.length === 0}
      className={alreadySaved ? "bg-green-600 hover:bg-green-700" : "gradient-primary"}
    >
      {alreadySaved ? (
        <>
          <Check className="w-4 h-4 ml-2" />
          تم الحفظ
        </>
      ) : (
        <>
          <Save className="w-4 h-4 ml-2" />
          {saving ? 'جاري الحفظ...' : 'حفظ التحضير'}
        </>
      )}
    </Button>
  );
}