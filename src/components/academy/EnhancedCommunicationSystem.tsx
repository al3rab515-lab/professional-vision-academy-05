import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Calendar,
  MessageCircle,
  Ban,
  CheckCircle
} from "lucide-react";

interface EnhancedCommunicationSystemProps {
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
  updated_at: string;
  student_name?: string;
  trainer_name?: string;
  can_send_today?: boolean;
}

interface ChatMessage {
  id: string;
  chat_request_id: string;
  sender_id: string;
  sender_type: 'student' | 'trainer';
  message: string;
  created_at: string;
  sender_name?: string;
}

export function EnhancedCommunicationSystem({ currentUser, userType }: EnhancedCommunicationSystemProps) {
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [selectedChatRequest, setSelectedChatRequest] = useState<ChatRequest | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [dailyRequestCount, setDailyRequestCount] = useState(0);
  const [canSendRequest, setCanSendRequest] = useState(true);
  const [loading, setLoading] = useState(false);
  const { users } = useAcademyData();

  const trainers = users.filter(user => user.user_type === 'trainer' && user.status === 'active');

  // Check if student can send request today
  const checkDailyRequestLimit = async () => {
    if (userType !== 'student') return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('academy_notifications')
        .select('id, status, created_at')
        .eq('user_id', currentUser.id)
        .eq('type', 'chat_request')
        .gte('created_at', today)
        .lt('created_at', `${today}T23:59:59`);

      if (error) throw error;

      const todayRequests = data || [];
      setDailyRequestCount(todayRequests.length);

      // Check if student can send request today based on rules:
      // 1. If sent and rejected, can send again
      // 2. If sent and not responded, cannot send until tomorrow
      // 3. If sent and approved/ended, cannot send until tomorrow
      
      const lastRequest = todayRequests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      if (!lastRequest) {
        setCanSendRequest(true);
      } else if (lastRequest.status === 'rejected') {
        setCanSendRequest(true);
      } else if (lastRequest.status === 'sent') {
        setCanSendRequest(false);
      } else if (['approved', 'active', 'ended'].includes(lastRequest.status)) {
        setCanSendRequest(false);
      }
    } catch (error) {
      console.error('Error checking daily limit:', error);
    }
  };

  // Fetch chat requests
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
        // For trainers, get notifications where phone_number contains their info
        query = query.like('message', `%${currentUser.id}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: ChatRequest[] = data?.map(notification => {
        // Parse the notification message to extract info
        const parts = notification.message.split('|');
        const studentId = notification.user_id;
        const trainerId = parts[1] || '';
        
        const student = users.find(u => u.id === studentId);
        const trainer = users.find(u => u.id === trainerId);

        return {
          id: notification.id,
          student_id: studentId,
          trainer_id: trainerId,
          status: notification.status === 'sent' ? 'pending' : notification.status as any,
          request_message: parts[0] || notification.message,
          created_at: notification.created_at,
          updated_at: notification.created_at,
          student_name: student?.full_name || notification.title || 'طالب',
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

  // Fetch chat messages for a specific request
  const fetchChatMessages = async (chatRequestId: string) => {
    try {
      const { data, error } = await supabase
        .from('academy_notifications')
        .select('*')
        .eq('type', 'chat_message')
        .like('message', `%${chatRequestId}%`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: ChatMessage[] = data?.map(notification => {
        const parts = notification.message.split('|');
        const senderId = notification.user_id;
        const sender = users.find(u => u.id === senderId);

        return {
          id: notification.id,
          chat_request_id: chatRequestId,
          sender_id: senderId,
          sender_type: sender?.user_type === 'trainer' ? 'trainer' : 'student',
          message: parts[0] || notification.message,
          created_at: notification.created_at,
          sender_name: sender?.full_name || 'مستخدم'
        };
      }) || [];

      setChatMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  // Send chat request (Student only)
  const sendChatRequest = async () => {
    if (!selectedTrainer || !requestMessage.trim()) {
      toast.error("يرجى اختيار المدرب وكتابة رسالة");
      return;
    }

    if (!canSendRequest) {
      toast.error("لا يمكنك إرسال طلب جديد اليوم. انتظر حتى الغد أو حتى يتم الرد على طلبك السابق.");
      return;
    }

    try {
      // Persisting chat requests using academy_notifications only (no chat_requests table)


      // Send notification to trainer
      const trainer = trainers.find(t => t.id === selectedTrainer);
      if (trainer) {
        await supabase.from('academy_notifications').insert([{
          type: 'chat_request',
          title: `طلب محادثة من ${currentUser.full_name}`,
          message: `كود الطالب: ${currentUser.code}\nالرسالة: ${requestMessage}`,
          user_id: trainer.id,
          phone_number: trainer.phone,
          status: 'sent'
        }]);
      }

      toast.success("تم إرسال طلب المحادثة للمدرب");
      setRequestMessage("");
      setSelectedTrainer("");
      fetchChatRequests();
      checkDailyRequestLimit();
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

      // Send notification to student
      const request = chatRequests.find(r => r.id === requestId);
      if (request) {
        const student = users.find(u => u.id === request.student_id);
        if (student) {
          await supabase.from('academy_notifications').insert([{
            type: action === 'approve' ? 'chat_approved' : 'chat_rejected',
            title: action === 'approve' ? 'تم قبول طلب المحادثة' : 'تم رفض طلب المحادثة',
            message: action === 'approve' ? 
              'تم قبول طلب المحادثة. يمكنك الآن بدء المحادثة مع المدرب.' :
              'تم رفض طلب المحادثة. يمكنك إرسال طلب جديد.',
            user_id: student.id,
            phone_number: student.phone,
            status: 'sent'
          }]);
        }
      }

      toast.success(action === 'approve' ? "تم قبول طلب المحادثة" : "تم رفض طلب المحادثة");
      fetchChatRequests();
    } catch (error) {
      console.error('Error handling chat request:', error);
      toast.error("خطأ في معالجة طلب المحادثة");
    }
  };

  // Start/Open chat
  const openChat = async (request: ChatRequest) => {
    if (request.status === 'approved') {
      await supabase
        .from('academy_notifications')
        .update({ status: 'active' })
        .eq('id', request.id);
    }
    
    setSelectedChatRequest(request);
    setShowChatDialog(true);
    fetchChatMessages(request.id);
  };

  // Send message in chat
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRequest) return;

    try {
      const { error } = await supabase
        .from('academy_notifications')
        .insert([{
          type: 'chat_message',
          title: `رسالة من ${currentUser.full_name}`,
          message: `${newMessage}|${selectedChatRequest.id}`,
          user_id: currentUser.id,
          phone_number: currentUser.phone,
          status: 'sent'
        }]);

      if (error) throw error;

      setNewMessage("");
      fetchChatMessages(selectedChatRequest.id);
      
      // Send notification to the other party
      const otherUserId = userType === 'student' ? selectedChatRequest.trainer_id : selectedChatRequest.student_id;
      const otherUser = users.find(u => u.id === otherUserId);
      
      if (otherUser) {
        await supabase.from('academy_notifications').insert([{
          type: 'chat_message_notification',
          title: `رسالة جديدة من ${currentUser.full_name}`,
          message: newMessage.length > 50 ? newMessage.substring(0, 50) + '...' : newMessage,
          user_id: otherUser.id,
          phone_number: otherUser.phone,
          status: 'sent'
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("خطأ في إرسال الرسالة");
    }
  };

  // End chat
  const endChat = async () => {
    if (!selectedChatRequest) return;

    try {
      const { error } = await supabase
        .from('academy_notifications')
        .update({ status: 'ended' })
        .eq('id', selectedChatRequest.id);

      if (error) throw error;

      toast.success("تم إنهاء المحادثة");
      setShowChatDialog(false);
      setSelectedChatRequest(null);
      fetchChatRequests();
    } catch (error) {
      console.error('Error ending chat:', error);
      toast.error("خطأ في إنهاء المحادثة");
    }
  };

  useEffect(() => {
    fetchChatRequests();
    if (userType === 'student') {
      checkDailyRequestLimit();
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" />في الانتظار</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />مقبول</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 ml-1" />مرفوض</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800"><MessageCircle className="w-3 h-3 ml-1" />نشط</Badge>;
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800"><Ban className="w-3 h-3 ml-1" />منتهي</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Student: Send new request */}
      {userType === 'student' && (
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              طلب محادثة مع المدرب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={canSendRequest ? "secondary" : "destructive"}>
                الطلبات اليوم: {dailyRequestCount} | 
                {canSendRequest ? " يمكنك الإرسال" : " لا يمكنك الإرسال اليوم"}
              </Badge>
            </div>

            {!canSendRequest && (
              <Alert>
                <AlertDescription>
                  لا يمكنك إرسال طلب محادثة جديد اليوم. انتظر حتى الغد أو حتى يتم الرد على طلبك السابق.
                </AlertDescription>
              </Alert>
            )}

            {canSendRequest && (
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

                <Button
                  onClick={sendChatRequest}
                  disabled={!selectedTrainer || !requestMessage.trim()}
                  className="w-full gradient-primary"
                >
                  <Send className="w-4 h-4 ml-2" />
                  إرسال طلب المحادثة
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat requests list */}
      <Card className="shadow-elegant border-0">
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
                <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {userType === 'student' ? request.trainer_name : request.student_name}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{request.request_message}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {/* Trainer actions for pending requests */}
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

                    {/* Open chat for approved/active requests */}
                    {(request.status === 'approved' || request.status === 'active') && (
                      <Button
                        onClick={() => openChat(request)}
                        size="sm"
                        variant={request.status === 'active' ? 'default' : 'outline'}
                      >
                        <MessageSquare className="w-4 h-4 ml-1" />
                        {request.status === 'active' ? 'دخول المحادثة' : 'بدء المحادثة'}
                      </Button>
                    )}

                    {/* View ended chats */}
                    {request.status === 'ended' && (
                      <Button
                        onClick={() => openChat(request)}
                        size="sm"
                        variant="outline"
                      >
                        <MessageSquare className="w-4 h-4 ml-1" />
                        عرض المحادثة
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                محادثة مع {userType === 'student' ? selectedChatRequest?.trainer_name : selectedChatRequest?.student_name}
              </div>
              {selectedChatRequest && getStatusBadge(selectedChatRequest.status)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col gap-4">
            {/* Messages */}
            <ScrollArea className="h-96 border rounded-lg p-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد رسائل بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === currentUser.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message input */}
            {selectedChatRequest?.status === 'active' && (
              <div className="flex gap-2">
                <Input
                  placeholder="اكتب رسالتك..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Chat controls */}
            <div className="flex gap-2">
              {selectedChatRequest?.status === 'active' && (
                <Button onClick={endChat} variant="destructive" size="sm">
                  <X className="w-4 h-4 ml-1" />
                  إنهاء المحادثة
                </Button>
              )}
              <Button onClick={() => setShowChatDialog(false)} variant="outline" size="sm">
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}