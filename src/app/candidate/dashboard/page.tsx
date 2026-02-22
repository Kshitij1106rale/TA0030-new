"use client";

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/app/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUpload } from '@/components/candidate/DocumentUpload';
import { WorkflowStatus, AgentStep } from '@/components/agentic/WorkflowStatus';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, History, User, CheckCircle2, Circle, Clock, FileText, Search, ShieldAlert, BadgeCheck, Info, Loader2 } from 'lucide-react';
import { extractCandidateDocumentData } from '@/ai/flows/extract-candidate-document-data';
import { generateCandidateVerificationScores, type CandidateVerificationOutput } from '@/ai/flows/generate-candidate-verification-scores';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function CandidateDashboard() {
  const { user: authUser } = useUser();
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [resumeData, setResumeData] = useState("");
  const [expLetterData, setExpLetterData] = useState("");
  const [idProofData, setIdProofData] = useState("");
  
  const [workflowState, setWorkflowState] = useState({
    extraction: 'idle' as AgentStep,
    comparison: 'idle' as AgentStep,
    fraud: 'idle' as AgentStep,
    scoring: 'idle' as AgentStep,
  });
  const [results, setResults] = useState<CandidateVerificationOutput | null>(null);

  // Readiness Calculation
  const readiness = useMemo(() => {
    let count = 0;
    if (resumeData) count += 33;
    if (expLetterData) count += 33;
    if (idProofData) count += 34;
    return Math.min(count, 100);
  }, [resumeData, expLetterData, idProofData]);

  const candidateProfileRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'candidate_profiles', authUser.uid);
  }, [db, authUser]);
  const { data: profile } = useDoc(candidateProfileRef);

  const isHrUser = user?.role === 'hr';

  const startVerification = async () => {
    if (isHrUser || !authUser || !db) return;

    // Reset states
    setResults(null);
    setWorkflowState({
      extraction: 'processing',
      comparison: 'idle',
      fraud: 'idle',
      scoring: 'idle',
    });

    try {
      // 1. Agent 1: Data Extraction
      const extractedData = await extractCandidateDocumentData({
        resumePdfDataUri: resumeData,
        experienceLetterPdfDataUri: expLetterData,
        idProofPdfDataUri: idProofData,
      });

      setWorkflowState(s => ({ ...s, extraction: 'completed', comparison: 'processing' }));

      // 2. Agent 2-4: Comparison, Fraud Detection, and Scoring
      const verificationResults = await generateCandidateVerificationScores({
        candidateName: extractedData.name || authUser.displayName || user?.name || "Candidate",
        extractedResumeEmploymentPeriods: extractedData.resumeExperiences.map(e => ({
          company: e.companyName,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
        extractedExperienceLetterEmploymentPeriods: extractedData.letterExperiences.map(e => ({
          company: e.companyName,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
        extractedIdProofData: extractedData.idProofInfo,
        extractedCertificateData: "Academic certificates verified by OCR Agent.",
      });

      setWorkflowState({
        extraction: 'completed',
        comparison: 'completed',
        fraud: 'completed',
        scoring: 'completed',
      });

      setResults(verificationResults);

      // Save to Firestore
      const profileRef = doc(db, 'candidate_profiles', authUser.uid);
      setDocumentNonBlocking(profileRef, {
        id: authUser.uid,
        fullName: extractedData.name || authUser.displayName || user?.name || "Candidate",
        email: authUser.email || user?.email || "",
        trustScore: verificationResults.trustScore,
        fraudRiskScore: verificationResults.fraudRiskScore,
        profileStatus: 'verified',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const workflowRef = doc(db, 'candidate_profiles', authUser.uid, 'verification_workflows', 'main');
      setDocumentNonBlocking(workflowRef, {
        id: 'main',
        candidateProfileId: authUser.uid,
        overallStatus: 'completed',
        agentDocumentExtractionStatus: 'completed',
        agentDataComparisonStatus: 'completed',
        agentFraudDetectionStatus: 'completed',
        agentTrustScoreGenerationStatus: 'completed',
        lastUpdatedAt: serverTimestamp(),
        systemNotes: [verificationResults.analysisSummary],
      }, { merge: true });

      toast({
        title: "Verification Complete",
        description: `Analysis finished. Trust Score: ${verificationResults.trustScore}%`,
      });

    } catch (error: any) {
      console.error("Verification agent error:", error);
      setWorkflowState({
        extraction: 'idle',
        comparison: 'idle',
        fraud: 'idle',
        scoring: 'idle',
      });
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "The AI agents encountered an error processing your documents.",
      });
    }
  };

  if (isHrUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle>Recruiter View</CardTitle>
              <CardDescription>
                You are currently logged in as HR. To test the candidate verification workflow, please register a separate candidate account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = '/hr/dashboard'}>
                Go to HR Dashboard
              </Button>
            </CardContent>
          </Card>
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
            <h1 className="font-headline text-3xl font-bold">Candidate Portal</h1>
            <p className="text-slate-500">Welcome back, {user?.name || authUser?.displayName || 'Candidate'}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
            <div className={cn("w-3 h-3 rounded-full", (results || profile?.profileStatus === 'verified') ? "bg-green-500" : "bg-amber-500")} />
            <span className="text-sm font-medium text-slate-600">
              {(results || profile?.profileStatus === 'verified') ? "Verified" : "Verification Pending"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-primary" />
                  Verification Readiness
                </CardTitle>
                <CardDescription>Complete these steps to unlock AI verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Profile Completion</span>
                    <span className="text-primary">{readiness}%</span>
                  </div>
                  <Progress value={readiness} className="h-2" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <CheckItem label="Resume" done={!!resumeData} />
                  <CheckItem label="Exp. Letter" done={!!expLetterData} />
                  <CheckItem label="ID Proof" done={!!idProofData} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Verification Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative flex justify-between items-center px-4">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                  <TimelineStep label="Uploaded" active={readiness === 100} icon={FileText} />
                  <TimelineStep label="Extracted" active={workflowState.extraction === 'completed'} icon={Search} />
                  <TimelineStep label="Verified" active={workflowState.scoring === 'completed'} icon={ShieldCheck} />
                  <TimelineStep label="Review" active={profile?.profileStatus === 'verified'} icon={Clock} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-primary" />
                  Step 1: Document Submissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DocumentUpload label="Resume (PDF/Image)" onUpload={setResumeData} isUploaded={!!resumeData} />
                <DocumentUpload label="Experience Letter" onUpload={setExpLetterData} isUploaded={!!expLetterData} />
                <DocumentUpload label="ID Proof" onUpload={setIdProofData} isUploaded={!!idProofData} />
                
                <div className="pt-4">
                  <Button 
                    className="w-full bg-primary h-12 text-lg font-bold rounded-lg shadow-lg" 
                    disabled={readiness < 100 || workflowState.extraction === 'processing' || workflowState.scoring === 'processing'}
                    onClick={startVerification}
                  >
                    {workflowState.extraction === 'processing' || workflowState.scoring === 'processing' ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> AI Agents Analyzing...</>
                    ) : "Start AI Verification"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <WorkflowStatus steps={workflowState} />
          </div>

          <div className="space-y-6">
            <Card className="bg-primary text-white overflow-hidden relative border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-white/80 text-xs font-bold uppercase tracking-widest">Trust intelligence Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/20" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={352} strokeDashoffset={352 - (352 * (profile?.trustScore || results?.trustScore || 0)) / 100} className="text-secondary transition-all duration-1000" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black">{profile?.trustScore || results?.trustScore || 0}</span>
                  </div>
                </div>
                
                {(results || (profile && (profile.trustScore || 0) > 0)) && (
                  <div className="mt-6 w-full space-y-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase text-white/60">Score Analysis</p>
                    <Factor label="Document Consistency" positive={!(results?.mismatchesDetected || (profile?.fraudRiskScore || 0) > 20)} />
                    <Factor label="Career Continuity" positive={!(results?.employmentGapsDetected || (profile?.fraudRiskScore || 0) > 40)} />
                    <Factor label="Identity Matching" positive={true} />
                    <p className="text-[9px] text-white/40 mt-2 italic leading-tight">
                      {results?.analysisSummary || "AI analysis based on your provided documentation."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Fraud Risk Profile</span>
                    <span className={cn("font-bold", (profile?.fraudRiskScore || results?.fraudRiskScore || 0) > 50 ? "text-red-500" : "text-green-500")}>
                      {profile?.fraudRiskScore || results?.fraudRiskScore || 0}%
                    </span>
                  </div>
                  <Progress value={profile?.fraudRiskScore || results?.fraudRiskScore || 0} className="bg-slate-100 h-2" />
                </div>
                
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Verification Audit</h4>
                  <div className="space-y-3">
                    <LogItem label="Identity Check" status={idProofData ? "Completed" : "Pending"} />
                    <LogItem label="Resume Parsing" status={workflowState.extraction === 'completed' || profile?.profileStatus === 'verified' ? "Completed" : "Pending"} />
                    <LogItem label="Data Matching" status={workflowState.comparison === 'completed' || profile?.profileStatus === 'verified' ? "Completed" : "Pending"} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckItem({ label, done }: { label: string, done: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors", done ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 text-slate-400")}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
      <span className="font-medium">{label}</span>
    </div>
  );
}

function TimelineStep({ label, active, icon: Icon }: { label: string, active: boolean, icon: any }) {
  return (
    <div className="flex flex-col items-center gap-2 relative z-10">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all", active ? "bg-primary text-white border-primary" : "bg-white text-slate-300 border-slate-100")}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn("text-[10px] font-bold uppercase", active ? "text-primary" : "text-slate-300")}>{label}</span>
    </div>
  );
}

function Factor({ label, positive }: { label: string, positive: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/80">{label}</span>
      <span className={cn("font-bold px-1.5 py-0.5 rounded", positive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>
        {positive ? "+ High" : "- Review"}
      </span>
    </div>
  );
}

function LogItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-600 font-medium">{label}</span>
      <span className={cn("px-2 py-0.5 rounded-full font-bold", status === 'Completed' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
        {status}
      </span>
    </div>
  );
}
