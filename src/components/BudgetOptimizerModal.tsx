import React from 'react';
// Import the actual optimizer logic component you provided
import BudgetOptimizer from './BudgetOptimizer';
// Import necessary types
import type { BirthdayPlan, UserInput } from '../types';

// Define props for the modal wrapper itself
interface BudgetOptimizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: BirthdayPlan | null; // Pass the current plan
    userInput: UserInput | null; // Pass the original user input (for budget amount/currency)
    // Callback function to receive the updated plan from BudgetOptimizer component
    onPlanUpdate: (optimizedPlan: BirthdayPlan) => void;
}

/**
 * BudgetOptimizerModal Component
 * Provides the modal UI wrapper for the BudgetOptimizer component.
 */
const BudgetOptimizerModal: React.FC<BudgetOptimizerModalProps> = ({
    isOpen,
    onClose,
    currentPlan,
    userInput,
    onPlanUpdate, // This will be connected to handleBudgetOptimized in PlanDetail
}) => {

    // Don't render if not open, or if essential data is missing
    if (!isOpen || !currentPlan || !userInput) {
        if (isOpen) { // Log only if it was intended to be open but data is missing
             console.warn("BudgetOptimizerModal rendering skipped because currentPlan or userInput is null/undefined.");
        }
        return null;
    }

    return (
        // Modal backdrop
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out p-4 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Modal content container */}
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} flex flex-col max-h-[90vh]`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Budget Optimizer</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {/* Render the BudgetOptimizer component you provided */}
                    {/* Pass the necessary props down */}
                    <BudgetOptimizer
                        selectedPlan={currentPlan}
                        onPlanUpdate={onPlanUpdate} // Pass the callback function from PlanDetail
                        numericBudget={userInput.budgetAmount} // Pass budget amount from userInput
                        currency={userInput.currency} // Pass currency from userInput
                    />
                </div>

                 {/* Footer - Added a simple close button for consistency */}
                 <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-lg">
                     <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out">Close</button>
                 </div>
            </div>
        </div>
    );
};

export default BudgetOptimizerModal;

