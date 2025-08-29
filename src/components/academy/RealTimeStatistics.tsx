import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX, Clock, TrendingUp, AlertTriangle } from "lucide-react";

interface StatisticsData {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalTrainers: number;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  pendingExcuses: number;
  approvedExcuses: number;
  rejectedExcuses: number;
  attendanceRate: number;
  monthlyNewStudents: number;
  expiredSubscriptions: number;
}

export function RealTimeStatistics() {
  const [stats, setStats] = useState<StatisticsData>({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    totalTrainers: 0,
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingExcuses: 0,
    approvedExcuses: 0,
    rejectedExcuses: 0,
    attendanceRate: 0,
    monthlyNewStudents: 0,
    expiredSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchRealTimeStats = async () => {
    try {
      setLoading(true);
      
      // Get all users
      const { data: usersData, error: usersError } = await supabase
        .from('academy_users')
        .select('user_type, status, subscription_start_date, subscription_days, created_at');

      if (usersError) throw usersError;

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      // Get excuse submissions
      const { data: excuseData, error: excuseError } = await supabase
        .from('excuse_submissions')
        .select('status, submitted_at');

      if (excuseError) throw excuseError;

      // Calculate user statistics
      const totalStudents = usersData?.filter(u => u.user_type === 'player').length || 0;
      const activeStudents = usersData?.filter(u => u.user_type === 'player' && u.status === 'active').length || 0;
      const inactiveStudents = usersData?.filter(u => u.user_type === 'player' && u.status !== 'active').length || 0;
      const totalTrainers = usersData?.filter(u => u.user_type === 'trainer').length || 0;
      const totalEmployees = usersData?.filter(u => u.user_type === 'employee').length || 0;

      // Calculate attendance statistics
      const presentToday = attendanceData?.filter(record => record.status === 'present').length || 0;
      const absentToday = attendanceData?.filter(record => record.status === 'absent').length || 0;
      const attendanceRate = activeStudents > 0 ? Math.round((presentToday / activeStudents) * 100) : 0;

      // Calculate excuse statistics
      const pendingExcuses = excuseData?.filter(excuse => excuse.status === 'pending').length || 0;
      const approvedExcuses = excuseData?.filter(excuse => excuse.status === 'approved').length || 0;
      const rejectedExcuses = excuseData?.filter(excuse => excuse.status === 'rejected').length || 0;

      // Calculate monthly new students
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const monthlyNewStudents = usersData?.filter(u => 
        u.user_type === 'player' && 
        new Date(u.created_at) >= oneMonthAgo
      ).length || 0;

      // Calculate expired subscriptions
      const expiredSubscriptions = usersData?.filter(u => {
        if (u.user_type === 'player' && u.subscription_start_date && u.subscription_days) {
          const startDate = new Date(u.subscription_start_date);
          const endDate = new Date(startDate.getTime() + u.subscription_days * 24 * 60 * 60 * 1000);
          return endDate < new Date();
        }
        return false;
      }).length || 0;

      setStats({
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalTrainers,
        totalEmployees,
        presentToday,
        absentToday,
        pendingExcuses,
        approvedExcuses,
        rejectedExcuses,
        attendanceRate,
        monthlyNewStudents,
        expiredSubscriptions
      });

    } catch (error) {
      console.error('Error fetching real-time statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeStats();
    
    // Real-time updates every 10 seconds
    const interval = setInterval(fetchRealTimeStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="shadow-card border-0">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Students */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الطلاب</p>
              <p className="text-3xl font-bold text-primary">{stats.totalStudents}</p>
              <p className="text-xs text-muted-foreground">نشط: {stats.activeStudents}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Rate */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">معدل الحضور اليوم</p>
              <p className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</p>
              <p className="text-xs text-muted-foreground">حاضر: {stats.presentToday}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Absent Today */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">غائب اليوم</p>
              <p className="text-3xl font-bold text-red-600">{stats.absentToday}</p>
              <p className="text-xs text-muted-foreground">من أصل {stats.activeStudents}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Excuses */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">أعذار معلقة</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingExcuses}</p>
              <p className="text-xs text-muted-foreground">تحتاج مراجعة</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Trainers */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">المدربين</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalTrainers}</p>
              <p className="text-xs text-muted-foreground">مدرب نشط</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly New Students */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">طلاب جدد هذا الشهر</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.monthlyNewStudents}</p>
              <p className="text-xs text-muted-foreground">نمو الأكاديمية</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approved Excuses */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">أعذار مقبولة</p>
              <p className="text-3xl font-bold text-green-600">{stats.approvedExcuses}</p>
              <p className="text-xs text-muted-foreground">مرفوض: {stats.rejectedExcuses}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expired Subscriptions */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">اشتراكات منتهية</p>
              <p className="text-3xl font-bold text-orange-600">{stats.expiredSubscriptions}</p>
              <p className="text-xs text-muted-foreground">تحتاج تجديد</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}