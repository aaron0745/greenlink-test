import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, CheckCircle2, XCircle, LogIn, MapPin, Clock, User, Loader2, Banknote, CreditCard, Camera } from "lucide-react";
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

  const { data: households, isLoading: householdsLoading } = useQuery({
    queryKey: ['households'],
    queryFn: () => api.getHouseholds()
  });

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
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setScannedHouseId(null); // Clear scanned ID after successful update
      window.location.reload(); // Force reload to ensure fresh state
    }
  });

  const collector = (collectors || []).find((c: any) => c.$id === selectedCollectorId);
  const assignedHouses = (households || []).filter((h: any) => h.assignedCollector === selectedCollectorId);

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

        {/* House list */}
        {assignedHouses.map((house: any) => {
          const currentStatus = house.collectionStatus;
          const isHouseScanned = scannedHouseId === house.$id;

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

                {currentStatus === "pending" && !scanning && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleScanClick(house.$id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Camera className="h-4 w-4" /> Scan QR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                          setSelectedHouse(house);
                          setPaymentDialogOpen(true);
                      }}
                      disabled={updateStatusMutation.isPending || !isHouseScanned} // Only enable if house is scanned
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
