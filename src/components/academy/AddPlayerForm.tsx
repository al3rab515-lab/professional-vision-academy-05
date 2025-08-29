import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddPlayerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (player: PlayerData) => void;
}

interface PlayerData {
  full_name: string;
  age: number;
  phone: string;
  residential_area: string;
  email?: string;
  subscription_duration: string;
  learning_goals: string;
  sport_type: string;
  code?: string;
  user_type: 'player';
  status: 'active';
}

export function AddPlayerForm({ isOpen, onClose, onAdd }: AddPlayerFormProps) {
  const [formData, setFormData] = useState<PlayerData>({
    full_name: "",
    age: 0,
    phone: "",
    residential_area: "",
    email: "",
    subscription_duration: "",
    learning_goals: "",
    sport_type: "",
    code: "",
    user_type: 'player',
    status: 'active'
  });

  const generatePlayerCode = () => {
    const code = 'P-' + Math.floor(100000 + Math.random() * 900000).toString();
    setFormData({...formData, code: code});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.age || !formData.residential_area || !formData.subscription_duration || !formData.learning_goals || !formData.sport_type) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    if (!formData.code) {
      generatePlayerCode();
      return; // Re-submit after generating code
    }
    
    onAdd(formData);
    setFormData({
      full_name: "",
      age: 0,
      phone: "",
      residential_area: "",
      email: "",
      subscription_duration: "",
      learning_goals: "",
      sport_type: "",
      code: "",
      user_type: 'player',
      status: 'active'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            إضافة لاعب جديد
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">الاسم الثلاثي *</Label>
            <Input
              id="fullName"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="أدخل الاسم الثلاثي"
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
              min="5"
              max="50"
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
            <Label htmlFor="residentialArea">منطقة السكن *</Label>
            <Input
              id="residentialArea"
              value={formData.residential_area}
              onChange={(e) => setFormData({...formData, residential_area: e.target.value})}
              placeholder="أدخل منطقة السكن"
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

          <div>
            <Label htmlFor="subscriptionDuration">مدة الاشتراك *</Label>
            <Input
              id="subscriptionDuration"
              value={formData.subscription_duration}
              onChange={(e) => setFormData({...formData, subscription_duration: e.target.value})}
              placeholder="مثل: 1ش (شهر)، 3ش (3 شهور)، 6ش (6 شهور)، 1س (سنة)"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              اكتب المدة بالتنسيق: رقم + ش للشهور أو س للسنوات (مثال: 3ش، 1س)
            </p>
          </div>

          <div>
            <Label htmlFor="sportType">النوع الرياضي *</Label>
            <Select value={formData.sport_type} onValueChange={(value) => setFormData({...formData, sport_type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع الرياضي" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="سباحة">سباحة</SelectItem>
                <SelectItem value="كرة قدم">كرة قدم</SelectItem>
                <SelectItem value="ملعب صابوني">ملعب صابوني</SelectItem>
                <SelectItem value="تايكوندو">تايكوندو</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="specialization">التخصص أو ما يريد تعلمه *</Label>
            <Textarea
              id="specialization"
              value={formData.learning_goals}
              onChange={(e) => setFormData({...formData, learning_goals: e.target.value})}
              placeholder="اكتب التخصص أو الرياضة التي يريد تعلمها"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="playerCode">كود اللاعب</Label>
            <div className="flex gap-2">
              <Input
                id="playerCode"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="كود اللاعب"
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={generatePlayerCode}>
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
              إضافة اللاعب
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}