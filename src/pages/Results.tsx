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

    		if (typeof plan !== 'object' || plan === null) {
    			console.warn(`[Plan ${index + 1}] Sanitizing encountered invalid plan item (not an object or null):`, plan);
    			// Return a default valid structure
    			return {
    				id: `invalid-${Date.now()}-${Math.random()}`, name: 'Invalid Plan Data', description: 'Data could not be loaded correctly.', profile: 'Unknown',
                    venue: { name: '', description: '', costRange: '', amenities: [], suitability: '', venueSearchSuggestions: [] },
                    schedule: [],
                    catering: { estimatedCost: '', servingStyle: '', menu: { appetizers: [], mainCourses: [], desserts: '', beverages: [] }, cateringSearchSuggestions: [] },
                    guestEngagement: { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [], techIntegration: [], entertainmentSearchSuggestions: [] },
                    optimizationSummary: undefined,
    			};
    		}

    		// Sanitize structure (ensure all keys exist and arrays are arrays)
    		const sanitizedPlan: BirthdayPlan = {
                id: typeof plan.id === 'string' ? plan.id : `generated-${Date.now()}-${Math.random()}`,
                name: typeof plan.name === 'string' ? plan.name : 'Unnamed Plan',
                description: typeof plan.description === 'string' ? plan.description : '',
                profile: typeof plan.profile === 'string' ? plan.profile : 'Unknown',
                optimizationSummary: typeof plan.optimizationSummary === 'string' ? plan.optimizationSummary : undefined,
    			venue: {
    				name: plan.venue?.name || '', description: plan.venue?.description || '', costRange: plan.venue?.costRange || '',
    				amenities: Array.isArray(plan.venue?.amenities) ? plan.venue.amenities : [], suitability: plan.venue?.suitability || '',
    				venueSearchSuggestions: Array.isArray(plan.venue?.venueSearchSuggestions) ? plan.venue.venueSearchSuggestions : [],
    			},
    			schedule: Array.isArray(plan.schedule) ? plan.schedule.map(item => ({ time: item?.time || '', activity: item?.activity || '', description: item?.description || undefined })) : [],
    			catering: {
    				estimatedCost: plan.catering?.estimatedCost || '', servingStyle: plan.catering?.servingStyle || '',
    				menu: {
    					appetizers: Array.isArray(plan.catering?.menu?.appetizers) ? plan.catering.menu.appetizers : [],
    					mainCourses: Array.isArray(plan.catering?.menu?.mainCourses) ? plan.catering.menu.mainCourses : [],
    					desserts: plan.catering?.menu?.desserts || '',
    					beverages: Array.isArray(plan.catering?.menu?.beverages) ? plan.catering.menu.beverages : [],
    				},
    				cateringSearchSuggestions: Array.isArray(plan.catering?.cateringSearchSuggestions) ? plan.catering.cateringSearchSuggestions : [],
    			},
    			guestEngagement: {
    				icebreakers: Array.isArray(plan.guestEngagement?.icebreakers) ? plan.guestEngagement.icebreakers : [],
    				interactiveElements: Array.isArray(plan.guestEngagement?.interactiveElements) ? plan.guestEngagement.interactiveElements : [],
    				photoOpportunities: Array.isArray(plan.guestEngagement?.photoOpportunities) ? plan.guestEngagement.photoOpportunities : [],
    				partyFavors: Array.isArray(plan.guestEngagement?.partyFavors) ? plan.guestEngagement.partyFavors : [],
    				techIntegration: Array.isArray(plan.guestEngagement?.techIntegration) ? plan.guestEngagement.techIntegration : [],
    				entertainmentSearchSuggestions: Array.isArray(plan.guestEngagement?.entertainmentSearchSuggestions) ? plan.guestEngagement.entertainmentSearchSuggestions : [],
    			},
    		};
            console.log(`[Plan ${index + 1}] AFTER Sanitization:`, JSON.parse(JSON.stringify(sanitizedPlan)));
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
            setIsLoading(true); setError(null); setLastOptimizationSummary(null);
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
                setPlans(sanitizedLoadedPlans); setUserInput(parsedUserInput);
                if (sanitizedLoadedPlans.length > 0 && sanitizedLoadedPlans[0]?.id) { setSelectedPlanId(sanitizedLoadedPlans[0].id); } else { setSelectedPlanId(null); }
            } catch (err) { /* ... error handling ... */ }
            finally { setIsLoading(false); }
        }, [navigate]);

        // Derived state: Find the currently selected plan object
        const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

        /**
         * Handler to update the plans state and localStorage.
         */
        const handlePlanUpdate = (updatedPlan: BirthdayPlan) => {
            if (!updatedPlan?.id) { console.error("handlePlanUpdate received invalid plan:", updatedPlan); return; }
            if(updatedPlan.optimizationSummary) { setLastOptimizationSummary(updatedPlan.optimizationSummary); } else { setLastOptimizationSummary(null); }
            const updatedPlans = plans.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan );
            setPlans(updatedPlans);
            try { localStorage.setItem('birthdayPlans', JSON.stringify(updatedPlans)); console.log(`Plan ${updatedPlan.id} updated and saved.`); }
            catch (err) { console.error('Failed to update localStorage:', err); setError('Could not save plan changes locally.'); }
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
                        <button onClick={() => { setError(null); navigate('/'); }} className="px-6 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-150 ease-in-out" > Start Over </button>
                    </div>
                </div>
            );
        }

        // Main Content UI (Loaded, No Error)
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <header className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl">Your Birthday Plans</h1>
                        {userInput?.birthdayPersonName && userInput?.theme && (
                            <p className="mt-4 text-xl text-gray-600"> For <span className="font-semibold text-indigo-700">{userInput.birthdayPersonName}</span>'s <span className="font-medium">{userInput.theme}</span> themed party! </p>
                        )}
                    </header>

                    {/* ** FIXED: Render actual UI for no plans case ** */}
                    {plans.length === 0 ? (
                         <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md mx-auto border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">No Plans Available</h2>
                            <p className="text-gray-600 mb-6"> No plans were found or generated successfully. Please go back and try again. </p>
                            <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out" > Start Over </button>
                        </div>
                    ) : (
                        // Render Tabs and Content if plans exist
                        <>
                            {/* Tabs Navigation */}
                            <div className="mb-8 border-b border-gray-300">
                                <div className="flex flex-wrap -mb-px space-x-1 sm:space-x-4" aria-label="Tabs">
                                    {/* ... tab buttons ... */}
                                    <button onClick={() => setActiveTab('plans')} className={`px-3 py-3 sm:px-4 font-semibold text-sm rounded-t-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 transition-colors duration-150 ${ activeTab === 'plans' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400' }`} > Birthday Plans ({plans.length}) </button>
                                    <button onClick={() => setActiveTab('invitation')} disabled={!selectedPlan} className={`px-3 py-3 sm:px-4 font-semibold text-sm rounded-t-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 transition-colors duration-150 ${ activeTab === 'invitation' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400' } ${!selectedPlan ? 'opacity-50 cursor-not-allowed' : ''}`} > Smart Invitation </button>
                                    <button onClick={() => setActiveTab('budget')} disabled={!selectedPlan || !userInput} className={`px-3 py-3 sm:px-4 font-semibold text-sm rounded-t-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 transition-colors duration-150 ${ activeTab === 'budget' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400' } ${!selectedPlan || !userInput ? 'opacity-50 cursor-not-allowed' : ''}`} > Budget Optimizer </button>
                                </div>
                            </div>

                            {/* --- Tab Content Area --- */}
                            <div className="mt-6">
                                {/* Plans Tab Content */}
                                {activeTab === 'plans' && (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                                        {plans.map(plan => (
                                            <PlanCard key={plan.id} plan={plan} isSelected={plan.id === selectedPlanId} onSelect={() => plan.id && setSelectedPlanId(plan.id)} onPlanUpdate={handlePlanUpdate} />
                                        ))}
                                    </div>
                                )}

                                {/* Invitation Tab Content */}
                                {activeTab === 'invitation' && selectedPlan && (
                                    <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8 max-w-4xl mx-auto border border-gray-200">
                                        <SmartInvitation selectedPlan={selectedPlan} />
                                    </div>
                                )}

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
                                            <BudgetOptimizer selectedPlan={selectedPlan} onPlanUpdate={handlePlanUpdate} numericBudget={userInput.budgetAmount} currency={userInput.currency} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Start Over Button */}
                            <div className="mt-16 text-center">
                                <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition duration-150 ease-in-out" > Start Over </button>
                            </div>
                        </>
                    )}
                </div>
                 {/* Error Snackbar */}
                 {error && !isLoading && (
                     <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center" role="alert">
                        <div> <strong className="font-bold block">Error!</strong> <span className="block sm:inline">{error}</span> </div>
                        <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700 text-2xl font-bold leading-none" aria-label="Close"> <span>&times;</span> </button>
                     </div>
                )}
            </div>
        );
    }

    
