import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../components/PlanCard';
import SmartInvitation from '../components/SmartInvitation';
import BudgetOptimizer from '../components/BudgetOptimizer';
import type { BirthdayPlan, UserInput } from '../types'; // Assuming '../types' defines the structure accurately

/**
 * Cleans up plan data loaded from storage.
 * Ensures that properties expected to be arrays are arrays.
 * This prevents errors if data was saved incorrectly.
 *
 * @param plans - The array of BirthdayPlan objects to sanitize.
 * @returns A new array with sanitized BirthdayPlan objects.
 */
const sanitizePlans = (plans: BirthdayPlan[]): BirthdayPlan[] => {
	// Handle cases where input might not be an array (defensive programming)
	if (!Array.isArray(plans)) {
		console.error('sanitizePlans received non-array input:', plans);
		return []; // Return empty array if input is invalid
	}

	return plans.map((plan) => {
		// Basic check if plan is not an object or is null
		if (typeof plan !== 'object' || plan === null) {
			console.warn('Sanitizing encountered invalid plan item:', plan);
			// Return a default valid structure or null depending on how you want to handle
			// Returning null might require filtering later: return null;
			// Returning default might be safer for rendering:
			return { id: `invalid-${Date.now()}`, name: 'Invalid Plan Data', description: '', venue: { amenities: [] }, schedule: [], catering: { menu: { appetizers: [], mainCourses: [], desserts: '', beverages: [] } }, guestEngagement: { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [], techIntegration: [] } };
		}

		// Use optional chaining and nullish coalescing for safer access
		const sanitizedPlan = {
			...plan, // Spread existing valid properties
			// Ensure nested objects exist before accessing their properties
			venue: {
				...(plan.venue || {}), // Ensure venue object exists
				amenities: Array.isArray(plan.venue?.amenities) ? plan.venue.amenities : [],
			},
			schedule: Array.isArray(plan.schedule) ? plan.schedule : [],
			catering: {
				...(plan.catering || {}), // Ensure catering object exists
				menu: {
					...(plan.catering?.menu || {}), // Ensure menu object exists
					appetizers: Array.isArray(plan.catering?.menu?.appetizers) ? plan.catering.menu.appetizers : [],
					mainCourses: Array.isArray(plan.catering?.menu?.mainCourses) ? plan.catering.menu.mainCourses : [],
					desserts: plan.catering?.menu?.desserts || '', // Keep as string or default
					beverages: Array.isArray(plan.catering?.menu?.beverages) ? plan.catering.menu.beverages : [],
				},
			},
			guestEngagement: {
				...(plan.guestEngagement || {}), // Ensure guestEngagement object exists
				icebreakers: Array.isArray(plan.guestEngagement?.icebreakers) ? plan.guestEngagement.icebreakers : [],
				interactiveElements: Array.isArray(plan.guestEngagement?.interactiveElements) ? plan.guestEngagement.interactiveElements : [],
				photoOpportunities: Array.isArray(plan.guestEngagement?.photoOpportunities) ? plan.guestEngagement.photoOpportunities : [],
				partyFavors: Array.isArray(plan.guestEngagement?.partyFavors) ? plan.guestEngagement.partyFavors : [],
				techIntegration: Array.isArray(plan.guestEngagement?.techIntegration) ? plan.guestEngagement.techIntegration : [],
			},
		};

		// Log if sanitization actually changed something (optional, for debugging)
        // This requires comparing original plan parts with sanitized ones, can be complex.
        // Simplified logging based on Array.isArray checks above is usually sufficient.

		return sanitizedPlan;
	});
    // Filter out any null plans if you chose to return null for invalid items above
    // .filter(plan => plan !== null);
};


export default function Results() {
	const [plans, setPlans] = useState<BirthdayPlan[]>([]);
	const [userInput, setUserInput] = useState<UserInput | null>(null);
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'plans' | 'invitation' | 'budget'>('plans');
	const [isLoading, setIsLoading] = useState<boolean>(true); // Explicit loading state
	const [error, setError] = useState<string | null>(null); // Explicit error state
	const navigate = useNavigate();

	useEffect(() => {
		console.log('Results component mounted. Attempting to load data from localStorage.');
		setIsLoading(true); // Start loading
		setError(null); // Reset error on load attempt

		// Retrieve plans and user input from localStorage
		const storedPlans = localStorage.getItem('birthdayPlans');
		const storedUserInput = localStorage.getItem('userInput');

		if (!storedPlans || !storedUserInput) {
			console.error('Required data not found in localStorage. Redirecting to home.');
			setError('Could not load plan data. Please start over.');
			localStorage.removeItem('birthdayPlans'); // Clean up potentially partial data
			localStorage.removeItem('userInput');
			setIsLoading(false);
			navigate('/'); // Redirect immediately
			return; // Stop further execution in useEffect
		}

		try {
			const parsedPlans: unknown = JSON.parse(storedPlans); // Parse as unknown first
			const parsedUserInput: UserInput = JSON.parse(storedUserInput); // Assuming UserInput structure is reliable

            // Validate and sanitize plans
            if (!Array.isArray(parsedPlans)) {
                 console.error('Stored birthdayPlans data is not an array:', parsedPlans);
                 throw new Error('Stored plan data is corrupted (not an array).');
            }

			console.log('Successfully parsed data from localStorage.');

			// ** SANITIZE THE LOADED PLANS **
            // Cast to BirthdayPlan[] for sanitization function (after Array.isArray check)
			const sanitizedLoadedPlans = sanitizePlans(parsedPlans as BirthdayPlan[]);
			console.log('Sanitization complete.');

			setPlans(sanitizedLoadedPlans);
			setUserInput(parsedUserInput);

			// Select the first plan by default if plans exist
			if (sanitizedLoadedPlans && sanitizedLoadedPlans.length > 0 && sanitizedLoadedPlans[0]?.id) {
                // Ensure the first plan and its ID exist before setting
				setSelectedPlanId(sanitizedLoadedPlans[0].id);
			} else {
				// Handle case where plans array might be empty or invalid after sanitization
				console.warn('Loaded plans array is empty or invalid after sanitization.');
				setSelectedPlanId(null);
			}

		} catch (err) {
			console.error('Error processing stored data:', err);
			setError(`Failed to load plans. Data might be corrupted. ${err instanceof Error ? err.message : ''}`);
			// Clear potentially corrupted data
			localStorage.removeItem('birthdayPlans');
			localStorage.removeItem('userInput');
			// Don't redirect immediately from here, let the error message show
            // navigate('/');
		} finally {
			setIsLoading(false); // Ensure loading is set to false in all cases
		}
	}, [navigate]); // Dependency array includes navigate

	// Find the selected plan based on ID *after* state updates
	const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

	// Handler for updating a plan (e.g., after budget optimization)
	const handlePlanUpdate = (updatedPlan: BirthdayPlan) => {
         // Ensure updatedPlan and its id are valid
        if (!updatedPlan?.id) {
             console.error("handlePlanUpdate received invalid plan:", updatedPlan);
             return;
        }
		const updatedPlans = plans.map(plan =>
			plan.id === updatedPlan.id ? updatedPlan : plan
		);
        setPlans(updatedPlans); // Update state

		// Update localStorage with the latest plans
        try {
		    localStorage.setItem('birthdayPlans', JSON.stringify(updatedPlans));
        } catch (err) {
             console.error('Failed to update localStorage after plan update:', err);
             setError('Could not save plan changes to local storage.');
        }
	};

	// Render Loading State
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="text-center">
					<p className="text-lg text-gray-600">Loading plans...</p>
					{/* Optional: Add a spinner here */}
				</div>
			</div>
		);
	}

    // Render Error State (if not loading and error exists)
    if (error) {
         return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="text-center bg-white p-8 rounded shadow-md max-w-md">
                    <h2 className="text-xl font-semibold text-red-600 mb-4">Loading Error</h2>
					<p className="text-gray-700 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-150 ease-in-out"
                    >
                        Start Over
                    </button>
				</div>
			</div>
        );
    }

	// Main render logic once data is loaded and no error
	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-7xl mx-auto"> {/* Increased max-width */}
				<header className="text-center mb-10">
					<h1 className="text-4xl font-bold text-gray-900 tracking-tight">Your Birthday Plans</h1>
					{/* Added null check for userInput */}
					{userInput?.theme && (
						<p className="mt-3 text-lg text-gray-600">
							Based on your preferences for a <span className="font-medium">{userInput.theme}</span> themed birthday.
						</p>
					)}
				</header>

            {/* --- Render Tabs and Content --- */}
            {/* Check if there are actually plans to display */}
            {plans.length === 0 ? (
                 <div className="text-center bg-white p-8 rounded shadow-md max-w-md mx-auto">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">No Plans Found</h2>
					<p className="text-gray-600 mb-6">
                        It seems no plans were generated or loaded correctly. Please try again.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-150 ease-in-out"
                    >
                        Start Over
                    </button>
				</div>
            ) : (
                <>
                    {/* Tabs Section */}
                    <div className="mb-8 border-b border-gray-200">
                        <div className="flex flex-wrap -mb-px space-x-4" aria-label="Tabs">
                             {/* Tab Button: Birthday Plans */}
                            <button
                                onClick={() => setActiveTab('plans')}
                                className={`px-4 py-3 font-semibold text-sm rounded-t-md focus:outline-none transition-colors duration-150 ${
                                    activeTab === 'plans'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Birthday Plans ({plans.length})
                            </button>
                             {/* Tab Button: Smart Invitation */}
                            <button
                                onClick={() => setActiveTab('invitation')}
                                disabled={!selectedPlan} // Disable if no plan is selected
                                className={`px-4 py-3 font-semibold text-sm rounded-t-md focus:outline-none transition-colors duration-150 ${
                                    activeTab === 'invitation'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } ${!selectedPlan ? 'opacity-50 cursor-not-allowed' : ''}`} // Style when disabled
                            >
                                Smart Invitation
                            </button>
                            {/* Tab Button: Budget Optimizer */}
                            <button
                                onClick={() => setActiveTab('budget')}
                                disabled={!selectedPlan} // Disable if no plan is selected
                                className={`px-4 py-3 font-semibold text-sm rounded-t-md focus:outline-none transition-colors duration-150 ${
                                    activeTab === 'budget'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } ${!selectedPlan ? 'opacity-50 cursor-not-allowed' : ''}`} // Style when disabled
                            >
                                Budget Optimizer
                            </button>
                        </div>
                    </div>

                    {/* --- Tab Content --- */}
                    {/* Plans Tab */}
                    {activeTab === 'plans' && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"> {/* Adjusted grid cols */}
                             {/* This map requires 'plans' to be a valid array, ensured by checks above */}
                            {plans.map(plan => (
                                <PlanCard
                                    // Ensure plan and plan.id exist. The sanitization function tries to ensure this.
                                    key={plan?.id || `plan-${Math.random()}`} // Use random key as fallback if id missing after sanitization
                                    plan={plan}
                                    isSelected={plan?.id === selectedPlanId}
                                    onSelect={() => plan?.id && setSelectedPlanId(plan.id)} // Only select if plan.id exists
                                />
                            ))}
                        </div>
                    )}

                    {/* Invitation Tab */}
                    {activeTab === 'invitation' && selectedPlan && (
                        <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8 max-w-4xl mx-auto"> {/* Added shadow, padding, max-width */}
                            <SmartInvitation selectedPlan={selectedPlan} />
                        </div>
                    )}

                    {/* Budget Tab */}
                    {activeTab === 'budget' && selectedPlan && (
                         <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8 max-w-4xl mx-auto"> {/* Added shadow, padding, max-width */}
                            <BudgetOptimizer
                                selectedPlan={selectedPlan}
                                onPlanUpdate={handlePlanUpdate}
                            />
                        </div>
                    )}

                    {/* Start Over Button */}
                    <div className="mt-16 text-center"> {/* Increased margin */}
                        <button
                            onClick={() => {
                                // Optional: Clear storage when starting over explicitly
                                // localStorage.removeItem('birthdayPlans');
                                // localStorage.removeItem('userInput');
                                navigate('/');
                            }}
                            className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            Start Over
                        </button>
                    </div>
                </>
            )}
			</div>
		</div>
	);
}
