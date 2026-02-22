'use server';
/**
 * @fileOverview A Genkit flow for extracting key information from candidate documents.
 *
 * - extractCandidateDocumentData - A function that handles the extraction of candidate data from documents.
 * - ExtractCandidateDocumentDataInput - The input type for the extractCandidateDocumentData function.
 * - ExtractCandidateDocumentDataOutput - The return type for the extractCandidateDocumentData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractCandidateDocumentDataInputSchema = z.object({
  resumePdfDataUri: z
    .string()
    .describe(
      "A candidate's resume document (e.g., PDF, image), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  experienceLetterPdfDataUri: z
    .string()
    .describe(
      "A candidate's experience letter document (e.g., PDF, image), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractCandidateDocumentDataInput = z.infer<typeof ExtractCandidateDocumentDataInputSchema>;

const ExtractCandidateDocumentDataOutputSchema = z.object({
  name: z.string().describe('The full name of the candidate.'),
  experiences: z
    .array(
      z.object({
        companyName: z.string().describe('The name of the company.'),
        jobTitle: z.string().describe('The candidate\u0027s job title at the company.'),
        startDate: z.string().describe('The start date of employment in YYYY-MM format.'),
        endDate: z.string().describe('The end date of employment in YYYY-MM format, or "Present" if currently employed.'),
      })
    )
    .describe('A list of employment experiences extracted from the documents.'),
});
export type ExtractCandidateDocumentDataOutput = z.infer<typeof ExtractCandidateDocumentDataOutputSchema>;

export async function extractCandidateDocumentData(
  input: ExtractCandidateDocumentDataInput
): Promise<ExtractCandidateDocumentDataOutput> {
  return extractCandidateDocumentDataFlow(input);
}

const extractCandidateDocumentDataPrompt = ai.definePrompt({
  name: 'extractCandidateDocumentDataPrompt',
  input: {schema: ExtractCandidateDocumentDataInputSchema},
  output: {schema: ExtractCandidateDocumentDataOutputSchema},
  prompt: `You are an expert document analysis AI. Your task is to accurately extract key information from a candidate's resume and experience letter.\n\nCarefully review both documents provided.\n\nFrom the Resume and Experience Letter, extract the following information:\n1.  **Candidate's Full Name**: Identify the candidate's full name.\n2.  **Employment Experiences**: For each distinct employment period, identify the company name, the job title, the start date, and the end date. If the candidate is currently employed at a company, set the end date as "Present". Dates should be in YYYY-MM format.\n\nCombine information from both documents, prioritizing consistency. If there's a discrepancy, use your best judgment to determine the most accurate information.\n\nOutput the extracted data in a structured JSON format matching the provided schema.\n\nResume: {{media url=resumePdfDataUri}}\nExperience Letter: {{media url=experienceLetterPdfDataUri}}`,
});

const extractCandidateDocumentDataFlow = ai.defineFlow(
  {
    name: 'extractCandidateDocumentDataFlow',
    inputSchema: ExtractCandidateDocumentDataInputSchema,
    outputSchema: ExtractCandidateDocumentDataOutputSchema,
  },
  async input => {
    const {output} = await extractCandidateDocumentDataPrompt(input);
    return output!;
  }
);
