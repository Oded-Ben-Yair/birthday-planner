import React from 'react';
// Import the actual optimizer logic component
import BudgetOptimizer from './BudgetOptimizer';
// Import necessary types
import type { BirthdayPlan, UserInput } from '../types';

// Define props for the modal wrapper component
interface BudgetOptimizerModalProps {
    isOpen: boolean; // Controls modal visibility
    onClose: () => void; // Function to close the modal
    currentPlan: BirthdayPlan | null; // The plan data to potentially optimize
    userInput: UserInput | null; // Original user input (needed for budget amount/currency)
    // Callback function passed down to BudgetOptimizer to receive the updated plan
    onPlanUpdate: (optimizedPlan: BirthdayPlan) => void;
}

/**
 * BudgetOptimizerModal Component
 * Provides the modal UI (backdrop, panel, header, close button) and renders
 * the BudgetOptimizer component inside, passing down the necessary props.
 */
const BudgetOptimizerModal: React.FC<BudgetOptimizerModalProps> = ({
    isOpen,
    onClose,
    currentPlan,
    userInput,
    onPlanUpdate, // This connects to handleBudgetOptimized (or similar) in the parent (PlanDetail)
}) => {

    // Early return if the modal shouldn't be open or if essential data is missing.
    // This prevents rendering the optimizer without required props.
    if (!isOpen) {
        return null;
    }
    // Log a warning if it was intended to be open but data is missing (helps debugging)
    if (!currentPlan || !userInput) {
        console.warn("BudgetOptimizerModal rendering skipped: currentPlan or userInput is missing.");
        // Optionally render a disabled state or error message within the modal structure,
        // but returning null is simpler for now.
        return null;
    }


    return (
        // Modal backdrop - handles background dimming and click-outside (optional)
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out p-4 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Modal panel - main container for modal content */}
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} flex flex-col max-h-[90vh]`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Budget Optimizer</h3>
                    {/* Close button */}
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        {/* Close icon (X) */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Modal Body - contains the optimizer component, allows scrolling if content overflows */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {/*
                     * Render the BudgetOptimizer component.
                     * Add an explicit check for currentPlan and userInput here to ensure
                     * TypeScript knows they are non-null within this rendering block,
                     * resolving the TS2322 error.
                     */}
                    {currentPlan && userInput && (
                        <BudgetOptimizer
                            selectedPlan={currentPlan} // Pass the non-null plan
                            onPlanUpdate={onPlanUpdate} // Pass the callback function
                            numericBudget={userInput.budgetAmount} // Pass budget amount (non-null due to check)
                            currency={userInput.currency} // Pass currency (non-null due to check)
                        />
                    )}
                </div>

                 {/* Modal Footer - provides a consistent close button */}
                 <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-lg">
                     <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out">Close</button>
                 </div>
            </div>
        </div>
    );
};

export default BudgetOptimizerModal;

