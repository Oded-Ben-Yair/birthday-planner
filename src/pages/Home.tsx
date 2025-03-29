import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserInputForm from '../components/UserInputForm';
import type { UserInput } from '../types';
import { generateBirthdayPlans } from '../utils/api';
export default function Home() {
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const navigate = useNavigate();
const handleSubmit = async (data: UserInput) => {
setIsLoading(true);
setError(null);try {
const plans = await generateBirthdayPlans(data);
// Store the generated plans and user input in localStorage
localStorage.setItem('birthdayPlans', JSON.stringify(plans));
localStorage.setItem('userInput', JSON.stringify(data));
// Navigate to the results page
navigate('/results');
} catch (err) {
console.error('Error generating plans:', err);
setError('Failed to generate birthday plans. Please try again.');
} finally {
setIsLoading(false);
}
};
return (
<div className="min-h-screen bg-gray-50 py-12">
<div className="max-w-4xl mx-auto px-4">
<header className="text-center mb-12">
<h1 className="text-3xl font-bold text-gray-900">AI-Powered Birthday
Planning System</h1>
<p className="mt-2 text-gray-600">
Create personalized birthday event plans based on your preferences
</p>
</header>
<UserInputForm onSubmit={handleSubmit} isLoading={isLoading} />
{error && (
<div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md">
{error}
</div>
)}
</div>
</div>
);
}
