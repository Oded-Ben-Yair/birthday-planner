import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import EditPlanSectionModal from '../components/EditPlanSectionModal';

// --- Interfaces ---
// NOTE: It's assumed more detailed interfaces exist in 'src/types/index.ts'
// We are updating the Plan interface here to reflect the expected structure based on logs.

interface ScheduleItem {
  time: string;
  activity: string;
  details?: string;
}

// Assumed structure based on logs (Ideally defined in src/types/index.ts)
interface VenueDetails {
  name: string;
  address?: string; // Making address optional as it might not always be present/needed
  contact?: string;
  description?: string;
  costRange?: string;
  amenities?: string[];
  suitability?: string;
  venueSearchSuggestions?: string[]; // Added based on logs
}

// Assumed structure based on logs (Ideally defined in src/types/index.ts)
interface MenuItem {
    appetizers?: string[];
    mainCourses?: string[];
    desserts?: string[];
    beverages?: string[];
}

// Assumed structure based on logs (Ideally defined in src/types/index.ts)
interface CateringDetails {
  estimatedCost?: string;
  servingStyle?: string;
  menu?: MenuItem; // Use the MenuItem interface
  cateringSearchSuggestions?: string[]; // Added based on logs
}

// Assumed structure based on logs (Ideally defined in src/types/index.ts)
interface GuestEngagementDetails {
    icebreakers?: string[];
    interactiveElements?: string[];
    photoOpportunities?: string[];
    partyFavors?: string[];
    techIntegration?: string[];
    entertainmentSearchSuggestions?: string[]; // Added based on logs
}


// Updated Plan interface reflecting actual data structure
interface Plan {
  id: string;
  name: string;
  description: string;
  profile?: string; // Added based on logs
  date: string;
  venue: VenueDetails; // Use the detailed Venue interface
  schedule: ScheduleItem[];
  catering?: CateringDetails; // Use the detailed Catering interface
  guestEngagement?: GuestEngagementDetails; // Added based on logs
  // Add other plan properties as needed
}

/**
 * PlanDetail Component
 * Displays plan details and allows editing via a modal.
 */
const PlanDetail: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate(); // Hook for navigation
  const [plan, setPlan] = useState<Plan | null>(null);
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
    console.log(`PlanDetail: Value from localStorage.getItem('generatedPlans'):`, storedPlansString ? storedPlansString.substring(0, 100) + '...' : storedPlansString); // Log truncated value

    try {
      if (!storedPlansString) {
        console.error("PlanDetail: No valid plan data string found in localStorage.");
        throw new Error("No plans found in storage.");
      }

      // Parse the stored JSON string into an array of Plan objects
      // Use 'as any' temporarily if stored structure doesn't perfectly match initial Plan interface yet
      const storedPlans: Plan[] = JSON.parse(storedPlansString);
      console.log("PlanDetail: Successfully parsed plans from storage:", storedPlans);

      const foundPlan = storedPlans.find(p => p.id === planId);

      if (foundPlan) {
        console.log("PlanDetail: Plan found:", foundPlan);
        // Ensure the found plan conforms to the updated Plan interface structure
        // Add default empty structures if parts are missing, to prevent runtime errors
        const validatedPlan: Plan = {
            ...foundPlan,
            venue: foundPlan.venue || { name: 'N/A' }, // Provide default venue
            schedule: foundPlan.schedule || [],
            catering: foundPlan.catering || undefined, // Keep optional if missing
            guestEngagement: foundPlan.guestEngagement || undefined // Keep optional if missing
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
  const handleEditClick = (section: keyof Plan | string) => {
    if (!plan) return;

    let currentData: any;
    // Ensure section is a valid key of the Plan interface before accessing
    if (section in plan) {
         currentData = plan[section as keyof Plan];
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

  const handleSaveChanges = (updatedData: any) => {
    if (!plan || !editingSection) return;

    const updatedPlan: Plan = {
      ...plan,
      [editingSection]: updatedData,
    };

    setPlan(updatedPlan);
    setError(null);

    try {
      const currentStoredPlansString = localStorage.getItem('generatedPlans');
      if (!currentStoredPlansString) {
        throw new Error("Failed to retrieve plans from storage for saving.");
      }
      const storedPlans: Plan[] = JSON.parse(currentStoredPlansString);
      const planIndex = storedPlans.findIndex(p => p.id === planId);

      if (planIndex === -1) {
        throw new Error(`Plan with ID ${planId} not found in storage during save attempt.`);
      }
      storedPlans[planIndex] = updatedPlan;
      localStorage.setItem('generatedPlans', JSON.stringify(storedPlans));
      console.log("PlanDetail: Plan updated successfully in localStorage.");

    } catch (err: any) {
      console.error("PlanDetail: Error saving plan changes to localStorage:", err);
      setError("Failed to save changes. Please try again.");
    }
  };

  // --- Helper to render list items ---
  const renderList = (items: string[] | undefined, title: string) => {
      if (!items || items.length === 0) return null;
      return (
          <>
              <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700">{title}</h4>
              <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-600">
                  {items.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
          </>
      );
  }


  // --- Render Logic ---
  if (isLoading) return <div className="p-6 text-center">Loading plan details...</div>;
  const displayError = error ? <div className="p-4 mb-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">{error}</div> : null;
  if (!plan && !isLoading) return <div className="p-6 text-center text-red-600">Error: {error || 'Plan not found.'}</div>;
  if (!plan) return null;


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl font-inter">
      {displayError}

      {/* Plan Name & Profile */}
      <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-300">
        <div>
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

      {/* == Updated Venue Section == */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Venue</h2>
           <button onClick={() => handleEditClick('venue')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
         {plan.venue ? (
             <div className="space-y-2 text-gray-600">
                <p><span className="font-medium text-gray-800">Name:</span> {plan.venue.name || 'N/A'}</p>
                {plan.venue.description && <p><span className="font-medium text-gray-800">Description:</span> {plan.venue.description}</p>}
                {plan.venue.address && <p><span className="font-medium text-gray-800">Address:</span> {plan.venue.address}</p>}
                {plan.venue.contact && <p><span className="font-medium text-gray-800">Contact:</span> {plan.venue.contact}</p>}
                {plan.venue.costRange && <p><span className="font-medium text-gray-800">Cost Range:</span> {plan.venue.costRange}</p>}
                {plan.venue.suitability && <p><span className="font-medium text-gray-800">Suitability:</span> {plan.venue.suitability}</p>}
                {renderList(plan.venue.amenities, 'Amenities')}
                {/* Optionally display search suggestions */}
                {/* {renderList(plan.venue.venueSearchSuggestions, 'Search Suggestions')} */}
             </div>
         ) : (
            <p className="text-gray-500 italic">No venue details specified.</p>
         )}
      </section>

      {/* Schedule Section (No change needed for display) */}
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

      {/* == Updated Catering Section == */}
      <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Catering</h2>
           <button onClick={() => handleEditClick('catering')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button>
         </div>
         {plan.catering ? (
             <div className="space-y-2 text-gray-600">
                 {plan.catering.estimatedCost && <p><span className="font-medium text-gray-800">Estimated Cost:</span> {plan.catering.estimatedCost}</p>}
                 {plan.catering.servingStyle && <p><span className="font-medium text-gray-800">Serving Style:</span> {plan.catering.servingStyle}</p>}
                 {/* Render Menu Items */}
                 {plan.catering.menu && (
                     <div className="mt-3 pt-3 border-t border-gray-200">
                         <h3 className="text-lg font-semibold mb-2 text-gray-800">Menu</h3>
                         {renderList(plan.catering.menu.appetizers, 'Appetizers')}
                         {renderList(plan.catering.menu.mainCourses, 'Main Courses')}
                         {renderList(plan.catering.menu.desserts, 'Desserts')}
                         {renderList(plan.catering.menu.beverages, 'Beverages')}
                     </div>
                 )}
                 {/* Optionally display search suggestions */}
                 {/* {renderList(plan.catering.cateringSearchSuggestions, 'Search Suggestions')} */}
             </div>
         ) : (
            <p className="text-gray-500 italic">No catering details specified.</p>
         )}
      </section>

      {/* == Added Guest Engagement Section == */}
       <section className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
         <div className="flex justify-between items-center mb-3">
           <h2 className="text-xl font-semibold text-gray-700">Guest Engagement</h2>
           {/* Add Edit button if guestEngagement becomes editable */}
           {/* <button onClick={() => handleEditClick('guestEngagement')} className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Edit</button> */}
         </div>
         {plan.guestEngagement ? (
             <div className="space-y-2 text-gray-600">
                 {renderList(plan.guestEngagement.icebreakers, 'Icebreakers')}
                 {renderList(plan.guestEngagement.interactiveElements, 'Interactive Elements')}
                 {renderList(plan.guestEngagement.photoOpportunities, 'Photo Opportunities')}
                 {renderList(plan.guestEngagement.partyFavors, 'Party Favors')}
                 {renderList(plan.guestEngagement.techIntegration, 'Tech Integration')}
                 {/* Optionally display search suggestions */}
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

