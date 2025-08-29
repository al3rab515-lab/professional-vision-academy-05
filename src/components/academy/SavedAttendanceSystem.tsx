import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AttendanceViewerModal } from "./AttendanceViewerModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  ArrowLeft, 
  FolderOpen, 
  Edit,
  Trash2,
  Eye,
  Search,
  Archive,
  CalendarDays
} from "lucide-react";

interface SavedAttendance {
  key: string;
  value: string;
  parsedData: {
    date: string;
    total_players: number;
    present_count: number;
    absent_count: number;
    excused_count: number;
    attendance_rate: number;
    saved_at: string;
  };
}

interface SavedAttendanceSystemProps {
  onBack: () => void;
  userType: 'admin' | 'trainer';
}

export function SavedAttendanceSystem({ onBack, userType }: SavedAttendanceSystemProps) {
  const [savedAttendances, setSavedAttendances] = useState<SavedAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedAttendances();
  }, []);

  const fetchSavedAttendances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academy_settings')
        .select('*')
        .like('key', 'saved_attendance_%')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const parsedData = data?.map(setting => ({
        ...setting,
        parsedData: JSON.parse(setting.value)
      })) || [];
      
      setSavedAttendances(parsedData);
    } catch (error) {
      console.error('Error fetching saved attendances:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل محفوظات التحضير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSavedAttendance = async (key: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التحضير؟")) return;

    try {
      const { error } = await supabase
        .from('academy_settings')
        .delete()
        .eq('key', key);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف التحضير بنجاح",
      });

      fetchSavedAttendances();
    } catch (error) {
      console.error('Error deleting saved attendance:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف التحضير",
        variant: "destructive",
      });
    }
  };

  const viewAttendanceDetails = (date: string) => {
    setSelectedDate(date);
    setViewerModalOpen(true);
  };

  // Group attendances by month
  const groupedAttendances = savedAttendances.reduce((acc, attendance) => {
    const date = new Date(attendance.parsedData.date);
    const monthYear = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(attendance);
    return acc;
  }, {} as Record<string, SavedAttendance[]>);

  // Filter based on search
  const filteredGroups = Object.entries(groupedAttendances).filter(([monthYear, attendances]) => {
    if (searchTerm) {
      return attendances.some(att => 
        att.parsedData.date.includes(searchTerm) || 
        monthYear.includes(searchTerm)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-academy-text">جاري تحميل محفوظات التحضير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="gradient-card shadow-elegant border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-academy">
                    <Archive className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-academy-text">محفوظات التحضير</h1>
                    <p className="text-muted-foreground">
                      جميع التحضيرات المحفوظة مرتبة بالشهور والسنوات
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="shadow-elegant border-0">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالتاريخ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records by Month */}
        {filteredGroups.length === 0 ? (
          <Card className="shadow-elegant border-0">
            <CardContent className="p-12 text-center">
              <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد محفوظات</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'لا توجد نتائج للبحث المحدد' : 'لم يتم حفظ أي تحضيرات بعد'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map(([monthYear, attendances]) => (
              <Card key={monthYear} className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    <span>{monthYear}</span>
                    <Badge variant="outline">
                      {attendances.length} تحضير
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {attendances.map((attendance) => (
                      <div
                        key={attendance.key}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {new Date(attendance.parsedData.date).toLocaleDateString('ar-SA')}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>إجمالي: {attendance.parsedData.total_players}</span>
                              <span className="text-green-600">حاضر: {attendance.parsedData.present_count}</span>
                              <span className="text-red-600">غائب: {attendance.parsedData.absent_count}</span>
                              <span className="text-yellow-600">معذور: {attendance.parsedData.excused_count}</span>
                              <Badge variant="secondary">{attendance.parsedData.attendance_rate}% نسبة الحضور</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewAttendanceDetails(attendance.parsedData.date)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {userType === 'admin' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSavedAttendance(attendance.key)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Attendance Viewer Modal */}
        <AttendanceViewerModal
          isOpen={viewerModalOpen}
          onClose={() => setViewerModalOpen(false)}
          date={selectedDate}
          userType={userType}
        />
      </div>
    </div>
  );
}