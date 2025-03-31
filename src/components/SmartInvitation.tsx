import { useState, useEffect } from 'react'; // Removed unused 'React' import
// Import necessary types
import type { BirthdayPlan, SmartInvitation as SmartInvitationType } from '../types';
// Import the API utility function (ensure path is correct)
import { generateSmartInvitation } from '../utils/api'; // Assuming this path is correct

// Define a local type extending BirthdayPlan to safely include the 'date' field
// This avoids modifying the original imported type while satisfying local usage.
type ExtendedBirthdayPlan = BirthdayPlan & { date?: string | Date };

// Define the props the component will accept, using the extended type
interface SmartInvitationProps {
    selectedPlan: ExtendedBirthdayPlan; // Use the extended type here
    // Note: This component manages its own state and API interaction.
}

/**
 * SmartInvitation Component
 * Enables users to select style options and generate AI-powered invitation text and images
 * based on the provided birthday plan details.
 */
export default function SmartInvitation({ selectedPlan }: SmartInvitationProps) { // Destructure props using the interface
    // State for user selections (template style)
    const [template, setTemplate] = useState<'classic' | 'playful' | 'themed' | 'minimalist'>('themed');
    // State for user-provided date and time
    const [date, setDate] = useState<string>(""); // Date input value (YYYY-MM-DD)
    const [time, setTime] = useState<string>(""); // Time input value

    // State for the generated invitation result
    const [invitation, setInvitation] = useState<SmartInvitationType | null>(null);
    // State for loading and error handling during API calls
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to pre-fill the date input when the component mounts or the selected plan changes.
    useEffect(() => {
        // Check if the selected plan exists and has a 'date' property (using the extended type)
        if (selectedPlan?.date) {
            try {
                // Attempt to create a Date object and format it
                const planDate = new Date(selectedPlan.date);
                // Check if the created Date object is valid
                if (!isNaN(planDate.getTime())) {
                    // Adjust for timezone offset to ensure the date input reflects the local date
                    const tzoffset = planDate.getTimezoneOffset() * 60000; // Offset in milliseconds
                    const localISOTime = (new Date(planDate.getTime() - tzoffset)).toISOString().split('T')[0];
                    setDate(localISOTime); // Set the formatted date state
                } else {
                    console.warn("Plan date from selectedPlan is invalid:", selectedPlan.date);
                    setDate(""); // Reset date if invalid
                }
            } catch (e) {
                console.error("Error parsing plan date:", e);
                setDate(""); // Reset date on parsing error
            }
        } else {
            setDate(""); // Reset date if no date is present in the plan
        }
        // Always reset time when the plan changes, as it's user-input specific
        setTime("");
        // Clear previous generation results and errors when the plan changes
        setInvitation(null);
        setError(null);
    }, [selectedPlan]); // Re-run effect if the selectedPlan object changes

    /**
     * Handles the click event for the "Generate Invitation" button.
     * Performs basic validation and triggers the API call.
     */
    const handleGenerateInvitation = async () => {
        // Validate that both date and time have been entered
        if (!date || !time) {
            setError('Please select a valid date and time for the event.');
            return; // Stop execution if validation fails
        }
        // Set loading state and clear previous results/errors
        setIsLoading(true);
        setError(null);
        setInvitation(null);

        try {
            console.log(`Generating invitation for plan: ${selectedPlan.id}, Template: ${template}, Date: ${date}, Time: ${time}`);
            // Call the backend API function
            const result = await generateSmartInvitation(selectedPlan, template, date, time);

            // Validate the structure of the API response
            if (result && result.text && result.imageUrl) {
                setInvitation(result); // Store the successful result
                console.log("Invitation generation successful.");
            } else {
                // Log error and throw if the response format is unexpected
                console.error("Invalid response structure from generateSmartInvitation API:", result);
                throw new Error("Received an unexpected response from the invitation generator.");
            }
        } catch (err) {
            // Handle errors during the API call
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate invitation: ${errorMessage}`);
            console.error("Invitation Generation Error:", err);
        } finally {
            // Ensure loading state is turned off regardless of success or failure
            setIsLoading(false);
        }
    };

    // --- Render Component UI ---
    return (
        // Main container for the component
        <div className="smart-invitation-container">
            {/* Conditional rendering: Show options form OR the generated invitation */}
            {!invitation ? (
                /* Form section for selecting options */
                <div className="space-y-6">
                    {/* Template Selection Grid */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Template Style
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {/* Map through template styles to create selection buttons */}
                            {(['classic', 'playful', 'themed', 'minimalist'] as const).map((style) => (
                                <div
                                    key={style}
                                    onClick={() => setTemplate(style)}
                                    // Apply dynamic classes for selected/hover states
                                    className={`border rounded-md p-3 text-center cursor-pointer transition-colors duration-150 ease-in-out ${
                                        template === style
                                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300' // Style for selected item
                                            : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50' // Style for non-selected items
                                    }`}
                                >
                                    <span className="capitalize text-sm font-medium">{style}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Date and Time Input Fields */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Date
                            </label>
                            <input
                                type="date"
                                id="eventDate"
                                value={date} // Controlled component
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
                                value={time} // Controlled component
                                onChange={(e) => setTime(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Display API Errors */}
                    {error && (
                        <div className="text-red-600 bg-red-100 border border-red-300 p-3 rounded-md text-sm">{error}</div>
                    )}

                    {/* Generate Button Area */}
                    <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                        <button
                            onClick={handleGenerateInvitation}
                            // Disable button while loading or if date/time are missing
                            disabled={isLoading || !date || !time}
                            className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-md shadow hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            {isLoading ? 'Generating...' : 'Generate Invitation'}
                        </button>
                    </div>
                </div>
            ) : (
                /* Display section for the generated invitation */
                <div className="space-y-6">
                    <div className="border rounded-lg overflow-hidden shadow-sm">
                        {/* Display Generated Image */}
                        {invitation.imageUrl ? (
                            <img
                                src={invitation.imageUrl}
                                alt={`Generated ${invitation.template} invitation for ${selectedPlan.name}`}
                                className="w-full h-auto object-contain max-h-96 bg-gray-100" // Basic image styling
                                // Basic error handling for broken image links
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null; // Prevent infinite loops
                                    target.src = 'https://placehold.co/1024x1024/cccccc/ffffff?text=Image+Load+Error'; // Fallback placeholder
                                    console.error("Failed to load invitation image:", invitation.imageUrl);
                                }}
                            />
                        ) : (
                            // Fallback display if image URL is missing
                            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500">Image generation failed or not available</span>
                            </div>
                        )}

                        {/* Display Generated Text */}
                        <div className="p-4 bg-white">
                            {/* Use Tailwind Typography plugin for nice text formatting */}
                            <div className="prose prose-sm max-w-none text-gray-800">
                                {/* Split text by newline and render each line, handling empty lines */}
                                {(invitation.text || 'Invitation text could not be generated.').split('\n').map((line, i) => (
                                    line.trim() === '' ? <br key={i} /> : <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons for the Generated Invitation */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        {/* Button to go back to the options form */}
                        <button
                            onClick={() => { setInvitation(null); setError(null); }} // Clear results to show form again
                            className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
                        >
                            &larr; Create New {/* Left arrow */}
                        </button>
                        {/* Placeholder button for saving/sharing */}
                        <button
                            onClick={() => {
                                // Placeholder action: Implement actual save/share logic here
                                alert('Invitation "saved"! (Implement actual save/share functionality)');
                            }}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                        >
                            Save / Share {/* TODO: Add icon? */}
                        </button>
                    </div>
                </div>
            )}
        </div> // Close main container
    );
}

