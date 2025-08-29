import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message, user_type, user_id } = await req.json();

    // التحقق من مفتاح API
    const { data: settings } = await supabaseClient
      .from('academy_settings')
      .select('setting_value')
      .eq('setting_key', 'api_key')
      .single();

    const openAIApiKey = settings?.setting_value || Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('مفتاح API غير متوفر');
    }

    // تحديد السياق حسب نوع المستخدم
    let systemMessage = '';
    if (user_type === 'student') {
      systemMessage = 'أنت مساعد ذكي للطلاب في الأكاديمية الرياضية. تساعد في الاستفسارات العامة والنصائح الرياضية. اجب باللغة العربية بطريقة مفيدة ومشجعة.';
    } else if (user_type === 'trainer') {
      systemMessage = 'أنت مساعد ذكي للمدربين. تساعد في إدارة التدريبات والطلاب والنصائح التدريبية. اجب باللغة العربية بطريقة مهنية.';
    } else {
      systemMessage = 'أنت مساعد ذكي للإدارة. تساعد في الإدارة والتحليل والقرارات الإدارية. اجب باللغة العربية بطريقة مهنية.';
    }

    console.log('طلب ذكاء اصطناعي من:', user_type, 'الرسالة:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('رد الذكاء الاصطناعي:', aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('خطأ في الذكاء الاصطناعي:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});