    // src/components/PlanCard.tsx
    import React, { useState, useCallback } from 'react'; // Removed useEffect, useRef
    import type { BirthdayPlan } from '../types';

    /**
     * Props for the PlanCard component.
     * REMOVED onPlanUpdate as editing moves to detail page.
     */
    interface PlanCardProps {
    	plan: BirthdayPlan;
    	isSelected: boolean; // Keep for visual styling on Results page
    	onSelect: () => void; // This will now trigger navigation via parent
    }

    /**
     * Component to display a single Birthday Plan card with expandable sections.
     * Clicking the button now triggers navigation via the onSelect prop.
     * Inline editing has been removed.
     */
    export default function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
    	// State for managing which detail section is expanded
    	const [expandedSection, setExpandedSection] = useState<string | null>(null);

    	/**
    	 * Toggles the visibility of detail sections.
    	 */
    	const toggleSection = useCallback((section: string) => {
    		setExpandedSection(prev => (prev === section ? null : section));
    	}, []);

    	/**
    	 * Helper function to render lists of strings safely.
    	 */
        const renderList = useCallback((items: unknown): React.ReactNode => {
            if (Array.isArray(items) && items.length > 0) {
                return items.map((item, index) => (
                    <li key={`${item}-${index}`}>{String(item ?? '')}</li>
                ));
            }
            // Use a more descriptive placeholder and style it
            return <li className="text-gray-400 italic">None specified</li>;
        }, []);

    	// --- Render Component UI ---
    	return (
    		<div
    			// Add styling for hover effect even when not selected
    			className={`border rounded-lg p-4 transition-all duration-300 ease-in-out flex flex-col h-full ${ // Added flex, h-full
    				isSelected
    					? 'border-indigo-500 shadow-lg bg-indigo-50 ring-2 ring-indigo-300'
    					: 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
    			}`}
    		>
    			{/* Header Section: Name, Description, View Button */}
    			<div className="flex justify-between items-start mb-4">
    				{/* Plan Name and Description (Not editable here anymore) */}
    				<div className="flex-grow mr-4 min-w-0">
    					<h3 className="text-xl font-bold text-gray-800 break-words">
    						{plan.name || <span className="text-gray-400 italic">Unnamed Plan</span>}
    					</h3>
    					<p className="text-sm text-gray-600 mt-1 break-words">
    						{plan.description || <span className="text-gray-400 italic">No description provided</span>}
    					</p>
                        {/* Display Plan Profile Type */}
                        {plan.profile && (
                            <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded ${
                                plan.profile === 'DIY/Budget' ? 'bg-green-100 text-green-800' :
                                plan.profile === 'Premium/Convenience' ? 'bg-blue-100 text-blue-800' :
                                plan.profile === 'Unique/Adventure' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {plan.profile}
                            </span>
                        )}
    				</div>

    				{/* ** CHANGED Button Text and Action ** */}
    				<button
    					onClick={onSelect} // Calls handleSelectAndNavigate in Results.tsx
    					className={`flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`} // Consistent button style
                        aria-label={`View details for plan ${plan.name}`}
    				>
    					View & Edit Details
    				</button>
    			</div>

    			{/* --- Collapsible Sections for Plan Details --- */}
                {/* Make sections take remaining space */}
    			<div className="space-y-3 mt-4 border-t pt-4 flex-grow">

    				{/* Venue Section */}
    				<div>
    					<button onClick={() => toggleSection('venue')} className="flex justify-between items-center w-full text-left font-semibold text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors" aria-expanded={expandedSection === 'venue'}>
    						<span>Venue Details</span>
    						<span className="text-lg font-light">{expandedSection === 'venue' ? '−' : '+'}</span>
    					</button>
    					{expandedSection === 'venue' && (
    						<div className="p-3 border-l-2 border-gray-200 ml-2 mt-2 text-sm space-y-1 bg-white rounded-r-md shadow-inner">
    							{/* ... Venue details rendering using renderList ... */}
                                <h4 className="font-semibold text-gray-800">{plan.venue?.name || '-'}</h4>
                                <p className="text-gray-600">{plan.venue?.description || '-'}</p>
                                <p><strong className="font-medium text-gray-700">Cost:</strong> {plan.venue?.costRange || '-'}</p>
                                <div><strong className="font-medium text-gray-700">Amenities:</strong><ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.venue?.amenities)}</ul></div>
                                <p><strong className="font-medium text-gray-700">Suitability:</strong> {plan.venue?.suitability || '-'}</p>
                                {plan.venue?.venueSearchSuggestions && plan.venue.venueSearchSuggestions.length > 0 && (
                                    <div className="pt-1 mt-1 border-t border-gray-100"><strong className="font-medium text-gray-700 text-xs">Example Searches:</strong><ul className="list-disc list-inside ml-4 text-gray-500 text-xs">{renderList(plan.venue.venueSearchSuggestions)}</ul></div>
                                )}
    						</div>
    					)}
    				</div>

    				{/* Schedule Section */}
                    <div>
    					<button onClick={() => toggleSection('schedule')} className="flex justify-between items-center w-full text-left font-semibold text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors" aria-expanded={expandedSection === 'schedule'}>
    						<span>Activity Schedule</span>
    						<span className="text-lg font-light">{expandedSection === 'schedule' ? '−' : '+'}</span>
    					</button>
    					{expandedSection === 'schedule' && (
    						<div className="p-3 border-l-2 border-gray-200 ml-2 mt-2 text-sm space-y-2 bg-white rounded-r-md shadow-inner">
    							{/* ... Schedule details rendering ... */}
                                {plan.schedule?.length > 0 ? ( plan.schedule.map((item, index) => ( <div key={index}> <strong className="font-medium text-gray-700">{item.time || 'N/A'}:</strong> {item.activity || '-'} {item.description && <p className="text-xs text-gray-500 pl-2">{item.description}</p>} </div> )) ) : ( <p className="text-gray-500 italic">No schedule provided.</p> )}
    						</div>
    					)}
    				</div>

    				{/* Catering Section */}
    				<div>
    					<button onClick={() => toggleSection('catering')} className="flex justify-between items-center w-full text-left font-semibold text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors" aria-expanded={expandedSection === 'catering'}>
    						<span>Catering Details</span>
    						<span className="text-lg font-light">{expandedSection === 'catering' ? '−' : '+'}</span>
    					</button>
    					{expandedSection === 'catering' && (
    						<div className="p-3 border-l-2 border-gray-200 ml-2 mt-2 text-sm space-y-2 bg-white rounded-r-md shadow-inner">
    							{/* ... Catering details rendering using renderList ... */}
                                <p><strong className="font-medium text-gray-700">Est. Cost:</strong> {plan.catering?.estimatedCost || '-'}</p>
                                <p><strong className="font-medium text-gray-700">Style:</strong> {plan.catering?.servingStyle || '-'}</p>
                                <div className="pt-1"> <strong className="font-medium text-gray-700">Menu:</strong> <div className="ml-4 text-gray-600 space-y-1"> <div><span className="text-xs font-semibold text-gray-500">Appetizers:</span> <ul className="list-disc list-inside text-xs">{renderList(plan.catering?.menu?.appetizers)}</ul></div> <div><span className="text-xs font-semibold text-gray-500">Main Courses:</span> <ul className="list-disc list-inside text-xs">{renderList(plan.catering?.menu?.mainCourses)}</ul></div> <div><span className="text-xs font-semibold text-gray-500">Desserts:</span> <p className="text-xs inline">{plan.catering?.menu?.desserts || 'None specified'}</p></div> <div><span className="text-xs font-semibold text-gray-500">Beverages:</span> <ul className="list-disc list-inside text-xs">{renderList(plan.catering?.menu?.beverages)}</ul></div> </div> </div>
                                {plan.catering?.cateringSearchSuggestions && plan.catering.cateringSearchSuggestions.length > 0 && (
                                    <div className="pt-1 mt-1 border-t border-gray-100"><strong className="font-medium text-gray-700 text-xs">Example Searches:</strong><ul className="list-disc list-inside ml-4 text-gray-500 text-xs">{renderList(plan.catering.cateringSearchSuggestions)}</ul></div>
                                )}
    						</div>
    					)}
    				</div>

    				{/* Guest Engagement Section */}
    				<div>
    					<button onClick={() => toggleSection('engagement')} className="flex justify-between items-center w-full text-left font-semibold text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors" aria-expanded={expandedSection === 'engagement'}>
    						<span>Guest Engagement</span>
    						<span className="text-lg font-light">{expandedSection === 'engagement' ? '−' : '+'}</span>
    					</button>
    					{expandedSection === 'engagement' && (
    						<div className="p-3 border-l-2 border-gray-200 ml-2 mt-2 text-sm space-y-2 bg-white rounded-r-md shadow-inner">
    							{/* ... Guest Engagement details rendering using renderList ... */}
                                <div><strong className="font-medium text-gray-700">Icebreakers:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement?.icebreakers)}</ul></div>
                                <div><strong className="font-medium text-gray-700">Interactive Elements:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement?.interactiveElements)}</ul></div>
                                <div><strong className="font-medium text-gray-700">Photo Opportunities:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement?.photoOpportunities)}</ul></div>
                                <div><strong className="font-medium text-gray-700">Party Favors:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement?.partyFavors)}</ul></div>
                                {plan.guestEngagement?.techIntegration && plan.guestEngagement.techIntegration.length > 0 && ( <div><strong className="font-medium text-gray-700">Tech Integration:</strong> <ul className="list-disc list-inside ml-4 text-gray-600">{renderList(plan.guestEngagement.techIntegration)}</ul></div> )}
                                {plan.guestEngagement?.entertainmentSearchSuggestions && plan.guestEngagement.entertainmentSearchSuggestions.length > 0 && (
                                    <div className="pt-1 mt-1 border-t border-gray-100"><strong className="font-medium text-gray-700 text-xs">Example Searches:</strong><ul className="list-disc list-inside ml-4 text-gray-500 text-xs">{renderList(plan.guestEngagement.entertainmentSearchSuggestions)}</ul></div>
                                )}
    						</div>
    					)}
    				</div>
    			</div>
    		</div>
    	);
    }
    
