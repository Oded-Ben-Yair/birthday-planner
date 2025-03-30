import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserInputForm from '../components/UserInputForm'; // Ensure path is correct
import type { UserInput, GeneratePlansResponse, BirthdayPlan } from '../types'; // Use BirthdayPlan type
import { generateBirthdayPlans } from '../utils/api'; // Import the updated API function

// Define the possible plan profiles
type PlanProfile = 'DIY/Budget' | 'Premium/Convenience' | 'Unique/Adventure';
const PROFILES: PlanProfile[] = ['DIY/Budget', 'Premium/Convenience', 'Unique/Adventure'];


/**
 * Home page component containing the user input form for generating plans.
 */
export default function Home() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	/**
	 * Handles form submission.
	 * Makes 3 parallel API calls to generate plans for different profiles.
	 * Combines successful results and saves to localStorage before navigating.
	 * @param data - The user input data.
	 */
	const handleSubmit = async (data: UserInput) => {
		setIsLoading(true);
		setError(null);
		console.log("Home: Submitting user input (Full Object):", JSON.stringify(data, null, 2));

		try {
			console.log("Home: Initiating parallel API calls for 3 profiles...");

			// Create an array of promises, one for each profile
            // Wrap the result/error with profile info for easier processing after Promise.allSettled
			const promises = PROFILES.map(profile =>
				generateBirthdayPlans(data, profile)
					.then(response => ({ status: 'fulfilled' as const, value: response, profile })) // Wrap success response
					.catch(error => ({ status: 'rejected' as const, reason: error, profile })) // Wrap error
			);

			// Use Promise.allSettled to wait for all promises
			const results = await Promise.allSettled(promises);

			console.log("Home: Received responses from parallel calls:", results);

			const finalPlans: BirthdayPlan[] = [];
			const errors: string[] = [];

			// Process results from Promise.allSettled
			results.forEach((settledResult, index) => {
                // Note: The 'profile' is available directly on settledResult.value or settledResult.reason
                // because we added it in the .then()/.catch() above.
                // The result from Promise.allSettled itself also has status and value/reason.

				if (settledResult.status === 'fulfilled') {
                    // Access the actual API response wrapped in our .then()
                    const apiResponse = settledResult.value.value; // Access the 'value' from our wrapper
                    const profile = settledResult.value.profile; // Access the 'profile' from our wrapper

					// Check if the API response structure is valid and contains the plan
                    // The backend returns { plans: [singlePlan] }
					if (apiResponse && Array.isArray(apiResponse.plans) && apiResponse.plans.length === 1 && apiResponse.plans[0]) {
						console.log(`Home: Successfully received and validated plan for profile: ${profile}`);
						finalPlans.push(apiResponse.plans[0]); // Add the single plan object
					} else {
                        // This case means the backend returned 200 but the structure was wrong (shouldn't happen with validation)
						console.warn(`Home: Received unexpected structure from backend for profile ${profile}:`, apiResponse);
						errors.push(`Received invalid plan structure for ${profile} profile.`);
					}
				} else {
					// Handle rejected promises (API call failed or backend threw error)
                    const profile = PROFILES[index]; // Get profile based on original order
					console.error(`Home: API call failed for profile ${profile}:`, settledResult.reason);
                    const errorMessage = settledResult.reason instanceof Error ? settledResult.reason.message : 'Unknown error';
					errors.push(`Failed to generate plan for ${profile} profile: ${errorMessage}`);
				}
			});

			// Check if we got at least one plan
			if (finalPlans.length === 0) {
				throw new Error(`Failed to generate any plans. Errors: ${errors.join('; ')}`);
			}

            if (errors.length > 0) {
                 console.warn(`Home: Some plan profiles failed to generate. Errors: ${errors.join('; ')}`);
            }

			// Sort plans to maintain consistent order
			finalPlans.sort((a, b) => {
				const profileOrder: Record<PlanProfile, number> = { 'DIY/Budget': 1, 'Premium/Convenience': 2, 'Unique/Adventure': 3 };
                // Use 'as PlanProfile' for type safety if needed, ensure profile exists
				return (profileOrder[a.profile as PlanProfile] || 4) - (profileOrder[b.profile as PlanProfile] || 4);
			});

			// Save the successfully generated plans
			localStorage.setItem('generatedPlans', JSON.stringify(finalPlans));
			localStorage.setItem('userInput', JSON.stringify(data));
			console.log(`Home: ${finalPlans.length} plan(s) generated and saved to localStorage.`);

			navigate('/results');

		} catch (err) {
			console.error('Home: Overall error generating plans:', err);
			setError(`Failed to generate plans. ${err instanceof Error ? err.message : 'Please try again.'}`);
			localStorage.removeItem('generatedPlans');
			localStorage.removeItem('userInput');
		} finally {
			setIsLoading(false);
		}
	};

	// --- Render Component UI ---
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<header className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-800 tracking-tight sm:text-5xl">
						AI Birthday Planner
					</h1>
					<p className="mt-3 text-xl text-gray-600">
						Let's create the perfect celebration!
					</p>
				</header>

				<UserInputForm onSubmit={handleSubmit} isLoading={isLoading} />

				{error && (
					<div className="mt-8 max-w-2xl mx-auto p-4 bg-red-100 text-red-700 border border-red-300 rounded-md shadow text-center text-sm">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}

