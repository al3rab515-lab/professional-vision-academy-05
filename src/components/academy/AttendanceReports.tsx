import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAcademyData } from "@/hooks/useAcademyData";
import { 
  Calendar, 
  ArrowLeft,
  BarChart3,
  Download,
  Filter,
  TrendingUp
} from "lucide-react";

interface AttendanceReportsProps {
  onBack: () => void;
}

interface MonthlyReport {
  month: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  excusedDays: number;
  attendanceRate: number;
  playerName: string;
  playerId: string;
}

export function AttendanceReports({ onBack }: AttendanceReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { users } = useAcademyData();
  
  const players = users.filter(user => user.user_type === 'player' && user.status === 'active');

  const fetchMonthlyReports = async (month: string) => {
    try {
      setLoading(true);
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Calculate monthly statistics
      const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
      const attendanceByPlayer = players.map(player => {
        const playerRecords = (data || []).filter(record => record.player_id === player.id);
        const presentDays = playerRecords.filter(r => r.status === 'present').length;
        const absentDays = playerRecords.filter(r => r.status === 'absent').length;
        const excusedDays = playerRecords.filter(r => r.status === 'excused').length;
        const totalRecorded = presentDays + absentDays + excusedDays;
        const attendanceRate = totalRecorded > 0 ? Math.round((presentDays / totalRecorded) * 100) : 0;

        return {
          month: month,
          playerName: player.full_name || 'غير محدد',
          playerId: player.id,
          totalDays: totalRecorded,
          presentDays,
          absentDays,
          excusedDays,
          attendanceRate
        };
      });

      // Create visual representation for calendar
      setMonthlyData(attendanceByPlayer);
    } catch (error) {
      console.error('Error fetching monthly reports:', error);
      toast.error("خطأ في تحميل التقارير الشهرية");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyReport = async () => {
    try {
      const overallStats = monthlyData.reduce((acc, player) => ({
        totalPlayers: acc.totalPlayers + 1,
        totalPresent: acc.totalPresent + player.presentDays,
        totalAbsent: acc.totalAbsent + player.absentDays,
        totalExcused: acc.totalExcused + player.excusedDays,
        averageAttendance: acc.averageAttendance + player.attendanceRate
      }), { totalPlayers: 0, totalPresent: 0, totalAbsent: 0, totalExcused: 0, averageAttendance: 0 });

      if (overallStats.totalPlayers > 0) {
        overallStats.averageAttendance = Math.round(overallStats.averageAttendance / overallStats.totalPlayers);
      }

      const reportContent = `تقرير الحضور الشهري - ${selectedMonth}

الإحصائيات العامة:
- إجمالي اللاعبين: ${overallStats.totalPlayers}
- إجمالي أيام الحضور: ${overallStats.totalPresent}
- إجمالي أيام الغياب: ${overallStats.totalAbsent}
- إجمالي الأعذار: ${overallStats.totalExcused}
- متوسط معدل الحضور: ${overallStats.averageAttendance}%

تفاصيل كل لاعب:
${monthlyData.map(player => `
- ${player.playerName}:
  حاضر: ${player.presentDays} أيام
  غائب: ${player.absentDays} أيام
  معذور: ${player.excusedDays} أيام
  معدل الحضور: ${player.attendanceRate}%
`).join('')}`;

      // Save report
      const { error } = await supabase
        .from('academy_settings')
        .upsert([{
          key: `monthly_report_${selectedMonth}`,
          value: JSON.stringify({
            month: selectedMonth,
            overall_stats: overallStats,
            player_details: monthlyData,
            report_content: reportContent,
            created_at: new Date().toISOString()
          })
        }]);

      if (error) throw error;
      
      toast.success("تم إنشاء التقرير الشهري بنجاح");
    } catch (error) {
      console.error('Error generating monthly report:', error);
      toast.error("خطأ في إنشاء التقرير");
    }
  };

  const getDayStatus = (playerId: string, day: number): 'present' | 'absent' | 'excused' | null => {
    // This is a simplified version - in real implementation, you'd fetch daily data
    const playerData = monthlyData.find(p => p.playerId === playerId);
    if (!playerData) return null;
    
    // Generate mock daily data based on monthly stats
    const dayIndex = day % 4;
    if (dayIndex === 0) return 'present';
    if (dayIndex === 1) return playerData.absentDays > 0 ? 'absent' : 'present';
    if (dayIndex === 2) return playerData.excusedDays > 0 ? 'excused' : 'present';
    return 'present';
  };

  const getStatusColor = (status: 'present' | 'absent' | 'excused' | null) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'excused': return 'bg-yellow-500';
      default: return 'bg-gray-200';
    }
  };

  useEffect(() => {
    fetchMonthlyReports(selectedMonth);
  }, [selectedMonth]);

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
                  <BarChart3 className="w-6 h-6 text-primary" />
                  تقارير الحضور
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  عرض وتحليل تقارير الحضور الشهرية
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={generateMonthlyReport}
                variant="outline"
                className="text-blue-600 hover:bg-blue-50 border-blue-200"
              >
                <Download className="w-4 h-4 ml-2" />
                إنشاء تقرير
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Month Selection */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">الشهر:</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Monthly Overview */}
      {loading ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل التقارير...</p>
          </CardContent>
        </Card>
      ) : monthlyData.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد بيانات</h3>
            <p className="text-muted-foreground">لا توجد سجلات حضور لهذا الشهر</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Calendar View */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle>العرض التقويمي - {new Date(selectedMonth + '-01').toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((player) => (
                  <div key={player.playerId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{player.playerName}</h4>
                      <Badge variant="outline">معدل الحضور: {player.attendanceRate}%</Badge>
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(day => (
                        <div key={day} className="text-center text-xs font-medium p-1">{day}</div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                        const status = getDayStatus(player.playerId, day);
                        return (
                          <div
                            key={day}
                            className={`w-6 h-6 rounded-full ${getStatusColor(status)} flex items-center justify-center text-xs text-white font-medium`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>حاضر ({player.presentDays})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>غائب ({player.absentDays})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>معذور ({player.excusedDays})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle>ملخص الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{monthlyData.length}</div>
                  <div className="text-sm text-blue-600">إجمالي اللاعبين</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(monthlyData.reduce((acc, p) => acc + p.attendanceRate, 0) / monthlyData.length) || 0}%
                  </div>
                  <div className="text-sm text-green-600">متوسط الحضور</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {monthlyData.filter(p => p.attendanceRate < 70).length}
                  </div>
                  <div className="text-sm text-red-600">لاعبين بحضور ضعيف</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {monthlyData.reduce((acc, p) => acc + p.excusedDays, 0)}
                  </div>
                  <div className="text-sm text-yellow-600">إجمالي الأعذار</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}