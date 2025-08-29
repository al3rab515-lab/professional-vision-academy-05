import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddEmployeeForm } from "./AddEmployeeForm";
import { useAcademyData } from "@/hooks/useAcademyData";
import { 
  Users, 
  UserPlus, 
  Search, 
  ArrowLeft, 
  Phone,
  Briefcase,
  UserX,
  DollarSign
} from "lucide-react";

interface EmployeeManagementProps {
  onBack: () => void;
}

export function EmployeeManagement({ onBack }: EmployeeManagementProps) {
  const { users, loading, addUser, deleteUser } = useAcademyData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const employees = users.filter(user => user.user_type === 'employee');
  
  const filteredEmployees = employees.filter(employee =>
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.code.includes(searchTerm) ||
    employee.phone.includes(searchTerm)
  );

  const generateEmployeeCode = () => {
    return 'E-' + Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleAddEmployee = async (employeeData: any) => {
    try {
      const newEmployee = {
        code: employeeData.code || generateEmployeeCode(),
        full_name: employeeData.full_name,
        phone: employeeData.phone,
        age: employeeData.age,
        email: employeeData.email || undefined,
        salary: employeeData.salary,
        job_position: employeeData.job_position,
        user_type: 'employee' as const,
        status: 'active' as const
      };
      
      await addUser(newEmployee);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
        await deleteUser(employeeId);
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-academy-text">جاري تحميل بيانات الموظفين...</p>
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
                      <h1 className="text-2xl font-bold text-academy-text">إدارة الموظفين</h1>
                      <p className="text-muted-foreground">
                        إجمالي الموظفين: {employees.length} | النشطون: {employees.filter(e => e.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gradient-primary"
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة موظف
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

        {/* Employees List */}
        {filteredEmployees.length === 0 ? (
          <Card className="shadow-elegant border-0 academy-fade-in">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد موظفين</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'لا توجد نتائج للبحث المحدد' : 'لم يتم إضافة أي موظفين بعد'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddForm(true)} className="gradient-primary">
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة أول موظف
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="shadow-elegant border-0 academy-fade-in hover:shadow-academy transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{employee.full_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {employee.phone}
                          </span>
                          {employee.job_position && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {employee.job_position}
                            </span>
                          )}
                          {employee.salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {employee.salary.toLocaleString()} ريال
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        كود الموظف: <span className="font-mono font-bold text-green-600">{employee.code}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        انضم: {new Date(employee.created_at).toLocaleDateString('ar-SA')}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <UserX className="w-4 h-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Employee Form */}
        <AddEmployeeForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAdd={handleAddEmployee}
        />
      </div>
    </div>
  );
}