import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Key, Save } from "lucide-react";
import { toast } from "sonner";

interface AdminCodeChangerProps {
  currentCode: string;
  onCodeChange: (newCode: string) => void;
}

export function AdminCodeChanger({ currentCode, onCodeChange }: AdminCodeChangerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [codeInput, setCodeInput] = useState({
    letter: '',
    part1: '',
    part2: ''
  });

  const formatCodeDisplay = () => {
    if (!currentCode) return "لم يتم تعيين كود";
    return `${currentCode.charAt(0)}-${currentCode.slice(1, 3)}-${currentCode.slice(3)}`;
  };

  const handleSaveCode = () => {
    const { letter, part1, part2 } = codeInput;
    
    if (!letter || !part1 || !part2) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (!/^[A-Za-z]$/.test(letter)) {
      toast.error('يجب أن يكون الحرف الأول حرف إنجليزي');
      return;
    }

    if (!/^\d{2}$/.test(part1) || !/^\d{4}$/.test(part2)) {
      toast.error('يجب أن تكون الأرقام صحيحة (رقمان - 4 أرقام)');
      return;
    }

    const newCode = `${letter.toUpperCase()}${part1}${part2}`;
    onCodeChange(newCode);
    toast.success('تم حفظ الكود الجديد بنجاح');
    setShowDialog(false);
    setCodeInput({ letter: '', part1: '', part2: '' });
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className="border-primary text-primary hover:bg-primary/10"
      >
        <Key className="w-4 h-4 ml-2" />
        تغيير الكود
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              تغيير كود المدير
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>الكود الحالي:</strong> {formatCodeDisplay()}
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">الحرف الأول (A-Z)</label>
                <Input
                  value={codeInput.letter}
                  onChange={(e) => setCodeInput({...codeInput, letter: e.target.value.toUpperCase()})}
                  placeholder="A"
                  maxLength={1}
                  className="text-center font-mono text-lg"
                />
              </div>
              
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-sm font-medium">رقمان</label>
                  <Input
                    value={codeInput.part1}
                    onChange={(e) => setCodeInput({...codeInput, part1: e.target.value.replace(/\D/g, '').slice(0, 2)})}
                    placeholder="12"
                    maxLength={2}
                    className="text-center font-mono text-lg"
                  />
                </div>
                
                <div className="text-2xl font-bold">-</div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium">4 أرقام</label>
                  <Input
                    value={codeInput.part2}
                    onChange={(e) => setCodeInput({...codeInput, part2: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    placeholder="3456"
                    maxLength={4}
                    className="text-center font-mono text-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
              <div className="font-semibold mb-1">معاينة الكود الجديد:</div>
              <div className="font-mono text-lg">
                {codeInput.letter && codeInput.part1 && codeInput.part2 
                  ? `${codeInput.letter}-${codeInput.part1}-${codeInput.part2}`
                  : 'X-XX-XXXX'
                }
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-700">
              <div className="font-semibold mb-1">تذكير أمني:</div>
              <div>الكود الاحتياطي S12125 محفوظ ولا يتغير</div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveCode} className="flex-1" disabled={!codeInput.letter || !codeInput.part1 || !codeInput.part2}>
                <Save className="w-4 h-4 ml-2" />
                حفظ الكود
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}