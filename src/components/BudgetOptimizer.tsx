import { useState } from 'react';
import type { BirthdayPlan, BudgetPriorities } from '../types';
// Ensure the path is correct based on your project structure
import { optimizeBudget } from '../utils/api'; // Corrected potential formatting 'api ;' to 'api';

interface BudgetOptimizerProps {
    selectedPlan: BirthdayPlan;
    onPlanUpdate: (plan: BirthdayPlan) => void;
}

export default function BudgetOptimizer({ selectedPlan, onPlanUpdate }: BudgetOptimizerProps) {
    // Initial state setup based on guide
    const [priorities, setPriorities] = useState<BudgetPriorities>({
        venue: 3,
        food: 3,
        activities: 3,
        decorations: 3,
        partyFavors: 3
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handler for priority slider changes
    const handlePriorityChange = (category: keyof BudgetPriorities, value: number) => {
        setPriorities(prev => ({
            ...prev,
            [category]: value
        }));
    };

    // Handler for triggering budget optimization API call
    const handleOptimize = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const optimizedPlan = await optimizeBudget(selectedPlan, priorities);
            onPlanUpdate(optimizedPlan); // Update the plan state in the parent component
        } catch (err) {
            setError('Failed to optimize budget. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Budget Optimizer</h2>
            <p className="text-gray-600 mb-4">
                Adjust the importance of each category to optimize your budget. Higher
                values indicate higher priority.
            </p>
            <div className="space-y-4">
                {/* Map over priorities object to create sliders */}
                {(Object.keys(priorities) as Array<keyof BudgetPriorities>).map((category) => (
                    <div key={category}>
                        <div className="flex justify-between mb-1">
                            <label className="text-sm font-medium text-gray-700 capitalize">
                                {/* Display category name nicely */}
                                {category === 'partyFavors' ? 'Party Favors' : category.charAt(0).toUpperCase() + category.slice(1)}
                            </label>
                            <span className="text-sm text-gray-500">{priorities[category]}/5</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5" // Corrected $max="5"$ from guide typo
                            value={priorities[category]}
                            // Corrected spacing: value={value} onChange=...
                            onChange={(e) => handlePriorityChange(category, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" // Example styling for range
                        />
                    </div>
                ))}
                {error && (
                    <div className="text-red-500 text-sm mt-2">{error}</div> // Added margin-top
                )}
                <div className="flex justify-end mt-6"> {/* Added margin-top */}
                    <button
                        onClick={handleOptimize}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {isLoading ? 'Optimizing...' : 'Optimize Budget'}
                    </button>
                </div>
            </div>
        </div>
    );
}
