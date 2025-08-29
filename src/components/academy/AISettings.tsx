import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bot, Key, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface AISettingsProps {
  onBack: () => void;
}

export function AISettings({ onBack }: AISettingsProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [perplexityKey, setPerplexityKey] = useState("");
  const [selectedModel, setSelectedModel] = useState('gpt-5-2025-08-07');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    openai: boolean | null;
    elevenlabs: boolean | null;
    perplexity: boolean | null;
  }>({
    openai: null,
    elevenlabs: null,
    perplexity: null
  });

  const gptModels = [
    { value: 'gpt-5-2025-08-07', label: 'GPT-5 (الأحدث والأقوى)', description: 'النموذج الرئيسي الجديد' },
    { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini (سريع واقتصادي)', description: 'إصدار أسرع وأرخص من GPT-5' },
    { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano (الأسرع)', description: 'الأسرع والأرخص للمهام البسيطة' },
    { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 (موثوق)', description: 'نموذج GPT-4 الرئيسي' },
    { value: 'o3-2025-04-16', label: 'O3 (تفكير متقدم)', description: 'نموذج تفكير قوي للمسائل المعقدة' },
    { value: 'o4-mini-2025-04-16', label: 'O4 Mini (تفكير سريع)', description: 'نموذج تفكير سريع وفعال' }
  ];

  const testOpenAI = async () => {
    if (!openaiKey.trim()) {
      toast.error("يرجى إدخال مفتاح OpenAI أولاً");
      return;
    }
    
    setTesting(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey.trim()}`
        }
      });
      
      const success = response.ok;
      setTestResults(prev => ({ ...prev, openai: success }));
      
      if (success) {
        toast.success("تم التحقق من مفتاح OpenAI بنجاح");
        localStorage.setItem('openai_api_key', openaiKey.trim());
      } else {
        toast.error("مفتاح OpenAI غير صالح");
      }
    } catch (error) {
      console.error('OpenAI test error:', error);
      setTestResults(prev => ({ ...prev, openai: false }));
      toast.error("خطأ في اختبار مفتاح OpenAI");
    } finally {
      setTesting(false);
    }
  };

  const testElevenLabs = async () => {
    if (!elevenLabsKey.trim()) {
      toast.error("يرجى إدخال مفتاح ElevenLabs أولاً");
      return;
    }
    
    setTesting(true);
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': elevenLabsKey.trim()
        }
      });
      
      const success = response.ok;
      setTestResults(prev => ({ ...prev, elevenlabs: success }));
      
      if (success) {
        toast.success("تم التحقق من مفتاح ElevenLabs بنجاح");
        localStorage.setItem('elevenlabs_api_key', elevenLabsKey.trim());
      } else {
        toast.error("مفتاح ElevenLabs غير صالح");
      }
    } catch (error) {
      console.error('ElevenLabs test error:', error);
      setTestResults(prev => ({ ...prev, elevenlabs: false }));
      toast.error("خطأ في اختبار مفتاح ElevenLabs");
    } finally {
      setTesting(false);
    }
  };

  const testPerplexity = async () => {
    if (!perplexityKey.trim()) {
      toast.error("يرجى إدخال مفتاح Perplexity أولاً");
      return;
    }
    
    setTesting(true);
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });
      
      const success = response.ok;
      setTestResults(prev => ({ ...prev, perplexity: success }));
      
      if (success) {
        toast.success("تم التحقق من مفتاح Perplexity بنجاح");
        localStorage.setItem('perplexity_api_key', perplexityKey.trim());
      } else {
        toast.error("مفتاح Perplexity غير صالح");
      }
    } catch (error) {
      console.error('Perplexity test error:', error);
      setTestResults(prev => ({ ...prev, perplexity: false }));
      toast.error("خطأ في اختبار مفتاح Perplexity");
    } finally {
      setTesting(false);
    }
  };

  const saveAllKeys = async () => {
    try {
      let savedCount = 0;
      
      const settings = [];
      
      if (openaiKey.trim() && testResults.openai === true) {
        settings.push({ key: 'openai_api_key', value: openaiKey.trim() });
        savedCount++;
      }
      
      if (elevenLabsKey.trim() && testResults.elevenlabs === true) {
        settings.push({ key: 'elevenlabs_api_key', value: elevenLabsKey.trim() });
        savedCount++;
      }
      
      if (perplexityKey.trim() && testResults.perplexity === true) {
        settings.push({ key: 'perplexity_api_key', value: perplexityKey.trim() });
        savedCount++;
      }
      
      // Always save the selected model
      settings.push({ key: 'selected_gpt_model', value: selectedModel });
      
      if (settings.length > 0) {
        const { error } = await supabase
          .from('academy_settings')
          .upsert(settings);
          
        if (error) throw error;
      }
      
      toast.success(`تم حفظ ${savedCount} مفتاح ونموذج GPT بنجاح`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("خطأ في حفظ الإعدادات");
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_settings')
        .select('*')
        .in('key', ['openai_api_key', 'elevenlabs_api_key', 'perplexity_api_key', 'selected_gpt_model']);

      if (error) throw error;

      const settings = data?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>) || {};

      setOpenaiKey(settings.openai_api_key || '');
      setElevenLabsKey(settings.elevenlabs_api_key || '');
      setPerplexityKey(settings.perplexity_api_key || '');
      setSelectedModel(settings.selected_gpt_model || 'gpt-5-2025-08-07');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">لم يتم الاختبار</Badge>;
    if (status === true) return <Badge variant="default"><CheckCircle className="w-3 h-3 ml-1" />صالح</Badge>;
    return <Badge variant="destructive"><AlertCircle className="w-3 h-3 ml-1" />غير صالح</Badge>;
  };
  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="p-2 hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-academy">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-academy-text">إعدادات الذكاء الاصطناعي</CardTitle>
                  <p className="text-muted-foreground">إدارة مفاتيح APIs ونماذج الذكاء الاصطناعي</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Alert */}
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            يرجى إدخال مفاتيح APIs الخاصة بك لتفعيل خدمات الذكاء الاصطناعي. هذه المفاتيح آمنة ومحفوظة في قاعدة البيانات.
          </AlertDescription>
        </Alert>

        {/* Model Selection */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              اختيار نموذج GPT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>النموذج المستخدم</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النموذج" />
                </SelectTrigger>
                <SelectContent>
                  {gptModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.label}</span>
                        <span className="text-sm text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* OpenAI Settings */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                OpenAI API
              </span>
              {getStatusBadge(testResults.openai)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">مفتاح OpenAI API</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                يستخدم للمحادثة الذكية وتحليل البيانات
              </p>
            </div>
            <Button 
              onClick={testOpenAI} 
              disabled={testing || !openaiKey.trim()}
              variant="outline"
            >
              {testing ? "جاري الاختبار..." : "اختبار المفتاح"}
            </Button>
          </CardContent>
        </Card>

        {/* ElevenLabs Settings */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                ElevenLabs API
              </span>
              {getStatusBadge(testResults.elevenlabs)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="elevenlabs-key">مفتاح ElevenLabs API</Label>
              <Input
                id="elevenlabs-key"
                type="password"
                placeholder="..."
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                يستخدم لتحويل النص إلى كلام عالي الجودة
              </p>
            </div>
            <Button 
              onClick={testElevenLabs} 
              disabled={testing || !elevenLabsKey.trim()}
              variant="outline"
            >
              {testing ? "جاري الاختبار..." : "اختبار المفتاح"}
            </Button>
          </CardContent>
        </Card>

        {/* Perplexity Settings */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Perplexity API
              </span>
              {getStatusBadge(testResults.perplexity)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="perplexity-key">مفتاح Perplexity API</Label>
              <Input
                id="perplexity-key"
                type="password"
                placeholder="pplx-..."
                value={perplexityKey}
                onChange={(e) => setPerplexityKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                يستخدم للبحث الذكي والحصول على معلومات حديثة
              </p>
            </div>
            <Button 
              onClick={testPerplexity} 
              disabled={testing || !perplexityKey.trim()}
              variant="outline"
            >
              {testing ? "جاري الاختبار..." : "اختبار المفتاح"}
            </Button>
          </CardContent>
        </Card>

        {/* Save All */}
        <Card className="shadow-elegant border-0">
          <CardContent className="p-6">
            <Button 
              onClick={saveAllKeys} 
              className="w-full gradient-primary"
              disabled={Object.values(testResults).every(v => v !== true)}
            >
              حفظ جميع المفاتيح الصالحة
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}