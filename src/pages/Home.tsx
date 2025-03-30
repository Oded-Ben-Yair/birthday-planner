import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserInputForm from '../components/UserInputForm'; // Ensure path is correct
import type { UserInput, GeneratePlansResponse, Plan } from '../types'; // Import relevant types (Assuming Plan is defined in types)
import { generateBirthdayPlans } from '../utils/api'; // Import the API function

/**
 * Home page component containing the user input form for generating plans.
 */
export default function Home() {
	// State for loading indicator during API call
	const [isLoading, setIsLoading] = useState(false);
	// State for displaying errors from the API call or saving process
	const [error, setError] = useState<string | null>(null);
	// Hook for programmatic navigation
	const navigate = useNavigate();

	/**
	 * Handles the submission of the UserInputForm.
	 * Calls the API to generate plans, saves results to localStorage, and navigates.
	 * @param data - The validated user input data from the form.
	 */
	const handleSubmit = async (data: UserInput) => {
		setIsLoading(true); // Show loading state
		setError(null);     // Clear previous errors

		try {
			console.log("Home: Submitting user input:", data);
			// Call the API function to generate plans
			const result: GeneratePlansResponse = await generateBirthdayPlans(data);
            console.log("Home: Received API response:", result); // Log the raw response

			// Check the structure and save ONLY the plans array
			// Ensure result and result.plans exist and result.plans is an array
			if (result && Array.isArray(result.plans)) {
                // Ensure plans have IDs (add them if missing, though ideally API provides them)
                const plansWithIds: Plan[] = result.plans.map((plan, index) => ({
                    ...plan,
                    // Assign a default ID if missing. Replace with actual ID logic if available from API
                    id: plan.id || `plan-${index + 1}-${Date.now()}`
                }));

				// Store the generated plans array (with IDs) and the original user input in localStorage
				// *** KEY CORRECTION HERE ***
				localStorage.setItem('generatedPlans', JSON.stringify(plansWithIds)); // <-- Use 'generatedPlans' key
				localStorage.setItem('userInput', JSON.stringify(data)); // Save the input used
				console.log("Home: Plans generated and saved to localStorage with key 'generatedPlans'.");

				// Navigate to the results page upon success
				navigate('/results');
			} else {
				// Handle cases where the API response structure is incorrect
				console.error("Home: Invalid response structure received from generateBirthdayPlans. Expected { plans: [...] }, got:", result);
				throw new Error("Received an unexpected response format from the AI.");
			}

		} catch (err) {
			// Handle errors during the API call or saving process
			console.error('Home: Error generating or saving plans:', err);
			// Set a user-friendly error message
			setError(`Failed to generate birthday plans. ${err instanceof Error ? err.message : 'Please try again.'}`);
            // Clear potentially incomplete data from localStorage on error
            // *** KEY CORRECTION HERE ***
            localStorage.removeItem('generatedPlans'); // <-- Use 'generatedPlans' key
            localStorage.removeItem('userInput');
		} finally {
			setIsLoading(false); // Hide loading state regardless of success/failure
		}
	};

	// --- Render Component UI ---
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8"> {/* Subtle gradient */}
			<div className="max-w-4xl mx-auto"> {/* Centered content */}
				<header className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-800 tracking-tight sm:text-5xl">
						AI Birthday Planner
					</h1>
					<p className="mt-3 text-xl text-gray-600"> {/* Increased size */}
						Let's create the perfect celebration!
					</p>
				</header>

				{/* Render the User Input Form */}
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

