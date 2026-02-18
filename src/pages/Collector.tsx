import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, CheckCircle2, XCircle, LogIn, MapPin, Clock, User, Users, Loader2, Banknote, CreditCard, Camera, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

import { CollectorManagement } from "@/components/CollectorManagement";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export default function CollectorPage() {
  const { user, role } = useAuth();
  const [scanning, setScanning] = useState<boolean>(false);
  const [activelyScanningHouseId, setActivelyScanningHouseId] = useState<string | null>(null);
  const [scannedHouseId, setScannedHouseId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<any>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const lastErrorShownRef = useRef<number>(0);
  const qrcodeRegionId = "qrcode-reader";

  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'collector' && user) {
      setSelectedCollectorId(user.$id);
    }
  }, [role, user]);

  const deleteCollectorMutation = useMutation({
    mutationFn: (id: string) => api.deleteCollector(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
      toast({ title: "Success", description: "Collector removed from database." });
    }
  });

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        qrcodeRegionId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanFormats: [Html5QrcodeSupportedFormats.QR_CODE],
          disableFlip: false, // For enabling flip to take images opposite direction
        },
        false // Verbose logging
      );

      const onScanSuccess = (decodedText: string) => {
        // Must match the EXACT house that was clicked
        if (decodedText === activelyScanningHouseId) {
          setScannedHouseId(decodedText);
          setScanning(false);
          scannerRef.current?.clear();
          toast({ title: "QR Verified", description: "Correct household identified." });
        } else {
          const now = Date.now();
          if (now - lastErrorShownRef.current > 3000) { // 3 second debounce
            lastErrorShownRef.current = now;
            toast({ 
              variant: "destructive", 
              title: "Verification Failed", 
              description: "QR does not match the selected household." 
            });
          }
        }
      };

      const onScanError = (errorMessage: string) => {
        // console.warn(`QR Scan Error: ${errorMessage}`);
      };
      
      scannerRef.current.render(onScanSuccess, onScanError);
    } else if (!scanning && scannerRef.current) {
        scannerRef.current.clear().catch(error => {
            console.error("Failed to clear html5QrcodeScanner", error);
        });
        scannerRef.current = null;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
            console.error("Failed to clear html5QrcodeScanner on unmount", error);
        });
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const { data: collectors, isLoading: collectorsLoading } = useQuery({
    queryKey: ['collectors'],
    queryFn: () => api.getCollectors()
  });

  // 1. Fetch today's route assignment for the logged-in collector
  const { data: todayRoute, isLoading: routeLoading } = useQuery({
    queryKey: ['myRoute', selectedCollectorId],
    queryFn: () => api.getDailyAssignment(selectedCollectorId || "", new Date().toISOString().split('T')[0]),
    enabled: !!selectedCollectorId,
    refetchInterval: 10000, 
  });

  // NEW: Fetch all active routes for today to check ward overlap
  const { data: allActiveRoutes } = useQuery({
    queryKey: ['allRoutesToday'],
    queryFn: () => api.getRoutesByDate(new Date().toISOString().split('T')[0]),
    refetchInterval: 10000,
  });

  // 2. Fetch households ONLY for the assigned ward if a route exists
  const { data: assignedHousesRaw, isLoading: householdsLoading } = useQuery({
    queryKey: ['myHouseholds', todayRoute?.ward],
    queryFn: () => todayRoute ? api.getHouseholdsByWard(todayRoute.ward) : Promise.resolve([]),
    enabled: !!todayRoute,
    refetchInterval: 10000, 
  });

  const assignedHouses = assignedHousesRaw || [];

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { houseId: string, status: string, residentName: string, location: string, paymentMode?: string, paymentStatus?: string }) => 
      api.updateHouseholdStatus(
        vars.houseId, 
        vars.status, 
        vars.status === "collected" ? 100 : 0, 
        collector?.$id || "", 
        collector?.name || "", 
        vars.residentName, 
        vars.location,
        vars.paymentMode,
        vars.paymentStatus
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myHouseholds'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setScannedHouseId(null); 
      setPaymentDialogOpen(false);
      window.location.reload(); 
    }
  });

  const collector = (collectors || []).find((c: any) => c.$id === selectedCollectorId);

  // Check if any of this collector's wards are currently being worked on by someone else
  const otherActiveAssignment = !todayRoute && collector?.ward?.map((w: number) => 
    allActiveRoutes?.find((r: any) => r.ward === w && r.collectorId !== selectedCollectorId)
  ).find(Boolean);
  // const assignedHouses = (households || []).filter((h: any) => h.assignedCollector === selectedCollectorId); // Removed static filter

  const handleScanClick = (houseId: string) => {
    setScanning(true);
    setActivelyScanningHouseId(houseId);
    setScannedHouseId(null); 
  };

  const handleMark = (house: any, status: "collected" | "not-available", paymentMode?: string) => {
    // If offline, we mark as paid immediately. 
    // If online, we keep it as pending (or the current status) so the resident can pay via portal.
    const newPaymentStatus = paymentMode === 'offline' ? 'paid' : house.paymentStatus;

    updateStatusMutation.mutate({ 
      houseId: house.$id, 
      status, 
      residentName: house.residentName, 
      location: house.address,
      paymentMode,
      paymentStatus: newPaymentStatus
    });
    
    toast({
      title: status === "collected" ? "✅ Collection Logged Successfully" : "⚠️ Marked as Not Available",
      description: `House ${house.residentName} — ${paymentMode ? `Payment: ${paymentMode}` : ''}`,
    });
    setPaymentDialogOpen(false);
    setSelectedPaymentMode(null); // Reset selection
  };

  if (collectorsLoading || householdsLoading || routeLoading) {
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
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Collector Routes (Admin)</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Select a collector to monitor their active route and real-time collection progress.
            </p>
            <div className="pt-2">
              <CollectorManagement />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(collectors || []).map((c: any) => (
              <div key={c.$id} className="relative group">
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-center text-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group-hover:shadow-md"
                  onClick={() => setSelectedCollectorId(c.$id)}
                >
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shadow-sm group-hover:scale-110 transition-transform">
                    {c.avatar || c.name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="space-y-1 overflow-hidden w-full">
                    <p className="font-bold text-foreground truncate">{c.name}</p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {(c.ward || []).map((w: number) => (
                        <Badge key={w} variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                          W{w}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Collector?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {c.name}'s record from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCollectorMutation.mutate(c.$id);
                        }}
                      >
                        Delete Record
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
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

        {/* Other Collector assigned message */}
        {otherActiveAssignment && (
          <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg text-sm text-warning-foreground">
            <p className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" /> 
              Ward {(otherActiveAssignment as any).ward} is active
            </p>
            <p className="text-xs mt-1 opacity-80">
              Collector <strong>{(otherActiveAssignment as any).name?.split(' - ')[1] || "Another person"}</strong> is assigned for today's collection.
            </p>
          </div>
        )}

        {/* QR Scanner UI */}
        {scanning && (
          <Card className="p-4 flex flex-col items-center">
            <div id={qrcodeRegionId} className="w-full max-w-sm h-64 bg-muted flex items-center justify-center text-muted-foreground relative">
              {/* QR Code Scanner will render here */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 flex-col gap-2">
                <p className="text-xs text-center px-4">Camera requires HTTPS on mobile.</p>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50"
                  onClick={() => {
                    // Simulate scanning the first pending house for easy testing
                    const firstPending = assignedHouses.find(h => h.collectionStatus === 'pending');
                    if (firstPending) {
                      setScannedHouseId(firstPending.$id);
                      setScanning(false);
                      toast({ title: "Simulated Scan Success", description: `House: ${firstPending.residentName}` });
                    }
                  }}
                >
                  Click to Simulate Scan (Dev)
                </Button>
              </div>
            </div>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setScanning(false)}>
                <XCircle className="h-4 w-4" /> Cancel Scan
            </Button>
          </Card>
        )}

        {/* House list grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assignedHouses.map((house: any) => {
            const currentStatus = house.collectionStatus;
            const isHouseScanned = scannedHouseId === house.$id;

            return (
              <Card key={house.$id} className={currentStatus === "collected" ? "opacity-60 bg-muted/50" : "hover:shadow-sm transition-shadow"}>
                <CardContent className="p-4 space-y-3 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{house.residentName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" /> {house.address}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] px-1.5 py-0 ${
                        currentStatus === "collected"
                          ? "bg-primary/15 text-primary border-primary/20"
                          : currentStatus === "not-available"
                          ? "bg-destructive/15 text-destructive border-destructive/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStatus.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-auto pt-2">
                    {currentStatus === "pending" && !scanning && (
                      <div className="flex flex-col gap-2">
                        {!isHouseScanned ? (
                          <Button
                            size="sm"
                            className="w-full h-8 text-xs gap-1"
                            onClick={() => handleScanClick(house.$id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Camera className="h-3 w-3" /> Scan QR
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full h-8 text-xs gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                                setSelectedHouse(house);
                                setPaymentDialogOpen(true);
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Verified: Log
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full h-8 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleMark(house, "not-available")}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="h-3 w-3" /> Not Home
                        </Button>
                      </div>
                    )}

                    {(currentStatus !== "pending" && currentStatus !== "not-available") && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 italic">
                        <Clock className="h-3 w-3" /> Logged at {house.lastCollectionDate}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {assignedHouses.length === 0 && !scanning && (
           <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
             <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-20" />
             <p>No houses assigned to you today.</p>
           </div>
        )}

        {/* Payment Selection Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={(val) => {
            setPaymentDialogOpen(val);
            if(!val) setSelectedPaymentMode(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Collection Payment</DialogTitle>
              <DialogDescription>
                Select payment method to enable the confirmation button.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 border-2 transition-all ${selectedPaymentMode === 'offline' ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                onClick={() => setSelectedPaymentMode('offline')}
              >
                <Banknote className={`h-8 w-8 ${selectedPaymentMode === 'offline' ? 'text-primary' : 'text-green-600'}`} />
                <span>Cash (Offline)</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 border-2 transition-all ${selectedPaymentMode === 'online' ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                onClick={() => setSelectedPaymentMode('online')}
              >
                <CreditCard className={`h-8 w-8 ${selectedPaymentMode === 'online' ? 'text-primary' : 'text-blue-600'}`} />
                <span>Pay Online</span>
              </Button>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button 
                type="button" 
                className="w-full"
                disabled={!selectedPaymentMode || updateStatusMutation.isPending}
                onClick={() => handleMark(selectedHouse, "collected", selectedPaymentMode!)}
              >
                {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Collection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
