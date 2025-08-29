import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrainerManagement } from "./TrainerManagement";
import { PlayerManagement } from "./PlayerManagement";
import { EmployeeManagement } from "./EmployeeManagement";
import { SavedAttendanceSystem } from "./SavedAttendanceSystem";
import { AttendanceManagement } from "./AttendanceManagement";
import { NotificationPanel } from "./NotificationPanel";
import { AISettings } from "./AISettings";
import { AddPlayerForm } from "./AddPlayerForm";
import { AddTrainerForm } from "./AddTrainerForm";
import { AdminCodeChanger } from "./AdminCodeChanger";
import { QuickAttendance } from "./QuickAttendance";
import { TrainerAttendance } from "./TrainerAttendance";
import { LiveCommunicationSystem } from "./LiveCommunicationSystem";
import { useAcademyData } from "@/hooks/useAcademyData";
import { useAcademySettings } from "@/hooks/useAcademySettings";
import { RealTimeStatistics } from "./RealTimeStatistics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  UserCheck, 
  UserPlus,
  Settings,
  BarChart3,
  AlertTriangle,
  Calendar,
  Target,
  Construction,
  Bell,
  RefreshCw,
  CalendarCheck,
  Bot,
  Archive
} from "lucide-react";

interface AdminDashboardProps {
  currentCode: string;
  onManageStudents: () => void;
  onManageTrainers: () => void;
  onSettings: () => void;
  onCodeChange: (newCode: string) => void;
  onMaintenanceMode: () => void;
}

export function AdminDashboard({ 
  currentCode,
  onManageStudents, 
  onManageTrainers,
  onSettings,
  onCodeChange,
  onMaintenanceMode
}: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'trainers' | 'players' | 'employees' | 'attendance-players' | 'attendance-trainers' | 'notifications' | 'ai-settings' | 'quick-attendance' | 'trainer-attendance' | 'saved-attendances' | 'live-communication'>('dashboard');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [showAddTrainerForm, setShowAddTrainerForm] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTrainers: 0,
    expiredSubscriptions: 0,
    presentToday: 0,
    pendingExcuses: 0,
    attendanceRate: 0
  });
  const { getStatistics, loading, users, refetch } = useAcademyData();
  const { isMaintenanceMode, updateSetting } = useAcademySettings();
  
  const attendanceRate = stats.attendanceRate;

  // Update last refresh indicator every 2 minutes and load stats
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 120000);
    
    // Load initial stats
    loadStats();
    
    // Refresh stats every 30 seconds
    const statsInterval = setInterval(loadStats, 30000);
    
    return () => {
      clearInterval(interval);
      clearInterval(statsInterval);
    };
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getStatistics();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Add Player function
  const handleAddPlayer = async (playerData: any) => {
    try {
      // Map the form data to match the database schema
      const dbData = {
        full_name: playerData.full_name,
        age: playerData.age,
        phone: playerData.phone,
        address: playerData.residential_area, // Map to address field
        sport_type: playerData.sport_type, // Sport type selection
        learning_goals: playerData.learning_goals, // Learning goals description
        user_type: 'player',
        code: playerData.code,
        status: 'active',
        subscription_start_date: new Date().toISOString().split('T')[0],
        subscription_days: parseInt(playerData.subscription_duration.replace(/\D/g, '')) || 30, // Extract numbers from duration
        guardian_phone: playerData.email || null
      };

      const { error } = await supabase
        .from('academy_users')
        .insert([dbData]);

      if (error) throw error;

      toast.success('تم إضافة اللاعب بنجاح');
      refetch(); // Refresh data
      setShowAddPlayerForm(false);
    } catch (error: any) {
      console.error('Error adding player:', error);
      toast.error('حدث خطأ في إضافة اللاعب');
    }
  };

  // Add Trainer function
  const handleAddTrainer = async (trainerData: any) => {
    try {
      // Map the form data to match the database schema
      const dbData = {
        full_name: trainerData.full_name,
        age: trainerData.age,
        phone: trainerData.phone,
        user_type: 'trainer',
        code: trainerData.code,
        status: 'active',
        sport_type: trainerData.sport_type, // Sport specialization
        job_position: trainerData.job_position, // Job description
        salary: trainerData.salary, // Salary amount
        guardian_phone: trainerData.email || null
      };

      const { error } = await supabase
        .from('academy_users')
        .insert([dbData]);

      if (error) throw error;

      toast.success('تم إضافة المدرب بنجاح');
      refetch(); // Refresh data
      setShowAddTrainerForm(false);
    } catch (error: any) {
      console.error('Error adding trainer:', error);
      toast.error('حدث خطأ في إضافة المدرب');
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      const newMaintenanceMode = !isMaintenanceMode();
      await updateSetting('maintenance_mode', newMaintenanceMode.toString());
      
      // Send maintenance notification to all users
      await sendMaintenanceNotification(newMaintenanceMode);
      
      toast.success(newMaintenanceMode ? 'تم تفعيل وضع الصيانة' : 'تم إيقاف وضع الصيانة');
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('حدث خطأ في تغيير وضع الصيانة');
    }
  };

  const sendMaintenanceNotification = async (isMaintenanceActive: boolean) => {
    try {
      const notifications = [];
      
      for (const user of users) {
        const message = isMaintenanceActive 
          ? 'الأكاديمية تحت الصيانة حالياً، يرجى عدم الحضور حتى إشعار آخر.'
          : 'تم انتهاء أعمال الصيانة، مرحباً بكم مرة أخرى في الأكاديمية.';
          
        notifications.push({
          user_id: user.id,
          type: 'maintenance',
          title: isMaintenanceActive ? 'إشعار صيانة' : 'انتهاء الصيانة',
          message,
          phone_number: user.phone
        });

        // Send to parent if player
        if (user.user_type === 'player' && user.parent_phone) {
          notifications.push({
            user_id: user.id,
            type: 'maintenance_parent',
            title: `إشعار ولي أمر - ${isMaintenanceActive ? 'صيانة' : 'انتهاء الصيانة'}`,
            message: `بخصوص اللاعب ${user.full_name}: ${message}`,
            phone_number: user.parent_phone
          });
        }
      }

      // Save notifications to database
      const { error } = await supabase
        .from('academy_notifications')
        .insert(notifications);

      if (error) throw error;

      // Try to send via WhatsApp if API key exists
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            notifications,
            api_key: '' // Will be loaded from settings in the function
          }
        });
      } catch (err) {
        console.log('WhatsApp sending failed, notifications saved to database:', err);
      }

    } catch (error) {
      console.error('Error sending maintenance notifications:', error);
    }
  };

  if (currentView === 'trainers') {
    return <TrainerManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'players') {
    return <PlayerManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'employees') {
    return <EmployeeManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'saved-attendances') {
    return <SavedAttendanceSystem onBack={() => setCurrentView('dashboard')} userType="admin" />;
  }

  if (currentView === 'attendance-players') {
    return <AttendanceManagement onBack={() => setCurrentView('dashboard')} userType="player" />;
  }

  if (currentView === 'attendance-trainers') {
    return <AttendanceManagement onBack={() => setCurrentView('dashboard')} userType="trainer" />;
  }

  if (currentView === 'notifications') {
    return (
      <div className="space-y-6">
        <Card className="shadow-elegant border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-academy-text">لوحة الإشعارات</h2>
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('dashboard')}
              >
                العودة للوحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
        <NotificationPanel />
      </div>
    );
  }

  if (currentView === 'quick-attendance') {
    return <QuickAttendance 
      onBack={() => setCurrentView('dashboard')} 
      onViewSaved={() => setCurrentView('saved-attendances')}
    />;
  }

  if (currentView === 'trainer-attendance') {
    return <TrainerAttendance onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'ai-settings') {
    return <AISettings onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'live-communication') {
    return <LiveCommunicationSystem 
      onBack={() => setCurrentView('dashboard')}
      userType="admin"
    />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academy-fade-in">
        <Card className="gradient-card shadow-elegant border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-academy-text">لوحة التحكم الإدارية</h2>
                <p className="text-muted-foreground mt-1">
                  إدارة شاملة لأكاديمية الرؤية المحترفة - المدير: عيسى المحياني
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA')} | تحديث تلقائي كل دقيقتين
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Badge variant={isMaintenanceMode() ? "destructive" : "default"}>
                    {isMaintenanceMode() ? 'وضع صيانة' : 'نشط'}
                  </Badge>
                  <AdminCodeChanger 
                    currentCode={currentCode}
                    onCodeChange={onCodeChange}
                  />
                  <Button
                    onClick={() => setCurrentView('notifications')}
                    variant="outline"
                    size="sm"
                    className="border-blue-500 text-blue-500 hover:bg-blue-50"
                  >
                    <Bell className="h-4 w-4 ml-2" />
                    الإشعارات
                  </Button>
                  <Button
                    onClick={handleMaintenanceToggle}
                    variant="outline"
                    size="sm"
                    className={isMaintenanceMode() 
                      ? "border-red-500 text-red-500 hover:bg-red-50" 
                      : "border-green-500 text-green-500 hover:bg-green-50"
                    }
                  >
                    <Construction className="h-4 w-4 ml-2" />
                    {isMaintenanceMode() ? 'إنهاء الصيانة' : 'وضع صيانة'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Statistics */}
      <RealTimeStatistics />

      {/* Management Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Student Management */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              إدارة اللاعبين
            </CardTitle>
            <CardDescription>
              إضافة وتعديل وحذف بيانات اللاعبين ومتابعة حضورهم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-academy-gray rounded-lg">
                <span className="text-sm">اللاعبون النشطون</span>
                <Badge variant="default">{loading ? '--' : stats.activeStudents}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-academy-gray rounded-lg">
                <span className="text-sm">الاشتراكات المنتهية</span>
                <Badge variant="destructive">{loading ? '--' : stats.expiredSubscriptions}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => setShowAddPlayerForm(true)}
                  className="gradient-primary"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 ml-1" />
                  إضافة
                </Button>
                <Button 
                  onClick={() => setCurrentView('players')}
                  variant="outline"
                  size="sm"
                >
                  إدارة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trainer Management */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              إدارة المدربين
            </CardTitle>
            <CardDescription>
              إضافة مدربين جدد وإدارة أكوادهم وصلاحياتهم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-academy-gray rounded-lg">
                <span className="text-sm">إجمالي المدربين</span>
                <Badge variant="default">{loading ? '--' : stats.totalTrainers}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-academy-gray rounded-lg">
                <span className="text-sm">المدربين النشطون</span>
                <Badge variant="secondary">{loading ? '--' : stats.totalTrainers}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => setShowAddTrainerForm(true)}
                  className="gradient-primary"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 ml-1" />
                  إضافة
                </Button>
                <Button 
                  onClick={() => setCurrentView('trainers')}
                  variant="outline"
                  size="sm"
                >
                  إدارة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Employee Management */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              إدارة الموظفين
            </CardTitle>
            <CardDescription>
              إدارة الموظفين والمستخدمين في الأكاديمية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm">إجمالي الموظفين</span>
                <Badge className="bg-orange-100 text-orange-800">{loading ? '--' : users.filter(u => u.user_type === 'employee').length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={() => setCurrentView('employees')}
                  variant="outline"
                  size="sm"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Users className="w-4 h-4 ml-1" />
                  إدارة الموظفين
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Management */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-green-600" />
              إدارة الحضور والغياب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button 
                onClick={() => setCurrentView('attendance-players')}
                variant="outline"
                size="sm"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <UserCheck className="w-4 h-4 ml-1" />
                حضور اللاعبين
              </Button>
              <Button 
                onClick={() => setCurrentView('attendance-trainers')}
                variant="outline"
                size="sm"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <UserCheck className="w-4 h-4 ml-1" />
                حضور المدربين
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <Button
              onClick={onSettings}
              variant="outline"
              className="h-12 border-2 border-gray-200 text-gray-600 hover:border-gray-500 hover:bg-gray-50"
            >
              <Settings className="w-5 h-5 ml-2" />
              الإعدادات
            </Button>
            <Button
              onClick={() => setCurrentView('ai-settings')}
              variant="outline"
              className="h-12 border-2 border-purple-200 text-purple-600 hover:border-purple-500 hover:bg-purple-50"
            >
              <Bot className="w-5 h-5 ml-2" />
              الذكاء الاصطناعي
            </Button>
            <Button
              onClick={() => setCurrentView('quick-attendance')}
              variant="outline"
              className="h-12 border-2 border-green-200 text-green-600 hover:border-green-500 hover:bg-green-50"
            >
              <CalendarCheck className="w-5 h-5 ml-2" />
              تحضير سريع
            </Button>
            <Button
              onClick={() => setCurrentView('saved-attendances')}
              variant="outline"
              className="h-12 border-2 border-blue-200 text-blue-600 hover:border-blue-500 hover:bg-blue-50"
            >
              <Archive className="w-5 h-5 ml-2" />
              محفوظات التحضير
            </Button>
            <Button
              onClick={() => setCurrentView('trainer-attendance')}
              variant="outline"
              className="h-12 border-2 border-orange-200 text-orange-600 hover:border-orange-500 hover:bg-orange-50"
            >
              <UserCheck className="w-5 h-5 ml-2" />
              حضور المدربين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {!loading && (stats.expiredSubscriptions > 0 || stats.pendingExcuses > 0) && (
        <Card className="shadow-card border-0 border-l-4 border-l-destructive academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              تنبيهات تحتاج انتباه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.expiredSubscriptions > 0 && (
                <p className="text-sm">
                  • يوجد <span className="font-bold">{stats.expiredSubscriptions}</span> لاعبين باشتراكات منتهية
                </p>
              )}
              {stats.pendingExcuses > 0 && (
                <p className="text-sm">
                  • يوجد <span className="font-bold">{stats.pendingExcuses}</span> أعذار تحتاج مراجعة
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State Message */}
      {!loading && stats.totalStudents === 0 && (
        <Card className="shadow-card border-0 academy-fade-in">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">ابدأ بإضافة أعضاء الأكاديمية</h3>
            <p className="text-muted-foreground mb-6">
              ابدأ بإضافة المدربين واللاعبين لرؤية الإحصائيات والبيانات
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setShowAddTrainerForm(true)} className="gradient-primary">
                <UserPlus className="h-4 w-4 ml-2" />
                إضافة مدربين
              </Button>
              <Button onClick={() => setShowAddPlayerForm(true)} variant="outline">
                <Users className="h-4 w-4 ml-2" />
                إضافة لاعبين
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Player Form */}
      <AddPlayerForm 
        isOpen={showAddPlayerForm}
        onClose={() => setShowAddPlayerForm(false)}
        onAdd={handleAddPlayer}
      />

      {/* Add Trainer Form */}
      <AddTrainerForm 
        isOpen={showAddTrainerForm}
        onClose={() => setShowAddTrainerForm(false)}
        onAdd={handleAddTrainer}
      />
    </div>
  );
}