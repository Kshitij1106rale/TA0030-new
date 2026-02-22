
"use client";

import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Shield, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              <Button variant="outline" size="sm" onClick={logout} className="gap-2">
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
          <Link href="/#features" className="text-sm font-medium">Features</Link>
          <Link href="/#how-it-works" className="text-sm font-medium">How it Works</Link>
          <hr />
          {user ? (
            <>
              <Link href={user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} className="text-sm font-medium">Dashboard</Link>
              <button onClick={logout} className="text-sm font-medium text-left">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium">Login</Link>
              <Link href="/auth/register" className="text-sm font-medium">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
