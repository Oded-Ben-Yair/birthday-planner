    // src/pages/Results.tsx
    import { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import PlanCard from '../components/PlanCard'; // PlanCard no longer needs onPlanUpdate
    import SmartInvitation from '../components/SmartInvitation';
    import BudgetOptimizer from '../components/BudgetOptimizer';
    import type { BirthdayPlan, UserInput } from '../types';

    /**
     * Cleans up plan data loaded from storage. Includes detailed logging.
     */
    const sanitizePlans = (plans: BirthdayPlan[]): BirthdayPlan[] => {
        console.log("--- Starting Sanitization ---");
        if (!Array.isArray(plans)) { /* ... */ return []; }
        const sanitized = plans.map((plan, index) => {
            // console.log(`[Plan ${index + 1}] BEFORE Sanitization:`, JSON.parse(JSON.stringify(plan || {})));
            if (typeof plan !== 'object' || plan === null) { /* ... return default plan ... */ }
            // Sanitize structure (ensure all keys exist and arrays are arrays)
            const sanitizedPlan: BirthdayPlan = { /* ... full sanitization logic ... */ };
            // Re-paste the full sanitization logic from results_fix_syntax_2 here
            // Basic check
            if (typeof plan !== 'object' || plan === null) {
                console.warn(`[Plan ${index + 1}] Sanitizing encountered invalid plan item (not an object or null):`, plan);
                return {
                    id: `invalid-${Date.now()}-${Math.random()}`, name: 'Invalid Plan Data', description: 'Data could not be loaded correctly.', profile: 'Unknown',
                    venue: { name: '', description: '', costRange: '', amenities: [], suitability: '', venueSearchSuggestions: [] },
                    schedule: [],
                    catering: { estimatedCost: '', servingStyle: '', menu: { appetizers: [], mainCourses: [], desserts: '', beverages: [] }, cateringSearchSuggestions: [] },
                    guestEngagement: { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [], techIntegration: [], entertainmentSearchSuggestions: [] },
                    optimizationSummary: undefined,
                };
            }
            // Full sanitization
             sanitizedPlan.id = typeof plan.id === 'string' ? plan.id : `generated-${Date.now()}-${Math.random()}`;
             sanitizedPlan.name = typeof plan.name === 'string' ? plan.name : 'Unnamed Plan';
             sanitizedPlan.description = typeof plan.description === 'string' ? plan.description : '';
             sanitizedPlan.profile = typeof plan.profile === 'string' ? plan.profile : 'Unknown';
             sanitizedPlan.optimizationSummary = typeof plan.optimizationSummary === 'string' ? plan.optimizationSummary : undefined;
             sanitizedPlan.venue = {
                ...(plan.venue || {}), name: plan.venue?.name || '', description: plan.venue?.description || '', costRange: plan.venue?.costRange || '',
                amenities: Array.isArray(plan.venue?.amenities) ? plan.venue.amenities : [], suitability: plan.venue?.suitability || '',
                venueSearchSuggestions: Array.isArray(plan.venue?.venueSearchSuggestions) ? plan.venue.venueSearchSuggestions : [],
             };
             sanitizedPlan.schedule = Array.isArray(plan.schedule) ? plan.schedule.map(item => ({ time: item?.time || '', activity: item?.activity || '', description: item?.description || undefined })) : [];
             sanitizedPlan.catering = {
                ...(plan.catering || {}), estimatedCost: plan.catering?.estimatedCost || '', servingStyle: plan.catering?.servingStyle || '',
                menu: { ...(plan.catering?.menu || {}), appetizers: Array.isArray(plan.catering?.menu?.appetizers) ? plan.catering.menu.appetizers : [], mainCourses: Array.isArray(plan.catering?.menu?.mainCourses) ? plan.catering.menu.mainCourses : [], desserts: plan.catering?.menu?.desserts || '', beverages: Array.isArray(plan.catering?.menu?.beverages) ? plan.catering.menu.beverages : [], },
                cateringSearchSuggestions: Array.isArray(plan.catering?.cateringSearchSuggestions) ? plan.catering.cateringSearchSuggestions : [],
             };
             sanitizedPlan.guestEngagement = {
                ...(plan.guestEngagement || {}), icebreakers: Array.isArray(plan.guestEngagement?.icebreakers) ? plan.guestEngagement.icebreakers : [], interactiveElements: Array.isArray(plan.guestEngagement?.interactiveElements) ? plan.guestEngagement.interactiveElements : [], photoOpportunities: Array.isArray(plan.guestEngagement?.photoOpportunities) ? plan.guestEngagement.photoOpportunities : [], partyFavors: Array.isArray(plan.guestEngagement?.partyFavors) ? plan.guestEngagement.partyFavors : [], techIntegration: Array.isArray(plan.guestEngagement?.techIntegration) ? plan.guestEngagement.techIntegration : [], entertainmentSearchSuggestions: Array.isArray(plan.guestEngagement?.entertainmentSearchSuggestions) ? plan.guestEngagement.entertainmentSearchSuggestions : [],
             };


            // console.log(`[Plan ${index + 1}] AFTER Sanitization:`, JSON.parse(JSON.stringify(sanitizedPlan)));
            return sanitizedPlan;
        });
        console.log("--- Finished Sanitization ---");
        return sanitized;
    };


    /**
     * Results page component: Displays generated plans and allows navigation to detail view.
     */
    export default function Results() {
        // State hooks
        const [plans, setPlans] = useState<BirthdayPlan[]>([]);
        const [userInput, setUserInput] = useState<UserInput | null>(null);
        const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null); // Keep for highlighting
        // const [activeTab, setActiveTab] = useState<'plans' | 'invitation' | 'budget'>('plans'); // Tabs removed for now
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [error, setError] = useState<string | null>(null);
        // const [lastOptimizationSummary, setLastOptimizationSummary] = useState<string | null>(null); // Summary display moved to detail page
        const navigate = useNavigate();

        // Effect to load data from localStorage
        useEffect(() => {
            console.log('Results component mounted. Loading data...');
            setIsLoading(true); setError(null); // setLastOptimizationSummary(null);
            const storedPlans = localStorage.getItem('birthdayPlans');
            const storedUserInput = localStorage.getItem('userInput');
            if (!storedPlans || !storedUserInput) { navigate('/'); return; } // Redirect if no data
            try {
                const parsedPlans: unknown = JSON.parse(storedPlans);
                const parsedUserInput: UserInput = JSON.parse(storedUserInput);
                if (!Array.isArray(parsedPlans)) { throw new Error('Stored plan data is corrupted (not an array).'); }
                console.log('Successfully parsed data.');
                const sanitizedLoadedPlans = sanitizePlans(parsedPlans as BirthdayPlan[]);
                console.log('Sanitization complete.');
                setPlans(sanitizedLoadedPlans); setUserInput(parsedUserInput);
                // Don't auto-select here anymore, selection happens on click before navigate
                // if (sanitizedLoadedPlans.length > 0 && sanitizedLoadedPlans[0]?.id) { setSelectedPlanId(sanitizedLoadedPlans[0].id); } else { setSelectedPlanId(null); }
            } catch (err) {
                console.error('Error processing stored data:', err);
                setError(`Failed to load plan data. ${err instanceof Error ? err.message : ''}`);
                localStorage.removeItem('birthdayPlans'); localStorage.removeItem('userInput');
            } finally { setIsLoading(false); }
        }, [navigate]);

        // ** REMOVED handlePlanUpdate - will be handled in PlanDetail page **

        /**
         * Handles selecting a plan and navigating to its detail page.
         * @param planId - The ID of the plan to navigate to.
         */
        const handleSelectAndNavigate = (planId: string | null) => {
            if (!planId) return;
            setSelectedPlanId(planId); // Highlight briefly (optional)
            console.log(`Navigating to plan detail for ID: ${planId}`);
            navigate(`/plan/${planId}`); // Navigate to the new route
        };

        // --- Render Logic ---
        if (isLoading) { /* ... loading UI ... */ }
        if (error) { /* ... error UI ... */ }

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <header className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl">Your Generated Plans</h1>
                        {userInput?.birthdayPersonName && userInput?.theme && (
                            <p className="mt-4 text-xl text-gray-600"> For <span className="font-semibold text-indigo-700">{userInput.birthdayPersonName}</span>'s <span className="font-medium">{userInput.theme}</span> themed party! </p>
                        )}
                         <p className="mt-2 text-md text-gray-500">Click on a plan to view details and edit.</p> {/* Added instruction */}
                    </header>

                    {plans.length === 0 && !isLoading ? ( // Show no plans only if not loading
                         <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md mx-auto border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">No Plans Available</h2>
                            <p className="text-gray-600 mb-6"> No plans were found or generated successfully. Please go back and try again. </p>
                            <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out" > Start Over </button>
                        </div>
                    ) : (
                        // Render Plan Cards grid (No Tabs anymore)
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {plans.map(plan => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    isSelected={plan.id === selectedPlanId} // Still used for visual highlight if desired
                                    // ** CHANGED: onSelect now navigates **
                                    onSelect={() => handleSelectAndNavigate(plan.id)}
                                    // ** REMOVED: onPlanUpdate prop is no longer needed here **
                                    // onPlanUpdate={handlePlanUpdate}
                                />
                            ))}
                        </div>
                    )}

                     {/* Removed the global Start Over button from here - can be added elsewhere if needed */}
                </div>
                 {/* Error Snackbar */}
                 {error && !isLoading && ( /* ... error snackbar ... */ )}
            </div>
        );
    }

    
