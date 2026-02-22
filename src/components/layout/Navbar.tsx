
"use client";

import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Shield, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export function Navbar() {
  const { user, logout } = useAuth();
  const firebaseAuth = useFirebaseAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Clear Firebase session
      await signOut(firebaseAuth);
      // Clear local Zustand-like store
      logout();
      // Redirect to login page
      router.push('/auth/login');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
      // Fallback: clear local state and redirect anyway
      logout();
      router.push('/auth/login');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary animate-pulse-slow" />
          <span className="font-headline text-xl font-bold tracking-tight text-primary">VeriHire AI</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
          <Link href="/#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How it Works</Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link href={user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4">
          <Link href="/#features" className="text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
          <Link href="/#how-it-works" className="text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>How it Works</Link>
          <hr />
          {user ? (
            <>
              <Link 
                href={user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} 
                className="text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="text-sm font-medium text-left flex items-center gap-2 text-slate-600 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link href="/auth/register" className="text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
