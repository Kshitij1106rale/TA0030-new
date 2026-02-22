"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, FileText, CheckCircle2, Loader2, X } from 'lucide-react';

interface DocumentUploadProps {
  label: string;
  onUpload: (data: string) => void;
  isUploaded: boolean;
}

export function DocumentUpload({ label, onUpload, isUploaded }: DocumentUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setIsProcessing(false);
        // This will provide a real data URI (e.g., data:image/jpeg;base64,...) 
        // that Genkit can actually process.
        onUpload(reader.result as string);
      };
      
      reader.onerror = () => {
        setIsProcessing(false);
        console.error("Failed to read file");
      };
      
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className={`border-2 border-dashed transition-all ${isUploaded ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-primary/50'}`}>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${isUploaded ? 'bg-green-100' : 'bg-slate-100'}`}>
            {isUploaded ? <FileText className="w-6 h-6 text-green-600" /> : <FileUp className="w-6 h-6 text-slate-400" />}
          </div>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-slate-500">PDF, PNG, JPG (Max 5MB)</p>
          </div>
        </div>

        <div>
          {isProcessing ? (
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          ) : isUploaded ? (
            <div className="flex items-center gap-2">
               <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                 <CheckCircle2 className="w-4 h-4" /> Ready
               </span>
               <Button variant="ghost" size="icon" onClick={() => onUpload("")} title="Remove Document">
                 <X className="w-4 h-4" />
               </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <span className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-primary text-white hover:bg-primary/90 transition-colors">
                Choose File
              </span>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
