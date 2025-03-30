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
    return plans.map(plan => {
        // Create a deep copy to avoid modifying the original state directly if needed,
        // though map already creates a new outer array. For nested objects, deep copy is safer.
        const sanitizedPlan = JSON.parse(JSON.stringify(plan));

        // --- Venue ---
        if (!Array.isArray(sanitizedPlan.venue?.amenities)) {
            console.warn(`Sanitizing plan ${plan.id}: venue.amenities was not an array.`, sanitizedPlan.venue?.amenities);
            if (sanitizedPlan.venue) sanitizedPlan.venue.amenities = [];
            // If venue itself might be missing/null, add extra checks if needed
        }

        // --- Schedule --- (Assuming plan.schedule should be an array)
        if (!Array.isArray(sanitizedPlan.schedule)) {
             console.warn(`Sanitizing plan ${plan.id}: schedule was not an array.`, sanitizedPlan.schedule);
             sanitizedPlan.schedule = [];
        }

        // --- Catering Menu ---
        const menu = sanitizedPlan.catering?.menu;
        if (menu) {
            if (!Array.isArray(menu.appetizers)) {
                console.warn(`Sanitizing plan ${plan.id}: catering.menu.appetizers was not an array.`, menu.appetizers);
                menu.appetizers = [];
            }
            if (!Array.isArray(menu.mainCourses)) {
                 console.warn(`Sanitizing plan ${plan.id}: catering.menu.mainCourses was not an array.`, menu.mainCourses);
                 menu.mainCourses = [];
            }
             if (!Array.isArray(menu.beverages)) {
                 console.warn(`Sanitizing plan ${plan.id}: catering.menu.beverages was not an array.`, menu.beverages);
                 menu.beverages = [];
             }
            // Note: 'desserts' might be intended as a string based on PlanCard, so we don't force it to array here. Adjust if needed.
        } else if (sanitizedPlan.catering) {
             // If menu object itself is missing, initialize it? Depends on requirements.
             console.warn(`Sanitizing plan ${plan.id}: catering.menu was missing.`);
             // sanitizedPlan.catering.menu = { appetizers: [], mainCourses: [], desserts: '', beverages: [] }; // Example initialization
        }

        // --- Guest Engagement ---
        const engagement = sanitizedPlan.guestEngagement;
        if (engagement) {
            if (!Array.isArray(engagement.icebreakers)) {
                console.warn(`Sanitizing plan ${plan.id}: guestEngagement.icebreakers was not an array.`, engagement.icebreakers);
                engagement.icebreakers = [];
            }
            if (!Array.isArray(engagement.interactiveElements)) {
                console.warn(`Sanitizing plan ${plan.id}: guestEngagement.interactiveElements was not an array.`, engagement.interactiveElements);
                engagement.interactiveElements = [];
            }
            if (!Array.isArray(engagement.photoOpportunities)) {
                console.warn(`Sanitizing plan ${plan.id}: guestEngagement.photoOpportunities was not an array.`, engagement.photoOpportunities);
                engagement.photoOpportunities = [];
            }
            if (!Array.isArray(engagement.partyFavors)) {
                console.warn(`Sanitizing plan ${plan.id}: guestEngagement.partyFavors was not an array.`, engagement.partyFavors);
                engagement.partyFavors = [];
            }
            // techIntegration might be optional, check type definition. If required as array:
            if (!Array.isArray(engagement.techIntegration)) {
                 console.warn(`Sanitizing plan ${plan.id}: guestEngagement.techIntegration was not an array.`, engagement.techIntegration);
                 engagement.techIntegration = []; // Initialize if necessary based on types
            }
        } else {
             // If guestEngagement object itself is missing, initialize it? Depends on requirements.
             console.warn(`Sanitizing plan ${plan.id}: guestEngagement was missing.`);
             // sanitizedPlan.guestEngagement = { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [], techIntegration: [] }; // Example initialization
        }

        return sanitizedPlan;
    });
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
        console.log("Results component mounted. Attempting to load data from localStorage.");
        setIsLoading(true); // Start loading
        setError(null); // Reset error on load attempt

        // Retrieve plans and user input from localStorage
        const storedPlans = localStorage.getItem('birthdayPlans');
        const storedUserInput = localStorage.getItem('userInput');

        if (!storedPlans || !storedUserInput) {
            console.error("Required data not found in localStorage. Redirecting to home.");
            setError("Could not load plan data. Please start over.");
            localStorage.removeItem('birthdayPlans'); // Clean up potentially partial data
            localStorage.removeItem('userInput');
            setIsLoading(false);
            navigate('/'); // Redirect immediately
            return; // Stop further execution in useEffect
        }

        try {
            const parsedPlans: BirthdayPlan[] = JSON.parse(storedPlans);
            const parsedUserInput: UserInput = JSON.parse(storedUserInput);

            console.log("Successfully parsed data from localStorage.");

            // ** SANITIZE THE LOADED PLANS **
            const sanitizedLoadedPlans = sanitizePlans(parsedPlans);
            console.log("Sanitization complete.");

            setPlans(sanitizedLoadedPlans);
            setUserInput(parsedUserInput);

            // Select the first plan by default if plans exist
            if (sanitizedLoadedPlans && sanitizedLoadedPlans.length > 0) {
                setSelectedPlanId(sanitizedLoadedPla<ctrl62>  ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Birthday Plans
                            </button>
                            <button
                                onClick={() => setActiveTab('invitation')}
                                disabled={!selectedPlan} // Disable if no plan is selected
                                className={`px-4 py-2 font-medium ${
                                    activeTab === 'invitation'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                } ${!selectedPlan ? 'opacity-50 cursor-not-allowed' : ''}`} // Style when disabled
                            >
                                Smart Invitation
                            </button>
                            <button
                                onClick={() => setActiveTab('budget')}
                                disabled={!selectedPlan} // Disable if no plan is selected
                                className={`px-4 py-2 font-medium ${
                                    activeTab === 'budget'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                } ${!selectedPlan ? 'opacity-50 cursor-not-allowed' : ''}`} // Style when disabled
                            >
                                Budget Optimizer
                            </button>
                        </div>
                    </div>

                    {/* --- Tab Content --- */}
                    {/* Plans Tab */}
                    {activeTab === 'plans' && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {plans.length > 0 ? (
                                plans.map(plan => (
                                    <PlanCard
                                        key={plan.id} // Ensure plan.id is unique and stable
                                        plan={plan}
                                        isSelected={plan.id === selectedPlanId}
                                        onSelect={() => setSelectedPlanId(plan.id)}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-600 md:col-span-2 lg:col-span-3 text-center">
                                    No birthday plans were generated or loaded correctly.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Invitation Tab */}
                    {activeTab === 'invitation' && selectedPlan && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <SmartInvitation selectedPlan={selectedPlan} />
                        </div>
                    )}

                    {/* Budget Tab */}
                    {activeTab === 'budget' && selectedPlan && (
                         <div className="bg-white rounded-lg shadow p-6">
                            <BudgetOptimizer
                                selectedPlan={selectedPlan}
                                onPlanUpdate={handlePlanUpdate}
                            />
                        </div>
                    )}

                    {/* Start Over Button */}
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => {
                                // Optional: Clear storage when starting over explicitly
                                // localStorage.removeItem('birthdayPlans');
                                // localStorage.removeItem('userInput');
                                navigate('/');
                            }}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out"
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
