import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, CreditCard, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlayerRenewalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onRenew: (renewalData: any) => void;
  player: any;
}

export function PlayerRenewalForm({ isOpen, onClose, onRenew, player }: PlayerRenewalFormProps) {
  const [renewalData, setRenewalData] = useState({
    duration: "30",
    startDate: new Date().toISOString().split('T')[0],
    price: "",
    notes: ""
  });
  const { toast } = useToast();

  const renewalOptions = [
    { value: "15", label: "15 يوم", price: "50" },
    { value: "30", label: "شهر واحد", price: "100" },
    { value: "60", label: "شهرين", price: "180" },
    { value: "90", label: "3 أشهر", price: "250" },
    { value: "180", label: "6 أشهر", price: "450" },
    { value: "365", label: "سنة كاملة", price: "800" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!renewalData.duration || !renewalData.startDate) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      await onRenew({
        ...renewalData,
        subscription_days: parseInt(renewalData.duration),
        subscription_start_date: renewalData.startDate,
        status: 'active'
      });
      
      toast({
        title: "تم التجديد بنجاح",
        description: `تم تجديد اشتراك ${player?.full_name} لمدة ${renewalOptions.find(opt => opt.value === renewalData.duration)?.label}`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "خطأ في التجديد",
        description: "حدث خطأ أثناء تجديد الاشتراك",
        variant: "destructive"
      });
    }
  };

  const selectedOption = renewalOptions.find(opt => opt.value === renewalData.duration);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            تجديد اشتراك اللاعب
          </DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{player?.full_name}</h3>
              <p className="text-sm text-muted-foreground">كود: {player?.code}</p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration">مدة التجديد</Label>
                <Select
                  value={renewalData.duration}
                  onValueChange={(value) => {
                    const option = renewalOptions.find(opt => opt.value === value);
                    setRenewalData({
                      ...renewalData,
                      duration: value,
                      price: option?.price || ""
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مدة التجديد" />
                  </SelectTrigger>
                  <SelectContent>
                    {renewalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <span className="text-primary font-semibold mr-4">{option.price} ريال</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ بداية التجديد</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="startDate"
                    type="date"
                    value={renewalData.startDate}
                    onChange={(e) => setRenewalData({...renewalData, startDate: e.target.value})}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">المبلغ المدفوع (ريال)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="المبلغ المدفوع"
                  value={renewalData.price}
                  onChange={(e) => setRenewalData({...renewalData, price: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Input
                  id="notes"
                  placeholder="ملاحظات على التجديد (اختياري)"
                  value={renewalData.notes}
                  onChange={(e) => setRenewalData({...renewalData, notes: e.target.value})}
                />
              </div>

              {selectedOption && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      المدة: {selectedOption.label}
                    </span>
                    <span className="font-semibold text-primary">
                      {selectedOption.price} ريال
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 gradient-primary">
                  <CreditCard className="w-4 h-4 ml-2" />
                  تأكيد التجديد
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="px-4"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}