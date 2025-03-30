    // src/utils/api.ts
    import type {
        UserInput,
        BirthdayPlan,
        BudgetPriorities,
        GeneratePlansPayload,
        GeneratePlansResponse,
        GenerateInvitationPayload,
        SmartInvitation,
        OptimizeBudgetPayload,
        OptimizeBudgetResponse
    } from '../types'; // Import all necessary types

    // Define the base URL for the Netlify functions
    // In development (using netlify dev), this path works.
    // In production, it also points to the functions deployed with the site.
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

            // Check if the response status code indicates success (e.g., 2xx)
            if (!response.ok) {
                // Attempt to parse error response from the function, otherwise use status text
                let errorBody;
                try {
                    errorBody = await response.json();
                } catch (e) {
                    // Ignore parsing error if response body isn't JSON
                }
                const errorMessage = errorBody?.error || response.statusText || `HTTP error! Status: ${response.status}`;
                console.error(`Proxy function call failed with status ${response.status}:`, errorMessage, errorBody);
                throw new Error(errorMessage); // Throw error to be caught by calling function
            }

            // Parse the successful JSON response
            const responseData = await response.json();
            console.log('Received response from proxy:', responseData); // Log successful response
            return responseData as T;

        } catch (error) {
            // Handle network errors or errors thrown from the !response.ok check
            console.error('Error calling proxy function:', error);
            // Re-throw the error so the calling component can handle it (e.g., show message to user)
            throw error;
        }
    }

    /**
     * Calls the backend to generate birthday plans based on user input.
     * @param userInput - The user's input data conforming to the UserInput type.
     * @returns A promise that resolves to the GeneratePlansResponse containing an array of plans.
     */
    export async function generateBirthdayPlans(userInput: UserInput): Promise<GeneratePlansResponse> {
        const payload: GeneratePlansPayload = {
            action: 'generatePlans',
            userInput: userInput,
        };
        // Type assertion helps ensure the correct response structure is expected
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
     * @param numericBudget - The user's target budget amount (number). <--- NEW PARAMETER
     * @param currency - The currency code (string, e.g., "NIS"). <--- NEW PARAMETER
     * @returns A promise that resolves to the OptimizeBudgetResponse containing the optimized plan.
     */
    export async function optimizeBudget(
        selectedPlan: BirthdayPlan,
        priorities: BudgetPriorities,
        numericBudget: number, // Added parameter
        currency: string       // Added parameter
    ): Promise<OptimizeBudgetResponse> {
        // Construct the payload including the new budget details
        const payload: OptimizeBudgetPayload = {
            action: 'optimizeBudget',
            plan: selectedPlan,
            priorities: priorities,
            numericBudget: numericBudget, // Include numeric budget
            currency: currency          // Include currency
        };
        // Type assertion helps ensure the correct response structure is expected
        return callOpenAIProxy<OptimizeBudgetResponse>(payload);
    }

    
