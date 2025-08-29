import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface StudentData {
  name: string;
  age: number;
  image: string;
  location: string;
  subscriptionDays: number;
  remainingDays: number;
  specialty: string;
  attendance: {
    present: number;
    absent: number;
    total: number;
  };
  lastAttendance: string;
}

interface StudentDashboardProps {
  studentCode: string;
  onSendExcuse: () => void;
  onContactTrainer: () => void;
}

export function StudentDashboard({ studentCode, onSendExcuse, onContactTrainer }: StudentDashboardProps) {
  // Mock student data - in real app, fetch based on studentCode
  const [studentData] = useState<StudentData>({
    name: "أحمد محمد العلي",
    age: 22,
    image: "/placeholder-avatar.png",
    location: "الرياض، السعودية",
    subscriptionDays: 90,
    remainingDays: 45,
    specialty: "تطوير التطبيقات",
    attendance: {
      present: 32,
      absent: 8,
      total: 40
    },
    lastAttendance: "2024-01-15"
  });

  const attendancePercentage = (studentData.attendance.present / studentData.attendance.total) * 100;
  const subscriptionPercentage = (studentData.remainingDays / studentData.subscriptionDays) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academy-fade-in">
        <Card className="gradient-card shadow-elegant border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-academy-text">{studentData.name}</h2>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {studentData.location}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {studentData.specialty}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">كود الطالب</p>
                <p className="font-mono text-lg font-bold text-primary">{studentCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription Status */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              حالة الاشتراك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>الأيام المتبقية</span>
                <span className="font-bold">{studentData.remainingDays} يوم</span>
              </div>
              <Progress value={subscriptionPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-academy-gray rounded-lg">
                <p className="text-2xl font-bold text-primary">{studentData.subscriptionDays}</p>
                <p className="text-sm text-muted-foreground">إجمالي الأيام</p>
              </div>
              <div className="p-3 bg-academy-gray rounded-lg">
                <p className="text-2xl font-bold text-academy-purple">{studentData.remainingDays}</p>
                <p className="text-sm text-muted-foreground">الأيام المتبقية</p>
              </div>
            </div>

            {studentData.remainingDays <= 7 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">تنبيه: الاشتراك ينتهي قريباً!</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Record */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              سجل الحضور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>نسبة الحضور</span>
                <span className="font-bold">{Math.round(attendancePercentage)}%</span>
              </div>
              <Progress value={attendancePercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-bold">{studentData.attendance.present}</span>
                </div>
                <p className="text-xs text-green-700">حاضر</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="font-bold">{studentData.attendance.absent}</span>
                </div>
                <p className="text-xs text-red-700">غائب</p>
              </div>
              <div className="p-3 bg-academy-gray rounded-lg">
                <p className="font-bold text-academy-text">{studentData.attendance.total}</p>
                <p className="text-xs text-muted-foreground">المجموع</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card border-0 academy-fade-in">
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
          <CardDescription>
            يمكنك رفع عذر غياب أو التواصل مع مدربك من هنا
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={onSendExcuse}
              variant="outline"
              className="h-12 border-2 border-primary/20 hover:border-primary"
            >
              <FileText className="w-5 h-5 ml-2" />
              رفع عذر غياب
            </Button>
            <Button
              onClick={onContactTrainer}
              variant="outline" 
              className="h-12 border-2 border-primary/20 hover:border-primary"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              التواصل مع المدرب
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}