
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CandidateCard } from '@/components/hr/CandidateCard';
import { 
  Users, Search, TrendingUp, AlertTriangle, CheckCircle2, Download, Plus, ShieldAlert, Loader2, UserPlus, 
  ShieldCheck, Mail, Briefcase, History, Info, Filter, Settings, ListChecks, ArrowDownAZ, ArrowUpZA, Scale
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, where } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { WorkflowStatus, AgentStep } from '@/components/agentic/WorkflowStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = ['#4B0082', '#8F00FF', '#FF8042', '#FF0000'];

export default function HRDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ fullName: "", email: "", role: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Rules State
  const [minTrustScore, setMinTrustScore] = useState(80);
  const [maxRiskScore, setMaxRiskScore] = useState(20);

  // Sorting & Filtering State
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  
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

  // Compliance Audit Logs
  const auditLogsQuery = useMemoFirebase(() => {
    if (!db || !hrProfile) return null;
    return query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
  }, [db, hrProfile]);
  const { data: auditLogs, isLoading: isLogsLoading } = useCollection(auditLogsQuery);

  // Logic: Seed Initial Logs if empty
  useEffect(() => {
    if (!isLogsLoading && auditLogs && auditLogs.length === 0 && db && firebaseUser && hrProfile) {
      const initialLogs = [
        {
          hrProfileId: firebaseUser.uid,
          candidateId: 'sys-001',
          candidateName: 'System Intelligence',
          action: 'SYSTEM_INITIALIZED',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          notes: 'Trust Intelligence Framework successfully deployed to project.'
        },
        {
          hrProfileId: firebaseUser.uid,
          candidateId: 'sys-002',
          candidateName: 'Global Policy',
          action: 'RULE_SET',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          notes: 'Standard vetting threshold applied: Trust Score > 80, Risk < 20.'
        },
        {
          hrProfileId: firebaseUser.uid,
          candidateId: 'demo-001',
          candidateName: 'Alex Rivera',
          action: 'AUTO_SHORTLIST',
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          notes: 'Candidate automatically qualified for technical interview via AI assessment.'
        }
      ];

      initialLogs.forEach(log => {
        addDocumentNonBlocking(collection(db, 'audit_logs'), log);
      });
    }
  }, [auditLogs, isLogsLoading, db, firebaseUser, hrProfile]);

  // Logic: Auto-Shortlisting Rule Execution
  useEffect(() => {
    if (!candidates || !hrProfile || !db) return;
    candidates.forEach(c => {
      const isEligible = (c.trustScore || 0) >= minTrustScore && (c.fraudRiskScore || 0) <= maxRiskScore;
      if (isEligible && !c.isShortlisted && c.profileStatus === 'verified') {
        const profileRef = doc(db, 'candidate_profiles', c.id);
        updateDocumentNonBlocking(profileRef, { isShortlisted: true });
        
        // Log the auto-action
        addDocumentNonBlocking(collection(db, 'audit_logs'), {
          hrProfileId: firebaseUser?.uid,
          candidateId: c.id,
          candidateName: c.fullName,
          action: 'AUTO_SHORTLIST',
          timestamp: new Date().toISOString(),
          notes: `System auto-shortlisted based on rules: Trust > ${minTrustScore}, Risk < ${maxRiskScore}`
        });
      }
    });
  }, [candidates, minTrustScore, maxRiskScore, db, hrProfile, firebaseUser]);

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !firebaseUser || !hrProfile) return;
    setIsSubmitting(true);
    try {
      const candidatesCol = collection(db, 'candidate_profiles');
      const candidateRef = doc(candidatesCol);
      setDocumentNonBlocking(candidateRef, {
        id: candidateRef.id,
        fullName: newCandidate.fullName,
        email: newCandidate.email,
        role: newCandidate.role,
        profileStatus: 'pending_documents',
        trustScore: 0,
        fraudRiskScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      toast({ title: "Candidate Invited", description: `${newCandidate.fullName} has been added.` });
      setIsAddDialogOpen(false);
      setNewCandidate({ fullName: "", email: "", role: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const processedCandidates = useMemo(() => {
    let result = candidates ? [...candidates] : [];

    // Filter by search
    result = result.filter(c => 
      c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by risk
    if (riskFilter !== 'all') {
      result = result.filter(c => {
        const risk = (c.fraudRiskScore || 0) > 60 ? 'high' : (c.fraudRiskScore || 0) > 20 ? 'medium' : 'low';
        return risk === riskFilter;
      });
    }

    // Sort by trust score
    result.sort((a, b) => {
      const scoreA = a.trustScore || 0;
      const scoreB = b.trustScore || 0;
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });

    return result;
  }, [candidates, searchQuery, sortOrder, riskFilter]);

  if (!isAuthLoading && !isProfileLoading && !hrProfile && firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
           <div className="max-w-md mx-auto space-y-6">
             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
               <ShieldAlert className="w-10 h-10 text-red-600" />
             </div>
             <h2 className="text-2xl font-bold">Access Restricted</h2>
             <p className="text-slate-500">Your account does not have HR privileges.</p>
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
            <h1 className="font-headline text-3xl font-bold">HR Intelligence</h1>
            <p className="text-slate-500">Welcome back, {hrProfile?.fullName || 'Recruiter'}</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" /> Rules
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auto-Shortlisting Rules</DialogTitle>
                  <DialogDescription>Define criteria for automatic candidate shortlisting.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Minimum Trust Score: {minTrustScore}</Label>
                    <Input type="range" min="0" max="100" value={minTrustScore} onChange={(e) => setMinTrustScore(parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Risk Score: {maxRiskScore}</Label>
                    <Input type="range" min="0" max="100" value={maxRiskScore} onChange={(e) => setMaxRiskScore(parseInt(e.target.value))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsRuleDialogOpen(false)}>Save Rules</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <Plus className="w-4 h-4" /> Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite Candidate</DialogTitle></DialogHeader>
                <form onSubmit={handleAddCandidate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input required value={newCandidate.fullName} onChange={(e) => setNewCandidate({...newCandidate, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" required value={newCandidate.email} onChange={(e) => setNewCandidate({...newCandidate, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input required value={newCandidate.role} onChange={(e) => setNewCandidate({...newCandidate, role: e.target.value})} placeholder="e.g. Software Engineer" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>Send Invitation</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="candidates" className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-lg">
            <TabsTrigger value="candidates" className="gap-2"><Users className="w-4 h-4" /> Candidates</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><Scale className="w-4 h-4" /> Compliance Log</TabsTrigger>
          </TabsList>

          <TabsContent value="candidates" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Search candidates..." className="pl-10 bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}>
                  {sortOrder === 'desc' ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpZA className="w-4 h-4" />}
                </Button>
                <select className="h-10 px-3 bg-white border rounded-md text-sm outline-none" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                  <option value="all">All Risks</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-3">
                {isCandidatesLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
                ) : processedCandidates.length > 0 ? (
                  processedCandidates.map((c, i) => (
                    <div key={c.id} className="relative">
                      {i < 10 && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />}
                      <CandidateCard 
                        {...c}
                        name={c.fullName}
                        trustScore={c.trustScore || 0}
                        risk={(c.fraudRiskScore || 0) > 60 ? 'High' : (c.fraudRiskScore || 0) > 20 ? 'Medium' : 'Low'}
                        status={c.isShortlisted ? 'Verified' : c.profileStatus === 'verified' ? 'Verified' : 'Pending'}
                        image={`https://picsum.photos/seed/${c.id}/200/200`}
                        onClick={setSelectedCandidateId}
                      />
                      {c.isShortlisted && (
                        <Badge className="absolute top-2 right-12 bg-green-500 hover:bg-green-600 border-none text-[8px] h-4">ELIGIBLE</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white border rounded-xl">No candidates found</div>
                )}
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader><CardTitle className="text-lg">Risk Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{name: 'Low', value: candidates?.filter(c => (c.fraudRiskScore||0)<=20).length||0}, {name: 'Med', value: candidates?.filter(c => (c.fraudRiskScore||0)>20 && (c.fraudRiskScore||0)<=60).length||0}, {name: 'High', value: candidates?.filter(c => (c.fraudRiskScore||0)>60).length||0}]} innerRadius={60} outerRadius={80} dataKey="value">
                          {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Compliance Audit Log</CardTitle>
                <CardDescription>Tracing every decision made within the trust framework.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs?.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={cn("p-2 rounded-full", log.action === 'AUTO_SHORTLIST' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
                        <History className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-bold">{log.action}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Candidate: <span className="font-bold">{log.candidateName}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 italic mt-1">{log.notes}</p>
                      </div>
                    </div>
                  ))}
                  {(!auditLogs || auditLogs.length === 0) && (
                    <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                      <p>Initializing audit history...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedCandidateId} onOpenChange={(open) => !open && setSelectedCandidateId(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedCandidate && <CandidateDetailView candidate={selectedCandidate} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CandidateDetailView({ candidate }: { candidate: any }) {
  const db = useFirestore();
  const { user: hrUser } = useUser();
  const { toast } = useToast();
  
  const workflowRef = useMemoFirebase(() => {
    if (!db || !candidate.id) return null;
    return doc(db, 'candidate_profiles', candidate.id, 'verification_workflows', 'main');
  }, [db, candidate.id]);
  const { data: workflow } = useDoc(workflowRef);

  const handleAction = (status: string) => {
    if (!db || !hrUser) return;
    const profileRef = doc(db, 'candidate_profiles', candidate.id);
    updateDocumentNonBlocking(profileRef, { profileStatus: status, updatedAt: new Date().toISOString() });
    
    addDocumentNonBlocking(collection(db, 'audit_logs'), {
      hrProfileId: hrUser.uid,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      action: status.toUpperCase(),
      timestamp: new Date().toISOString(),
      notes: `Manual ${status} action by HR administrator.`
    });

    toast({ title: `Profile ${status}`, description: `${candidate.fullName} has been updated.` });
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={`https://picsum.photos/seed/${candidate.id}/200/200`} />
            <AvatarFallback>{candidate.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl font-bold">{candidate.fullName}</DialogTitle>
            <DialogDescription>{candidate.email} • {candidate.role}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-50 border-none shadow-none">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Score</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-black text-primary">{candidate.trustScore || 0}%</span>
              {candidate.isShortlisted && <Badge className="mb-2 bg-green-500 border-none h-4 text-[8px]">SHORTLISTED</Badge>}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-none shadow-none">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fraud Risk</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-black text-red-500">{candidate.fraudRiskScore || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Status</span>
          <Badge variant={candidate.profileStatus === 'verified' ? 'default' : 'secondary'}>{candidate.profileStatus}</Badge>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Registered</span>
          <span className="font-medium">{candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold flex items-center gap-2"><History className="w-4 h-4" /> Verification Status</h4>
        <WorkflowStatus steps={{
          extraction: (workflow?.agentDocumentExtractionStatus as AgentStep) || 'idle',
          comparison: (workflow?.agentDataComparisonStatus as AgentStep) || 'idle',
          fraud: (workflow?.agentFraudDetectionStatus as AgentStep) || 'idle',
          scoring: (workflow?.agentTrustScoreGenerationStatus as AgentStep) || 'idle',
        }} />
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold">Analysis Summary</AlertTitle>
        <AlertDescription className="text-xs italic">{workflow?.systemNotes?.[0] || "No notes yet."}</AlertDescription>
      </Alert>

      <DialogFooter className="gap-2">
        <Button variant="outline" className="flex-1" onClick={() => window.location.href=`mailto:${candidate.email}`}>Contact</Button>
        <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleAction('rejected')}>Reject</Button>
        <Button className="flex-1" onClick={() => handleAction('verified')}>Approve</Button>
      </DialogFooter>
    </div>
  );
}
