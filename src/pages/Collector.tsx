import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, CheckCircle2, XCircle, LogIn, MapPin, Clock, User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function CollectorPage() {
  const { user, role } = useAuth();
  const [scanning, setScanning] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // If admin is viewing, they can select a collector? 
  // For now let's assume if it's collector role, use the user object.
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'collector' && user) {
      setSelectedCollectorId(user.$id);
    }
  }, [role, user]);

  const { data: collectors, isLoading: collectorsLoading } = useQuery({
    queryKey: ['collectors'],
    queryFn: () => api.getCollectors()
  });

  const { data: households, isLoading: householdsLoading } = useQuery({
    queryKey: ['households'],
    queryFn: () => api.getHouseholds()
  });

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { houseId: string, status: string, residentName: string, location: string }) => 
      api.updateHouseholdStatus(
        vars.houseId, 
        vars.status, 
        vars.status === "collected" ? 100 : 0, 
        collector?.$id || "", 
        collector?.name || "", 
        vars.residentName, 
        vars.location
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  const collector = (collectors || []).find((c: any) => c.$id === selectedCollectorId);
  const assignedHouses = (households || []).filter((h: any) => h.assignedCollector === selectedCollectorId);

  const handleScan = (house: any) => {
    setScanning(house.$id);
    setTimeout(() => {
      setScanning(null);
      handleMark(house, "collected");
    }, 1500);
  };

  const handleMark = (house: any, status: "collected" | "not-available") => {
    updateStatusMutation.mutate({ 
      houseId: house.$id, 
      status, 
      residentName: house.residentName, 
      location: house.address 
    });
    
    toast({
      title: status === "collected" ? "✅ Collection Logged Successfully" : "⚠️ Marked as Not Available",
      description: `House ${house.residentName} — ${new Date().toLocaleTimeString()}`,
    });
  };

  if (collectorsLoading || householdsLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Admin view: Select a collector to see their route
  if (!selectedCollectorId && role === 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh] p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Route View (Admin)</CardTitle>
              <p className="text-sm text-muted-foreground">Select a collector to view their live route</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {(collectors || []).map((c: any) => (
                <Button
                  key={c.$id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  onClick={() => setSelectedCollectorId(c.$id)}
                >
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {c.avatar || c.name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Wards {(c.ward || []).join(", ")}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!selectedCollectorId) {
      return (
        <Layout>
          <div className="flex h-[80vh] items-center justify-center">
             <p className="text-muted-foreground">Please log in as a collector.</p>
          </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Collector header */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {collector?.avatar || collector?.name.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{collector?.name}</p>
              <p className="text-xs text-muted-foreground">Wards {(collector?.ward || []).join(", ")} • Today's Route</p>
            </div>
            {role === 'admin' && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedCollectorId(null)}>
                Change
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Assigned Houses</h2>
          <Badge variant="outline">{assignedHouses.length} houses</Badge>
        </div>

        {/* House list */}
        {assignedHouses.map((house: any) => {
          const currentStatus = house.collectionStatus;
          const isScanning = scanning === house.$id;

          return (
            <Card key={house.$id} className={currentStatus === "collected" ? "opacity-70" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{house.residentName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {house.address}
                    </p>
                    <p className="text-xs text-muted-foreground">{house.$id}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      currentStatus === "collected"
                        ? "bg-primary/15 text-primary border-primary/20"
                        : currentStatus === "not-available"
                        ? "bg-destructive/15 text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {currentStatus}
                  </Badge>
                </div>

                {/* Scan animation */}
                {isScanning && (
                  <div className="relative h-16 bg-foreground/5 rounded-lg overflow-hidden border border-border">
                    <div className="absolute inset-x-0 h-0.5 bg-primary animate-scan-line" />
                    <div className="flex items-center justify-center h-full text-sm text-primary font-medium">
                      Scanning QR Code...
                    </div>
                  </div>
                )}

                {currentStatus === "pending" && !isScanning && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleScan(house)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <ScanLine className="h-4 w-4" /> Scan QR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleMark(house, "collected")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Collected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive"
                      onClick={() => handleMark(house, "not-available")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" /> N/A
                    </Button>
                  </div>
                )}

                {(currentStatus !== "pending" && currentStatus !== "not-available") && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Logged at {house.lastCollectionDate}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {assignedHouses.length === 0 && (
           <div className="text-center py-10 text-muted-foreground">
             No houses assigned to you today.
           </div>
        )}
      </div>
    </Layout>
  );
}
