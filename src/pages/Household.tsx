import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, User, Calendar, IndianRupee, Recycle, Printer, ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function HouseholdPage() {
  const { id } = useParams<{ id: string }>();

  const { data: house, isLoading: houseLoading } = useQuery({
    queryKey: ['household', id],
    queryFn: () => api.getHousehold(id || ""),
    enabled: !!id
  });

  const { data: collectors, isLoading: collectorsLoading } = useQuery({
    queryKey: ['collectors'],
    queryFn: () => api.getCollectors()
  });

  if (houseLoading || collectorsLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!house) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Household not found.</p>
        </div>
      </Layout>
    );
  }

  const collector = (collectors || []).find((c: any) => c.$id === (house as any).assignedCollector);

  const paymentColor =
    (house as any).paymentStatus === "paid"
      ? "bg-primary/15 text-primary border-primary/20"
      : (house as any).paymentStatus === "pending"
      ? "bg-warning/15 text-foreground border-warning/20"
      : "bg-destructive/15 text-destructive border-destructive/20";

  const segregationColor =
    (house as any).segregationCompliance === "compliant"
      ? "bg-primary/15 text-primary border-primary/20"
      : (house as any).segregationCompliance === "partial"
      ? "bg-warning/15 text-foreground border-warning/20"
      : "bg-destructive/15 text-destructive border-destructive/20";

  return (
    <Layout>
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <Link to="/collector" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Route
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Household Record</h1>
          <p className="text-sm text-muted-foreground">QR Verified — {house.$id}</p>
        </div>

        {/* Household info */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">House ID</p>
                <p className="font-semibold text-foreground flex items-center gap-1"><Home className="h-3.5 w-3.5" />{house.$id}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Resident Name</p>
                <p className="font-semibold text-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" />{(house as any).residentName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Last Collection</p>
                <p className="font-semibold text-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{(house as any).lastCollectionDate || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Payment Status</p>
                <Badge variant="outline" className={paymentColor}>{(house as any).paymentStatus}</Badge>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-0.5">Segregation Compliance</p>
                <Badge variant="outline" className={segregationColor}>{(house as any).segregationCompliance}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Digital Receipt */}
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Digital Receipt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/10">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{(house as any).lastCollectionDate || new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collector</span>
                <span className="font-medium text-foreground">{collector?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-foreground flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{(house as any).monthlyFee}</span>
              </div>
              <div className="flex justify-between text-sm items-center pt-1 border-t border-primary/10">
                <span className="text-muted-foreground">Status</span>
                <span className="text-primary font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Collection Verified
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / Download Receipt
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
