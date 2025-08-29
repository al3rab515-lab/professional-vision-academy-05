import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Construction, AlertTriangle, X, Settings, Send } from "lucide-react";
import { useAcademySettings } from "@/hooks/useAcademySettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GlobalMaintenanceAlertProps {
  userType?: 'student' | 'trainer' | 'admin' | 'employee';
}

export function GlobalMaintenanceAlert({ userType }: GlobalMaintenanceAlertProps) {
  const { getSetting, updateSetting } = useAcademySettings();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [alertVisible, setAlertVisible] = useState(true);

  useEffect(() => {
    const maintenanceStatus = getSetting('maintenance_mode', 'false');
    const message = getSetting('maintenance_message', 'الأكاديمية تحت الصيانة حالياً، يرجى عدم الحضور حتى إشعار آخر.');
    
    setIsMaintenanceMode(maintenanceStatus === 'true');
    setMaintenanceMessage(message);
    setCustomMessage(message);
  }, [getSetting]);

  const toggleMaintenanceMode = async () => {
    try {
      const newStatus = !isMaintenanceMode;
      await updateSetting('maintenance_mode', newStatus.toString());
      await updateSetting('maintenance_message', customMessage);
      
      setIsMaintenanceMode(newStatus);
      setMaintenanceMessage(customMessage);
      
      // Send notification to all users
      if (newStatus) {
        await sendMaintenanceNotification();
        toast.success('تم تفعيل وضع الصيانة وإرسال الإشعارات');
      } else {
        await sendMaintenanceEndNotification();
        toast.success('تم إنهاء وضع الصيانة وإرسال الإشعارات');
      }
      
      setShowAdminDialog(false);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('حدث خطأ في تحديث وضع الصيانة');
    }
  };

  const sendMaintenanceNotification = async () => {
    try {
      // Get all users
      const { data: users, error } = await supabase
        .from('academy_users')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      const notifications = [];
      
      for (const user of users || []) {
        // Send to user
        notifications.push({
          type: 'maintenance_alert',
          title: 'تنبيه صيانة',
          message: customMessage,
          user_id: user.id,
          phone_number: user.phone,
          status: 'sent'
        });

        // Send to parent if player
        if (user.user_type === 'player' && user.parent_phone) {
          notifications.push({
            type: 'maintenance_alert_parent',
            title: `تنبيه صيانة - ${user.full_name}`,
            message: `بخصوص اللاعب ${user.full_name}: ${customMessage}`,
            user_id: user.id,
            phone_number: user.parent_phone,
            status: 'sent'
          });
        }
      }

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('academy_notifications')
          .insert(notifications);

        if (notifError) throw notifError;
      }
    } catch (error) {
      console.error('Error sending maintenance notifications:', error);
    }
  };

  const sendMaintenanceEndNotification = async () => {
    try {
      // Get all users
      const { data: users, error } = await supabase
        .from('academy_users')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      const notifications = [];
      const endMessage = 'تم انتهاء الصيانة. يمكنكم الحضور بشكل طبيعي الآن.';
      
      for (const user of users || []) {
        // Send to user
        notifications.push({
          type: 'maintenance_end',
          title: 'انتهاء الصيانة',
          message: endMessage,
          user_id: user.id,
          phone_number: user.phone,
          status: 'sent'
        });

        // Send to parent if player
        if (user.user_type === 'player' && user.parent_phone) {
          notifications.push({
            type: 'maintenance_end_parent',
            title: `انتهاء الصيانة - ${user.full_name}`,
            message: `بخصوص اللاعب ${user.full_name}: ${endMessage}`,
            user_id: user.id,
            phone_number: user.parent_phone,
            status: 'sent'
          });
        }
      }

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('academy_notifications')
          .insert(notifications);

        if (notifError) throw notifError;
      }
    } catch (error) {
      console.error('Error sending maintenance end notifications:', error);
    }
  };

  const sendCustomAlert = async () => {
    if (!customMessage.trim()) {
      toast.error('يرجى كتابة الرسالة أولاً');
      return;
    }

    try {
      await updateSetting('maintenance_message', customMessage);
      setMaintenanceMessage(customMessage);
      
      if (isMaintenanceMode) {
        await sendMaintenanceNotification();
      }
      
      toast.success('تم تحديث الرسالة وإرسال الإشعارات');
      setShowAdminDialog(false);
    } catch (error) {
      console.error('Error sending custom alert:', error);
      toast.error('حدث خطأ في إرسال الرسالة');
    }
  };

  // Show global maintenance alert for all users
  if (isMaintenanceMode && alertVisible) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Construction className="w-6 h-6 animate-pulse" />
              <div>
                <p className="font-bold text-lg">تنبيه صيانة</p>
                <p className="text-sm opacity-90">{maintenanceMessage}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {(userType === 'admin' || userType === 'trainer') && (
                <Button
                  onClick={() => setShowAdminDialog(true)}
                  size="sm"
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Settings className="w-4 h-4 ml-1" />
                  إدارة
                </Button>
              )}
              
              <Button
                onClick={() => setAlertVisible(false)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Push content down to accommodate fixed alert */}
        <div className="h-20" />

        {/* Admin Dialog */}
        {(userType === 'admin' || userType === 'trainer') && (
          <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  إدارة وضع الصيانة
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    وضع الصيانة مفعل حالياً. جميع المستخدمين يشاهدون التنبيه.
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="block text-sm font-medium mb-2">رسالة الصيانة</label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="اكتب رسالة الصيانة..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={sendCustomAlert}
                    className="flex-1"
                    disabled={!customMessage.trim()}
                  >
                    <Send className="w-4 h-4 ml-1" />
                    تحديث الرسالة
                  </Button>
                  <Button
                    onClick={toggleMaintenanceMode}
                    variant="destructive"
                    className="flex-1"
                  >
                    إنهاء الصيانة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // Admin quick maintenance controls (when not in maintenance mode)
  if ((userType === 'admin' || userType === 'trainer') && !isMaintenanceMode) {
    return (
      <Card className="mb-4 border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Construction className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                وضع الصيانة متوقف
              </span>
            </div>
            
            <Button
              onClick={() => setShowAdminDialog(true)}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Settings className="w-4 h-4 ml-1" />
              تفعيل الصيانة
            </Button>
          </div>
          
          {/* Admin Dialog */}
          <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  تفعيل وضع الصيانة
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    سيتم إرسال تنبيه لجميع المستخدمين عند تفعيل وضع الصيانة.
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="block text-sm font-medium mb-2">رسالة الصيانة</label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="مثال: أجواء ممطرة - لا تداوم اليوم"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={toggleMaintenanceMode}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={!customMessage.trim()}
                  >
                    <Construction className="w-4 h-4 ml-1" />
                    تفعيل الصيانة
                  </Button>
                  <Button
                    onClick={() => setShowAdminDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return null;
}