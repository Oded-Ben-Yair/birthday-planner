// src/components/BudgetOptimizer.tsx
import { useState } from 'react';
// Import necessary types, including BudgetPriorities if not defined globally
import type { BirthdayPlan, BudgetPriorities } from '../types';
// Import the API utility function (ensure path is correct)
import { optimizeBudget } from '../utils/api';

/**
 * Props for the BudgetOptimizer component.
 * Includes the selected plan, update handler, and NEWLY ADDED budget details.
 */
interface BudgetOptimizerProps {
	selectedPlan: BirthdayPlan;
	onPlanUpdate: (plan: BirthdayPlan) => void;
	// Added: Receive numeric budget and currency from the parent (Results.tsx)
	numericBudget: number;
	currency: string;
}

/**
 * Component allowing users to set budget priorities and trigger AI-powered optimization.
 */
export default function BudgetOptimizer({
	selectedPlan,
	onPlanUpdate,
	numericBudget, // Destructure new props
	currency         // Destructure new props
}: BudgetOptimizerProps) {

	// State for storing user-defined budget priorities (scale 1-5)
	const [priorities, setPriorities] = useState<BudgetPriorities>({
		venue: 3,        // Default priority
		food: 3,
		activities: 3,
		decorations: 3,
		partyFavors: 3
	});

	// State for loading indicator during API call
	const [isLoading, setIsLoading] = useState(false);
	// State for displaying errors from the API call
	const [error, setError] = useState<string | null>(null);

	/**
	 * Handles changes to the priority sliders.
	 * Updates the local 'priorities' state.
	 * @param category - The category being changed (e.g., 'venue', 'food').
	 * @param value - The new priority value (1-5).
	 */
	const handlePriorityChange = (category: keyof BudgetPriorities, value: number) => {
		setPriorities(prev => ({
			...prev,
			[category]: value
		}));
	};

	/**
	 * Handles the click event for the "Optimize Budget" button.
	 * Calls the backend API to get an optimized plan based on priorities and budget.
	 */
	const handleOptimize = async () => {
		setIsLoading(true); // Show loading state
		setError(null);     // Clear previous errors

		try {
			console.log(`Optimizing budget for plan: ${selectedPlan.id}, Target: ${numericBudget} ${currency}`);
			// ** Call API utility with NEW arguments: numericBudget and currency **
			// Note: The 'optimizeBudget' function in api.ts needs to be updated next to accept these.
			const result = await optimizeBudget(
				selectedPlan,
				priorities,
				numericBudget, // Pass the numeric budget
				currency       // Pass the currency
			);

            // Assuming the API returns { optimizedPlan: BirthdayPlan }
            if (result && result.optimizedPlan) {
			    onPlanUpdate(result.optimizedPlan); // Update the plan state in the parent (Results.tsx)
                console.log("Budget optimization successful.");
            } else {
                 // Handle cases where the API response structure might be wrong
                 console.error("Invalid response structure from optimizeBudget API:", result);
                 throw new Error("Received an unexpected response from the budget optimizer.");
            }
		} catch (err) {
            // Handle errors during the API call
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
			setError(`Failed to optimize budget: ${errorMessage}`);
			console.error("Budget Optimization Error:", err);
		} finally {
			setIsLoading(false); // Hide loading state regardless of success/failure
		}
	};

	// --- Render Component UI ---
	return (
		// Container with styling
		<div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-lg shadow-md p-6 max-w-2xl mx-auto border border-indigo-100">
			<h2 className="text-2xl font-bold mb-3 text-indigo-800">Budget Optimizer</h2>
            {/* Display the target budget being used */}
            <p className="text-sm text-gray-600 mb-4">
                Adjust priorities to optimize the selected plan towards your budget of:
                <strong className="ml-1">{numericBudget.toLocaleString()} {currency}</strong>.
            </p>
			<p className="text-gray-600 mb-6 text-sm"> {/* Increased margin */}
				Rate the importance of each category (1 = Least Important, 5 = Most Important). The AI will suggest adjustments based on your priorities and budget.
			</p>
			{/* Container for sliders */}
			<div className="space-y-5"> {/* Increased spacing */}
				{/* Dynamically create sliders for each priority category */}
				{(Object.keys(priorities) as Array<keyof BudgetPriorities>).map((category) => (
					<div key={category}>
						{/* Label and current value display */}
						<div className="flex justify-between items-center mb-1">
							<label className="text-sm font-medium text-gray-800 capitalize">
								{/* Format category name nicely */}
								{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
							</label>
							<span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                                {priorities[category]}/5
                            </span>
						</div>
						{/* Range slider input */}
						<input
							type="range"
							min="1"
							max="5"
							step="1" // Ensure whole numbers
							value={priorities[category]}
							onChange={(e) => handlePriorityChange(category, parseInt(e.target.value, 10))} // Use radix 10
							// Styling for the slider track and thumb
							className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500"
						/>
					</div>
				))}

				{/* Display error message if API call fails */}
				{error && (
					<div className="text-red-600 bg-red-100 border border-red-300 p-3 rounded-md text-sm mt-4">{error}</div>
				)}

				{/* Optimize button */}
				<div className="flex justify-end pt-4 mt-6 border-t border-gray-200"> {/* Added spacing and border */}
					<button
						onClick={handleOptimize}
						disabled={isLoading} // Disable button while loading
						className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
					>
						{isLoading ? 'Optimizing...' : 'Optimize Budget'}
					</button>
				</div>
			</div>
		</div>
	);
}

