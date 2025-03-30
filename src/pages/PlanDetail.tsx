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
    setIsLoading(true);
    setError(null);
    setPlan(null);
    setEditingSection(null); // Reset modal state on load/ID change
    setDataToEdit(null);

    if (!planId) {
      setError("No Plan ID provided in the URL.");
      setIsLoading(false);
      return;
    }

    try {
      const storedPlansString = localStorage.getItem('generatedPlans');
      if (!storedPlansString) {
        throw new Error("No plans found in storage.");
      }
      const storedPlans: Plan[] = JSON.parse(storedPlansString);
      const foundPlan = storedPlans.find(p => p.id === planId);

      if (foundPlan) {
        setPlan(foundPlan);
      } else {
        throw new Error(`Plan with ID ${planId} not found.`);
      }
    } catch (err: any) {
      console.error("Error loading plan:", err);
      setError(err.message || "An error occurred while loading the plan.");
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  // --- Modal Control Functions ---

  // Opens the modal for the specified section
  const handleEditClick = (section: keyof Plan | string) => {
    if (!plan) return; // Should not happen if plan is loaded

    let currentData: any;
    // Determine the data to pass based on the section key
    switch (section) {
        case 'name':
        case 'description':
        case 'date':
        case 'venue':
        case 'schedule':
        case 'catering':
            currentData = plan[section as keyof Plan]; // Access plan property directly
            break;
        // Add cases for other top-level editable properties if needed
        default:
            console.warn(`Attempting to edit unhandled section: ${section}`);
            return; // Don't open modal for unhandled sections
    }

    console.log(`Editing section: ${section}, Data:`, currentData); // Debug log
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
    if (!plan || !editingSection) return; // Should not happen if modal was open

    console.log(`Saving changes for section: ${editingSection}, Data:`, updatedData); // Debug log

    // Create the updated plan object
    const updatedPlan: Plan = {
      ...plan,
      [editingSection]: updatedData, // Update the specific section
    };

    // 1. Update component state
    setPlan(updatedPlan);

    // 2. Update localStorage
    try {
      const storedPlansString = localStorage.getItem('generatedPlans');
      if (!storedPlansString) {
        throw new Error("Failed to retrieve plans from storage for saving.");
      }
      const storedPlans: Plan[] = JSON.parse(storedPlansString);

      // Find the index of the plan to update
      const planIndex = storedPlans.findIndex(p => p.id === planId);

      if (planIndex === -1) {
        throw new Error(`Plan with ID ${planId} not found in storage during save.`);
      }

      // Replace the old plan with the updated one
      storedPlans[planIndex] = updatedPlan;

      // Save the updated array back to localStorage
      localStorage.setItem('generatedPlans', JSON.stringify(storedPlans));
      console.log("Plan updated successfully in localStorage."); // Debug log

    } catch (err: any) {
      console.error("Error saving plan changes to localStorage:", err);
      // Optionally: Display an error message to the user
      setError("Failed to save changes. Please try again.");
      // Optionally: Revert state change if save fails?
      // setPlan(plan); // Revert to original plan state
    }

    // Close the modal automatically (handled by modal's handleSave)
    // handleCloseModal(); // No need to call here, modal calls onClose which triggers this
  };


  // --- Render Logic ---
  if (isLoading) return <div className="p-6 text-center">Loading plan details...</div>;
  if (error && !plan) return <div className="p-6 text-center text-red-600">Error: {error}</div>; // Show load error only if plan isn't loaded
  if (!plan) return <div className="p-6 text-center">Plan not found.</div>;

  // Display potential save error
  const displayError = error && plan ? <div className="p-4 mb-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">{error}</div> : null;


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl font-inter">
      {displayError} {/* Display save errors here */}

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
        <p className="text-gray-600 whitespace-pre-wrap">{plan.description}</p> {/* Use pre-wrap to respect newlines */}
      </section>

      {/* Date Section */}
       <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Date</h2>
           <button onClick={() => handleEditClick('date')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
        <p className="text-gray-600">{plan.date ? new Date(plan.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Not set'}</p> {/* Better date formatting, handle potential invalid date */}
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

      {/* --- Render Edit Modal --- */}
      {/* The modal is rendered conditionally based on editingSection state */}
      <EditPlanSectionModal
        isOpen={!!editingSection} // Boolean cast: true if editingSection is not null/empty
        onClose={handleCloseModal}
        section={editingSection}
        currentData={dataToEdit}
        onSave={handleSaveChanges}
      />

    </div>
  );
};

export default PlanDetail;
