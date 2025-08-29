import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Eye,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  code: string;
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  salary: number;
  permissions: string[];
}

interface StaffManagementProps {
  onBack: () => void;
}

export function StaffManagement({ onBack }: StaffManagementProps) {
  const [staff, setStaff] = useState<Staff[]>([
    {
      id: '1',
      name: 'سارة أحمد المطيري',
      email: 'sarah.almutairi@academy.sa',
      phone: '+966501234567',
      position: 'منسقة أكاديمية',
      department: 'الشؤون الأكاديمية',
      code: 'ST-101A',
      status: 'active',
      joinDate: '2023-03-15',
      salary: 8500,
      permissions: ['view_students', 'edit_attendance']
    },
    {
      id: '2',
      name: 'محمد عبدالله الغامدي',
      email: 'mohammed.alghamdi@academy.sa',
      phone: '+966509876543',
      position: 'مطور تقني',
      department: 'تقنية المعلومات',
      code: 'ST-102B',
      status: 'active',
      joinDate: '2023-01-10',
      salary: 12000,
      permissions: ['system_admin', 'full_access']
    },
    {
      id: '3',
      name: 'فاطمة علي الزهراني',
      email: 'fatima.alzahrani@academy.sa',
      phone: '+966555123456',
      position: 'أخصائية دعم فني',
      department: 'الدعم الفني',
      code: 'ST-103C',
      status: 'suspended',
      joinDate: '2023-06-20',
      salary: 7000,
      permissions: ['view_tickets', 'respond_support']
    },
    {
      id: '4',
      name: 'خالد سعد القحطاني',
      email: 'khalid.alqahtani@academy.sa',
      phone: '+966543210987',
      position: 'محاسب مالي',
      department: 'الشؤون المالية',
      code: 'ST-104D',
      status: 'active',
      joinDate: '2022-11-05',
      salary: 9500,
      permissions: ['view_finances', 'manage_payments']
    }
  ]);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    permissions: [] as string[]
  });

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const generateStaffCode = (): string => {
    const prefix = 'ST-';
    const number = Math.floor(Math.random() * 900) + 100;
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${prefix}${number}${letter}`;
  };

  const departments = [
    'الشؤون الأكاديمية',
    'تقنية المعلومات', 
    'الدعم الفني',
    'الشؤون المالية',
    'الموارد البشرية',
    'التسويق والإعلان'
  ];

  const positions = [
    'منسقة أكاديمية',
    'مطور تقني',
    'أخصائية دعم فني',
    'محاسب مالي',
    'أخصائي موارد بشرية',
    'منسق تسويق'
  ];

  const permissions = [
    { id: 'view_students', name: 'عرض الطلاب' },
    { id: 'edit_attendance', name: 'تعديل الحضور' },
    { id: 'system_admin', name: 'إدارة النظام' },
    { id: 'full_access', name: 'صلاحية كاملة' },
    { id: 'view_tickets', name: 'عرض التذاكر' },
    { id: 'respond_support', name: 'الرد على الدعم' },
    { id: 'view_finances', name: 'عرض الماليات' },
    { id: 'manage_payments', name: 'إدارة المدفوعات' }
  ];

  const addStaff = () => {
    const staff_member: Staff = {
      id: Date.now().toString(),
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone,
      position: newStaff.position,
      department: newStaff.department,
      code: generateStaffCode(),
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      salary: parseInt(newStaff.salary),
      permissions: newStaff.permissions
    };

    setStaff(prev => [...prev, staff_member]);
    setNewStaff({
      name: '', email: '', phone: '', position: '', 
      department: '', salary: '', permissions: []
    });
    setIsAddDialogOpen(false);
  };

  const updateStaff = () => {
    if (!editingStaff) return;
    
    setStaff(prev => prev.map(s => 
      s.id === editingStaff.id ? editingStaff : s
    ));
    setEditingStaff(null);
    setIsEditDialogOpen(false);
  };

  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const toggleStaffStatus = (id: string) => {
    setStaff(prev => prev.map(s => 
      s.id === id 
        ? { ...s, status: s.status === 'active' ? 'suspended' : 'active' }
        : s
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive">موقف</Badge>;
      case 'pending':
        return <Badge variant="secondary">في الانتظار</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const activeStaff = staff.filter(s => s.status === 'active').length;
  const suspendedStaff = staff.filter(s => s.status === 'suspended').length;
  const totalSalaries = staff.filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.salary, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-academy-text">إدارة الموظفين</h2>
          <p className="text-muted-foreground mt-1">
            إضافة وإدارة موظفي أكاديمية الرؤية المحترفة
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          العودة للوحة الرئيسية
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-3xl font-bold text-primary">{staff.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الموظفين النشطين</p>
                <p className="text-3xl font-bold text-green-600">{activeStaff}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الموظفين الموقفين</p>
                <p className="text-3xl font-bold text-destructive">{suspendedStaff}</p>
              </div>
              <UserX className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الرواتب</p>
                <p className="text-2xl font-bold text-primary">{totalSalaries.toLocaleString()} ريال</p>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">قائمة الموظفين</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 ml-2" />
              إضافة موظف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@academy.sa"
                />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+966xxxxxxxxx"
                />
              </div>
              <div>
                <Label htmlFor="salary">الراتب الشهري</Label>
                <Input
                  id="salary"
                  type="number"
                  value={newStaff.salary}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="المبلغ بالريال"
                />
              </div>
              <div>
                <Label htmlFor="department">القسم</Label>
                <Select onValueChange={(value) => setNewStaff(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="position">المنصب</Label>
                <Select onValueChange={(value) => setNewStaff(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنصب" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={addStaff} className="gradient-primary">
                إضافة الموظف
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Table */}
      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-academy-gray">
                <tr>
                  <th className="text-right p-4 font-semibold">الاسم</th>
                  <th className="text-right p-4 font-semibold">المنصب</th>
                  <th className="text-right p-4 font-semibold">القسم</th>
                  <th className="text-right p-4 font-semibold">الكود</th>
                  <th className="text-right p-4 font-semibold">الحالة</th>
                  <th className="text-right p-4 font-semibold">الراتب</th>
                  <th className="text-center p-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-academy-gray/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-academy-text">{member.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Mail className="w-3 h-3" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{member.position}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{member.department}</Badge>
                    </td>
                    <td className="p-4">
                      <code className="bg-academy-gray px-2 py-1 rounded text-sm font-mono">
                        {member.code}
                      </code>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{member.salary.toLocaleString()} ريال</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingStaff(member);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleStaffStatus(member.id)}
                          className={member.status === 'active' ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
                        >
                          {member.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteStaff(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
          </DialogHeader>
          {editingStaff && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">الاسم الكامل</Label>
                <Input
                  id="edit-name"
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingStaff.email}
                  onChange={(e) => setEditingStaff(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input
                  id="edit-phone"
                  value={editingStaff.phone}
                  onChange={(e) => setEditingStaff(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-salary">الراتب الشهري</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={editingStaff.salary}
                  onChange={(e) => setEditingStaff(prev => prev ? { ...prev, salary: parseInt(e.target.value) } : null)}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={updateStaff} className="gradient-primary">
              حفظ التغييرات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}