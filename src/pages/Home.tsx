import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserInputForm from '../components/UserInputForm'; // Ensure path is correct
// Removed unused 'GeneratePlansResponse' type import
import type { UserInput, BirthdayPlan } from '../types'; // Use BirthdayPlan type
import { generateBirthdayPlans } from '../utils/api'; // Import the API function

// Define the possible plan profiles for generation
type PlanProfile = 'DIY/Budget' | 'Premium/Convenience' | 'Unique/Adventure';
const PROFILES: PlanProfile[] = ['DIY/Budget', 'Premium/Convenience', 'Unique/Adventure'];


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

            // Create an array of promises for generating plans for each profile.
            // Each promise is wrapped to include its status ('fulfilled'/'rejected') and profile info,
            // making it easier to process after Promise.allSettled.
            const promises = PROFILES.map(profile =>
                generateBirthdayPlans(data, profile)
                    // Wrap the successful API response with status and profile
                    .then(response => ({ status: 'fulfilled' as const, value: response, profile }))
                    // Wrap any error with status and profile
                    .catch(error => ({ status: 'rejected' as const, reason: error, profile }))
            );

            // Execute all promises in parallel and wait for all to settle (either succeed or fail)
            const results = await Promise.allSettled(promises);

            console.log("Home: Received responses from parallel calls:", results);

            const finalPlans: BirthdayPlan[] = []; // Array to store successfully generated plans
            const errors: string[] = []; // Array to store error messages from failed calls

            // Process the results from each settled promise
            results.forEach((settledResult, index) => {
                // The 'profile' is available within the settledResult's value or reason,
                // as added in the .then()/.catch() wrappers above.

                if (settledResult.status === 'fulfilled') {
                    // Access the actual API response structure wrapped in our .then() value
                    // settledResult.value structure: { status: 'fulfilled', value: apiResponse, profile: profile }
                    const apiResponse = settledResult.value.value; // The actual response from generateBirthdayPlans
                    const profile = settledResult.value.profile; // The profile associated with this result

                    // Validate the structure of the successful API response
                    // Expecting { plans: [singlePlanObject] } based on backend logic
                    if (apiResponse && Array.isArray(apiResponse.plans) && apiResponse.plans.length === 1 && apiResponse.plans[0]) {
                        console.log(`Home: Successfully received and validated plan for profile: ${profile}`);
                        finalPlans.push(apiResponse.plans[0]); // Add the valid plan object
                    } else {
                        // Handle cases where the API returned success (200 OK) but the payload format was unexpected.
                        console.warn(`Home: Received unexpected structure from backend for profile ${profile}:`, apiResponse);
                        errors.push(`Received invalid plan structure for ${profile} profile.`);
                    }
                } else {
                    // Handle promises that were rejected (API call failed, network error, backend error)
                    // settledResult.reason structure: { status: 'rejected', reason: error, profile: profile }
                    const profile = settledResult.reason.profile; // Get profile from our wrapped error object
                    const reason = settledResult.reason.reason; // Get the actual error/reason
                    console.error(`Home: API call failed for profile ${profile}:`, reason);
                    const errorMessage = reason instanceof Error ? reason.message : 'Unknown error';
                    errors.push(`Failed to generate plan for ${profile} profile: ${errorMessage}`);
                }
            });

            // Check if any plans were successfully generated
            if (finalPlans.length === 0) {
                // If no plans were generated across all profiles, throw an error.
                throw new Error(`Failed to generate any plans. Errors: ${errors.join('; ')}`);
            }

            // Log warnings if some profiles failed but at least one succeeded
            if (errors.length > 0) {
                console.warn(`Home: Some plan profiles failed to generate. Errors: ${errors.join('; ')}`);
                // Optionally, display these non-critical errors to the user later.
            }

            // Sort the successfully generated plans based on the predefined profile order for consistency
            finalPlans.sort((a, b) => {
                const profileOrder: Record<PlanProfile, number> = { 'DIY/Budget': 1, 'Premium/Convenience': 2, 'Unique/Adventure': 3 };
                // Ensure profile exists on plan object and use 'as' for type assertion if necessary
                // Provide a default order (e.g., 4) for safety in case of unexpected profile values
                return (profileOrder[a.profile as PlanProfile] || 4) - (profileOrder[b.profile as PlanProfile] || 4);
            });

            // Store the final plans and original user input in localStorage for the results page
            localStorage.setItem('generatedPlans', JSON.stringify(finalPlans));
            localStorage.setItem('userInput', JSON.stringify(data)); // Save input for potential reuse/display
            console.log(`Home: ${finalPlans.length} plan(s) generated and saved to localStorage.`);

            // Navigate to the results page
            navigate('/results');

        } catch (err) {
            // Catch any overall errors during the process (e.g., the error thrown if no plans were generated)
            console.error('Home: Overall error generating plans:', err);
            setError(`Failed to generate plans. ${err instanceof Error ? err.message : 'Please try again.'}`);
            // Clear potentially incomplete localStorage data on error
            localStorage.removeItem('generatedPlans');
            localStorage.removeItem('userInput');
        } finally {
            // Ensure loading state is turned off regardless of success or failure
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

