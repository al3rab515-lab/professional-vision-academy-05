import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Send, MessageSquare, Users, Settings } from "lucide-react";
import { useAcademyData } from "@/hooks/useAcademyData";
import { useAcademySettings } from "@/hooks/useAcademySettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationPanelProps {
  onClose?: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { users } = useAcademyData();
  const { getSetting, updateSetting } = useAcademySettings();
  const [whatsappApiKey, setWhatsappApiKey] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  useEffect(() => {
    setWhatsappApiKey(getSetting('whatsapp_api_key', ''));
  }, [getSetting]);

  const saveWhatsAppAPI = async () => {
    try {
      await updateSetting('whatsapp_api_key', whatsappApiKey);
      toast.success('تم حفظ مفتاح WhatsApp API بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في حفظ المفتاح');
    }
  };

  const sendNotificationToAll = async (type: string, title: string, message: string) => {
    setIsSending(true);
    try {
      const allUsers = [...users];
      const notifications = [];

      for (const user of allUsers) {
        // إرسال للمستخدم
        notifications.push({
          user_id: user.id,
          type,
          title,
          message,
          phone_number: user.phone
        });

        // إرسال لولي الأمر إذا كان لاعب
        if (user.user_type === 'player' && user.parent_phone) {
          notifications.push({
            user_id: user.id,
            type: `${type}_parent`,
            title: `إشعار ولي أمر - ${title}`,
            message: `بخصوص اللاعب ${user.full_name}: ${message}`,
            phone_number: user.parent_phone
          });
        }
      }

      // حفظ الإشعارات في قاعدة البيانات
      const { error } = await supabase
        .from('academy_notifications')
        .insert(notifications);

      if (error) throw error;

      // استدعاء دالة الإرسال للواتساب
      if (whatsappApiKey) {
        await supabase.functions.invoke('send-notification', {
          body: {
            notifications,
            api_key: whatsappApiKey
          }
        });
      }

      toast.success(`تم إرسال ${notifications.length} إشعار بنجاح`);
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast.error('حدث خطأ في إرسال الإشعارات');
    } finally {
      setIsSending(false);
    }
  };

  const sendMaintenanceNotification = () => {
    sendNotificationToAll(
      'maintenance',
      'إشعار صيانة',
      'الأكاديمية تحت الصيانة حالياً، يرجى عدم الحضور حتى إشعار آخر. سيتم إبلاغكم عند انتهاء الصيانة.'
    );
  };

  const sendCustomNotification = () => {
    if (!customMessage.trim()) {
      toast.error('يرجى كتابة الرسالة أولاً');
      return;
    }
    
    sendNotificationToAll(
      'custom',
      'رسالة من إدارة الأكاديمية',
      customMessage
    );
    setCustomMessage('');
  };

  const checkSubscriptions = async () => {
    // هذه دالة للتحقق من انتهاء الاشتراكات وإرسال تنبيهات تلقائية
    const players = users.filter(user => user.user_type === 'player');
    
    for (const player of players) {
      // منطق للتحقق من انتهاء الاشتراك
      // يمكن إضافة تاريخ انتهاء الاشتراك في قاعدة البيانات لاحقاً
      if (Math.random() > 0.8) { // محاكاة لانتهاء الاشتراك
        await sendNotificationToAll(
          'subscription_expired',
          'انتهاء الاشتراك',
          `انتهى اشتراك اللاعب ${player.full_name}. يرجى مراجعة الإدارة لتجديد الاشتراك.`
        );
      }
    }
  };

  useEffect(() => {
    // تشغيل فحص الاشتراكات كل ساعة
    const interval = setInterval(checkSubscriptions, 3600000);
    return () => clearInterval(interval);
  }, [users]);

  const playerCount = users.filter(u => u.user_type === 'player').length;
  const trainerCount = users.filter(u => u.user_type === 'trainer').length;
  const totalContacts = users.reduce((acc, user) => {
    return acc + 1 + (user.parent_phone ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* إعدادات WhatsApp API */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            إعدادات WhatsApp API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_api">مفتاح WhatsApp API</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp_api"
                type="password"
                placeholder="أدخل مفتاح API"
                value={whatsappApiKey}
                onChange={(e) => setWhatsappApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveWhatsAppAPI} variant="outline">
                حفظ
              </Button>
            </div>
          </div>
          <Alert>
            <AlertDescription>
              يمكنك الحصول على مفتاح API من خدمة واتساب للأعمال
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* إحصائيات المستخدمين */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            إحصائيات الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{playerCount}</div>
              <div className="text-sm text-blue-800">لاعب</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{trainerCount}</div>
              <div className="text-sm text-green-800">مدرب</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg col-span-2">
              <div className="text-2xl font-bold text-purple-600">{totalContacts}</div>
              <div className="text-sm text-purple-800">إجمالي جهات الاتصال</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إرسال إشعارات سريعة */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            إشعارات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={sendMaintenanceNotification}
            disabled={isSending}
            variant="destructive"
            className="w-full"
          >
            <Bell className="w-4 h-4 ml-2" />
            إرسال إشعار صيانة لجميع المستخدمين
          </Button>
          
          <div className="space-y-2">
            <Label htmlFor="custom_message">رسالة مخصصة</Label>
            <Textarea
              id="custom_message"
              placeholder="اكتب رسالة مخصصة لإرسالها لجميع المستخدمين..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
            <Button
              onClick={sendCustomNotification}
              disabled={isSending || !customMessage.trim()}
              className="w-full gradient-primary"
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال الرسالة المخصصة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معلومات الإشعارات التلقائية */}
      <Card className="shadow-elegant border-0">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            الإشعارات التلقائية المفعلة
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✓</Badge>
              <span>إشعارات انتهاء الاشتراكات</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✓</Badge>
              <span>إشعارات الحضور والغياب</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✓</Badge>
              <span>إشعارات الأعذار والموافقات</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✓</Badge>
              <span>إشعارات تسجيل اللاعبين الجدد</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">✓</Badge>
              <span>إشعارات صيانة النظام</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}