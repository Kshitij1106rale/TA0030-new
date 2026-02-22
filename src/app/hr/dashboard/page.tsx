
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
  Filter, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Download,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const RISK_DATA = [
  { name: 'Identity Fraud', value: 12 },
  { name: 'Exp Mismatch', value: 45 },
  { name: 'Gap Discrepancy', value: 25 },
  { name: 'Degree Fake', value: 18 },
];

const COLORS = ['#4B0082', '#8F00FF', '#FF8042', '#FF0000'];

const CANDIDATES = [
  { name: "Alex Johnson", role: "Sr. Software Engineer", trustScore: 94, risk: "Low", status: "Verified", image: "https://picsum.photos/seed/p1/200/200" },
  { name: "Sarah Williams", role: "Product Manager", trustScore: 42, risk: "High", status: "Flagged", image: "https://picsum.photos/seed/p2/200/200" },
  { name: "Michael Chen", role: "UX Designer", trustScore: 88, risk: "Low", status: "Verified", image: "https://picsum.photos/seed/p3/200/200" },
  { name: "Emily Brown", role: "Marketing Lead", trustScore: 67, risk: "Medium", status: "Pending", image: "https://picsum.photos/seed/p4/200/200" },
  { name: "David Miller", role: "DevOps Engineer", trustScore: 91, risk: "Low", status: "Verified", image: "https://picsum.photos/seed/p5/200/200" },
];

export default function HRDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold">HR Intelligence Dashboard</h1>
            <p className="text-slate-500">Manage candidate verifications and hiring risks.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export Report
            </Button>
            <Button className="bg-primary gap-2">
              <Plus className="w-4 h-4" /> Add Candidate
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Candidates" value="1,284" icon={<Users className="w-5 h-5 text-blue-500" />} trend="+12% from last month" />
          <StatCard title="High Risk Flags" value="43" icon={<AlertTriangle className="w-5 h-5 text-red-500" />} trend="-4% this week" />
          <StatCard title="Verified This Week" value="156" icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} trend="+28% vs avg" />
          <StatCard title="Avg Trust Score" value="76.4" icon={<TrendingUp className="w-5 h-5 text-primary" />} trend="Consistent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Candidate List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-0">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search by name, role, or score..." 
                      className="pl-10" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="bg-slate-50"><List className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon"><LayoutGrid className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {CANDIDATES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((c, i) => (
                  <CandidateCard key={i} {...c} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Charts */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Distribution</CardTitle>
                <CardDescription>Major fraud categories detected this month.</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={RISK_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {RISK_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {RISK_DATA.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-slate-500 truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trust Score Trends</CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={RISK_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4B0082" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-slate-50 group-hover:scale-110 transition-transform">{icon}</div>
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{trend}</span>
        </div>
        <div>
          <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
