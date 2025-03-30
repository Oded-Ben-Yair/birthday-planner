import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditPlanSectionModal from '../components/EditPlanSectionModal';
// Import types from the central types file
import type {
    BirthdayPlan,
    Venue,
    Catering,
    GuestEngagement,
    ScheduleItem,
    CateringMenu // Import CateringMenu specifically if needed, or rely on Catering type
} from '../types';

/**
 * PlanDetail Component
 * Displays plan details and allows editing via a modal.
 * Aligned with definitions in src/types/index.ts
 */
const PlanDetail: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
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

      // Parse using BirthdayPlan type
      const storedPlans: BirthdayPlan[] = JSON.parse(storedPlansString);
      console.log("PlanDetail: Successfully parsed plans from storage:", storedPlans);

      const foundPlan = storedPlans.find(p => p.id === planId);

      if (foundPlan) {
        console.log("PlanDetail: Plan found:", foundPlan);
        // Basic validation/default setting - could use type guard from types/index.ts if needed
        const validatedPlan: BirthdayPlan = {
            ...foundPlan,
            // Ensure required fields have defaults if somehow missing after parse, though types say they exist
            venue: foundPlan.venue || { name: 'N/A', description: '', costRange: '', amenities: [], suitability: '' },
            schedule: foundPlan.schedule || [],
            catering: foundPlan.catering || { estimatedCost: '', servingStyle: '', menu: { appetizers: [], mainCourses: [], desserts: '', beverages: [] } },
            guestEngagement: foundPlan.guestEngagement || { icebreakers: [], interactiveElements: [], photoOpportunities: [], partyFavors: [] }
        };
        setPlan(validatedPlan);
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
  }, [planId]);

  // --- Modal Control Functions ---
  const handleEditClick = (section: keyof BirthdayPlan | string) => {
    if (!plan) return;
    let currentData: any;
    // Check against BirthdayPlan keys
    if (section in plan) {
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

    // Use BirthdayPlan type for updated plan
    const updatedPlan: BirthdayPlan = {
        ...plan,
        [editingSection]: updatedData,
     };

    setPlan(updatedPlan);
    setError(null);

    try {
      const currentStoredPlansString = localStorage.getItem('generatedPlans');
      if (!currentStoredPlansString) throw new Error("Failed to retrieve plans from storage for saving.");
      // Parse using BirthdayPlan type
      const storedPlans: BirthdayPlan[] = JSON.parse(currentStoredPlansString);
      const planIndex = storedPlans.findIndex(p => p.id === planId);
      if (planIndex === -1) throw new Error(`Plan with ID ${planId} not found in storage during save attempt.`);
      storedPlans[planIndex] = updatedPlan;
      localStorage.setItem('generatedPlans', JSON.stringify(storedPlans));
      console.log("PlanDetail: Plan updated successfully in localStorage.");
    } catch (err: any) {
      console.error("PlanDetail: Error saving plan changes to localStorage:", err);
      setError("Failed to save changes. Please try again.");
    }
  };

  // --- Helper to render list items (Handles string[] or string fallback) ---
  const renderList = (items: string[] | string | undefined, title: string) => {
      console.log(`renderList called for: ${title}`, 'with items:', items);
      if (!items) return null;

      if (Array.isArray(items)) {
          if (items.length === 0) return null;
          return (
              <>
                  <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">{title}</h4>
                  <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600">
                      {items.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
              </>
          );
      } else if (typeof items === 'string' && items.trim() !== '') {
          console.warn(`renderList Warning: Expected an array for '${title}', but received a string: "${items}". Rendering as single item.`);
          return (
               <>
                  <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">{title}</h4>
                  <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600">
                      <li>{items}</li>
                  </ul>
              </>
          );
      } else {
          console.warn(`renderList Warning: Expected an array for '${title}', but received type '${typeof items}'. Value:`, items);
          return null;
      }
  }

  // --- Render Logic ---
  if (isLoading) return <div className="p-6 text-center">Loading plan details...</div>;
  const displayError = error ? <div className="p-4 mb-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">{error}</div> : null;
  if (!plan && !isLoading) return <div className="p-6 text-center text-red-600">Error: {error || 'Plan not found.'}</div>;
  if (!plan) return null; // Should be BirthdayPlan | null

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl font-inter">
      {displayError}

      {/* Plan Name & Profile */}
      <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-300">
        <div>
            {/* Use BirthdayPlan properties */}
            <h1 className="text-3xl font-bold">{plan.name}</h1>
            {plan.profile && <p className="text-sm text-gray-500 mt-1">Profile: {plan.profile}</p>}
        </div>
        <button onClick={() => handleEditClick('name')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-shrink-0 mt-1">Edit Name</button>
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

      {/* Venue Section - Aligned with Venue type from types/index.ts */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Venue</h2>
           <button onClick={() => handleEditClick('venue')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
         {/* Use optional chaining ?. for safety, even if type requires venue */}
         {plan.venue ? (
             <div className="space-y-2 text-gray-600">
                <p><span className="font-medium text-gray-800">Name:</span> {plan.venue.name || 'N/A'}</p>
                {plan.venue.description && <p><span className="font-medium text-gray-800">Description:</span> {plan.venue.description}</p>}
                {/* Removed address and contact as they are not in the Venue type */}
                {plan.venue.costRange && <p><span className="font-medium text-gray-800">Cost Range:</span> {plan.venue.costRange}</p>}
                {plan.venue.suitability && <p><span className="font-medium text-gray-800">Suitability:</span> {plan.venue.suitability}</p>}
                {/* Render amenities using the robust helper */}
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

      {/* Catering Section - Aligned with Catering and CateringMenu types */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Catering</h2>
           <button onClick={() => handleEditClick('catering')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
         {/* Use optional chaining ?. for safety */}
         {plan.catering ? (
             <div className="space-y-2 text-gray-600">
                 {plan.catering.estimatedCost && <p><span className="font-medium text-gray-800">Estimated Cost:</span> {plan.catering.estimatedCost}</p>}
                 {plan.catering.servingStyle && <p><span className="font-medium text-gray-800">Serving Style:</span> {plan.catering.servingStyle}</p>}
                 {/* Use optional chaining for menu */}
                 {plan.catering.menu && (
                     <div className="mt-3 pt-3 border-t border-gray-200">
                         <h3 className="text-lg font-semibold mb-2 text-gray-800">Menu</h3>
                         {/* Use renderList for arrays */}
                         {renderList(plan.catering.menu.appetizers, 'Appetizers')}
                         {renderList(plan.catering.menu.mainCourses, 'Main Courses')}
                         {/* Render desserts directly as it's a string */}
                         {plan.catering.menu.desserts && (
                             <>
                                <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">Desserts</h4>
                                <p className="text-sm text-gray-600 pl-2">{plan.catering.menu.desserts}</p>
                             </>
                         )}
                         {renderList(plan.catering.menu.beverages, 'Beverages')}
                     </div>
                 )}
                 {/* {renderList(plan.catering.cateringSearchSuggestions, 'Search Suggestions')} */}
             </div>
         ) : (
            <p className="text-gray-500 italic">No catering details specified.</p>
         )}
      </section>

      {/* Guest Engagement Section - Aligned with GuestEngagement type */}
       <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Guest Engagement</h2>
           {/* <button onClick={() => handleEditClick('guestEngagement')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button> */}
         </div>
         {/* Use optional chaining ?. for safety */}
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

