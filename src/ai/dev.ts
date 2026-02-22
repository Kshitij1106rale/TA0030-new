import { config } from 'dotenv';
config();

import '@/ai/flows/extract-candidate-document-data.ts';
import '@/ai/flows/generate-candidate-verification-scores.ts';