
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, UserCheck, Search, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bg');
  const howItWorksImage = PlaceHolderImages.find(img => img.id === 'how-it-works');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            < Zap className="w-4 h-4" />
            <span>Next-Gen Background Verification</span>
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-900">
            Building a <span className="text-primary">Trust Intelligence</span> Layer for the Future of Hiring.
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            VeriHire AI automates document verification, detects fraud, and generates comprehensive trust scores using agentic AI workflows.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white font-semibold rounded-full">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-300">
              Request a Demo
            </Button>
          </div>
        </div>

        {/* Floating elements visualization */}
        <div className="mt-20 relative max-w-5xl mx-auto px-4">
          <div className="glass-morphism rounded-2xl overflow-hidden p-2 shadow-2xl">
             <Image 
               src={heroImage?.imageUrl || "https://picsum.photos/seed/tech1/1200/800"} 
               alt="Dashboard Preview" 
               width={1200}
               height={800}
               className="rounded-xl"
               data-ai-hint={heroImage?.imageHint || "dashboard tech"}
             />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">AI-Powered Verification Features</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Our system replaces manual background checks with intelligent, automated analysis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search className="w-8 h-8 text-primary" />}
              title="Automated OCR Extraction"
              description="Automatically extract names, dates, and experiences from resumes and letters with high precision."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-secondary" />}
              title="Fraud Risk Analysis"
              description="Detect discrepancies between resume claims and official documentation instantly."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="Agentic Workflows"
              description="Four specialized AI agents work in sync to validate, compare, and score candidates."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-secondary" />}
              title="HR Analytics Dashboard"
              description="Visualize hiring risks and verification statuses with intuitive, real-time analytics."
            />
            <FeatureCard 
              icon={<UserCheck className="w-8 h-8 text-primary" />}
              title="Trust Scoring System"
              description="Comprehensive 0-100 scores to help you make data-backed hiring decisions."
            />
            <FeatureCard 
              icon={<CheckCircle2 className="w-8 h-8 text-secondary" />}
              title="Gap Detection"
              description="Identify unexplained employment gaps and career anomalies automatically."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6">How VeriHire AI Works</h2>
              <div className="space-y-8">
                <Step 
                  number="01" 
                  title="Candidate Uploads Documents" 
                  description="Resume, ID proofs, and experience letters are uploaded via a secure portal."
                />
                <Step 
                  number="02" 
                  title="AI Extraction Agent" 
                  description="Our OCR agents process the files and convert them into structured employment data."
                />
                <Step 
                  number="03" 
                  title="Discrepancy Engine" 
                  description="Cross-references documents to find mismatches in dates, titles, or company names."
                />
                <Step 
                  number="04" 
                  title="Final Intelligence Report" 
                  description="HR receives a full risk profile with fraud scores and approval recommendations."
                />
              </div>
            </div>
            <div className="relative">
              <div className="bg-primary rounded-3xl p-1 shadow-2xl overflow-hidden">
                 <Image 
                    src={howItWorksImage?.imageUrl || "https://picsum.photos/seed/recruit/600/800"} 
                    alt="Workflow Illustration" 
                    width={600} 
                    height={800}
                    className="rounded-3xl hover:scale-105 transition-transform duration-500"
                    data-ai-hint={howItWorksImage?.imageHint || "job hiring"}
                  />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all bg-white group">
      <div className="mb-4 p-3 rounded-lg bg-slate-50 group-hover:bg-primary/5 w-fit transition-colors">{icon}</div>
      <h3 className="font-headline text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold font-headline">{number}</div>
      <div>
        <h4 className="font-bold text-lg mb-1">{title}</h4>
        <p className="text-slate-600 text-sm">{description}</p>
      </div>
    </div>
  );
}
