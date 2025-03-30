import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EditPlanSectionModal from '../components/EditPlanSectionModal'; // Import the modal component

// --- Interfaces (Ensure consistency with modal and data source) ---
interface ScheduleItem {
  time: string;
  activity: string;
  details?: string;
}

interface Venue {
  name: string;
  address: string;
  contact?: string;
}

interface CateringItem {
  item: string;
  description?: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  date: string; // Store date as string (e.g., YYYY-MM-DD or ISO string)
  venue: Venue;
  schedule: ScheduleItem[];
  catering?: CateringItem[];
  // Add other plan properties as needed
}

/**
 * PlanDetail Component
 *
 * Displays plan details and allows editing via a modal.
 */
const PlanDetail: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- State for Modal ---
  const [editingSection, setEditingSection] = useState<string | null>(null); // e.g., 'name', 'venue'
  const [dataToEdit, setDataToEdit] = useState<any>(null); // Data passed to the modal

  // --- Load Initial Plan Data ---
  useEffect(() => {
    // Reset states on ID change or mount
    setIsLoading(true);
    setError(null);
    setPlan(null);
    setEditingSection(null);
    setDataToEdit(null);

    console.log(`PlanDetail: useEffect running for planId: ${planId}`); // Log effect start

    if (!planId) {
        console.error("PlanDetail: No Plan ID provided in the URL.");
        setError("No Plan ID provided in the URL.");
        setIsLoading(false);
        return; // Exit if no planId
    }

    // *** DEBUGGING LOG ADDED HERE ***
    const storedPlansString = localStorage.getItem('generatedPlans');
    console.log(`PlanDetail: Value from localStorage.getItem('generatedPlans'):`, storedPlansString); // Log the raw value

    try {
      // Retrieve the array of plans from localStorage
      // const storedPlansString = localStorage.getItem('generatedPlans'); // Moved log above try block

      // Check if the string is null, undefined, or empty *before* trying to parse
      if (!storedPlansString) {
        console.error("PlanDetail: No valid plan data string found in localStorage."); // More specific log
        throw new Error("No plans found in storage."); // This is the error you're seeing
      }

      // Now attempt to parse
      const storedPlans: Plan[] = JSON.parse(storedPlansString);
      console.log("PlanDetail: Successfully parsed plans from storage:", storedPlans); // Log parsed data

      // Find the specific plan by its ID
      const foundPlan = storedPlans.find(p => p.id === planId);

      if (foundPlan) {
        console.log("PlanDetail: Plan found:", foundPlan); // Debugging log
        setPlan(foundPlan); // Set the found plan into state
      } else {
        console.warn(`PlanDetail: Plan with ID ${planId} not found within the stored plans array.`); // More specific log
        throw new Error(`Plan with ID ${planId} not found.`);
      }
    } catch (err: any) {
      // Catch errors from JSON.parse or the explicit throws above
      console.error("PlanDetail: Error loading plan:", err); // Log the actual error
      // Set error state to display feedback to the user
      setError(err.message || "An error occurred while loading the plan.");
    } finally {
      // Set loading to false regardless of success or failure
      setIsLoading(false);
      console.log("PlanDetail: useEffect finished."); // Log effect end
    }

    // The dependency array [planId] ensures this effect runs again if the planId changes
  }, [planId]);

  // --- Modal Control Functions ---

  // Opens the modal for the specified section
  const handleEditClick = (section: keyof Plan | string) => {
    if (!plan) return;

    let currentData: any;
    switch (section) {
        case 'name':
        case 'description':
        case 'date':
        case 'venue':
        case 'schedule':
        case 'catering':
            currentData = plan[section as keyof Plan];
            break;
        default:
            console.warn(`Attempting to edit unhandled section: ${section}`);
            return;
    }
    setDataToEdit(currentData);
    setEditingSection(section);
  };

  // Closes the modal
  const handleCloseModal = () => {
    setEditingSection(null);
    setDataToEdit(null);
  };

  // Saves changes from the modal
  const handleSaveChanges = (updatedData: any) => {
    if (!plan || !editingSection) return;

    const updatedPlan: Plan = {
      ...plan,
      [editingSection]: updatedData,
    };

    setPlan(updatedPlan); // Update state first (optimistic update)
    setError(null); // Clear previous save errors

    try {
      const currentStoredPlansString = localStorage.getItem('generatedPlans'); // Re-fetch fresh data
      if (!currentStoredPlansString) {
        throw new Error("Failed to retrieve plans from storage for saving.");
      }
      const storedPlans: Plan[] = JSON.parse(currentStoredPlansString);
      const planIndex = storedPlans.findIndex(p => p.id === planId);

      if (planIndex === -1) {
        // This could happen if storage was cleared between load and save
        throw new Error(`Plan with ID ${planId} not found in storage during save attempt.`);
      }
      storedPlans[planIndex] = updatedPlan;
      localStorage.setItem('generatedPlans', JSON.stringify(storedPlans));
      console.log("PlanDetail: Plan updated successfully in localStorage.");

    } catch (err: any) {
      console.error("PlanDetail: Error saving plan changes to localStorage:", err);
      setError("Failed to save changes. Please try again.");
      // Consider reverting the optimistic update if save fails
      // setPlan(plan);
    }
  };


  // --- Render Logic ---
  if (isLoading) return <div className="p-6 text-center">Loading plan details...</div>;
  // Keep showing error even if plan data exists (e.g., for save errors)
  const displayError = error ? <div className="p-4 mb-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">{error}</div> : null;
  if (!plan && !isLoading) return <div className="p-6 text-center text-red-600">Error: {error || 'Plan not found.'}</div>; // Show error or 'not found' if plan is null after loading
  if (!plan) return null; // Should not be reached if logic above is correct, but prevents errors accessing plan properties


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl font-inter">
      {displayError} {/* Display load or save errors here */}

      {/* Plan Name */}
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-300">
        <h1 className="text-3xl font-bold">{plan.name}</h1>
        <button onClick={() => handleEditClick('name')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
      </div>

      {/* Description Section */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-700">Description</h2>
          <button onClick={() => handleEditClick('description')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
        </div>
        <p className="text-gray-600 whitespace-pre-wrap">{plan.description}</p>
      </section>

      {/* Date Section */}
       <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Date</h2>
           <button onClick={() => handleEditClick('date')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
        <p className="text-gray-600">{plan.date ? new Date(plan.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Not set'}</p>
      </section>

      {/* Venue Section */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Venue</h2>
           <button onClick={() => handleEditClick('venue')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
        <p className="text-gray-800 font-medium">{plan.venue?.name || 'Not set'}</p>
        <p className="text-gray-600">{plan.venue?.address || ''}</p>
        {plan.venue?.contact && <p className="text-gray-600 mt-1">Contact: {plan.venue.contact}</p>}
      </section>

      {/* Schedule Section */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Schedule</h2>
           <button onClick={() => handleEditClick('schedule')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
         {plan.schedule && plan.schedule.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {plan.schedule.map((item, index) => (
                <li key={index} className="text-gray-600">
                  <span className="font-medium text-gray-800">{item.time}:</span> {item.activity}
                  {item.details && <span className="text-sm italic ml-2">({item.details})</span>}
                </li>
              ))}
            </ul>
         ) : (
            <p className="text-gray-500 italic">No schedule items added yet.</p>
         )}
      </section>

      {/* Catering Section */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Catering Menu</h2>
           <button onClick={() => handleEditClick('catering')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
         {plan.catering && plan.catering.length > 0 ? (
             <ul className="list-disc pl-5 space-y-2">
                 {plan.catering.map((item, index) => (
                 <li key={index} className="text-gray-600">
                     <span className="font-medium text-gray-800">{item.item}</span>
                     {item.description && <span className="text-sm italic ml-2">- {item.description}</span>}
                 </li>
                 ))}
             </ul>
         ) : (
            <p className="text-gray-500 italic">No catering items specified.</p>
         )}
      </section>

      {/* Render Edit Modal */}
      <EditPlanSectionModal
        isOpen={!!editingSection}
        onClose={handleCloseModal}
        section={editingSection}
        currentData={dataToEdit}
        onSave={handleSaveChanges}
      />

    </div>
  );
};

export default PlanDetail;
