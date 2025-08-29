import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  Calendar,
  Download,
  ArrowLeft,
  TrendingUp,
  Activity,
  Clock
} from "lucide-react";

interface ReportsPageProps {
  onBack: () => void;
}

export function ReportsPage({ onBack }: ReportsPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const reportStats = {
    totalPlayers: 0,
    activeToday: 0,
    attendanceRate: 0,
    newPlayersThisMonth: 0,
    totalSessions: 0,
    averageSessionTime: 0
  };

  const reportTypes = [
    {
      id: 'attendance',
      title: 'تقرير الحضور والغياب',
      description: 'تفاصيل حضور اللاعبين والمدربين',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'players',
      title: 'تقرير اللاعبين',
      description: 'إحصائيات شاملة عن اللاعبين',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'performance',
      title: 'تقرير الأداء',
      description: 'تحليل أداء الأكاديمية',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'activity',
      title: 'تقرير النشاطات',
      description: 'جميع الأنشطة والفعاليات',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const handleDownloadReport = (reportType: string) => {
    // Simulate report generation and download
    console.log(`Downloading ${reportType} report...`);
    alert(`سيتم تحميل تقرير ${reportType} قريباً`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  التقارير والإحصائيات
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  تقارير شاملة عن أداء الأكاديمية
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Period Selection */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">الفترة الزمنية:</span>
            <div className="flex gap-2">
              {[
                { id: 'week', label: 'أسبوع' },
                { id: 'month', label: 'شهر' },
                { id: 'quarter', label: '3 أشهر' },
                { id: 'year', label: 'سنة' }
              ].map((period) => (
                <Button
                  key={period.id}
                  variant={selectedPeriod === period.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.id)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي اللاعبين</p>
                <p className="text-3xl font-bold text-primary">{reportStats.totalPlayers}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">حاضر اليوم</p>
                <p className="text-3xl font-bold text-green-600">{reportStats.activeToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">نسبة الحضور</p>
                <p className="text-3xl font-bold text-blue-600">{reportStats.attendanceRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">لاعبين جدد</p>
                <p className="text-3xl font-bold text-purple-600">{reportStats.newPlayersThisMonth}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div className="grid md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.id} className="shadow-card border-0 academy-fade-in">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${report.bgColor} flex items-center justify-center`}>
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                </div>
                <Badge variant="outline">متاح</Badge>
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownloadReport(report.id)}
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 ml-2" />
                  تحميل PDF
                </Button>
                <Button
                  onClick={() => handleDownloadReport(report.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 ml-2" />
                  تحميل Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State Message */}
      <Card className="shadow-card border-0">
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">لا توجد بيانات كافية</h3>
          <p className="text-muted-foreground mb-6">
            ابدأ بإضافة اللاعبين والمدربين لرؤية التقارير والإحصائيات
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={onBack} className="gradient-primary">
              <Users className="w-4 h-4 ml-2" />
              إضافة لاعبين
            </Button>
            <Button onClick={onBack} variant="outline">
              <Clock className="w-4 h-4 ml-2" />
              تسجيل حضور
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}