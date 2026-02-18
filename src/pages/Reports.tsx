import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, AlertTriangle, TrendingUp, Percent, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Reports() {
  const { data: households, isLoading: householdsLoading } = useQuery({
    queryKey: ['households'],
    queryFn: () => api.getHouseholds()
  });

  const { data: collectionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => api.getCollectionLogs()
  });

  if (householdsLoading || logsLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const stats = {
    total: households?.length || 0,
    covered: households?.filter((h: any) => h.collectionStatus === "collected" || h.paymentStatus === "paid").length || 0,
  };

  const coveragePercent = stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0;
  
  const missedHouses = (households || []).filter(
    (h: any) => h.collectionStatus === "pending" || h.collectionStatus === "not-available"
  );

  // Calculate monthly revenue from logs
  const getMonthlyRevenue = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap: Record<string, number> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        revenueMap[months[d.getMonth()]] = 0;
    }

    collectionLogs?.forEach((log: any) => {
      if (log.status === 'collected' || log.status === 'paid') {
        if (!log.timestamp) return;
        
        const rawDate = log.timestamp.split(',')[0].split(' ')[0];
        let date: Date;

        if (rawDate.includes('/')) {
          const parts = rawDate.split('/');
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          date = new Date(rawDate);
        }

        const monthName = months[date.getMonth()];
        if (revenueMap[monthName] !== undefined) {
          revenueMap[monthName] += log.amountCollected || 0;
        }
      }
    });

    return Object.entries(revenueMap).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  const monthlyRevenueData = getMonthlyRevenue();

  const handleExport = () => {
    const csv = [
      "House ID,Resident,Address,Status,Payment",
      ...(households || []).map(
        (h: any) => `${h.$id},${h.residentName},${h.address},${h.collectionStatus},${h.paymentStatus}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `greenlink-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground"><span className="text-green-600">Green</span>-link Analytics</h1>
            <p className="text-sm text-muted-foreground">Monitoring and compliance data from Appwrite</p>
          </div>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>

        {/* Coverage gauge & revenue chart */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Daily Collection Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-6">
                <div className="relative h-36 w-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="hsl(var(--primary))"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${coveragePercent * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">{coveragePercent}%</p>
                      <p className="text-xs text-muted-foreground">Covered</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 mt-4 text-sm">
                  <span className="text-muted-foreground">{stats.covered}/{stats.total} houses</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `₹${value}`} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(152, 55%, 28%)" strokeWidth={2} dot={{ fill: "hsl(152, 55%, 28%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Missed houses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Missed / Pending Houses ({missedHouses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missedHouses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All houses covered today! 🎉</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
                {missedHouses.map((h: any) => (
                  <div key={h.$id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground text-sm">{h.residentName}</p>
                      <p className="text-xs text-muted-foreground">{h.address} • {h.$id}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        h.collectionStatus === "not-available"
                          ? "bg-destructive/15 text-destructive border-destructive/20"
                          : "bg-warning/15 text-foreground border-warning/20"
                      }
                    >
                      {h.collectionStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
