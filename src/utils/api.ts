// src/utils/api.ts
import type { UserInput, BirthdayPlan, SmartInvitation, BudgetPriorities } from '../types';

// The path to your Netlify function
const FUNCTION_PATH = '/.netlify/functions/openai-proxy';

// Helper function for making POST requests to the Netlify function
async function callOpenAIProxy(action: string, data: Record<string, any>) {
    try {
        const response = await fetch(FUNCTION_PATH, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, ...data }), // Send action and data
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: `API error: ${response.status} ${response.statusText}` }));
            throw new Error(errorBody.error || `API error: ${response.status}`);
        }

        return await response.json(); // Return the parsed JSON data from the function

    } catch (error) {
        console.error(`Error calling proxy function for action "${action}":`, error);
        // Rethrow the error or handle it as needed for the UI
        if (error instanceof Error) {
             throw error;
        } else {
             throw new Error('An unexpected error occurred calling the API proxy.');
        }
    }
}

// --- Updated API Functions ---

export async function generateBirthdayPlans(userInput: UserInput): Promise<BirthdayPlan[]> {
    // The proxy function should return the { plans: [...] } structure or similar
    const responseData = await callOpenAIProxy('generatePlans', { userInput });
    // Adjust based on the actual structure returned by your function / OpenAI via response_format
    if (!responseData || !responseData.plans) {
         throw new Error("Invalid response structure from plan generation API");
    }
    return responseData.plans;
}

export async function generateSmartInvitation(
    plan: BirthdayPlan,
    template: 'classic' | 'playful' | 'themed' | 'minimalist',
    date: string,
    time: string
): Promise<SmartInvitation> {
    // Proxy function should return { text: "...", imageUrl: "...", template: "..." }
    const responseData = await callOpenAIProxy('generateInvitation', { plan, template, date, time });
    if (!responseData || typeof responseData.text !== 'string' || typeof responseData.imageUrl !== 'string') {
         throw new Error("Invalid response structure from invitation generation API");
    }
    // Ensure the returned object matches the SmartInvitation type
    return {
        text: responseData.text,
        imageUrl: responseData.imageUrl,
        template: responseData.template as SmartInvitation['template'], // Cast if necessary
    };
}

export async function optimizeBudget(plan: BirthdayPlan, priorities: BudgetPriorities): Promise<BirthdayPlan> {
    // Proxy function should return the { optimizedPlan: { ... } } structure or similar
    const responseData = await callOpenAIProxy('optimizeBudget', { plan, priorities });
     if (!responseData || !responseData.optimizedPlan) {
          throw new Error("Invalid response structure from budget optimization API");
     }
    return responseData.optimizedPlan;
}