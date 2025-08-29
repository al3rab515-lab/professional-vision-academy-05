import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/academy/LoadingScreen";
import { CodeLogin } from "@/components/academy/CodeLogin";
import { AcademyLayout } from "@/components/academy/AcademyLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, User, Home } from "lucide-react";

interface SavedAccount {
  code: string;
  type: 'student' | 'trainer' | 'admin' | 'employee';
  name: string;
  savedAt: string;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<'loading' | 'login' | 'dashboard' | 'main'>('loading');
  const [userType, setUserType] = useState<'student' | 'trainer' | 'admin' | 'employee' | null>(null);
  const [userCode, setUserCode] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [todayLogin, setTodayLogin] = useState<SavedAccount | null>(null);
  
  // Load saved accounts from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem('savedAccounts');
    if (saved) {
      setSavedAccounts(JSON.parse(saved));
    }

    const today = new Date().toISOString().split('T')[0];
    const todayLoginData = localStorage.getItem(`todayLogin_${today}`);
    if (todayLoginData) {
      setTodayLogin(JSON.parse(todayLoginData));
    }
  }, []);

  const handleLoadingComplete = () => {
    setCurrentScreen('login');
  };

  const handleLogin = async (type: 'student' | 'trainer' | 'admin' | 'employee', code: string) => {
    try {
      // Fetch user data from Supabase
      const { data: user, error } = await supabase
        .from('academy_users')
        .select('*')
        .eq('code', code.trim())
        .single();

      if (error || !user) {
        console.error('Error fetching user data:', error);
        return;
      }

      setUserType(type);
      setUserCode(code);
      setUserData(user);
      
      // Save account for quick access
      const newAccount: SavedAccount = {
        code,
        type,
        name: user.full_name || `${type} - ${code}`,
        savedAt: new Date().toISOString()
      };
      
      const updatedAccounts = [newAccount, ...savedAccounts.filter(acc => acc.code !== code)].slice(0, 5);
      setSavedAccounts(updatedAccounts);
      localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));

      // Save today's login
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`todayLogin_${today}`, JSON.stringify(newAccount));
      setTodayLogin(newAccount);

      setCurrentScreen('dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const quickLogin = async (account: SavedAccount) => {
    await handleLogin(account.type, account.code);
  };

  const removeSavedAccount = (code: string) => {
    const updated = savedAccounts.filter(acc => acc.code !== code);
    setSavedAccounts(updated);
    localStorage.setItem('savedAccounts', JSON.stringify(updated));
  };

  const handleLogout = () => {
    setUserType(null);
    setUserCode('');
    setUserData(null);
    setCurrentScreen('main');
  };

  const returnToUser = () => {
    if (todayLogin) {
      quickLogin(todayLogin);
    }
  };

  if (currentScreen === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen gradient-hero">
        {/* Saved Accounts */}
        {savedAccounts.length > 0 && (
          <div className="fixed top-4 left-4 z-50">
            <Card className="shadow-elegant border-0 bg-white/95 backdrop-blur">
              <CardContent className="p-3">
                <h3 className="text-sm font-semibold mb-2">الحسابات المحفوظة</h3>
                <div className="space-y-2">
                  {savedAccounts.map((account) => (
                    <div key={account.code} className="flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => quickLogin(account)}
                        className="flex-1 justify-start text-xs"
                      >
                        <User className="w-3 h-3 ml-1" />
                        {account.name}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSavedAccount(account.code)}
                        className="w-6 h-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <CodeLogin onLogin={handleLogin} />
      </div>
    );
  }

  if (currentScreen === 'main') {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Card className="shadow-elegant border-0 bg-white/95 backdrop-blur max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Home className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">الصفحة الرئيسية</h1>
            <p className="text-muted-foreground mb-6">مرحباً بك في أكاديمية الرؤية المحترفة</p>
            
            <div className="space-y-3">
              {todayLogin && (
                <Button 
                  onClick={returnToUser}
                  className="w-full gradient-primary"
                >
                  العودة للمستخدم ({todayLogin.name})
                </Button>
              )}
              
              <Button 
                onClick={() => setCurrentScreen('login')}
                variant="outline"
                className="w-full"
              >
                تسجيل دخول جديد
              </Button>
              
              {userType && (
                <Button 
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full"
                >
                  خروج نهائي
                </Button>
              )}

              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-semibold">تابعنا على:</h3>
                <a
                  href="https://x.com/visionproacad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  تابعنا على X (تويتر)
                </a>
                <a
                  href="https://www.instagram.com/vision16academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  تابعنا على إنستغرام
                </a>
                <a
                  href="https://wa.me/966557993090"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  تواصل معنا على واتساب
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'dashboard' && userType) {
    return (
      <AcademyLayout
        userType={userType}
        userCode={userCode}
        userData={userData}
        onLogout={handleLogout}
        setUserCode={setUserCode}
      />
    );
  }

  return null;
};

export default Index;
