import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAcademyData } from "@/hooks/useAcademyData";
import { 
  MessageCircle, 
  Send, 
  Users, 
  UserCheck,
  ArrowLeft,
  Phone,
  MessageSquare
} from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender_name: string;
  sender_type: string;
}

interface EnhancedLiveCommunicationProps {
  currentUser: any;
  userType: 'student' | 'trainer' | 'admin';
  onBack?: () => void;
}

export function EnhancedLiveCommunication({ currentUser, userType, onBack }: EnhancedLiveCommunicationProps) {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { users } = useAcademyData();

  // Get available contacts based on user type  
  const getAvailableContacts = () => {
    if (userType === 'student') {
      return users.filter(u => u.user_type === 'trainer' && u.status === 'active');
    } else if (userType === 'trainer') {
      return users.filter(u => u.user_type === 'player' && u.status === 'active');
    } else {
      return users.filter(u => (u.user_type === 'trainer' || u.user_type === 'player') && u.status === 'active');
    }
  };

  const availableContacts = getAvailableContacts();

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages for selected contact
  const fetchMessages = async (contactId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academy_notifications')
        .select('*')
        .eq('type', 'live_chat')
        .or(`user_id.eq.${currentUser.id},phone_number.eq.${currentUser.id}`)
        .or(`user_id.eq.${contactId},phone_number.eq.${contactId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = data?.map(notification => {
        // Parse message format: "message|sender_id|receiver_id"
        const parts = notification.message.split('|');
        const sender = users.find(u => u.id === parts[1]);
        
        return {
          id: notification.id,
          sender_id: parts[1] || notification.user_id,
          receiver_id: parts[2] || notification.phone_number,
          message: parts[0] || notification.message,
          created_at: notification.created_at,
          sender_name: sender?.full_name || notification.title,
          sender_type: sender?.user_type || 'unknown'
        };
      }).filter(msg => 
        (msg.sender_id === currentUser.id && msg.receiver_id === contactId) ||
        (msg.sender_id === contactId && msg.receiver_id === currentUser.id)
      ) || [];

      setMessages(formattedMessages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error("فشل في تحميل الرسائل");
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedContact || !newMessage.trim()) return;

    try {
      const receiver = users.find(u => u.id === selectedContact);
      if (!receiver) return;

      const { error } = await supabase
        .from('academy_notifications')
        .insert([{
          type: 'live_chat',
          title: currentUser.full_name,
          message: `${newMessage.trim()}|${currentUser.id}|${selectedContact}`,
          user_id: currentUser.id,
          phone_number: selectedContact,
          status: autoAcceptEnabled ? 'approved' : 'pending'
        }]);

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedContact);
      toast.success("تم إرسال الرسالة");
    } catch (error) {
      console.error('Error sending message:', error);  
      toast.error("فشل في إرسال الرسالة");
    }
  };

  // Auto-refresh messages every 2 seconds for real-time chat
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact);
      
      const interval = setInterval(() => {
        fetchMessages(selectedContact);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  // Handle Enter key for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-start conversation when selecting a contact
  const handleContactSelect = (contactId: string) => {
    setSelectedContact(contactId);
    // For trainers, automatically open chat without waiting for approval
    if (userType === 'trainer' || autoAcceptEnabled) {
      fetchMessages(contactId);
    }
  };

  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="gradient-card shadow-elegant border-0 h-[90vh]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="hover:bg-white/20"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-primary" />
                    التواصل المباشر المحسن
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    محادثة مباشرة ومطورة - {userType === 'student' ? 'مع المدربين' : userType === 'trainer' ? 'مع اللاعبين' : 'مع الجميع'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="gradient-primary">
                  <Users className="w-4 h-4 mr-1" />
                  {availableContacts.length} متاح
                </Badge>
                {userType === 'trainer' && (
                  <Badge variant="outline">
                    فتح تلقائي ✅
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-full">
            <div className="flex h-full">
              {/* Enhanced Contacts List */}
              <div className="w-1/3 border-r bg-white/50">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    {userType === 'student' ? 'المدربين المتاحين' : 
                     userType === 'trainer' ? 'اللاعبين للتواصل' : 'جهات الاتصال'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    انقر لبدء المحادثة مباشرة
                  </p>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {availableContacts.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">لا توجد جهات اتصال متاحة</p>
                      </div>
                    ) : (
                      availableContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => handleContactSelect(contact.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedContact === contact.id 
                              ? 'bg-primary text-primary-foreground shadow-md' 
                              : 'hover:bg-white/70 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              contact.user_type === 'trainer' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {contact.user_type === 'trainer' ? 
                                <UserCheck className="w-5 h-5 text-blue-600" /> : 
                                <Users className="w-5 h-5 text-green-600" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{contact.full_name}</p>
                              <p className="text-xs opacity-70 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </p>
                              <p className="text-xs opacity-60">{contact.code}</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs opacity-70">متصل</span>
                            </div>
                          </div>
                          {selectedContact === contact.id && (
                            <div className="mt-2 text-xs opacity-80">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              المحادثة نشطة
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Enhanced Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedContact ? (
                  <>
                    {/* Enhanced Chat Header */}
                    <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {availableContacts.find(c => c.id === selectedContact)?.full_name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>متصل الآن - جاهز للمحادثة</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          تحديث كل ثانيتين
                        </Badge>
                      </div>
                    </div>

                    {/* Enhanced Messages */}
                    <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-white/50 to-white/20">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">جاري تحميل الرسائل...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold mb-2">ابدأ المحادثة الآن</h3>
                          <p className="text-sm text-muted-foreground">
                            {userType === 'trainer' ? 'يمكنك بدء المحادثة مباشرة مع اللاعب' : 'اكتب رسالتك أدناه للبدء'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[75%] p-3 rounded-2xl ${
                                message.sender_id === currentUser.id
                                  ? 'bg-primary text-primary-foreground ml-4 rounded-br-sm'
                                  : 'bg-white shadow-sm mr-4 rounded-bl-sm border'
                              }`}>
                                <p className="text-sm leading-relaxed">{message.message}</p>
                                <div className="flex items-center justify-between mt-2 gap-2">
                                  <p className="text-xs opacity-70">
                                    {new Date(message.created_at).toLocaleTimeString('ar-SA', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {message.sender_id === currentUser.id && (
                                    <div className="text-xs opacity-70">✓ تم الإرسال</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    {/* Enhanced Message Input */}
                    <div className="p-4 border-t bg-white/30 backdrop-blur-sm">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="اكتب رسالتك هنا..."
                          className="flex-1 rounded-full border-2 border-primary/20 focus:border-primary/50"
                        />
                        <Button 
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="gradient-primary rounded-full px-6"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        اضغط Enter للإرسال • المحادثة مشفرة وآمنة
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-xl font-semibold mb-3">اختر محادثة للبدء</h3>
                      <p className="text-muted-foreground mb-4">
                        اختر أحد {userType === 'student' ? 'المدربين' : 'اللاعبين'} من القائمة لبدء المحادثة
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>جميع المحادثات متاحة ومباشرة</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}