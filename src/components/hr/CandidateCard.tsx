"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  id: string;
  name: string;
  role: string;
  trustScore: number;
  risk: 'Low' | 'Medium' | 'High';
  status: 'Verified' | 'Flagged' | 'Pending' | 'Rejected';
  image: string;
  onClick?: (id: string) => void;
}

export function CandidateCard({ id, name, role, trustScore, risk, status, image, onClick }: CandidateCardProps) {
  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer group border-slate-200"
      onClick={() => onClick?.(id)}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-slate-100">
            <AvatarImage src={image} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{name}</h4>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Trust Score</span>
            <span className={cn(
              "text-lg font-extrabold",
              trustScore > 80 ? "text-green-600" : trustScore > 50 ? "text-amber-500" : "text-red-500"
            )}>{trustScore}</span>
          </div>

          <div className="hidden md:flex flex-col items-start min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
            <Badge 
              variant={status === 'Verified' ? 'default' : status === 'Rejected' ? 'destructive' : status === 'Flagged' ? 'destructive' : 'secondary'} 
              className={cn(
                "mt-1 h-5 text-[10px] uppercase",
                status === 'Rejected' && "bg-red-600 hover:bg-red-700"
              )}
            >
              {status}
            </Badge>
          </div>

          <Button variant="ghost" size="icon" className="group-hover:bg-slate-100">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
