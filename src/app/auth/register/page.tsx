"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/app/lib/auth-store';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User as UserIcon, Mail, Lock, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('candidate');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const firebaseAuth = useFirebaseAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      
      // Update Auth Profile
      await updateProfile(user, { displayName: name });
      
      const timestamp = new Date().toISOString();
      const profileData = {
        id: user.uid,
        email,
        fullName: name,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Crucial: Await Firestore document creation to ensure rules can see the profile immediately
      if (role === 'hr') {
        await setDoc(doc(db, 'hr_profiles', user.uid), {
          ...profileData,
          companyName: "VeriHire Partners",
          department: "Talent Acquisition",
        });
      } else {
        await setDoc(doc(db, 'candidate_profiles', user.uid), {
          ...profileData,
          profileStatus: 'pending_documents',
          trustScore: 0,
          fraudRiskScore: 0,
        });
      }

      // Sync local auth store
      login(name, email, role);
      
      toast({
        title: "Account Created",
        description: `Welcome to VeriHire AI, ${name}! Your ${role === 'hr' ? 'recruiter' : 'candidate'} profile is ready.`,
      });
      
      // Navigate to dashboard
      router.push(role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl font-bold">Create an Account</CardTitle>
            <CardDescription>Join the trust intelligence network today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Register as</Label>
                <Tabs defaultValue="candidate" onValueChange={(v) => setRole(v as UserRole)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="candidate">Candidate</TabsTrigger>
                    <TabsTrigger value="hr">HR Recruiter</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="name" 
                    placeholder="Jane Doe" 
                    className="pl-10" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="jane@example.com" 
                    className="pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-primary font-bold" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center">
            <div className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                Login here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}