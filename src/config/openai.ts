import OpenAI from 'openai';
// Initialize the OpenAI client with your API key
const openai = new OpenAI({
apiKey: import.meta.env.VITE_OPENAI_API_KEY,
dangerouslyAllowBrowser: true // For client-side usage
});
export default openai;
