import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, CheckCircle } from "lucide-react";
import { useAcademyData } from "@/hooks/useAcademyData";

interface SportFilteredAttendanceProps {
  onBack: () => void;
  trainerCode: string;
  sport: string;
}

export function SportFilteredAttendance({ onBack, trainerCode, sport }: SportFilteredAttendanceProps) {
  const { users } = useAcademyData();
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);

  useEffect(() => {
    // Filter players by sport type
    const playersInSport = users.filter(user => 
      user.user_type === 'player' && 
      user.sport_type === sport &&
      user.status === 'active'
    );
    setFilteredPlayers(playersInSport);
  }, [users, sport]);

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                تحضير {sport}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                تسجيل حضور لاعبي {sport} فقط
              </p>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            لاعبو {sport} ({filteredPlayers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد لاعبون مسجلون في {sport}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPlayers.map((player) => (
                <div key={player.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{player.full_name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{player.code}</Badge>
                        <Badge variant="secondary">{player.sport_type}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        حاضر
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500 text-red-600">
                        غائب
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}