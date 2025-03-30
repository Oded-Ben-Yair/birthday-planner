// src/components/UserInputForm.tsx
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form'; // Import Controller for select dropdown
import type { UserInput } from '../types'; // Import the updated UserInput type

interface UserInputFormProps {
	onSubmit: (data: UserInput) => void; // Function to call when form is submitted
	isLoading: boolean; // Flag to disable submit button during processing
}

// Define available currencies for the dropdown
const currencies = ['NIS', 'USD', 'EUR']; // Add more as needed

/**
 * A multi-step form component for collecting user preferences for birthday planning.
 * Uses react-hook-form for state management and validation.
 */
export default function UserInputForm({ onSubmit, isLoading }: UserInputFormProps) {
	// State for managing the current step of the form
	const [step, setStep] = useState(1);
	const totalSteps = 5; // Total number of steps in the form

	// Initialize react-hook-form
	const {
		register,         // Function to register input fields
		handleSubmit,     // Function to handle form submission
		watch,            // Function to watch field values
		setValue,         // Function to programmatically set field values
		control,          // Needed for Controller component (used for select dropdown)
		formState: { errors } // Object containing form validation errors
	} = useForm<UserInput>({
		// Set default values for all fields in the form
		defaultValues: {
			birthdayPersonName: "",
			age: undefined, // Use undefined for number inputs initially
			theme: "",
			guestCountAdults: undefined,
			guestCountChildren: 0, // Default children to 0
			budgetAmount: undefined,
			currency: 'NIS', // Default currency to NIS (relevant for Israel)
			location: {
				city: "",
				setting: 'indoor' // Default setting
			},
			activities: [], // Default activities to empty array
			foodPreferences: "",
			drinkPreferences: "",
			additionalPreferences: ""
		}
	});

	// Watch the 'activities' field to manage checkbox state
	const activities = watch('activities', []); // Default to empty array if undefined

	// Navigation functions
	const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
	const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

	/**
	 * Handles the final form submission.
	 * Ensures numeric fields are correctly typed before calling the onSubmit prop.
	 * @param data - The form data collected by react-hook-form.
	 */
	const handleFormSubmit = (data: UserInput) => {
		// Ensure numeric fields are numbers (browser/react-hook-form might handle differently)
		const numericData: UserInput = {
			...data,
			age: Number(data.age || 0), // Provide fallback if needed
			guestCountAdults: Number(data.guestCountAdults || 0),
			guestCountChildren: Number(data.guestCountChildren || 0),
			budgetAmount: Number(data.budgetAmount || 0),
		};
		console.log("Form Submitted Data:", numericData); // Log data before submitting
		onSubmit(numericData); // Pass the processed data to the parent component
	};

	/**
	 * Handles changes to the activity checkboxes.
	 * Adds or removes the activity from the 'activities' array in the form state.
	 * @param activity - The name of the activity being toggled.
	 */
	const handleActivityChange = (activity: string) => {
		const currentActivities = activities || []; // Ensure it's an array
		const index = currentActivities.indexOf(activity);
		let newActivities: string[];
		if (index === -1) {
			// Add activity if not present
			newActivities = [...currentActivities, activity];
		} else {
			// Remove activity if present
			newActivities = currentActivities.filter(a => a !== activity);
		}
		// Update the form state using setValue from react-hook-form
		setValue('activities', newActivities, { shouldValidate: true }); // Trigger validation if needed
	};

	/**
	 * Helper function to dynamically generate CSS classes for input fields based on validation errors.
	 * @param fieldName - The name of the field (can be nested like 'location.city').
	 * @returns A string of CSS classes.
	 */
	const getInputClass = (fieldName: keyof UserInput | `location.${'city' | 'setting'}` | 'currency' | 'guestCountAdults' | 'guestCountChildren' | 'budgetAmount' | 'foodPreferences' | 'drinkPreferences' | 'additionalPreferences' | 'birthdayPersonName' | 'age' | 'theme' | 'activities') => {
		// Check for errors, handling nested fields
		let hasError = false;
		if (fieldName.startsWith('location.')) {
			hasError = !!errors.location?.[fieldName.split('.')[1] as 'city' | 'setting'];
		} else {
            hasError = !!errors[fieldName as keyof UserInput];
        }
		// Return base classes plus error class if applicable
		return `w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition duration-150 ease-in-out ${hasError ? 'border-red-500' : 'border-gray-300'}`;
	};

	/**
	 * Helper function to render validation error messages for a field.
	 * @param fieldName - The name of the field.
	 * @returns A JSX element containing the error message or null.
	 */
	const renderError = (fieldName: keyof UserInput | `location.${'city' | 'setting'}` | 'currency' | 'guestCountAdults' | 'guestCountChildren' | 'budgetAmount' | 'foodPreferences' | 'drinkPreferences' | 'additionalPreferences' | 'birthdayPersonName' | 'age' | 'theme' | 'activities') => {
		let error = null;
        if (fieldName.startsWith('location.')) {
			error = errors.location?.[fieldName.split('.')[1] as 'city' | 'setting'];
		} else {
            error = errors[fieldName as keyof UserInput];
        }
		// Render the error message if it exists
		return error ? <p className="text-red-500 text-xs mt-1">{error.message}</p> : null;
	};


	return (
		<div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg"> {/* Added shadow-lg */}
			<h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Plan Your Birthday Party!</h2>

			{/* Step Indicator */}
			<div className="mb-8"> {/* Increased margin */}
				<div className="flex justify-between items-center mb-2 px-1">
					{[...Array(totalSteps)].map((_, i) => (
						<div
							key={i}
							// Progress bar segment styling
							className={`flex-1 h-2 rounded-full transition-colors duration-300 ease-in-out ${step >= (i + 1) ? 'bg-blue-500' : 'bg-gray-200'}`}
						/>
					))}
				</div>
				<p className="text-center text-sm font-medium text-gray-600">Step {step} of {totalSteps}</p>
			</div>

			{/* Form - handles submission */}
			<form onSubmit={handleSubmit(handleFormSubmit)}>
				{/* Container for step content with consistent spacing */}
				<div className="space-y-5">

					{/* Step 1: About the Birthday Person */}
					{step === 1 && (
						<div className="animate-fade-in"> {/* Simple fade-in animation */}
							<h3 className="text-xl font-semibold mb-4 text-gray-700">About the Birthday Person</h3>
							{/* Birthday Person's Name */}
							<div className="mb-4"> {/* Added margin bottom */}
								<label htmlFor="birthdayPersonName" className="block text-sm font-medium text-gray-700 mb-1">
									Birthday Person's Name <span className="text-red-500">*</span>
								</label>
								<input
									id="birthdayPersonName"
									type="text"
									{...register('birthdayPersonName', { required: "Name is required" })}
									className={getInputClass('birthdayPersonName')}
									placeholder="Enter name"
								/>
								{renderError('birthdayPersonName')}
							</div>
							{/* Age */}
							<div className="mb-4">
								<label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
									Age They Are Turning <span className="text-red-500">*</span>
								</label>
								<input
									id="age"
									type="number"
									{...register('age', {
										required: 'Age is required',
										valueAsNumber: true, // Ensure value is treated as number
										min: { value: 1, message: 'Age must be at least 1' },
										max: { value: 120, message: 'Age must be 120 or less' }
									})}
									className={getInputClass('age')}
									placeholder="Enter age"
								/>
								{renderError('age')}
							</div>
							{/* Theme */}
							<div>
								<label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
									Party Theme <span className="text-red-500">*</span>
								</label>
								<input
									id="theme"
									type="text"
									{...register('theme', { required: 'Theme is required' })}
									className={getInputClass('theme')}
									placeholder="e.g., Superhero, Vintage, Beach Party"
								/>
								{renderError('theme')}
							</div>
						</div>
					)}

					{/* Step 2: Guests & Budget */}
					{step === 2 && (
						<div className="animate-fade-in">
							<h3 className="text-xl font-semibold mb-4 text-gray-700">Guests & Budget</h3>
							{/* Guest Composition */}
							<label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
							<div className="grid grid-cols-2 gap-4 mb-4">
								<div>
									<label htmlFor="guestCountAdults" className="block text-xs font-medium text-gray-600 mb-1">
										Adults <span className="text-red-500">*</span>
									</label>
									<input
										id="guestCountAdults"
										type="number"
										min="0" // HTML5 min attribute
										{...register('guestCountAdults', {
											required: 'Number of adults is required',
											valueAsNumber: true,
											min: { value: 0, message: 'Cannot be negative' }
										})}
										className={getInputClass('guestCountAdults')}
										placeholder="e.g., 20"
									/>
									{renderError('guestCountAdults')}
								</div>
								<div>
									<label htmlFor="guestCountChildren" className="block text-xs font-medium text-gray-600 mb-1">
										Children <span className="text-red-500">*</span>
									</label>
									<input
										id="guestCountChildren"
										type="number"
                                        min="0"
										{...register('guestCountChildren', {
											required: 'Number of children is required (enter 0 if none)',
											valueAsNumber: true,
											min: { value: 0, message: 'Cannot be negative' }
										})}
										className={getInputClass('guestCountChildren')}
										placeholder="e.g., 15"
									/>
									{renderError('guestCountChildren')}
								</div>
							</div>
							{/* Budget */}
							<label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
							<div className="grid grid-cols-3 gap-4">
								<div className="col-span-2">
									<label htmlFor="budgetAmount" className="block text-xs font-medium text-gray-600 mb-1">
										Amount <span className="text-red-500">*</span>
									</label>
									<input
										id="budgetAmount"
										type="number"
                                        min="0"
										{...register('budgetAmount', {
											required: 'Budget amount is required',
											valueAsNumber: true,
											min: { value: 0, message: 'Budget cannot be negative' }
										})}
										className={getInputClass('budgetAmount')}
										placeholder="e.g., 5000"
									/>
									 {renderError('budgetAmount')}
								</div>
								<div>
									<label htmlFor="currency" className="block text-xs font-medium text-gray-600 mb-1">
										Currency <span className="text-red-500">*</span>
									</label>
									{/* Use Controller for react-hook-form integration with select */}
									<Controller
										name="currency"
										control={control}
										rules={{ required: 'Currency is required' }}
										render={({ field }) => (
											<select id="currency" {...field} className={getInputClass('currency')}>
												{currencies.map(c => <option key={c} value={c}>{c}</option>)}
											</select>
										)}
									/>
									 {renderError('currency')}
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Location */}
					{step === 3 && (
						<div className="animate-fade-in">
							<h3 className="text-xl font-semibold mb-4 text-gray-700">Location</h3>
							<div className="mb-4">
								<label htmlFor="locationCity" className="block text-sm font-medium text-gray-700 mb-1">
									City/Town <span className="text-red-500">*</span>
								</label>
								<input
									id="locationCity"
									type="text"
									{...register('location.city', { required: 'City is required' })}
									className={getInputClass('location.city')}
									placeholder="Enter city or town (e.g., Tel Aviv)"
								/>
								{renderError('location.city')}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2"> {/* Increased margin */}
									Setting Preference <span className="text-red-500">*</span>
								</label>
								{/* Radio buttons for setting */}
								<div className="flex flex-wrap gap-4"> {/* Use gap for spacing */}
									{(['indoor', 'outdoor', 'both'] as const).map(setting => (
										<label key={setting} className="flex items-center cursor-pointer">
											<input
												type="radio"
												value={setting}
												{...register('location.setting', { required: 'Setting is required' })}
												className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
											/>
											{/* Capitalize first letter for display */}
											<span className="text-sm text-gray-700">{setting.charAt(0).toUpperCase() + setting.slice(1)}</span>
										</label>
									))}
								</div>
								{renderError('location.setting')}
							</div>
						</div>
					)}

					{/* Step 4: Activities & Preferences */}
					{step === 4 && (
						<div className="animate-fade-in">
							<h3 className="text-xl font-semibold mb-4 text-gray-700">Activities & Other Preferences</h3>
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Preferred Activities (Select all that apply)
								</label>
								{/* Checkbox group for activities */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
									{/* Expanded list of activities */}
									{['Interactive games (e.g., scavenger hunt, trivia)',
									  'Workshops/DIY activities (e.g., crafts, cooking)',
									  'Performances/Entertainment (e.g., magician, DJ)',
									  'Sports/Physical activities (e.g., bouncy castle, park games)',
									  'Food experiences (e.g., cooking class, themed snacks)',
									  'Relaxed social gathering (e.g., mingling, board games)',
                                      'Movie screening',
                                      'Pool party (if applicable)',
                                      'Adventure/Outdoor activity (e.g., hiking, climbing)'
                                      ].map((activity) => (
										<label key={activity} className="flex items-center cursor-pointer">
											<input
												type="checkbox"
												value={activity}
												// Check if activity is included in the watched 'activities' array
												checked={(activities || []).includes(activity)}
												onChange={() => handleActivityChange(activity)}
												className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
											/>
											<span className="text-sm text-gray-700">{activity}</span>
										</label>
									))}
									{/* Hidden input registers the field with react-hook-form */}
									<input type="hidden" {...register('activities')} />
								</div>
								{renderError('activities')} {/* Add validation if needed (e.g., at least one) */}
							</div>
							<div>
								<label htmlFor="additionalPreferences" className="block text-sm font-medium text-gray-700 mb-1">
									Other Preferences / Important Notes (Optional)
								</label>
								<textarea
									id="additionalPreferences"
									{...register('additionalPreferences')}
									className={getInputClass('additionalPreferences')}
									placeholder="e.g., Dietary restrictions (allergies: nuts, gluten), accessibility needs, specific dislikes, must-have music genres..."
									rows={3}
								/>
								 {renderError('additionalPreferences')}
							</div>
						</div>
					)}

					{/* Step 5: Food & Drinks */}
					{step === 5 && (
						<div className="animate-fade-in">
							<h3 className="text-xl font-semibold mb-4 text-gray-700">Food & Drinks</h3>
							<div className="mb-4">
								<label htmlFor="foodPreferences" className="block text-sm font-medium text-gray-700 mb-1">
									Specific Food Wishes / Requirements <span className="text-red-500">*</span>
								</label>
								<textarea
									id="foodPreferences"
									{...register('foodPreferences', { required: "Please mention food preferences (e.g., 'Kid-friendly menu', 'Vegan options needed', 'Loves pizza and pasta')" })}
									className={getInputClass('foodPreferences')}
									placeholder="e.g., Must have pizza & cake, need vegetarian options, loves finger foods, specific cuisines..."
									rows={3}
								/>
								{renderError('foodPreferences')}
							</div>
							<div>
								<label htmlFor="drinkPreferences" className="block text-sm font-medium text-gray-700 mb-1">
									Specific Drink Wishes / Requirements <span className="text-red-500">*</span>
								</label>
								<textarea
									id="drinkPreferences"
									{...register('drinkPreferences', { required: "Please mention drink preferences (e.g., 'Juice boxes for kids', 'Coffee for adults', 'No alcohol')" })}
									className={getInputClass('drinkPreferences')}
									placeholder="e.g., Assorted juices & water for kids, coffee/tea for adults, specific soda brands, signature mocktail idea..."
									rows={3}
								/>
								{renderError('drinkPreferences')}
							</div>
						</div>
					)}


					{/* Navigation Buttons */}
					<div className="flex justify-between pt-6 border-t border-gray-200 mt-6"> {/* Added top border/padding */}
						<button
							type="button"
							onClick={prevStep}
							disabled={step === 1} // Disable Previous on first step
							className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
						>
							Previous
						</button>
						{step < totalSteps ? (
							// Show Next button if not on the last step
							<button
								type="button"
								onClick={nextStep}
								className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
							>
								Next
							</button>
						) : (
							// Show Submit button on the last step
							<button
								type="submit"
								disabled={isLoading} // Disable button when loading
								className="px-6 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 disabled:opacity-70 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
							>
								{isLoading ? 'Generating Plans...' : 'Generate Birthday Plans'}
							</button>
						)}
					</div>
				</div>
			</form>
            {/* Add simple fade-in animation style */}
            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
		</div>
	);
}

