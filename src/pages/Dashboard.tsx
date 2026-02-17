import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Clock, IndianRupee, MapPin, Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HouseholdManagement } from "@/components/HouseholdManagement";

const statusColors: Record<string, string> = {
  collected: "bg-primary/15 text-primary border-primary/20",
  "not-available": "bg-destructive/15 text-destructive border-destructive/20",
  skipped: "bg-warning/15 text-warning border-warning/20",
};

export default function Dashboard() {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

  const { data: households, isLoading: householdsLoading } = useQuery({
    queryKey: ['households'],
    queryFn: () => api.getHouseholds(),
    enabled: isAdmin
  });

  const { data: collectionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => api.getCollectionLogs()
  });

  // Calculate stats locally from fetched data instead of making a separate API call
  const stats = (() => {
    if (!isAdmin || !households || !collectionLogs) return null;
    
    const total = households.length;
    const covered = households.filter((h: any) => h.collectionStatus === "collected").length;
    const pending = households.filter((h: any) => h.collectionStatus === "pending").length;
    const revenue = collectionLogs.filter((l: any) => l.status === "collected").reduce((a: number, l: any) => a + l.amountCollected, 0);

    return { 
        total, covered, pending, revenue
    };
  })();

  if (householdsLoading || logsLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Calculate dynamic chart data from logs
  const getDynamicChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: days[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        collected: 0,
        missed: 0
      };
    });

    collectionLogs?.forEach((log: any) => {
      const logDate = log.timestamp.split(' ')[0]; // Assumes "YYYY-MM-DD HH:MM"
      const dayData = last7Days.find(d => d.dateStr === logDate);
      if (dayData) {
        if (log.status === 'collected') dayData.collected++;
        else dayData.missed++;
      }
    });

    return last7Days;
  };

  const chartData = getDynamicChartData();

  if (!isAdmin && role === 'household') {
    const myLogs = (collectionLogs || []).filter((l: any) => l.householdId === user.$id);
    const myStats = {
      residentName: user.residentName,
      address: user.address,
      paymentStatus: user.paymentStatus,
      collectionStatus: user.collectionStatus,
      lastDate: user.lastCollectionDate,
    };

    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Resident Portal</h1>
              <p className="text-sm text-muted-foreground">{myStats.residentName} — {myStats.address}</p>
            </div>
            <Badge variant="outline" className={`h-fit text-sm py-1 ${myStats.paymentStatus === 'paid' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
              Payment: {myStats.paymentStatus.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Calendar className="h-5 w-5 mb-1 text-primary" />
                  <p className="text-xl font-bold text-foreground">{myStats.lastDate || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Last Collection</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <MapPin className="h-5 w-5 mb-1 text-primary" />
                  <p className="text-xl font-bold text-foreground">{myStats.address}</p>
                  <p className="text-xs text-muted-foreground">Location</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <CheckCircle2 className="h-5 w-5 mb-1 text-primary" />
                  <p className="text-xl font-bold text-foreground capitalize">{myStats.collectionStatus}</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </CardContent>
              </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5" /> Your Collection History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Collector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Fee Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myLogs.map((log: any) => (
                    <TableRow key={log.$id}>
                      <TableCell className="text-sm">{log.timestamp}</TableCell>
                      <TableCell className="text-sm font-medium">{log.collectorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[log.status]}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{log.amountCollected}</TableCell>
                    </TableRow>
                  ))}
                  {myLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No collection records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const widgets = [
    { label: "Total Houses", value: stats?.total || 0, icon: Home, color: "text-primary" },
    { label: "Covered Today", value: stats?.covered || 0, icon: Users, color: "text-primary" },
    { label: "Pending", value: stats?.pending || 0, icon: Clock, color: "text-warning" },
    { label: "Revenue Today", value: `₹${stats?.revenue || 0}`, icon: IndianRupee, color: "text-primary" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground"><span className="text-green-600">Green</span>-link Admin</h1>
            <p className="text-sm text-muted-foreground">Panchayat-wide waste collection overview</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="manage">Manage Households</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {widgets.map((w) => (
                <Card key={w.label}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <w.icon className={`h-5 w-5 mb-1 ${w.color}`} />
                    <p className="text-2xl font-bold text-foreground">{w.value}</p>
                    <p className="text-xs text-muted-foreground">{w.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weekly Collection Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="collected" fill="hsl(152, 55%, 28%)" name="Collected" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="missed" fill="hsl(0, 72%, 51%)" name="Missed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Map placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Collection Map View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative h-[260px] bg-muted rounded-lg overflow-hidden border border-border">
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-primary opacity-50" />
                        <p className="font-medium">Live Coverage Map</p>
                        <p className="text-xs">Visualizing {households?.length || 0} household points</p>
                      </div>
                    </div>
                    {/* Real markers from Appwrite */}
                    {(households || []).map((h: any, i: number) => (
                      <div
                        key={h.$id}
                        className={`absolute w-3 h-3 rounded-full border-2 border-primary-foreground shadow-sm ${h.collectionStatus === 'collected' ? 'bg-primary' : 'bg-warning'}`}
                        style={{
                          top: `${15 + (i * 9.5) % 70}%`,
                          left: `${10 + (i * 12.3) % 80}%`,
                        }}
                        title={`${h.residentName} - ${h.address}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground justify-center">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Collected</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />Pending</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Collection Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collector</TableHead>
                      <TableHead>Household</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(collectionLogs || []).map((log: any) => (
                      <TableRow key={log.$id}>
                        <TableCell className="font-medium text-sm">{log.collectorName}</TableCell>
                        <TableCell className="text-sm">{log.residentName}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{log.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[log.status]}`}>
                            {log.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          ₹{log.amountCollected}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Household Management</CardTitle>
              </CardHeader>
              <CardContent>
                <HouseholdManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
