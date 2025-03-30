import React, { useState, useEffect } from 'react';
// Import necessary types from your central types file
import type { ScheduleItem, Venue, Catering, CateringMenu } from '../types';

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
 * Handles editing for various plan sections, including Schedule and Catering lists/objects.
 */
const EditPlanSectionModal: React.FC<EditPlanSectionModalProps> = ({
  isOpen,
  onClose,
  section,
  currentData,
  onSave,
}) => {
  const [formData, setFormData] = useState<any>(null);

  // Effect to initialize and deep copy form data when modal opens or data changes
  useEffect(() => {
    if (isOpen) {
        let initialData = null;
        if (currentData !== null && currentData !== undefined) {
            try { initialData = structuredClone(currentData); }
            catch (e) {
                console.warn("structuredClone failed, using JSON copy.");
                initialData = JSON.parse(JSON.stringify(currentData));
            }
        }

        // --- Initialize specific sections with default structures if needed ---
        if (section === 'schedule') {
            const schedule = Array.isArray(initialData) ? initialData : [];
            setFormData(schedule.map(item => ({ // Ensure items have default fields
                time: item?.time || '',
                activity: item?.activity || '',
                details: item?.details || ''
            })));
        } else if (section === 'catering') {
            const cateringData = (typeof initialData === 'object' && initialData !== null) ? initialData : {};
            // Ensure menu object and its arrays exist
            const menu = (typeof cateringData.menu === 'object' && cateringData.menu !== null) ? cateringData.menu : {};
            setFormData({
                estimatedCost: cateringData.estimatedCost || '',
                servingStyle: cateringData.servingStyle || '',
                cateringSearchSuggestions: Array.isArray(cateringData.cateringSearchSuggestions) ? cateringData.cateringSearchSuggestions : [],
                menu: {
                    appetizers: Array.isArray(menu.appetizers) ? menu.appetizers.filter(i => typeof i === 'string') : [],
                    mainCourses: Array.isArray(menu.mainCourses) ? menu.mainCourses.filter(i => typeof i === 'string') : [],
                    desserts: typeof menu.desserts === 'string' ? menu.desserts : '', // Expects string
                    beverages: Array.isArray(menu.beverages) ? menu.beverages.filter(i => typeof i === 'string') : [],
                }
            });
        } else if (section === 'venue') {
             // Ensure venue is an object
             setFormData((typeof initialData === 'object' && initialData !== null) ? initialData : { name: '', description: '', costRange: '', suitability: '', amenities: [], venueSearchSuggestions: [] });
        }
         else {
            setFormData(initialData); // Handle simple types (string, date)
        }
    }
  }, [currentData, isOpen, section]);


  // --- Generic Input Handlers ---
  const handleSimpleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(event.target.value);
  };

  const handleVenueChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const field = name.split('.')[1];
    if (field) {
        setFormData((prevData: Venue | null) => ({ ...(prevData ?? {}), [field]: value }));
    }
  };

  // --- Schedule Specific Handlers ---
  const handleScheduleItemChange = (index: number, field: keyof ScheduleItem, value: string) => {
    setFormData((prevSchedule: ScheduleItem[] | null) => {
        const currentSchedule = Array.isArray(prevSchedule) ? prevSchedule : [];
        const newSchedule = currentSchedule.map((item, i) => i === index ? { ...item, [field]: value } : item);
        return newSchedule;
    });
  };
  const handleDeleteScheduleItem = (index: number) => {
     setFormData((prevSchedule: ScheduleItem[] | null) => (Array.isArray(prevSchedule) ? prevSchedule : []).filter((_, i) => i !== index));
  };
  const handleAddScheduleItem = () => {
     setFormData((prevSchedule: ScheduleItem[] | null) => [...(Array.isArray(prevSchedule) ? prevSchedule : []), { time: '', activity: '', details: '' }]);
  };

  // --- Catering Specific Handlers ---

  /**
   * Handles changes for top-level catering fields (estimatedCost, servingStyle).
   */
  const handleCateringFieldChange = (field: keyof Catering, value: string) => {
      setFormData((prevData: Catering | null) => ({
          ...(prevData ?? { menu: {} }), // Ensure prevData is object, keep menu
          [field]: value,
      }));
  };

  /**
   * Handles changes to the desserts string within the menu.
   */
  const handleDessertsChange = (value: string) => {
      setFormData((prevData: Catering | null) => {
          const currentMenu = (typeof prevData?.menu === 'object' && prevData.menu !== null) ? prevData.menu : {};
          return {
              ...(prevData ?? {}),
              menu: {
                  ...currentMenu,
                  desserts: value,
              }
          };
      });
  };

  /**
   * Handles changes within a specific catering menu list item (appetizers, mainCourses, beverages).
   * @param listName The name of the list ('appetizers', 'mainCourses', 'beverages').
   * @param index The index of the item being changed.
   * @param value The new value of the item string.
   */
  const handleCateringMenuItemChange = (listName: keyof CateringMenu, index: number, value: string) => {
      setFormData((prevData: Catering | null) => {
          const currentMenu = (typeof prevData?.menu === 'object' && prevData.menu !== null) ? prevData.menu : {};
          const currentList = Array.isArray(currentMenu[listName]) ? (currentMenu[listName] as string[]) : [];

          const newList = currentList.map((item, i) => (i === index ? value : item));

          return {
              ...(prevData ?? {}),
              menu: {
                  ...currentMenu,
                  [listName]: newList,
              }
          };
      });
  };

   /**
   * Deletes an item from a specific catering menu list.
   * @param listName The name of the list ('appetizers', 'mainCourses', 'beverages').
   * @param index The index of the item to delete.
   */
  const handleDeleteCateringMenuItem = (listName: keyof CateringMenu, index: number) => {
      setFormData((prevData: Catering | null) => {
          const currentMenu = (typeof prevData?.menu === 'object' && prevData.menu !== null) ? prevData.menu : {};
          const currentList = Array.isArray(currentMenu[listName]) ? (currentMenu[listName] as string[]) : [];

          const newList = currentList.filter((_, i) => i !== index);

          return {
              ...(prevData ?? {}),
              menu: {
                  ...currentMenu,
                  [listName]: newList,
              }
          };
      });
  };

  /**
   * Adds a new, empty item to a specific catering menu list.
   * @param listName The name of the list ('appetizers', 'mainCourses', 'beverages').
   */
  const handleAddCateringMenuItem = (listName: keyof CateringMenu) => {
       setFormData((prevData: Catering | null) => {
          const currentMenu = (typeof prevData?.menu === 'object' && prevData.menu !== null) ? prevData.menu : {};
          const currentList = Array.isArray(currentMenu[listName]) ? (currentMenu[listName] as string[]) : [];

          const newList = [...currentList, '']; // Add empty string as new item

          return {
              ...(prevData ?? {}),
              menu: {
                  ...currentMenu,
                  [listName]: newList,
              }
          };
      });
  };


  // --- Save Handler ---
  const handleSave = () => {
    console.log(`Saving data for section "${section}":`, formData);
    onSave(formData);
    onClose();
  };

  // --- Render Logic ---
  if (!isOpen) return null;

  // Helper function to render an editable list for catering menu items
  const renderEditableMenuList = (listName: keyof CateringMenu, title: string) => {
      // Ensure formData and menu exist and the list is an array
      const list = (formData?.menu && Array.isArray(formData.menu[listName])) ? formData.menu[listName] as string[] : [];

      return (
          <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
              <h5 className="text-sm font-medium text-gray-700">{title}</h5>
              {list.map((item: string, index: number) => (
                  <div key={`${listName}-${index}`} className="flex items-center space-x-2">
                      <input
                          type="text"
                          value={item || ''}
                          onChange={(e) => handleCateringMenuItemChange(listName, index, e.target.value)}
                          placeholder={`Enter ${title.slice(0, -1)}`} // e.g., "Enter Appetizer"
                          className="flex-grow px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                          type="button"
                          onClick={() => handleDeleteCateringMenuItem(listName, index)}
                          className="text-red-500 hover:text-red-700 focus:outline-none p-1 rounded-full hover:bg-red-100 flex-shrink-0"
                          aria-label={`Delete ${title.slice(0, -1)}`}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>
              ))}
              <button
                  type="button"
                  onClick={() => handleAddCateringMenuItem(listName)}
                  className="mt-1 px-2 py-0.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add {title.slice(0, -1)}
              </button>
          </div>
      );
  };


  // Function to render the correct form fields based on the section
  const renderFormFields = () => {
    if (formData === null && (section === 'venue' || section === 'schedule' || section === 'catering')) {
         return <div className="text-center p-4 text-gray-500">Loading data...</div>;
    }

    switch (section) {
      case 'name': /* ... keep name ... */
        return ( <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label> <input type="text" id="name" name="name" value={formData || ''} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> );
      case 'description': /* ... keep description ... */
        return ( <div> <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label> <textarea id="description" name="description" rows={4} value={formData || ''} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> );
      case 'date': /* ... keep date ... */
         const dateValue = formData ? (new Date(formData).toISOString().split('T')[0]) : '';
         return ( <div> <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label> <input type="date" id="date" name="date" value={dateValue} onChange={handleSimpleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> );
      case 'venue': /* ... keep venue ... */
         return ( <div className="space-y-3"> <div> <label htmlFor="venue.name" className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label> <input type="text" id="venue.name" name="venue.name" value={formData?.name || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> <div> <label htmlFor="venue.description" className="block text-sm font-medium text-gray-700 mb-1">Description</label> <textarea id="venue.description" name="venue.description" rows={3} value={formData?.description || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> <div> <label htmlFor="venue.costRange" className="block text-sm font-medium text-gray-700 mb-1">Cost Range</label> <input type="text" id="venue.costRange" name="venue.costRange" value={formData?.costRange || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> <div> <label htmlFor="venue.suitability" className="block text-sm font-medium text-gray-700 mb-1">Suitability</label> <input type="text" id="venue.suitability" name="venue.suitability" value={formData?.suitability || ''} onChange={handleVenueChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/> </div> </div> );
      case 'schedule': /* ... keep schedule editing ... */
        const scheduleItems = Array.isArray(formData) ? formData : [];
        return ( <div className="space-y-4"> {scheduleItems.map((item: ScheduleItem, index: number) => ( <div key={`schedule-item-${index}`} className="p-3 border border-gray-200 rounded-md space-y-2 relative bg-gray-50"> <button type="button" onClick={() => handleDeleteScheduleItem(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700 focus:outline-none p-1 rounded-full hover:bg-red-100" aria-label="Delete schedule item"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> </button> <div> <label htmlFor={`schedule-${index}-time`} className="block text-xs font-medium text-gray-600">Time</label> <input type="text" id={`schedule-${index}-time`} value={item.time || ''} onChange={(e) => handleScheduleItemChange(index, 'time', e.target.value)} placeholder="e.g., 2:00 PM - 3:00 PM" className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /> </div> <div> <label htmlFor={`schedule-${index}-activity`} className="block text-xs font-medium text-gray-600">Activity</label> <input type="text" id={`schedule-${index}-activity`} value={item.activity || ''} onChange={(e) => handleScheduleItemChange(index, 'activity', e.target.value)} placeholder="e.g., Cake Cutting" className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /> </div> <div> <label htmlFor={`schedule-${index}-details`} className="block text-xs font-medium text-gray-600">Details (Optional)</label> <input type="text" id={`schedule-${index}-details`} value={item.details || ''} onChange={(e) => handleScheduleItemChange(index, 'details', e.target.value)} placeholder="e.g., With music" className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /> </div> </div> ))} <button type="button" onClick={handleAddScheduleItem} className="mt-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /> </svg> Add Schedule Item </button> </div> );

      // *** NEW CATERING EDITING UI ***
      case 'catering':
        // Ensure formData is a valid catering object
        const cateringData = (typeof formData === 'object' && formData !== null) ? formData : { menu: {} };
        return (
            <div className="space-y-4">
                {/* Estimated Cost Input */}
                <div>
                    <label htmlFor="catering.estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                    <input
                        type="text"
                        id="catering.estimatedCost"
                        name="catering.estimatedCost" // Use dot notation for potential generic handler later
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
                     <h4 className="text-md font-medium text-gray-800 mb-2">Menu Items</h4>
                     {/* Appetizers List */}
                     {renderEditableMenuList('appetizers', 'Appetizers')}
                     {/* Main Courses List */}
                     {renderEditableMenuList('mainCourses', 'Main Courses')}
                     {/* Desserts Input (String) */}
                     <div className="mt-3 pt-3 border-t border-gray-100">
                        <label htmlFor="catering.menu.desserts" className="block text-sm font-medium text-gray-700 mb-1">Desserts</label>
                        <input
                            type="text"
                            id="catering.menu.desserts"
                            name="catering.menu.desserts"
                            value={cateringData.menu?.desserts || ''}
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
        return <p>Editing for section "{section}" is not implemented yet.</p>;
    }
  };

  // Capitalize first letter of section for title
  const modalTitle = section ? `Edit ${section.charAt(0).toUpperCase() + section.slice(1)}` : 'Edit Section';

  return (
    // Modal backdrop
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out p-4 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Modal content area with scrolling */}
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} flex flex-col max-h-[90vh]`}>
         {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{modalTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-grow">
          {renderFormFields()}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditPlanSectionModal;

