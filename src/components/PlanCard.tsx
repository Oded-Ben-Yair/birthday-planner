import { useState } from 'react';
// Corrected import: Only import types explicitly used by name in this file
import type { BirthdayPlan } from '../types';

interface PlanCardProps {
    plan: BirthdayPlan;
    isSelected: boolean;
    onSelect: () => void;
}

export default function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        if (expandedSection === section) {
            setExpandedSection(null);
        } else {
            setExpandedSection(section);
        }
    };

    // Helper function to render list items, avoids repetition
    const renderList = (items: string[] | undefined) => {
        // Added check for undefined or empty array
        if (!items || items.length === 0) return <li>None specified</li>;
        return items.map((item, index) => <li key={index}>{item}</li>);
    };


    return (
        <div
            // className based on selection state
            className={`border rounded-lg p-4 transition-all ${
                isSelected ? 'border-blue-500 shadow-lg bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-gray-600">{plan.description}</p>
                </div>
                <button
                    onClick={onSelect}
                    // className based on selection state
                    className={`px-3 py-1 rounded-md ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    {isSelected ? 'Selected' : 'Select'}
                </button>
            </div>

            {/* Sections for Plan Details */}
            <div className="space-y-3">

                {/* Venue Section */}
                <div>
                    <button
                        onClick={() => toggleSection('venue')}
                        className="flex justify-between items-center w-full text-left font-medium p-2 bg-gray-100 rounded"
                    >
                        <span>Venue</span>
                        {/* Use proper minus sign for consistency */}
                        <span>{expandedSection === 'venue' ? '−' : '+'}</span>
                    </button>
                    {expandedSection === 'venue' && (
                        <div className="p-2 border-l-2 border-gray-200 ml-2 mt-2">
                            <h4 className="font-semibold">{plan.venue.name}</h4>
                            <p className="text-sm text-gray-600">{plan.venue.description}</p>
                            <p className="text-sm mt-1"><span className="font-medium">Cost:</span> {plan.venue.costRange}</p>
                            <div className="mt-1">
                                <span className="text-sm font-medium">Amenities:</span>
                                <ul className="text-sm list-disc list-inside">
                                    {renderList(plan.venue.amenities)}
                                </ul>
                            </div>
                            <p className="text-sm mt-1"><span className="font-medium">Suitability:</span> {plan.venue.suitability}</p>
                        </div>
                    )}
                </div>

                {/* Schedule Section */}
                <div>
                    <button
                        onClick={() => toggleSection('schedule')}
                        className="flex justify-between items-center w-full text-left font-medium p-2 bg-gray-100 rounded"
                    >
                        <span>Activity Schedule</span>
                        <span>{expandedSection === 'schedule' ? '−' : '+'}</span>
                    </button>
                    {expandedSection === 'schedule' && (
                        <div className="p-2 border-l-2 border-gray-200 ml-2 mt-2">
                            <ul className="space-y-2">
                                {/* Access properties from plan.schedule which conforms to ActivitySchedule implicitly */}
                                {plan.schedule.map((item, index) => (
                                    <li key={index} className="text-sm">
                                        <span className="font-semibold">{item.time}:</span> {item.activity}
                                        <p className="text-xs text-gray-600 ml-4">{item.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Catering Section */}
                <div>
                    <button
                        onClick={() => toggleSection('catering')}
                        className="flex justify-between items-center w-full text-left font-medium p-2 bg-gray-100 rounded"
                    >
                        <span>Catering</span>
                        <span>{expandedSection === 'catering' ? '−' : '+'}</span>
                    </button>
                    {expandedSection === 'catering' && (
                        <div className="p-2 border-l-2 border-gray-200 ml-2 mt-2">
                            <div className="text-sm">
                                <h4 className="font-semibold">Menu</h4>
                                <div className="ml-2">
                                    <p className="font-medium">Appetizers:</p>
                                    <ul className="list-disc list-inside">
                                        {renderList(plan.catering.menu.appetizers)}
                                    </ul>
                                    <p className="font-medium mt-1">Main Courses:</p>
                                    <ul className="list-disc list-inside">
                                        {renderList(plan.catering.menu.mainCourses)}
                                    </ul>
                                    <p className="font-medium mt-1">Desserts:</p>
                                    {/* Display dessert string directly */}
                                    <p className='list-inside ml-4'>{plan.catering.menu.desserts || 'None specified'}</p>
                                </div>
                                <h4 className="font-semibold mt-2">Beverages</h4>
                                <ul className="list-disc list-inside ml-2">
                                    {/* Access path corrected to plan.catering.menu.beverages */}
                                    {renderList(plan.catering.menu.beverages)}
                                </ul>
                                <p className="mt-2"><span className="font-medium">Estimated Cost:</span> {plan.catering.estimatedCost}</p>
                                <p><span className="font-medium">Serving Style:</span> {plan.catering.servingStyle}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Guest Engagement Section */}
                <div>
                    <button
                        onClick={() => toggleSection('engagement')}
                        className="flex justify-between items-center w-full text-left font-medium p-2 bg-gray-100 rounded"
                    >
                        <span>Guest Engagement</span>
                        <span>{expandedSection === 'engagement' ? '−' : '+'}</span>
                    </button>
                    {expandedSection === 'engagement' && (
                        <div className="p-2 border-l-2 border-gray-200 ml-2 mt-2">
                            <div className="text-sm">
                                <h4 className="font-semibold">Icebreakers</h4>
                                <ul className="list-disc list-inside ml-2">
                                    {renderList(plan.guestEngagement.icebreakers)}
                                </ul>
                                <h4 className="font-semibold mt-2">Interactive Elements</h4>
                                <ul className="list-disc list-inside ml-2">
                                    {renderList(plan.guestEngagement.interactiveElements)}
                                </ul>
                                <h4 className="font-semibold mt-2">Photo Opportunities</h4>
                                <ul className="list-disc list-inside ml-2">
                                    {renderList(plan.guestEngagement.photoOpportunities)}
                                </ul>
                                <h4 className="font-semibold mt-2">Party Favors</h4>
                                <ul className="list-disc list-inside ml-2">
                                    {renderList(plan.guestEngagement.partyFavors)}
                                </ul>
                                {plan.guestEngagement.techIntegration && plan.guestEngagement.techIntegration.length > 0 && (
                                     <>
                                        <h4 className="font-semibold mt-2">Tech Integration</h4>
                                        <ul className="list-disc list-inside ml-2">
                                            {renderList(plan.guestEngagement.techIntegration)}
                                        </ul>
                                     </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
