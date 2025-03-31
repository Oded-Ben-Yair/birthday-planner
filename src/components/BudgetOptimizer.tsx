import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditPlanSectionModal from '../components/EditPlanSectionModal';
// Import placeholder/actual components for features
import BudgetOptimizerModal from '../components/BudgetOptimizerModal'; // Assuming this exists or will be created
// import InvitationCreatorModal from '../components/InvitationCreatorModal'; // Assuming this exists or will be created
// Import API functions if needed directly (though likely called from child components)
// import { optimizeBudget, generateSmartInvitation } from '../utils/api';
// Import types
import type {
    BirthdayPlan,
    UserInput,
    BudgetPriorities, // Keep for type safety, though logic might be internal to optimizer
    SmartInvitation, // Import for potential result handling
    Venue,
    Catering,
    GuestEngagement,
    ScheduleItem,
    CateringMenu
} from '../types';

/**
 * PlanDetail Component
 * Displays plan details, allows editing, and integrates triggers for Budget Optimizer and Invitation Creator.
 */
const PlanDetail: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<BirthdayPlan | null>(null);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Separate error states for clarity
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // State for modals
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [dataToEdit, setDataToEdit] = useState<any>(null);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false);
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState<boolean>(false);

  // --- Load Initial Plan Data & User Input ---
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null); setEditError(null); setOptimizeError(null); setInviteError(null);
    setPlan(null); setUserInput(null); setEditingSection(null); setDataToEdit(null);
    setIsOptimizerOpen(false); setIsInvitationModalOpen(false);

    console.log(`PlanDetail: useEffect running for planId: ${planId}`);

    if (!planId) { setLoadError("No Plan ID provided in the URL."); setIsLoading(false); return; }

    const storedPlansString = localStorage.getItem('generatedPlans');
    const storedUserInputString = localStorage.getItem('userInput');

    console.log(`PlanDetail: Value from localStorage.getItem('generatedPlans'):`, storedPlansString ? storedPlansString.substring(0, 100) + '...' : storedPlansString);
    console.log(`PlanDetail: Value from localStorage.getItem('userInput'):`, storedUserInputString ? storedUserInputString.substring(0, 100) + '...' : storedUserInputString);

    if (!storedPlansString || !storedUserInputString) { setLoadError("Plan data or user input missing from storage."); setIsLoading(false); return; }

    try {
      const storedPlans: BirthdayPlan[] = JSON.parse(storedPlansString);
      const parsedUserInput: UserInput = JSON.parse(storedUserInputString);
      console.log("PlanDetail: Successfully parsed plans and user input from storage.");
      const foundPlan = storedPlans.find(p => p.id === planId);
      if (foundPlan) {
        console.log("PlanDetail: Plan found:", foundPlan);
        setPlan(foundPlan); setUserInput(parsedUserInput);
      } else {
        console.warn(`PlanDetail: Plan with ID ${planId} not found within the stored plans array.`);
        throw new Error(`Plan with ID ${planId} not found.`);
      }
    } catch (err: any) {
      console.error("PlanDetail: Error loading plan or user input:", err);
      setLoadError(err.message || "An error occurred while loading data.");
    } finally {
      setIsLoading(false);
      console.log("PlanDetail: useEffect finished.");
    }
  }, [planId, navigate]); // Added navigate to dependency array

  // --- Edit Modal Handlers ---
  const handleEditClick = (section: keyof BirthdayPlan | string) => {
     if (!plan) return; let currentData: any; if (Object.prototype.hasOwnProperty.call(plan, section)) { currentData = plan[section as keyof BirthdayPlan]; } else { console.warn(`Attempting to edit unhandled or invalid section: ${section}`); return; } setDataToEdit(currentData); setEditingSection(section); setEditError(null);
  };
  const handleCloseModal = () => setEditingSection(null);
  const handleSaveChanges = (updatedData: any) => {
    if (!plan || !editingSection) return; const updatedPlan: BirthdayPlan = { ...plan, [editingSection]: updatedData }; setPlan(updatedPlan); setEditError(null); try { const currentStoredPlansString = localStorage.getItem('generatedPlans'); if (!currentStoredPlansString) throw new Error("Failed to retrieve plans from storage for saving."); const storedPlans: BirthdayPlan[] = JSON.parse(currentStoredPlansString); const planIndex = storedPlans.findIndex(p => p.id === planId); if (planIndex === -1) throw new Error(`Plan with ID ${planId} not found in storage during save attempt.`); storedPlans[planIndex] = updatedPlan; localStorage.setItem('generatedPlans', JSON.stringify(storedPlans)); console.log("PlanDetail: Plan updated successfully in localStorage."); } catch (err: any) { console.error("PlanDetail: Error saving plan changes to localStorage:", err); setEditError("Failed to save changes. Please try again."); }
  };

  // --- Budget Optimizer Handlers ---
  const handleOpenOptimizer = () => {
      if (!plan || !userInput) { setLoadError("Cannot open optimizer: Plan or User Input data is missing."); return; } // Use loadError for setup issues
      setOptimizeError(null); setIsOptimizerOpen(true);
  };
  const handleCloseOptimizer = () => setIsOptimizerOpen(false);
  const handleBudgetOptimized = (optimizedPlanData: BirthdayPlan) => {
    console.log("PlanDetail: Received optimized plan:", optimizedPlanData); if (!plan) return; const updatedPlan = { ...optimizedPlanData }; setPlan(updatedPlan); setOptimizeError(null); try { const currentStoredPlansString = localStorage.getItem('generatedPlans'); if (!currentStoredPlansString) throw new Error("Failed to retrieve plans from storage for saving optimized plan."); const storedPlans: BirthdayPlan[] = JSON.parse(currentStoredPlansString); const planIndex = storedPlans.findIndex(p => p.id === planId); if (planIndex === -1) throw new Error(`Original plan with ID ${planId} not found in storage during optimized save.`); storedPlans[planIndex] = updatedPlan; localStorage.setItem('generatedPlans', JSON.stringify(storedPlans)); console.log("PlanDetail: Optimized plan updated successfully in localStorage."); } catch (err: any) { console.error("PlanDetail: Error saving optimized plan changes to localStorage:", err); setOptimizeError("Failed to save optimized changes. Please try again."); } setIsOptimizerOpen(false);
  };

  // --- Invitation Creator Handlers ---
  const handleOpenInvitationModal = () => {
      if (!plan) { setLoadError("Cannot create invitation: Plan data is missing."); return; } // Use loadError for setup issues
      setInviteError(null); setIsInvitationModalOpen(true);
  };
  const handleCloseInvitationModal = () => setIsInvitationModalOpen(false);
  // handleInvitationGenerated might be needed if the modal doesn't display results internally
  // const handleInvitationGenerated = (invitationData: SmartInvitation) => {
  //    console.log("Invitation generated:", invitationData);
  //    // Maybe show a success message? Or display result elsewhere?
  //    handleCloseInvitationModal();
  // };


  // --- Helper to render list items ---
  const renderList = (items: string[] | string | undefined, title: string) => {
    // ... (keep existing renderList logic) ...
      if (!items || (Array.isArray(items) && items.length === 0)) return null; let listItems: React.ReactNode; if (Array.isArray(items)) { listItems = items.filter(item => item).map((item, index) => <li key={index}>{item}</li>); if (listItems.length === 0) return null; } else if (typeof items === 'string' && items.trim() !== '') { console.warn(`renderList Warning: Expected an array for '${title}', but received a string: "${items}". Rendering as single item.`); listItems = <li>{items}</li>; } else { console.warn(`renderList Warning: Expected an array or string for '${title}', but received type '${typeof items}'. Value:`, items); return null; } return ( <> <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">{title}</h4> <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600">{listItems}</ul> </> );
  }


  // --- Render Logic ---
  if (isLoading) return <div className="p-6 text-center">Loading plan details...</div>;
  // Display general loading errors first
  const displayLoadError = loadError ? <div className="p-4 mb-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">{loadError}</div> : null;
  if (!plan && !isLoading) return <div className="p-6 text-center text-red-600">Error: {loadError || 'Plan data could not be loaded.'}</div>;
  if (!plan) return null;

  // Display specific operational errors
   const displayEditError = editError ? <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{editError}</div> : null;
   const displayOptimizeError = optimizeError ? <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{optimizeError}</div> : null;
   const displayInviteError = inviteError ? <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{inviteError}</div> : null;


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl font-inter relative">
      {/* Display Errors */}
      {displayLoadError}
      {displayEditError}
      {displayOptimizeError}
      {displayInviteError}

       {/* Action Buttons Container */}
       <div className="absolute top-4 right-4 flex flex-wrap gap-2 z-10"> {/* Use flex-wrap and gap */}
            {/* Optimize Budget Button */}
            <button
                onClick={handleOpenOptimizer}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out"
                aria-label="Optimize Budget"
                disabled={!userInput || !plan}
            >
               Optimize Budget
            </button>
             {/* Create Invitation Button */}
            <button
                onClick={handleOpenInvitationModal}
                className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-150 ease-in-out"
                aria-label="Create Invitation"
                disabled={!plan}
            >
               Create Invitation
            </button>
       </div>

       {/* Back Button */}
       <button onClick={() => navigate('/results')} className="absolute top-4 left-4 mb-4 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out z-10" aria-label="Back to results">
            &larr; Back to Results
       </button>


      {/* Plan Name & Profile */}
      {/* Adjust top padding if needed based on button layout */}
      <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-300 pt-20"> {/* Increased padding slightly */}
         {/* ... (keep existing name/profile display) ... */}
         <div> <h1 className="text-3xl font-bold">{plan.name ?? 'Unnamed Plan'}</h1> {plan.profile && <p className="text-sm text-gray-500 mt-1">Profile: {plan.profile}</p>} </div> {Object.prototype.hasOwnProperty.call(plan, 'name') && ( <button onClick={() => handleEditClick('name')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-shrink-0 mt-1">Edit Name</button> )}
      </div>

      {/* Optimization Summary */}
      {plan.optimizationSummary && (
           <section className="mb-6 p-4 border border-green-200 rounded-lg shadow-sm bg-green-50">
               <h2 className="text-xl font-semibold text-green-800 mb-2">Optimization Summary</h2>
               <p className="text-green-700 whitespace-pre-wrap">{plan.optimizationSummary}</p>
           </section>
      )}

      {/* Render all other sections as before */}
      {/* Description Section */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         {/* ... (keep existing description display) ... */}
         <div className="flex justify-between items-center mb-3"> <h2 className="text-xl font-semibold text-gray-700">Description</h2> {Object.prototype.hasOwnProperty.call(plan, 'description') && ( <button onClick={() => handleEditClick('description')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button> )} </div> <p className="text-gray-600 whitespace-pre-wrap">{plan.description ?? 'No description available.'}</p>
      </section>

      {/* Date Section */}
      {plan.date && ( <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white"> {/* ... (keep existing date display) ... */} <div className="flex justify-between items-center mb-3"> <h2 className="text-xl font-semibold text-gray-700">Date</h2> {Object.prototype.hasOwnProperty.call(plan, 'date') && ( <button onClick={() => handleEditClick('date')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button> )} </div> <p className="text-gray-600"> { (() => { try { const dateObj = new Date(plan.date); if (isNaN(dateObj.getTime())) return 'Invalid date format'; return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); } catch (e) { console.error("Error formatting date:", e); return 'Invalid date'; } })() } </p> </section> )}

      {/* Venue Section */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         {/* ... (keep existing venue display) ... */}
         <div className="flex justify-between items-center mb-3"> <h2 className="text-xl font-semibold text-gray-700">Venue</h2> {Object.prototype.hasOwnProperty.call(plan, 'venue') && ( <button onClick={() => handleEditClick('venue')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button> )} </div> {plan.venue ? ( <div className="space-y-2 text-gray-600"> <p><span className="font-medium text-gray-800">Name:</span> {plan.venue.name ?? 'N/A'}</p> <p><span className="font-medium text-gray-800">Description:</span> {plan.venue.description ?? 'N/A'}</p> <p><span className="font-medium text-gray-800">Cost Range:</span> {plan.venue.costRange ?? 'N/A'}</p> <p><span className="font-medium text-gray-800">Suitability:</span> {plan.venue.suitability ?? 'N/A'}</p> {renderList(plan.venue.amenities, 'Amenities')} </div> ) : ( <p className="text-gray-500 italic">No venue details specified.</p> )}
      </section>

      {/* Schedule Section */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         {/* ... (keep existing schedule display) ... */}
         <div className="flex justify-between items-center mb-3"> <h2 className="text-xl font-semibold text-gray-700">Schedule</h2> {Object.prototype.hasOwnProperty.call(plan, 'schedule') && ( <button onClick={() => handleEditClick('schedule')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button> )} </div> {plan.schedule && plan.schedule.length > 0 ? ( <ul className="list-disc pl-5 space-y-2"> {plan.schedule.map((item, index) => ( item && typeof item === 'object' && item.time && item.activity ? ( <li key={index} className="text-gray-600"> <span className="font-medium text-gray-800">{item.time}:</span> {item.activity} {item.details && <span className="text-sm italic ml-2">({item.details})</span>} </li> ) : null ))} </ul> ) : ( <p className="text-gray-500 italic">No schedule items added yet.</p> )}
      </section>

      {/* Catering Section */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         {/* ... (keep existing catering display) ... */}
         <div className="flex justify-between items-center mb-3"> <h2 className="text-xl font-semibold text-gray-700">Catering</h2> {Object.prototype.hasOwnProperty.call(plan, 'catering') && ( <button onClick={() => handleEditClick('catering')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button> )} </div> {plan.catering ? ( <div className="space-y-2 text-gray-600"> <p><span className="font-medium text-gray-800">Estimated Cost:</span> {plan.catering.estimatedCost ?? 'N/A'}</p> <p><span className="font-medium text-gray-800">Serving Style:</span> {plan.catering.servingStyle ?? 'N/A'}</p> {plan.catering.menu ? ( <div className="mt-3 pt-3 border-t border-gray-200"> <h3 className="text-lg font-semibold mb-2 text-gray-800">Menu</h3> {renderList(plan.catering.menu.appetizers, 'Appetizers')} {renderList(plan.catering.menu.mainCourses, 'Main Courses')} {plan.catering.menu.desserts ? ( <> <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">Desserts</h4> <p className="text-sm text-gray-600 pl-2">{typeof plan.catering.menu.desserts === 'string' ? plan.catering.menu.desserts : 'N/A'}</p> </> ) : null} {renderList(plan.catering.menu.beverages, 'Beverages')} </div> ) : <p className="text-gray-500 italic mt-2">No menu details specified.</p>} </div> ) : ( <p className="text-gray-500 italic">No catering details specified.</p> )}
      </section>

      {/* Guest Engagement Section */}
       <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         {/* ... (keep existing guest engagement display) ... */}
         <div className="flex justify-between items-center mb-3"> <h2 className="text-xl font-semibold text-gray-700">Guest Engagement</h2> {/* No edit button for guest engagement yet */} </div> {plan.guestEngagement ? ( <div className="space-y-2 text-gray-600"> {renderList(plan.guestEngagement.icebreakers, 'Icebreakers')} {renderList(plan.guestEngagement.interactiveElements, 'Interactive Elements')} {renderList(plan.guestEngagement.photoOpportunities, 'Photo Opportunities')} {renderList(plan.guestEngagement.partyFavors, 'Party Favors')} {renderList(plan.guestEngagement.techIntegration, 'Tech Integration')} </div> ) : ( <p className="text-gray-500 italic">No guest engagement details specified.</p> )}
      </section>

      {/* --- Render Modals --- */}

      {/* Edit Modal */}
      <EditPlanSectionModal
        isOpen={!!editingSection}
        onClose={handleCloseModal}
        section={editingSection}
        currentData={dataToEdit}
        onSave={handleSaveChanges}
      />

      {/* Budget Optimizer Modal */}
      {/* Ensure BudgetOptimizerModal is imported */}
      <BudgetOptimizerModal
          isOpen={isOptimizerOpen}
          onClose={handleCloseOptimizer}
          currentPlan={plan}
          userInput={userInput}
          onPlanUpdate={handleBudgetOptimized} // Pass the handler to receive optimized plan
      />

      {/* Invitation Creator Modal (Placeholder) */}
      {/* We will replace this with the actual component later */}
       {isInvitationModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
               <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                   <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Create Invitation</h3>
                        <button onClick={handleCloseInvitationModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                   </div>
                   <p className="text-sm text-gray-600 mb-4">Invitation creation component (<code className="text-xs bg-gray-100 p-1 rounded">SmartInvitation.tsx</code>) needs to be created/integrated here.</p>
                   <p className="text-xs text-gray-500 mb-4">Requires inputs for template style, time, and triggers the API call.</p>
                   {/* Display invite error state within modal */}
                   {inviteError && <p className="text-red-600 text-sm mt-2">{inviteError}</p>}
                   <button onClick={handleCloseInvitationModal} className="mt-4 px-4 py-2 bg-gray-200 rounded-md text-sm">Close</button>
               </div>
           </div>
       )}

    </div>
  );
};

export default PlanDetail;

