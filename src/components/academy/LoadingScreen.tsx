import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Sparkles, Shield, Database, Brain, Users, CheckCircle, Loader2 } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState("تهيئة النظام...");
  const [currentIcon, setCurrentIcon] = useState(0);
  const [showAcademyName, setShowAcademyName] = useState(false);

  const loadingSteps = [
    { text: "تهيئة النظام...", icon: Database },
    { text: "تحميل واجهات المستخدم...", icon: Users },
    { text: "تحضير قاعدة البيانات...", icon: Shield },
    { text: "تفعيل الذكاء الاصطناعي...", icon: Brain },
    { text: "إعداد الأمان والحماية...", icon: Shield },
    { text: "تحميل بيانات المدير عيسى المحياني...", icon: Users },
    { text: "فحص اتصال الخوادم...", icon: Database },
    { text: "تحسين الأداء...", icon: Sparkles },
    { text: "جاري الإنتهاء...", icon: GraduationCap },
    { text: "مرحباً بك في أكاديمية الرؤية المحترفة", icon: CheckCircle }
  ];

  useEffect(() => {
    // Show academy name after 800ms
    setTimeout(() => setShowAcademyName(true), 800);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 1200);
          return 100;
        }
        
        // Update text and icon based on progress
        const stepIndex = Math.floor((prev / 100) * (loadingSteps.length - 1));
        setCurrentText(loadingSteps[stepIndex].text);
        setCurrentIcon(stepIndex);
        
        return prev + 1; // Slower, more realistic loading
      });
    }, 90); // Slower interval for more realistic feel

    return () => clearInterval(interval);
  }, [onComplete]);

  const CurrentIcon = loadingSteps[currentIcon]?.icon || GraduationCap;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-200 flex items-center justify-center z-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-academy-purple rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="text-center space-y-12 max-w-lg mx-auto p-8 relative z-10">
        {/* Main Logo Animation */}
        <div className="relative academy-fade-in">
          <div className="w-36 h-36 mx-auto bg-gradient-to-br from-primary via-academy-purple to-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:scale-105 transition-all duration-700 relative overflow-hidden academy-pulse">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <GraduationCap className="w-20 h-20 text-white relative z-10" />
          </div>
          
          {/* Floating Icons */}
          <div className="absolute -top-6 -right-6 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center animate-float border border-gray-100">
            <Sparkles className="w-7 h-7 text-academy-purple" />
          </div>
          <div className="absolute -bottom-4 -left-6 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center animate-float-delayed border border-gray-100">
            <Shield className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Title */}
        {showAcademyName && (
          <div className="space-y-4 academy-slide-in">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-academy-purple to-primary bg-clip-text text-transparent leading-tight">
              أكاديمية الرؤية المحترفة
            </h1>
            <p className="text-xl text-gray-600 font-semibold">
              إدارة: المدير عيسى المحياني
            </p>
            <p className="text-lg text-gray-500 font-medium">
              نحو مستقبل تقني مشرق ✨
            </p>
          </div>
        )}

        {/* Loading Section */}
        <div className="space-y-8 bg-white/90 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-gray-200/50 academy-fade-in">
          {/* Current Step Icon */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/15 to-academy-purple/15 rounded-full flex items-center justify-center relative">
              <CurrentIcon className="w-10 h-10 text-primary animate-pulse" />
              {progress < 100 && (
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-4">
            <div className="relative">
              <Progress 
                value={progress} 
                className="h-5 bg-gray-200 overflow-hidden rounded-full shadow-inner"
              />
              {/* Animated Shimmer on Progress Bar */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-fast rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-base text-gray-700 font-semibold animate-pulse">
                {currentText}
              </p>
              <p className="text-lg font-bold text-primary bg-primary/10 px-4 py-2 rounded-full shadow-sm">
                {Math.round(progress)}%
              </p>
            </div>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-3">
            <div className="w-4 h-4 bg-primary rounded-full animate-bounce shadow-lg" style={{animationDelay: '0s'}}></div>
            <div className="w-4 h-4 bg-academy-purple rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.15s'}}></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.3s'}}></div>
            <div className="w-4 h-4 bg-academy-purple rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.45s'}}></div>
          </div>

          {/* Real-time Status */}
          <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري التحميل من الخوادم الآمنة...</span>
          </div>
        </div>

        {/* System Info */}
        <div className="text-xs text-gray-400 space-y-2 academy-fade-in">
          <p className="font-medium">نظام إدارة الأكاديمية v2.0</p>
          <p>مدعوم بالذكاء الاصطناعي • آمن ومحمي</p>
          <div className="flex items-center justify-center space-x-2 mt-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-semibold">متصل بالخوادم</span>
          </div>
        </div>
      </div>
    </div>
  );
}