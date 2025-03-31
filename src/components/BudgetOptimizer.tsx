// src/components/BudgetOptimizer.tsx
import { useState } from 'react';
// Import necessary types
// Removed unused types: SmartInvitation, Venue, Catering, GuestEngagement, ScheduleItem, CateringMenu
import type { BirthdayPlan, BudgetPriorities, UserInput } from '../types'; // Keep BudgetPriorities as it's used
// Import the API utility function
import { optimizeBudget } from '../utils/api'; // Ensure path is correct

/**
 * Props for the BudgetOptimizer component.
 * Defines the data needed for the optimizer to function.
 */
interface BudgetOptimizerProps {
    selectedPlan: BirthdayPlan; // The plan to be optimized
    onPlanUpdate: (plan: BirthdayPlan) => void; // Callback to update the parent with the optimized plan
    numericBudget: number; // The target budget amount
    currency: string; // The currency symbol/code
    // Note: userInput might be needed if the API requires more context than just the plan
    // userInput: UserInput; // Add this if optimizeBudget API needs it
}

/**
 * BudgetOptimizer Component
 * Provides sliders for users to set budget priorities for different categories (venue, food, etc.).
 * Triggers an API call to optimize the selected birthday plan based on these priorities and a target budget.
 */
export default function BudgetOptimizer({
    selectedPlan,
    onPlanUpdate,
    numericBudget,
    currency
}: BudgetOptimizerProps) {

    // State for storing user-defined budget priorities (scale 1-5)
    const [priorities, setPriorities] = useState<BudgetPriorities>({
        venue: 3,       // Default priority level
        food: 3,
        activities: 3,
        decorations: 3,
        partyFavors: 3
        // Ensure these keys match the BudgetPriorities type definition
    });

    // State for loading indicator during the API call
    const [isLoading, setIsLoading] = useState(false);
    // State for displaying errors encountered during optimization
    const [error, setError] = useState<string | null>(null);

    /**
     * Handles changes to the priority sliders.
     * Updates the corresponding category in the 'priorities' state.
     * @param category - The priority category being adjusted (e.g., 'venue', 'food').
     * @param value - The new priority value (integer from 1 to 5).
     */
    const handlePriorityChange = (category: keyof BudgetPriorities, value: number) => {
        setPriorities(prev => ({
            ...prev,
            [category]: value // Update the specific category's priority
        }));
    };

    /**
     * Handles the click event for the "Optimize Budget" button.
     * Sends the current plan, priorities, and budget details to the backend API.
     * Calls 'onPlanUpdate' with the optimized plan received from the API.
     */
    const handleOptimize = async () => {
        setIsLoading(true); // Indicate loading state
        setError(null);     // Clear any previous errors

        try {
            console.log(`Optimizing budget for plan: ${selectedPlan.id}, Target: ${numericBudget} ${currency}, Priorities:`, priorities);
            // Call the API function with the plan, priorities, and budget info
            const result = await optimizeBudget(
                selectedPlan,
                priorities,
                numericBudget,
                currency
            );

            // Check if the API response contains the expected optimized plan data
            if (result && result.optimizedPlan) {
                onPlanUpdate(result.optimizedPlan); // Pass the optimized plan back to the parent component
                console.log("Budget optimization successful.");
                // Optionally close the modal here if this component controls it,
                // but typically the parent/modal wrapper handles closing.
            } else {
                // Handle cases where the API call succeeded but returned an unexpected structure
                console.error("Invalid response structure from optimizeBudget API:", result);
                throw new Error("Received an unexpected response from the budget optimizer.");
            }
        } catch (err) {
            // Handle errors during the API call (network issues, backend errors)
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to optimize budget: ${errorMessage}`);
            console.error("Budget Optimization Error:", err);
        } finally {
            // Ensure loading state is turned off after the operation completes
            setIsLoading(false);
        }
    };

    // --- Render Component UI ---
    return (
        // Main container with background gradient and styling
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-lg shadow-md p-6 max-w-2xl mx-auto border border-indigo-100">
            <h2 className="text-2xl font-bold mb-3 text-indigo-800">Budget Optimizer</h2>
            {/* Display the target budget */}
            <p className="text-sm text-gray-600 mb-4">
                Adjust priorities to optimize the selected plan towards your budget of:
                <strong className="ml-1">{numericBudget.toLocaleString()} {currency}</strong>.
            </p>
            {/* Instructions for the user */}
            <p className="text-gray-600 mb-6 text-sm">
                Rate the importance of each category (1 = Least Important, 5 = Most Important). The AI will suggest adjustments based on your priorities and budget.
            </p>
            {/* Container for the priority sliders */}
            <div className="space-y-5">
                {/* Map through the priority categories to generate sliders dynamically */}
                {(Object.keys(priorities) as Array<keyof BudgetPriorities>).map((category) => (
                    <div key={category}>
                        {/* Label showing category name and current priority value */}
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-gray-800 capitalize">
                                {/* Format category name for display (e.g., 'partyFavors' -> 'Party Favors') */}
                                {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                                {priorities[category]}/5 {/* Display current value */}
                            </span>
                        </div>
                        {/* HTML range input slider */}
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1" // Only allow whole numbers
                            value={priorities[category]} // Controlled component value
                            onChange={(e) => handlePriorityChange(category, parseInt(e.target.value, 10))} // Update state on change
                            // Tailwind classes for styling the slider
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500"
                        />
                    </div>
                ))}

                {/* Display error message area */}
                {error && (
                    <div className="text-red-600 bg-red-100 border border-red-300 p-3 rounded-md text-sm mt-4">{error}</div>
                )}

                {/* Optimize button container */}
                <div className="flex justify-end pt-4 mt-6 border-t border-gray-200">
                    <button
                        onClick={handleOptimize}
                        disabled={isLoading} // Disable button during API call
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
                    >
                        {isLoading ? 'Optimizing...' : 'Optimize Budget'}
                    </button>
                </div>
            </div>
        </div>
    );
}


