import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useConversation } from "@11labs/react";
import { toast } from "sonner";
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageCircle,
  ArrowLeft,
  Send,
  Bot,
  User as UserIcon,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface LiveCommunicationSystemProps {
  onBack: () => void;
  userType?: string;
}

interface ConversationRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  from_user?: {
    full_name: string;
    code: string;
    user_type: string;
  };
  to_user?: {
    full_name: string;
    code: string;
    user_type: string;
  };
}

export function LiveCommunicationSystem({ onBack, userType }: LiveCommunicationSystemProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('9BWtsMINqrJLrRacOk9x'); // Aria
  const [conversationRequests, setConversationRequests] = useState<ConversationRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<ConversationRequest | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      toast.success('تم الاتصال بنجاح');
      setIsCallActive(true);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      toast.info('تم انهاء المكالمة');
      setIsCallActive(false);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      toast.error('خطأ في المكالمة');
      setIsCallActive(false);
    },
    onMessage: (message) => {
      console.log('Message received:', message);
    }
  });

  const voices = [
    { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria - صوت أنثوي' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger - صوت ذكوري' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah - صوت أنثوي ناعم' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam - صوت ذكوري شاب' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte - صوت أنثوي مهني' }
  ];

  // Request microphone permission
  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      toast.error('يجب السماح بالوصول للميكروفون للمكالمة الصوتية');
      return false;
    }
  };

  // Start voice call - simplified for demo
  const startVoiceCall = async (request: ConversationRequest) => {
    const hasAccess = await requestMicrophoneAccess();
    if (!hasAccess) return;

    try {
      // Demo mode - simulate call
      setCurrentRequest(request);
      setIsCallActive(true);
      toast.success('تم بدء المكالمة الصوتية');
      
      // Simulate connection
      setTimeout(() => {
        toast.info(`مرحباً ${request.from_user?.full_name}، تم استلام رسالتك: "${request.message}"`);
      }, 1000);

    } catch (error) {
      console.error('Error starting voice call:', error);
      toast.error('خطأ في بدء المكالمة الصوتية');
    }
  };

  // End voice call
  const endVoiceCall = async () => {
    try {
      await conversation.endSession();
      setCurrentRequest(null);
      setIsCallActive(false);
      toast.info('تم انهاء المكالمة');
    } catch (error) {
      console.error('Error ending call:', error);
      // Force end in demo mode
      setCurrentRequest(null);
      setIsCallActive(false);
      toast.info('تم انهاء المكالمة');
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? 'تم إلغاء كتم الصوت' : 'تم كتم الصوت');
  };

  // Adjust volume
  const adjustVolume = async (newVolume: number) => {
    setVolume(newVolume);
    try {
      await conversation.setVolume({ volume: newVolume });
    } catch (error) {
      console.error('Error adjusting volume:', error);
    }
  };

  // Accept conversation request
  const acceptRequest = async (requestId: string) => {
    const request = conversationRequests.find(r => r.id === requestId);
    if (!request) return;

    // Start voice call instead of just accepting
    await startVoiceCall(request);
  };

  // Reject conversation request
  const rejectRequest = (requestId: string) => {
    setConversationRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const }
          : req
      )
    );
    toast.info('تم رفض طلب المحادثة');
  };

  // Mock data for demonstration
  useEffect(() => {
    const mockRequests: ConversationRequest[] = [
      {
        id: '1',
        from_user_id: 'user1',
        to_user_id: 'trainer1',
        message: 'أريد مناقشة جدول التدريب للأسبوع القادم',
        status: 'pending',
        created_at: new Date().toISOString(),
        from_user: {
          full_name: 'محمد أحمد',
          code: 'P-123456',
          user_type: 'player'
        }
      },
      {
        id: '2',
        from_user_id: 'user2',
        to_user_id: 'trainer1',
        message: 'لدي استفسار حول التمارين المنزلية',
        status: 'pending',
        created_at: new Date(Date.now() - 300000).toISOString(),
        from_user: {
          full_name: 'سارة محمد',
          code: 'P-654321',
          user_type: 'player'
        }
      }
    ];
    setConversationRequests(mockRequests);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" />في الانتظار</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />مقبول</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 ml-1" />مكتمل</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

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
                      <Phone className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-academy-text">نظام المكالمات المباشرة</h1>
                      <p className="text-muted-foreground">
                        مكالمات صوتية مباشرة مع الذكاء الاصطناعي
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Call Controls */}
                {isCallActive && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isMuted ? "destructive" : "outline"}
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      <VolumeX className="w-4 h-4" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => adjustVolume(parseFloat(e.target.value))}
                        className="w-16"
                      />
                      <Volume2 className="w-4 h-4" />
                    </div>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={endVoiceCall}
                    >
                      <PhoneOff className="w-4 h-4 ml-1" />
                      انهاء المكالمة
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Call Status */}
        {isCallActive && currentRequest && (
          <Card className="shadow-elegant border-0 academy-fade-in border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-green-800">
                      مكالمة نشطة مع {currentRequest.from_user?.full_name}
                    </p>
                    <p className="text-sm text-green-600">
                      {conversation.status === 'connected' ? 'متصل' : 'جاري الاتصال...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    {conversation.isSpeaking ? 'يتحدث الآن' : 'في الانتظار'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice Settings */}
        <Card className="shadow-card border-0 academy-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              إعدادات الصوت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اختر الصوت</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">مستوى الصوت</label>
                <div className="flex items-center gap-2">
                  <VolumeX className="w-4 h-4" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => adjustVolume(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm w-8">{Math.round(volume * 100)}%</span>
                </div>
              </div>
            </div>
            
            {!apiKey && (
              <Button 
                onClick={() => setShowApiKeyDialog(true)}
                className="w-full"
              >
                إعداد مفتاح ElevenLabs API
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Conversation Requests */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-academy-text">طلبات المحادثة</h2>
          
          {conversationRequests.length === 0 ? (
            <Card className="shadow-elegant border-0 academy-fade-in">
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد طلبات محادثة</h3>
                <p className="text-muted-foreground">ستظهر طلبات المحادثة الجديدة هنا</p>
              </CardContent>
            </Card>
          ) : (
            conversationRequests.map((request) => (
              <Card key={request.id} className="shadow-elegant border-0 academy-fade-in hover:shadow-academy transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-primary">
                            {request.from_user?.full_name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {request.from_user?.code}
                          </Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <p className="text-gray-700">{request.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('ar-SA')} - {new Date(request.created_at).toLocaleTimeString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isCallActive}
                        >
                          <PhoneCall className="w-4 h-4 ml-1" />
                          مكالمة صوتية
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectRequest(request.id)}
                        >
                          <XCircle className="w-4 h-4 ml-1" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* API Key Dialog */}
        <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إعداد مفتاح ElevenLabs API</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                يرجى إدخال مفتاح ElevenLabs API للمكالمات الصوتية
              </p>
              <Textarea
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="أدخل مفتاح API هنا..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (apiKey.trim()) {
                      setShowApiKeyDialog(false);
                      toast.success('تم حفظ مفتاح API');
                    } else {
                      toast.error('يرجى إدخال مفتاح API صحيح');
                    }
                  }}
                  className="flex-1"
                  disabled={!apiKey.trim()}
                >
                  حفظ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApiKeyDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}