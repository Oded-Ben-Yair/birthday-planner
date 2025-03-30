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
			const promises = PROFILES.map(profile =>
				generateBirthdayPlans(data, profile) // Call API util with userInput and profile
					.then(response => ({ status: 'fulfilled', value: response, profile })) // Wrap success
					.catch(error => ({ status: 'rejected', reason: error, profile })) // Wrap failure
			);

            // Use Promise.allSettled to wait for all promises, regardless of success/failure
            // Note: Changed from Promise.allSettled back to individual try/catch within map if needed,
            // but Promise.allSettled is generally cleaner if API function handles throws correctly.
            // Let's stick with Promise.allSettled for now.
			const results = await Promise.allSettled(promises); // This waits for all calls

			console.log("Home: Received responses from parallel calls:", results);

			const finalPlans: BirthdayPlan[] = [];
			const errors: string[] = [];

			// Process results
			results.forEach((result, index) => {
				const profile = PROFILES[index]; // Get corresponding profile
				if (result.status === 'fulfilled') {
					// Check if the response structure is valid and contains the plan
                    // The backend now returns { plans: [singlePlan] }
					if (result.value && Array.isArray(result.value.plans) && result.value.plans.length === 1 && result.value.plans[0]) {
						console.log(`Home: Successfully received plan for profile: ${profile}`);
						finalPlans.push(result.value.plans[0]); // Add the single plan object
					} else {
						console.warn(`Home: Received invalid response structure for profile ${profile}:`, result.value);
						errors.push(`Failed to generate plan for ${profile} profile (invalid structure).`);
					}
				} else {
					// Handle rejected promises (API call failed)
					console.error(`Home: API call failed for profile ${profile}:`, result.reason);
                    // Extract a user-friendly message if possible
                    const errorMessage = result.reason instanceof Error ? result.reason.message : 'Unknown error';
					errors.push(`Failed to generate plan for ${profile} profile: ${errorMessage}`);
				}
			});

			// Check if we got at least one plan
			if (finalPlans.length === 0) {
				// If all calls failed, throw a consolidated error
				throw new Error(`Failed to generate any plans. Errors: ${errors.join('; ')}`);
			}

            // Log a warning if some plans failed but not all
            if (errors.length > 0) {
                 console.warn(`Home: Some plan profiles failed to generate. Errors: ${errors.join('; ')}`);
                 // Optionally set a non-critical error message for the user
                 // setError(`Could not generate all plan types, but here are the successful ones. Issues: ${errors.join('; ')}`);
            }

			// Sort plans to maintain consistent order (optional, but good practice)
			finalPlans.sort((a, b) => {
				const profileOrder: Record<PlanProfile, number> = { 'DIY/Budget': 1, 'Premium/Convenience': 2, 'Unique/Adventure': 3 };
				return (profileOrder[a.profile as PlanProfile] || 4) - (profileOrder[b.profile as PlanProfile] || 4);
			});

			// Save the successfully generated plans (even if fewer than 3)
			localStorage.setItem('generatedPlans', JSON.stringify(finalPlans));
			localStorage.setItem('userInput', JSON.stringify(data));
			console.log(`Home: ${finalPlans.length} plan(s) generated and saved to localStorage.`);

			// Navigate to results page
			navigate('/results');

		} catch (err) {
			// Catch errors from Promise.allSettled processing or the final check
			console.error('Home: Overall error generating plans:', err);
			setError(`Failed to generate plans. ${err instanceof Error ? err.message : 'Please try again.'}`);
			// Clear potentially incomplete data
			localStorage.removeItem('generatedPlans');
			localStorage.removeItem('userInput');
		} finally {
			setIsLoading(false); // Hide loading state
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

				{/* Display error message if one occurred */}
				{error && (
					<div className="mt-8 max-w-2xl mx-auto p-4 bg-red-100 text-red-700 border border-red-300 rounded-md shadow text-center text-sm">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}

