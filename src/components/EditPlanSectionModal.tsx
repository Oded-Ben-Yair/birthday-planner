import React, { useState, useEffect } from 'react';
// Import ScheduleItem type from your central types file
// Also import Venue if needed for that section's editing logic
import type { ScheduleItem, Venue } from '../types'; // Assuming Venue is also defined/needed

// Define the props the modal will accept
interface EditPlanSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string | null; // Which section is being edited ('name', 'description', 'venue', 'schedule', etc.)
  currentData: any; // Data for the section being edited (e.g., string for name, Venue object for venue, ScheduleItem[] for schedule)
  onSave: (updatedData: any) => void; // Function to call when saving changes
}

/**
 * EditPlanSectionModal Component
 * A reusable modal for editing different sections of a plan, now including Schedule list editing.
 */
const EditPlanSectionModal: React.FC<EditPlanSectionModalProps> = ({
  isOpen,
  onClose,
  section,
  currentData,
  onSave,
}) => {
  // State to hold the form data within the modal
  // Needs to handle different data types (string, object, array)
  const [formData, setFormData] = useState<any>(null);

  // Effect to update internal form state when the modal opens or data changes
  useEffect(() => {
    // Only update state if the modal is open to avoid background changes
    if (isOpen) {
        let initialData = null;
        // Deep copy to prevent direct mutation of parent state
        if (currentData !== null && currentData !== undefined) {
            try {
                initialData = structuredClone(currentData);
            } catch (e) {
                console.warn("structuredClone not available, falling back to JSON copy.");
                initialData = JSON.parse(JSON.stringify(currentData));
            }
        }

        // Ensure schedule is always an array when editing that section
        if (section === 'schedule') {
            if (!Array.isArray(initialData)) {
                console.warn(`Current data for schedule section is not an array (type: ${typeof initialData}). Initializing as empty array.`);
                setFormData([]); // Initialize with empty array if not array
            } else {
                // Ensure all items in the schedule array are valid objects
                // Provide default values for missing fields within each item
                const validatedSchedule = initialData.map(item => ({
                    time: (typeof item?.time === 'string' ? item.time : ''),
                    activity: (typeof item?.activity === 'string' ? item.activity : ''),
                    details: (typeof item?.details === 'string' ? item.details : '')
                }));
                setFormData(validatedSchedule);
            }
        } else {
             setFormData(initialData); // Set other data types as is
        }
    }
  }, [currentData, isOpen, section]); // Rerun when modal opens, data changes, or section changes


  // --- Generic Input Handlers ---
  // Handles simple inputs where state is the value itself (name, description, date)
  const handleSimpleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(event.target.value);
  };

  // Handle input changes for nested objects like 'venue'
  // Assumes formData is the Venue object for this section
  const handleVenueChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target; // name will be 'venue.name', 'venue.description' etc.
    const field = name.split('.')[1]; // Extract field name after 'venue.'
    if (field) {
        setFormData((prevData: Venue | null) => ({
            ...(prevData ?? {}), // Start with empty object if prevData is null
             [field]: value,
        }));
    }
  };

  // --- Schedule Specific Handlers ---

  /**
   * Handles changes within a specific schedule item's input fields.
   * @param index The index of the schedule item being changed.
   * @param field The field within the item being changed ('time', 'activity', 'details').
   * @param value The new value of the field.
   */
  const handleScheduleItemChange = (index: number, field: keyof ScheduleItem, value: string) => {
    setFormData((prevSchedule: ScheduleItem[] | null) => {
        const currentSchedule = Array.isArray(prevSchedule) ? prevSchedule : [];
        // Create a new array with the updated item, ensuring immutability
        const newSchedule = currentSchedule.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value }; // Update the specific field
            }
            return item;
        });
        return newSchedule;
    });
  };

  /**
   * Deletes a schedule item at the specified index.
   * @param index The index of the schedule item to delete.
   */
  const handleDeleteScheduleItem = (index: number) => {
     setFormData((prevSchedule: ScheduleItem[] | null) => {
        const currentSchedule = Array.isArray(prevSchedule) ? prevSchedule : [];
        // Create a new array excluding the item at the specified index
        return currentSchedule.filter((_, i) => i !== index);
    });
  };

  /**
   * Adds a new, empty schedule item to the end of the list.
   */
  const handleAddScheduleItem = () => {
     setFormData((prevSchedule: ScheduleItem[] | null) => {
        const currentSchedule = Array.isArray(prevSchedule) ? prevSchedule : [];
        // Add a new empty item object
        return [...currentSchedule, { time: '', activity: '', details: '' }];
    });
  };

  // --- Save Handler ---
  const handleSave = () => {
    console.log(`Saving data for section "${section}":`, formData);
    onSave(formData); // Pass the current state (string, object, or array) back
    onClose(); // Close the modal
  };

  // --- Render Logic ---
  if (!isOpen) { // Only render if modal is open
    return null;
  }

  // Function to render the correct form fields based on the section
  const renderFormFields = () => {
    // Wait for formData to be initialized by useEffect before rendering complex fields
    if (formData === null && (section === 'venue' || section === 'schedule' || section === 'catering')) {
         return <div className="text-center p-4 text-gray-500">Loading data...</div>;
    }

    switch (section) {
      case 'name':
        return (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
            <input type="text" id="name" name="name" value={formData || ''} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
        );
      case 'description':
        return (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" name="description" rows={4} value={formData || ''} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
        );
       case 'date':
         // Ensure dateValue is calculated correctly even if formData is initially null
         const dateValue = formData ? (new Date(formData).toISOString().split('T')[0]) : '';
         return (
           <div>
             <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
             <input type="date" id="date" name="date" value={dateValue} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
           </div>
         );
      case 'venue':
         // Render fields based on Venue type in types/index.ts
         // Assuming formData is the Venue object
         // Example using optional chaining for safety
         return (
           <div className="space-y-3">
             <div>
               <label htmlFor="venue.name" className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
               <input type="text" id="venue.name" name="venue.name" value={formData?.name || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
             </div>
             <div>
               <label htmlFor="venue.description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
               <textarea id="venue.description" name="venue.description" rows={3} value={formData?.description || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
             </div>
             <div>
               <label htmlFor="venue.costRange" className="block text-sm font-medium text-gray-700 mb-1">Cost Range</label>
               <input type="text" id="venue.costRange" name="venue.costRange" value={formData?.costRange || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
             </div>
             <div>
               <label htmlFor="venue.suitability" className="block text-sm font-medium text-gray-700 mb-1">Suitability</label>
               <input type="text" id="venue.suitability" name="venue.suitability" value={formData?.suitability || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
             </div>
              {/* TODO: Add list editing for amenities if needed */}
              {/* TODO: Add list editing for venueSearchSuggestions if needed */}
           </div>
         );

      // *** NEW SCHEDULE EDITING UI ***
      case 'schedule':
        // Ensure formData is an array before mapping
        const scheduleItems = Array.isArray(formData) ? formData : [];
        return (
            <div className="space-y-4">
                {scheduleItems.map((item: ScheduleItem, index: number) => (
                    // Use item's potential unique property or index as key
                    <div key={`schedule-item-${index}`} className="p-3 border border-gray-200 rounded-md space-y-2 relative bg-gray-50">
                         {/* Delete Button */}
                         <button
                            type="button"
                            onClick={() => handleDeleteScheduleItem(index)}
                            className="absolute top-1 right-1 text-red-500 hover:text-red-700 focus:outline-none p-1 rounded-full hover:bg-red-100"
                            aria-label="Delete schedule item"
                        >
                            {/* Simple X icon using SVG */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {/* Time Input */}
                        <div>
                            <label htmlFor={`schedule-${index}-time`} className="block text-xs font-medium text-gray-600">Time</label>
                            <input
                                type="text"
                                id={`schedule-${index}-time`}
                                value={item.time || ''}
                                onChange={(e) => handleScheduleItemChange(index, 'time', e.target.value)}
                                placeholder="e.g., 2:00 PM - 3:00 PM"
                                className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        {/* Activity Input */}
                        <div>
                            <label htmlFor={`schedule-${index}-activity`} className="block text-xs font-medium text-gray-600">Activity</label>
                            <input
                                type="text"
                                id={`schedule-${index}-activity`}
                                value={item.activity || ''}
                                onChange={(e) => handleScheduleItemChange(index, 'activity', e.target.value)}
                                placeholder="e.g., Cake Cutting"
                                className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                         {/* Details Input (Optional) */}
                        <div>
                            <label htmlFor={`schedule-${index}-details`} className="block text-xs font-medium text-gray-600">Details (Optional)</label>
                            <input
                                type="text"
                                id={`schedule-${index}-details`}
                                value={item.details || ''}
                                onChange={(e) => handleScheduleItemChange(index, 'details', e.target.value)}
                                placeholder="e.g., With music"
                                className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                ))}
                 {/* Add Item Button */}
                 <button
                    type="button"
                    onClick={handleAddScheduleItem}
                    className="mt-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center"
                >
                   {/* Simple + icon using SVG */}
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                   </svg>
                    Add Schedule Item
                </button>
            </div>
        );

      case 'catering':
        // TODO: Implement editing for catering object (cost, style, menu object with lists)
         return (
            <div>
                <h4 className="text-md font-medium text-gray-800 mb-2">Edit Catering</h4>
                <p className="text-sm text-gray-500 mb-2">Editing for catering details (cost, style, menu items) will be added here.</p>
                 <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                     {JSON.stringify(formData, null, 2)}
                 </pre>
            </div>
        );

      default:
        return <p>Editing for section "{section}" is not implemented yet.</p>;
    }
  };

  // Capitalize first letter of section for title
  const modalTitle = section ? `Edit ${section.charAt(0).toUpperCase() + section.slice(1)}` : 'Edit Section';

  return (
    // Modal backdrop
    // Added transition classes for smooth fade-in/out
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out p-4 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Modal content area with scrolling for long lists */}
      {/* Added transform for smooth entry/exit */}
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} flex flex-col max-h-[90vh]`}>
         {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{modalTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body - Make it scrollable */}
        <div className="p-6 overflow-y-auto flex-grow">
          {renderFormFields()}
        </div>

        {/* Modal Footer - Action Buttons */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditPlanSectionModal;

