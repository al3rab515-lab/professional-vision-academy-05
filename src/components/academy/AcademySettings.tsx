import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, ArrowLeft, Save, Shield, Bell, Palette, Bot, MessageSquare } from "lucide-react";
import { AdminCodeManager } from "./AdminCodeManager";
import { useAcademySettings } from "@/hooks/useAcademySettings";
import { toast } from "sonner";

interface AcademySettingsProps {
  onBack: () => void;
}

export function AcademySettings({ onBack }: AcademySettingsProps) {
  const { settings, getSetting, updateSetting, isMaintenanceMode, setMaintenanceMode, getAdminCode, updateAdminCode } = useAcademySettings();
  const [localSettings, setLocalSettings] = useState({
    academy_name: '',
    notification_enabled: true,
    maintenance_mode: false,
    ai_api_key: '',
    whatsapp_api_key: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings({
      academy_name: getSetting('academy_name', 'أكاديمية الرؤية المحترفة'),
      notification_enabled: getSetting('notification_enabled', 'true') === 'true',
      maintenance_mode: isMaintenanceMode(),
      ai_api_key: getSetting('ai_api_key', ''),
      whatsapp_api_key: getSetting('whatsapp_api_key', '')
    });
  }, [settings, getSetting, isMaintenanceMode]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('academy_name', localSettings.academy_name),
        updateSetting('notification_enabled', localSettings.notification_enabled ? 'true' : 'false'),
        updateSetting('ai_api_key', localSettings.ai_api_key),
        updateSetting('whatsapp_api_key', localSettings.whatsapp_api_key),
        setMaintenanceMode(localSettings.maintenance_mode)
      ]);
      
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleCodeChange = async (newCode: string) => {
    try {
      await updateAdminCode(newCode);
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="academy-fade-in">
          <Card className="gradient-card shadow-elegant border-0">
            <CardContent className="p-6">
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
                    <Settings className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-academy-text">إعدادات الأكاديمية</h1>
                    <p className="text-muted-foreground">إدارة إعدادات النظام والأمان</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* General Settings */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              الإعدادات العامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="academy_name">اسم الأكاديمية</Label>
              <Input
                id="academy_name"
                value={localSettings.academy_name}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, academy_name: e.target.value }))}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                سيظهر هذا الاسم في جميع أنحاء التطبيق
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">تفعيل الإشعارات</Label>
                <p className="text-sm text-muted-foreground">
                  تلقي إشعارات حول الحضور والغياب والأحداث المهمة
                </p>
              </div>
              <Switch
                checked={localSettings.notification_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, notification_enabled: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">وضع الصيانة</Label>
                <p className="text-sm text-muted-foreground">
                  منع الوصول للنظام مؤقتاً للصيانة أو التحديثات
                </p>
              </div>
              <Switch
                checked={localSettings.maintenance_mode}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, maintenance_mode: checked }))
                }
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-base font-medium">إعدادات API</h4>
              
              <div className="space-y-2">
                <Label htmlFor="ai_api_key">مفتاح API الذكاء الاصطناعي</Label>
                <Input
                  id="ai_api_key"
                  type="password"
                  value={localSettings.ai_api_key}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, ai_api_key: e.target.value }))}
                  placeholder="أدخل مفتاح OpenAI API"
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  مطلوب لتشغيل المساعد الذكي
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_api_key">مفتاح API واتساب</Label>
                <Input
                  id="whatsapp_api_key"
                  type="password"
                  value={localSettings.whatsapp_api_key}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, whatsapp_api_key: e.target.value }))}
                  placeholder="أدخل مفتاح WhatsApp Business API"
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  مطلوب لإرسال الإشعارات عبر واتساب
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="gradient-primary"
              >
                <Save className="h-4 w-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              إعدادات الأمان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminCodeManager
              currentCode={getAdminCode()}
              onCodeChange={handleCodeChange}
            />
          </CardContent>
        </Card>

        {/* AI Assistant Settings */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              إعدادات المساعد الذكي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">ميزات المساعد الذكي:</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• تحليل الإحصائيات والبيانات</li>
                  <li>• إنشاء التقارير التلقائية</li>
                  <li>• اقتراحات تحسين الأداء</li>
                  <li>• الإجابة على الاستفسارات الإدارية</li>
                  <li>• مساعدة في اتخاذ القرارات</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-1">ملاحظة مهمة</h4>
                <p className="text-sm text-orange-700">
                  المساعد الذكي متاح فقط للمدير ويتطلب مفتاح API صالح
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              إعدادات الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">أنواع الإشعارات المدعومة:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• إشعارات الحضور والغياب</li>
                  <li>• إشعارات انتهاء الاشتراكات</li>
                  <li>• إشعارات صيانة النظام</li>
                  <li>• إشعارات الأحوال الجوية</li>
                  <li>• إشعارات الأعذار والموافقات</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-1">معلومة مهمة</h4>
                <p className="text-sm text-orange-700">
                  سيتم إرسال الإشعارات عبر واتساب للطلاب والمدربين المسجلين
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}