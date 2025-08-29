import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, MapPin, Trophy, Clock, Send, MessageCircle } from "lucide-react";
import { ExcuseSubmissionForm } from './ExcuseSubmissionForm';
import { toast } from "sonner";

interface StudentDashboardProps {
  userData: any;
  onSendExcuse: () => void;
  onContactTrainer: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  userData, 
  onSendExcuse, 
  onContactTrainer 
}) => {
  const [showExcuseForm, setShowExcuseForm] = useState(false);
  
  // Mock data - replace with real data later
  const attendanceData = {
    present: 24,
    absent: 3,
    total: 27
  };
  
  const notifications = [
    { id: 1, title: 'مرحباً بك', message: 'نتمنى لك تجربة ممتازة في الأكاديمية', created_at: new Date().toISOString() },
    { id: 2, title: 'تذكير', message: 'موعد الحصة القادمة غداً الساعة 5 مساءً', created_at: new Date().toISOString() }
  ];
  
  const subscriptionData = {
    remainingDays: 22,
    totalDays: 30
  };

  const handleExcuseSubmit = async (excuseData: { date: string; reason: string; files: File[] }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('تم إرسال العذر بنجاح');
      setShowExcuseForm(false);
    } catch (error) {
      toast.error('حدث خطأ في إرسال العذر');
    }
  };

  const attendancePercentage = attendanceData.total > 0 
    ? Math.round((attendanceData.present / attendanceData.total) * 100) 
    : 0;

  const subscriptionPercentage = subscriptionData.totalDays > 0 
    ? Math.round((subscriptionData.remainingDays / subscriptionData.totalDays) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* ملف الطالب الشخصي */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            ملف الطالب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">الاسم</p>
              <p className="font-semibold">{userData?.full_name || 'أحمد محمد'}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-semibold">الرياض</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">التخصص</p>
              <Badge variant="outline" className="mt-1">
                كرة القدم
              </Badge>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">كود الطالب</p>
            <p className="font-mono text-lg font-bold text-primary">{userData?.code || '1234567'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* حالة الاشتراك */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              حالة الاشتراك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">الأيام المتبقية</span>
              <span className="text-2xl font-bold text-primary">
                {subscriptionData.remainingDays}
              </span>
            </div>
            <Progress value={subscriptionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              من أصل {subscriptionData.totalDays} يوم
            </p>
            <Badge 
              variant={subscriptionData.remainingDays > 7 ? "default" : "destructive"}
              className="w-full justify-center"
            >
              {subscriptionData.remainingDays > 7 ? "فعال" : subscriptionData.remainingDays > 0 ? "ينتهي قريباً" : "منتهي"}
            </Badge>
          </CardContent>
        </Card>

        {/* ملخص الحضور */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              ملخص الحضور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{attendanceData.present}</p>
                <p className="text-xs text-muted-foreground">حضور</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{attendanceData.absent}</p>
                <p className="text-xs text-muted-foreground">غياب</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{attendanceData.total}</p>
                <p className="text-xs text-muted-foreground">المجموع</p>
              </div>
            </div>
            <Progress value={attendancePercentage} className="h-2" />
            <p className="text-center text-sm">
              نسبة الحضور: {attendancePercentage}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الإجراءات السريعة */}
      <Card>
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => setShowExcuseForm(true)}
              className="h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Send className="h-4 w-4 mr-2" />
              إرسال عذر غياب
            </Button>
            <Button 
              onClick={onContactTrainer}
              variant="outline"
              className="h-12 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              التواصل مع المدرب
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الإشعارات الأخيرة */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الإشعارات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification: any) => (
                <div key={notification.id} className="p-3 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ExcuseSubmissionForm
        isOpen={showExcuseForm}
        onClose={() => setShowExcuseForm(false)}
        onSubmit={handleExcuseSubmit}
        studentName={userData?.full_name || 'الطالب'}
        playerId={userData?.id || ''}
      />
    </div>
  );
};

export default StudentDashboard;