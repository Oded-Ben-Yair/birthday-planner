import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserInputForm from '../components/UserInputForm'; // Ensure path is correct
import type { UserInput, GeneratePlansResponse, BirthdayPlan } from '../types'; // Use BirthdayPlan
import { generateBirthdayPlans } from '../utils/api'; // Import the API function

/**
 * Home page component containing the user input form for generating plans.
 */
export default function Home() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	const handleSubmit = async (data: UserInput) => {
		setIsLoading(true);
		setError(null);

		try {
			// *** DETAILED LOGGING HERE ***
			console.log("Home: Submitting user input (Full Object):", JSON.stringify(data, null, 2)); // Log the full stringified object

			const result: GeneratePlansResponse = await generateBirthdayPlans(data);
            console.log("Home: Received API response:", result);

			if (result && Array.isArray(result.plans)) {
                const plansWithIds: BirthdayPlan[] = result.plans.map((plan, index) => ({ // Use BirthdayPlan type
                    ...plan,
                    id: plan.id || `plan-${index + 1}-${Date.now()}`
                }));

				localStorage.setItem('generatedPlans', JSON.stringify(plansWithIds));
				localStorage.setItem('userInput', JSON.stringify(data)); // Also save the input that generated these plans
				console.log("Home: Plans generated and saved to localStorage with key 'generatedPlans'.");

				navigate('/results');
			} else {
				console.error("Home: Invalid response structure received from generateBirthdayPlans. Expected { plans: [...] }, got:", result);
				throw new Error("Received an unexpected response format from the AI.");
			}

		} catch (err) {
			console.error('Home: Error generating or saving plans:', err);
			setError(`Failed to generate birthday plans. ${err instanceof Error ? err.message : 'Please try again.'}`);
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

