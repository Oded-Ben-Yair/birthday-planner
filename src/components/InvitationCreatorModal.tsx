import React from 'react';
// Import the actual invitation logic component you provided
import SmartInvitation from './SmartInvitation';
// Import necessary types
import type { BirthdayPlan } from '../types';

// Define props for the modal wrapper itself
interface InvitationCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: BirthdayPlan | null; // Pass the current plan
}

/**
 * InvitationCreatorModal Component
 * Provides the modal UI wrapper for the SmartInvitation component.
 */
const InvitationCreatorModal: React.FC<InvitationCreatorModalProps> = ({
    isOpen,
    onClose,
    currentPlan,
}) => {

    // Don't render if not open or plan is missing
    if (!isOpen || !currentPlan) {
         if (isOpen) {
             console.warn("InvitationCreatorModal rendering skipped because currentPlan is null/undefined.");
        }
        return null;
    }

    return (
        // Modal backdrop
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out p-4 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Modal content container */}
            {/* Using max-w-3xl for potentially wider invitation display */}
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-3xl transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} flex flex-col max-h-[90vh]`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Create Smart Invitation</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {/* Render the SmartInvitation component you provided */}
                    {/* Pass the selectedPlan prop */}
                    <SmartInvitation
                        selectedPlan={currentPlan}
                    />
                </div>

                 {/* Modal Footer - Added a close button */}
                 <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-lg">
                     <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out">Close</button>
                 </div>
            </div>
        </div>
    );
};

export default InvitationCreatorModal;
