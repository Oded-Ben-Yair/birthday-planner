// netlify/functions/openai-proxy.js
import OpenAI from 'openai';

// Initialize OpenAI client securely using the environment variable
// Ensure OPENAI_API_KEY is set in your Netlify site environment variables
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Attempts to extract and parse a JSON object or array from a string,
 * which might contain leading/trailing text or markdown fences.
 * @param {string | null | undefined} jsonString The raw string potentially containing JSON.
 * @returns {object | array | null} The parsed JSON object/array, or null if parsing fails.
 */
const extractAndParseJson = (jsonString) => {
	if (!jsonString || typeof jsonString !== 'string') {
		console.error('extractAndParseJson: Input is not a valid string.', jsonString);
		return null;
	}

	try {
		// Attempt direct parsing first (ideal case)
		return JSON.parse(jsonString);
	} catch (directParseError) {
		console.warn('Direct JSON parsing failed. Attempting extraction...', directParseError.message);
		// Attempt to extract JSON object or array
		// Find first '{' or '['
		const firstBracket = jsonString.indexOf('{');
		const firstSquare = jsonString.indexOf('[');
		let startIndex = -1;

		if (firstBracket === -1 && firstSquare === -1) {
			console.error('extractAndParseJson: No JSON object or array found in the string.');
			return null; // No JSON structure found
		}

		if (firstBracket === -1) {
			startIndex = firstSquare;
		} else if (firstSquare === -1) {
			startIndex = firstBracket;
		} else {
			startIndex = Math.min(firstBracket, firstSquare); // Find whichever comes first
		}

		// Find the corresponding last '}' or ']'
		const isObject = jsonString[startIndex] === '{';
		const lastBracket = isObject ? jsonString.lastIndexOf('}') : jsonString.lastIndexOf(']');

		if (lastBracket === -1 || lastBracket < startIndex) {
			console.error('extractAndParseJson: Could not find matching closing bracket.');
			return null; // No matching closing bracket found
		}

		const potentialJson = jsonString.substring(startIndex, lastBracket + 1);

		try {
			// Attempt parsing the extracted substring
			const parsedJson = JSON.parse(potentialJson);
			console.log('Successfully parsed extracted JSON.');
			return parsedJson;
		} catch (extractionParseError) {
			console.error('extractAndParseJson: Failed to parse extracted JSON substring:', extractionParseError.message);
			console.error('Original string that failed parsing:', jsonString); // Log the problematic string
			return null; // Return null if extraction parsing fails
		}
	}
};


// Define the handler function for Netlify
export const handler = async (event) => {
	// Allow requests only from your site's origin in production, or localhost in dev
	const allowedOrigin = process.env.NODE_ENV === 'development' ? '*' : process.env.URL;
	// Note: '*' is generally unsafe for production CORS. Configure specific origins if needed.

	const headers = {
		'Access-Control-Allow-Origin': allowedOrigin || '*', // Fallback to '*' if URL is not set
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
	};

	// Handle CORS preflight requests
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 204, // No Content
			headers,
			body: '',
		};
	}

	// Only allow POST requests for actual API calls
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
	}

	try {
		// Get the data sent from the frontend
		// Add basic check for event.body existence
		if (!event.body) {
			throw new Error("Request body is missing.");
		}
		const payload = JSON.parse(event.body); // Assuming frontend sends valid JSON
		const { action, ...data } = payload; // Expect an 'action' field

		// Validate action existence
		if (!action) {
			throw new Error("Missing 'action' field in request payload.");
		}

		console.log(`Received action: ${action}`); // Log received action

		let responseData = null; // Initialize responseData

		// --- Handle Different Actions ---
		if (action === 'generatePlans') {
			if (!data.userInput) throw new Error("Missing 'userInput' data for generatePlans action.");

			// Call OpenAI for plan generation (Chat Completion)
			const completion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo', // Or consider "gpt-4o" or "gpt-4-turbo" if needed
				messages: [
					// --- System Prompt for Plan Generation ---
					{ role: 'system', content: `You are BirthdayPlannerAI, an expert event planner specializing in creating memorable birthday celebrations. Your task is to help users plan the perfect birthday event by generating personalized recommendations based on their preferences. You will maintain a friendly, enthusiastic tone while providing practical and creative suggestions. **IMPORTANT: You MUST return your response as a single, valid JSON object containing ONLY a key named "plans". The value of "plans" MUST be an array of exactly three distinct birthday plan objects.** Do not include any introductory text, explanations, apologies, markdown formatting (like \`\`\`json), or anything outside the single JSON object.` },
					// --- User Prompt for Plan Generation ---
					{ role: 'user', content: `Generate three distinct birthday plans for a ${data.userInput.age}-year-old with a ${data.userInput.theme} theme. Budget level: ${data.userInput.budget}. Location: ${data.userInput.location.city} (${data.userInput.location.setting}). Guest count: ${data.userInput.guestCount}. Preferred activities: ${data.userInput.activities?.join(', ') || 'Any'}. Additional preferences: ${data.userInput.additionalPreferences || 'None'}. Each plan object in the "plans" array must include: 1. A unique string id (e.g., "plan-1", "plan-2", "plan-3"). 2. A string 'name' (e.g., "DIY Delight Party"). 3. A string 'description'. 4. A 'venue' object with string 'name', 'description', 'costRange', and 'suitability', plus an array of strings 'amenities'. 5. An array 'schedule' of objects, each with string 'time' and 'activity', and optionally 'description'. 6. A 'catering' object with 'estimatedCost' (string), 'servingStyle' (string), and a 'menu' object containing arrays of strings 'appetizers', 'mainCourses', 'beverages', and a single string 'desserts'. 7. A 'guestEngagement' object containing arrays of strings 'icebreakers', 'interactiveElements', 'photoOpportunities', 'partyFavors', and optionally 'techIntegration'. The first plan should be DIY-focused and budget-friendly. The second plan should focus on premium experiences. The third plan should highlight unique activities.` }
				],
				temperature: 0.7,
				// Ensure the model is instructed to return JSON via the prompt.
				// response_format: { type: "json_object" }, // Use this with newer models that support it reliably (like gpt-4-turbo)
			});

			const content = completion.choices[0]?.message?.content;
			if (!content) throw new Error('No content returned from OpenAI chat completion (generatePlans)');

			// **USE HELPER FUNCTION TO PARSE**
			responseData = extractAndParseJson(content);
			if (!responseData || !responseData.plans) { // Check if parsing failed or structure is wrong
				console.error("Failed to parse valid JSON or 'plans' key missing from OpenAI response (generatePlans). Raw content:", content);
				throw new Error("AI response was not in the expected JSON format containing a 'plans' array.");
			}
            console.log("Successfully generated and parsed plans.");

		} else if (action === 'generateInvitation') {
            if (!data.plan || !data.template || !data.date || !data.time) throw new Error("Missing data for generateInvitation action.");

			// Generate invitation text
			const textCompletion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					// --- System Prompt for Invitation Text ---
					{ role: 'system', content: `You are an expert in creating engaging and appropriate birthday invitations.` },
					// --- User Prompt for Invitation Text ---
					{ role: 'user', content: `Create a birthday invitation text for a party themed "${data.plan.name}" (${data.plan.description}). The event will be at ${data.plan.venue?.name || 'the specified venue'} on ${data.date} at ${data.time}. The style should be ${data.template}. Keep it concise but engaging, and include all necessary details. Only return the invitation text itself, no extra explanations.` }
				],
				temperature: 0.7,
			});
			const text = textCompletion.choices[0]?.message?.content?.trim() || 'Join us for a birthday celebration!';

			// Generate invitation image (Consider DALL-E 2 for cost/speed if needed)
			const imageResponse = await openai.images.generate({
				model: 'dall-e-3', // DALL-E 3 is higher quality but slower/more expensive
				prompt: `Generate a birthday invitation image background fitting a "${data.plan.theme || data.plan.name}" themed birthday party. Style: ${data.template}. The image should be visually appealing as an invitation background. Do not include any text in the image.`,
				n: 1,
				size: '1024x1024', // Standard size for DALL-E 3
                quality: "standard", // Use "hd" for higher quality if needed
                // style: "vivid", // or "natural"
			});
			const imageUrl = imageResponse.data[0]?.url || ''; // Use optional chaining

			responseData = { text, imageUrl, template: data.template };
            console.log("Successfully generated invitation components.");

		} else if (action === 'optimizeBudget') {
            if (!data.plan || !data.priorities) throw new Error("Missing data for optimizeBudget action.");

			// Call OpenAI for budget optimization
			const completion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo', // Or "gpt-4o" / "gpt-4-turbo"
				messages: [
                    // --- System Prompt for Budget Optimization ---
					{ role: 'system', content: `You are a budget optimization expert for event planning. **IMPORTANT: You MUST return your response as a single, valid JSON object containing ONLY a key named "optimizedPlan". The value of "optimizedPlan" MUST be a complete birthday plan object, maintaining the exact same structure as the input plan.** Do not include any introductory text, explanations, apologies, markdown formatting (like \`\`\`json), or anything outside the single JSON object.` },
                    // --- User Prompt for Budget Optimization ---
					{ role: 'user', content: `Optimize the following birthday plan JSON based on the provided budget priorities (1-5 scale, 5 is highest). Increase quality/options for high-priority items and suggest specific, practical cost-saving alternatives or reductions for low-priority items, adjusting descriptions and costs accordingly. Ensure the output is only the complete, optimized plan object under the "optimizedPlan" key.\n\nInput Plan:\n${JSON.stringify(data.plan)}\n\nPriorities:\nVenue: ${data.priorities.venue}\nFood & Beverages: ${data.priorities.food}\nActivities & Entertainment: ${data.priorities.activities}\nDecorations: ${data.priorities.decorations}\nParty Favors: ${data.priorities.partyFavors}` }
				],
				temperature: 0.6, // Slightly lower temp for more deterministic structure
                // response_format: { type: "json_object" }, // Use with newer models if available
			});

			const content = completion.choices[0]?.message?.content;
			if (!content) throw new Error('No content returned from OpenAI budget optimization');

			// **USE HELPER FUNCTION TO PARSE**
			responseData = extractAndParseJson(content);
            if (!responseData || !responseData.optimizedPlan) { // Check if parsing failed or structure is wrong
				console.error("Failed to parse valid JSON or 'optimizedPlan' key missing from OpenAI response (optimizeBudget). Raw content:", content);
				throw new Error("AI response was not in the expected JSON format containing an 'optimizedPlan' object.");
			}
            console.log("Successfully generated and parsed optimized plan.");

		} else {
			// Action not recognized
			console.error('Invalid action received:', action);
			throw new Error(`Invalid action specified: ${action}`);
		}

		// Return successful response
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify(responseData), // Send back the parsed and structured data
		};

	} catch (error) {
		console.error('Error processing request in Netlify function:', error);
		// Determine status code, default to 500
		const status = error.statusCode || error.status || (error.response && error.response.status) || 500;
		// Provide a meaningful error message
		const message = error.message || 'An internal server error occurred.';

		// Log specific OpenAI errors if available
		if (error instanceof OpenAI.APIError) {
			console.error('OpenAI API Error Details:', { status: error.status, message: error.message, code: error.code, type: error.type });
		}

		return {
			statusCode: status,
			headers,
			// Return error message in JSON format for frontend to potentially use
			body: JSON.stringify({ error: message }),
		};
	}
};
