import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditPlanSectionModal from '../components/EditPlanSectionModal';
// Import types from the central types file
import type {
    BirthdayPlan,
    Venue, // Assuming Venue is the correct detailed type name in types/index.ts
    Catering, // Assuming Catering is the correct detailed type name
    GuestEngagement, // Assuming GuestEngagement is the correct detailed type name
    ScheduleItem,
    CateringMenu // Keep if needed, or rely on Catering type
} from '../types';

/**
 * PlanDetail Component
 * Displays plan details, allows editing via a modal, and includes navigation.
 */
const PlanDetail: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate(); // Hook for navigation
  // Use the imported BirthdayPlan type for state
  const [plan, setPlan] = useState<BirthdayPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [dataToEdit, setDataToEdit] = useState<any>(null);

  // --- Load Initial Plan Data ---
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setPlan(null);
    setEditingSection(null);
    setDataToEdit(null);

    console.log(`PlanDetail: useEffect running for planId: ${planId}`);

    if (!planId) {
      console.error("PlanDetail: No Plan ID provided in the URL.");
      setError("No Plan ID provided in the URL.");
      setIsLoading(false);
      return;
    }

    const storedPlansString = localStorage.getItem('generatedPlans');
    console.log(`PlanDetail: Value from localStorage.getItem('generatedPlans'):`, storedPlansString ? storedPlansString.substring(0, 100) + '...' : storedPlansString);

    try {
      if (!storedPlansString) {
        console.error("PlanDetail: No valid plan data string found in localStorage.");
        throw new Error("No plans found in storage.");
      }

      const storedPlans: BirthdayPlan[] = JSON.parse(storedPlansString);
      console.log("PlanDetail: Successfully parsed plans from storage:", storedPlans);

      const foundPlan = storedPlans.find(p => p.id === planId);

      if (foundPlan) {
        console.log("PlanDetail: Plan found:", foundPlan);
        // Use the found plan directly, assuming it matches BirthdayPlan type
        setPlan(foundPlan);
      } else {
        console.warn(`PlanDetail: Plan with ID ${planId} not found within the stored plans array.`);
        throw new Error(`Plan with ID ${planId} not found.`);
      }
    } catch (err: any) {
      console.error("PlanDetail: Error loading plan:", err);
      setError(err.message || "An error occurred while loading the plan.");
    } finally {
      setIsLoading(false);
      console.log("PlanDetail: useEffect finished.");
    }
  }, [planId]); // Dependency array ensures effect runs if planId changes

  // --- Modal Control Functions ---
  const handleEditClick = (section: keyof BirthdayPlan | string) => {
    if (!plan) return;
    let currentData: any;
    // Ensure section is a valid key before accessing plan properties
    if (Object.prototype.hasOwnProperty.call(plan, section)) {
         currentData = plan[section as keyof BirthdayPlan];
    } else {
         console.warn(`Attempting to edit unhandled or invalid section: ${section}`);
         return;
    }
    setDataToEdit(currentData);
    setEditingSection(section);
  };

  const handleCloseModal = () => {
    setEditingSection(null);
    setDataToEdit(null);
  };

  // Saves changes from the modal
  const handleSaveChanges = (updatedData: any) => {
    if (!plan || !editingSection) return;

    const updatedPlan: BirthdayPlan = { ...plan, [editingSection]: updatedData };
    setPlan(updatedPlan); // Optimistic UI update
    setError(null); // Clear previous errors

    try {
      const currentStoredPlansString = localStorage.getItem('generatedPlans');
      if (!currentStoredPlansString) throw new Error("Failed to retrieve plans from storage for saving.");

      const storedPlans: BirthdayPlan[] = JSON.parse(currentStoredPlansString);
      const planIndex = storedPlans.findIndex(p => p.id === planId);

      if (planIndex === -1) throw new Error(`Plan with ID ${planId} not found in storage during save attempt.`);

      storedPlans[planIndex] = updatedPlan; // Replace the old plan with the updated one
      localStorage.setItem('generatedPlans', JSON.stringify(storedPlans));
      console.log("PlanDetail: Plan updated successfully in localStorage.");

    } catch (err: any) {
      console.error("PlanDetail: Error saving plan changes to localStorage:", err);
      setError("Failed to save changes. Please try again.");
      // Consider reverting optimistic update: setPlan(plan);
    }
  };

  // --- Helper to render list items (Handles string[] or string fallback) ---
  const renderList = (items: string[] | string | undefined, title: string) => {
      // console.log(`renderList called for: ${title}`, 'with items:', items); // Optional: Keep for debugging data structure issues
      if (!items || (Array.isArray(items) && items.length === 0)) return null; // Hide if undefined or empty array

      let listItems: React.ReactNode;
      if (Array.isArray(items)) {
          listItems = items.map((item, index) => <li key={index}>{item || 'N/A'}</li>);
      } else if (typeof items === 'string' && items.trim() !== '') {
          console.warn(`renderList Warning: Expected an array for '${title}', but received a string: "${items}". Rendering as single item.`);
          listItems = <li>{items}</li>;
      } else {
           console.warn(`renderList Warning: Expected an array for '${title}', but received type '${typeof items}'. Value:`, items);
           return null;
      }

      return (
          <>
              <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">{title}</h4>
              <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600">
                  {listItems}
              </ul>
          </>
      );
  }


  // --- Render Logic ---
  if (isLoading) return <div className="p-6 text-center">Loading plan details...</div>;
  const displayError = error ? <div className="p-4 mb-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">{error}</div> : null;
  if (!plan && !isLoading) return <div className="p-6 text-center text-red-600">Error: {error || 'Plan data could not be loaded.'}</div>;
  if (!plan) return null;

  return (
    // Added relative positioning for the absolute back button
    <div className="container mx-auto p-4 md:p-8 max-w-4xl font-inter relative">
      {displayError}

      {/* Back Button Added Here */}
       <button
            onClick={() => navigate('/results')} // Navigate back to the results page
            // Style the button: gray background, rounded, padding, hover effect, positioned top-left
            className="absolute top-4 left-4 mb-4 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
            aria-label="Back to results"
        >
            &larr; Back to Results {/* Left arrow entity */}
       </button>

      {/* Plan Name & Profile */}
      {/* Added pt-16 to give space below the absolute positioned back button */}
      <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-300 pt-16">
        <div>
            <h1 className="text-3xl font-bold">{plan.name ?? 'Unnamed Plan'}</h1>
            {plan.profile && <p className="text-sm text-gray-500 mt-1">Profile: {plan.profile}</p>}
        </div>
        {/* Ensure 'name' is a valid key before allowing edit */}
        {Object.prototype.hasOwnProperty.call(plan, 'name') && (
             <button onClick={() => handleEditClick('name')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-shrink-0 mt-1">Edit Name</button>
        )}
      </div>

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

      {/* Date Section */}
      {/* Conditionally render date section only if plan.date exists */}
      {plan.date && (
            <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
               <div className="flex justify-between items-center mb-3">
                 <h2 className="text-xl font-semibold text-gray-700">Date</h2>
                 {Object.prototype.hasOwnProperty.call(plan, 'date') && (
                    <button onClick={() => handleEditClick('date')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
                 )}
               </div>
               <p className="text-gray-600">
                  { (() => {
                      try {
                          // Attempt to format date, provide fallback for invalid dates
                          const dateObj = new Date(plan.date);
                          if (isNaN(dateObj.getTime())) return 'Invalid date format';
                          return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
                      } catch (e) {
                          return 'Invalid date';
                      }
                  })() }
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
         {/* Use optional chaining and nullish coalescing for safer access */}
         {plan.venue ? (
             <div className="space-y-2 text-gray-600">
                <p><span className="font-medium text-gray-800">Name:</span> {plan.venue.name ?? 'N/A'}</p>
                <p><span className="font-medium text-gray-800">Description:</span> {plan.venue.description ?? 'N/A'}</p>
                <p><span className="font-medium text-gray-800">Cost Range:</span> {plan.venue.costRange ?? 'N/A'}</p>
                <p><span className="font-medium text-gray-800">Suitability:</span> {plan.venue.suitability ?? 'N/A'}</p>
                {renderList(plan.venue.amenities, 'Amenities')}
                {/* {renderList(plan.venue.venueSearchSuggestions, 'Search Suggestions')} */}
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
              {plan.schedule.map((item, index) => (
                item && item.time && item.activity ? ( // Check item validity
                    <li key={index} className="text-gray-600">
                      <span className="font-medium text-gray-800">{item.time}:</span> {item.activity}
                      {item.details && <span className="text-sm italic ml-2">({item.details})</span>}
                    </li>
                ) : null
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
                 {plan.catering.menu ? ( // Check if menu object exists
                     <div className="mt-3 pt-3 border-t border-gray-200">
                         <h3 className="text-lg font-semibold mb-2 text-gray-800">Menu</h3>
                         {renderList(plan.catering.menu.appetizers, 'Appetizers')}
                         {renderList(plan.catering.menu.mainCourses, 'Main Courses')}
                         {plan.catering.menu.desserts ? ( // Check if desserts string exists
                             <>
                                <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">Desserts</h4>
                                <p className="text-sm text-gray-600 pl-2">{plan.catering.menu.desserts}</p>
                             </>
                         ) : null}
                         {renderList(plan.catering.menu.beverages, 'Beverages')}
                     </div>
                 ) : <p className="text-gray-500 italic mt-2">No menu details specified.</p>}
                 {/* {renderList(plan.catering.cateringSearchSuggestions, 'Search Suggestions')} */}
             </div>
         ) : (
            <p className="text-gray-500 italic">No catering details specified.</p>
         )}
      </section>

      {/* Guest Engagement Section */}
       <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Guest Engagement</h2>
           {/* No edit button for guest engagement yet */}
         </div>
         {plan.guestEngagement ? (
             <div className="space-y-2 text-gray-600">
                 {renderList(plan.guestEngagement.icebreakers, 'Icebreakers')}
                 {renderList(plan.guestEngagement.interactiveElements, 'Interactive Elements')}
                 {renderList(plan.guestEngagement.photoOpportunities, 'Photo Opportunities')}
                 {renderList(plan.guestEngagement.partyFavors, 'Party Favors')}
                 {renderList(plan.guestEngagement.techIntegration, 'Tech Integration')}
                 {/* {renderList(plan.guestEngagement.entertainmentSearchSuggestions, 'Search Suggestions')} */}
             </div>
         ) : (
            <p className="text-gray-500 italic">No guest engagement details specified.</p>
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

