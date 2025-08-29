import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerManagement } from "./PlayerManagement";
import { AttendanceManagement } from "./AttendanceManagement";
import { ExcuseManagement } from "./ExcuseManagement";
import { CommunicationSystem } from "./CommunicationSystem";
import { SavedAttendanceSystem } from "./SavedAttendanceSystem";
import { QuickAttendance } from "./QuickAttendance";
import { SportFilteredAttendance } from "./SportFilteredAttendance";
import { useAcademyData } from "@/hooks/useAcademyData";
import { 
  Users, 
  Calendar, 
  FileText, 
  LogOut,
  Trophy,
  ClipboardList,
  UserPlus,
  MessageCircle,
  BarChart3
} from "lucide-react";

interface TrainerDashboardProps {
  trainerCode: string;
  onLogout: () => void;
}

type ViewType = 'dashboard' | 'players' | 'attendance' | 'excuses' | 'chat' | 'reports' | 'quick-attendance' | 'saved-attendances' | 'swimming-attendance' | 'football-attendance' | 'soap-attendance' | 'taekwondo-attendance';

export function TrainerDashboard({ trainerCode, onLogout }: TrainerDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [trainerSport, setTrainerSport] = useState<string>('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTrainers: 0,
    expiredSubscriptions: 0,
    presentToday: 0,
    pendingExcuses: 0,
    attendanceRate: 0
  });
  const { users, getStatistics } = useAcademyData();

  // Get trainer's sport specialization
  useEffect(() => {
    const trainer = users.find(u => u.code === trainerCode && u.user_type === 'trainer');
    if (trainer?.sport_type) {
      setTrainerSport(trainer.sport_type);
    }
  }, [users, trainerCode]);

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

  const renderContent = () => {
    switch (currentView) {
      case 'players':
        return <PlayerManagement onBack={() => setCurrentView('dashboard')} />;
      case 'attendance':
        return <AttendanceManagement onBack={() => setCurrentView('dashboard')} userType="trainer" />;
      case 'excuses':
        return <ExcuseManagement onBack={() => setCurrentView('dashboard')} userType="trainer" />;
      case 'chat':
        return <CommunicationSystem currentUser={{ id: trainerCode }} userType="trainer" />;
      case 'quick-attendance':
        return <QuickAttendance 
          onBack={() => setCurrentView('dashboard')} 
          onViewSaved={() => setCurrentView('saved-attendances')}
        />;
      case 'saved-attendances':
        return <SavedAttendanceSystem onBack={() => setCurrentView('dashboard')} userType="trainer" />;
      case 'swimming-attendance':
        return <SportFilteredAttendance onBack={() => setCurrentView('dashboard')} trainerCode={trainerCode} sport="سباحة" />;
      case 'football-attendance':
        return <SportFilteredAttendance onBack={() => setCurrentView('dashboard')} trainerCode={trainerCode} sport="كرة قدم" />;
      case 'soap-attendance':
        return <SportFilteredAttendance onBack={() => setCurrentView('dashboard')} trainerCode={trainerCode} sport="ملعب صابوني" />;
      case 'taekwondo-attendance':
        return <SportFilteredAttendance onBack={() => setCurrentView('dashboard')} trainerCode={trainerCode} sport="تايكوندو" />;
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-gray-800 flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-primary" />
                      لوحة تحكم المدرب
                    </CardTitle>
                    <p className="text-gray-600 mt-2">كود المدرب: {trainerCode}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentView('chat')}
                      className="text-blue-600 hover:bg-blue-50 border-blue-200"
                    >
                      <MessageCircle className="w-4 h-4 ml-2" />
                      دردشة مع اللاعبين
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={onLogout}
                      className="text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-elegant border-0 bg-gradient-to-r from-green-500 to-green-600 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <ClipboardList className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">تحضير سريع للاعبين</h3>
                      <p className="text-white/90">تسجيل حضور جميع اللاعبين بنقرة واحدة</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setCurrentView('quick-attendance')}
                    className="bg-white text-green-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold"
                    size="lg"
                  >
                    <ClipboardList className="w-5 h-5 ml-2" />
                    ابدأ التحضير الآن
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sport-specific attendance buttons */}
            {(trainerSport === 'استقبال' || trainerSport) && (
              <Card className="shadow-card border-0 mb-6">
                <CardHeader>
                  <CardTitle>تحضير حسب النوع الرياضي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(trainerSport === 'سباحة' || trainerSport === 'استقبال') && (
                      <Button
                        onClick={() => setCurrentView('swimming-attendance')}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        سباحة حاضرين
                      </Button>
                    )}
                    {(trainerSport === 'كرة قدم' || trainerSport === 'استقبال') && (
                      <Button
                        onClick={() => setCurrentView('football-attendance')}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        كرة قدم حاضرين
                      </Button>
                    )}
                    {(trainerSport === 'ملعب صابوني' || trainerSport === 'استقبال') && (
                      <Button
                        onClick={() => setCurrentView('soap-attendance')}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        ملعب صابوني حاضرين
                      </Button>
                    )}
                    {(trainerSport === 'تايكوندو' || trainerSport === 'استقبال') && (
                      <Button
                        onClick={() => setCurrentView('taekwondo-attendance')}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        تايكوندو حاضرين
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <Card 
                className="shadow-card border-0 cursor-pointer hover:shadow-lg transition-shadow academy-fade-in"
                onClick={() => setCurrentView('players')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">إدارة اللاعبين</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    إضافة وتعديل وإدارة معلومات اللاعبين
                  </p>
                  <Button className="w-full gradient-primary">
                    <UserPlus className="w-4 h-4 ml-2" />
                    إدارة اللاعبين
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="shadow-card border-0 cursor-pointer hover:shadow-lg transition-shadow academy-fade-in"
                onClick={() => setCurrentView('attendance')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">إدارة الحضور</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    تسجيل حضور وغياب اللاعبين يومياً
                  </p>
                  <Button className="w-full gradient-primary">
                    <ClipboardList className="w-4 h-4 ml-2" />
                    تسجيل الحضور
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="shadow-card border-0 cursor-pointer hover:shadow-lg transition-shadow academy-fade-in"
                onClick={() => setCurrentView('excuses')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">إدارة الأعذار</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    مراجعة وقبول أو رفض أعذار اللاعبين
                  </p>
                  <Button className="w-full gradient-primary">
                    <FileText className="w-4 h-4 ml-2" />
                    مراجعة الأعذار
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="shadow-card border-0 cursor-pointer hover:shadow-lg transition-shadow academy-fade-in"
                onClick={() => setCurrentView('chat')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">التواصل</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    دردشة مع اللاعبين وإدارة الطلبات
                  </p>
                  <Button className="w-full gradient-primary">
                    <MessageCircle className="w-4 h-4 ml-2" />
                    المحادثات
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="shadow-card border-0 cursor-pointer hover:shadow-lg transition-shadow academy-fade-in"
                onClick={() => setCurrentView('reports')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">التقارير</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    تقارير الحضور والإحصائيات
                  </p>
                  <Button className="w-full gradient-primary">
                    <BarChart3 className="w-4 h-4 ml-2" />
                    عرض التقارير
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid md:grid-cols-4 gap-4 text-center">
                   <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
                      <div className="text-sm text-blue-600">إجمالي اللاعبين</div>
                   </div>
                   <div className="p-4 bg-green-50 rounded-lg">
                     <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
                     <div className="text-sm text-green-600">الحضور اليوم</div>
                   </div>
                   <div className="p-4 bg-orange-50 rounded-lg">
                     <div className="text-2xl font-bold text-orange-600">{stats.pendingExcuses}</div>
                     <div className="text-sm text-orange-600">أعذار في الانتظار</div>
                   </div>
                   <div className="p-4 bg-purple-50 rounded-lg">
                     <div className="text-2xl font-bold text-purple-600">{stats.attendanceRate}%</div>
                     <div className="text-sm text-purple-600">معدل الحضور</div>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 p-4">
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}