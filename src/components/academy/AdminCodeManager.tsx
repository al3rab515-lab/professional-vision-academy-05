import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Edit, Key } from "lucide-react";
import { toast } from "sonner";

interface AdminCodeManagerProps {
  currentCode: string;
  onCodeChange: (newCode: string) => void;
}

export function AdminCodeManager({ currentCode, onCodeChange }: AdminCodeManagerProps) {
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  const handleChangeCode = () => {
    if (!newCode.trim()) {
      toast.error('يرجى إدخال الكود الجديد');
      return;
    }
    
    if (newCode !== confirmCode) {
      toast.error('الكود غير متطابق');
      return;
    }

    if (newCode.length < 4) {
      toast.error('الكود يجب أن يكون 4 أرقام على الأقل');
      return;
    }

    onCodeChange(newCode);
    toast.success('تم تغيير كود المدير بنجاح');
    setShowChangeDialog(false);
    setNewCode('');
    setConfirmCode('');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            معلومات المدير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">المدير الحالي</p>
            <Badge variant="outline" className="font-mono text-lg px-3 py-1">
              عيسى المحياني
            </Badge>
          </div>
          
          <Button 
            onClick={() => setShowChangeDialog(true)}
            variant="outline"
            className="w-full"
          >
            <Key className="w-4 h-4 ml-2" />
            تغيير كود المدير
          </Button>
          
          <div className="bg-muted p-3 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">ملاحظات أمنية:</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• كود المدير محمي ومخفي لأغراض الأمان</li>
              <li>• لا يمكن عرض الكود لأي شخص آخر</li>
              <li>• النظام يحتفظ بسجل دخول المدير</li>
              <li>• في حالة نسيان الكود، راجع إدارة النظام</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير كود المدير</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الكود الجديد</label>
              <Input
                type="password"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="أدخل الكود الجديد"
              />
            </div>
            <div>
              <label className="text-sm font-medium">تأكيد الكود</label>
              <Input
                type="password"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="أعد إدخال الكود"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleChangeCode} className="flex-1">
                تغيير الكود
              </Button>
              <Button variant="outline" onClick={() => setShowChangeDialog(false)} className="flex-1">
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}