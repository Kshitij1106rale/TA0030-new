
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
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Download,
  Plus,
  ShieldAlert,
  Loader2,
  UserPlus,
  ShieldCheck,
  Mail,
  Briefcase,
  History
} from 'lucide-react';
import { 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { WorkflowStatus, AgentStep } from '@/components/agentic/WorkflowStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#4B0082', '#8F00FF', '#FF8042', '#FF0000'];

export default function HRDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [newCandidate, setNewCandidate] = useState({ fullName: "", email: "", role: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const db = useFirestore();
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();

  const hrProfileRef = useMemoFirebase(() => {
    if (!db || !firebaseUser) return null;
    return doc(db, 'hr_profiles', firebaseUser.uid);
  }, [db, firebaseUser]);
  
  const { data: hrProfile, isLoading: isProfileLoading } = useDoc(hrProfileRef);

  const candidatesQuery = useMemoFirebase(() => {
    if (!db || !hrProfile) return null;
    return query(collection(db, 'candidate_profiles'), orderBy('createdAt', 'desc'));
  }, [db, hrProfile]);
  
  const { data: candidates, isLoading: isCandidatesLoading } = useCollection(candidatesQuery);

  const selectedCandidate = candidates?.find(c => c.id === selectedCandidateId);

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !firebaseUser || !hrProfile) return;
    
    setIsSubmitting(true);
    try {
      const candidatesCol = collection(db, 'candidate_profiles');
      const candidateRef = doc(candidatesCol);
      const candidateId = candidateRef.id;

      setDocumentNonBlocking(candidateRef, {
        id: candidateId,
        fullName: newCandidate.fullName,
        email: newCandidate.email,
        role: newCandidate.role,
        profileStatus: 'pending_documents',
        trustScore: 0,
        fraudRiskScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      toast({
        title: "Candidate Invited",
        description: `${newCandidate.fullName} has been added and will receive an invitation email.`,
      });
      
      setIsAddDialogOpen(false);
      setNewCandidate({ fullName: "", email: "", role: "" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not add candidate profile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCandidates = candidates?.filter(c => 
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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

  if (!isAuthLoading && !isProfileLoading && !hrProfile && firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
           <div className="max-w-md mx-auto space-y-6">
             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
               <ShieldAlert className="w-10 h-10 text-red-600" />
             </div>
             <div className="space-y-2">
               <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
               <p className="text-slate-500">Your account does not have HR administrator privileges.</p>
             </div>
             <Button variant="outline" onClick={() => window.location.href = '/'}>Return to Home</Button>
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold text-slate-900">HR Intelligence Dashboard</h1>
            <p className="text-slate-500">
              {isProfileLoading ? "Verifying access..." : `Welcome back, ${hrProfile?.fullName || 'Recruiter'}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4" />
                  Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Invite Candidate
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCandidate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="e.g. Jane Smith" required value={newCandidate.fullName} onChange={(e) => setNewCandidate({...newCandidate, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="jane@company.com" required value={newCandidate.email} onChange={(e) => setNewCandidate({...newCandidate, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Applied Role</Label>
                    <Input id="role" placeholder="e.g. Senior Software Engineer" required value={newCandidate.role} onChange={(e) => setNewCandidate({...newCandidate, role: e.target.value})} />
                  </div>
                  <DialogFooter className="mt-6 flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Candidates" value={totalCandidates.toString()} icon={<Users className="w-5 h-5 text-blue-500" />} trend="+4 this week" />
          <StatCard title="High Risk" value={highRiskCount.toString()} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} trend="Priority Review" />
          <StatCard title="Verified" value={verifiedCount.toString()} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} trend="Ready to Hire" />
          <StatCard title="Avg Trust Score" value={avgTrustScore} icon={<TrendingUp className="w-5 h-5 text-primary" />} trend="Stable" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Filter by name, email, or role..." 
                    className="pl-10 bg-slate-50 border-none" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3 bg-white">
                {isCandidatesLoading || isProfileLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary opacity-40" />
                    <p className="text-sm text-slate-400 animate-pulse">Syncing verification data...</p>
                  </div>
                ) : filteredCandidates.length > 0 ? (
                  filteredCandidates.map((c) => (
                    <CandidateCard 
                      key={c.id}
                      id={c.id}
                      name={c.fullName} 
                      role={c.role || "Candidate"} 
                      trustScore={c.trustScore || 0} 
                      risk={(c.fraudRiskScore || 0) > 60 ? 'High' : (c.fraudRiskScore || 0) > 20 ? 'Medium' : 'Low'}
                      status={c.profileStatus === 'verified' ? 'Verified' : c.profileStatus === 'rejected' ? 'Flagged' : 'Pending'}
                      image={`https://picsum.photos/seed/${c.id}/200/200`} 
                      onClick={setSelectedCandidateId}
                    />
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50/50 rounded-lg border border-dashed">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No candidates found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b">
                <CardTitle className="text-lg">Risk Insights</CardTitle>
                <CardDescription>Major risk categories detected across your talent pool.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pt-6 bg-white flex items-center justify-center">
                {totalCandidates > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-white stroke-2" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 space-y-2">
                    <TrendingUp className="w-10 h-10 mx-auto opacity-20" />
                    <p className="text-sm">No data to visualize</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Candidate Detail Dialog */}
      <Dialog open={!!selectedCandidateId} onOpenChange={(open) => !open && setSelectedCandidateId(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (
            <CandidateDetailView candidate={selectedCandidate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CandidateDetailView({ candidate }: { candidate: any }) {
  const db = useFirestore();
  const workflowRef = useMemoFirebase(() => {
    if (!db || !candidate.id) return null;
    return doc(db, 'candidate_profiles', candidate.id, 'verification_workflows', 'main');
  }, [db, candidate.id]);

  const { data: workflow, isLoading } = useDoc(workflowRef);

  const workflowSteps = {
    extraction: (workflow?.agentDocumentExtractionStatus as AgentStep) || 'idle',
    comparison: (workflow?.agentDataComparisonStatus as AgentStep) || 'idle',
    fraud: (workflow?.agentFraudDetectionStatus as AgentStep) || 'idle',
    scoring: (workflow?.agentTrustScoreGenerationStatus as AgentStep) || 'idle',
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-4 mb-2">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={`https://picsum.photos/seed/${candidate.id}/200/200`} />
            <AvatarFallback>{candidate.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl font-bold">{candidate.fullName}</DialogTitle>
            <DialogDescription className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {candidate.email}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {candidate.role || 'Candidate'}</span>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-50 border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase text-slate-500">Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium">Trust Score</span>
                <span className="text-2xl font-extrabold text-primary">{candidate.trustScore || 0}%</span>
              </div>
              <Progress value={candidate.trustScore || 0} className="h-2 bg-slate-200" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium">Fraud Risk</span>
                <span className="text-2xl font-extrabold text-red-500">{candidate.fraudRiskScore || 0}%</span>
              </div>
              <Progress value={candidate.fraudRiskScore || 0} className="h-2 bg-slate-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase text-slate-500">System Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="flex justify-between text-xs">
               <span className="text-slate-500">Status</span>
               <Badge variant={candidate.profileStatus === 'verified' ? 'default' : 'secondary'}>{candidate.profileStatus}</Badge>
             </div>
             <div className="flex justify-between text-xs">
               <span className="text-slate-500">Registered</span>
               <span className="font-medium">{new Date(candidate.createdAt).toLocaleDateString()}</span>
             </div>
             <div className="flex justify-between text-xs">
               <span className="text-slate-500">Last Verified</span>
               <span className="font-medium">{workflow?.lastUpdatedAt ? new Date(workflow.lastUpdatedAt.toDate()).toLocaleDateString() : 'Never'}</span>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          AI Agent Workflow Status
        </h4>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center bg-slate-50 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <WorkflowStatus steps={workflowSteps} />
        )}
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <AlertTitle className="font-bold text-primary">Intelligence Summary</AlertTitle>
        <AlertDescription className="mt-2 text-slate-700 leading-relaxed text-sm">
          {workflow?.systemNotes?.[0] || "No AI analysis notes available for this candidate yet. Complete the verification workflow to generate insights."}
        </AlertDescription>
      </Alert>

      <DialogFooter>
        <Button variant="outline" className="w-full sm:w-auto">Contact Candidate</Button>
        <Button className="w-full sm:w-auto" variant={candidate.profileStatus === 'verified' ? 'destructive' : 'default'}>
          {candidate.profileStatus === 'verified' ? 'Flag Profile' : 'Approve Candidate'}
        </Button>
      </DialogFooter>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-xl bg-slate-50">{icon}</div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-full">{trend}</span>
        </div>
        <div>
          <h3 className="text-slate-500 text-sm font-semibold tracking-tight">{title}</h3>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
