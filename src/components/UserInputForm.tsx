import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { UserInput } from '../types';

interface UserInputFormProps {
    onSubmit: (data: UserInput) => void;
    isLoading: boolean;
}

export default function UserInputForm({ onSubmit, isLoading }: UserInputFormProps) {
    const [step, setStep] = useState(1);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = // Added setValue for checkbox handling consistency
        useForm<UserInput>({
            defaultValues: {
                age: undefined,
                theme: "",
                guestCount: undefined,
                budget: 'moderate',
                location: {
                    city: "",
                    setting: 'indoor'
                },
                activities: [],
                additionalPreferences: ""
            }
        });

    const activities = watch('activities', []);

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleFormSubmit = (data: UserInput) => {
        onSubmit(data);
    };

    // Corrected logic based on guide structure for handling checkbox array
    const handleActivityChange = (activity: string) => {
        const currentActivities = activities;
        const index = currentActivities.indexOf(activity);
        let newActivities: string[];
        if (index === -1) {
            newActivities = [...currentActivities, activity];
        } else {
            newActivities = currentActivities.filter(a => a !== activity);
        }
        // Use setValue from react-hook-form to update the array field
        setValue('activities', newActivities, { shouldValidate: true });
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Birthday Planning System</h2>

            {/* Step Indicator */}
            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            // Corrected className template literal
                            className={`w-1/4 h-2 rounded-full mx-1 ${step >= i ? 'bg-blue-500' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>
                <p className="text-center text-sm text-gray-500">Step {step} of 4</p>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)}>

                {/* Step 1: Basic Information */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Basic Information</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Age of the Birthday Person
                            </label>
                            <input
                                type="number"
                                {...register('age', { required: 'Age is required', min: { value: 1, message: 'Age must be at least 1' }, max: { value: 120, message: 'Age must be 120 or less' } })}
                                className="w-full p-2 border rounded-md"
                                placeholder="Enter age"
                            />
                            {errors.age && (
                                <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Theme
                            </label>
                            <input
                                type="text"
                                {...register('theme', { required: 'Theme is required' })}
                                className="w-full p-2 border rounded-md"
                                placeholder="e.g., Superhero, Vintage, Beach Party"
                            />
                            {errors.theme && (
                                <p className="text-red-500 text-xs mt-1">{errors.theme.message}</p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Event Details */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Event Details</h3>
                        {/* Removed stray p> tag */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Number of Guests
                            </label>
                            <input
                                type="number"
                                {...register('guestCount', { required: 'Guest count is required', min: { value: 1, message: 'Must have at least 1 guest' } })}
                                className="w-full p-2 border rounded-md"
                                placeholder="Enter number of guests"
                            />
                            {errors.guestCount && (
                                // Correctly closed p tag
                                <p className="text-red-500 text-xs mt-1">{errors.guestCount.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Budget Range
                            </label>
                            <select
                                {...register('budget')}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="budget-friendly">Budget-friendly ($)</option>
                                <option value="moderate">Moderate ($$)</option>
                                <option value="premium">Premium ($$$)</option>
                                <option value="luxury">Luxury ($$$$)</option>
                            </select>
                        </div>
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Location */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Location</h3>
                        {/* Removed stray p> tag */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City/Town
                            </label>
                            <input
                                type="text"
                                {...register('location.city', { required: 'City is required' })}
                                className="w-full p-2 border rounded-md"
                                placeholder="Enter city or town"
                            />
                            {errors.location?.city && (
                                // Correctly closed p tag
                                <p className="text-red-500 text-xs mt-1">{errors.location.city.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Setting
                            </label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="indoor"
                                        {...register('location.setting')}
                                        className="mr-2"
                                    />
                                    Indoor
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="outdoor"
                                        {...register('location.setting')}
                                        className="mr-2"
                                    />
                                    Outdoor
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="both"
                                        {...register('location.setting')}
                                        className="mr-2"
                                    />
                                    Both/Flexible
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Activities & Preferences */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Activities & Preferences</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preferred Activities (Select all that apply)
                            </label>
                            <div className="space-y-2">
                                {/* Correctly formatted array - ensure strings are properly quoted and comma-separated */}
                                {['Interactive games', 'Workshops/DIY activities', 'Performances/Entertainment', 'Sports/Physical activities', 'Food experiences'].map((activity) => (
                                    <label key={activity} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            value={activity}
                                            // Corrected onChange to use specific handler
                                            onChange={() => handleActivityChange(activity)}
                                            // Use 'checked' prop based on watched 'activities' state
                                            checked={activities.includes(activity)}
                                            className="mr-2"
                                        />
                                        {activity}
                                    </label>
                                ))}
                                {/* Hidden input to register the activities field with react-hook-form */}
                                <input type="hidden" {...register('activities')} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additional Preferences (Optional)
                            </label>
                            <textarea
                                {...register('additionalPreferences')}
                                className="w-full p-2 border rounded-md"
                                placeholder="Any dietary restrictions or special considerations?"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-between">
                            <button
                                type="button" // Added space before onClick
                                onClick={prevStep}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Previous
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                {isLoading ? 'Generating Plans...' : 'Generate Birthday Plans'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
