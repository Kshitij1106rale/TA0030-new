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

const ExperienceSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  jobTitle: z.string().describe('The candidate\'s job title at the company.'),
  startDate: z.string().describe('The start date of employment in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date of employment in YYYY-MM-DD format, or "Present" if currently employed.'),
});

const ExtractCandidateDocumentDataInputSchema = z.object({
  resumePdfDataUri: z
    .string()
    .describe(
      "A candidate's resume document, as a data URI."
    ),
  experienceLetterPdfDataUri: z
    .string()
    .describe(
      "A candidate's experience letter document, as a data URI."
    ),
  idProofPdfDataUri: z
    .string()
    .optional()
    .describe("A candidate's ID proof document (e.g., Passport, Aadhar), as a data URI."),
});
export type ExtractCandidateDocumentDataInput = z.infer<typeof ExtractCandidateDocumentDataInputSchema>;

const ExtractCandidateDocumentDataOutputSchema = z.object({
  name: z.string().describe('The full name of the candidate found in the documents.'),
  resumeExperiences: z.array(ExperienceSchema).describe('Experiences extracted specifically from the resume.'),
  letterExperiences: z.array(ExperienceSchema).describe('Experiences extracted specifically from the experience letter.'),
  idProofInfo: z.string().describe('Key summary of information found on the ID proof (e.g., name, DOB).'),
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
  prompt: `You are an expert document analysis AI. Your task is to extract information from three sources: a Resume, an Experience Letter, and an ID Proof.

1. **Candidate Name**: Identify the candidate's full name across all documents.
2. **Resume Experiences**: Extract all work experiences listed on the Resume. Ensure dates are in YYYY-MM-DD format.
3. **Experience Letter Experiences**: Extract all work experiences mentioned in the Experience Letter. Ensure dates are in YYYY-MM-DD format.
4. **ID Proof Info**: Summarize the key identity details found on the ID proof (Name, Date of Birth, ID Number if visible).

Resume: {{media url=resumePdfDataUri}}
Experience Letter: {{media url=experienceLetterPdfDataUri}}
ID Proof: {{#if idProofPdfDataUri}}{{media url=idProofPdfDataUri}}{{else}}Not Provided{{/if}}`,
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
