import React, { useState, useEffect } from 'react';

// --- Re-define interfaces here or import from a central types file ---
// Ensure these match the definitions in PlanDetail.tsx or your central types definition
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

// Define the props the modal will accept
interface EditPlanSectionModalProps {
  isOpen: boolean; // Controls if the modal is visible
  onClose: () => void; // Function to call when closing the modal
  section: string | null; // Which section is being edited ('name', 'description', 'venue', etc.)
  currentData: any; // The current data for the section being edited
  onSave: (updatedData: any) => void; // Function to call when saving changes
}

/**
 * EditPlanSectionModal Component
 *
 * A reusable modal for editing different sections of a plan.
 */
const EditPlanSectionModal: React.FC<EditPlanSectionModalProps> = ({
  isOpen,
  onClose,
  section,
  currentData,
  onSave,
}) => {
  // State to hold the form data within the modal
  const [formData, setFormData] = useState<any>(null);

  // Effect to update internal form state when the modal opens or data changes
  useEffect(() => {
    // Deep copy currentData to avoid mutating the original state directly
    // Use structuredClone for deep copying, or JSON parse/stringify as a fallback
    if (currentData !== null && currentData !== undefined) {
       try {
           setFormData(structuredClone(currentData));
       } catch (e) {
           console.warn("structuredClone not available, falling back to JSON copy.");
           setFormData(JSON.parse(JSON.stringify(currentData))); // Fallback deep copy
       }
    } else {
       setFormData(currentData); // Handle null/undefined cases (e.g., for adding new items later)
    }
  }, [currentData, isOpen]); // Re-run if the data or open state changes

  // Handle input changes for simple fields (text, textarea, date)
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle input changes for nested objects like 'venue'
   const handleVenueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target; // name will be 'venue.name', 'venue.address' etc.
    const field = name.split('.')[1]; // 'name', 'address', 'contact'
    setFormData((prevData: Venue) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // Handle saving the form data
  const handleSave = () => {
    onSave(formData); // Pass the updated data back to the parent
    onClose(); // Close the modal after saving
  };

  // --- Render Logic ---

  // Don't render anything if the modal isn't open or no section is specified
  if (!isOpen || !section || formData === null) {
    return null;
  }

  // Function to render the correct form fields based on the section
  const renderFormFields = () => {
    switch (section) {
      case 'name':
        return (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name
            </label>
            <input
              type="text"
              id="name"
              name="name" // Make sure name matches the state key
              value={formData || ''} // Use formData directly as it's the string itself
              onChange={(e) => setFormData(e.target.value)} // Update the string state directly
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
      case 'description':
        return (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description" // Make sure name matches the state key
              rows={4}
              value={formData || ''} // Use formData directly
              onChange={(e) => setFormData(e.target.value)} // Update the string state directly
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
       case 'date':
         // Ensure date is handled correctly (input type="date" expects YYYY-MM-DD)
         const dateValue = formData ? new Date(formData).toISOString().split('T')[0] : '';
         return (
           <div>
             <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
               Date
             </label>
             <input
               type="date"
               id="date"
               name="date"
               value={dateValue}
               onChange={(e) => setFormData(e.target.value)} // Store as YYYY-MM-DD string, can be converted back later
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
             />
           </div>
         );
      case 'venue':
        // Assuming formData is the venue object { name: '', address: '', contact: '' }
        return (
          <div className="space-y-3">
            <div>
              <label htmlFor="venue.name" className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                id="venue.name"
                name="venue.name" // Use dot notation for identification, handle in change handler
                value={formData.name || ''}
                onChange={handleVenueChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="venue.address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="venue.address"
                name="venue.address"
                value={formData.address || ''}
                onChange={handleVenueChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="venue.contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact (Optional)
              </label>
              <input
                type="text"
                id="venue.contact"
                name="venue.contact"
                value={formData.contact || ''}
                onChange={handleVenueChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        );

      case 'schedule':
        // TODO: Implement editing for schedule array (add, delete, modify items)
        // For now, just display a message or the raw data
        return (
            <div>
                <h4 className="text-md font-medium text-gray-800 mb-2">Edit Schedule</h4>
                <p className="text-sm text-gray-500 mb-2">Editing functionality for list items (add/delete/modify) will be added here.</p>
                {/* You could display the current items read-only for reference */}
                 <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                     {JSON.stringify(formData, null, 2)}
                 </pre>
            </div>
        );

      case 'catering':
        // TODO: Implement editing for catering array (add, delete, modify items)
         return (
            <div>
                <h4 className="text-md font-medium text-gray-800 mb-2">Edit Catering Menu</h4>
                <p className="text-sm text-gray-500 mb-2">Editing functionality for list items (add/delete/modify) will be added here.</p>
                 <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                     {JSON.stringify(formData, null, 2)}
                 </pre>
            </div>
        );

      // Add cases for other sections like 'guestlist', 'budget' if needed

      default:
        return <p>Editing for section "{section}" is not implemented yet.</p>;
    }
  };

  // Capitalize first letter of section for title
  const modalTitle = section ? `Edit ${section.charAt(0).toUpperCase() + section.slice(1)}` : 'Edit Section';

  return (
    // Modal backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
      {/* Modal content */}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{modalTitle}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close modal"
          >
            {/* Simple 'X' icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - Render form fields */}
        <div className="mb-6">
          {renderFormFields()}
        </div>

        {/* Modal Footer - Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPlanSectionModal;
