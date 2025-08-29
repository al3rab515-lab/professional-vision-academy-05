import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAcademyData, AcademyUser } from "@/hooks/useAcademyData";
import { 
  Calendar, 
  Search, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Users,
  Filter
} from "lucide-react";

interface AttendanceManagementProps {
  onBack: () => void;
  userType?: string;
}

interface AttendanceRecord {
  id?: string;
  player_id: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
}

export function AttendanceManagement({ onBack }: AttendanceManagementProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { users } = useAcademyData();
  
  const players = users.filter(user => user.user_type === 'player' && user.status === 'active');
  const trainers = users.filter(user => user.user_type === 'trainer' && user.status === 'active');
  const getTrainerId = () => trainers.length > 0 ? trainers[0].id : users.find(u => u.user_type === 'admin')?.id || 'system';

  const fetchAttendanceForDate = async (date: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', date);

      if (error) throw error;
      setAttendanceRecords((data || []).map(record => ({
        ...record,
        status: record.status as 'present' | 'absent' | 'excused'
      })));
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error("خطأ في تحميل بيانات الحضور");
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (playerId: string, status: 'present' | 'absent' | 'excused') => {
    try {
      // Check if record exists
      const existingRecord = attendanceRecords.find(r => r.player_id === playerId);
      
      if (existingRecord && existingRecord.id) {
        // Update existing record
        const { error } = await supabase
          .from('attendance_records')
          .update({ status })
          .eq('id', existingRecord.id);

        if (error) throw error;
        
        setAttendanceRecords(prev => 
          prev.map(record => 
            record.player_id === playerId ? { ...record, status } : record
          )
        );
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance_records')
          .insert([{
            player_id: playerId,
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
            player_id: data.player_id,
            date: data.date,
            status: data.status as 'present' | 'absent' | 'excused',
            notes: data.notes
          }]);
        }
      }

      // Send notification for absent players
      if (status === 'absent') {
        await sendAbsenceNotification(playerId);
      }

      toast.success("تم تحديث الحضور بنجاح ✅");
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error("خطأ في تحديث الحضور");
    }
  };

  const sendAbsenceNotification = async (playerId: string) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player || !player.guardian_phone) return;

      const message = `تنبيه من أكاديمية الرؤية المحترفة: اللاعب ${player.full_name} غائب اليوم ${new Date(selectedDate).toLocaleDateString('ar-SA')}. للاستفسار يرجى التواصل معنا.`;

      // Send notification using Supabase function
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          phone: player.guardian_phone,
          message,
          type: 'absence_alert'
        }
      });

      if (!error) {
        // Log notification in database
        await supabase
          .from('academy_notifications')
          .insert([{
            type: 'absence_alert',
            title: 'تنبيه غياب',
            message,
            phone_number: player.guardian_phone,
            user_id: playerId,
            status: 'sent'
          }]);

        toast.success(`تم إرسال تنبيه الغياب إلى ولي أمر ${player.full_name}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const getAttendanceStatus = (playerId: string): 'present' | 'absent' | 'excused' | null => {
    const record = attendanceRecords.find(r => r.player_id === playerId);
    return record ? record.status : null;
  };

  const filteredPlayers = players.filter(player =>
    player.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.code?.includes(searchTerm)
  );

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

  const sendDailyReport = async () => {
    try {
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;
      const attendanceRate = players.length > 0 ? Math.round((presentCount / players.length) * 100) : 0;
      
      const reportContent = `تقرير الحضور اليومي - ${new Date(selectedDate).toLocaleDateString('ar-SA')}
      
إجمالي اللاعبين: ${players.length}
الحاضرين: ${presentCount}
الغائبين: ${absentCount}
المعذورين: ${excusedCount}
معدل الحضور: ${attendanceRate}%

تفاصيل الحضور:
${players.map(player => {
  const status = getAttendanceStatus(player.id);
  const statusText = status === 'present' ? 'حاضر' : status === 'absent' ? 'غائب' : status === 'excused' ? 'معذور' : 'لم يتم التسجيل';
  return `- ${player.full_name} (${player.code}): ${statusText}`;
}).join('\n')}`;

      // Save report to academy_settings with unique key
      const reportKey = `attendance_report_${selectedDate}_${Date.now()}`;
      const { error } = await supabase
        .from('academy_settings')
        .insert([{
          key: reportKey,
          value: JSON.stringify({
            date: selectedDate,
            total_players: players.length,
            present_count: presentCount,
            absent_count: absentCount,
            excused_count: excusedCount,
            attendance_rate: attendanceRate,
            report_content: reportContent,
            created_at: new Date().toISOString()
          })
        }]);

      if (error) throw error;
      
      toast.success("تم حفظ التقرير اليومي بنجاح");
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("خطأ في إنشاء التقرير");
    }
  };

  useEffect(() => {
    fetchAttendanceForDate(selectedDate);
  }, [selectedDate]);

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
                  <Calendar className="w-6 h-6 text-primary" />
                  إدارة الحضور والغياب
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  تسجيل حضور اللاعبين وإرسال التنبيهات
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={sendDailyReport}
                variant="outline"
                className="text-blue-600 hover:bg-blue-50 border-blue-200"
              >
                <Send className="w-4 h-4 ml-2" />
                إرسال التقرير
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Date and Search */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2">التاريخ</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2">البحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث باسم اللاعب أو الكود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      {loading ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل بيانات الحضور...</p>
          </CardContent>
        </Card>
      ) : filteredPlayers.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا يوجد لاعبين</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'لا يوجد لاعبين نشطين في الأكاديمية'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => {
            const status = getAttendanceStatus(player.id);
            return (
              <Card key={player.id} className="shadow-card border-0 academy-fade-in">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{player.full_name}</h3>
                      <p className="text-sm text-muted-foreground">كود: {player.code}</p>
                      {player.guardian_phone && (
                        <p className="text-sm text-muted-foreground">ولي الأمر: {player.guardian_phone}</p>
                      )}
                    </div>
                    {getStatusBadge(status)}
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        onClick={() => markAttendance(player.id, 'present')}
                        className={`${status === 'present' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'} transition-colors`}
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        حاضر
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => markAttendance(player.id, 'absent')}
                        className={`${status === 'absent' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'} transition-colors`}
                      >
                        <XCircle className="w-4 h-4 ml-1" />
                        غائب
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => markAttendance(player.id, 'excused')}
                        className={`${status === 'excused' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'} transition-colors`}
                      >
                        <Clock className="w-4 h-4 ml-1" />
                        معذور
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {filteredPlayers.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>ملخص الحضور - {new Date(selectedDate).toLocaleDateString('ar-SA')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{filteredPlayers.length}</div>
                <div className="text-sm text-blue-600">إجمالي اللاعبين</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceRecords.filter(r => r.status === 'present').length}
                </div>
                <div className="text-sm text-green-600">الحاضرين</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {attendanceRecords.filter(r => r.status === 'absent').length}
                </div>
                <div className="text-sm text-red-600">الغائبين</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {attendanceRecords.filter(r => r.status === 'excused').length}
                </div>
                <div className="text-sm text-yellow-600">المعذورين</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}