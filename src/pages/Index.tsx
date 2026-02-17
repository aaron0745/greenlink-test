import { Link } from "react-router-dom";
import { Leaf, Recycle, BarChart3, Shield, Truck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  { icon: Shield, title: "Transparency", desc: "Every collection is digitally logged with timestamps and GPS verification." },
  { icon: BarChart3, title: "Efficiency", desc: "Real-time dashboards replace manual logbooks, saving hours of administrative work." },
  { icon: Recycle, title: "Sustainability", desc: "Promote responsible disposal and ensure 100% coverage across wards." },
];

const problems = [
  "Manual logbooks are error-prone and easily manipulated",
  "No real-time visibility into collection coverage",
  "Revenue leakage due to unverified collections",
  "Inefficient route tracking and ward monitoring",
  "Paper receipts are easily lost or forged",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <nav className="relative z-10 container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight"><span className="text-green-600">Green</span>-link</p>
              <p className="text-xs text-muted-foreground">Smart Waste Management</p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button size="sm">View Dashboard</Button>
          </Link>
        </nav>

        <div className="relative z-10 container mx-auto px-6 py-20 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Recycle className="h-4 w-4" />
            Digital Transformation for Kerala Panchayats
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
            Smart Waste Management System
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Replace manual logbooks and paper receipts with a QR-based digital workflow.
            Empowering Panchayats with transparency, efficiency, and accountability.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                View Dashboard Demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/collector">
              <Button size="lg" variant="outline" className="gap-2">
                <Truck className="h-4 w-4" /> Collector Interface
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Problem Section */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">The Problem with Manual Systems</h2>
          <p className="text-muted-foreground text-center mb-8">Current paper-based workflows are failing Kerala's waste management goals.</p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {problems.map((p, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <span className="text-destructive font-bold text-sm mt-0.5">✕</span>
                <p className="text-sm text-foreground">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">The Digital Solution</h2>
          <p className="text-muted-foreground mb-10">A complete QR-based workflow that digitizes every step of the waste collection process.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "QR Code Scan", desc: "Collector scans household QR at each doorstep to verify the visit." },
              { step: "2", title: "Auto-Log Data", desc: "Timestamp, GPS location, and payment are logged automatically." },
              { step: "3", title: "Digital Receipt", desc: "Resident gets a verified digital receipt. Admin sees it live." },
            ].map((s) => (
              <Card key={s.step} className="text-left">
                <CardContent className="pt-6">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Key Benefits</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex flex-col items-center text-center p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Why Go Digital?</h2>
          <div className="space-y-3">
            {[
              "Eliminates manual errors",
              "Prevents revenue leakage",
              "Real-time monitoring for administrators",
              "Improves collector accountability",
              "Enables data-driven governance",
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Green-link — Smart Waste Management System | Digital Initiative
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
