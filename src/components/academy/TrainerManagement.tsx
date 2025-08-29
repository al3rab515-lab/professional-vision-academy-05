import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddTrainerForm } from "./AddTrainerForm";
import { useAcademyData, AcademyUser } from "@/hooks/useAcademyData";
import { 
  UserCheck, 
  UserPlus, 
  Search, 
  ArrowLeft, 
  Phone,
  Target,
  Shield,
  Trash2
} from "lucide-react";

interface TrainerManagementProps {
  onBack: () => void;
}

export function TrainerManagement({ onBack }: TrainerManagementProps) {
  const { users, loading, addUser, updateUser, deleteUser, generateTrainerCode } = useAcademyData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const trainers = users.filter(user => user.user_type === 'trainer');
  
  const filteredTrainers = trainers.filter(trainer =>
    trainer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.code.includes(searchTerm) ||
    trainer.phone.includes(searchTerm)
  );

  const handleAddTrainer = async (trainerData: any) => {
    try {
      const code = trainerData.trainerCode || generateTrainerCode();
      const newTrainer: Omit<AcademyUser, 'id' | 'created_at' | 'updated_at'> = {
        code: code,
        full_name: trainerData.name,
        phone: trainerData.phoneNumber,
        age: trainerData.age,
        email: trainerData.email || undefined,
        salary: trainerData.salary,
        job_position: trainerData.jobPosition,
        user_type: 'trainer' as const,
        status: 'active' as const
      };
      await addUser(newTrainer);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding trainer:', error);
    }
  };

  const handleDeleteTrainer = async (trainerId: string, trainerName: string) => {
    if (confirm(`هل أنت متأكد من حذف المدرب "${trainerName}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      try {
        await deleteUser(trainerId);
      } catch (error) {
        console.error('Error deleting trainer:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-academy-text">جاري تحميل بيانات المدربين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="academy-fade-in">
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
                      <UserCheck className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-academy-text">إدارة المدربين</h1>
                      <p className="text-muted-foreground">
                        إجمالي المدربين: {trainers.length} | النشطون: {trainers.filter(t => t.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gradient-primary"
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة مدرب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-elegant border-0 academy-fade-in">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الكود أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Trainers List */}
        {filteredTrainers.length === 0 ? (
          <Card className="shadow-elegant border-0 academy-fade-in">
            <CardContent className="p-12 text-center">
              <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد مدربين</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'لا توجد نتائج للبحث المحدد' : 'لم يتم إضافة أي مدربين بعد'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddForm(true)} className="gradient-primary">
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة أول مدرب
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTrainers.map((trainer) => (
              <Card key={trainer.id} className="shadow-elegant border-0 academy-fade-in hover:shadow-academy transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{trainer.full_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {trainer.phone}
                          </span>
                          {trainer.sport_type && (
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {trainer.sport_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={trainer.status === 'active' ? 'default' : trainer.status === 'suspended' ? 'destructive' : 'secondary'}>
                        {trainer.status === 'active' ? 'نشط' : trainer.status === 'suspended' ? 'معلق' : 'غير نشط'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        كود المدرب: <span className="font-mono font-bold text-blue-600">{trainer.code}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        انضم: {new Date(trainer.created_at).toLocaleDateString('ar-SA')}
                      </p>
                       <div className="flex flex-wrap gap-1 mt-2">
                         {trainer.status === 'active' ? (
                           <Button size="sm" variant="outline" onClick={() => updateUser(trainer.id, {status: 'suspended'})} className="text-orange-600 hover:bg-orange-50">
                             تعليق
                           </Button>
                         ) : (
                           <Button size="sm" variant="outline" onClick={() => updateUser(trainer.id, {status: 'active'})} className="text-green-600 hover:bg-green-50">
                             تفعيل
                           </Button>
                         )}
                         <Button size="sm" variant="outline" onClick={() => updateUser(trainer.id, {code: generateTrainerCode()})} className="text-blue-600 hover:bg-blue-50">
                           كود جديد
                         </Button>
                         <Button size="sm" variant="outline" onClick={() => handleDeleteTrainer(trainer.id, trainer.full_name)} className="text-red-600 hover:bg-red-50">
                           حذف
                         </Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Trainer Form */}
        <AddTrainerForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAdd={handleAddTrainer}
        />
      </div>
    </div>
  );
}