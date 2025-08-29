import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, FileText, Send, AlertCircle, CheckCircle, XCircle, User } from "lucide-react";
import { useAcademyData } from "@/hooks/useAcademyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnhancedExcuseSystemProps {
  currentUser: any;
  userType: 'student' | 'trainer' | 'admin';
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'absent' | 'present' | 'excused';
  player_id: string;
}

interface ExcuseSubmission {
  id: string;
  player_id: string;
  absence_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  trainer_response?: string;
  file_url?: string;
  player?: {
    full_name: string;
    code: string;
    phone: string;
  };
}

export function EnhancedExcuseSystem({ currentUser, userType }: EnhancedExcuseSystemProps) {
  const { users } = useAcademyData();
  const [absenceDates, setAbsenceDates] = useState<AttendanceRecord[]>([]);
  const [excuses, setExcuses] = useState<ExcuseSubmission[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [excuseReason, setExcuseReason] = useState('');
  const [showExcuseDialog, setShowExcuseDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedExcuse, setSelectedExcuse] = useState<ExcuseSubmission | null>(null);
  const [trainerResponse, setTrainerResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch student's absence dates
  const fetchAbsenceDates = async () => {
    if (userType !== 'student') return;
    
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('player_id', currentUser.id)
        .eq('status', 'absent')
        .order('date', { ascending: false });

      if (error) throw error;
      setAbsenceDates((data || []) as AttendanceRecord[]);
    } catch (error) {
      console.error('Error fetching absence dates:', error);
    }
  };

  // Fetch excuses
  const fetchExcuses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('excuse_submissions')
        .select(`
          *,
          player:academy_users!player_id(full_name, code, phone)
        `);

      if (userType === 'student') {
        query = query.eq('player_id', currentUser.id);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });

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
      setLoading(false);
    }
  };

  // Submit excuse (Student only)
  const submitExcuse = async () => {
    if (!selectedDate || !excuseReason.trim()) {
      toast.error('يرجى اختيار تاريخ الغياب وكتابة السبب');
      return;
    }

    // Check if excuse already exists for this date
    const existingExcuse = excuses.find(excuse => 
      excuse.absence_date === selectedDate && excuse.player_id === currentUser.id
    );

    if (existingExcuse) {
      toast.error('تم تقديم عذر لهذا التاريخ مسبقاً');
      return;
    }

    try {
      const { error } = await supabase
        .from('excuse_submissions')
        .insert([{
          player_id: currentUser.id,
          absence_date: selectedDate,
          reason: excuseReason,
          status: 'pending',
          submitted_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Send notification to trainers
      const trainers = users.filter(u => u.user_type === 'trainer' && u.status === 'active');
      const notifications = trainers.map(trainer => ({
        type: 'excuse_request',
        title: `طلب عذر جديد من ${currentUser.full_name}`,
        message: `كود الطالب: ${currentUser.code}\nتاريخ الغياب: ${selectedDate}\nالسبب: ${excuseReason}`,
        user_id: trainer.id,
        phone_number: trainer.phone,
        status: 'sent'
      }));

      await supabase.from('academy_notifications').insert(notifications);

      toast.success('تم تقديم العذر بنجاح وإرساله للمدربين');
      setShowExcuseDialog(false);
      setSelectedDate('');
      setExcuseReason('');
      fetchExcuses();
    } catch (error) {
      console.error('Error submitting excuse:', error);
      toast.error('حدث خطأ في تقديم العذر');
    }
  };

  // Handle excuse response (Trainer only)
  const handleExcuseResponse = async (excuseId: string, status: 'approved' | 'rejected') => {
    try {
      const { error: updateError } = await supabase
        .from('excuse_submissions')
        .update({
          status,
          trainer_response: trainerResponse,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', excuseId);

      if (updateError) throw updateError;

      // If approved, update attendance record to 'excused'
      if (status === 'approved' && selectedExcuse) {
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .update({ status: 'excused' })
          .eq('player_id', selectedExcuse.player_id)
          .eq('date', selectedExcuse.absence_date);

        if (attendanceError) {
          console.error('Error updating attendance:', attendanceError);
        }

        // Send approval notification to student
        await supabase.from('academy_notifications').insert([{
          type: 'excuse_approved',
          title: 'تم قبول العذر',
          message: `تم قبول عذرك لتاريخ ${selectedExcuse.absence_date}. رد المدرب: ${trainerResponse}`,
          user_id: selectedExcuse.player_id,
          phone_number: selectedExcuse.player?.phone,
          status: 'sent'
        }]);
      } else if (status === 'rejected' && selectedExcuse) {
        // Send rejection notification to student
        await supabase.from('academy_notifications').insert([{
          type: 'excuse_rejected',
          title: 'تم رفض العذر',
          message: `تم رفض عذرك لتاريخ ${selectedExcuse.absence_date}. رد المدرب: ${trainerResponse}`,
          user_id: selectedExcuse.player_id,
          phone_number: selectedExcuse.player?.phone,
          status: 'sent'
        }]);
      }

      toast.success(`تم ${status === 'approved' ? 'قبول' : 'رفض'} العذر`);
      setShowResponseDialog(false);
      setSelectedExcuse(null);
      setTrainerResponse('');
      fetchExcuses();
    } catch (error) {
      console.error('Error handling excuse response:', error);
      toast.error('حدث خطأ في معالجة العذر');
    }
  };

  useEffect(() => {
    fetchAbsenceDates();
    fetchExcuses();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">مقبول</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Student: Submit excuse form */}
      {userType === 'student' && (
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              تقديم عذر غياب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {absenceDates.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  لا توجد أيام غياب مسجلة. يمكنك تقديم عذر فقط للأيام التي تم تسجيل غيابك فيها.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div>
                  <Label>اختر تاريخ الغياب</Label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 border rounded-md mt-1"
                  >
                    <option value="">اختر التاريخ</option>
                    {absenceDates.map(absence => (
                      <option key={absence.id} value={absence.date}>
                        {new Date(absence.date).toLocaleDateString('ar-SA')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>سبب الغياب</Label>
                  <Textarea
                    placeholder="اكتب سبب الغياب بالتفصيل..."
                    value={excuseReason}
                    onChange={(e) => setExcuseReason(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={submitExcuse}
                  disabled={!selectedDate || !excuseReason.trim()}
                  className="w-full gradient-primary"
                >
                  <Send className="w-4 h-4 ml-2" />
                  تقديم العذر
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Excuses list */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle>
            {userType === 'student' ? 'أعذارك المقدمة' : 'الأعذار المقدمة من الطلاب'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : excuses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد أعذار</p>
            </div>
          ) : (
            <div className="space-y-4">
              {excuses.map((excuse) => (
                <div key={excuse.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {userType !== 'student' && (
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{excuse.player?.full_name}</span>
                          <Badge variant="outline">كود: {excuse.player?.code}</Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          تاريخ الغياب: {new Date(excuse.absence_date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{excuse.reason}</p>
                      
                      {excuse.trainer_response && (
                        <div className="bg-blue-50 p-3 rounded-lg mt-2">
                          <p className="text-sm text-blue-800">
                            <strong>رد المدرب:</strong> {excuse.trainer_response}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(excuse.status)}
                      
                      {userType === 'trainer' && excuse.status === 'pending' && (
                        <Button
                          onClick={() => {
                            setSelectedExcuse(excuse);
                            setShowResponseDialog(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          رد على العذر
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trainer response dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الرد على العذر</DialogTitle>
          </DialogHeader>
          {selectedExcuse && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">الطالب: {selectedExcuse.player?.full_name}</p>
                <p className="text-sm text-muted-foreground">كود: {selectedExcuse.player?.code}</p>
                <p className="text-sm text-muted-foreground">
                  تاريخ الغياب: {new Date(selectedExcuse.absence_date).toLocaleDateString('ar-SA')}
                </p>
                <p className="text-sm text-muted-foreground">السبب: {selectedExcuse.reason}</p>
              </div>
              
              <div>
                <Label>رد المدرب</Label>
                <Textarea
                  value={trainerResponse}
                  onChange={(e) => setTrainerResponse(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  className="min-h-20 mt-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleExcuseResponse(selectedExcuse.id, 'approved')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 ml-1" />
                  قبول العذر
                </Button>
                <Button 
                  onClick={() => handleExcuseResponse(selectedExcuse.id, 'rejected')}
                  variant="destructive" 
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 ml-1" />
                  رفض العذر
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}