import { useState } from 'react';
import type { BirthdayPlan, SmartInvitation as SmartInvitationType } from '../types';
import { generateSmartInvitation } from '../utils/api';

interface SmartInvitationProps {
    selectedPlan: BirthdayPlan;
}

export default function SmartInvitation({ selectedPlan }: SmartInvitationProps) {
    const [template, setTemplate] = useState<'classic' | 'playful' | 'themed' | 'minimalist'>('themed');
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [invitation, setInvitation] = useState<SmartInvitationType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateInvitation = async () => {
        if (!date || !time) {
            setError('Please select a date and time for the event');
            return;
        }
        setIsLoading(true); // Corrected placement from user's code
        setError(null);
        try {
            // Corrected line break from user's code
            const result = await generateSmartInvitation(selectedPlan, template, date, time);
            setInvitation(result);
        } catch (err) {
            setError('Failed to generate invitation. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Smart Invitation</h2>
            {!invitation ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Template Style
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {['classic', 'playful', 'themed', 'minimalist'].map((style) => (
                                <div
                                    key={style}
                                    onClick={() => setTemplate(style as any)}
                                    // Corrected className formatting from user's code
                                    className={`border rounded-md p-3 text-center cursor-pointer ${
                                        template === style
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <span className="capitalize">{style}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Event Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                // Added space before className
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Event Time
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}
                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerateInvitation}
                            disabled={isLoading}
                            // Corrected className formatting from user's code
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                        >
                            {isLoading ? 'Generating...' : 'Generate Invitation'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden">
                        {invitation.imageUrl ? (
                            <img
                                src={invitation.imageUrl}
                                alt="Birthday Invitation"
                                className="w-full h-64 object-cover"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500">Image not available</span>
                            </div>
                        )}
                    </div> {/* Added closing div that seemed missing in user provided code based on indentation */}
                    <div className="p-4 bg-white">
                        <div className="prose max-w-none">
                            {/* Corrected potential split issue if text is null/undefined */}
                            {(invitation.text || '').split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <button
                            onClick={() => setInvitation(null)}
                            // Corrected className formatting from user's code
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                            Create New
                        </button>
                        <button
                            onClick={() => {
                                // Corrected alert string to be single line
                                alert('Invitation saved! In a real app, this would save or share the invitation.');
                            }}
                            // Corrected className formatting from user's code
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Save & Share
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
