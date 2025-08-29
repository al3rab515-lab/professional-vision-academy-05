import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExcuseSubmissionForm } from "./ExcuseSubmissionForm";
import { StudentStatistics } from "./StudentStatistics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface StudentData {
  id: string;
  code: string;
  full_name: string;
  phone: string;
  age?: number;
  email?: string;
  user_type: string;
  status: string;
  residential_area?: string;
  subscription_duration?: string;
  learning_goals?: string;
  sport_type?: string;
  subscription_start_date?: string;
  subscription_days?: number;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface ExcuseData {
  date: string;
  reason: string;
  files: File[];
}

interface StudentDashboardRealProps {
  studentCode: string;
  userData: StudentData;
}

export function StudentDashboardReal({ studentCode, userData }: StudentDashboardRealProps) {
  const [showExcuseForm, setShowExcuseForm] = useState(false);

  // Calculate subscription status
  const getSubscriptionStatus = () => {
    if (!userData.subscription_start_date || !userData.subscription_days) {
      return { remainingDays: 0, totalDays: 0, percentage: 0, isExpired: true };
    }

    const startDate = new Date(userData.subscription_start_date);
    const endDate = new Date(startDate.getTime() + userData.subscription_days * 24 * 60 * 60 * 1000);
    const today = new Date();
    const remainingTime = endDate.getTime() - today.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
    const percentage = (remainingDays / userData.subscription_days) * 100;

    return {
      remainingDays,
      totalDays: userData.subscription_days,
      percentage,
      isExpired: remainingDays <= 0
    };
  };

  const subscriptionStatus = getSubscriptionStatus();

  const handleExcuseSubmit = async (excuseData: ExcuseData) => {
    try {
      let fileUrl = null;
      let fileName = null;

      // Upload file if provided
      if (excuseData.files.length > 0) {
        const file = excuseData.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${userData.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('excuse-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast.error('حدث خطأ في رفع الملف');
          return;
        }

        const { data: urlData } = supabase.storage
          .from('excuse-files')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      // Insert excuse record
      const { error } = await supabase
        .from('excuse_submissions')
        .insert([{
          player_id: userData.id,
          excuse_date: excuseData.date,
          reason: excuseData.reason,
          file_url: fileUrl,
          file_name: fileName,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('تم تقديم العذر بنجاح');
      setShowExcuseForm(false);
    } catch (error) {
      console.error('Error submitting excuse:', error);
      toast.error('حدث خطأ في تقديم العذر');
    }
  };

  const handleContactTrainer = async () => {
    try {
      // Check daily message limit
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRequests, error: countError } = await supabase
        .from('academy_notifications')
        .select('id')
        .eq('user_id', userData.id)
        .eq('type', 'chat_request')
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59');

      if (countError) throw countError;

      if (todayRequests && todayRequests.length >= 2) {
        toast.error("لقد تجاوزت الحد اليومي (2 طلبات في اليوم)");
        return;
      }

      // Create chat request
      const { error } = await supabase
        .from('academy_notifications')
        .insert([{
          type: 'chat_request',
          title: `طلب محادثة من ${userData.full_name}`,
          message: `اللاعب ${userData.full_name} يريد التواصل معك`,
          phone_number: 'trainer_notification',
          user_id: userData.id,
          status: 'sent'
        }]);

      if (error) throw error;

      toast.success("تم تقديم طلب التواصل مع المدرب ✅");
    } catch (error) {
      console.error('Error contacting trainer:', error);
      toast.error("حدث خطأ في إرسال الطلب");
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
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-academy">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-academy-text">مرحباً {userData.full_name}</h1>
                  <p className="text-academy-text/80 text-lg">كود اللاعب: {userData.code}</p>
                  <Badge className="mt-2 academy-badge">
                    <CheckCircle className="w-3 h-3 ml-1" />
                    لاعب نشط
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Information */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">الاسم الكامل:</span>
                  <span className="font-medium">{userData.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">رقم الهاتف:</span>
                  <span className="font-medium">{userData.phone}</span>
                </div>
                {userData.age && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">العمر:</span>
                    <span className="font-medium">{userData.age} سنة</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {userData.residential_area && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">المنطقة السكنية:</span>
                    <span className="font-medium">{userData.residential_area}</span>
                  </div>
                )}
                {userData.sport_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">نوع الرياضة:</span>
                    <span className="font-medium">{userData.sport_type}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              حالة الاشتراك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">الأيام المتبقية</span>
                <span className="font-bold text-lg">{subscriptionStatus.remainingDays} يوم</span>
              </div>
              <Progress value={subscriptionStatus.percentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-academy-gray rounded-lg">
                <p className="text-2xl font-bold text-primary">{subscriptionStatus.totalDays}</p>
                <p className="text-sm text-muted-foreground">إجمالي الأيام</p>
              </div>
              <div className="p-3 bg-academy-gray rounded-lg">
                <p className="text-2xl font-bold text-academy-purple">{subscriptionStatus.remainingDays}</p>
                <p className="text-sm text-muted-foreground">الأيام المتبقية</p>
              </div>
            </div>

            {subscriptionStatus.isExpired ? (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">انتهى الاشتراك! يرجى التجديد</span>
                </div>
              </div>
            ) : subscriptionStatus.remainingDays <= 7 ? (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">تنبيه: الاشتراك ينتهي قريباً!</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Student Statistics */}
        <StudentStatistics studentId={userData.id} />

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="shadow-card border-0 academy-fade-in">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <FileText className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-lg font-semibold">تقديم عذر</h3>
                <p className="text-sm text-muted-foreground">قدم عذر عن الغياب مع المرفقات</p>
                <Button 
                  onClick={() => setShowExcuseForm(true)}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 ml-2" />
                  تقديم عذر
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 academy-fade-in">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <MessageCircle className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-lg font-semibold">التواصل مع المدرب</h3>
                <p className="text-sm text-muted-foreground">أرسل رسالة للمدرب (2 رسائل يومياً)</p>
                <Button 
                  onClick={handleContactTrainer}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  تواصل مع المدرب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Goals */}
        {userData.learning_goals && (
          <Card className="shadow-card border-0 academy-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                أهداف التعلم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{userData.learning_goals}</p>
            </CardContent>
          </Card>
        )}

        {/* Excuse Form Modal */}
        {showExcuseForm && (
          <ExcuseSubmissionForm
            isOpen={showExcuseForm}
            onClose={() => setShowExcuseForm(false)}
            onSubmit={handleExcuseSubmit}
            studentName={userData.full_name}
            playerId={userData.id}
          />
        )}
      </div>
    </div>
  );
}