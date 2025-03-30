// src/utils/api.ts
import type {
    UserInput,
    BirthdayPlan,
    BudgetPriorities,
    // GeneratePlansPayload, // We'll handle payload type inline or adjust if needed
    GeneratePlansResponse,
    GenerateInvitationPayload,
    SmartInvitation,
    OptimizeBudgetPayload,
    OptimizeBudgetResponse
} from '../types'; // Import all necessary types

// Define the base URL for the Netlify functions
const FUNCTIONS_BASE_URL = '/.netlify/functions/openai-proxy';

/**
 * Reusable function to call the backend Netlify function proxy.
 * Handles the fetch request, JSON stringification, and basic error handling.
 * @param payload - The data payload to send (must include an 'action' field).
 * @returns The parsed JSON response from the function.
 * @throws Throws an error if the network request fails or the function returns an error status.
 */
async function callOpenAIProxy<T>(payload: object): Promise<T> {
    console.log('Calling proxy with payload:', payload); // Log outgoing payload

    try {
        const response = await fetch(FUNCTIONS_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload), // Send payload as JSON string
        });

        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            } catch (e) {
                // Ignore parsing error
            }
            const errorMessage = errorBody?.error || response.statusText || `HTTP error! Status: ${response.status}`;
            console.error(`Proxy function call failed with status ${response.status}:`, errorMessage, errorBody);
            // Construct a more informative error message if possible
            throw new Error(errorMessage);
        }

        const responseData = await response.json();
        console.log('Received response from proxy:', responseData); // Log successful response
        return responseData as T;

    } catch (error) {
        console.error('Error calling proxy function:', error);
        // Re-throw the error for the calling component
        throw error;
    }
}

/**
 * Calls the backend to generate ONE birthday plan based on user input and a specific profile.
 * @param userInput - The user's input data conforming to the UserInput type.
 * @param profile - The specific plan profile to request ('DIY/Budget', 'Premium/Convenience', 'Unique/Adventure').
 * @returns A promise that resolves to the GeneratePlansResponse containing ONE plan in the array.
 */
export async function generateBirthdayPlans(
    userInput: UserInput,
    profile: 'DIY/Budget' | 'Premium/Convenience' | 'Unique/Adventure' // Add profile parameter
): Promise<GeneratePlansResponse> {
    // Define payload structure inline, including the optional profile
    const payload: {
        action: 'generatePlans';
        userInput: UserInput;
        profile: string; // Send the requested profile
    } = {
        action: 'generatePlans',
        userInput: userInput,
        profile: profile, // Include the profile in the payload
    };
    // Type assertion helps ensure the correct response structure is expected
    // The backend should now return { plans: [ singlePlan ] }
    return callOpenAIProxy<GeneratePlansResponse>(payload);
}

/**
 * Calls the backend to generate smart invitation components (text and image).
 * @param plan - The selected BirthdayPlan object.
 * @param template - The chosen invitation template style.
 * @param date - The event date string.
 * @param time - The event time string.
 * @returns A promise that resolves to the SmartInvitation object.
 */
export async function generateSmartInvitation(
    plan: BirthdayPlan,
    template: GenerateInvitationPayload['template'], // Use type from payload
    date: string,
    time: string
): Promise<SmartInvitation> {
    const payload: GenerateInvitationPayload = {
        action: 'generateInvitation',
        plan,
        template,
        date,
        time,
    };
    return callOpenAIProxy<SmartInvitation>(payload);
}

/**
 * Calls the backend to optimize a birthday plan based on budget priorities and target budget.
 * @param selectedPlan - The current BirthdayPlan object to optimize.
 * @param priorities - The user-defined BudgetPriorities object.
 * @param numericBudget - The user's target budget amount (number).
 * @param currency - The currency code (string, e.g., "NIS").
 * @returns A promise that resolves to the OptimizeBudgetResponse containing the optimized plan.
 */
export async function optimizeBudget(
    selectedPlan: BirthdayPlan,
    priorities: BudgetPriorities,
    numericBudget: number,
    currency: string
): Promise<OptimizeBudgetResponse> {
    const payload: OptimizeBudgetPayload = {
        action: 'optimizeBudget',
        plan: selectedPlan,
        priorities: priorities,
        numericBudget: numericBudget,
        currency: currency
    };
    return callOpenAIProxy<OptimizeBudgetResponse>(payload);
}

