import React, { useState, useEffect } from 'react';
// Import necessary types from your central types file
import type { ScheduleItem, Venue, Catering, CateringMenu } from '../types';

// Define a local type extending ScheduleItem to safely include the 'details' field
// This avoids modifying the original imported type while satisfying local usage.
type ExtendedScheduleItem = ScheduleItem & { details?: string };

// Define the props the modal will accept
interface EditPlanSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string | null;
  currentData: any; // Kept as 'any' to avoid changes in parent components
  onSave: (updatedData: any) => void; // Kept as 'any'
}

/**
 * EditPlanSectionModal Component
 * Provides a modal interface for editing various sections of a plan,
 * handling data structures like schedule lists and catering details.
 */
const EditPlanSectionModal: React.FC<EditPlanSectionModalProps> = ({
  isOpen,
  onClose,
  section,
  currentData,
  onSave,
}) => {
  // State to hold the form data being edited. Using 'any' for flexibility across sections.
  const [formData, setFormData] = useState<any>(null);

  // Effect to initialize form data when the modal opens or relevant data changes.
  // Creates a deep copy to prevent modifying the original data directly.
  useEffect(() => {
    if (isOpen) {
      let initialData: any = null;
      // Attempt structuredClone for a true deep copy, fall back to JSON method.
      if (currentData !== null && currentData !== undefined) {
        try {
          initialData = structuredClone(currentData);
        } catch (e) {
          console.warn("structuredClone failed, falling back to JSON copy for initial data.", e);
          initialData = JSON.parse(JSON.stringify(currentData));
        }
      }

      // --- Initialize specific sections with default structures if needed ---

      if (section === 'schedule') {
        // Ensure schedule is an array, map items to include default fields.
        const schedule = Array.isArray(initialData) ? initialData : [];
        setFormData(schedule.map((item): ExtendedScheduleItem => ({ // Ensure items conform to ExtendedScheduleItem
          time: item?.time || '',
          activity: item?.activity || '',
          details: item?.details || '' // Initialize details field
        })));
      } else if (section === 'catering') {
        // Ensure catering data is an object.
        const cateringData = (typeof initialData === 'object' && initialData !== null) ? initialData : {};
        // Ensure menu is an object within catering data.
        const menu: Partial<CateringMenu> = (typeof cateringData.menu === 'object' && cateringData.menu !== null) ? cateringData.menu : {};
        setFormData({
          estimatedCost: cateringData.estimatedCost || '',
          servingStyle: cateringData.servingStyle || '',
          // Keep existing search suggestions or initialize as empty array.
          cateringSearchSuggestions: Array.isArray(cateringData.cateringSearchSuggestions) ? cateringData.cateringSearchSuggestions : [],
          menu: {
            // Ensure menu items are arrays of strings, filtering out invalid types.
            appetizers: Array.isArray(menu.appetizers) ? menu.appetizers.filter((i: unknown): i is string => typeof i === 'string') : [],
            mainCourses: Array.isArray(menu.mainCourses) ? menu.mainCourses.filter((i: unknown): i is string => typeof i === 'string') : [],
            desserts: typeof menu.desserts === 'string' ? menu.desserts : '', // Expects string
            beverages: Array.isArray(menu.beverages) ? menu.beverages.filter((i: unknown): i is string => typeof i === 'string') : [],
          }
        });
      } else if (section === 'venue') {
          // Ensure venue data is an object with expected fields initialized.
          const venueData = (typeof initialData === 'object' && initialData !== null) ? initialData : {};
          setFormData({
            name: venueData.name || '',
            description: venueData.description || '',
            costRange: venueData.costRange || '',
            suitability: venueData.suitability || '',
            amenities: Array.isArray(venueData.amenities) ? venueData.amenities : [],
            venueSearchSuggestions: Array.isArray(venueData.venueSearchSuggestions) ? venueData.venueSearchSuggestions : []
          });
      } else {
          // Handle simple data types (e.g., string for name, description, date)
          setFormData(initialData);
      }
    }
  }, [currentData, isOpen, section]);


  // --- Generic Input Handlers ---

  /** Handles changes for simple input fields (text, textarea) updating the entire formData. */
  const handleSimpleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(event.target.value);
  };

  /** Handles changes for fields within the 'venue' object. */
  const handleVenueChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    // Extract the specific field name (e.g., 'name' from 'venue.name')
    const field = name.split('.')[1];
    if (field) {
      // Update the specific field within the venue object.
      setFormData((prevData: Venue | null) => ({
         ...(prevData ?? { name: '', description: '', costRange: '', suitability: '', amenities: [], venueSearchSuggestions: [] }), // Provide default structure if null
         [field]: value
        }));
    }
  };

  // --- Schedule Specific Handlers ---

  /** Handles changes to a specific field within a schedule item at a given index. */
  const handleScheduleItemChange = (index: number, field: keyof ExtendedScheduleItem, value: string) => {
    setFormData((prevSchedule: ExtendedScheduleItem[] | null) => {
      // Ensure we're working with an array.
      const currentSchedule = Array.isArray(prevSchedule) ? prevSchedule : [];
      // Map to create a new schedule array with the updated item.
      const newSchedule: ExtendedScheduleItem[] = currentSchedule.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return newSchedule;
    });
  };

  /** Deletes a schedule item at a specific index. */
  const handleDeleteScheduleItem = (index: number) => {
     setFormData((prevSchedule: ExtendedScheduleItem[] | null) =>
       (Array.isArray(prevSchedule) ? prevSchedule : []).filter((_, i) => i !== index)
     );
  };

  /** Adds a new, empty schedule item to the list. */
  const handleAddScheduleItem = () => {
     setFormData((prevSchedule: ExtendedScheduleItem[] | null) => [
       ...(Array.isArray(prevSchedule) ? prevSchedule : []),
       // Add a new item conforming to ExtendedScheduleItem
       { time: '', activity: '', details: '' }
      ]);
  };

  // --- Catering Specific Handlers ---

  /** Handles changes for top-level catering fields (e.g., estimatedCost, servingStyle). */
  const handleCateringFieldChange = (field: keyof Omit<Catering, 'menu' | 'cateringSearchSuggestions'>, value: string) => {
      setFormData((prevData: Catering | null) => ({
        ...(prevData ?? { menu: {}, estimatedCost: '', servingStyle: '', cateringSearchSuggestions: [] }), // Ensure base structure
        [field]: value,
      }));
  };

  /** Handles changes specifically for the 'desserts' string within the catering menu. */
  const handleDessertsChange = (value: string) => {
      setFormData((prevData: Catering | null) => {
        // Ensure catering object and menu object exist before updating.
        const currentCatering = prevData ?? { menu: {}, estimatedCost: '', servingStyle: '', cateringSearchSuggestions: [] };
        const currentMenu: Partial<CateringMenu> = (typeof currentCatering.menu === 'object' && currentCatering.menu !== null) ? currentCatering.menu : {};
        return {
          ...currentCatering,
          menu: {
            ...currentMenu,
            desserts: value, // Update desserts
          }
        };
      });
  };

  /** Handles changes within a specific catering menu list item (e.g., appetizers, mainCourses). */
  const handleCateringMenuItemChange = (listName: keyof Omit<CateringMenu, 'desserts'>, index: number, value: string) => {
      setFormData((prevData: Catering | null) => {
        const currentCatering = prevData ?? { menu: {}, estimatedCost: '', servingStyle: '', cateringSearchSuggestions: [] };
        const currentMenu: Partial<CateringMenu> = (typeof currentCatering.menu === 'object' && currentCatering.menu !== null) ? currentCatering.menu : {};
        // Safely access the list, default to empty array if not present or not an array.
        const currentList = Array.isArray(currentMenu[listName]) ? (currentMenu[listName] as string[]) : [];

        // Create the updated list.
        const newList = currentList.map((item, i) => (i === index ? value : item));

        return {
          ...currentCatering,
          menu: {
            ...currentMenu,
            [listName]: newList, // Update the specific list
          }
        };
      });
  };

   /** Deletes an item from a specific catering menu list (e.g., appetizers) at a given index. */
  const handleDeleteCateringMenuItem = (listName: keyof Omit<CateringMenu, 'desserts'>, index: number) => {
      setFormData((prevData: Catering | null) => {
        const currentCatering = prevData ?? { menu: {}, estimatedCost: '', servingStyle: '', cateringSearchSuggestions: [] };
        const currentMenu: Partial<CateringMenu> = (typeof currentCatering.menu === 'object' && currentCatering.menu !== null) ? currentCatering.menu : {};
        const currentList = Array.isArray(currentMenu[listName]) ? (currentMenu[listName] as string[]) : [];

        // Create the new list excluding the item at the specified index.
        const newList = currentList.filter((_, i) => i !== index);

        return {
          ...currentCatering,
          menu: {
            ...currentMenu,
            [listName]: newList,
          }
        };
      });
  };

  /** Adds a new, empty item to a specific catering menu list (e.g., appetizers). */
  const handleAddCateringMenuItem = (listName: keyof Omit<CateringMenu, 'desserts'>) => {
       setFormData((prevData: Catering | null) => {
         const currentCatering = prevData ?? { menu: {}, estimatedCost: '', servingStyle: '', cateringSearchSuggestions: [] };
         const currentMenu: Partial<CateringMenu> = (typeof currentCatering.menu === 'object' && currentCatering.menu !== null) ? currentCatering.menu : {};
         const currentList = Array.isArray(currentMenu[listName]) ? (currentMenu[listName] as string[]) : [];

         // Add an empty string as the new item.
         const newList = [...currentList, ''];

         return {
           ...currentCatering,
           menu: {
             ...currentMenu,
             [listName]: newList,
           }
         };
       });
  };


  // --- Save Handler ---

  /** Saves the current form data and closes the modal. */
  const handleSave = () => {
    console.log(`Saving data for section "${section}":`, formData); // Log for debugging
    onSave(formData); // Pass data back to parent
    onClose(); // Close modal
  };

  // --- Render Logic ---

  // Don't render anything if the modal isn't open.
  if (!isOpen) return null;

  /**
   * Helper function to render an editable list for catering menu items
   * (Appetizers, Main Courses, Beverages).
   */
  const renderEditableMenuList = (listName: keyof Omit<CateringMenu, 'desserts'>, title: string) => {
     // Safely access the list from formData, default to empty array if needed.
     const list = (formData?.menu && Array.isArray(formData.menu[listName])) ? formData.menu[listName] as string[] : [];

     return (
         <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
             <h5 className="text-sm font-semibold text-gray-700 mb-1">{title}</h5>
             {list.map((item: string, index: number) => (
                 <div key={`${listName}-${index}`} className="flex items-center space-x-2">
                     {/* Input field for the menu item */}
                     <input
                         type="text"
                         value={item || ''}
                         onChange={(e) => handleCateringMenuItemChange(listName, index, e.target.value)}
                         placeholder={`Enter ${title.slice(0, -1)}`} // e.g., "Enter Appetizer"
                         className="flex-grow px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                     />
                     {/* Button to delete the menu item */}
                     <button
                         type="button"
                         onClick={() => handleDeleteCateringMenuItem(listName, index)}
                         className="text-red-500 hover:text-red-700 focus:outline-none p-1 rounded-full hover:bg-red-100 flex-shrink-0"
                         aria-label={`Delete ${title.slice(0, -1)}`}
                     >
                         {/* Delete Icon */}
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                         </svg>
                     </button>
                 </div>
             ))}
             {/* Button to add a new menu item */}
             <button
                 type="button"
                 onClick={() => handleAddCateringMenuItem(listName)}
                 className="mt-1 px-2 py-0.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center"
             >
                 {/* Add Icon */}
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                 </svg>
                 Add {title.slice(0, -1)}
             </button>
         </div>
     );
  };


  /** Renders the appropriate form fields based on the 'section' prop. */
  const renderFormFields = () => {
    // Show loading indicator if data hasn't been initialized yet for complex sections.
    if (formData === null && (section === 'venue' || section === 'schedule' || section === 'catering')) {
        return <div className="text-center p-4 text-gray-500">Loading data...</div>;
    }

    switch (section) {
      case 'name':
        return ( <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label> <input type="text" id="name" name="name" value={formData || ''} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> );
      case 'description':
        return ( <div> <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label> <textarea id="description" name="description" rows={4} value={formData || ''} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> );
      case 'date':
        // Format date for the input type="date"
        const dateValue = formData ? (new Date(formData).toISOString().split('T')[0]) : '';
        return ( <div> <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label> <input type="date" id="date" name="date" value={dateValue} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> );
      case 'venue':
        // Ensure venueData is an object before accessing properties.
        const venueData: Partial<Venue> = (typeof formData === 'object' && formData !== null) ? formData : {};
        return ( <div className="space-y-3"> <div> <label htmlFor="venue.name" className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label> <input type="text" id="venue.name" name="venue.name" value={venueData.name || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> <div> <label htmlFor="venue.description" className="block text-sm font-medium text-gray-700 mb-1">Description</label> <textarea id="venue.description" name="venue.description" rows={3} value={venueData.description || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> <div> <label htmlFor="venue.costRange" className="block text-sm font-medium text-gray-700 mb-1">Cost Range</label> <input type="text" id="venue.costRange" name="venue.costRange" value={venueData.costRange || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> <div> <label htmlFor="venue.suitability" className="block text-sm font-medium text-gray-700 mb-1">Suitability</label> <input type="text" id="venue.suitability" name="venue.suitability" value={venueData.suitability || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> {/* TODO: Add list editing for amenities and venueSearchSuggestions if needed */} </div> );
      case 'schedule':
        // Ensure scheduleItems is an array before mapping.
        const scheduleItems: ExtendedScheduleItem[] = Array.isArray(formData) ? formData : [];
        return ( <div className="space-y-4"> {scheduleItems.map((item: ExtendedScheduleItem, index: number) => ( <div key={`schedule-item-${index}`} className="p-3 border border-gray-200 rounded-md space-y-2 relative bg-gray-50"> {/* Delete Button */} <button type="button" onClick={() => handleDeleteScheduleItem(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700 focus:outline-none p-1 rounded-full hover:bg-red-100" aria-label="Delete schedule item"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> </button> {/* Time Input */} <div> <label htmlFor={`schedule-${index}-time`} className="block text-xs font-medium text-gray-600">Time</label> <input type="text" id={`schedule-${index}-time`} value={item.time || ''} onChange={(e) => handleScheduleItemChange(index, 'time', e.target.value)} placeholder="e.g., 2:00 PM - 3:00 PM" className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /> </div> {/* Activity Input */} <div> <label htmlFor={`schedule-${index}-activity`} className="block text-xs font-medium text-gray-600">Activity</label> <input type="text" id={`schedule-${index}-activity`} value={item.activity || ''} onChange={(e) => handleScheduleItemChange(index, 'activity', e.target.value)} placeholder="e.g., Cake Cutting" className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /> </div> {/* Details Input - Now safely handled by ExtendedScheduleItem */} <div> <label htmlFor={`schedule-${index}-details`} className="block text-xs font-medium text-gray-600">Details (Optional)</label> <input type="text" id={`schedule-${index}-details`} value={item.details || ''} onChange={(e) => handleScheduleItemChange(index, 'details', e.target.value)} placeholder="e.g., With music" className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /> </div> </div> ))} {/* Add Item Button */} <button type="button" onClick={handleAddScheduleItem} className="mt-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /> </svg> Add Schedule Item </button> </div> );
      case 'catering':
        // Ensure cateringData is a valid object with a menu structure.
        const cateringData: Partial<Catering> & { menu: Partial<CateringMenu> } = (typeof formData === 'object' && formData !== null) ? formData : { menu: {} };
        return (
            <div className="space-y-4">
                {/* Estimated Cost Input */}
                <div>
                    <label htmlFor="catering.estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                    <input
                        type="text"
                        id="catering.estimatedCost"
                        name="catering.estimatedCost"
                        value={cateringData.estimatedCost || ''}
                        onChange={(e) => handleCateringFieldChange('estimatedCost', e.target.value)}
                        placeholder="e.g., Approx. 1500 NIS"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                 {/* Serving Style Input */}
                 <div>
                    <label htmlFor="catering.servingStyle" className="block text-sm font-medium text-gray-700 mb-1">Serving Style</label>
                    <input
                        type="text"
                        id="catering.servingStyle"
                        name="catering.servingStyle"
                        value={cateringData.servingStyle || ''}
                        onChange={(e) => handleCateringFieldChange('servingStyle', e.target.value)}
                        placeholder="e.g., Buffet, Plated"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                {/* Menu Section */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Menu</h4>
                    {/* Render editable lists for menu items */}
                    {renderEditableMenuList('appetizers', 'Appetizers')}
                    {renderEditableMenuList('mainCourses', 'Main Courses')}
                    {/* Desserts Input (Single String) */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <label htmlFor="catering.menu.desserts" className="block text-sm font-semibold text-gray-700 mb-1">Desserts</label>
                        <input
                            type="text"
                            id="catering.menu.desserts"
                            name="catering.menu.desserts"
                            value={cateringData.menu?.desserts || ''} // Safely access nested property
                            onChange={(e) => handleDessertsChange(e.target.value)}
                            placeholder="e.g., Themed Cake, Fruit Platter"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    {/* Beverages List */}
                    {renderEditableMenuList('beverages', 'Beverages')}
                </div>
                {/* TODO: Add list editing for cateringSearchSuggestions if needed */}
            </div>
        );

      default:
        // Fallback for sections without specific editing UI implemented.
        return <p>Editing for section "{section}" is not implemented yet.</p>;
    }
  };

  // Capitalize the first letter of the section name for the modal title.
  const modalTitle = section ? `Edit ${section.charAt(0).toUpperCase() + section.slice(1)}` : 'Edit Section';

  return (
    // Modal backdrop with transition effects
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out p-4 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Modal panel container with transition effects */}
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} flex flex-col max-h-[90vh]`}>
          {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{modalTitle}</h3>
          {/* Close Button */}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body - Content area, scrollable */}
        <div className="p-6 overflow-y-auto flex-grow">
          {renderFormFields()}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-lg">
          {/* Cancel Button */}
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out">Cancel</button>
          {/* Save Button */}
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditPlanSectionModal;

