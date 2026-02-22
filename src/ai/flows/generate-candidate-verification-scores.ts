'use server';
/**
 * @fileOverview A Genkit flow for generating candidate verification scores.
 *
 * - generateCandidateVerificationScores - A function that processes extracted candidate data to calculate fraud risk and trust scores.
 * - CandidateVerificationInput - The input type for the generateCandidateVerificationScores function.
 * - CandidateVerificationOutput - The return type for the generateCandidateVerificationScores function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const EmploymentPeriodSchema = z.object({
  company: z.string().describe('The name of the company.'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date in YYYY-MM-DD format.'),
  endDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal('Present')
  ]).describe('End date in YYYY-MM-DD format, or "Present" if currently employed.'),
});

const CandidateVerificationInputSchema = z.object({
  candidateName: z.string().describe('The full name of the candidate.'),
  extractedResumeEmploymentPeriods: z.array(EmploymentPeriodSchema).describe('Employment history extracted from the candidate\'s resume.'),
  extractedExperienceLetterEmploymentPeriods: z.array(EmploymentPeriodSchema).describe('Employment history extracted from experience letters.'),
  extractedIdProofData: z.string().describe('Key data extracted from the candidate\'s ID proof (e.g., name, birth date).'),
  extractedCertificateData: z.string().describe('Summary of key data extracted from professional certificates.'),
});
export type CandidateVerificationInput = z.infer<typeof CandidateVerificationInputSchema>;

// Output Schema
const CandidateVerificationOutputSchema = z.object({
  employmentGapsDetected: z.boolean().describe('True if significant employment gaps are detected between employment periods.'),
  mismatchesDetected: z.boolean().describe('True if there are discrepancies between resume and experience letter data (e.g., dates, companies).'),
  fraudRiskScore: z.number().min(0).max(100).describe('A score from 0 to 100 representing the likelihood of fraudulent information, where 100 is high risk.'),
  trustScore: z.number().min(0).max(100).describe('A score from 0 to 100 representing the overall credibility of the candidate, where 100 is highly trustworthy.'),
  analysisSummary: z.string().describe('A detailed summary of the findings, including identified gaps, mismatches, and reasoning behind the scores.'),
});
export type CandidateVerificationOutput = z.infer<typeof CandidateVerificationOutputSchema>;

// Wrapper function
export async function generateCandidateVerificationScores(input: CandidateVerificationInput): Promise<CandidateVerificationOutput> {
  return generateCandidateVerificationScoresFlow(input);
}

// Prompt Definition
const verificationPrompt = ai.definePrompt({
  name: 'candidateVerificationPrompt',
  input: { schema: CandidateVerificationInputSchema },
  output: { schema: CandidateVerificationOutputSchema },
  prompt: `You are an intelligent "Hiring Intelligence System" agent specializing in background verification.\nYour task is to analyze the provided candidate data, detect discrepancies, employment gaps, calculate risk, and provide trust scores.\n\n--- Candidate Data ---\nCandidate Name: {{{candidateName}}}\n\n--- Extracted Resume Employment Periods ---\n{{#if extractedResumeEmploymentPeriods}}\n{{#each extractedResumeEmploymentPeriods}}\n- Company: {{{company}}}, Start Date: {{{startDate}}}, End Date: {{{endDate}}}\n{{/each}}\n{{else}}\nNo resume employment periods provided.\n{{/if}}\n\n--- Extracted Experience Letter Employment Periods ---\n{{#if extractedExperienceLetterEmploymentPeriods}}\n{{#each extractedExperienceLetterEmploymentPeriods}}\n- Company: {{{company}}}, Start Date: {{{startDate}}}, End Date: {{{endDate}}}\n{{/each}}\n{{else}}\nNo experience letter employment periods provided.\n{{/if}}\n\n--- Extracted ID Proof Data ---\n{{{extractedIdProofData}}}\n\n--- Extracted Certificate Data ---\n{{{extractedCertificateData}}}\n\n--- Instructions ---\nAnalyze the provided data thoroughly.\n1. Compare the 'extractedResumeEmploymentPeriods' with 'extractedExperienceLetterEmploymentPeriods'. Note any mismatches in company names, start dates, or end dates.\n2. Identify any significant employment gaps (periods of unemployment between roles) based on the combined employment history.\n3. Based on the findings, determine 'mismatchesDetected' and 'employmentGapsDetected'.\n4. Calculate a 'fraudRiskScore' from 0 (no risk) to 100 (very high risk). Mismatches and unexplained gaps should increase this score.\n5. Calculate a 'trustScore' from 0 (very low trust) to 100 (very high trust). This score should inversely correlate with the fraud risk and reflect overall credibility.\n6. Provide a comprehensive 'analysisSummary' explaining all detections, calculations, and the reasoning behind the scores.\n\nEnsure the output adheres strictly to the provided JSON schema.`,
});

// Flow Definition
const generateCandidateVerificationScoresFlow = ai.defineFlow(
  {
    name: 'generateCandidateVerificationScoresFlow',
    inputSchema: CandidateVerificationInputSchema,
    outputSchema: CandidateVerificationOutputSchema,
  },
  async (input) => {
    const {output} = await verificationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate verification scores.');
    }
    return output;
  }
);
