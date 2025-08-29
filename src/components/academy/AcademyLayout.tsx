import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIPanel } from "./AIPanel";
import { StudentDashboardReal } from "./StudentDashboardReal";
import { AdminDashboard } from "./AdminDashboard";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { TrainerDashboard } from "./TrainerDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LogOut, 
  Menu,
  X,
  Bell,
  GraduationCap
} from "lucide-react";

interface AcademyLayoutProps {
  userType: 'student' | 'player' | 'trainer' | 'admin' | 'employee';
  userCode: string;
  userData: any;
  onLogout: () => void;
  setUserCode: (code: string) => void;
}

export function AcademyLayout({ userType, userCode, userData, onLogout, setUserCode }: AcademyLayoutProps) {
  const [showAIPanel, setShowAIPanel] = useState(userType === 'admin');
  const [notifications] = useState([
    "مرحباً بك في نظام الأكاديمية",
    "تحقق من حضورك اليومي"
  ]);

  const getUserTypeName = (type: string) => {
    switch (type) {
      case 'student': 
      case 'player': return 'لاعب';
      case 'trainer': return 'مدرب';
      case 'admin': return 'مدير';
      case 'employee': return 'موظف';
      default: return 'مستخدم';
    }
  };

  const handleStudentAction = (action: string) => {
    console.log(`Student action: ${action}`);
    // In real app, implement actual functionality
  };

  const handleAdminAction = (action: string) => {
    console.log(`Admin action: ${action}`);
    
    // Handle navigation to different sections
    if (action === 'manage-students') {
      // Navigate to student management
      window.location.hash = '#player-management';
    } else if (action === 'manage-trainers') {
      // Navigate to trainer management  
      window.location.hash = '#trainer-management';
    } else if (action === 'settings') {
      // Navigate to academy settings
      window.location.hash = '#academy-settings';
    } else if (action === 'maintenance') {
      // Navigate to maintenance mode
      window.location.hash = '#maintenance-mode';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* AI Panel - Left Side - Admin Only */}
      {showAIPanel && userType === 'admin' && (
        <div className="w-80 border-l border-border p-4 academy-slide-in">
          <AIPanel 
            userType={userType}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-academy-text">
                    أكاديمية الرؤية المحترفة
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {getUserTypeName(userType)} - {userCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>

              {/* Toggle AI Panel - Admin Only */}
              {userType === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIPanel(!showAIPanel)}
                >
                  {showAIPanel ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              )}

              {/* Return to Main Page */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                العودة للصفحة الرئيسية
              </Button>

              {/* Logout */}
              <Button
                variant="ghost" 
                size="sm"
                onClick={onLogout}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5" />
                خروج
              </Button>
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Social Media Links */}
          <div className="mb-6">
            <Card className="shadow-card border-0">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-center">تابعنا على</h3>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.tiktok.com/@vision16academy?is_from_webapp=1&sender_device=pc', '_blank')}
                    className="flex items-center gap-2 hover:bg-black hover:text-white"
                  >
                    TikTok تيك توك
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.snapchat.com/add/vision16academy?sender_web_id=3227b61a-59bd-4c7a-b65a-fdf764245392&device_type=desktop&is_copy_url=true', '_blank')}
                    className="flex items-center gap-2 hover:bg-yellow-400 hover:text-black"
                  >
                    Snapchat سناب شات
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.instagram.com/vision16academy', '_blank')}
                    className="flex items-center gap-2 hover:bg-pink-500 hover:text-white"
                  >
                    Instagram انستقرام
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://x.com/vision16academy', '_blank')}
                    className="flex items-center gap-2 hover:bg-blue-500 hover:text-white"
                  >
                    X (Twitter) إكس
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          {(userType === 'student' || userType === 'player') && (
            <StudentDashboardReal
              studentCode={userCode}
              userData={userData}
            />
          )}

          {userType === 'admin' && (
            <AdminDashboard
              currentCode={userCode}
              onManageStudents={() => handleAdminAction('manage-students')}
              onManageTrainers={() => handleAdminAction('manage-trainers')}
              onSettings={() => handleAdminAction('settings')}
              onMaintenanceMode={() => handleAdminAction('maintenance')}
              onCodeChange={(newCode) => {
                setUserCode(newCode);
                console.log('Admin code updated to:', newCode);
              }}
            />
          )}

          {userType === 'employee' && (
            <EmployeeDashboard
              currentCode={userCode}
              userData={userData}
            />
          )}

          {userType === 'trainer' && (
            <TrainerDashboard 
              trainerCode={userCode}
              onLogout={onLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}