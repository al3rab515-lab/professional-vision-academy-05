import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddPlayerForm } from "./AddPlayerForm";
import { PlayerRenewalForm } from "./PlayerRenewalForm";
import { useAcademyData, AcademyUser } from "@/hooks/useAcademyData";
import { 
  Users, 
  Search, 
  Plus,
  Calendar,
  MapPin,
  Phone,
  ArrowLeft,
  UserX,
  Edit,
  ShieldOff,
  ShieldCheck,
  RefreshCw,
  FileText,
  Trophy,
  CreditCard
} from "lucide-react";

interface PlayerManagementProps {
  onBack: () => void;
}

export function PlayerManagement({ onBack }: PlayerManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [renewingPlayer, setRenewingPlayer] = useState<any>(null);
  const { 
    users, 
    addUser, 
    deleteUser,
    updateUser,
    loading,
    generatePlayerCode
  } = useAcademyData();
  
  const players = users.filter(user => user.user_type === 'player');

  const handleAddPlayer = async (playerData: any) => {
    try {
      const newPlayer: Omit<AcademyUser, 'id' | 'created_at' | 'updated_at'> = {
        code: playerData.code || generatePlayerCode(),
        full_name: playerData.full_name,
        phone: playerData.phone,
        age: playerData.age,
        email: playerData.email || undefined,
        user_type: 'player',
        status: 'active',
        residential_area: playerData.residential_area,
        subscription_duration: playerData.subscription_duration,
        learning_goals: playerData.learning_goals,
        subscription_start_date: new Date().toISOString().split('T')[0],
        subscription_days: 30 // Default 30 days
      };
      
      await addUser(newPlayer);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (confirm(`هل أنت متأكد من حذف اللاعب "${playerName}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      try {
        await deleteUser(playerId);
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

  const handleSuspendPlayer = async (playerId: string, playerName: string) => {
    if (confirm(`هل تريد تعليق عضوية اللاعب "${playerName}"؟ سيتم إيقاف الكود الخاص به.`)) {
      try {
        await updateUser(playerId, { status: 'suspended' });
      } catch (error) {
        console.error('Error suspending player:', error);
      }
    }
  };

  const handleActivatePlayer = async (playerId: string, playerName: string) => {
    if (confirm(`هل تريد تفعيل عضوية اللاعب "${playerName}"؟`)) {
      try {
        await updateUser(playerId, { status: 'active' });
      } catch (error) {
        console.error('Error activating player:', error);
      }
    }
  };

  const generateNewCode = async (playerId: string, playerName: string) => {
    if (confirm(`هل تريد إنشاء كود جديد للاعب "${playerName}"؟`)) {
      try {
        const newCode = generatePlayerCode();
        await updateUser(playerId, { code: newCode });
      } catch (error) {
        console.error('Error generating new code:', error);
      }
    }
  };

  const handleRenewPlayer = (player: any) => {
    setRenewingPlayer(player);
    setShowRenewalForm(true);
  };

  const handleRenewal = async (renewalData: any) => {
    try {
      await updateUser(renewingPlayer.id, renewalData);
      setShowRenewalForm(false);
      setRenewingPlayer(null);
    } catch (error) {
      console.error('Error renewing player:', error);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.code?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><Trophy className="w-3 h-3 ml-1" />نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><ShieldOff className="w-3 h-3 ml-1" />معلق</Badge>;
      case 'expired':
        return <Badge variant="destructive">منتهي الصلاحية</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const calculateDaysRemaining = (startDate: string, days: number) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (showAddForm) {
    return (
      <AddPlayerForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onAdd={handleAddPlayer}
      />
    );
  }

  if (showRenewalForm) {
    return (
      <PlayerRenewalForm
        isOpen={showRenewalForm}
        onClose={() => {
          setShowRenewalForm(false);
          setRenewingPlayer(null);
        }}
        onRenew={handleRenewal}
        player={renewingPlayer}
      />
    );
  }

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
                  <Users className="w-6 h-6 text-primary" />
                  إدارة اللاعبين
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  إجمالي اللاعبين: {filteredPlayers.length}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="gradient-primary"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة لاعب جديد
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث باسم اللاعب أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      {loading ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل بيانات اللاعبين...</p>
          </CardContent>
        </Card>
      ) : filteredPlayers.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا يوجد لاعبين</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'ابدأ بإضافة لاعبين جدد للأكاديمية'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowAddForm(true)}
                className="gradient-primary"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول لاعب
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="shadow-card border-0 academy-fade-in">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{player.full_name}</h3>
                    <p className="text-sm text-muted-foreground">كود: {player.code}</p>
                  </div>
                  {getStatusBadge(player.status)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>العمر: {player.age} سنة</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>ولي الأمر: {player.guardian_phone}</span>
                  </div>

                  {player.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>الهاتف: {player.phone}</span>
                    </div>
                  )}

                  {player.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{player.address}</span>
                    </div>
                  )}

                  {player.sport_type && (
                    <div className="mt-2">
                      <Badge variant="outline">{player.sport_type}</Badge>
                    </div>
                  )}

                  {player.subscription_start_date && player.subscription_days && (
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        الاشتراك: {calculateDaysRemaining(player.subscription_start_date, player.subscription_days)} يوم متبقي
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRenewPlayer(player)}
                    className="text-primary hover:bg-primary/10 border-primary/20"
                  >
                    <CreditCard className="w-4 h-4 ml-1" />
                    تجديد
                  </Button>

                  {player.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSuspendPlayer(player.id, player.full_name)}
                      className="text-orange-600 hover:bg-orange-50 border-orange-200"
                    >
                      <ShieldOff className="w-4 h-4 ml-1" />
                      تعليق
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivatePlayer(player.id, player.full_name)}
                      className="text-green-600 hover:bg-green-50 border-green-200"
                    >
                      <ShieldCheck className="w-4 h-4 ml-1" />
                      تفعيل
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateNewCode(player.id, player.full_name)}
                    className="text-blue-600 hover:bg-blue-50 border-blue-200"
                  >
                    <RefreshCw className="w-4 h-4 ml-1" />
                    كود جديد
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePlayer(player.id, player.full_name)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <UserX className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}