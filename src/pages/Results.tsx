// src/pages/Results.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../components/PlanCard'; // Component to display each plan summary
import type { BirthdayPlan as OriginalBirthdayPlan, UserInput } from '../types'; // Import original type

// Define a local extended type to safely include properties expected by this component/function
type ExtendedBirthdayPlan = OriginalBirthdayPlan & { date?: string | Date; optimizationSummary?: string | undefined };

/**
 * Cleans up plan data loaded from storage, ensuring it conforms to the expected structure
 * and providing default values for missing or invalid fields.
 * Uses the local ExtendedBirthdayPlan type internally.
 * @param plans - The raw array of plans parsed from localStorage.
 * @returns A sanitized array of plans conforming to ExtendedBirthdayPlan.
 */
const sanitizePlans = (plans: unknown[]): ExtendedBirthdayPlan[] => {
    console.log("--- Starting Sanitization ---");
    // Ensure input is an array
    if (!Array.isArray(plans)) {
        console.error('sanitizePlans received non-array input:', plans);
        return []; // Return empty array if input is invalid
    }

    const sanitized = plans.map((plan, index): ExtendedBirthdayPlan => {
        // Check if the current item is a valid object
        if (typeof plan !== 'object' || plan === null) {
            console.warn(`[Plan ${index + 1}] Sanitizing encountered invalid plan item:`, plan);
            // Return a default structure conforming to ExtendedBirthdayPlan
            return {
                id: `invalid-${Date.now()}-${Math.random()}`,
                name: 'Invalid Plan Data',
                description: 'Data could not be loaded correctly.',
                profile: 'Unknown',
                date: '', // Default date for the extended type
                venue: { name: '', description: '', costRange: '', amenities: [], suitability: '', venueSearchSuggestions: [] },
                schedule: [],
                catering: { estimatedCost: '', servingStyle: '', menu: { appetizers: [], mainCourses: [], desserts: '', beverages: [] }, cateringSearchSuggestions: [] },
                guestEngagement: { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [], techIntegration: [], entertainmentSearchSuggestions: [] },
                optimizationSummary: undefined, // Default optimization summary
                // Add defaults for any other fields required by OriginalBirthdayPlan if necessary
            };
        }

        // Cast the potentially untyped plan object for safer access
        const p = plan as Partial<ExtendedBirthdayPlan>; // Treat as partial extended plan

        // Build the sanitized plan object, ensuring all fields conform to ExtendedBirthdayPlan
        const sanitizedPlan: ExtendedBirthdayPlan = {
            id: typeof p.id === 'string' ? p.id : `generated-${Date.now()}-${Math.random()}`,
            name: typeof p.name === 'string' ? p.name : 'Unnamed Plan',
            description: typeof p.description === 'string' ? p.description : '',
            profile: typeof p.profile === 'string' ? p.profile : 'Unknown',
            date: typeof p.date === 'string' || p.date instanceof Date ? p.date : '', // Safely handle date
            venue: { // Ensure venue and its properties exist
                name: p.venue?.name || '',
                description: p.venue?.description || '',
                costRange: p.venue?.costRange || '',
                amenities: Array.isArray(p.venue?.amenities) ? p.venue.amenities.filter(a => typeof a === 'string') : [],
                suitability: p.venue?.suitability || '',
                venueSearchSuggestions: Array.isArray(p.venue?.venueSearchSuggestions) ? p.venue.venueSearchSuggestions.filter(s => typeof s === 'string') : [],
            },
            // Ensure schedule is an array of objects with expected properties
            schedule: Array.isArray(p.schedule)
                ? p.schedule.map(item => ({
                    time: item?.time || '',
                    activity: item?.activity || '',
                    // Use 'details' if it exists from ExtendedScheduleItem definition (used in PlanDetail)
                    details: (item as any)?.details || undefined, // Safely access potential 'details'
                }))
                : [],
            catering: { // Ensure catering and its properties exist
                estimatedCost: p.catering?.estimatedCost || '',
                servingStyle: p.catering?.servingStyle || '',
                menu: { // Ensure menu and its properties exist
                    appetizers: Array.isArray(p.catering?.menu?.appetizers) ? p.catering.menu.appetizers.filter(a => typeof a === 'string') : [],
                    mainCourses: Array.isArray(p.catering?.menu?.mainCourses) ? p.catering.menu.mainCourses.filter(mc => typeof mc === 'string') : [],
                    desserts: typeof p.catering?.menu?.desserts === 'string' ? p.catering.menu.desserts : '',
                    beverages: Array.isArray(p.catering?.menu?.beverages) ? p.catering.menu.beverages.filter(b => typeof b === 'string') : [],
                },
                cateringSearchSuggestions: Array.isArray(p.catering?.cateringSearchSuggestions) ? p.catering.cateringSearchSuggestions.filter(s => typeof s === 'string') : [],
            },
            guestEngagement: { // Ensure guestEngagement and its properties exist
                icebreakers: Array.isArray(p.guestEngagement?.icebreakers) ? p.guestEngagement.icebreakers.filter(i => typeof i === 'string') : [],
                interactiveElements: Array.isArray(p.guestEngagement?.interactiveElements) ? p.guestEngagement.interactiveElements.filter(i => typeof i === 'string') : [],
                photoOpportunities: Array.isArray(p.guestEngagement?.photoOpportunities) ? p.guestEngagement.photoOpportunities.filter(p => typeof p === 'string') : [],
                partyFavors: Array.isArray(p.guestEngagement?.partyFavors) ? p.guestEngagement.partyFavors.filter(p => typeof p === 'string') : [],
                techIntegration: Array.isArray(p.guestEngagement?.techIntegration) ? p.guestEngagement.techIntegration.filter(t => typeof t === 'string') : [],
                entertainmentSearchSuggestions: Array.isArray(p.guestEngagement?.entertainmentSearchSuggestions) ? p.guestEngagement.entertainmentSearchSuggestions.filter(s => typeof s === 'string') : [],
            },
            optimizationSummary: typeof p.optimizationSummary === 'string' ? p.optimizationSummary : undefined,
            // Ensure all properties from OriginalBirthdayPlan are included if not already covered
        };
        return sanitizedPlan;
    });
    console.log("--- Finished Sanitization ---");
    return sanitized;
};


/**
 * Results Page Component
 * Displays generated birthday plans loaded from localStorage as interactive cards.
 * Allows navigation to a detail view for each plan.
 */
export default function Results() {
    // State for the sanitized plans (using extended type) and user input
    const [plans, setPlans] = useState<ExtendedBirthdayPlan[]>([]);
    const [userInput, setUserInput] = useState<UserInput | null>(null);
    // State for potential styling of selected card (currently unused for navigation)
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    // State for loading and error handling
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate(); // Hook for navigation

    // Effect to load and process plan data from localStorage when the component mounts
    useEffect(() => {
        console.log('Results component mounted. Loading data...');
        setIsLoading(true); setError(null); // Reset state on load

        // Retrieve data strings from localStorage
        const storedPlans = localStorage.getItem('generatedPlans');
        const storedUserInput = localStorage.getItem('userInput');

        // If essential data is missing, navigate back to the home page
        if (!storedPlans || !storedUserInput) {
            console.warn("Missing 'generatedPlans' or 'userInput' in localStorage. Navigating home.");
            // Use navigate within useEffect requires it in dependency array or careful consideration
            navigate('/');
            return; // Stop execution
        }

        try {
            // Parse the stored JSON strings
            const parsedPlans: unknown = JSON.parse(storedPlans); // Parse as unknown first
            const parsedUserInput: UserInput = JSON.parse(storedUserInput);

            // Validate that parsed plan data is an array
            if (!Array.isArray(parsedPlans)) {
                throw new Error('Stored plan data is corrupted (not an array).');
            }
            console.log('Successfully parsed data.');

            // Sanitize the loaded plan data to ensure structure and defaults
            // Pass parsedPlans (unknown[]) to sanitizePlans which expects unknown[]
            const sanitizedLoadedPlans = sanitizePlans(parsedPlans);
            console.log('Sanitization complete.');

            // Update state with the sanitized plans and user input
            setPlans(sanitizedLoadedPlans);
            setUserInput(parsedUserInput);
            setSelectedPlanId(null); // Reset any previous selection state

        } catch (err) {
            // Handle errors during parsing or sanitization
            console.error('Error processing stored data:', err);
            setError(`Failed to load plan data. ${err instanceof Error ? err.message : 'Data might be corrupted.'}`);
            // Clear potentially corrupted data from localStorage
            localStorage.removeItem('generatedPlans');
            localStorage.removeItem('userInput');
        } finally {
            // Ensure loading state is turned off
            setIsLoading(false);
        }
        // navigate is included in dependency array as it's used conditionally
    }, [navigate]);

    /**
     * Navigates to the detail page for the selected plan.
     * @param planId - The ID of the plan to view details for.
     */
    const handleNavigateToDetail = (planId: string | null) => {
        // Prevent navigation if planId is somehow null
        if (!planId) {
            console.warn("handleNavigateToDetail called with null planId");
            return;
        }
        console.log(`Navigating to plan detail for ID: ${planId}`);
        // Navigate to the dynamic route for plan details
        navigate(`/plan/${planId}`);
    };

    // --- Render Logic ---

    // Display loading state
    if (isLoading) {
        return ( <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div><p className="text-lg text-gray-600">Loading plans...</p></div></div> );
    }

    // Display error state
    if (error) {
        return ( <div className="min-h-screen bg-red-50 flex items-center justify-center p-4"><div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-md border border-red-200"><h2 className="text-2xl font-semibold text-red-600 mb-4">Loading Error</h2><p className="text-gray-700 mb-6">{error}</p><button onClick={() => { setError(null); navigate('/'); }} className="px-6 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-150 ease-in-out" > Start Over </button></div></div> );
    }

    // Display main results view
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl">Your Generated Plans</h1>
                    {/* Display context from user input if available */}
                    {userInput?.birthdayPersonName && userInput?.theme && (
                        <p className="mt-4 text-xl text-gray-600">
                            For <span className="font-semibold text-indigo-700">{userInput.birthdayPersonName}</span>'s <span className="font-medium">{userInput.theme}</span> themed party!
                        </p>
                    )}
                    <p className="mt-2 text-md text-gray-500">Select a plan to view details and edit.</p>
                </header>

                {/* Conditional rendering based on whether plans were loaded */}
                {plans.length === 0 && !isLoading ? (
                    // Display message if no plans are available
                    <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md mx-auto border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">No Plans Available</h2>
                        <p className="text-gray-600 mb-6">
                            No plans were found or generated successfully. Please go back and try again.
                        </p>
                        <button
                            onClick={() => navigate('/')} // Button to navigate back home
                            className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            Start Over
                        </button>
                    </div>
                ) : (
                    // Display grid of Plan Cards if plans are available
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {/* Map over the sanitized plans array */}
                        {plans.map(plan => (
                            // Ensure plan and plan.id are valid before rendering PlanCard
                            plan && plan.id ? (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan} // Pass the plan data (ExtendedBirthdayPlan is compatible with BirthdayPlan)
                                    isSelected={plan.id === selectedPlanId} // Pass selection state (currently unused)
                                    // Pass the navigation handler, ensuring plan.id is valid
                                    onSelect={() => handleNavigateToDetail(plan.id)}
                                />
                            ) : null // Do not render a card if plan or plan.id is invalid
                        ))}
                    </div>
                )}
            </div>
            {/* Optional Error Snackbar (for non-critical errors) */}
            {error && !isLoading && ( // Re-check condition if error state is used differently now
                <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center" role="alert">
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
                        <span className="text-2xl">&times;</span> {/* Close icon */}
                    </button>
                </div>
            )}
        </div>
    );
}

