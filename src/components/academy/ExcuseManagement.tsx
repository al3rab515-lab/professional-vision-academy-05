import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAcademyData } from "@/hooks/useAcademyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileText, 
  Upload, 
  Check, 
  X, 
  Clock,
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  XCircle,
  Download
} from "lucide-react";

interface ExcuseManagementProps {
  onBack: () => void;
  userType?: string;
}

interface ExcuseSubmission {
  id: string;
  player_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  trainer_response?: string;
  file_url?: string;
  player?: {
    full_name: string;
    code: string;
    guardian_phone?: string;
  };
}

export function ExcuseManagement({ onBack }: ExcuseManagementProps) {
  const { users, loading } = useAcademyData();
  const [excuses, setExcuses] = useState<ExcuseSubmission[]>([]);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedExcuse, setSelectedExcuse] = useState<ExcuseSubmission | null>(null);
  const [responseText, setResponseText] = useState('');
  const [loadingExcuses, setLoadingExcuses] = useState(false);

  const fetchExcuses = async () => {
    try {
      setLoadingExcuses(true);
      const { data, error } = await supabase
        .from('excuse_submissions')
        .select(`
          *,
          player:academy_users!player_id(full_name, code, guardian_phone)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const formattedExcuses = data?.map(excuse => ({
        ...excuse,
        player: excuse.player?.[0] || null
      })) || [];
      
      setExcuses(formattedExcuses as ExcuseSubmission[]);
    } catch (error) {
      console.error('Error fetching excuses:', error);
      toast.error('خطأ في تحميل الأعذار');
    } finally {
      setLoadingExcuses(false);
    }
  };

  useEffect(() => {
    fetchExcuses();
  }, []);

  const handleRespondToExcuse = async (excuseId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('excuse_submissions')
        .update({
          status,
          trainer_response: responseText,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', excuseId);

      if (error) throw error;

      toast.success(`تم ${status === 'approved' ? 'قبول' : 'رفض'} العذر`);
      setShowResponseDialog(false);
      setSelectedExcuse(null);
      setResponseText('');
      fetchExcuses(); // Refresh excuses
    } catch (error: any) {
      console.error('Error responding to excuse:', error);
      toast.error('حدث خطأ في الرد على العذر');
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" />قيد المراجعة</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />مقبول</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-academy-text">جاري تحميل الأعذار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="academy-fade-in">
          <Card className="gradient-card shadow-elegant border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
                      <FileText className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-academy-text">إدارة الأعذار</h1>
                      <p className="text-muted-foreground">
                        إدارة أعذار الغياب والموافقة عليها
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Excuses List */}
        <div className="grid gap-4">
          {loadingExcuses ? (
            <Card className="shadow-card border-0">
              <CardContent className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">جاري تحميل الأعذار...</p>
              </CardContent>
            </Card>
          ) : excuses.length === 0 ? (
            <Card className="shadow-elegant border-0 academy-fade-in">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد أعذار</h3>
                <p className="text-muted-foreground mb-6">لم يتم تقديم أي أعذار بعد</p>
              </CardContent>
            </Card>
          ) : (
            excuses.map((excuse) => (
              <Card key={excuse.id} className="shadow-elegant border-0 academy-fade-in hover:shadow-academy transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{excuse.player?.full_name || 'غير محدد'}</h3>
                        <p className="text-sm text-muted-foreground">كود: {excuse.player?.code || 'غير محدد'}</p>
                        <p className="text-sm text-muted-foreground">{excuse.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          تاريخ التقديم: {new Date(excuse.submitted_at).toLocaleDateString('ar-SA')}
                        </p>
                        {excuse.trainer_response && (
                          <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            <MessageSquare className="w-4 h-4 inline ml-1" />
                            {excuse.trainer_response}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {getStatusBadge(excuse.status)}
                      <div className="flex flex-col gap-2">
                         {excuse.file_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                window.open(excuse.file_url!, '_blank');
                              } catch (error) {
                                toast.error('خطأ في فتح الملف');
                              }
                            }}
                          >
                            <Download className="w-4 h-4 ml-1" />
                            عرض الملف
                          </Button>
                        )}
                        <div className="flex gap-1">
                          {excuse.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedExcuse(excuse);
                                setShowResponseDialog(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 ml-1" />
                              رد
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (confirm('هل أنت متأكد من حذف هذا العذر؟')) {
                                try {
                                  const { error } = await supabase
                                    .from('excuse_submissions')
                                    .delete()
                                    .eq('id', excuse.id);
                                  
                                  if (error) throw error;
                                  toast.success('تم حذف العذر بنجاح');
                                  fetchExcuses();
                                } catch (error) {
                                  console.error('Error deleting excuse:', error);
                                  toast.error('خطأ في حذف العذر');
                                }
                              }
                            }}
                          >
                            <X className="w-4 h-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Response Dialog */}
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>الرد على العذر</DialogTitle>
            </DialogHeader>
            {selectedExcuse && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">اللاعب: {selectedExcuse.player?.full_name}</p>
                  <p className="text-sm text-muted-foreground">السبب: {selectedExcuse.reason}</p>
                </div>
                <div>
                  <Label>رد المدرب</Label>
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    className="min-h-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleRespondToExcuse(selectedExcuse.id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 ml-1" />
                    قبول
                  </Button>
                  <Button 
                    onClick={() => handleRespondToExcuse(selectedExcuse.id, 'rejected')}
                    variant="destructive" 
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 ml-1" />
                    رفض
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}