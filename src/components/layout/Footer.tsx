
import { Shield } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-headline text-lg font-bold tracking-tight text-white">VeriHire AI</span>
            </Link>
            <p className="text-sm">Building a Trust Intelligence Layer for the Future of Hiring.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="text-sm space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">Candidate Verification</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Risk Assessment</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Agentic Workflows</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">HR Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="text-sm space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Connect</h4>
            <ul className="text-sm space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">Twitter</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">LinkedIn</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">GitHub</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs">
          <p>© {new Date().getFullYear()} VeriHire AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
