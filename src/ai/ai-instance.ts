
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;
const plugins = [];
let configuredModel: string | undefined = undefined;

if (googleApiKey) {
  console.log("INFO: GOOGLE_GENAI_API_KEY is set. Initializing Google AI plugin.");
  plugins.push(googleAI({ apiKey: googleApiKey }));
  configuredModel = 'googleai/gemini-2.0-flash';
} else {
  console.warn("WARN: GOOGLE_GENAI_API_KEY environment variable is not set. Genkit Google AI plugin will NOT be initialized. AI features requiring this plugin may fail or be unavailable.");
  // If no API key, flows attempting to use a googleai model will fail at runtime.
  // It's important that genkit() is still called and 'ai' is exported.
}

export const ai = genkit({
  plugins: plugins,
  model: configuredModel, // Set model conditionally, will be undefined if API key is missing
  // promptDir: './prompts', // Removed as the directory does not seem to exist and might cause init errors.
  logLevel: 'info', // Set to 'debug' for more verbose Genkit logging if needed.
  enableTracing: true, // Useful for debugging flows.
});

// This ensures 'ai' is always exported as a Genkit instance.
// Subsequent errors due to missing plugins/models will occur at runtime within flows,
// rather than causing module load failures.
