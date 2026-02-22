
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CandidateCard } from '@/components/hr/CandidateCard';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Download,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#4B0082', '#8F00FF', '#FF8042', '#FF0000'];

export default function HRDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ fullName: "", email: "", role: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const candidatesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'candidate_profiles'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: candidates, isLoading } = useCollection(candidatesQuery);

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'candidate_profiles'), {
        ...newCandidate,
        profileStatus: 'pending_documents',
        trustScore: 0,
        fraudRiskScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast({
        title: "Candidate Added",
        description: `${newCandidate.fullName} has been invited to the platform.`,
      });
      setIsAddDialogOpen(false);
      setNewCandidate({ fullName: "", email: "", role: "" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add candidate. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportReport = () => {
    toast({
      title: "Generating Report",
      description: "Your comprehensive intelligence report is being prepared for download.",
    });
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Report Exported",
        description: "VeriHire_Intelligence_Report.pdf has been saved to your downloads.",
      });
    }, 2000);
  };

  // Derived stats
  const totalCandidates = candidates?.length || 0;
  const highRiskCount = candidates?.filter(c => (c.fraudRiskScore || 0) > 60).length || 0;
  const verifiedCount = candidates?.filter(c => c.profileStatus === 'verified').length || 0;
  const avgTrustScore = candidates && candidates.length > 0 
    ? (candidates.reduce((acc, c) => acc + (c.trustScore || 0), 0) / candidates.length).toFixed(1)
    : "0.0";

  const riskDistribution = [
    { name: 'Low Risk', value: candidates?.filter(c => (c.fraudRiskScore || 0) <= 20).length || 0 },
    { name: 'Med Risk', value: candidates?.filter(c => (c.fraudRiskScore || 0) > 20 && (c.fraudRiskScore || 0) <= 60).length || 0 },
    { name: 'High Risk', value: highRiskCount },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold">HR Intelligence Dashboard</h1>
            <p className="text-slate-500">Manage candidate verifications and hiring risks.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={handleExportReport}>
              <Download className="w-4 h-4" /> Export Report
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary gap-2">
                  <Plus className="w-4 h-4" /> Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Candidate</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a candidate to start their automated background verification.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCandidate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Jane Doe" 
                      required 
                      value={newCandidate.fullName}
                      onChange={(e) => setNewCandidate({...newCandidate, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="jane@example.com" 
                      required 
                      value={newCandidate.email}
                      onChange={(e) => setNewCandidate({...newCandidate, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Target Role</Label>
                    <Input 
                      id="role" 
                      placeholder="Software Engineer" 
                      required 
                      value={newCandidate.role}
                      onChange={(e) => setNewCandidate({...newCandidate, role: e.target.value})}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Inviting..." : "Invite Candidate"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Candidates" value={totalCandidates.toString()} icon={<Users className="w-5 h-5 text-blue-500" />} trend="+12% from last month" />
          <StatCard title="High Risk Flags" value={highRiskCount.toString()} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} trend="-4% this week" />
          <StatCard title="Verified Results" value={verifiedCount.toString()} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} trend="+28% vs avg" />
          <StatCard title="Avg Trust Score" value={avgTrustScore} icon={<TrendingUp className="w-5 h-5 text-primary" />} trend="Consistent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Candidate List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-0">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search by name, email, or role..." 
                      className="pl-10" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="bg-slate-50"><List className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon"><LayoutGrid className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {isLoading ? (
                  <div className="text-center py-12 text-slate-400">Loading candidates...</div>
                ) : candidates && candidates.length > 0 ? (
                  candidates
                    .filter(c => 
                      c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((c) => (
                      <CandidateCard 
                        key={c.id} 
                        name={c.fullName} 
                        role={c.role || "Candidate"} 
                        trustScore={c.trustScore || 0} 
                        risk={c.fraudRiskScore > 60 ? 'High' : c.fraudRiskScore > 20 ? 'Medium' : 'Low'}
                        status={c.profileStatus === 'verified' ? 'Verified' : c.profileStatus === 'rejected' ? 'Flagged' : 'Pending'}
                        image={`https://picsum.photos/seed/${c.id}/200/200`} 
                      />
                    ))
                ) : (
                  <div className="text-center py-12 text-slate-400">No candidates found. Click "Add Candidate" to start.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Charts */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Distribution</CardTitle>
                <CardDescription>Major risk categories detected among candidates.</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {riskDistribution.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-slate-500 truncate">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trust Score Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4B0082" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-slate-50 group-hover:scale-110 transition-transform">{icon}</div>
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{trend}</span>
        </div>
        <div>
          <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
