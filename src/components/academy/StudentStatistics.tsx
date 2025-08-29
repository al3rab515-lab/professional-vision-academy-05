import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";

interface StudentStatisticsProps {
  studentId: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  excusedDays: number;
  attendanceRate: number;
}

export function StudentStatistics({ studentId }: StudentStatisticsProps) {
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    excusedDays: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceStats();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchAttendanceStats, 5000);
    return () => clearInterval(interval);
  }, [studentId]);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      
      // First get all attendance records for this student
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('status, date')
        .eq('player_id', studentId)
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Get excuse submissions for this student
      const { data: excuseData, error: excuseError } = await supabase
        .from('excuse_submissions')
        .select('submitted_at, status')
        .eq('player_id', studentId)
        .eq('status', 'approved');

      if (excuseError) throw excuseError;

      if (attendanceData) {
        // Process attendance data
        let presentDays = 0;
        let absentDays = 0;
        let excusedDays = 0;
        
        // Convert excuse submission dates to just dates for comparison
        const approvedExcuseDates = new Set(
          excuseData?.map(excuse => excuse.submitted_at.split('T')[0]) || []
        );
        
        attendanceData.forEach(record => {
          if (record.status === 'present') {
            presentDays++;
          } else if (record.status === 'absent') {
            // Check if this absence has an approved excuse
            if (approvedExcuseDates.has(record.date)) {
              excusedDays++;
            } else {
              absentDays++;
            }
          } else if (record.status === 'excused') {
            excusedDays++;
          }
        });

        const totalDays = attendanceData.length;
        const attendanceRate = totalDays > 0 ? Math.round(((presentDays + excusedDays) / totalDays) * 100) : 0;

        setStats({
          totalDays,
          presentDays,
          absentDays,
          excusedDays,
          attendanceRate
        });
      } else {
        // No attendance data found
        setStats({
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          excusedDays: 0,
          attendanceRate: 0
        });
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      // Set fallback data on error
      setStats({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        excusedDays: 0,
        attendanceRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card border-0 academy-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          إحصائياتي
        </CardTitle>
        <CardDescription>
          سجل الحضور والغياب الخاص بك
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">جاري تحميل الإحصائيات...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.presentDays}</div>
                <div className="text-sm text-green-600">أيام حضور</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.absentDays}</div>
                <div className="text-sm text-red-600">أيام غياب</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.excusedDays}</div>
                <div className="text-sm text-yellow-600">أيام معذور</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
                <div className="text-sm text-blue-600">معدل الحضور</div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">إجمالي الأيام المسجلة: {stats.totalDays}</span>
              </div>
            </div>

            {stats.attendanceRate < 70 && stats.totalDays > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">معدل الحضور منخفض! يُنصح بتحسين الانتظام</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}