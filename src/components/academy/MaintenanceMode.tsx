import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Construction, Clock, Send } from "lucide-react";

interface MaintenanceModeProps {
  onExit: () => void;
}

export function MaintenanceMode({ onExit }: MaintenanceModeProps) {
  const [message, setMessage] = useState("الأكاديمية تحت الصيانة حالياً، يرجى عدم الحضور حتى إشعار آخر.");
  const [isActive, setIsActive] = useState(true);

  const toggleMaintenance = () => {
    setIsActive(!isActive);
    if (isActive) {
      // Send notification to all users
      console.log("Maintenance mode disabled - sending notifications to all users");
    } else {
      // Send maintenance notification
      console.log("Maintenance mode enabled - sending maintenance notification");
    }
  };

  const sendCustomMessage = () => {
    // Send custom message to all users
    console.log("Sending custom message:", message);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-orange-500 rounded-full flex items-center justify-center shadow-academy mb-4">
            <Construction className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            وضع الصيانة
          </h1>
          <p className="text-academy-text">إدارة صيانة الأكاديمية وإرسال الإشعارات</p>
        </div>

        {/* Maintenance Status */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              حالة الصيانة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={isActive ? "destructive" : "default"}>
              <AlertDescription className="text-center text-lg">
                {isActive ? "🔧 الأكاديمية تحت الصيانة" : "✅ الأكاديمية تعمل بشكل طبيعي"}
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button
                onClick={toggleMaintenance}
                className={`flex-1 ${isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                {isActive ? "إنهاء الصيانة" : "بدء الصيانة"}
              </Button>
              <Button
                onClick={onExit}
                variant="outline"
                className="flex-1"
              >
                العودة للنظام
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Message */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              إرسال رسالة مخصصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="اكتب رسالة لإرسالها لجميع المستخدمين..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button 
              onClick={sendCustomMessage}
              className="w-full gradient-primary"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال لجميع المستخدمين
            </Button>
          </CardContent>
        </Card>

        {/* Maintenance Info */}
        <Card className="shadow-elegant border-0">
          <CardContent className="p-6">
            <div className="text-center space-y-2 text-sm text-muted-foreground">
              <p>• سيتم إرسال إشعارات تلقائية لجميع الطلاب والمدربين</p>
              <p>• سيتم منع الوصول للنظام أثناء الصيانة</p>
              <p>• يمكن للمدراء والمدربين فقط الوصول لوضع الصيانة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}