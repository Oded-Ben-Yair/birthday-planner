    // src/pages/Results.tsx
    import { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import PlanCard from '../components/PlanCard';
    import SmartInvitation from '../components/SmartInvitation';
    import BudgetOptimizer from '../components/BudgetOptimizer';
    import type { BirthdayPlan, UserInput } from '../types';

    /**
     * Cleans up plan data loaded from storage. Includes detailed logging.
     */
    const sanitizePlans = (plans: BirthdayPlan[]): BirthdayPlan[] => {
        console.log("--- Starting Sanitization ---");
    	if (!Array.isArray(plans)) {
    		console.error('sanitizePlans received non-array input:', plans);
    		return [];
    	}

    	const sanitized = plans.map((plan, index) => {
            console.log(`[Plan ${index + 1}] BEFORE Sanitization:`, JSON.parse(JSON.stringify(plan || {}))); // Log deep copy before

    		// Basic check if plan is not an object or is null
    		if (typeof plan !== 'object' || plan === null) {
    			console.warn(`[Plan ${index + 1}] Sanitizing encountered invalid plan item (not an object or null):`, plan);
    			// ** FIXED: Return the default object literal directly **
    			return {
    				id: `invalid-${Date.now()}-${Math.random()}`,
    				name: 'Invalid Plan Data',
    				description: 'Data could not be loaded correctly.',
    				profile: 'Unknown',
    				venue: { name: '', description: '', costRange: '', amenities: [], suitability: '', venueSearchSuggestions: [] },
    				schedule: [],
    				catering: { estimatedCost: '', servingStyle: '', menu: { appetizers: [], mainCourses: [], desserts: '', beverages: [] }, cateringSearchSuggestions: [] },
    				guestEngagement: { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [], techIntegration: [], entertainmentSearchSuggestions: [] },
                    optimizationSummary: undefined,
    			};
    		}

    		// Use optional chaining and nullish coalescing for safer access and default values
    		const sanitizedPlan: BirthdayPlan = {
    			// Ensure top-level fields exist and have correct types (or defaults)
                id: typeof plan.id === 'string' ? plan.id : `generated-${Date.now()}-${Math.random()}`,
                name: typeof plan.name === 'string' ? plan.name : 'Unnamed Plan',
                description: typeof plan.description === 'string' ? plan.description : '',
                profile: typeof plan.profile === 'string' ? plan.profile : 'Unknown',
                optimizationSummary: typeof plan.optimizationSummary === 'string' ? plan.optimizationSummary : undefined,

                // Sanitize nested objects and their fields
    			venue: { /* ... venue sanitization ... */ },
                schedule: Array.isArray(plan.schedule) ? plan.schedule.map(item => ({ /* ... schedule item sanitization ... */ })) : [],
    			catering: { /* ... catering sanitization ... */ },
    			guestEngagement: { /* ... guest engagement sanitization ... */ },
    		};
            // Re-paste the nested sanitization logic from results_debug_logging_1 if it was removed
            // Venue:
            sanitizedPlan.venue = {
                ...(plan.venue || {}),
                name: plan.venue?.name || '',
                description: plan.venue?.description || '',
                costRange: plan.venue?.costRange || '',
                amenities: Array.isArray(plan.venue?.amenities) ? plan.venue.amenities : [],
                suitability: plan.venue?.suitability || '',
                venueSearchSuggestions: Array.isArray(plan.venue?.venueSearchSuggestions) ? plan.venue.venueSearchSuggestions : [],
            };
            // Schedule:
            sanitizedPlan.schedule = Array.isArray(plan.schedule) ? plan.schedule.map(item => ({
                time: item?.time || '',
                activity: item?.activity || '',
                description: item?.description || undefined
            })) : [];
            // Catering:
            sanitizedPlan.catering = {
                ...(plan.catering || {}),
                estimatedCost: plan.catering?.estimatedCost || '',
                servingStyle: plan.catering?.servingStyle || '',
                menu: {
                    ...(plan.catering?.menu || {}),
                    appetizers: Array.isArray(plan.catering?.menu?.appetizers) ? plan.catering.menu.appetizers : [],
                    mainCourses: Array.isArray(plan.catering?.menu?.mainCourses) ? plan.catering.menu.mainCourses : [],
                    desserts: plan.catering?.menu?.desserts || '',
                    beverages: Array.isArray(plan.catering?.menu?.beverages) ? plan.catering.menu.beverages : [],
                },
                cateringSearchSuggestions: Array.isArray(plan.catering?.cateringSearchSuggestions) ? plan.catering.cateringSearchSuggestions : [],
            };
            // Guest Engagement:
            sanitizedPlan.guestEngagement = {
                ...(plan.guestEngagement || {}),
                icebreakers: Array.isArray(plan.guestEngagement?.icebreakers) ? plan.guestEngagement.icebreakers : [],
                interactiveElements: Array.isArray(plan.guestEngagement?.interactiveElements) ? plan.guestEngagement.interactiveElements : [],
                photoOpportunities: Array.isArray(plan.guestEngagement?.photoOpportunities) ? plan.guestEngagement.photoOpportunities : [],
                partyFavors: Array.isArray(plan.guestEngagement?.partyFavors) ? plan.guestEngagement.partyFavors : [],
                techIntegration: Array.isArray(plan.guestEngagement?.techIntegration) ? plan.guestEngagement.techIntegration : [],
                entertainmentSearchSuggestions: Array.isArray(plan.guestEngagement?.entertainmentSearchSuggestions) ? plan.guestEngagement.entertainmentSearchSuggestions : [],
            };


            console.log(`[Plan ${index + 1}] AFTER Sanitization:`, JSON.parse(JSON.stringify(sanitizedPlan))); // Log deep copy after
    		return sanitizedPlan;
    	});
        console.log("--- Finished Sanitization ---");
        return sanitized;
    };


    /**
     * Results page component: Displays generated plans and allows interaction via tabs.
     */
    export default function Results() {
        // State hooks
        const [plans, setPlans] = useState<BirthdayPlan[]>([]);
        const [userInput, setUserInput] = useState<UserInput | null>(null);
        const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
        const [activeTab, setActiveTab] = useState<'plans' | 'invitation' | 'budget'>('plans');
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [error, setError] = useState<string | null>(null);
        const [lastOptimizationSummary, setLastOptimizationSummary] = useState<string | null>(null);
        const navigate = useNavigate();

        // Effect to load data from localStorage
        useEffect(() => {
            console.log('Results component mounted. Loading data...');
            setIsLoading(true);
            setError(null);
            setLastOptimizationSummary(null);

            const storedPlans = localStorage.getItem('birthdayPlans');
            const storedUserInput = localStorage.getItem('userInput');

            if (!storedPlans || !storedUserInput) { /* ... error handling ... */ navigate('/'); return; }

            try {
                const parsedPlans: unknown = JSON.parse(storedPlans);
                const parsedUserInput: UserInput = JSON.parse(storedUserInput);
                if (!Array.isArray(parsedPlans)) { throw new Error('Stored plan data is corrupted (not an array).'); }
                console.log('Successfully parsed data.');
                const sanitizedLoadedPlans = sanitizePlans(parsedPlans as BirthdayPlan[]);
                console.log('Sanitization complete.');
                setPlans(sanitizedLoadedPlans);
                setUserInput(parsedUserInput);
                if (sanitizedLoadedPlans.length > 0 && sanitizedLoadedPlans[0]?.id) { setSelectedPlanId(sanitizedLoadedPlans[0].id); }
                else { setSelectedPlanId(null); }
            } catch (err) {
                console.error('Error processing stored data:', err);
                setError(`Failed to load plan data. It might be corrupted. ${err instanceof Error ? err.message : 'Unknown error'}`);
                localStorage.removeItem('birthdayPlans');
                localStorage.removeItem('userInput');
            } finally { setIsLoading(false); }
        }, [navigate]);

        // Derived state: Find the currently selected plan object
        const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

        /**
         * Handler to update the plans state and localStorage.
         * Now also checks for and stores optimization summary.
         */
        const handlePlanUpdate = (updatedPlan: BirthdayPlan) => {
            if (!updatedPlan?.id) { console.error("handlePlanUpdate received invalid plan:", updatedPlan); return; }

            // Check if this update contains an optimization summary
            if(updatedPlan.optimizationSummary) {
                setLastOptimizationSummary(updatedPlan.optimizationSummary);
                // We keep the summary in the plan object for now, could remove it before saving if needed
                // delete updatedPlan.optimizationSummary;
            } else {
                setLastOptimizationSummary(null);
            }

            const updatedPlans = plans.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan );
            setPlans(updatedPlans);

            try {
                localStorage.setItem('birthdayPlans', JSON.stringify(updatedPlans));
                console.log(`Plan ${updatedPlan.id} updated and saved to localStorage.`);
            } catch (err) {
                 console.error('Failed to update localStorage after plan update:', err);
                 setError('Could not save plan changes locally.');
            }
        };

        // --- Render Logic ---

        // Loading State UI
        if (isLoading) {
            return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-lg text-gray-600">Loading plans...</p>
                    </div>
                </div>
            );
        }

        // Error State UI
        if (error) {
             return (
                <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
                    <div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-md border border-red-200">
                        <h2 className="text-2xl font-semibold text-red-600 mb-4">Loading Error</h2>
                        <p className="text-gray-700 mb-6">{error}</p>
                        <button
                            onClick={() => { setError(null); navigate('/'); }}
                            className="px-6 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            );
        }

        // Main Content UI (Loaded, No Error)
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <header className="text-center mb-10"> {/* ... header ... */} </header>

                    {plans.length === 0 ? ( /* ... no plans UI ... */ ) : (
                        <>
                            {/* Tabs Navigation */}
                            <div className="mb-8 border-b border-gray-300"> {/* ... tabs ... */} </div>

                            {/* --- Tab Content Area --- */}
                            <div className="mt-6">
                                {/* Plans Tab Content */}
                                {activeTab === 'plans' && (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                                        {plans.map(plan => (
                                            <PlanCard
                                                key={plan.id}
                                                plan={plan}
                                                isSelected={plan.id === selectedPlanId}
                                                onSelect={() => plan.id && setSelectedPlanId(plan.id)}
                                                onPlanUpdate={handlePlanUpdate} // Pass handler
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Invitation Tab Content */}
                                {activeTab === 'invitation' && selectedPlan && ( /* ... invitation ... */ )}

                                {/* Budget Tab Content */}
                                {activeTab === 'budget' && selectedPlan && userInput && (
                                     <div className="max-w-4xl mx-auto space-y-6">
                                        {/* Display Optimization Summary */}
                                        {lastOptimizationSummary && (
                                            <div className="p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg shadow relative" role="alert">
                                                <strong className="font-bold block mb-1">Optimization Summary:</strong>
                                                <p className="text-sm">{lastOptimizationSummary}</p>
                                                <button onClick={() => setLastOptimizationSummary(null)} className="absolute top-1 right-1 text-green-600 hover:text-green-800 text-2xl font-bold leading-none p-1" aria-label="Dismiss summary"> <span>&times;</span> </button>
                                            </div>
                                        )}
                                        {/* Budget Optimizer Component */}
                                        <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8 border border-gray-200">
                                            <BudgetOptimizer
                                                selectedPlan={selectedPlan}
                                                onPlanUpdate={handlePlanUpdate}
                                                numericBudget={userInput.budgetAmount}
                                                currency={userInput.currency}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Start Over Button */}
                            <div className="mt-16 text-center"> {/* ... start over button ... */} </div>
                        </>
                    )}
                </div>
                {/* Error Snackbar */}
                 {error && !isLoading && ( /* ... error snackbar ... */ )}
            </div>
        );
    }
    
