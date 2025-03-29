import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../components/PlanCard';
import SmartInvitation from '../components/SmartInvitation';
import BudgetOptimizer from '../components/BudgetOptimizer';
import type { BirthdayPlan, UserInput } from '../types';

export default function Results() {
    const [plans, setPlans] = useState<BirthdayPlan[]>([]);
    const [userInput, setUserInput] = useState<UserInput | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'plans' | 'invitation' | 'budget'>('plans');
    const navigate = useNavigate();

    useEffect(() => {
        // Retrieve plans and user input from localStorage
        const storedPlans = localStorage.getItem('birthdayPlans');
        const storedUserInput = localStorage.getItem('userInput');

        if (!storedPlans || !storedUserInput) {
            // If no data is found, redirect to home page
            console.warn("No plan data found in localStorage, redirecting to home."); // Added warning
            navigate('/');
            return;
        }

        try {
            const parsedPlans: BirthdayPlan[] = JSON.parse(storedPlans);
            const parsedUserInput: UserInput = JSON.parse(storedUserInput);

            setPlans(parsedPlans);
            setUserInput(parsedUserInput);

            // Select the first plan by default if plans exist
            if (parsedPlans && parsedPlans.length > 0) {
                setSelectedPlanId(parsedPlans[0].id);
            } else {
                 // Handle case where plans array might be empty
                 console.warn("Stored plans array is empty.");
                 setSelectedPlanId(null);
            }

        } catch (err) {
            console.error('Error parsing stored data:', err);
            // Clear potentially corrupted data and redirect
            localStorage.removeItem('birthdayPlans');
            localStorage.removeItem('userInput');
            navigate('/');
        }
    }, [navigate]); // Dependency array is correct

    // Find the selected plan based on ID
    const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

    // Handler for updating a plan (e.g., after budget optimization)
    const handlePlanUpdate = (updatedPlan: BirthdayPlan) => {
        setPlans(prevPlans =>
            prevPlans.map(plan =>
                plan.id === updatedPlan.id ? updatedPlan : plan
            )
        );
        // Optionally update localStorage as well
        const updatedPlans = plans.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan);
        localStorage.setItem('birthdayPlans', JSON.stringify(updatedPlans));
    };

    // Loading state check - improved to check plans array directly
    // Render loading indicator if user input or plans are not yet loaded
    if (!userInput || !plans || plans.length === 0) {
        // Check if plans is explicitly empty after trying to load
         if (localStorage.getItem('birthdayPlans') && plans && plans.length === 0) {
              // If storage had plans but parsing resulted in empty, maybe it was just an empty array stored
              // Proceed to render normally, letting the user know there might be no plans?
              // Or handle as error? For now, let's assume loading hasn't finished yet or plans were truly empty.
         }

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    {/* Corrected loading state paragraph - removed stray '}' */}
                    <p className="text-gray-600">Loading plans...</p>
                </div>
            </div>
        );
    }

    // Main render logic once data is loaded
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Your Birthday Plans</h1>
                    {/* Added null check for userInput */}
                    <p className="mt-2 text-gray-600">
                        Based on your preferences for a {userInput?.theme} themed birthday
                    </p>
                </header>

                {/* Tabs Section */}
                <div className="mb-8">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`px-4 py-2 font-medium ${
                                activeTab === 'plans'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
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

                {/* Conditional Tab Content */}
                {activeTab === 'plans' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {plans.map(plan => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                isSelected={plan.id === selectedPlanId}
                                onSelect={() => setSelectedPlanId(plan.id)}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'invitation' && selectedPlan && (
                    <SmartInvitation selectedPlan={selectedPlan} />
                )}

                {activeTab === 'budget' && selectedPlan && (
                    <BudgetOptimizer
                        selectedPlan={selectedPlan}
                        onPlanUpdate={handlePlanUpdate}
                    />
                )}

                {/* Start Over Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400" // Corrected formatting
                    >
                        Start Over
                    </button>
                </div>
            </div>
        </div>
    );
} // Final closing brace for the component function
