    // src/pages/Results.tsx
    import { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import PlanCard from '../components/PlanCard'; // PlanCard no longer needs onPlanUpdate
    // Removed imports for components that will live on the detail page
    // import SmartInvitation from '../components/SmartInvitation';
    // import BudgetOptimizer from '../components/BudgetOptimizer';
    import type { BirthdayPlan, UserInput } from '../types';

    /**
     * Cleans up plan data loaded from storage.
     */
    const sanitizePlans = (plans: BirthdayPlan[]): BirthdayPlan[] => {
        // Keep the robust sanitizePlans function from results_fix_syntax_2
        // ... (full sanitizePlans function code) ...
        console.log("--- Starting Sanitization ---");
        if (!Array.isArray(plans)) { console.error('sanitizePlans received non-array input:', plans); return []; }
        const sanitized = plans.map((plan, index) => {
            if (typeof plan !== 'object' || plan === null) {
                 console.warn(`[Plan ${index + 1}] Sanitizing encountered invalid plan item:`, plan);
                 return { id: `invalid-${Date.now()}-${Math.random()}`, name: 'Invalid Plan Data', description: 'Data could not be loaded correctly.', profile: 'Unknown', venue: { name: '', description: '', costRange: '', amenities: [], suitability: '', venueSearchSuggestions: [] }, schedule: [], catering: { estimatedCost: '', servingStyle: '', menu: { appetizers: [], mainCourses: [], desserts: '', beverages: [] }, cateringSearchSuggestions: [] }, guestEngagement: { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [], techIntegration: [], entertainmentSearchSuggestions: [] }, optimizationSummary: undefined, };
            }
            const sanitizedPlan: BirthdayPlan = { /* ... full sanitization logic ... */ };
             sanitizedPlan.id = typeof plan.id === 'string' ? plan.id : `generated-${Date.now()}-${Math.random()}`;
             sanitizedPlan.name = typeof plan.name === 'string' ? plan.name : 'Unnamed Plan';
             sanitizedPlan.description = typeof plan.description === 'string' ? plan.description : '';
             sanitizedPlan.profile = typeof plan.profile === 'string' ? plan.profile : 'Unknown';
             sanitizedPlan.optimizationSummary = typeof plan.optimizationSummary === 'string' ? plan.optimizationSummary : undefined;
             sanitizedPlan.venue = { ...(plan.venue || {}), name: plan.venue?.name || '', description: plan.venue?.description || '', costRange: plan.venue?.costRange || '', amenities: Array.isArray(plan.venue?.amenities) ? plan.venue.amenities : [], suitability: plan.venue?.suitability || '', venueSearchSuggestions: Array.isArray(plan.venue?.venueSearchSuggestions) ? plan.venue.venueSearchSuggestions : [], };
             sanitizedPlan.schedule = Array.isArray(plan.schedule) ? plan.schedule.map(item => ({ time: item?.time || '', activity: item?.activity || '', description: item?.description || undefined })) : [];
             sanitizedPlan.catering = { ...(plan.catering || {}), estimatedCost: plan.catering?.estimatedCost || '', servingStyle: plan.catering?.servingStyle || '', menu: { ...(plan.catering?.menu || {}), appetizers: Array.isArray(plan.catering?.menu?.appetizers) ? plan.catering.menu.appetizers : [], mainCourses: Array.isArray(plan.catering?.menu?.mainCourses) ? plan.catering.menu.mainCourses : [], desserts: plan.catering?.menu?.desserts || '', beverages: Array.isArray(plan.catering?.menu?.beverages) ? plan.catering.menu.beverages : [], }, cateringSearchSuggestions: Array.isArray(plan.catering?.cateringSearchSuggestions) ? plan.catering.cateringSearchSuggestions : [], };
             sanitizedPlan.guestEngagement = { ...(plan.guestEngagement || {}), icebreakers: Array.isArray(plan.guestEngagement?.icebreakers) ? plan.guestEngagement.icebreakers : [], interactiveElements: Array.isArray(plan.guestEngagement?.interactiveElements) ? plan.guestEngagement.interactiveElements : [], photoOpportunities: Array.isArray(plan.guestEngagement?.photoOpportunities) ? plan.guestEngagement.photoOpportunities : [], partyFavors: Array.isArray(plan.guestEngagement?.partyFavors) ? plan.guestEngagement.partyFavors : [], techIntegration: Array.isArray(plan.guestEngagement?.techIntegration) ? plan.guestEngagement.techIntegration : [], entertainmentSearchSuggestions: Array.isArray(plan.guestEngagement?.entertainmentSearchSuggestions) ? plan.guestEngagement.entertainmentSearchSuggestions : [], };
            return sanitizedPlan;
        });
        console.log("--- Finished Sanitization ---");
        return sanitized;
    };


    /**
     * Results page component: Displays generated plans as cards
     * and allows navigation to a detail view for each plan.
     */
    export default function Results() {
        const [plans, setPlans] = useState<BirthdayPlan[]>([]);
        const [userInput, setUserInput] = useState<UserInput | null>(null);
        // Keep selectedPlanId only for visual styling feedback if desired
        const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [error, setError] = useState<string | null>(null);
        const navigate = useNavigate();

        // Effect to load data from localStorage
        useEffect(() => {
            console.log('Results component mounted. Loading data...');
            setIsLoading(true); setError(null);
            const storedPlans = localStorage.getItem('birthdayPlans');
            const storedUserInput = localStorage.getItem('userInput');
            if (!storedPlans || !storedUserInput) { navigate('/'); return; }
            try {
                const parsedPlans: unknown = JSON.parse(storedPlans);
                const parsedUserInput: UserInput = JSON.parse(storedUserInput);
                if (!Array.isArray(parsedPlans)) { throw new Error('Stored plan data is corrupted (not an array).'); }
                console.log('Successfully parsed data.');
                const sanitizedLoadedPlans = sanitizePlans(parsedPlans as BirthdayPlan[]);
                console.log('Sanitization complete.');
                setPlans(sanitizedLoadedPlans); setUserInput(parsedUserInput);
                setSelectedPlanId(null); // Reset selection on load
            } catch (err) {
                console.error('Error processing stored data:', err);
                setError(`Failed to load plan data. ${err instanceof Error ? err.message : ''}`);
                localStorage.removeItem('birthdayPlans'); localStorage.removeItem('userInput');
            } finally { setIsLoading(false); }
        }, [navigate]);

        // REMOVED handlePlanUpdate - editing is moved to detail page

        /**
         * Navigates to the detail page for the selected plan.
         * @param planId - The ID of the plan to navigate to.
         */
        const handleNavigateToDetail = (planId: string | null) => {
            if (!planId) return;
            // Optionally set selectedPlanId for visual feedback before navigating
            // setSelectedPlanId(planId);
            console.log(`Navigating to plan detail for ID: ${planId}`);
            navigate(`/plan/${planId}`); // Use React Router's navigate function
        };

        // --- Render Logic ---
        if (isLoading) {
             return ( <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div><p className="text-lg text-gray-600">Loading plans...</p></div></div> );
        }
        if (error) {
             return ( <div className="min-h-screen bg-red-50 flex items-center justify-center p-4"><div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-md border border-red-200"><h2 className="text-2xl font-semibold text-red-600 mb-4">Loading Error</h2><p className="text-gray-700 mb-6">{error}</p><button onClick={() => { setError(null); navigate('/'); }} className="px-6 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-150 ease-in-out" > Start Over </button></div></div> );
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <header className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl">Your Generated Plans</h1>
                        {userInput?.birthdayPersonName && userInput?.theme && (
                            <p className="mt-4 text-xl text-gray-600"> For <span className="font-semibold text-indigo-700">{userInput.birthdayPersonName}</span>'s <span className="font-medium">{userInput.theme}</span> themed party! </p>
                        )}
                         <p className="mt-2 text-md text-gray-500">Select a plan to view details and edit.</p> {/* Updated instruction */}
                    </header>

                    {plans.length === 0 && !isLoading ? (
                         <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md mx-auto border border-gray-200">
                            {/* ... no plans UI ... */}
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">No Plans Available</h2>
                            <p className="text-gray-600 mb-6"> No plans were found or generated successfully. Please go back and try again. </p>
                            <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out" > Start Over </button>
                        </div>
                    ) : (
                        // Render Plan Cards grid - Removed Tabs and Tab Content Area
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {plans.map(plan => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    isSelected={plan.id === selectedPlanId} // Keep for styling selected card
                                    // ** CHANGED: onSelect now navigates **
                                    onSelect={() => handleNavigateToDetail(plan.id)}
                                    // ** REMOVED: onPlanUpdate prop is no longer passed **
                                />
                            ))}
                        </div>
                    )}
                     {/* Removed the global Start Over button and Tab logic */}
                </div>
                 {/* Error Snackbar */}
                 {error && !isLoading && (
                     <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center" role="alert">
                        {/* ... error snackbar ... */}
                     </div>
                )}
            </div>
        );
    }
    
