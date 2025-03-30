// src/pages/Results.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../components/PlanCard';
import SmartInvitation from '../components/SmartInvitation';
import BudgetOptimizer from '../components/BudgetOptimizer';
// Ensure types are imported correctly, including UserInput
import type { BirthdayPlan, UserInput, BudgetPriorities } from '../types'; // Assuming BudgetPriorities is also needed here or in BudgetOptimizer itself

/**
 * Cleans up plan data loaded from storage.
 * Ensures that properties expected to be arrays are arrays.
 * More robust against data corruption or AI inconsistencies.
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
			// Return a default valid structure to prevent errors down the line
			// Ensure this default structure matches the latest BirthdayPlan type
			return {
				id: `invalid-${Date.now()}-${Math.random()}`,
				name: 'Invalid Plan Data',
				description: 'Data could not be loaded correctly.',
				profile: 'Unknown',
				venue: { name: '', description: '', costRange: '', amenities: [], suitability: '', venueSearchSuggestions: [] },
				schedule: [],
				catering: { estimatedCost: '', servingStyle: '', menu: { appetizers: [], mainCourses: [], desserts: '', beverages: [] }, cateringSearchSuggestions: [] },
				guestEngagement: { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [], techIntegration: [], entertainmentSearchSuggestions: [] }
			};
		}

		// Use optional chaining and nullish coalescing for safer access and default values
		const sanitizedPlan = {
			...plan, // Spread existing valid properties
			// Ensure nested objects exist before accessing their properties
			venue: {
				...(plan.venue || {}), // Ensure venue object exists
				name: plan.venue?.name || '',
				description: plan.venue?.description || '',
				costRange: plan.venue?.costRange || '',
				amenities: Array.isArray(plan.venue?.amenities) ? plan.venue.amenities : [],
				suitability: plan.venue?.suitability || '',
				venueSearchSuggestions: Array.isArray(plan.venue?.venueSearchSuggestions) ? plan.venue.venueSearchSuggestions : [],
			},
			schedule: Array.isArray(plan.schedule) ? plan.schedule : [],
			catering: {
				...(plan.catering || {}), // Ensure catering object exists
				estimatedCost: plan.catering?.estimatedCost || '',
				servingStyle: plan.catering?.servingStyle || '',
				menu: {
					...(plan.catering?.menu || {}), // Ensure menu object exists
					appetizers: Array.isArray(plan.catering?.menu?.appetizers) ? plan.catering.menu.appetizers : [],
					mainCourses: Array.isArray(plan.catering?.menu?.mainCourses) ? plan.catering.menu.mainCourses : [],
					desserts: plan.catering?.menu?.desserts || '', // Keep as string or default
					beverages: Array.isArray(plan.catering?.menu?.beverages) ? plan.catering.menu.beverages : [],
				},
				cateringSearchSuggestions: Array.isArray(plan.catering?.cateringSearchSuggestions) ? plan.catering.cateringSearchSuggestions : [],
			},
			guestEngagement: {
				...(plan.guestEngagement || {}), // Ensure guestEngagement object exists
				icebreakers: Array.isArray(plan.guestEngagement?.icebreakers) ? plan.guestEngagement.icebreakers : [],
				interactiveElements: Array.isArray(plan.guestEngagement?.interactiveElements) ? plan.guestEngagement.interactiveElements : [],
				photoOpportunities: Array.isArray(plan.guestEngagement?.photoOpportunities) ? plan.guestEngagement.photoOpportunities : [],
				partyFavors: Array.isArray(plan.guestEngagement?.partyFavors) ? plan.guestEngagement.partyFavors : [],
				techIntegration: Array.isArray(plan.guestEngagement?.techIntegration) ? plan.guestEngagement.techIntegration : [],
				entertainmentSearchSuggestions: Array.isArray(plan.guestEngagement?.entertainmentSearchSuggestions) ? plan.guestEngagement.entertainmentSearchSuggestions : [],
			},
			// Ensure other top-level fields exist
			id: plan.id || `generated-${Date.now()}-${Math.random()}`,
			name: plan.name || 'Unnamed Plan',
			description: plan.description || '',
			profile: plan.profile || 'Unknown',
		};

		return sanitizedPlan;
	});
};


/**
 * Results page component: Displays generated plans and allows interaction via tabs.
 */
export default function Results() {
	// State hooks
	const [plans, setPlans] = useState<BirthdayPlan[]>([]);
	const [userInput, setUserInput] = useState<UserInput | null>(null); // Holds original user input
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'plans' | 'invitation' | 'budget'>('plans');
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate(); // Hook for navigation

	// Effect to load data from localStorage on component mount
	useEffect(() => {
		console.log('Results component mounted. Loading data...');
		setIsLoading(true);
		setError(null);

		const storedPlans = localStorage.getItem('birthdayPlans');
		const storedUserInput = localStorage.getItem('userInput'); // Load original user input

		// Check if essential data exists
		if (!storedPlans || !storedUserInput) {
			console.error('Required data (plans or userInput) not found in localStorage. Redirecting.');
			setError('Could not load plan data. Please start over.');
			localStorage.removeItem('birthdayPlans');
			localStorage.removeItem('userInput');
			setIsLoading(false);
			navigate('/');
			return;
		}

		try {
			// Parse data, assuming UserInput structure is reliable, parse plans as unknown first
			const parsedPlans: unknown = JSON.parse(storedPlans);
			const parsedUserInput: UserInput = JSON.parse(storedUserInput);

			// Validate that parsedPlans is an array before proceeding
			if (!Array.isArray(parsedPlans)) {
				 console.error('Stored birthdayPlans data is not an array:', parsedPlans);
				 throw new Error('Stored plan data is corrupted (not an array).');
			}

			console.log('Successfully parsed data.');

			// Sanitize the loaded plans to ensure data integrity
			const sanitizedLoadedPlans = sanitizePlans(parsedPlans as BirthdayPlan[]); // Cast after check
			console.log('Sanitization complete.');

			// Update state
			setPlans(sanitizedLoadedPlans);
			setUserInput(parsedUserInput); // Store the loaded user input

			// Select the first plan by default if available
			if (sanitizedLoadedPlans.length > 0 && sanitizedLoadedPlans[0]?.id) {
				setSelectedPlanId(sanitizedLoadedPlans[0].id);
			} else {
				console.warn('No valid plans found after loading and sanitization.');
				setSelectedPlanId(null);
			}

		} catch (err) {
			console.error('Error processing stored data:', err);
			setError(`Failed to load plan data. It might be corrupted. ${err instanceof Error ? err.message : 'Unknown error'}`);
			// Clear corrupted data
			localStorage.removeItem('birthdayPlans');
			localStorage.removeItem('userInput');
		} finally {
			setIsLoading(false); // Ensure loading state is turned off
		}
	}, [navigate]); // Include navigate in dependency array

	// Derived state: Find the currently selected plan object
	const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

	/**
	 * Handler to update the plans state when a plan is modified (e.g., by BudgetOptimizer).
	 * Also updates localStorage.
	 * @param updatedPlan - The modified BirthdayPlan object.
	 */
	const handlePlanUpdate = (updatedPlan: BirthdayPlan) => {
		if (!updatedPlan?.id) {
			 console.error("handlePlanUpdate received invalid plan:", updatedPlan);
			 return;
		}
		// Create the new array of plans with the updated one
		const updatedPlans = plans.map(plan =>
			plan.id === updatedPlan.id ? updatedPlan : plan
		);
		setPlans(updatedPlans); // Update component state

		// Persist changes to localStorage
		try {
			localStorage.setItem('birthdayPlans', JSON.stringify(updatedPlans));
			console.log('Plan updated and saved to localStorage.');
		} catch (err) {
			 console.error('Failed to update localStorage after plan update:', err);
			 setError('Could not save plan changes locally.');
		}
	};

	// --- Render Logic ---

	// Loading State UI
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="text-center">
					<p className="text-lg text-gray-600 animate-pulse">Loading plans...</p>
					{/* Consider adding a visual spinner */}
				</div>
			</div>
		);
	}

	// Error State UI
	if (error) {
		 return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="text-center bg-white p-8 rounded-lg shadow-xl max-w-md border border-red-200">
					<h2 className="text-2xl font-semibold text-red-600 mb-4">Loading Error</h2>
					<p className="text-gray-700 mb-6">{error}</p>
					<button
						onClick={() => navigate('/')}
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
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8"> {/* Added gradient bg */}
			<div className="max-w-7xl mx-auto">
				<header className="text-center mb-10">
					<h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl">Your Birthday Plans</h1>
					{/* Display theme and name if userInput is available */}
					{userInput?.birthdayPersonName && userInput?.theme && (
						<p className="mt-4 text-xl text-gray-600"> {/* Increased size */}
							For <span className="font-semibold text-indigo-700">{userInput.birthdayPersonName}</span>'s <span className="font-medium">{userInput.theme}</span> themed party!
						</p>
					)}
				</header>

				{/* Display message if no plans were loaded/generated */}
				{plans.length === 0 ? (
					 <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md mx-auto border border-gray-200">
						<h2 className="text-xl font-semibold text-gray-700 mb-4">No Plans Available</h2>
						<p className="text-gray-600 mb-6">
							No plans were found or generated successfully. Please go back and try again.
						</p>
						<button
							onClick={() => navigate('/')}
							className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
						>
							Start Over
						</button>
					</div>
				) : (
					// Render Tabs and Content if plans exist
					<>
						{/* Tabs Navigation */}
						<div className="mb-8 border-b border-gray-300">
							<div className="flex flex-wrap -mb-px space-x-1 sm:space-x-4" aria-label="Tabs">
								{/* Tab Button: Birthday Plans */}
								<button
									onClick={() => setActiveTab('plans')}
									className={`px-3 py-3 sm:px-4 font-semibold text-sm rounded-t-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 transition-colors duration-150 ${
										activeTab === 'plans'
											? 'border-b-2 border-indigo-600 text-indigo-600'
											: 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
									}`}
								>
									Birthday Plans ({plans.length})
								</button>
								{/* Tab Button: Smart Invitation */}
								<button
									onClick={() => setActiveTab('invitation')}
									disabled={!selectedPlan}
									className={`px-3 py-3 sm:px-4 font-semibold text-sm rounded-t-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 transition-colors duration-150 ${
										activeTab === 'invitation'
											? 'border-b-2 border-indigo-600 text-indigo-600'
											: 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
									} ${!selectedPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
								>
									Smart Invitation
								</button>
								{/* Tab Button: Budget Optimizer */}
								<button
									onClick={() => setActiveTab('budget')}
									disabled={!selectedPlan || !userInput} // Also disable if userInput is missing
									className={`px-3 py-3 sm:px-4 font-semibold text-sm rounded-t-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50 transition-colors duration-150 ${
										activeTab === 'budget'
											? 'border-b-2 border-indigo-600 text-indigo-600'
											: 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
									} ${!selectedPlan || !userInput ? 'opacity-50 cursor-not-allowed' : ''}`}
								>
									Budget Optimizer
								</button>
							</div>
						</div>

						{/* --- Tab Content Area --- */}
						<div className="mt-6">
							{/* Plans Tab Content */}
							{activeTab === 'plans' && (
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
									{plans.map(plan => (
										<PlanCard
											key={plan.id} // Use plan ID as key
											plan={plan}
											isSelected={plan.id === selectedPlanId}
											onSelect={() => plan.id && setSelectedPlanId(plan.id)} // Select plan on click
										/>
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
							{activeTab === 'budget' && selectedPlan && userInput && ( // Ensure selectedPlan and userInput exist
								 <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8 max-w-4xl mx-auto border border-gray-200">
									<BudgetOptimizer
										selectedPlan={selectedPlan}
										onPlanUpdate={handlePlanUpdate}
										// ** Pass original budget amount and currency as props **
										numericBudget={userInput.budgetAmount} // Pass the number
										currency={userInput.currency}       // Pass the currency string
									/>
								</div>
							)}
						</div>

						{/* Start Over Button */}
						<div className="mt-16 text-center">
							<button
								onClick={() => navigate('/')}
								className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
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

