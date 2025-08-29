import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AddEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: EmployeeData) => void;
}

interface EmployeeData {
  full_name: string;
  age: number;
  phone: string;
  salary: number;
  job_position: string;
  email?: string;
}

export function AddEmployeeForm({ isOpen, onClose, onAdd }: AddEmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeData>({
    full_name: "",
    age: 0,
    phone: "",
    salary: 0,
    job_position: "",
    email: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.full_name.trim()) {
      toast.error("يرجى إدخال الاسم");
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error("يرجى إدخال رقم الجوال");
      return;
    }
    
    if (!formData.phone.match(/^05\d{8}$/)) {
      toast.error("رقم الجوال يجب أن يبدأ بـ 05 ويكون 10 أرقام");
      return;
    }
    
    if (!formData.age || formData.age < 18 || formData.age > 70) {
      toast.error("العمر يجب أن يكون بين 18 و 70 سنة");
      return;
    }
    
    if (!formData.salary || formData.salary <= 0) {
      toast.error("يرجى إدخال راتب صحيح");
      return;
    }
    
    if (!formData.job_position.trim()) {
      toast.error("يرجى إدخال الوظيفة");
      return;
    }
    
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("البريد الإلكتروني غير صحيح");
      return;
    }
    
    onAdd(formData);
    setFormData({
      full_name: "",
      age: 0,
      phone: "",
      salary: 0,
      job_position: "",  
      email: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            إضافة موظف جديد
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">الاسم *</Label>
            <Input
              id="fullName"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="أدخل الاسم"
              required
            />
          </div>

          <div>
            <Label htmlFor="age">العمر *</Label>
            <Input
              id="age"
              type="number"
              value={formData.age || ""}
              onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
              placeholder="أدخل العمر"
              min="18"
              max="70"
              required
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">رقم الجوال *</Label>
            <Input
              id="phoneNumber"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="05xxxxxxxx"
              required
            />
          </div>

          <div>
            <Label htmlFor="salary">الراتب *</Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary || ""}
              onChange={(e) => setFormData({...formData, salary: parseInt(e.target.value) || 0})}
              placeholder="أدخل الراتب"
              min="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="jobPosition">الوظيفة *</Label>
            <Input
              id="jobPosition"
              value={formData.job_position}
              onChange={(e) => setFormData({...formData, job_position: e.target.value})}
              placeholder="أدخل الوظيفة"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="example@email.com"
            />
          </div>


          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" className="flex-1 gradient-primary">
              إضافة الموظف
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}