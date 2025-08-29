import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAcademyData } from "@/hooks/useAcademyData";
import { 
  MessageSquare, 
  Send, 
  Check, 
  X, 
  Clock,
  User,
  Calendar
} from "lucide-react";

interface CommunicationSystemProps {
  currentUser: any;
  userType: 'student' | 'trainer' | 'admin';
}

interface ChatRequest {
  id: string;
  student_id: string;
  trainer_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'ended';
  request_message: string;
  created_at: string;
  student_name?: string;
  trainer_name?: string;
}

export function CommunicationSystem({ currentUser, userType }: CommunicationSystemProps) {
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { users } = useAcademyData();

  const trainers = users.filter(user => user.user_type === 'trainer' && user.status === 'active');

  // Check daily message limit
  const checkDailyLimit = async () => {
    if (userType !== 'student') return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('academy_notifications')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('type', 'chat_request')
        .gte('created_at', today)
        .lt('created_at', `${today}T23:59:59`);

      if (error) throw error;
      setDailyMessageCount(data?.length || 0);
    } catch (error) {
      console.error('Error checking daily limit:', error);
    }
  };

  // Fetch chat requests using academy_notifications table
  const fetchChatRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('academy_notifications')
        .select('*')
        .eq('type', 'chat_request');

      if (userType === 'student') {
        query = query.eq('user_id', currentUser.id);
      } else if (userType === 'trainer') {
      // For trainers, fetch chat requests sent to them
      query = query.eq('phone_number', 'trainer_notification').eq('type', 'chat_request');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform notifications to chat requests format
      const formattedRequests: ChatRequest[] = data?.map(notification => {
        // Parse the notification data to extract student and trainer info
        const parts = notification.message.split('|'); // Assuming format: "message|student_id|trainer_id"
        const studentId = notification.user_id || '';
        const trainerId = notification.phone_number || '';
        
        const student = users.find(u => u.id === studentId);
        const trainer = users.find(u => u.id === trainerId);

        return {
          id: notification.id,
          student_id: studentId,
          trainer_id: trainerId,
          status: (notification.status === 'sent' ? 'pending' : notification.status) as 'pending' | 'approved' | 'rejected' | 'active' | 'ended',
          request_message: parts[0] || notification.message,
          created_at: notification.created_at,
          student_name: student?.full_name || notification.title,
          trainer_name: trainer?.full_name || 'مدرب'
        };
      }) || [];

      setChatRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching chat requests:', error);
      toast.error("خطأ في تحميل طلبات المحادثة");
    } finally {
      setLoading(false);
    }
  };

  // Send chat request (Student only)
  const sendChatRequest = async () => {
    if (!selectedTrainer || !requestMessage.trim()) {
      toast.error("يرجى اختيار المدرب وكتابة رسالة");
      return;
    }

    if (dailyMessageCount >= 2) {
      toast.error("لقد تجاوزت الحد اليومي (2 رسائل في اليوم)");
      return;
    }

    try {
      const trainer = trainers.find(t => t.id === selectedTrainer);
      
      const { error } = await supabase
        .from('academy_notifications')
        .insert([{
          type: 'chat_request',
          title: currentUser.full_name,
          message: `${requestMessage}|${currentUser.id}|${selectedTrainer}`,
          user_id: currentUser.id,
          phone_number: selectedTrainer, // Store trainer ID here
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success("تم إرسال طلب المحادثة للمدرب");
      setRequestMessage("");
      setSelectedTrainer("");
      fetchChatRequests();
      checkDailyLimit();
    } catch (error) {
      console.error('Error sending chat request:', error);
      toast.error("خطأ في إرسال طلب المحادثة");
    }
  };

  // Handle chat request (Trainer only)
  const handleChatRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('academy_notifications')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(action === 'approve' ? "تم قبول طلب المحادثة" : "تم رفض طلب المحادثة");
      fetchChatRequests();
    } catch (error) {
      console.error('Error handling chat request:', error);
      toast.error("خطأ في معالجة طلب المحادثة");
    }
  };

  // Start chat (simplified - just show a message for now)
  const startChat = async (request: ChatRequest) => {
    try {
      const { error } = await supabase
        .from('academy_notifications')
        .update({ status: 'active' })
        .eq('id', request.id);

      if (error) throw error;

      toast.success("تم بدء المحادثة - يمكنكم التواصل الآن");
      fetchChatRequests();
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error("خطأ في بدء المحادثة");
    }
  };

  useEffect(() => {
    fetchChatRequests();
    if (userType === 'student') {
      checkDailyLimit();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Student: Send new request */}
      {userType === 'student' && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              طلب محادثة مع المدرب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={dailyMessageCount >= 2 ? "destructive" : "secondary"}>
                الرسائل اليوم: {dailyMessageCount}/2
              </Badge>
            </div>

            {dailyMessageCount < 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">اختيار المدرب</label>
                  <select
                    value={selectedTrainer}
                    onChange={(e) => setSelectedTrainer(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">اختر المدرب</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">رسالة الطلب</label>
                  <Textarea
                    placeholder="اكتب سبب طلب المحادثة..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={sendChatRequest}
                    disabled={!selectedTrainer || !requestMessage.trim()}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 ml-2" />
                    إرسال طلب المحادثة
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat requests list */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>
            {userType === 'student' ? 'طلبات المحادثة المرسلة' : 'طلبات المحادثة الواردة'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : chatRequests.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات محادثة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {userType === 'student' ? request.trainer_name : request.student_name}
                        </span>
                        <Badge
                          variant={
                            request.status === 'approved' || request.status === 'active' ? 'default' :
                            request.status === 'rejected' ? 'destructive' :
                            request.status === 'ended' ? 'secondary' : 'outline'
                          }
                        >
                          {request.status === 'pending' ? 'في الانتظار' :
                           request.status === 'approved' ? 'مقبول' :
                           request.status === 'rejected' ? 'مرفوض' :
                           request.status === 'active' ? 'نشط' : 'منتهي'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{request.request_message}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {userType === 'trainer' && request.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleChatRequest(request.id, 'approve')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 ml-1" />
                          قبول
                        </Button>
                        <Button
                          onClick={() => handleChatRequest(request.id, 'reject')}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="w-4 h-4 ml-1" />
                          رفض
                        </Button>
                      </>
                    )}

                    {(request.status === 'approved' || request.status === 'active') && (
                      <>
                        <Button
                          onClick={() => startChat(request)}
                          size="sm"
                          variant={request.status === 'active' ? 'outline' : 'default'}
                        >
                          <MessageSquare className="w-4 h-4 ml-1" />
                          {request.status === 'active' ? 'المحادثة نشطة' : 'بدء المحادثة'}
                        </Button>
                        {request.status === 'active' && (
                          <Button
                            onClick={() => handleChatRequest(request.id, 'reject')}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4 ml-1" />
                            خروج من الدردشة
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}