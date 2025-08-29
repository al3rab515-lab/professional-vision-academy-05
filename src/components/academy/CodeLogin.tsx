import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Shield, Users } from "lucide-react";

interface CodeLoginProps {
  onLogin: (userType: 'student' | 'trainer' | 'admin' | 'employee', code: string) => void;
}

export function CodeLogin({ onLogin }: CodeLoginProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!code.trim()) {
        setError("يرجى إدخال الكود");
        setLoading(false);
        return;
      }

      // Check for backup admin code first
      if (code.trim() === "S12125") {
        onLogin('admin', code.trim());
        setLoading(false);
        return;
      }

      // Check against academy_users table
      const { data: users, error } = await supabase
        .from('academy_users')
        .select('*')
        .eq('code', code.trim())
        .single();

      if (error || !users) {
        setError("كود غير صالح أو غير موجود");
        setLoading(false);
        return;
      }

      // Check if user is active
      if (users.status !== 'active') {
        if (users.status === 'suspended') {
          setError("تم تعليق حسابك، يرجى التواصل مع الإدارة");
        } else if (users.status === 'inactive') {
          setError("حسابك غير نشط، يرجى التواصل مع الإدارة");
        } else {
          setError("حسابك غير متاح حالياً");
        }
        setLoading(false);
        return;
      }

      // Check subscription expiry for players
      if (users.user_type === 'player' && users.subscription_start_date && users.subscription_days) {
        const startDate = new Date(users.subscription_start_date);
        const endDate = new Date(startDate.getTime() + users.subscription_days * 24 * 60 * 60 * 1000);
        if (endDate < new Date()) {
          setError("انتهى اشتراكك، يرجى تجديد الاشتراك");
          setLoading(false);
          return;
        }
      }

      // Check maintenance mode (except for admins)
      if (users.user_type !== 'admin') {
        const { data: maintenanceSettings } = await supabase
          .from('academy_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();

        if (maintenanceSettings?.value === 'true') {
          setError("الأكاديمية تحت الصيانة حالياً، يرجى المحاولة لاحقاً");
          setLoading(false);
          return;
        }
      }

      onLogin(users.user_type as 'student' | 'trainer' | 'admin' | 'employee', code.trim());
    } catch (error: any) {
      console.error('Login error:', error);
      setError("حدث خطأ في تسجيل الدخول");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full p-2 shadow-lg">
            <img 
              src="/lovable-uploads/911f0f1e-826d-41c3-894d-ff329856b6c0.png" 
              alt="شعار أكاديمية الرؤية المحترفة" 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            أكاديمية الرؤية المحترفة
          </h1>
          <p className="text-white/80">أدخل كود الدخول للوصول إلى النظام</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elegant border-0 bg-purple-100/90">
          <CardHeader className="text-center">
            <CardTitle className="text-gray-800">تسجيل الدخول</CardTitle>
            <CardDescription className="text-gray-600">
              استخدم الكود المرسل إليك للوصول لحسابك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="أدخل كود الدخول"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg h-12 border-2 focus:border-purple-500 bg-white text-black placeholder:text-gray-500"
                  dir="ltr"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-center">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg font-medium gradient-primary hover:opacity-90 transition-opacity"
              >
                {loading ? "جاري التحقق..." : "دخول"}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card className="shadow-elegant border-0 bg-purple-100/90">
          <CardContent className="p-4">
            <h3 className="text-center text-gray-800 font-semibold mb-4">تابعنا على</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://www.tiktok.com/@vision16academy?is_from_webapp=1&sender_device=pc', '_blank')}
                className="bg-black text-white hover:bg-gray-800 border-black"
              >
                تابعنا تيكتوك
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://www.snapchat.com/add/vision16academy?sender_web_id=3227b61a-59bd-4c7a-b65a-fdf764245392&device_type=desktop&is_copy_url=true', '_blank')}
                className="bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
              >
                تابعنا سناب
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://www.instagram.com/vision16academy', '_blank')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0"
              >
                تابعنا انستقرام
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://x.com/vision16academy', '_blank')}
                className="bg-black text-white hover:bg-gray-800 border-black"
              >
                تابعنا X
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}