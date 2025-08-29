import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Send, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface EnhancedExcuseFormProps {
  playerId: string;
  onSubmitted?: () => void;
}

interface AbsenceRecord {
  id: string;
  date: string;
  status: string;
}

export function EnhancedExcuseForm({ playerId, onSubmitted }: EnhancedExcuseFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAbsenceRecords();
  }, [playerId]);

  const fetchAbsenceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, date, status')
        .eq('player_id', playerId)
        .eq('status', 'absent')
        .order('date', { ascending: false });

      if (error) throw error;

      setAbsenceRecords(data || []);
      
      // Get dates that can have excuses submitted
      const dates = (data || []).map(record => new Date(record.date));
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching absence records:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجلات الغياب",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !reason.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار التاريخ وإدخال سبب العذر",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Check if there's an absence record for this date
      const absenceExists = absenceRecords.some(record => record.date === dateString);
      
      if (!absenceExists) {
        toast({
          title: "تنبيه",
          description: "لا يوجد سجل غياب لهذا التاريخ",
          variant: "destructive",
        });
        return;
      }

      // Check if excuse already exists for this date
      const { data: existingExcuse, error: checkError } = await (supabase as any)
        .from('excuse_submissions')
        .select('id')
        .eq('player_id', playerId)
        .eq('absence_date', dateString)
        .limit(1);

      if (checkError) throw checkError;

      if (existingExcuse && existingExcuse.length > 0) {
        toast({
          title: "تنبيه",
          description: "تم تقديم عذر لهذا التاريخ مسبقاً",
          variant: "destructive",
        });
        return;
      }

      // Submit excuse
      const { error } = await supabase
        .from('excuse_submissions')
        .insert([{
          player_id: playerId,
          reason: reason.trim(),
          absence_date: dateString,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "تم الإرسال",
        description: "تم إرسال العذر بنجاح وسيتم مراجعته قريباً",
      });

      // Reset form
      setSelectedDate(undefined);
      setReason("");
      
      if (onSubmitted) {
        onSubmitted();
      }

    } catch (error) {
      console.error('Error submitting excuse:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال العذر. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return !absenceRecords.some(record => record.date === dateString);
  };

  return (
    <Card className="shadow-card border-0 academy-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          تقديم عذر غياب
        </CardTitle>
        <CardDescription>
          يمكنك تقديم عذر فقط للأيام التي لديك فيها سجل غياب
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {absenceRecords.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد أيام غياب</h3>
            <p className="text-muted-foreground">
              لا يوجد لديك أي سجلات غياب يمكن تقديم عذر لها
            </p>
          </div>
        ) : (
          <>
            {/* Available Absence Dates */}
            <div className="space-y-3">
              <h4 className="font-medium">أيام الغياب المتاحة لتقديم العذر:</h4>
              <div className="flex flex-wrap gap-2">
                {absenceRecords.map((record) => (
                  <Badge
                    key={record.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedDate(new Date(record.date))}
                  >
                    {format(new Date(record.date), 'dd/MM/yyyy', { locale: ar })}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر تاريخ الغياب:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, 'PPP', { locale: ar })
                    ) : (
                      <span>اختر التاريخ</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={isDateDisabled}
                    initialFocus
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && isDateDisabled(selectedDate) && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>لا يوجد سجل غياب لهذا التاريخ</span>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium">سبب الغياب:</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اشرح سبب غيابك في هذا اليوم..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedDate || !reason.trim() || isDateDisabled(selectedDate || new Date())}
              className="w-full gradient-primary"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  جاري الإرسال...
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  إرسال العذر
                </>
              )}
            </Button>

            {/* Info */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">ملاحظات مهمة:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>يمكن تقديم عذر واحد فقط لكل يوم غياب</li>
                    <li>سيتم مراجعة العذر من قبل المدرب</li>
                    <li>في حالة الموافقة، سيتم تغيير حالة الغياب إلى "معذور"</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}