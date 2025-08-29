import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAcademyData } from "@/hooks/useAcademyData";
import { 
  CalendarCheck, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Zap
} from "lucide-react";

interface TrainerAttendanceProps {
  onBack: () => void;
}

interface TrainerAttendanceRecord {
  id?: string;
  trainer_id: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
}

export function TrainerAttendance({ onBack }: TrainerAttendanceProps) {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<TrainerAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const { users } = useAcademyData();
  
  const trainers = users.filter(user => user.user_type === 'trainer' && user.status === 'active');
  const getTrainerId = () => trainers.length > 0 ? trainers[0].id : users.find(u => u.user_type === 'admin')?.id || 'system';

  const fetchAttendanceForDate = async (date: string) => {
    try {
      setLoading(true);
      // Use attendance_records table with trainer filter
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', date)
        .in('player_id', trainers.map(t => t.id));

      if (error) throw error;
      setAttendanceRecords((data || []).map(record => ({
        id: record.id,
        trainer_id: record.player_id, // Use player_id as trainer_id
        date: record.date,
        status: record.status as 'present' | 'absent' | 'excused',
        notes: record.notes
      })));
    } catch (error) {
      console.error('Error fetching trainer attendance:', error);
      toast.error("خطأ في تحميل بيانات حضور المدربين");
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = async () => {
    try {
      setMarkingAll(true);
      const attendanceData = [];
      
      for (const trainer of trainers) {
        const existingRecord = attendanceRecords.find(r => r.trainer_id === trainer.id);
        
        if (!existingRecord) {
          attendanceData.push({
            player_id: trainer.id, // Use player_id for trainer attendance
            date: selectedDate,
            status: 'present',
            trainer_id: getTrainerId()
          });
        } else if (existingRecord.status !== 'present') {
          // Update existing record
          await supabase
            .from('attendance_records')
            .update({ status: 'present' })
            .eq('id', existingRecord.id);
        }
      }

      if (attendanceData.length > 0) {
        const { error } = await supabase
          .from('attendance_records')
          .insert(attendanceData);

        if (error) throw error;
      }

      await fetchAttendanceForDate(selectedDate);
      toast.success(`تم تسجيل حضور جميع المدربين (${trainers.length} مدرب) ✅`);
    } catch (error) {
      console.error('Error marking all trainers present:', error);
      toast.error("خطأ في تسجيل الحضور الجماعي للمدربين");
    } finally {
      setMarkingAll(false);
    }
  };

  const markAttendance = async (trainerId: string, status: 'present' | 'absent' | 'excused') => {
    try {
      const trainer = trainers.find(t => t.id === trainerId);
      const existingRecord = attendanceRecords.find(r => r.trainer_id === trainerId);
      
      if (existingRecord && existingRecord.id) {
        // Update existing record
        const { error } = await supabase
          .from('attendance_records')
          .update({ status })
          .eq('id', existingRecord.id);

        if (error) throw error;
        
        // Update local state
        setAttendanceRecords(prev => 
          prev.map(record => 
            record.trainer_id === trainerId ? { ...record, status } : record
          )
        );
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance_records')
          .insert([{
            player_id: trainerId, // Use player_id for trainer attendance
            date: selectedDate,
            status,
            trainer_id: getTrainerId()
          }])
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setAttendanceRecords(prev => [...prev, {
            id: data.id,
            trainer_id: data.player_id, // Map player_id to trainer_id
            date: data.date,
            status: data.status as 'present' | 'absent' | 'excused',
            notes: data.notes
          }]);
        }
      }

      // Send notification to trainer
      if (trainer) {
        const statusText = status === 'present' ? 'حاضر' : status === 'absent' ? 'غائب' : 'معذور';
        await supabase
          .from('academy_notifications')
          .insert([{
            user_id: trainerId,
            type: 'attendance',
            title: `تسجيل حضور - ${new Date(selectedDate).toLocaleDateString('ar-SA')}`,
            message: `تم تسجيل حضورك كـ: ${statusText}`,
            phone_number: trainer.phone
          }]);
      }

      const statusText = status === 'present' ? 'حاضر' : status === 'absent' ? 'غائب' : 'معذور';
      toast.success(`تم تسجيل حضور المدرب: ${statusText} ✅`);
    } catch (error) {
      console.error('Error marking trainer attendance:', error);
      toast.error("خطأ في تسجيل حضور المدرب - يرجى المحاولة مرة أخرى");
    }
  };

  const getAttendanceStatus = (trainerId: string): 'present' | 'absent' | 'excused' | null => {
    const record = attendanceRecords.find(r => r.trainer_id === trainerId);
    return record ? record.status : null;
  };

  const getStatusBadge = (status: 'present' | 'absent' | 'excused' | null) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />حاضر</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 ml-1" />غائب</Badge>;
      case 'excused':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" />معذور</Badge>;
      default:
        return <Badge variant="outline">لم يتم التسجيل</Badge>;
    }
  };

  useEffect(() => {
    fetchAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;
  const attendanceRate = trainers.length > 0 ? Math.round((presentCount / trainers.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="w-6 h-6 text-primary" />
                  حضور المدربين - {new Date(selectedDate).toLocaleDateString('ar-SA')}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  تسجيل حضور المدربين في الأكاديمية
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={markAllPresent}
                disabled={markingAll || loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Zap className="w-4 h-4 ml-2" />
                {markingAll ? 'جاري التسجيل...' : 'حضور جماعي'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{trainers.length}</div>
            <div className="text-sm text-blue-600">إجمالي المدربين</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <div className="text-sm text-green-600">الحاضرين</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <div className="text-sm text-red-600">الغائبين</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{attendanceRate}%</div>
            <div className="text-sm text-primary">معدل الحضور</div>
          </CardContent>
        </Card>
      </div>

      {/* Trainers List */}
      {loading ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل بيانات حضور المدربين...</p>
          </CardContent>
        </Card>
      ) : trainers.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا يوجد مدربين</h3>
            <p className="text-muted-foreground">لا يوجد مدربين نشطين في الأكاديمية</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map((trainer) => {
            const status = getAttendanceStatus(trainer.id);
            return (
              <Card key={trainer.id} className="shadow-card border-0 academy-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{trainer.full_name}</h3>
                      <p className="text-sm text-muted-foreground">كود: {trainer.code}</p>
                      <p className="text-sm text-muted-foreground">{trainer.sport_type}</p>
                    </div>
                    {getStatusBadge(status)}
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      size="sm"
                      onClick={() => markAttendance(trainer.id, 'present')}
                      className={`${status === 'present' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'} transition-colors text-xs p-2`}
                    >
                      <CheckCircle className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => markAttendance(trainer.id, 'absent')}
                      className={`${status === 'absent' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'} transition-colors text-xs p-2`}
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => markAttendance(trainer.id, 'excused')}
                      className={`${status === 'excused' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'} transition-colors text-xs p-2`}
                    >
                      <Clock className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}