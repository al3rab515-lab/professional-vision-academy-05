import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";

interface AddStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: StudentData) => void;
}

interface StudentData {
  name: string;
  fatherPhone: string;
  personalPhone?: string;
  age: number;
  address?: string;
  subscriptionDays: number;
  track: string;
}

const sports = [
  "كرة القدم",
  "السباحة", 
  "الكاراتيه",
  "الملعب الصابوني",
  "اللياقة البدنية",
  "التايكوندو"
];

export function AddStudentForm({ isOpen, onClose, onAdd }: AddStudentFormProps) {
  const [formData, setFormData] = useState<StudentData>({
    name: "",
    fatherPhone: "",
    personalPhone: "",
    age: 0,
    address: "",
    subscriptionDays: 30,
    track: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.fatherPhone || !formData.track || !formData.age) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    onAdd(formData);
    setFormData({
      name: "",
      fatherPhone: "",
      personalPhone: "",
      age: 0,
      address: "",
      subscriptionDays: 30,
      track: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            إضافة طالب جديد
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">اسم الطالب *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="أدخل اسم الطالب"
              required
            />
          </div>

          <div>
            <Label htmlFor="fatherPhone">رقم هاتف الأب *</Label>
            <Input
              id="fatherPhone"
              value={formData.fatherPhone}
              onChange={(e) => setFormData({...formData, fatherPhone: e.target.value})}
              placeholder="05xxxxxxxx"
              required
            />
          </div>

          <div>
            <Label htmlFor="personalPhone">رقم هاتف الطالب (اختياري)</Label>
            <Input
              id="personalPhone"
              value={formData.personalPhone}
              onChange={(e) => setFormData({...formData, personalPhone: e.target.value})}
              placeholder="05xxxxxxxx"
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
              min="5"
              max="50"
              required
            />
          </div>

          <div>
            <Label htmlFor="track">المسار الرياضي *</Label>
            <Select value={formData.track} onValueChange={(value) => setFormData({...formData, track: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المسار الرياضي" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subscriptionDays">مدة الاشتراك (بالأيام) *</Label>
            <Input
              id="subscriptionDays"
              type="number"
              value={formData.subscriptionDays}
              onChange={(e) => setFormData({...formData, subscriptionDays: parseInt(e.target.value) || 30})}
              placeholder="30"
              min="1"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">عنوان السكن (اختياري)</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="أدخل عنوان السكن"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" className="flex-1 gradient-primary">
              إضافة الطالب
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}