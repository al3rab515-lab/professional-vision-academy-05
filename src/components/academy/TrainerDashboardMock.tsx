import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AddStudentForm } from './AddStudentForm';
import { AddTrainerForm } from './AddTrainerForm';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  Target,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface TrainerDashboardProps {
  userData: any;
  onManageStudents: () => void;
  onManageTrainers: () => void;
  onSettings: () => void;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ 
  userData,
  onManageStudents,
  onManageTrainers,
  onSettings
}) => {
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [showAddTrainerForm, setShowAddTrainerForm] = useState(false);
  
  // Mock data
  const students = [
    { id: '1', full_name: 'أحمد محمد', code: '1234567', sport_type: 'كرة القدم' },
    { id: '2', full_name: 'سارة علي', code: '2345678', sport_type: 'السباحة' },
    { id: '3', full_name: 'محمد عبدالله', code: '3456789', sport_type: 'كرة القدم' }
  ];
  
  const attendanceData = {
    present: 28,
    absent: 5,
    total: 33
  };
  
  const excuses = [
    { id: '1', student_name: 'أحمد محمد', reason: 'مرض', status: 'pending', submitted_at: new Date().toISOString() },
    { id: '2', student_name: 'سارة علي', reason: 'ظروف عائلية', status: 'approved', submitted_at: new Date().toISOString() }
  ];

  const handleAddStudent = async (studentData: any) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('تم إضافة الطالب بنجاح');
      setShowAddStudentForm(false);
    } catch (error) {
      toast.error('حدث خطأ في إضافة الطالب');
    }
  };

  const handleAddTrainer = async (trainerData: any) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newCode = trainerData.code;
      toast.success(`تم إضافة المدرب بنجاح - الكود: ${newCode}`);
      setShowAddTrainerForm(false);
    } catch (error) {
      toast.error('حدث خطأ في إضافة المدرب');
    }
  };

  const handleAttendanceMark = async (studentId: string, status: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`تم تسجيل ${status === 'present' ? 'حضور' : 'غياب'} الطالب`);
    } catch (error) {
      toast.error('حدث خطأ في تسجيل الحضور');
    }
  };

  const handleExcuseAction = async (excuseId: string, action: 'approved' | 'rejected', response: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`تم ${action === 'approved' ? 'قبول' : 'رفض'} العذر`);
    } catch (error) {
      toast.error('حدث خطأ في معالجة العذر');
    }
  };

  const attendancePercentage = attendanceData.total > 0 
    ? Math.round((attendanceData.present / attendanceData.total) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* ملف المدرب */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Target className="h-6 w-6" />
            ملف المدرب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">الاسم</p>
              <p className="font-semibold text-blue-900">{userData?.full_name || 'محمد الأحمد'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">التخصص</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                كرة القدم
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">كود المدرب</p>
              <p className="font-mono text-lg font-bold text-blue-600">{userData?.code || 'T123456'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نسبة الحضور</p>
                <p className="text-2xl font-bold text-green-600">{attendancePercentage}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الأعذار المعلقة</p>
                <p className="text-2xl font-bold text-orange-600">
                  {excuses.filter(e => e.status === 'pending').length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إدارة الحضور */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إدارة الحضور اليومي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.code} - {student.sport_type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAttendanceMark(student.id, 'present')}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    حضور
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAttendanceMark(student.id, 'absent')}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    غياب
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* مراجعة الأعذار */}
      <Card>
        <CardHeader>
          <CardTitle>مراجعة أعذار الغياب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {excuses.filter(e => e.status === 'pending').map((excuse) => (
              <div key={excuse.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{excuse.student_name}</p>
                    <p className="text-sm text-muted-foreground">{excuse.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(excuse.submitted_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Badge variant="secondary">معلق</Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleExcuseAction(excuse.id, 'approved', 'تم قبول العذر')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    قبول
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleExcuseAction(excuse.id, 'rejected', 'العذر غير مقبول')}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    رفض
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* إضافة طلاب ومدربين */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة الأعضاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => setShowAddStudentForm(true)} className="h-12">
              <UserPlus className="h-4 w-4 mr-2" />
              إضافة طالب
            </Button>
            <Button onClick={() => setShowAddTrainerForm(true)} variant="outline" className="h-12">
              <UserPlus className="h-4 w-4 mr-2" />
              إضافة مدرب
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forms */}
      {showAddStudentForm && (
        <AddStudentForm
          isOpen={showAddStudentForm}
          onClose={() => setShowAddStudentForm(false)}
          onAdd={handleAddStudent}
        />
      )}

      {showAddTrainerForm && (
        <AddTrainerForm
          isOpen={showAddTrainerForm}
          onClose={() => setShowAddTrainerForm(false)}
          onAdd={handleAddTrainer}
        />
      )}
    </div>
  );
};

export default TrainerDashboard;