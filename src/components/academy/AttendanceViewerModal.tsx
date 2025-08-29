import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit,
  User 
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  player_id: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
  player: {
    full_name: string;
    code: string;
  };
}

interface AttendanceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  userType: 'admin' | 'trainer';
}

export function AttendanceViewerModal({ isOpen, onClose, date, userType }: AttendanceViewerModalProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && date) {
      fetchAttendanceRecords();
    }
  }, [isOpen, date]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          player:academy_users!attendance_records_player_id_fkey(full_name, code)
        `)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAttendanceRecords(data?.map(record => ({
        ...record,
        status: record.status as 'present' | 'absent' | 'excused'
      })) || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجلات الحضور",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          status: editStatus as 'present' | 'absent' | 'excused',
          notes: editNotes || null
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث سجل الحضور بنجاح",
      });

      setEditingRecord(null);
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث السجل",
        variant: "destructive",
      });
    }
  };

  const startEdit = (record: AttendanceRecord) => {
    setEditingRecord(record.id);
    setEditStatus(record.status);
    setEditNotes(record.notes || "");
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setEditStatus("");
    setEditNotes("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'excused': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غائب';
      case 'excused': return 'معذور';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'excused': return <Clock className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const stats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === 'present').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    excused: attendanceRecords.filter(r => r.status === 'excused').length,
  };

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            تحضير يوم {new Date(date).toLocaleDateString('ar-SA')}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل التحضير...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-600">إجمالي</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-sm text-green-600">حاضر</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <div className="text-sm text-red-600">غائب</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.excused}</div>
                <div className="text-sm text-yellow-600">معذور</div>
              </div>
            </div>

            <div className="text-center">
              <Badge variant="outline" className="text-lg p-2">
                نسبة الحضور: {attendanceRate}%
              </Badge>
            </div>

            {/* Records List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد سجلات حضور لهذا التاريخ</p>
                </div>
              ) : (
                attendanceRecords.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    {editingRecord === record.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="font-medium">{record.player.full_name}</div>
                          <Badge variant="outline">{record.player.code}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">الحالة</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full mt-1 p-2 border rounded-md"
                            >
                              <option value="present">حاضر</option>
                              <option value="absent">غائب</option>
                              <option value="excused">معذور</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">ملاحظات</label>
                            <Input
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="ملاحظات اختيارية..."
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRecord(record.id)}
                            className="gradient-primary"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            حفظ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="font-medium">{record.player.full_name}</div>
                          <Badge variant="outline">{record.player.code}</Badge>
                          <Badge variant={getStatusColor(record.status) as any}>
                            {getStatusIcon(record.status)}
                            <span className="mr-1">{getStatusText(record.status)}</span>
                          </Badge>
                          {record.notes && (
                            <span className="text-sm text-muted-foreground">
                              {record.notes}
                            </span>
                          )}
                        </div>
                        {userType === 'admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(record)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={onClose} variant="outline">
                <X className="w-4 h-4 mr-2" />
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}