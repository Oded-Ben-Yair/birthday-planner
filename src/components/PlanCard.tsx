// src/components/PlanCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { BirthdayPlan } from '../types'; // Import the main plan type

/**
 * Props for the PlanCard component.
 * Includes the plan data, selection state/handler, and NEW plan update handler.
 */
interface PlanCardProps {
	plan: BirthdayPlan;
	isSelected: boolean;
	onSelect: () => void;
	// Added: Function to call when plan details are updated by the user
	onPlanUpdate: (updatedPlan: BirthdayPlan) => void;
}

/**
 * Component to display a single Birthday Plan card with expandable sections
 * and NEW inline editing for name and description.
 */
export default function PlanCard({ plan, isSelected, onSelect, onPlanUpdate }: PlanCardProps) {
	// State for managing which detail section is expanded
	const [expandedSection, setExpandedSection] = useState<string | null>(null);

	// --- State for Inline Editing ---
	const [isEditingName, setIsEditingName] = useState(false);
	const [editedName, setEditedName] = useState(plan.name);
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [editedDescription, setEditedDescription] = useState(plan.description);
    // Refs for focusing input elements
    const nameInputRef = useRef<HTMLInputElement>(null);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

	// --- Effect to reset local edit state if the plan prop changes externally ---
	useEffect(() => {
		setEditedName(plan.name);
		setEditedDescription(plan.description);
        // Close editing modes if plan changes from parent
        setIsEditingName(false);
        setIsEditingDescription(false);
	}, [plan.name, plan.description, plan.id]); // Depend on plan ID as well

    // --- Effect to focus input when edit mode is enabled ---
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select(); // Select text on focus
        }
    }, [isEditingName]);

    useEffect(() => {
        if (isEditingDescription && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.focus();
            descriptionTextareaRef.current.select(); // Select text on focus
        }
    }, [isEditingDescription]);

	/**
	 * Toggles the visibility of detail sections (Venue, Schedule, etc.).
	 * @param section - The key of the section to toggle.
	 */
	const toggleSection = (section: string) => {
		setExpandedSection(prev => (prev === section ? null : section));
	};

	/**
	 * Helper function to render lists of strings (e.g., amenities, menu items).
	 * Includes basic validation.
     * NOTE: This was updated previously to handle non-arrays safely. Keep that version.
	 */
	const renderList = (items: unknown): React.ReactNode => {
        if (Array.isArray(items) && items.length > 0) {
            return items.map((item, index) => (
                <li key={index}>{String(item ?? '')}</li>
            ));
        }
        return <li>None specified</li>;
    };

	/**
	 * Saves the edited name or description by calling the onPlanUpdate prop.
	 * @param field - Which field to save ('name' or 'description').
	 */
	const handleSave = (field: 'name' | 'description') => {
		let updatedPlan = { ...plan }; // Create a shallow copy
		let changed = false;

		// Update name if editing name and value has changed
		if (field === 'name') {
			if (editedName.trim() && editedName !== plan.name) { // Ensure not empty after trim
				updatedPlan.name = editedName.trim();
				changed = true;
			}
			setIsEditingName(false); // Exit edit mode regardless
		}
        // Update description if editing description and value has changed
        else if (field === 'description') {
			if (editedDescription !== plan.description) { // Allow empty description
				updatedPlan.description = editedDescription;
				changed = true;
			}
			setIsEditingDescription(false); // Exit edit mode regardless
		}

		// If a change was made and the update function exists, call it
		if (changed && onPlanUpdate) {
			console.log(`Saving updated ${field} for plan ${plan.id}`);
			onPlanUpdate(updatedPlan); // Pass the whole updated plan object to the parent
		} else if (!changed) {
             console.log(`No changes detected for ${field}, edit cancelled.`);
             // Reset local state if no changes were made before blur/enter
             if (field === 'name') setEditedName(plan.name);
             if (field === 'description') setEditedDescription(plan.description);
        }
	};

	/**
	 * Cancels editing and reverts local state changes.
	 * @param field - Which field to cancel ('name' or 'description').
	 */
	const handleCancel = (field: 'name' | 'description') => {
		 if (field === 'name') {
			 setEditedName(plan.name); // Reset local value to original
			 setIsEditingName(false);
		 } else if (field === 'description') {
			 setEditedDescription(plan.description); // Reset local value to original
			 setIsEditingDescription(false);
		 }
         console.log(`Cancelled editing ${field}`);
	};

	/**
	 * Handles key presses within input fields (Enter to save, Escape to cancel).
	 * @param e - The React keyboard event.
	 * @param field - Which field the event occurred in.
	 */
	const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
        field: 'name' | 'description'
    ) => {
		if (e.key === 'Enter') {
			// Allow Shift+Enter for newlines in textarea, otherwise save
			if (field === 'description' && e.shiftKey) {
				return;
			}
			e.preventDefault(); // Prevent potential form submission
			handleSave(field);
		} else if (e.key === 'Escape') {
			handleCancel(field);
		}
	};

	// --- Render Component UI ---
	return (
		<div
			// Add subtle shadow and transition effects
			className={`border rounded-lg p-4 transition-all duration-300 ease-in-out ${
				isSelected
					? 'border-indigo-500 shadow-lg bg-indigo-50 ring-2 ring-indigo-300' // Enhanced selected style
					: 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
			}`}
		>
			{/* Header Section: Name, Description, Select Button */}
			<div className="flex justify-between items-start mb-4">
				{/* Editable Name and Description */}
				<div className="flex-grow mr-4"> {/* Allow text to take space */}
					{/* --- Editable Plan Name --- */}
					{isEditingName ? (
						<input
                            ref={nameInputRef}
							type="text"
							value={editedName}
							onChange={(e) => setEditedName(e.target.value)}
							onBlur={() => handleSave('name')} // Save on blur
							onKeyDown={(e) => handleKeyDown(e, 'name')} // Save on Enter, Cancel on Escape
							className="text-xl font-bold border border-blue-400 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-300 outline-none"
						/>
					) : (
						<h3
							className="text-xl font-bold text-gray-800 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -ml-2" // Make clickable area obvious
							onClick={() => setIsEditingName(true)}
							title="Click to edit plan name" // Tooltip hint
						>
							{plan.name || <span className="text-gray-400 italic">Unnamed Plan</span>}
						</h3>
					)}

					{/* --- Editable Plan Description --- */}
					{isEditingDescription ? (
						<textarea
                            ref={descriptionTextareaRef}
							value={editedDescription}
							onChange={(e) => setEditedDescription(e.target.value)}
							onBlur={() => handleSave('description')} // Save on blur
							onKeyDown={(e) => handleKeyDown(e, 'description')} // Save on Enter, Cancel on Escape
							className="text-gray-600 border border-blue-400 rounded px-2 py-1 w-full mt-1 focus:ring-2 focus:ring-blue-300 outline-none text-sm" // Match text style
							rows={3} // Adjust rows as needed
						/>
					) : (
						<p
							className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 mt-1 -ml-2" // Make clickable area obvious
							onClick={() => setIsEditingDescription(true)}
							title="Click to edit plan description" // Tooltip hint
						>
							{/* Handle potentially empty description */}
							{plan.description || <span className="text-gray-400 italic">No description provided</span>}
						</p>
					)}
				</div>

				{/* Select Button */}
				<button
					onClick={onSelect}
					className={`flex-shrink-0 px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${ // Adjusted padding/size
						isSelected
							? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					}`}
				>
					{isSelected ? 'Selected' : 'Select'}
				</button>
			</div>

			{/* --- Collapsible Sections for Plan Details --- */}
			<div className="space-y-3 mt-4 border-t pt-4"> {/* Added separator */}

				{/* Venue Section */}
				<div>
					<button
						onClick={() => toggleSection('venue')}
						className="flex justify-between items-center w-full text-left font-semibold text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
					>
						<span>Venue Details</span>
						<span className="text-lg font-light">{expandedSection === 'venue' ? '−' : '+'}</span>
					</button>
					{expandedSection === 'venue' && (
						<div className="p-3 border-l-2 border-gray-200 ml-2 mt-2 text-sm space-y-1 bg-white rounded-r-md">
							<h4 className="font-semibold text-gray-800">{plan.venue.name || '-'}</h4>
							<p className="text-gray-600">{plan.venue.description || '-'}</p>
							<p><strong className="font-medium text-gray-700">Cost:</strong> {plan.venue.costRange || '-'}</p>
							<div>
								<strong className="font-medium text-gray-700">Amenities:</strong>
								<ul className="list-disc list-inside ml-4 text-gray-600">
									{renderList(plan.venue.amenities)}
								</ul>
							</div>
							<p><strong className="font-medium text-gray-700">Suitability:</strong> {plan.venue.suitability || '-'}</p>
                            {/* Display Vendor Suggestions if they exist */}
                            {plan.venue.venueSearchSuggestions && plan.venue.venueSearchSuggestions.length > 0 && (
                                <div className="pt-1 mt-1 border-t border-gray-100">
                                    <strong className="font-medium text-gray-700 text-xs">Example Searches:</strong>
                                    <ul className="list-disc list-inside ml-4 text-gray-500 text-xs">
                                        {renderList(plan.venue.venueSearchSuggestions)}
                                    </ul>
                                </div>
                            )}
						</div>
					)}
				</div>

				{/* Schedule Section */}
				<div>
					<button
						onClick={() => toggleSection('schedule')}
						className="flex justify-between items-center w-full text-left font-semibold text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
					>
						<span>Activity Schedule</span>
						<span className="text-lg font-light">{expandedSection === 'schedule' ? '−' : '+'}</span>
					</button>
					{expandedSection === 'schedule' && (
						<div className="p-3 border-l-2 border-gray-200 ml-2 mt-2 text-sm space-y-2 bg-white rounded-r-md">
							{plan.schedule?.length > 0 ? (
                                plan.schedule.map((item, index) => (
                                    <div key={index}>
                                        <strong className="font-medium text-gray-700">{item.time || 'N/A'}:</strong> {item.activity || '-'}
                                        {item.description && <p className="text-xs text-gray-500 pl-2">{item.description}</p>}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No schedule provided.</p>
                            )}
						</div>
					)}
				</div>

				{/* Catering Section */}
				<div>
					<button
						onClick={() => toggleSection('catering')}
						className="flex justify-between items-center w-full text-left font-semibold text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
					>
						<span>Catering Details</span>
						<span className="text-lg font-light">{expandedSection === 'catering' ? '−' : '+'}</span>
					</button>
					{expandedSection === 'catering' && (
						<div className="p-3 border-l-2 border-gray-200 ml-2 mt-2 text-sm space-y-2 bg-white rounded-r-md">
                            <p><strong className="font-medium text-gray-700">Est. Cost:</strong> {plan.catering.estimatedCost || '-'}</p>
							<p><strong className="font-medium text-gray-700">Style:</strong> {plan.catering.servingStyle || '-'}</p>
							<div className="pt-1">
								<strong className="font-medium text-gray-700">Menu:</strong>
								<div className="ml-4 text-gray-600 space-y-1">
									<div><span className="text-xs font-semibold text-gray-500">Appetizers:</span> <ul className="list-disc list-inside text-xs">{renderList(plan.catering.menu?.appetizers)}</ul></div>
									<div><span className="text-xs font-semibold text-gray-500">Main Courses:</span> <ul className="list-disc list-inside text-xs">{renderList(plan.catering.menu?.mainCourses)}</ul></div>
									<div><span className="text-xs font-semibold text-gray-500">Desserts:</span> <p className="text-xs inline">{plan.catering.menu?.desserts || 'None specified'}</p></div>
									<div><span className="text-xs font-semibold text-gray-500">Beverages:</span> <ul className="list-disc list-inside text-xs">{renderList(plan.catering.menu?.beverages)}</ul></div>
								</div>
							</div>
                             {/* Display Vendor Suggestions if they exist */}
                            {plan.catering.cateringSearchSuggestions && plan.catering.cateringSearchSuggestions.length > 0 && (
                                <div className="pt-1 mt-1 border-t border-gray-100">
                                    <strong className="font-medium text-gray-700 text-xs">Example Searches:</strong>
                                    <ul className="list-disc list-inside ml-4 text-gray-500 text-xs">
                                        {renderList(plan.catering.cateringSearchSuggestions)}
                                    </ul>
                                </div>
                            )}
						</div>
					)}
				</div>

				{/* Guest Engagement Section */}
				<div>
					<button
						onClick={() => toggleSection('engagement')}
						className="flex justify-between items-center w-full text-left font-semibold text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
					>
						<span>Guest Engagement</span>
						<span className="text-lg font-light">{expandedSection === 'engagement' ? '−' : '+'}</span>
					</button>
					{expandedSection === 'engagement' && (
						<div className="p-3 border-l-2 border-gray-200 ml-2 mt-2 text-sm space-y-2 bg-white rounded-r-md">
							<div><strong className="font-medium text-gray-700">Icebreakers:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement.icebreakers)}</ul></div>
							<div><strong className="font-medium text-gray-700">Interactive Elements:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement.interactiveElements)}</ul></div>
							<div><strong className="font-medium text-gray-700">Photo Opportunities:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement.photoOpportunities)}</ul></div>
							<div><strong className="font-medium text-gray-700">Party Favors:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement.partyFavors)}</ul></div>
							{plan.guestEngagement.techIntegration && plan.guestEngagement.techIntegration.length > 0 && (
								<div><strong className="font-medium text-gray-700">Tech Integration:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement.techIntegration)}</ul></div>
							)}
                            {/* Display Vendor Suggestions if they exist */}
                            {plan.guestEngagement.entertainmentSearchSuggestions && plan.guestEngagement.entertainmentSearchSuggestions.length > 0 && (
                                <div className="pt-1 mt-1 border-t border-gray-100">
                                    <strong className="font-medium text-gray-700 text-xs">Example Searches:</strong>
                                    <ul className="list-disc list-inside ml-4 text-gray-500 text-xs">
                                        {renderList(plan.guestEngagement.entertainmentSearchSuggestions)}
                                    </ul>
                                </div>
                            )}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

