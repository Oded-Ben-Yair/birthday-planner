import React, { useState, useEffect } from 'react'; // Added useEffect import
// Import necessary types, assuming SmartInvitationType is defined in types/index.ts
import type { BirthdayPlan, SmartInvitation as SmartInvitationType } from '../types';
// Import the API utility function (ensure path is correct)
import { generateSmartInvitation } from '../utils/api';

// Props for the component - primarily needs the selected plan
interface SmartInvitationProps {
    selectedPlan: BirthdayPlan;
    // Note: This component handles its own state and API call.
    // It's rendered by InvitationCreatorModal which handles open/close.
}

/**
 * SmartInvitation Component
 * Allows users to select options and generate AI-powered invitation text and images.
 */
export default function SmartInvitation({ selectedPlan }: SmartInvitationProps) {
    // State for user selections
    const [template, setTemplate] = useState<'classic' | 'playful' | 'themed' | 'minimalist'>('themed');
    // Pre-fill date from plan if available, otherwise empty string
    const [date, setDate] = useState<string>("");
    const [time, setTime] = useState<string>(""); // Time needs to be input by user

    // State for API results and status
    const [invitation, setInvitation] = useState<SmartInvitationType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to pre-fill date when component mounts or selectedPlan changes
    useEffect(() => {
        if (selectedPlan?.date) {
            try {
                // Format the date from the plan to YYYY-MM-DD for the input
                const planDate = new Date(selectedPlan.date);
                 // Check if the date is valid before formatting
                if (!isNaN(planDate.getTime())) {
                    const formattedDate = planDate.toISOString().split('T')[0];
                    setDate(formattedDate);
                } else {
                    console.warn("Plan date is invalid:", selectedPlan.date);
                    setDate(""); // Reset if invalid
                }
            } catch (e) {
                console.error("Error parsing plan date:", e);
                setDate(""); // Reset on error
            }
        } else {
            setDate(""); // Reset if no date in plan
        }
        // Reset time when plan changes
        setTime("");
        // Clear previous results when plan changes
        setInvitation(null);
        setError(null);
    }, [selectedPlan]); // Dependency on selectedPlan

    /**
     * Handles the click event for the "Generate Invitation" button.
     * Validates inputs and calls the backend API.
     */
    const handleGenerateInvitation = async () => {
        // Basic validation for date and time
        if (!date || !time) {
            setError('Please select a valid date and time for the event.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setInvitation(null); // Clear previous invitation

        try {
            console.log(`Generating invitation for plan: ${selectedPlan.id}, Template: ${template}, Date: ${date}, Time: ${time}`);
            // Call the API utility function
            const result = await generateSmartInvitation(selectedPlan, template, date, time);

            // Assuming the API returns { text: string, imageUrl: string, template: string }
            if (result && result.text && result.imageUrl) {
                setInvitation(result); // Set the state with the generated invitation data
                console.log("Invitation generation successful.");
            } else {
                console.error("Invalid response structure from generateSmartInvitation API:", result);
                throw new Error("Received an unexpected response from the invitation generator.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate invitation: ${errorMessage}`);
            console.error("Invitation Generation Error:", err);
        } finally {
            setIsLoading(false); // Hide loading state
        }
    };

    // --- Render Component UI ---
    return (
        // Using a div wrapper
        <div className="smart-invitation-container">
            {/* Section for selecting options (only shown if invitation hasn't been generated yet) */}
            {!invitation ? (
                <div className="space-y-6">
                    {/* Template Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Template Style
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {(['classic', 'playful', 'themed', 'minimalist'] as const).map((style) => (
                                <div
                                    key={style}
                                    onClick={() => setTemplate(style)}
                                    className={`border rounded-md p-3 text-center cursor-pointer transition-colors duration-150 ease-in-out ${
                                        template === style
                                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300' // Enhanced selected style
                                            : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                    }`}
                                >
                                    <span className="capitalize text-sm font-medium">{style}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Date and Time Inputs */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Date
                            </label>
                            <input
                                type="date"
                                id="eventDate"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Time
                            </label>
                            <input
                                type="time"
                                id="eventTime"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="text-red-600 bg-red-100 border border-red-300 p-3 rounded-md text-sm">{error}</div>
                    )}

                    {/* Generate Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={handleGenerateInvitation}
                            disabled={isLoading || !date || !time} // Disable if loading or date/time missing
                            className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-md shadow hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            {isLoading ? 'Generating...' : 'Generate Invitation'}
                        </button>
                    </div>
                </div>
            ) : (
                // Section for displaying the generated invitation
                <div className="space-y-6">
                    <div className="border rounded-lg overflow-hidden shadow-sm">
                        {/* Display Generated Image */}
                        {invitation.imageUrl ? (
                            <img
                                src={invitation.imageUrl}
                                alt={`Generated ${invitation.template} invitation for ${selectedPlan.name}`}
                                className="w-full h-auto object-contain max-h-96 bg-gray-100" // Adjust styling as needed
                                // Add error handling for image loading
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null; // Prevent infinite loop
                                    target.src = 'https://placehold.co/1024x1024/cccccc/ffffff?text=Image+Error'; // Placeholder
                                    console.error("Failed to load invitation image:", invitation.imageUrl);
                                }}
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500">Image generation failed or not available</span>
                            </div>
                        )}

                        {/* Display Generated Text */}
                        <div className="p-4 bg-white">
                            {/* Using prose for nice text formatting, max-w-none to prevent width constraints */}
                            <div className="prose prose-sm max-w-none text-gray-800">
                                {(invitation.text || 'Invitation text could not be generated.').split('\n').map((line, i) => (
                                    // Render each line as a paragraph, handling potential empty lines
                                    line.trim() === '' ? <br key={i} /> : <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons for Generated Invitation */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        {/* Button to go back and generate a new one */}
                        <button
                            onClick={() => { setInvitation(null); setError(null); }} // Clear current invitation and error
                            className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
                        >
                            &larr; Create New
                        </button>
                        {/* Button to "Save/Share" (currently just an alert) */}
                        <button
                            onClick={() => {
                                // In a real app, implement saving/sharing logic here
                                alert('Invitation "saved"! Implement actual save/share functionality.');
                            }}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                        >
                            Save / Share {/* Add appropriate icon later? */}
                        </button>
                    </div>
                </div>
            )}
        </div> // Changed fragment to div wrapper
    );
}

