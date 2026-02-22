
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CandidateCard } from '@/components/hr/CandidateCard';
import { 
  Users, Search, TrendingUp, AlertTriangle, CheckCircle2, Download, Plus, ShieldAlert, Loader2, UserPlus, 
  ShieldCheck, Mail, Briefcase, History, Info, Filter, Settings, ListChecks, ArrowDownAZ, ArrowUpZA, Scale, Clock
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
import { cn } from '@/lib/utils';

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

  // Logic: Seed Initial Data if empty
  useEffect(() => {
    if (!isCandidatesLoading && candidates && candidates.length === 0 && db && hrProfile) {
      const mockCandidates = [
        {
          id: 'seed-001',
          fullName: 'Arjun Sharma',
          email: 'arjun.sharma@example.in',
          role: 'Senior Software Engineer',
          profileStatus: 'verified',
          trustScore: 94,
          fraudRiskScore: 4,
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          updatedAt: new Date().toISOString(),
          isShortlisted: true
        },
        {
          id: 'seed-002',
          fullName: 'Priya Patel',
          email: 'priya.patel@example.in',
          role: 'Product Manager',
          profileStatus: 'verified',
          trustScore: 68,
          fraudRiskScore: 32,
          createdAt: new Date(Date.now() - 518400000).toISOString(),
          updatedAt: new Date().toISOString(),
          isShortlisted: false
        },
        {
          id: 'seed-003',
          fullName: 'Rahul Varma',
          email: 'rahul.varma@example.in',
          role: 'Backend Developer',
          profileStatus: 'verified',
          trustScore: 35,
          fraudRiskScore: 78,
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          updatedAt: new Date().toISOString(),
          isShortlisted: false
        },
        {
          id: 'seed-004',
          fullName: 'Ananya Iyer',
          email: 'ananya.iyer@example.in',
          role: 'UX Designer',
          profileStatus: 'verified',
          trustScore: 89,
          fraudRiskScore: 12,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          updatedAt: new Date().toISOString(),
          isShortlisted: true
        },
        {
          id: 'seed-005',
          fullName: 'Vikram Singh',
          email: 'vikram.singh@example.in',
          role: 'Data Scientist',
          profileStatus: 'verified',
          trustScore: 55,
          fraudRiskScore: 45,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date().toISOString(),
          isShortlisted: false
        },
        {
          id: 'seed-006',
          fullName: 'Sunita Rao',
          email: 'sunita.rao@example.in',
          role: 'HR Specialist',
          profileStatus: 'verified',
          trustScore: 92,
          fraudRiskScore: 8,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date().toISOString(),
          isShortlisted: true
        },
        {
          id: 'seed-007',
          fullName: 'Amit Gupta',
          email: 'amit.gupta@example.in',
          role: 'Frontend Engineer',
          profileStatus: 'verified',
          trustScore: 22,
          fraudRiskScore: 88,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          isShortlisted: false
        }
      ];

      mockCandidates.forEach(candidate => {
        const ref = doc(db, 'candidate_profiles', candidate.id);
        setDocumentNonBlocking(ref, candidate, { merge: true });
        
        // Add a workflow for each
        const workflowRef = doc(db, 'candidate_profiles', candidate.id, 'verification_workflows', 'main');
        setDocumentNonBlocking(workflowRef, {
          id: 'main',
          candidateProfileId: candidate.id,
          overallStatus: 'completed',
          agentDocumentExtractionStatus: 'completed',
          agentDataComparisonStatus: 'completed',
          agentFraudDetectionStatus: 'completed',
          agentTrustScoreGenerationStatus: 'completed',
          lastUpdatedAt: serverTimestamp(),
          systemNotes: [`Automated verification completed for ${candidate.fullName}. Risk profile categorized as ${candidate.fraudRiskScore > 60 ? 'High' : candidate.fraudRiskScore > 20 ? 'Medium' : 'Low'}.`]
        }, { merge: true });
      });
    }
  }, [candidates, isCandidatesLoading, db, hrProfile]);

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

  const handleSaveRules = () => {
    if (!db || !firebaseUser) return;
    setIsRuleDialogOpen(false);
    
    // Explicitly log the rule change
    addDocumentNonBlocking(collection(db, 'audit_logs'), {
      hrProfileId: firebaseUser.uid,
      candidateId: 'sys-rule',
      candidateName: 'Global Policy',
      action: 'RULE_SET',
      timestamp: new Date().toISOString(),
      notes: `Standard vetting threshold manually updated: Trust Score > ${minTrustScore}, Risk < ${maxRiskScore}.`
    });
    
    toast({
      title: "Rules Updated",
      description: `Threshold set to Trust > ${minTrustScore} and Risk < ${maxRiskScore}%`,
    });
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !firebaseUser || !hrProfile) return;
    setIsSubmitting(true);
    try {
      const candidatesCol = collection(db, 'candidate_profiles');
      const candidateRef = doc(candidatesCol);
      const timestamp = new Date().toISOString();
      
      setDocumentNonBlocking(candidateRef, {
        id: candidateRef.id,
        fullName: newCandidate.fullName,
        email: newCandidate.email,
        role: newCandidate.role,
        profileStatus: 'pending_documents',
        trustScore: 0,
        fraudRiskScore: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });

      // Log the invitation
      addDocumentNonBlocking(collection(db, 'audit_logs'), {
        hrProfileId: firebaseUser.uid,
        candidateId: candidateRef.id,
        candidateName: newCandidate.fullName,
        action: 'INVITATION_SENT',
        timestamp: timestamp,
        notes: `Manual candidate invitation sent for position: ${newCandidate.role}`
      });

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
            <h1 className="font-headline text-3xl font-bold text-primary">HR Intelligence Dashboard</h1>
            <p className="text-slate-500">Welcome back, {hrProfile?.fullName || 'Recruiter'}</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
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
                    <Label className="flex justify-between">
                      Minimum Trust Score <span>{minTrustScore}%</span>
                    </Label>
                    <Input type="range" min="0" max="100" value={minTrustScore} onChange={(e) => setMinTrustScore(parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex justify-between">
                      Maximum Fraud Risk <span>{maxRiskScore}%</span>
                    </Label>
                    <Input type="range" min="0" max="100" value={maxRiskScore} onChange={(e) => setMaxRiskScore(parseInt(e.target.value))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveRules}>Save & Apply Rules</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2 shadow-md">
                  <Plus className="w-4 h-4" /> Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite New Candidate</DialogTitle></DialogHeader>
                <form onSubmit={handleAddCandidate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input required value={newCandidate.fullName} onChange={(e) => setNewCandidate({...newCandidate, fullName: e.target.value})} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" required value={newCandidate.email} onChange={(e) => setNewCandidate({...newCandidate, email: e.target.value})} placeholder="jane@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Position / Role</Label>
                    <Input required value={newCandidate.role} onChange={(e) => setNewCandidate({...newCandidate, role: e.target.value})} placeholder="e.g. Senior Backend Engineer" />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Send Invitation"}
                  </Button>
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
                <Input placeholder="Search by name or email..." className="pl-10 bg-white shadow-sm border-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')} title="Sort by Trust Score">
                  {sortOrder === 'desc' ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpZA className="w-4 h-4" />}
                </Button>
                <select className="h-10 px-3 bg-white border border-slate-200 rounded-md text-sm outline-none shadow-sm" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk Only</option>
                  <option value="medium">Medium Risk Only</option>
                  <option value="high">High Risk Only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-3">
                {isCandidatesLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : processedCandidates.length > 0 ? (
                  processedCandidates.map((c, i) => (
                    <div key={c.id} className="relative">
                      {i < 3 && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-full shadow-lg" />}
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
                  <div className="text-center py-20 bg-white border rounded-xl border-dashed">No candidates match your criteria</div>
                )}
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader><CardTitle className="text-lg">Risk Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{name: 'Low', value: candidates?.filter(c => (c.fraudRiskScore||0)<=20).length||0}, {name: 'Med', value: candidates?.filter(c => (c.fraudRiskScore||0)>20 && (c.fraudRiskScore||0)<=60).length||0}, {name: 'High', value: candidates?.filter(c => (c.fraudRiskScore||0)>60).length||0}]} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                          {COLORS.map((c, i) => <Cell key={i} fill={c} stroke="none" />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Real-time Insights</CardTitle>
                    <CardDescription>Breakdown by category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#4B0082]" />
                        <span className="text-slate-600">Low Risk Candidates</span>
                      </div>
                      <span className="font-bold">{candidates?.filter(c => (c.fraudRiskScore||0)<=20).length||0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8F00FF]" />
                        <span className="text-slate-600">Medium Risk Candidates</span>
                      </div>
                      <span className="font-bold">{candidates?.filter(c => (c.fraudRiskScore||0)>20 && (c.fraudRiskScore||0)<=60).length||0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#FF8042]" />
                        <span className="text-slate-600">High Risk Candidates</span>
                      </div>
                      <span className="font-bold">{candidates?.filter(c => (c.fraudRiskScore||0)>60).length||0}</span>
                    </div>
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
                    <div key={log.id} className="flex items-start gap-4 p-4 border rounded-xl hover:bg-slate-50 transition-all group">
                      <div className={cn("p-2.5 rounded-full shadow-sm transition-transform group-hover:scale-110", log.action === 'AUTO_SHORTLIST' ? "bg-green-100 text-green-600" : log.action === 'REJECTED' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600")}>
                        {log.action === 'RULE_SET' ? <Settings className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{log.action}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Candidate / Policy: <span className="font-bold text-primary">{log.candidateName}</span>
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              year: 'numeric', month: 'numeric', day: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 bg-white/50 p-2 rounded-md mt-2 border border-slate-100 italic">
                          {log.notes}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!auditLogs || auditLogs.length === 0) && (
                    <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
                      <p className="text-sm font-medium">Synchronizing compliance history...</p>
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
    
    // Update the status
    updateDocumentNonBlocking(profileRef, { 
      profileStatus: status, 
      updatedAt: new Date().toISOString(),
      isShortlisted: status === 'verified' // Auto-shortlist on manual verification if approved
    });
    
    // Create audit log entry
    addDocumentNonBlocking(collection(db, 'audit_logs'), {
      hrProfileId: hrUser.uid,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      action: status.toUpperCase(),
      timestamp: new Date().toISOString(),
      notes: `Manual administrative decision: Candidate status updated to ${status}.`
    });

    toast({ 
      title: `Profile ${status === 'verified' ? 'Approved' : 'Rejected'}`, 
      description: `Action completed for ${candidate.fullName}.` 
    });
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-primary/10 shadow-sm">
            <AvatarImage src={`https://picsum.photos/seed/${candidate.id}/200/200`} />
            <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">{candidate.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl font-black text-slate-900">{candidate.fullName}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] font-bold uppercase">{candidate.role}</Badge>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs">{candidate.email}</span>
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-none shadow-none ring-1 ring-primary/10">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Trust Index</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-black text-primary">{candidate.trustScore || 0}%</span>
              {candidate.isShortlisted && <Badge className="mb-2 bg-green-500 border-none h-4 text-[8px] font-black">ELITE</Badge>}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-none shadow-none ring-1 ring-red-100">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Fraud Risk</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-black text-red-600">{candidate.fraudRiskScore || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800"><Scale className="w-4 h-4 text-primary" /> Analysis Insights</h4>
        <Alert className="bg-primary/5 border-primary/20 rounded-xl">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-bold text-xs uppercase tracking-wider">AI Intelligence Summary</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-slate-700 mt-2 font-medium italic">
            "{workflow?.systemNotes?.[0] || "No intelligence report available for this profile yet."}"
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800"><History className="w-4 h-4 text-primary" /> Verification Pipeline</h4>
        <WorkflowStatus steps={{
          extraction: (workflow?.agentDocumentExtractionStatus as AgentStep) || 'idle',
          comparison: (workflow?.agentDataComparisonStatus as AgentStep) || 'idle',
          fraud: (workflow?.agentFraudDetectionStatus as AgentStep) || 'idle',
          scoring: (workflow?.agentTrustScoreGenerationStatus as AgentStep) || 'idle',
        }} />
      </div>

      <DialogFooter className="gap-3 pt-4 border-t">
        <Button variant="outline" className="flex-1 font-bold h-11" onClick={() => window.location.href=`mailto:${candidate.email}`}>
          <Mail className="w-4 h-4 mr-2" /> Contact
        </Button>
        <Button className="flex-1 bg-red-600 hover:bg-red-700 font-bold h-11 shadow-lg shadow-red-200" onClick={() => handleAction('rejected')}>
          Reject Profile
        </Button>
        <Button className="flex-1 bg-primary hover:bg-primary/90 font-bold h-11 shadow-lg shadow-primary/20" onClick={() => handleAction('verified')}>
          <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
        </Button>
      </DialogFooter>
    </div>
  );
}
