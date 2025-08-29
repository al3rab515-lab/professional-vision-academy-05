import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExcuseSubmissionForm } from "./ExcuseSubmissionForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Trophy,
  Target
} from "lucide-react";

interface PlayerDashboardProps {
  playerCode: string;
  onLogout: () => void;
}

interface PlayerData {
  id: string;
  full_name: string;
  code: string;
  phone: string;
  age?: number;
  email?: string;
  status: string;
  address?: string;
  sport_type?: string;
  subscription_start_date?: string;
  subscription_days?: number;
  learning_goals?: string;
  guardian_phone?: string;
}

interface ExcuseData {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  trainer_response?: string;
  file_url?: string;
}

export function PlayerDashboard({ playerCode, onLogout }: PlayerDashboardProps) {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [excuses, setExcuses] = useState<ExcuseData[]>([]);
  const [showExcuseForm, setShowExcuseForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Fetch player data
      const { data: playerData, error: playerError } = await supabase
        .from('academy_users')
        .select('*')
        .eq('code', playerCode)
        .eq('user_type', 'player')
        .single();

      if (playerError || !playerData) {
        toast.error("خطأ في تحميل بيانات اللاعب");
        return;
      }

      setPlayer(playerData);

      // Fetch player's excuses
      const { data: excusesData, error: excusesError } = await supabase
        .from('excuse_submissions')
        .select('*')
        .eq('player_id', playerData.id)
        .order('submitted_at', { ascending: false });

      if (!excusesError && excusesData) {
        setExcuses(excusesData as ExcuseData[]);
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleExcuseSubmit = async (excuseData: { date: string; reason: string; files: File[] }) => {
    if (!player) return;

    try {
      let fileUrl = null;
      
      // Upload file if provided
      if (excuseData.files && excuseData.files.length > 0) {
        const file = excuseData.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `excuse_${player.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('academy-files')
          .upload(fileName, file);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('academy-files')
            .getPublicUrl(fileName);
          fileUrl = data.publicUrl;
        }
      }

      // Submit excuse
      const { error } = await supabase
        .from('excuse_submissions')
        .insert([{
          player_id: player.id,
          reason: excuseData.reason,
          file_url: fileUrl,
          status: 'pending'
        }]);

      if (error) {
        toast.error("خطأ في تقديم العذر");
        return;
      }

      toast.success("تم تقديم العذر بنجاح");
      fetchPlayerData(); // Refresh excuses
    } catch (error) {
      console.error('Error submitting excuse:', error);
      toast.error("حدث خطأ في تقديم العذر");
    }
  };

  const calculateDaysRemaining = () => {
    if (!player?.subscription_start_date || !player?.subscription_days) return 0;
    const startDate = new Date(player.subscription_start_date);
    const endDate = new Date(startDate.getTime() + player.subscription_days * 24 * 60 * 60 * 1000);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><Trophy className="w-3 h-3 ml-1" />نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getExcuseStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getExcuseStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد المراجعة';
      case 'approved':
        return 'تم القبول';
      case 'rejected':
        return 'تم الرفض';
      default:
        return 'غير محدد';
    }
  };

  useEffect(() => {
    fetchPlayerData();
  }, [playerCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600">لم يتم العثور على بيانات اللاعب</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-800">مرحباً {player.full_name}</CardTitle>
                  <p className="text-gray-600">كود اللاعب: {player.code}</p>
                  <div className="mt-2">{getStatusBadge(player.status)}</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="text-red-600 hover:bg-red-50 border-red-200"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Player Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  معلومات اللاعب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">العمر: {player.age} سنة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">الهاتف: {player.phone}</span>
                  </div>
                  {player.guardian_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">ولي الأمر: {player.guardian_phone}</span>
                    </div>
                  )}
                  {player.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{player.address}</span>
                    </div>
                  )}
                  {player.sport_type && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">الرياضة: {player.sport_type}</span>
                    </div>
                  )}
                  {player.learning_goals && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">الأهداف: {player.learning_goals}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Excuse History */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    تاريخ الأعذار
                  </CardTitle>
                  <Button 
                    onClick={() => setShowExcuseForm(true)}
                    className="gradient-primary"
                  >
                    <FileText className="w-4 h-4 ml-2" />
                    تقديم عذر جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {excuses.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد أعذار مقدمة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {excuses.map((excuse) => (
                      <Card key={excuse.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getExcuseStatusIcon(excuse.status)}
                                <span className="font-medium">{getExcuseStatusText(excuse.status)}</span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(excuse.submitted_at).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{excuse.reason}</p>
                              {excuse.trainer_response && (
                                <div className="bg-gray-50 p-2 rounded text-sm">
                                  <strong>رد المدرب:</strong> {excuse.trainer_response}
                                </div>
                              )}
                            </div>
                            {excuse.file_url && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(excuse.file_url!, '_blank')}
                              >
                                عرض الملف
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subscription Info */}
          <div className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  معلومات الاشتراك
                </CardTitle>
              </CardHeader>
              <CardContent>
                {player.subscription_start_date && player.subscription_days ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {calculateDaysRemaining()}
                      </div>
                      <p className="text-sm text-muted-foreground">يوم متبقي في الاشتراك</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>تاريخ البداية:</span>
                        <span>{new Date(player.subscription_start_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>مدة الاشتراك:</span>
                        <span>{player.subscription_days} يوم</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تاريخ الانتهاء:</span>
                        <span>
                          {new Date(
                            new Date(player.subscription_start_date).getTime() + 
                            player.subscription_days * 24 * 60 * 60 * 1000
                          ).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                    {calculateDaysRemaining() <= 7 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                          ⚠️ اشتراكك على وشك الانتهاء! يرجى التواصل مع الإدارة للتجديد.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">لا توجد معلومات اشتراك</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Excuse Submission Form */}
      {showExcuseForm && (
        <ExcuseSubmissionForm
          isOpen={showExcuseForm}
          onClose={() => setShowExcuseForm(false)}
          onSubmit={handleExcuseSubmit}
          studentName={player.full_name}
          playerId={player.id}
        />
      )}
    </div>
  );
}