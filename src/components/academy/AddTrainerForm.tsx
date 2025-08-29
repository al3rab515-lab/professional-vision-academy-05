import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddTrainerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (trainer: TrainerData) => void;
}

interface TrainerData {
  full_name: string;
  age: number;
  phone: string;
  salary: number;
  job_position: string;
  sport_type: string;
  email?: string;
  code?: string;
  user_type: 'trainer';
  status: 'active';
}

export function AddTrainerForm({ isOpen, onClose, onAdd }: AddTrainerFormProps) {
  const [formData, setFormData] = useState<TrainerData>({
    full_name: "",
    age: 0,
    phone: "",
    salary: 0,
    job_position: "",
    sport_type: "",
    email: "",
    code: "",
    user_type: 'trainer',
    status: 'active'
  });

  const generateTrainerCode = () => {
    const code = 'T-' + Math.floor(100000 + Math.random() * 900000).toString();
    setFormData({...formData, code: code});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.age || !formData.salary || !formData.job_position || !formData.sport_type) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    if (!formData.code) {
      generateTrainerCode();
      return;
    }
    
    onAdd(formData);
    setFormData({
      full_name: "",
      age: 0,
      phone: "",
      salary: 0,
      job_position: "",
      sport_type: "",
      email: "",
      code: "",
      user_type: 'trainer',
      status: 'active'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            إضافة مدرب جديد
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">الاسم *</Label>
            <Input
              id="name"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="أدخل اسم المدرب"
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
              max="65"
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
              onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})}
              placeholder="أدخل الراتب بالريال"
              min="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="jobPosition">الوظيفة *</Label>
            <Textarea
              id="jobPosition"
              value={formData.job_position}
              onChange={(e) => setFormData({...formData, job_position: e.target.value})}
              placeholder="حدد الوظيفة والمسؤوليات"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="sportType">التخصص الرياضي *</Label>
            <Select value={formData.sport_type} onValueChange={(value) => setFormData({...formData, sport_type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر التخصص الرياضي" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="سباحة">سباحة</SelectItem>
                <SelectItem value="كرة قدم">كرة قدم</SelectItem>
                <SelectItem value="ملعب صابوني">ملعب صابوني</SelectItem>
                <SelectItem value="تايكوندو">تايكوندو</SelectItem>
                <SelectItem value="استقبال">استقبال</SelectItem>
              </SelectContent>
            </Select>
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

          <div>
            <Label htmlFor="trainerCode">كود المدرب</Label>
            <div className="flex gap-2">
              <Input
                id="trainerCode"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="كود المدرب"
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={generateTrainerCode}>
                <RefreshCw className="w-4 h-4 ml-1" />
                توليد
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" className="flex-1 gradient-primary">
              إضافة المدرب
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}