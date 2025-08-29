import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, Edit, Trash2, Search, Save } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface AttendanceRecord {
  id: string;
  date: string;
  player_id: string;
  status: string;
  notes: string | null;
  trainer_id: string;
  player: {
    full_name: string;
    code: string;
  };
}

interface AttendanceHistoryProps {
  userType: string;
  userId?: string;
}

export function AttendanceHistory({ userType, userId }: AttendanceHistoryProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceHistory();
  }, [userType, userId]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          player:academy_users!attendance_records_player_id_fkey(full_name, code)
        `)
        .order('date', { ascending: false });

      if (userType === 'student' && userId) {
        query = query.eq('player_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجل الحضور",
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
          status: editStatus,
          notes: editNotes || null
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث سجل الحضور بنجاح",
      });

      setEditingRecord(null);
      fetchAttendanceHistory();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث السجل",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;

    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف السجل بنجاح",
      });

      fetchAttendanceHistory();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف السجل",
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

  const filteredRecords = attendanceRecords.filter(record =>
    !searchDate || record.date.includes(searchDate)
  );

  const groupedRecords = filteredRecords.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري تحميل سجل الحضور...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-elegant border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          سجل الحضور التفصيلي
        </CardTitle>
        <CardDescription>
          جميع سجلات الحضور والغياب مرتبة حسب التاريخ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="البحث بالتاريخ..."
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setSearchDate("")}
          >
            إزالة الفلتر
          </Button>
        </div>

        {/* Records by Date */}
        <div className="space-y-6">
          {Object.keys(groupedRecords).length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد سجلات</h3>
              <p className="text-muted-foreground">لم يتم العثور على أي سجلات حضور</p>
            </div>
          ) : (
            Object.entries(groupedRecords).map(([date, records]) => (
              <Card key={date} className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {format(new Date(date), 'EEEE dd MMMM yyyy', { locale: ar })}
                    </CardTitle>
                    <Badge variant="outline">
                      {records.length} سجل
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {records.map((record) => (
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
                                {getStatusText(record.status)}
                              </Badge>
                              {record.notes && (
                                <span className="text-sm text-muted-foreground">
                                  {record.notes}
                                </span>
                              )}
                            </div>
                            {userType === 'admin' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(record)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}