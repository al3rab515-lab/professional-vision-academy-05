import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAcademyData } from "@/hooks/useAcademyData";
import { 
  Bot, 
  Send, 
  MessageSquare,
  Zap,
  BarChart3,
  Settings,
  Users,
  UserPlus,
  Calendar
} from "lucide-react";

interface EnhancedAIPanelProps {
  userType: 'student' | 'trainer' | 'admin';
}

interface ChatMessage {
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface AddUserData {
  full_name: string;
  phone: string;
  age?: number;
  address?: string;
  sport_type?: string;
  subscription_duration?: string;
  subscription_days?: number;
  parent_phone?: string;
  guardian_phone?: string;
  job_position?: string;
  salary?: number;
  learning_goals?: string;
  userType?: string;
}

export function EnhancedAIPanel({ userType }: EnhancedAIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: 'bot',
      content: 'مرحباً! أنا مساعد أكاديمية الرؤية الذكي. يمكنني مساعدتك في:\n\n/اضافة - لإضافة لاعب أو مدرب جديد\n/تحضير - لتسجيل الحضور السريع\n\nكيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<string | null>(null);
  const [commandStep, setCommandStep] = useState(0);
  const [tempUserData, setTempUserData] = useState<Partial<AddUserData>>({});
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [attendanceResults, setAttendanceResults] = useState<Record<string, string>>({});
  
  const { users, addUser, generateStudentCode, generateTrainerCode } = useAcademyData();
  const { toast } = useToast();

  // Only show AI panel for admin
  if (userType !== 'admin') {
    return null;
  }

  const addMessage = (type: 'bot' | 'user', content: string) => {
    const newMessage: ChatMessage = {
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const resetCommand = () => {
    setCurrentCommand(null);
    setCommandStep(0);
    setTempUserData({});
    setAttendanceList([]);
    setAttendanceResults({});
  };

  const handleAddUserCommand = async (message: string) => {
    switch (commandStep) {
      case 0:
        addMessage('bot', 'اختر نوع المستخدم:\n1 - لاعب\n2 - مدرب');
        setCommandStep(1);
        break;
      
      case 1:
        if (message === '1') {
          setTempUserData({ ...tempUserData, userType: 'student' });
          addMessage('bot', 'ممتاز! الآن أدخل اسم اللاعب:');
          setCommandStep(2);
        } else if (message === '2') {
          setTempUserData({ ...tempUserData, userType: 'trainer' });
          addMessage('bot', 'ممتاز! الآن أدخل اسم المدرب:');
          setCommandStep(2);
        } else {
          addMessage('bot', 'يرجى اختيار 1 للاعب أو 2 للمدرب');
        }
        break;
      
      case 2:
        setTempUserData({ ...tempUserData, full_name: message });
        addMessage('bot', 'أدخل رقم الهاتف:');
        setCommandStep(3);
        break;
      
      case 3:
        setTempUserData({ ...tempUserData, phone: message });
        if (tempUserData.userType === 'student') {
          addMessage('bot', 'أدخل العمر:');
          setCommandStep(4);
        } else {
          addMessage('bot', 'أدخل المنصب/الوظيفة:');
          setCommandStep(6);
        }
        break;
      
      case 4:
        setTempUserData({ ...tempUserData, age: parseInt(message) });
        addMessage('bot', 'أدخل نوع الرياضة:');
        setCommandStep(5);
        break;
      
      case 5:
        setTempUserData({ ...tempUserData, sport_type: message });
        await saveUser();
        break;
      
      case 6:
        setTempUserData({ ...tempUserData, job_position: message });
        addMessage('bot', 'أدخل الراتب (اختياري، اتركه فارغ للتخطي):');
        setCommandStep(7);
        break;
      
      case 7:
        if (message.trim()) {
          setTempUserData({ ...tempUserData, salary: parseFloat(message) });
        }
        await saveUser();
        break;
    }
  };

  const handleAttendanceCommand = async (message: string) => {
    if (commandStep === 0) {
      const players = users.filter(u => u.user_type === 'student');
      setAttendanceList(players);
      
      let listMessage = 'قائمة اللاعبين للتحضير:\n\n';
      players.forEach((player, index) => {
        listMessage += `${index + 1}. ${player.full_name} (${player.code})\n`;
      });
      listMessage += '\nأدخل رقم اللاعب متبوعاً بحالة الحضور:\n1 = حاضر، 2 = غائب، 3 = معذور\n\nمثال: 1-1 (اللاعب رقم 1 حاضر)';
      
      addMessage('bot', listMessage);
      setCommandStep(1);
    } else {
      const [playerNum, statusNum] = message.split('-');
      const playerIndex = parseInt(playerNum) - 1;
      const statusCode = parseInt(statusNum);
      
      if (playerIndex >= 0 && playerIndex < attendanceList.length && statusCode >= 1 && statusCode <= 3) {
        const player = attendanceList[playerIndex];
        const statusMap = { 1: 'present', 2: 'absent', 3: 'excused' };
        const statusTextMap = { 1: 'حاضر', 2: 'غائب', 3: 'معذور' };
        
        setAttendanceResults(prev => ({
          ...prev,
          [player.id]: statusMap[statusCode as keyof typeof statusMap]
        }));
        
        addMessage('bot', `تم تسجيل ${player.full_name} كـ ${statusTextMap[statusCode as keyof typeof statusTextMap]}\n\nأدخل اللاعب التالي أو اكتب "حفظ" لحفظ جميع التسجيلات`);
        
        if (message.toLowerCase() === 'حفظ') {
          await saveAttendanceRecords();
        }
      } else {
        addMessage('bot', 'تنسيق خاطئ. استخدم: رقم_اللاعب-رقم_الحالة (مثال: 1-1)');
      }
    }
  };

  const saveUser = async () => {
    try {
      const code = tempUserData.userType === 'student' ? generateStudentCode() : generateTrainerCode();
      
      await addUser({
        ...tempUserData,
        code,
        user_type: tempUserData.userType as 'student' | 'trainer',
        status: 'active'
      } as any);
      
      addMessage('bot', `تم إضافة ${tempUserData.userType === 'student' ? 'اللاعب' : 'المدرب'} ${tempUserData.full_name} بنجاح!\nالكود: ${code}`);
      
      toast({
        title: "تم بنجاح",
        description: `تم إضافة ${tempUserData.userType === 'student' ? 'اللاعب' : 'المدرب'} بنجاح`,
      });
      
      resetCommand();
    } catch (error) {
      console.error('Error adding user:', error);
      addMessage('bot', 'حدث خطأ في إضافة المستخدم. يرجى المحاولة مرة أخرى.');
      resetCommand();
    }
  };

  const saveAttendanceRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = Object.entries(attendanceResults).map(([playerId, status]) => ({
        player_id: playerId,
        status,
        date: today,
        trainer_id: 'system', // Use system as trainer for AI-generated attendance
        notes: 'تم التسجيل عبر المساعد الذكي'
      }));

      const { error } = await supabase
        .from('attendance_records')
        .insert(records);

      if (error) throw error;

      addMessage('bot', `تم حفظ ${records.length} سجل حضور بنجاح لتاريخ اليوم!`);
      
      toast({
        title: "تم بنجاح",
        description: "تم حفظ سجلات الحضور",
      });
      
      resetCommand();
    } catch (error) {
      console.error('Error saving attendance:', error);
      addMessage('bot', 'حدث خطأ في حفظ سجلات الحضور. يرجى المحاولة مرة أخرى.');
      resetCommand();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    addMessage('user', inputMessage);
    const message = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      // Handle commands
      if (message.startsWith('/')) {
        const command = message.substring(1);
        
        if (command === 'اضافة') {
          setCurrentCommand('add');
          setCommandStep(0);
          await handleAddUserCommand(message);
        } else if (command === 'تحضير') {
          setCurrentCommand('attendance');
          setCommandStep(0);
          await handleAttendanceCommand(message);
        } else {
          addMessage('bot', 'أمر غير معروف. الأوامر المتاحة:\n/اضافة - لإضافة مستخدم\n/تحضير - لتسجيل الحضور');
        }
      } else if (currentCommand) {
        // Handle ongoing command
        if (currentCommand === 'add') {
          await handleAddUserCommand(message);
        } else if (currentCommand === 'attendance') {
          if (message.toLowerCase() === 'حفظ') {
            await saveAttendanceRecords();
          } else {
            await handleAttendanceCommand(message);
          }
        }
      } else {
        // Regular AI response
        addMessage('bot', 'شكراً لك! يمكنني مساعدتك في إدارة الأكاديمية باستخدام الأوامر:\n\n/اضافة - لإضافة لاعب أو مدرب\n/تحضير - لتسجيل الحضور\n\nما الذي تريد فعله؟');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('bot', 'حدث خطأ في معالجة الرسالة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { 
      icon: UserPlus, 
      label: "إضافة مستخدم", 
      action: () => {
        setInputMessage('/اضافة');
        handleSendMessage();
      }
    },
    { 
      icon: Calendar, 
      label: "تسجيل حضور", 
      action: () => {
        setInputMessage('/تحضير');
        handleSendMessage();
      }
    },
    { 
      icon: BarChart3, 
      label: "إحصائيات", 
      action: () => addMessage('bot', 'سيتم إضافة ميزة الإحصائيات قريباً!')
    }
  ];

  return (
    <Card className="h-full max-h-[calc(100vh-2rem)] shadow-elegant border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-primary" />
          المساعد الذكي المطور
          <Badge variant="default" className="text-xs gradient-primary">
            ChatGPT متقدم
          </Badge>
        </CardTitle>
        <CardDescription className="text-sm">
          مساعد ذكي متطور لإدارة الأكاديمية مع أوامر متقدمة
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col h-[calc(100%-120px)]">
        {/* Quick Actions */}
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">إجراءات سريعة:</p>
          <div className="grid gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="justify-start h-8 text-xs"
              >
                <action.icon className="w-3 h-3 ml-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-80">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-2'
                    : 'bg-muted text-muted-foreground mr-2'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-line">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString('ar-SA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground p-3 rounded-lg mr-2 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="text-sm">جاري المعالجة...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="اكتب رسالتك أو استخدم الأوامر..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
            className="gradient-primary px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {currentCommand && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
            <span className="text-xs text-blue-600 font-medium">
              جاري تنفيذ: {currentCommand === 'add' ? 'إضافة مستخدم' : 'تسجيل الحضور'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetCommand}
              className="text-xs h-6 px-2 ml-2"
            >
              إلغاء
            </Button>
          </div>
        )}

        {/* Usage Info */}
        <div className="mt-3 p-2 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-medium">
              مدعوم بـ ChatGPT - جميع الأوامر محفوظة
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}