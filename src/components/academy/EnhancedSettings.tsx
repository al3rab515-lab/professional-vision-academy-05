import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ArrowLeft, Save, Volume2, Move3D, Bot, Palette, Bell } from "lucide-react";
import { AdminCodeManager } from "./AdminCodeManager";
import { useAcademySettings } from "@/hooks/useAcademySettings";
import { toast } from "sonner";

interface EnhancedSettingsProps {
  onBack: () => void;
}

export function EnhancedSettings({ onBack }: EnhancedSettingsProps) {
  const { settings, getSetting, updateSetting, isMaintenanceMode, setMaintenanceMode, getAdminCode, updateAdminCode } = useAcademySettings();
  const [localSettings, setLocalSettings] = useState({
    academy_name: '',
    notification_enabled: true,
    maintenance_mode: false,
    ai_api_key: '',
    ai_model: 'gpt-4o-mini',
    whatsapp_api_key: '',
    sound_enabled: true,
    sound_volume: 50,
    notification_sound: 'default',
    ui_animations: true,
    theme_mode: 'light',
    drag_enabled: true,
    layout_locked: false,
    auto_backup: true,
    backup_interval: '24'
  });
  const [saving, setSaving] = useState(false);

  const aiModels = [
    { value: 'gpt-5-2025-08-07', label: 'GPT-5 (الأحدث)' },
    { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini (سريع)' },
    { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano (اقتصادي)' },
    { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' }
  ];

  const soundOptions = [
    { value: 'default', label: 'افتراضي' },
    { value: 'beep', label: 'نغمة قصيرة' },
    { value: 'chime', label: 'جرس' },
    { value: 'notification', label: 'إشعار' }
  ];

  useEffect(() => {
    setLocalSettings({
      academy_name: getSetting('academy_name', 'أكاديمية الرؤية المحترفة'),
      notification_enabled: getSetting('notification_enabled', 'true') === 'true',
      maintenance_mode: isMaintenanceMode(),
      ai_api_key: getSetting('ai_api_key', ''),
      ai_model: getSetting('ai_model', 'gpt-4o-mini'),
      whatsapp_api_key: getSetting('whatsapp_api_key', ''),
      sound_enabled: getSetting('sound_enabled', 'true') === 'true',
      sound_volume: parseInt(getSetting('sound_volume', '50')),
      notification_sound: getSetting('notification_sound', 'default'),
      ui_animations: getSetting('ui_animations', 'true') === 'true',
      theme_mode: getSetting('theme_mode', 'light'),
      drag_enabled: getSetting('drag_enabled', 'true') === 'true',
      layout_locked: getSetting('layout_locked', 'false') === 'true',
      auto_backup: getSetting('auto_backup', 'true') === 'true',
      backup_interval: getSetting('backup_interval', '24')
    });
  }, [settings, getSetting, isMaintenanceMode]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('academy_name', localSettings.academy_name),
        updateSetting('notification_enabled', localSettings.notification_enabled ? 'true' : 'false'),
        updateSetting('ai_api_key', localSettings.ai_api_key),
        updateSetting('ai_model', localSettings.ai_model),
        updateSetting('whatsapp_api_key', localSettings.whatsapp_api_key),
        updateSetting('sound_enabled', localSettings.sound_enabled ? 'true' : 'false'),
        updateSetting('sound_volume', localSettings.sound_volume.toString()),
        updateSetting('notification_sound', localSettings.notification_sound),
        updateSetting('ui_animations', localSettings.ui_animations ? 'true' : 'false'),
        updateSetting('theme_mode', localSettings.theme_mode),
        updateSetting('drag_enabled', localSettings.drag_enabled ? 'true' : 'false'),
        updateSetting('layout_locked', localSettings.layout_locked ? 'true' : 'false'),
        updateSetting('auto_backup', localSettings.auto_backup ? 'true' : 'false'),
        updateSetting('backup_interval', localSettings.backup_interval),
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

  const testSound = () => {
    if ('AudioContext' in window) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = localSettings.notification_sound === 'beep' ? 800 : 400;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(localSettings.sound_volume / 100, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      toast.success('تم تشغيل الصوت التجريبي');
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
                    <h1 className="text-2xl font-bold text-academy-text">الإعدادات المتقدمة</h1>
                    <p className="text-muted-foreground">إدارة شاملة لجميع إعدادات النظام</p>
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
          </CardContent>
        </Card>

        {/* Sound Settings */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              إعدادات الصوت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">تفعيل الأصوات</Label>
                <p className="text-sm text-muted-foreground">
                  تشغيل الأصوات للإشعارات والتنبيهات
                </p>
              </div>
              <Switch
                checked={localSettings.sound_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, sound_enabled: checked }))
                }
              />
            </div>

            {localSettings.sound_enabled && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <Label>مستوى الصوت: {localSettings.sound_volume}%</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[localSettings.sound_volume]}
                      onValueChange={(value) => 
                        setLocalSettings(prev => ({ ...prev, sound_volume: value[0] }))
                      }
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Button
                      onClick={testSound}
                      variant="outline"
                      size="sm"
                    >
                      تجربة
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>نوع صوت الإشعار</Label>
                  <Select
                    value={localSettings.notification_sound}
                    onValueChange={(value) => 
                      setLocalSettings(prev => ({ ...prev, notification_sound: value }))
                    }
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {soundOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Movement and Layout Settings */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Move3D className="w-5 h-5 text-primary" />
              إعدادات الحركة والتخطيط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">تفعيل الحركة والسحب</Label>
                <p className="text-sm text-muted-foreground">
                  السماح بسحب وإعادة ترتيب العناصر في الواجهة
                </p>
              </div>
              <Switch
                checked={localSettings.drag_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, drag_enabled: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">قفل التخطيط</Label>
                <p className="text-sm text-muted-foreground">
                  منع تغيير مواضع العناصر عن طريق الخطأ
                </p>
              </div>
              <Switch
                checked={localSettings.layout_locked}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, layout_locked: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">تفعيل الرسوم المتحركة</Label>
                <p className="text-sm text-muted-foreground">
                  إظهار التأثيرات البصرية والانتقالات السلسة
                </p>
              </div>
              <Switch
                checked={localSettings.ui_animations}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, ui_animations: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              إعدادات الذكاء الاصطناعي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
              <Label>نموذج الذكاء الاصطناعي</Label>
              <Select
                value={localSettings.ai_model}
                onValueChange={(value) => 
                  setLocalSettings(prev => ({ ...prev, ai_model: value }))
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                GPT-5 هو الأحدث والأقوى، GPT-5 Mini أسرع وأوفر
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
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              إعدادات النسخ الاحتياطي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">النسخ الاحتياطي التلقائي</Label>
                <p className="text-sm text-muted-foreground">
                  إنشاء نسخة احتياطية تلقائياً من البيانات
                </p>
              </div>
              <Switch
                checked={localSettings.auto_backup}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, auto_backup: checked }))
                }
              />
            </div>

            {localSettings.auto_backup && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>فترة النسخ الاحتياطي (ساعات)</Label>
                  <Select
                    value={localSettings.backup_interval}
                    onValueChange={(value) => 
                      setLocalSettings(prev => ({ ...prev, backup_interval: value }))
                    }
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">كل 6 ساعات</SelectItem>
                      <SelectItem value="12">كل 12 ساعة</SelectItem>
                      <SelectItem value="24">يومياً</SelectItem>
                      <SelectItem value="168">أسبوعياً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - Admin Code */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              الإجراءات السريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminCodeManager 
              currentCode={getAdminCode()}
              onCodeChange={handleCodeChange}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="text-center pb-8">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="gradient-primary px-8 py-3 text-lg"
            size="lg"
          >
            <Save className="h-5 w-5 ml-2" />
            {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
          </Button>
        </div>
      </div>
    </div>
  );
}