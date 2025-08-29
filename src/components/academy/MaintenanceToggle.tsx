import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Construction, Settings, RefreshCw } from "lucide-react";
import { useAcademySettings } from "@/hooks/useAcademySettings";
import { toast } from "sonner";

export function MaintenanceToggle() {
  const { 
    isMaintenanceMode, 
    setMaintenanceMode, 
    getSetting, 
    updateSetting 
  } = useAcademySettings();
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMaintenanceActive(isMaintenanceMode());
  }, [isMaintenanceMode]);

  useEffect(() => {
    // تحديث كل دقيقتين
    const interval = setInterval(() => {
      setIsMaintenanceActive(isMaintenanceMode());
    }, 120000);

    return () => clearInterval(interval);
  }, [isMaintenanceMode]);

  const toggleMaintenance = async () => {
    setIsLoading(true);
    try {
      const newStatus = !isMaintenanceActive;
      await setMaintenanceMode(newStatus);
      setIsMaintenanceActive(newStatus);
      
      if (newStatus) {
        toast.success("تم تفعيل وضع الصيانة");
      } else {
        toast.success("تم إيقاف وضع الصيانة");
      }
    } catch (error) {
      toast.error("حدث خطأ في تغيير وضع الصيانة");
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewCodes = async () => {
    setIsLoading(true);
    try {
      const newAdminCode = `V9-${Math.floor(Math.random() * 900000) + 100000}`;
      await updateSetting('admin_code', newAdminCode);
      toast.success(`تم إنشاء كود جديد: ${newAdminCode}`);
    } catch (error) {
      toast.error("حدث خطأ في إنشاء الأكواد الجديدة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-elegant border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="w-5 h-5 text-orange-500" />
          إدارة الصيانة والأكواد
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={isMaintenanceActive ? "destructive" : "default"}>
          <AlertDescription className="text-center text-lg">
            {isMaintenanceActive ? "🔧 الأكاديمية تحت الصيانة" : "✅ الأكاديمية تعمل بشكل طبيعي"}
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <h4 className="font-semibold">وضع الصيانة</h4>
            <p className="text-sm text-muted-foreground">
              تفعيل/إيقاف وضع الصيانة للنظام
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isMaintenanceActive}
              onCheckedChange={toggleMaintenance}
              disabled={isLoading}
              className={`${
                isMaintenanceActive 
                  ? 'data-[state=checked]:bg-red-500' 
                  : 'data-[state=unchecked]:bg-green-500'
              }`}
            />
            <div className={`w-3 h-3 rounded-full ${
              isMaintenanceActive ? 'bg-red-500' : 'bg-green-500'
            }`} />
          </div>
        </div>

        <Button
          onClick={generateNewCodes}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تغيير الأكواد
        </Button>

        <div className="text-center space-y-1 text-xs text-muted-foreground">
          <p>• سيتم حفظ الإعدادات تلقائياً</p>
          <p>• يتم التحديث كل دقيقتين</p>
          <p>• البيانات محفوظة بشكل دائم</p>
        </div>
      </CardContent>
    </Card>
  );
}