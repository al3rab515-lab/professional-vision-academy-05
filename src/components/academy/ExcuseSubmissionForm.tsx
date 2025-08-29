import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, X, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExcuseSubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (excuse: ExcuseData) => void;
  studentName: string;
  playerId: string;
}

interface ExcuseData {
  date: string;
  reason: string;
  files: File[];
}

export function ExcuseSubmissionForm({ isOpen, onClose, onSubmit, studentName, playerId }: ExcuseSubmissionFormProps) {
  const [formData, setFormData] = useState<ExcuseData>({
    date: new Date().toISOString().split('T')[0],
    reason: "",
    files: []
  });
  const [absenceDates, setAbsenceDates] = useState<string[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(false);

  // Fetch absence dates for this student
  const fetchAbsenceDates = async () => {
    try {
      setLoadingAbsences(true);
      const { data, error } = await supabase
        .from('attendance_records')
        .select('date')
        .eq('player_id', playerId)
        .eq('status', 'absent')
        .order('date', { ascending: false });

      if (error) throw error;
      
      const dates = data?.map(record => record.date) || [];
      setAbsenceDates(dates);
    } catch (error) {
      console.error('Error fetching absence dates:', error);
    } finally {
      setLoadingAbsences(false);
    }
  };

  useEffect(() => {
    if (isOpen && playerId) {
      fetchAbsenceDates();
    }
  }, [isOpen, playerId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.includes('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    setFormData({
      ...formData,
      files: [...formData.files, ...validFiles]
    });
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      files: formData.files.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      toast.error("يرجى كتابة سبب الغياب");
      return;
    }

    try {
      let fileUrl = null;
      
      // Upload file if exists
      if (formData.files.length > 0) {
        const file = formData.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${playerId}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('excuse-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue without file if upload fails
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('excuse-files')
            .getPublicUrl(uploadData.path);
          fileUrl = urlData.publicUrl;
        }
      }

      // Check if excuse already exists for this date by checking submitted_at
      const startOfDay = new Date(formData.date + 'T00:00:00.000Z').toISOString();
      const endOfDay = new Date(formData.date + 'T23:59:59.999Z').toISOString();
      
      const { data: existingExcuses, error: checkError } = await supabase
        .from('excuse_submissions')
        .select('id')
        .eq('player_id', playerId)
        .gte('submitted_at', startOfDay)
        .lte('submitted_at', endOfDay);

      if (checkError) {
        console.error('Check error:', checkError);
        toast.error("حدث خطأ في التحقق من الأعذار الموجودة");
        return;
      }

      if (existingExcuses && existingExcuses.length > 0) {
        toast.error("تم تقديم عذر لهذا التاريخ مسبقاً");
        return;
      }

      // Submit to database with comprehensive error handling  
      const excuseData = {
        player_id: playerId,
        reason: `تاريخ الغياب: ${formData.date} - ${formData.reason.trim()}`,
        status: 'pending' as const,
        submitted_at: new Date(formData.date + 'T12:00:00.000Z').toISOString(),
        file_url: fileUrl
      };

      console.log('Submitting excuse data:', excuseData);

      const { data: insertedData, error: insertError } = await supabase
        .from('excuse_submissions')
        .insert([excuseData])
        .select('*');

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw new Error(`خطأ في قاعدة البيانات: ${insertError.message}`);
      }

      if (!insertedData || insertedData.length === 0) {
        throw new Error('لم يتم حفظ العذر بشكل صحيح');
      }

      console.log('Excuse submitted successfully:', insertedData[0]);

      toast.success("تم تقديم العذر بنجاح");
      onSubmit(formData);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reason: "",
        files: []
      });
      onClose();
    } catch (error) {
      console.error('Error submitting excuse:', error);
      toast.error("حدث خطأ في تقديم العذر");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            تقديم عذر غياب - {studentName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingAbsences ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">جاري تحميل أيام الغياب...</p>
            </div>
          ) : absenceDates.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                لا توجد أيام غياب مسجلة. يمكنك تقديم عذر فقط للأيام التي تم تسجيل غيابك فيها.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div>
                <Label htmlFor="date">اختر تاريخ الغياب *</Label>
                <select
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  className="w-full p-2 border rounded-md mt-1"
                >
                  <option value="">اختر التاريخ</option>
                  {absenceDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('ar-SA')}
                    </option>
                  ))}
                </select>
              </div>

          <div>
            <Label htmlFor="reason">سبب الغياب *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              placeholder="اكتب سبب الغياب بالتفصيل..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label>المرفقات (اختياري)</Label>
            <div className="space-y-2">
              <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  اسحب الملفات هنا أو انقر للاختيار
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  اختر الملفات
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF أو صور - حد أقصى 5 ميجا لكل ملف
                </p>
              </div>

              {formData.files.length > 0 && (
                <div className="space-y-2">
                  {formData.files.map((file, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 gradient-primary"
                  disabled={!formData.date || !formData.reason.trim()}
                >
                  تقديم العذر
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}