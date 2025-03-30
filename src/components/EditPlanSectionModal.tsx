import React, { useState, useEffect } from 'react';

// --- Interfaces ---
// Assuming these match or are imported from src/types/index.ts
interface ScheduleItem {
  time: string;
  activity: string;
  details?: string;
}

interface Venue {
  name: string;
  // Assuming Venue type might have more fields based on types/index.ts
  description?: string;
  costRange?: string;
  amenities?: string[];
  suitability?: string;
  // Add address/contact if they are actually part of your Venue type
}

// Note: CateringItem might not be used if 'catering' section edits the complex Catering object directly
// interface CateringItem {
//  item: string;
//  description?: string;
// }

// Define the props the modal will accept
interface EditPlanSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string | null;
  currentData: any;
  onSave: (updatedData: any) => void;
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
  const [formData, setFormData] = useState<any>(null);

  // Effect to update internal form state when the modal opens or data changes
  useEffect(() => {
    if (currentData !== null && currentData !== undefined) {
       try {
           // Ensure schedule is always an array when editing that section
           if (section === 'schedule' && !Array.isArray(currentData)) {
               console.warn("Current data for schedule is not an array, initializing as empty.");
               setFormData([]);
           } else {
               setFormData(structuredClone(currentData));
           }
       } catch (e) {
           console.warn("structuredClone not available, falling back to JSON copy.");
           setFormData(JSON.parse(JSON.stringify(currentData)));
       }
    } else {
        // Initialize schedule as empty array if currentData is null/undefined for schedule section
       setFormData(section === 'schedule' ? [] : currentData);
    }
  }, [currentData, isOpen, section]); // Added section dependency

  // --- Generic Input Handlers ---
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
  };

  // Handle input changes for nested objects like 'venue'
  // Adjust based on actual Venue structure from types/index.ts
  const handleVenueChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target; // name might be 'venue.name', 'venue.description' etc.
    const field = name.split('.')[1]; // 'name', 'description', 'costRange' etc.
    setFormData((prevData: Venue) => ({ ...prevData, [field]: value }));
  };

  // --- Schedule Specific Handlers ---

  /**
   * Handles changes within a specific schedule item's input fields.
   * @param index The index of the schedule item being changed.
   * @param field The field within the item being changed ('time', 'activity', 'details').
   * @param value The new value of the field.
   */
  const handleScheduleItemChange = (index: number, field: keyof ScheduleItem, value: string) => {
    // Ensure formData is treated as an array of ScheduleItem
    setFormData((prevData: ScheduleItem[] | null) => {
        const currentSchedule = Array.isArray(prevData) ? prevData : [];
        // Create a new array with the updated item
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
     setFormData((prevData: ScheduleItem[] | null) => {
        const currentSchedule = Array.isArray(prevData) ? prevData : [];
        // Create a new array excluding the item at the specified index
        return currentSchedule.filter((_, i) => i !== index);
    });
  };

  /**
   * Adds a new, empty schedule item to the end of the list.
   */
  const handleAddScheduleItem = () => {
     setFormData((prevData: ScheduleItem[] | null) => {
        const currentSchedule = Array.isArray(prevData) ? prevData : [];
        // Create a new array with an added empty item
        return [...currentSchedule, { time: '', activity: '', details: '' }];
    });
  };

  // --- Save Handler ---
  const handleSave = () => {
    console.log("Saving data:", formData); // Log data being saved
    onSave(formData);
    onClose();
  };

  // --- Render Logic ---
  if (!isOpen || !section) { // Allow rendering even if formData is initially null/empty array
    return null;
  }

  // Function to render the correct form fields based on the section
  const renderFormFields = () => {
    // Ensure formData is initialized appropriately before rendering fields that depend on it
    if (formData === null && (section === 'venue' || section === 'schedule' || section === 'catering')) {
         // Display loading or initialize default structure if needed, or just wait for useEffect
         return <div className="text-center p-4">Initializing form...</div>;
    }

    switch (section) {
      case 'name':
        return ( /* ... Keep Name input ... */
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
            <input type="text" id="name" name="name" value={formData || ''} onChange={(e) => setFormData(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
        );
      case 'description':
        return ( /* ... Keep Description textarea ... */
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" name="description" rows={4} value={formData || ''} onChange={(e) => setFormData(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
        );
       case 'date':
         const dateValue = formData ? new Date(formData).toISOString().split('T')[0] : '';
         return ( /* ... Keep Date input ... */
           <div>
             <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
             <input type="date" id="date" name="date" value={dateValue} onChange={(e) => setFormData(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
           </div>
         );
      case 'venue':
        // Render fields based on Venue type in types/index.ts
        // Assuming formData is the Venue object
        return ( /* ... Keep/Update Venue inputs based on actual Venue type ... */
          // Example assuming name, description, costRange are main editable fields
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
             {/* Add inputs for other editable Venue fields like suitability, amenities (might need list editor) */}
          </div>
        );

      // *** NEW SCHEDULE EDITING UI ***
      case 'schedule':
        // Ensure formData is an array before mapping
        const scheduleItems = Array.isArray(formData) ? formData : [];
        return (
            <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-800 mb-2">Edit Schedule</h4>
                {scheduleItems.map((item: ScheduleItem, index: number) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-md space-y-2 relative">
                         {/* Delete Button */}
                         <button
                            type="button"
                            onClick={() => handleDeleteScheduleItem(index)}
                            className="absolute top-1 right-1 text-red-500 hover:text-red-700 focus:outline-none"
                            aria-label="Delete schedule item"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                    className="mt-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    + Add Schedule Item
                </button>
            </div>
        );

      case 'catering':
        // TODO: Implement editing for catering object (estimatedCost, servingStyle, menu object)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out p-4">
      {/* Modal content area with scrolling for long lists */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 flex flex-col max-h-[90vh]">
         {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{modalTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body - Make it scrollable */}
        <div className="p-6 overflow-y-auto flex-grow">
          {renderFormFields()}
        </div>

        {/* Modal Footer - Action Buttons */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditPlanSectionModal;

