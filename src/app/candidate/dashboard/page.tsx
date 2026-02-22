
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/app/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUpload } from '@/components/candidate/DocumentUpload';
import { WorkflowStatus, AgentStep } from '@/components/agentic/WorkflowStatus';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Info, AlertTriangle, User, History } from 'lucide-react';
import { extractCandidateDocumentData } from '@/ai/flows/extract-candidate-document-data';
import { generateCandidateVerificationScores, CandidateVerificationOutput } from '@/ai/flows/generate-candidate-verification-scores';
import { cn } from '@/lib/utils';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState("");
  const [expLetterData, setExpLetterData] = useState("");
  const [workflowState, setWorkflowState] = useState({
    extraction: 'idle' as AgentStep,
    comparison: 'idle' as AgentStep,
    fraud: 'idle' as AgentStep,
    scoring: 'idle' as AgentStep,
  });
  const [results, setResults] = useState<CandidateVerificationOutput | null>(null);

  const startVerification = async () => {
    setWorkflowState(s => ({ ...s, extraction: 'processing' }));
    
    // Simulate flow logic
    setTimeout(() => {
      setWorkflowState(s => ({ ...s, extraction: 'completed', comparison: 'processing' }));
      
      setTimeout(() => {
        setWorkflowState(s => ({ ...s, comparison: 'completed', fraud: 'processing' }));
        
        setTimeout(() => {
          setWorkflowState(s => ({ ...s, fraud: 'completed', scoring: 'processing' }));
          
          setTimeout(() => {
             setWorkflowState(s => ({ ...s, scoring: 'completed' }));
             setResults({
               employmentGapsDetected: false,
               mismatchesDetected: false,
               fraudRiskScore: 5,
               trustScore: 92,
               analysisSummary: "Candidate John Doe has perfectly consistent data. All employment dates match experience letters. Low risk identified."
             });
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold">Candidate Portal</h1>
            <p className="text-slate-500">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-600">Verification Pending</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Uploads */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Step 1: Upload Documents
                </CardTitle>
                <CardDescription>Upload your documents for AI-driven background verification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DocumentUpload label="Resume (PDF)" onUpload={setResumeData} isUploaded={!!resumeData} />
                <DocumentUpload label="Experience Letter" onUpload={setExpLetterData} isUploaded={!!expLetterData} />
                <DocumentUpload label="ID Proof (Aadhar/Passport)" onUpload={() => {}} isUploaded={false} />
                
                <div className="pt-4">
                  <Button 
                    className="w-full bg-primary h-12 text-lg font-bold rounded-lg shadow-lg hover:shadow-primary/20 transition-all" 
                    disabled={!resumeData || !expLetterData || workflowState.scoring !== 'idle'}
                    onClick={startVerification}
                  >
                    Start Verification Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>

            <WorkflowStatus steps={workflowState} />

            {results && (
              <Alert variant={results.fraudRiskScore > 20 ? "destructive" : "default"} className="bg-white">
                <ShieldCheck className="w-5 h-5" />
                <AlertTitle className="font-bold">Intelligence Summary</AlertTitle>
                <AlertDescription className="mt-2 text-slate-600 leading-relaxed">
                  {results.analysisSummary}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right: Scores */}
          <div className="space-y-6">
            <Card className="bg-primary text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-white/80 text-sm font-medium uppercase tracking-wider">Overall Trust Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/20" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (results?.trustScore || 0)) / 100} className="text-secondary transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-extrabold">{results?.trustScore || 0}</span>
                    <span className="text-xs font-medium text-white/70">PROBABILITY</span>
                  </div>
                </div>
                <p className="mt-6 text-center text-sm text-white/80">
                  {results ? "Your score is high! You're 92% more trustworthy than average candidates." : "Complete verification to see your score."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Fraud Risk</span>
                    <span className="font-bold text-red-500">{results?.fraudRiskScore || 0}%</span>
                  </div>
                  <Progress value={results?.fraudRiskScore || 0} className="bg-slate-100 h-2" />
                </div>
                
                <div className="pt-2">
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-primary" />
                    Verification Log
                  </h4>
                  <div className="space-y-3">
                    <LogItem label="Identity Check" status="Completed" />
                    <LogItem label="Resume Parsing" status={workflowState.extraction === 'completed' ? "Completed" : "Pending"} />
                    <LogItem label="Experience Matching" status={workflowState.comparison === 'completed' ? "Completed" : "Pending"} />
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

function LogItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-600">{label}</span>
      <span className={cn("px-2 py-0.5 rounded-full font-medium", status === 'Completed' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
        {status}
      </span>
    </div>
  );
}
