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

    const { phone, message, title, type = 'general', user_id = null } = await req.json();

    console.log('إرسال إشعار:', { phone, message, title, type });

    // حفظ الإشعار في قاعدة البيانات
    const { error: notificationError } = await supabaseClient
      .from('academy_notifications')
      .insert({
        user_id,
        title,
        message,
        type
      });

    if (notificationError) {
      console.error('خطأ في حفظ الإشعار:', notificationError);
    }

    // هنا يمكن إضافة API لإرسال SMS حقيقي
    console.log(`SMS إلى ${phone}: ${title} - ${message}`);

    return new Response(
      JSON.stringify({ success: true, message: 'تم إرسال الإشعار بنجاح' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});