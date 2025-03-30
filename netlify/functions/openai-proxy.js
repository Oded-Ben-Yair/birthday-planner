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
 * More robust against minor AI formatting inconsistencies.
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
			console.error('Original string:', jsonString); // Log problematic string
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
			console.error('Original string:', jsonString); // Log problematic string
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
	// Define allowed origins based on environment
	const allowedOrigin = process.env.NODE_ENV === 'development' ? '*' : process.env.URL;

	const headers = {
		'Access-Control-Allow-Origin': allowedOrigin || '*', // Use defined origin or fallback
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS
	};

	// Handle CORS preflight requests immediately
	if (event.httpMethod === 'OPTIONS') {
		return { statusCode: 204, headers, body: '' };
	}

	// Ensure only POST requests proceed
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
	}

	try {
		// --- Request Body Parsing and Validation ---
		if (!event.body) {
			throw new Error("Request body is missing.");
		}
		let payload;
		try {
			payload = JSON.parse(event.body);
		} catch (parseError) {
			console.error("Failed to parse request body:", event.body, parseError);
			throw new Error("Invalid request format: Body must be valid JSON.");
		}

		const { action, ...data } = payload;

		if (!action) {
			throw new Error("Missing 'action' field in request payload.");
		}

		console.log(`Received action: ${action}`);
		let responseData = null; // Initialize responseData

		// --- Action: Generate Birthday Plans ---
		if (action === 'generatePlans') {
			const { userInput } = data;
			// **Validate NEW required userInput fields**
			if (!userInput || typeof userInput !== 'object' || !userInput.birthdayPersonName || !userInput.age || !userInput.theme || userInput.guestCountAdults === undefined || userInput.guestCountChildren === undefined || !userInput.budgetAmount || !userInput.currency || !userInput.location?.city || !userInput.location?.setting || !userInput.foodPreferences || !userInput.drinkPreferences) {
				console.error("Missing required fields in userInput for generatePlans:", userInput);
				throw new Error("Missing required user input data for generating plans. Please fill all fields.");
			}

			// **Construct the DETAILED prompt using NEW inputs**
			const systemPrompt_GeneratePlans = `You are BirthdayPlannerAI, an expert event planner. Your goal is to generate 3 distinct, detailed, and personalized birthday plans.
**CRITICAL INSTRUCTIONS:**
1.  **Output Format:** Respond ONLY with a single, valid JSON object. Do NOT include any text before or after the JSON object. Do NOT use markdown fences (\`\`\`json).
2.  **JSON Structure:** The JSON object MUST contain a single top-level key named "plans". The value of "plans" MUST be an array containing exactly three unique plan objects.
3.  **Plan Object Structure:** Each plan object in the "plans" array MUST have the following keys with values of the specified type:
    * \`id\`: string (e.g., "plan-1", "plan-2", "plan-3")
    * \`name\`: string (Creative name for the plan)
    * \`description\`: string (Brief summary)
    * \`profile\`: string (MUST be one of: "DIY/Budget", "Premium/Convenience", "Unique/Adventure")
    * \`venue\`: object containing:
        * \`name\`: string
        * \`description\`: string
        * \`costRange\`: string (Descriptive, e.g., "500-1000 ${userInput.currency}", "$$")
        * \`amenities\`: array of strings
        * \`suitability\`: string (Why it fits the theme/guests)
        * \`venueSearchSuggestions\`: array of strings (2-3 example Google search terms)
    * \`schedule\`: array of objects, each object containing:
        * \`time\`: string (e.g., "2:00 PM - 2:30 PM")
        * \`activity\`: string
        * \`description\`: string (optional)
    * \`catering\`: object containing:
        * \`estimatedCost\`: string (Descriptive, e.g., "Approx. 800 ${userInput.currency}", "$$")
        * \`servingStyle\`: string (e.g., "Buffet")
        * \`menu\`: object containing:
            * \`appetizers\`: array of strings
            * \`mainCourses\`: array of strings
            * \`desserts\`: string (Description, e.g., "Themed Cake, Fruit")
            * \`beverages\`: array of strings
        * \`cateringSearchSuggestions\`: array of strings (2-3 example Google search terms)
    * \`guestEngagement\`: object containing:
        * \`icebreakers\`: array of strings
        * \`interactiveElements\`: array of strings
        * \`photoOpportunities\`: array of strings
        * \`partyFavors\`: array of strings
        * \`techIntegration\`: array of strings (optional, use empty array if none)
        * \`entertainmentSearchSuggestions\`: array of strings (2-3 example Google search terms for entertainers/activities)
4.  **Plan Distinction:** Ensure the three plans clearly match their assigned \`profile\`:
    * Plan 1 (\`profile: "DIY/Budget"\`): Emphasize low-cost options, home-based possibilities, DIY decorations/food.
    * Plan 2 (\`profile: "Premium/Convenience"\`): Focus on hired services, upscale venues, convenience, higher quality catering.
    * Plan 3 (\`profile: "Unique/Adventure"\`): Highlight unusual activities, unique venues, memorable experiences, possibly outdoor/adventure elements.
5.  **Personalization:** Tailor suggestions based on ALL user inputs provided below. Incorporate food/drink preferences into catering. Consider guest composition (adults/children) for activities and venue suitability. Mention the birthday person's name occasionally if appropriate for tone, but not in structured data.
6.  **Tone:** Friendly, enthusiastic, and helpful.`;

			const userPrompt_GeneratePlans = `Generate 3 distinct birthday plans for ${userInput.birthdayPersonName}, who is turning ${userInput.age}.
Theme: ${userInput.theme}
Guests: ${userInput.guestCountAdults} adults, ${userInput.guestCountChildren} children
Budget: Approximately ${userInput.budgetAmount} ${userInput.currency}
Location: ${userInput.location.city} (Preference: ${userInput.location.setting})
Preferred Activities: ${userInput.activities?.join(', ') || 'Not specified'}
Specific Food Wishes: ${userInput.foodPreferences}
Specific Drink Wishes: ${userInput.drinkPreferences}
Other Notes: ${userInput.additionalPreferences || 'None'}

Remember to follow ALL instructions in the system prompt regarding JSON structure, content details, plan distinction, personalization, and output format. Provide ONLY the valid JSON object.`;

			// Call OpenAI Chat Completion API
			console.log("Calling OpenAI for generatePlans...");
			const completion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo', // Consider gpt-4o or gpt-4-turbo for better structure adherence
				messages: [
					{ role: 'system', content: systemPrompt_GeneratePlans },
					{ role: 'user', content: userPrompt_GeneratePlans }
				],
				temperature: 0.7,
				// response_format: { type: "json_object" }, // Enable ONLY if using compatible models (e.g., gpt-4-turbo, gpt-4o, gpt-3.5-turbo-1106+)
			});

			const content = completion.choices[0]?.message?.content;
			if (!content) throw new Error('No content returned from OpenAI (generatePlans)');

			// Use HELPER FUNCTION TO PARSE the potentially imperfect JSON
			responseData = extractAndParseJson(content);

			// **Validate the parsed response structure**
			if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3) {
				console.error("Parsed data is invalid or 'plans' array missing/incorrect length (generatePlans). Raw content:", content);
				throw new Error("AI response format error: Expected { plans: [plan1, plan2, plan3] }.");
			}
			// Optional: Add deeper validation for each plan object structure if needed

			console.log("Successfully generated and parsed plans.");

		// --- Action: Generate Invitation ---
		} else if (action === 'generateInvitation') {
			const { plan, template, date, time } = data;
			// Validate required data
			if (!plan || typeof plan !== 'object' || !template || !date || !time) {
				throw new Error("Missing required data (plan, template, date, time) for generateInvitation action.");
			}
			// **Use NEW birthdayPersonName field**
			const birthdayPersonName = plan.hostName || "the birthday person"; // Use name from plan if available, else fallback

			// Generate invitation text
			console.log("Calling OpenAI for invitation text...");
			const textCompletion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{ role: 'system', content: `You create engaging birthday invitation text. Respond ONLY with the text, no extra comments.` },
					{ role: 'user', content: `Create invitation text for ${birthdayPersonName}'s birthday party. Theme: "${plan.name}" (${plan.description}). Venue: ${plan.venue?.name || 'the specified venue'}. Date: ${date}. Time: ${time}. Style: ${template}. Include key details concisely.` }
				],
				temperature: 0.7,
			});
			const text = textCompletion.choices[0]?.message?.content?.trim() || `You're invited to celebrate ${birthdayPersonName}'s birthday!`;

			// Generate invitation image
			console.log("Calling OpenAI (DALL-E) for invitation image...");
			const imageResponse = await openai.images.generate({
				model: 'dall-e-3', // Keep DALL-E 3 for quality
				prompt: `Generate a visually appealing background image for a birthday invitation. Theme: "${plan.theme || plan.name}". Style: ${template}. The image should be suitable as a background. Do NOT include any words or text characters in the image.`,
				n: 1,
				size: '1024x1024',
				quality: 'standard',
			});
			const imageUrl = imageResponse.data?.[0]?.url || ''; // Safer access

			responseData = { text, imageUrl, template };
			console.log("Successfully generated invitation components.");

		// --- Action: Optimize Budget ---
		} else if (action === 'optimizeBudget') {
			const { plan, priorities, numericBudget, currency } = data; // **Expect numericBudget and currency**
			// Validate required data
			if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) {
				throw new Error("Missing required data (plan, priorities, numericBudget, currency) for optimizeBudget action.");
			}

			// **Construct the DETAILED prompt using NEW inputs**
			const systemPrompt_OptimizeBudget = `You are a budget optimization expert for event planning.
**CRITICAL INSTRUCTIONS:**
1.  **Output Format:** Respond ONLY with a single, valid JSON object. Do NOT include any text before or after the JSON object. Do NOT use markdown fences (\`\`\`json).
2.  **JSON Structure:** The JSON object MUST contain a single top-level key named "optimizedPlan". The value MUST be a complete birthday plan object, maintaining the exact same structure as the input plan provided by the user.
3.  **Optimization Logic:** Analyze the input plan against the target budget (\`${numericBudget} ${currency}\`) and user priorities (scale 1-5, 5=high).
    * For high-priority items (4-5), suggest specific enhancements or higher-quality options if the budget allows, or maintain current quality.
    * For low-priority items (1-2), suggest concrete, practical cost-saving alternatives (e.g., 'replace [expensive item] with [cheaper DIY option]', 'reduce quantity of X') or removals.
    * Adjust descriptions, \`costRange\`/\`estimatedCost\` fields (keeping them descriptive strings reflecting the currency), and potentially schedule/menu items to reflect the optimizations. Aim to get closer to the target budget.
4.  **Structure Adherence:** Ensure the output "optimizedPlan" object strictly follows the structure of the input plan object (all keys/nested keys must be present with correct value types - strings, arrays, objects).`;

			const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON based on the target budget and priorities. Return ONLY the valid JSON object containing the "optimizedPlan".

Input Plan:
\`\`\`json
${JSON.stringify(plan)}
\`\`\`

Target Budget: ${numericBudget} ${currency}

Priorities (1=Low, 5=High):
Venue: ${priorities.venue}
Food & Beverages: ${priorities.food}
Activities & Entertainment: ${priorities.activities}
Decorations: ${priorities.decorations}
Party Favors: ${priorities.partyFavors}`;

			// Call OpenAI Chat Completion API
			console.log("Calling OpenAI for optimizeBudget...");
			const completion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo', // Or gpt-4o / gpt-4-turbo
				messages: [
					{ role: 'system', content: systemPrompt_OptimizeBudget },
					{ role: 'user', content: userPrompt_OptimizeBudget }
				],
				temperature: 0.6, // Lower temp for better structure adherence
				// response_format: { type: "json_object" }, // Enable ONLY if using compatible models
			});

			const content = completion.choices[0]?.message?.content;
			if (!content) throw new Error('No content returned from OpenAI (optimizeBudget)');

			// **USE HELPER FUNCTION TO PARSE**
			responseData = extractAndParseJson(content);

			// **Validate the parsed response structure**
			if (!responseData || typeof responseData.optimizedPlan !== 'object' || responseData.optimizedPlan === null) {
				console.error("Parsed data is invalid or 'optimizedPlan' object missing (optimizeBudget). Raw content:", content);
				throw new Error("AI response format error: Expected { optimizedPlan: { ...plan details... } }.");
			}
			// Optional: Add deeper validation for the optimizedPlan object structure if needed

			console.log("Successfully generated and parsed optimized plan.");

		// --- Action Not Recognized ---
		} else {
			console.error('Invalid action received:', action);
			throw new Error(`Invalid action specified: ${action}`);
		}

		// --- Return Successful Response ---
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify(responseData), // Send back the parsed and structured data
		};

	// --- Global Error Handling ---
	} catch (error) {
		console.error('Error processing request in Netlify function:', error);
		const status = error.statusCode || error.status || (error.response && error.response.status) || 500;
		const message = error.message || 'An internal server error occurred.';

		// Log specific OpenAI errors if available
		if (error instanceof OpenAI.APIError) {
			console.error('OpenAI API Error Details:', { status: error.status, message: error.message, code: error.code, type: error.type });
		}

		return {
			statusCode: status,
			headers,
			body: JSON.stringify({ error: message }), // Return error message in JSON format
		};
	}
};

