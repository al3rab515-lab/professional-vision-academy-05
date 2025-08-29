import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileText, 
  Check, 
  X, 
  Clock,
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  XCircle,
  Download,
  User
} from "lucide-react";

interface EnhancedExcuseManagementProps {
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

export function EnhancedExcuseManagement({ onBack }: EnhancedExcuseManagementProps) {
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
    
    // Real-time updates every 30 seconds
    const interval = setInterval(fetchExcuses, 30000);
    return () => clearInterval(interval);
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

  // Extract date from excuse reason or submitted_at
  const getExcuseDate = (excuse: ExcuseSubmission) => {
    const dateMatch = excuse.reason.match(/تاريخ الغياب: (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return new Date(dateMatch[1]).toLocaleDateString('ar-SA');
    }
    return new Date(excuse.submitted_at).toLocaleDateString('ar-SA');
  };

  // Extract reason without date
  const getCleanReason = (excuse: ExcuseSubmission) => {
    return excuse.reason.replace(/^تاريخ الغياب: \d{4}-\d{2}-\d{2} - /, '');
  };

  if (loadingExcuses) {
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
                      <h1 className="text-2xl font-bold text-academy-text">إدارة الأعذار المحسنة</h1>
                      <p className="text-muted-foreground">
                        إدارة أعذار الغياب مع عرض تفاصيل اللاعبين
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">إجمالي الأعذار</p>
                  <p className="text-2xl font-bold text-primary">{excuses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card border-0 academy-fade-in">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{excuses.filter(e => e.status === 'pending').length}</div>
              <div className="text-sm text-muted-foreground">قيد المراجعة</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 academy-fade-in">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{excuses.filter(e => e.status === 'approved').length}</div>
              <div className="text-sm text-muted-foreground">مقبول</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 academy-fade-in">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{excuses.filter(e => e.status === 'rejected').length}</div>
              <div className="text-sm text-muted-foreground">مرفوض</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 academy-fade-in">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{excuses.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي</div>
            </CardContent>
          </Card>
        </div>

        {/* Excuses List */}
        <div className="grid gap-4">
          {excuses.length === 0 ? (
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
                  <div className="flex items-start justify-between gap-4">
                    {/* Player Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-primary">
                            {excuse.player?.full_name || 'غير محدد'}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {excuse.player?.code || 'غير محدد'}
                          </Badge>
                          {getStatusBadge(excuse.status)}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            <strong>تاريخ الغياب:</strong> {getExcuseDate(excuse)}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>سبب الغياب:</strong> {getCleanReason(excuse)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            تاريخ التقديم: {new Date(excuse.submitted_at).toLocaleDateString('ar-SA')} - {new Date(excuse.submitted_at).toLocaleTimeString('ar-SA')}
                          </p>
                          {excuse.player?.guardian_phone && (
                            <p className="text-xs text-muted-foreground">
                              جوال ولي الأمر: {excuse.player.guardian_phone}
                            </p>
                          )}
                        </div>
                        
                        {excuse.trainer_response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">رد المدرب:</span>
                            </div>
                            <p className="text-sm text-blue-700">{excuse.trainer_response}</p>
                            {excuse.reviewed_at && (
                              <p className="text-xs text-blue-600 mt-1">
                                تاريخ الرد: {new Date(excuse.reviewed_at).toLocaleDateString('ar-SA')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 items-end">
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
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 ml-1" />
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
                              setResponseText('');
                              setShowResponseDialog(true);
                            }}
                            className="text-xs"
                          >
                            <MessageSquare className="w-3 h-3 ml-1" />
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
                          className="text-xs"
                        >
                          <X className="w-3 h-3 ml-1" />
                          حذف
                        </Button>
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>الرد على العذر</DialogTitle>
            </DialogHeader>
            {selectedExcuse && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">اللاعب: {selectedExcuse.player?.full_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>تاريخ الغياب:</strong> {getExcuseDate(selectedExcuse)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>السبب:</strong> {getCleanReason(selectedExcuse)}
                    </p>
                  </div>
                </div>
                <div>
                  <Label>رد المدرب</Label>
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="اكتب ردك على العذر..."
                    className="min-h-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleRespondToExcuse(selectedExcuse.id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!responseText.trim()}
                  >
                    <CheckCircle className="w-4 h-4 ml-1" />
                    قبول
                  </Button>
                  <Button 
                    onClick={() => handleRespondToExcuse(selectedExcuse.id, 'rejected')}
                    variant="destructive" 
                    className="flex-1"
                    disabled={!responseText.trim()}
                  >
                    <XCircle className="w-4 h-4 ml-1" />
                    رفض
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  يجب كتابة رد لاتخاذ أي إجراء
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}