import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddStudentForm } from "./AddStudentForm";
import { useAcademyData } from "@/hooks/useAcademyData";
import { 
  Users, 
  UserPlus, 
  Search, 
  ArrowLeft, 
  Calendar,
  MapPin,
  Phone,
  Trophy
} from "lucide-react";

interface StudentManagementProps {
  onBack: () => void;
}

export function StudentManagement({ onBack }: StudentManagementProps) {
  const { users, loading, addUser, generateStudentCode } = useAcademyData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const students = users.filter(user => user.user_type === 'student');
  
  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.code.includes(searchTerm) ||
    student.phone.includes(searchTerm)
  );

  const handleAddStudent = async (studentData: any) => {
    try {
      const code = generateStudentCode();
      await addUser({
        ...studentData,
        code,
        user_type: 'student',
        status: 'active'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const getSubscriptionStatus = (student: any) => {
    if (!student.subscription_start_date) return 'غير محدد';
    
    const startDate = new Date(student.subscription_start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + student.subscription_days);
    
    const now = new Date();
    const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (remainingDays > 7) return 'نشط';
    if (remainingDays > 0) return 'ينتهي قريباً';
    return 'منتهي';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'default';
      case 'ينتهي قريباً': return 'secondary';
      case 'منتهي': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-academy-text">جاري تحميل بيانات الطلاب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="academy-fade-in">
          <Card className="gradient-card shadow-elegant border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="hover:bg-white/20"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-academy">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-academy-text">إدارة الطلاب</h1>
                      <p className="text-muted-foreground">
                        إجمالي الطلاب: {students.length} | النشطون: {students.filter(s => s.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gradient-primary"
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة طالب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الكود أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <Card className="shadow-elegant border-0 academy-fade-in">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد طلاب</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'لا توجد نتائج للبحث المحدد' : 'لم يتم إضافة أي طلاب بعد'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddForm(true)} className="gradient-primary">
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة أول طالب
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredStudents.map((student) => {
              const subscriptionStatus = getSubscriptionStatus(student);
              
              return (
                <Card key={student.id} className="shadow-elegant border-0 academy-fade-in hover:shadow-academy transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{student.full_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {student.phone}
                            </span>
                            {student.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {student.address}
                              </span>
                            )}
                            {student.sport_type && (
                              <Badge variant="outline">{student.sport_type}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(subscriptionStatus) as any}>
                            {subscriptionStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          كود الطالب: <span className="font-mono">{student.code}</span>
                        </p>
                        {student.subscription_start_date && (
                          <p className="text-xs text-muted-foreground">
                            الاشتراك: {student.subscription_days} يوم
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Student Form */}
        <AddStudentForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAdd={handleAddStudent}
        />
      </div>
    </div>
  );
}