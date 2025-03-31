import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditPlanSectionModal from '../components/EditPlanSectionModal';
// Import the actual modal components being used
import BudgetOptimizerModal from '../components/BudgetOptimizerModal';
import InvitationCreatorModal from '../components/InvitationCreatorModal';
// Import necessary types
// Removed unused types: SmartInvitation, Venue, Catering, GuestEngagement, ScheduleItem, CateringMenu
import type {
    BirthdayPlan,
    UserInput,
} from '../types';

// Define local extended types to safely include properties expected by this component
// This avoids modifying the original imported types while satisfying local usage.
type ExtendedBirthdayPlan = BirthdayPlan & { date?: string | Date; optimizationSummary?: string }; // Added optimizationSummary based on usage
type ExtendedScheduleItem = { time?: string; activity?: string; details?: string }; // Define based on usage in this file

/**
 * PlanDetail Component
 * Displays the detailed view of a selected birthday plan.
 * Allows editing individual sections via EditPlanSectionModal.
 * Integrates BudgetOptimizerModal and InvitationCreatorModal for enhanced functionality.
 */
const PlanDetail: React.FC = () => {
    const { planId } = useParams<{ planId: string }>(); // Get planId from URL parameters
    const navigate = useNavigate(); // Hook for navigation

    // State for the currently viewed plan (using extended type) and original user input
    const [plan, setPlan] = useState<ExtendedBirthdayPlan | null>(null);
    const [userInput, setUserInput] = useState<UserInput | null>(null);

    // State for loading and error messages
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(null); // Error during initial load
    const [editError, setEditError] = useState<string | null>(null); // Error during saving edits
    const [optimizeError, setOptimizeError] = useState<string | null>(null); // Error during budget optimization saving
    const [inviteError, setInviteError] = useState<string | null>(null); // Error related to invitation modal (if needed)

    // State for managing the visibility and data of modals
    const [editingSection, setEditingSection] = useState<string | null>(null); // Which section is being edited
    const [dataToEdit, setDataToEdit] = useState<any>(null); // Data passed to the edit modal
    const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false); // Budget optimizer modal state
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState<boolean>(false); // Invitation creator modal state

    // --- Load Initial Plan Data & User Input from localStorage ---
    useEffect(() => {
        setIsLoading(true);
        // Reset all errors and states on planId change
        setLoadError(null); setEditError(null); setOptimizeError(null); setInviteError(null);
        setPlan(null); setUserInput(null); setEditingSection(null); setDataToEdit(null);
        setIsOptimizerOpen(false); setIsInvitationModalOpen(false);

        console.log(`PlanDetail: useEffect running for planId: ${planId}`);

        // Validate planId presence
        if (!planId) {
            setLoadError("No Plan ID provided in the URL.");
            setIsLoading(false);
            return;
        }

        // Attempt to retrieve data from localStorage
        const storedPlansString = localStorage.getItem('generatedPlans');
        const storedUserInputString = localStorage.getItem('userInput');

        console.log(`PlanDetail: Value from localStorage.getItem('generatedPlans'):`, storedPlansString ? storedPlansString.substring(0, 100) + '...' : storedPlansString);
        console.log(`PlanDetail: Value from localStorage.getItem('userInput'):`, storedUserInputString ? storedUserInputString.substring(0, 100) + '...' : storedUserInputString);

        // Validate presence of stored data
        if (!storedPlansString || !storedUserInputString) {
            setLoadError("Plan data or user input missing from storage. Please generate plans again.");
            setIsLoading(false);
            return;
        }

        try {
            // Parse stored data
            const storedPlans: ExtendedBirthdayPlan[] = JSON.parse(storedPlansString);
            const parsedUserInput: UserInput = JSON.parse(storedUserInputString);
            console.log("PlanDetail: Successfully parsed plans and user input from storage.");

            // Find the specific plan by ID
            const foundPlan = storedPlans.find(p => p.id === planId);

            if (foundPlan) {
                console.log("PlanDetail: Plan found:", foundPlan);
                setPlan(foundPlan); // Set the found plan state
                setUserInput(parsedUserInput); // Set the user input state
            } else {
                // Handle case where plan ID doesn't match any stored plan
                console.warn(`PlanDetail: Plan with ID ${planId} not found within the stored plans array.`);
                throw new Error(`Plan with ID ${planId} not found. Please go back and select a valid plan.`);
            }
        } catch (err: any) {
            // Handle JSON parsing errors or other issues during loading
            console.error("PlanDetail: Error loading plan or user input:", err);
            setLoadError(err.message || "An error occurred while loading plan data.");
        } finally {
            // Ensure loading state is turned off
            setIsLoading(false);
            console.log("PlanDetail: useEffect finished.");
        }
    }, [planId]); // Re-run effect only when planId changes

    // --- Edit Modal Handlers ---

    /** Opens the generic edit modal for a specific section of the plan. */
    const handleEditClick = (section: keyof ExtendedBirthdayPlan | string) => {
        if (!plan) return; // Ensure plan data is loaded

        let currentData: any;
        // Check if the section key exists directly on the plan object
        if (Object.prototype.hasOwnProperty.call(plan, section)) {
            currentData = plan[section as keyof ExtendedBirthdayPlan];
        } else {
            // Prevent editing if the section key is invalid or not handled
            console.warn(`Attempting to edit unhandled or invalid section: ${section}`);
            setEditError(`Editing for section "${section}" is not currently supported.`);
            return;
        }
        // Set state to open the modal with the correct data
        setDataToEdit(currentData);
        setEditingSection(section);
        setEditError(null); // Clear previous edit errors
    };

    /** Closes the generic edit modal. */
    const handleCloseModal = () => setEditingSection(null);

    /** Saves changes made in the generic edit modal back to the plan state and localStorage. */
    const handleSaveChanges = (updatedData: any) => {
        if (!plan || !editingSection) return; // Ensure plan and section context exist

        // Create the updated plan object
        const updatedPlan: ExtendedBirthdayPlan = { ...plan, [editingSection]: updatedData };
        setPlan(updatedPlan); // Update component state immediately for responsiveness
        setEditError(null); // Clear previous save errors

        // Attempt to save the updated plan list back to localStorage
        try {
            const currentStoredPlansString = localStorage.getItem('generatedPlans');
            if (!currentStoredPlansString) throw new Error("Failed to retrieve plans from storage for saving.");

            const storedPlans: ExtendedBirthdayPlan[] = JSON.parse(currentStoredPlansString);
            const planIndex = storedPlans.findIndex(p => p.id === planId);

            if (planIndex === -1) throw new Error(`Plan with ID ${planId} not found in storage during save attempt.`);

            // Update the plan in the array and save back to localStorage
            storedPlans[planIndex] = updatedPlan;
            localStorage.setItem('generatedPlans', JSON.stringify(storedPlans));
            console.log("PlanDetail: Plan updated successfully in localStorage.");
        } catch (err: any) {
            console.error("PlanDetail: Error saving plan changes to localStorage:", err);
            setEditError("Failed to save changes. Please try again or refresh the page.");
            // Optionally revert state: setPlan(plan); // Revert to previous state if save fails
        }
    };

    // --- Budget Optimizer Modal Handlers ---

    /** Opens the Budget Optimizer modal. */
    const handleOpenOptimizer = () => {
        // Ensure required data is available before opening
        if (!plan || !userInput) {
            setLoadError("Cannot open optimizer: Plan or User Input data is missing.");
            return;
        }
        setOptimizeError(null); // Clear previous optimizer errors
        setIsOptimizerOpen(true);
    };

    /** Closes the Budget Optimizer modal. */
    const handleCloseOptimizer = () => setIsOptimizerOpen(false);

    /** Handles receiving the updated plan data from the Budget Optimizer modal. */
    const handlePlanUpdateFromOptimizer = (optimizedPlanData: BirthdayPlan) => { // Expects base BirthdayPlan type from optimizer
        console.log("PlanDetail: Received optimized plan:", optimizedPlanData);
        if (!plan) return; // Ensure current plan context exists

        // Create the updated plan, ensuring it conforms to ExtendedBirthdayPlan
        // Merge existing plan details with optimized data, potentially adding optimizationSummary
        const updatedPlan: ExtendedBirthdayPlan = {
            ...(plan), // Spread existing plan details first
            ...optimizedPlanData, // Override with optimized data
            // Ensure the type matches ExtendedBirthdayPlan, casting if necessary
        } as ExtendedBirthdayPlan;

        setPlan(updatedPlan); // Update state
        setOptimizeError(null); // Clear errors

        // Save the updated plan to localStorage (similar logic to handleSaveChanges)
        try {
            const currentStoredPlansString = localStorage.getItem('generatedPlans');
            if (!currentStoredPlansString) throw new Error("Failed to retrieve plans from storage for saving optimized plan.");
            const storedPlans: ExtendedBirthdayPlan[] = JSON.parse(currentStoredPlansString);
            const planIndex = storedPlans.findIndex(p => p.id === planId);
            if (planIndex === -1) throw new Error(`Original plan with ID ${planId} not found in storage during optimized save.`);
            storedPlans[planIndex] = updatedPlan;
            localStorage.setItem('generatedPlans', JSON.stringify(storedPlans));
            console.log("PlanDetail: Optimized plan updated successfully in localStorage.");
        } catch (err: any) {
            console.error("PlanDetail: Error saving optimized plan changes to localStorage:", err);
            setOptimizeError("Failed to save optimized changes. Please try again.");
        }
        setIsOptimizerOpen(false); // Close the modal on successful update
    };

    // --- Invitation Creator Modal Handlers ---

    /** Opens the Invitation Creator modal. */
    const handleOpenInvitationModal = () => {
        if (!plan) { // Ensure plan data is loaded
            setLoadError("Cannot create invitation: Plan data is missing.");
            return;
        }
        setInviteError(null); // Clear previous invitation errors
        setIsInvitationModalOpen(true);
    };

    /** Closes the Invitation Creator modal. */
    const handleCloseInvitationModal = () => setIsInvitationModalOpen(false);

    // --- Helper function to render list items (e.g., amenities, menu items) ---
    // Refined to handle types and empty states correctly
    const renderList = (items: string[] | string | undefined, title: string): React.ReactNode => {
        // Return null immediately if items are undefined or an empty array
        if (!items || (Array.isArray(items) && items.length === 0)) return null;

        let listContent: React.ReactNode[] | React.ReactNode; // To hold JSX list items

        if (Array.isArray(items)) {
            // Filter out empty or non-string items, then map to <li> elements
            const filteredItems = items.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
            // If after filtering, the array is empty, return null
            if (filteredItems.length === 0) return null;
            listContent = filteredItems.map((item, index) => <li key={index}>{item}</li>);
        } else if (typeof items === 'string' && items.trim() !== '') {
            // Handle case where a single string is provided instead of an array
            console.warn(`renderList Warning: Expected an array for '${title}', but received a string: "${items}". Rendering as single item.`);
            listContent = <li>{items}</li>; // Render as a single list item
        } else {
            // Handle unexpected types
            console.warn(`renderList Warning: Expected an array or string for '${title}', but received type '${typeof items}'. Value:`, items);
            return null;
        }

        // Return the title and the unordered list containing the generated list items
        return (
            <>
                <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">{title}</h4>
                <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600">
                    {/* Render the list content (either single node or array of nodes) */}
                    {listContent}
                </ul>
            </>
        );
    }


    // --- Main Render Logic ---

    // Display loading indicator while fetching data
    if (isLoading) return <div className="p-6 text-center text-gray-600">Loading plan details...</div>;

    // Display critical loading errors if plan couldn't be loaded
    const displayLoadError = loadError ? <div className="p-4 mb-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">{loadError}</div> : null;
    if (!plan && !isLoading) return <div className="p-6 text-center text-red-600">Error: {loadError || 'Plan data could not be loaded.'}</div>;

    // If plan is null after loading (shouldn't happen if error handling is correct, but for safety)
    if (!plan) return null;

    // Display non-critical errors related to specific operations (edit, optimize, invite)
    const displayEditError = editError ? <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{editError}</div> : null;
    const displayOptimizeError = optimizeError ? <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{optimizeError}</div> : null;
    const displayInviteError = inviteError ? <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{inviteError}</div> : null;


    // Render the main plan detail view
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl font-inter relative">
            {/* Display Error Messages Area */}
            {displayLoadError}
            {displayEditError}
            {displayOptimizeError}
            {displayInviteError}

            {/* Action Buttons (Top Right) */}
            <div className="absolute top-4 right-4 flex flex-wrap gap-2 z-10">
                {/* Optimize Budget Button */}
                <button
                    onClick={handleOpenOptimizer}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Optimize Budget"
                    disabled={!userInput || !plan} // Disable if required data isn't loaded
                >
                    Optimize Budget
                </button>
                {/* Create Invitation Button */}
                <button
                    onClick={handleOpenInvitationModal}
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Create Invitation"
                    disabled={!plan} // Disable if plan isn't loaded
                >
                    Create Invitation
                </button>
            </div>

            {/* Back Button (Top Left) */}
            <button
                onClick={() => navigate('/results')} // Navigate back to the results page
                className="absolute top-4 left-4 mb-4 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out z-10"
                aria-label="Back to results"
            >
                &larr; Back to Results {/* Left arrow */}
            </button>


            {/* Plan Name & Profile Section */}
            <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-300 pt-20"> {/* Added padding-top */}
                <div>
                    {/* Display Plan Name */}
                    <h1 className="text-3xl font-bold text-gray-800">{plan.name ?? 'Unnamed Plan'}</h1>
                    {/* Display Plan Profile */}
                    {plan.profile && <p className="text-sm text-gray-500 mt-1">Profile: {plan.profile}</p>}
                </div>
                {/* Edit Button for Name (only if 'name' property exists) */}
                {Object.prototype.hasOwnProperty.call(plan, 'name') && (
                    <button
                        onClick={() => handleEditClick('name')}
                        className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-shrink-0 mt-1"
                    >
                        Edit Name
                    </button>
                )}
            </div>

            {/* Optimization Summary Section (Conditional) */}
            {plan.optimizationSummary && (
                <section className="mb-6 p-4 border border-green-200 rounded-lg shadow-sm bg-green-50">
                    <h2 className="text-xl font-semibold text-green-800 mb-2">Optimization Summary</h2>
                    <p className="text-green-700 whitespace-pre-wrap">{plan.optimizationSummary}</p>
                </section>
            )}

            {/* Description Section */}
            <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-gray-700">Description</h2>
                    {Object.prototype.hasOwnProperty.call(plan, 'description') && (
                        <button onClick={() => handleEditClick('description')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
                    )}
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{plan.description ?? 'No description available.'}</p>
            </section>

            {/* Date Section (Conditional based on plan.date existence) */}
            {plan.date && (
                <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-semibold text-gray-700">Date</h2>
                        {Object.prototype.hasOwnProperty.call(plan, 'date') && (
                            <button onClick={() => handleEditClick('date')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
                        )}
                    </div>
                    <p className="text-gray-600">
                        {/* Safely format the date, handling potential invalid date values */}
                        {(() => {
                            try {
                                const dateObj = new Date(plan.date as string | Date); // Use extended type
                                // Check if date is valid after parsing
                                if (isNaN(dateObj.getTime())) return 'Invalid date format';
                                // Format date for display (adjust options as needed)
                                return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); // Use UTC to avoid timezone shifts from string parsing
                            } catch (e) {
                                console.error("Error formatting date:", e);
                                return 'Invalid date';
                            }
                        })()}
                    </p>
                </section>
            )}

            {/* Venue Section */}
            <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-gray-700">Venue</h2>
                    {Object.prototype.hasOwnProperty.call(plan, 'venue') && (
                        <button onClick={() => handleEditClick('venue')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
                    )}
                </div>
                {plan.venue ? (
                    <div className="space-y-2 text-gray-600">
                        <p><span className="font-medium text-gray-800">Name:</span> {plan.venue.name ?? 'N/A'}</p>
                        <p><span className="font-medium text-gray-800">Description:</span> {plan.venue.description ?? 'N/A'}</p>
                        <p><span className="font-medium text-gray-800">Cost Range:</span> {plan.venue.costRange ?? 'N/A'}</p>
                        <p><span className="font-medium text-gray-800">Suitability:</span> {plan.venue.suitability ?? 'N/A'}</p>
                        {/* Use renderList helper for amenities */}
                        {renderList(plan.venue.amenities, 'Amenities')}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No venue details specified.</p>
                )}
            </section>

            {/* Schedule Section */}
            <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-gray-700">Schedule</h2>
                    {Object.prototype.hasOwnProperty.call(plan, 'schedule') && (
                        <button onClick={() => handleEditClick('schedule')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
                    )}
                </div>
                {plan.schedule && plan.schedule.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2">
                        {/* Map through schedule items, ensuring item structure is valid */}
                        {(plan.schedule as ExtendedScheduleItem[]).map((item, index) => ( // Cast to use ExtendedScheduleItem
                            (item && typeof item === 'object' && item.time && item.activity) ? (
                                <li key={index} className="text-gray-600">
                                    <span className="font-medium text-gray-800">{item.time}:</span> {item.activity}
                                    {/* Conditionally display details if they exist */}
                                    {item.details && <span className="text-sm italic ml-2">({item.details})</span>}
                                </li>
                            ) : null // Skip rendering if item structure is invalid
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 italic">No schedule items added yet.</p>
                )}
            </section>

            {/* Catering Section */}
            <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-gray-700">Catering</h2>
                    {Object.prototype.hasOwnProperty.call(plan, 'catering') && (
                        <button onClick={() => handleEditClick('catering')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
                    )}
                </div>
                {plan.catering ? (
                    <div className="space-y-2 text-gray-600">
                        <p><span className="font-medium text-gray-800">Estimated Cost:</span> {plan.catering.estimatedCost ?? 'N/A'}</p>
                        <p><span className="font-medium text-gray-800">Serving Style:</span> {plan.catering.servingStyle ?? 'N/A'}</p>
                        {/* Display Menu Details if available */}
                        {plan.catering.menu ? (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <h3 className="text-lg font-semibold mb-2 text-gray-800">Menu</h3>
                                {renderList(plan.catering.menu.appetizers, 'Appetizers')}
                                {renderList(plan.catering.menu.mainCourses, 'Main Courses')}
                                {/* Handle desserts (string) */}
                                {plan.catering.menu.desserts ? (
                                    <>
                                        <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">Desserts</h4>
                                        <p className="text-sm text-gray-600 pl-2">{typeof plan.catering.menu.desserts === 'string' ? plan.catering.menu.desserts : 'N/A'}</p>
                                    </>
                                ) : null}
                                {renderList(plan.catering.menu.beverages, 'Beverages')}
                            </div>
                        ) : <p className="text-gray-500 italic mt-2">No menu details specified.</p>}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No catering details specified.</p>
                )}
            </section>

            {/* Guest Engagement Section */}
            <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-gray-700">Guest Engagement</h2>
                    {/* Edit button can be added here if editing functionality is implemented */}
                    {/* {Object.prototype.hasOwnProperty.call(plan, 'guestEngagement') && ( <button onClick={() => handleEditClick('guestEngagement')} className="...">Edit</button> )} */}
                </div>
                {plan.guestEngagement ? (
                    <div className="space-y-2 text-gray-600">
                        {/* Use renderList helper for each sub-section */}
                        {renderList(plan.guestEngagement.icebreakers, 'Icebreakers')}
                        {renderList(plan.guestEngagement.interactiveElements, 'Interactive Elements')}
                        {renderList(plan.guestEngagement.photoOpportunities, 'Photo Opportunities')}
                        {renderList(plan.guestEngagement.partyFavors, 'Party Favors')}
                        {renderList(plan.guestEngagement.techIntegration, 'Tech Integration')}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No guest engagement details specified.</p>
                )}
            </section>


            {/* --- Render Modals (Portal recommended for production) --- */}

            {/* Generic Edit Modal */}
            <EditPlanSectionModal
                isOpen={!!editingSection} // Open if editingSection is not null
                onClose={handleCloseModal}
                section={editingSection}
                currentData={dataToEdit}
                onSave={handleSaveChanges}
            />

            {/* Budget Optimizer Modal */}
            <BudgetOptimizerModal
                isOpen={isOptimizerOpen}
                onClose={handleCloseOptimizer}
                currentPlan={plan} // Pass the current plan state
                userInput={userInput} // Pass the user input state
                onPlanUpdate={handlePlanUpdateFromOptimizer} // Handler for receiving optimized plan
            />

            {/* Invitation Creator Modal */}
            <InvitationCreatorModal
                isOpen={isInvitationModalOpen}
                onClose={handleCloseInvitationModal}
                currentPlan={plan} // Pass the current plan state
            // Optional: Pass a handler if needed:
            // onInvitationGenerated={handleInvitationGenerated}
            />

        </div> // Close main container
    );
};

export default PlanDetail;

