import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserInputForm from '../components/UserInputForm'; // Ensure path is correct
// Import necessary types
import type { UserInput, BirthdayPlan } from '../types';
// Import the API function for generating plans
import { generateBirthdayPlans } from '../utils/api';

// Define the possible plan profiles for generation
type PlanProfile = 'DIY/Budget' | 'Premium/Convenience' | 'Unique/Adventure';
const PROFILES: PlanProfile[] = ['DIY/Budget', 'Premium/Convenience', 'Unique/Adventure'];

// Define the expected structure of the API response from generateBirthdayPlans
// (Used for type assertion later)
type GeneratePlansApiResponse = {
    plans: BirthdayPlan[];
};


/**
 * Home Page Component
 * Displays the main user input form to gather preferences for birthday plan generation.
 * Handles form submission, parallel API calls for different profiles, and navigation to results.
 */
export default function Home() {
    const [isLoading, setIsLoading] = useState(false); // State for loading indicator
    const [error, setError] = useState<string | null>(null); // State for displaying errors
    const navigate = useNavigate(); // Hook for programmatic navigation

    /**
     * Handles the submission of the user input form.
     * Initiates parallel API calls for each defined plan profile.
     * Processes the results, stores successful plans, and navigates to the results page.
     * @param data - The validated user input data from the form.
     */
    const handleSubmit = async (data: UserInput) => {
        setIsLoading(true); // Show loading state
        setError(null); // Clear previous errors
        console.log("Home: Submitting user input (Full Object):", JSON.stringify(data, null, 2));

        try {
            console.log("Home: Initiating parallel API calls for 3 profiles...");

            // Define the structure expected within the PromiseSettledResult's 'value' or 'reason'
            // This is based on the wrappers added in .then() and .catch() below
            type PromiseResultWrapper =
                | { status: 'fulfilled'; value: GeneratePlansApiResponse; profile: PlanProfile }
                | { status: 'rejected'; reason: any; profile: PlanProfile };

            // Create an array of promises for generating plans for each profile.
            const promises = PROFILES.map(profile =>
                generateBirthdayPlans(data, profile)
                    // Wrap the successful API response
                    .then(response => ({ status: 'fulfilled' as const, value: response, profile }))
                    // Wrap any error
                    .catch(error => ({ status: 'rejected' as const, reason: error, profile }))
            );

            // Execute all promises in parallel and wait for all to settle
            // The result type is PromiseSettledResult<PromiseResultWrapper>[]
            const results = await Promise.allSettled<PromiseResultWrapper>(promises);

            console.log("Home: Received responses from parallel calls:", results);

            const finalPlans: BirthdayPlan[] = []; // Array to store successfully generated plans
            const errors: string[] = []; // Array to store error messages from failed calls

            // Process the results from each settled promise
            // Replace unused 'index' with '_'
            results.forEach((settledResult, _) => {

                if (settledResult.status === 'fulfilled') {
                    // Explicitly assert the type of settledResult.value based on the wrapper structure
                    // This resolves the TS2339 error by telling TS the exact shape inside the 'fulfilled' case.
                    const resultWrapper = settledResult.value as { status: 'fulfilled'; value: GeneratePlansApiResponse; profile: PlanProfile };
                    const apiResponse = resultWrapper.value; // Access the inner value (the actual API response)
                    const profile = resultWrapper.profile; // Access the profile

                    // Validate the structure of the successful API response
                    if (apiResponse && Array.isArray(apiResponse.plans) && apiResponse.plans.length === 1 && apiResponse.plans[0]) {
                        console.log(`Home: Successfully received and validated plan for profile: ${profile}`);
                        finalPlans.push(apiResponse.plans[0]); // Add the valid plan object
                    } else {
                        // Handle cases where the API returned success but the payload format was unexpected.
                        console.warn(`Home: Received unexpected structure from backend for profile ${profile}:`, apiResponse);
                        errors.push(`Received invalid plan structure for ${profile} profile.`);
                    }
                } else {
                    // Handle promises that were rejected
                    // Assert the type of settledResult.reason based on the wrapper structure
                    const reasonWrapper = settledResult.reason as { status: 'rejected'; reason: any; profile: PlanProfile };
                    const profile = reasonWrapper.profile; // Get profile from our wrapped error object
                    const reason = reasonWrapper.reason; // Get the actual error/reason
                    console.error(`Home: API call failed for profile ${profile}:`, reason);
                    const errorMessage = reason instanceof Error ? reason.message : 'Unknown error';
                    errors.push(`Failed to generate plan for ${profile} profile: ${errorMessage}`);
                }
            });

            // Check if any plans were successfully generated
            if (finalPlans.length === 0) {
                throw new Error(`Failed to generate any plans. Errors: ${errors.join('; ')}`);
            }

            // Log warnings if some profiles failed but at least one succeeded
            if (errors.length > 0) {
                console.warn(`Home: Some plan profiles failed to generate. Errors: ${errors.join('; ')}`);
            }

            // Sort the successfully generated plans based on the predefined profile order
            finalPlans.sort((a, b) => {
                const profileOrder: Record<PlanProfile, number> = { 'DIY/Budget': 1, 'Premium/Convenience': 2, 'Unique/Adventure': 3 };
                // Use 'as PlanProfile' for type safety and provide a default order
                return (profileOrder[a.profile as PlanProfile] || 4) - (profileOrder[b.profile as PlanProfile] || 4);
            });

            // Store the final plans and original user input in localStorage
            localStorage.setItem('generatedPlans', JSON.stringify(finalPlans));
            localStorage.setItem('userInput', JSON.stringify(data));
            console.log(`Home: ${finalPlans.length} plan(s) generated and saved to localStorage.`);

            // Navigate to the results page
            navigate('/results');

        } catch (err) {
            // Catch any overall errors during the process
            console.error('Home: Overall error generating plans:', err);
            setError(`Failed to generate plans. ${err instanceof Error ? err.message : 'Please try again.'}`);
            // Clear potentially incomplete localStorage data on error
            localStorage.removeItem('generatedPlans');
            localStorage.removeItem('userInput');
        } finally {
            // Ensure loading state is turned off
            setIsLoading(false);
        }
    };

    // --- Render Component UI ---
    return (
        // Main container with gradient background
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Page Header */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 tracking-tight sm:text-5xl">
                        AI Birthday Planner
                    </h1>
                    <p className="mt-3 text-xl text-gray-600">
                        Let's create the perfect celebration!
                    </p>
                </header>

                {/* User Input Form Component */}
                <UserInputForm onSubmit={handleSubmit} isLoading={isLoading} />

                {/* Error Display Area */}
                {error && (
                    <div className="mt-8 max-w-2xl mx-auto p-4 bg-red-100 text-red-700 border border-red-300 rounded-md shadow text-center text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

