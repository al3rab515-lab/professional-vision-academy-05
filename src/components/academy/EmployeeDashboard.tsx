import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayerManagement } from "./PlayerManagement";
import { AttendanceManagement } from "./AttendanceManagement";
import { NotificationPanel } from "./NotificationPanel";
import { ExcuseManagement } from "./ExcuseManagement";
import { AddPlayerForm } from "./AddPlayerForm";
import { useAcademyData } from "@/hooks/useAcademyData";
import { useAcademySettings } from "@/hooks/useAcademySettings";
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
  FileText,
  Bot
} from "lucide-react";

interface EmployeeDashboardProps {
  currentCode: string;
  userData: any;
}

export function EmployeeDashboard({ currentCode, userData }: EmployeeDashboardProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'players' | 'attendance-players' | 'notifications' | 'excuses'>('dashboard');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
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
  const { isMaintenanceMode } = useAcademySettings();
  
  const attendanceRate = stats.attendanceRate;

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getStatistics();
        setStats(statsData);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    loadStats();
  }, []);

  // Update last refresh indicator every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  // Add Player function
  const handleAddPlayer = async (playerData: any) => {
    try {
      const dbData = {
        full_name: playerData.full_name,
        age: playerData.age,
        phone: playerData.phone,
        address: playerData.residential_area,
        sport_type: playerData.learning_goals,
        user_type: 'player',
        code: playerData.code,
        status: 'active',
        subscription_start_date: new Date().toISOString().split('T')[0],
        subscription_days: parseInt(playerData.subscription_duration.replace(/\D/g, '')) || 30,
        guardian_phone: playerData.email || null
      };

      const { error } = await supabase
        .from('academy_users')
        .insert([dbData]);

      if (error) throw error;

      toast.success('تم إضافة اللاعب بنجاح');
      refetch();
      setShowAddPlayerForm(false);
    } catch (error: any) {
      console.error('Error adding player:', error);
      toast.error('حدث خطأ في إضافة اللاعب');
    }
  };

  const handleAIChat = async () => {
    if (!aiMessage.trim()) return;

    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: aiMessage,
          user_type: 'employee',
          user_id: userData.id
        }
      });

      if (error) throw error;

      setAiResponse(data.response);
      setAiMessage('');
    } catch (error: any) {
      console.error('AI Chat error:', error);
      toast.error('حدث خطأ في المحادثة مع الذكاء الاصطناعي');
    } finally {
      setLoadingAI(false);
    }
  };

  if (currentView === 'players') {
    return <PlayerManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'attendance-players') {
    return <AttendanceManagement onBack={() => setCurrentView('dashboard')} userType="player" />;
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

  if (currentView === 'excuses') {
    return <ExcuseManagement onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academy-fade-in">
        <Card className="gradient-card shadow-elegant border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-academy-text">لوحة الموظف</h2>
                <p className="text-muted-foreground mt-1">
                  {userData.full_name} - كود الموظف: {currentCode}
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
                  <Button
                    onClick={() => setCurrentView('notifications')}
                    variant="outline"
                    size="sm"
                    className="border-blue-500 text-blue-500 hover:bg-blue-50"
                  >
                    <Bell className="h-4 w-4 ml-2" />
                    الإشعارات
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card border-0 academy-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي اللاعبين</p>
                <p className="text-3xl font-bold text-primary">{loading ? '--' : stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 academy-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">حاضر اليوم</p>
                <p className="text-3xl font-bold text-green-600">{loading ? '--' : stats.presentToday}</p>
                <Badge variant="secondary" className="mt-1">
                  {attendanceRate}% نسبة الحضور
                </Badge>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 academy-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">اشتراكات منتهية</p>
                <p className="text-3xl font-bold text-destructive">{loading ? '--' : stats.expiredSubscriptions}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 academy-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الأعذار المعلقة</p>
                <p className="text-3xl font-bold text-orange-600">{loading ? '--' : stats.pendingExcuses}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

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

        {/* Excuse Management */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              إدارة الأعذار
            </CardTitle>
            <CardDescription>
              مراجعة وإدارة أعذار الغياب المقدمة من الطلاب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm">الأعذار المعلقة</span>
                <Badge className="bg-orange-100 text-orange-800">{loading ? '--' : stats.pendingExcuses}</Badge>
              </div>
              <Button 
                onClick={() => setCurrentView('excuses')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                مراجعة الأعذار
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Management */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-green-600" />
              إدارة الحضور
            </CardTitle>
            <CardDescription>
              تسجيل وإدارة حضور اللاعبين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm">حاضر اليوم</span>
                <Badge className="bg-green-100 text-green-800">{loading ? '--' : stats.presentToday}</Badge>
              </div>
              <Button 
                onClick={() => setCurrentView('attendance-players')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                إدارة الحضور
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              المساعد الذكي
            </CardTitle>
            <CardDescription>
              اسأل أي سؤال يتعلق بالعمل أو الإدارة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <textarea
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className="w-full h-20 p-3 border rounded-lg resize-none text-sm"
                disabled={loadingAI}
              />
              <Button
                onClick={handleAIChat}
                disabled={loadingAI || !aiMessage.trim()}
                className="w-full"
                size="sm"
              >
                {loadingAI ? 'جاري المعالجة...' : 'إرسال'}
              </Button>
            </div>
            
            {aiResponse && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{aiResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Player Form */}
      <AddPlayerForm
        isOpen={showAddPlayerForm}
        onClose={() => setShowAddPlayerForm(false)}
        onAdd={handleAddPlayer}
      />
    </div>
  );
}