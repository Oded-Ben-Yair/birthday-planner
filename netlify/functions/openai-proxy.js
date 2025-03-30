// netlify/functions/openai-proxy.js
import OpenAI from 'openai';

// Initialize OpenAI client securely using the environment variable
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Attempts to extract and parse a JSON object or array from a string.
 * Includes logic to remove common issues like trailing commas before parsing.
 * @param {string | null | undefined} jsonString The raw string potentially containing JSON.
 * @returns {object | array | null} The parsed JSON object/array, or null if parsing fails.
 */
const extractAndParseJson = (jsonString) => {
	if (!jsonString || typeof jsonString !== 'string') {
		console.error('extractAndParseJson: Input is not a valid string.', jsonString);
		return null;
	}
	const cleanJsonString = (str) => {
        try {
            // Remove trailing commas before closing braces/brackets
            // Also remove potential comments // /* */ (more aggressive, use carefully)
            // let cleaned = str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove comments
            let cleaned = str.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
            return cleaned;
        } catch (e) {
             console.warn("Regex cleaning failed, using original string.", e);
             return str;
        }
	};
	const tryParse = (str) => {
		const cleanedStr = cleanJsonString(str);
		return JSON.parse(cleanedStr);
	};
	try {
		return tryParse(jsonString);
	} catch (directParseError) {
		console.warn(`Direct JSON parsing failed (even after cleaning): ${directParseError.message}. Attempting extraction...`);
		const firstBracket = jsonString.indexOf('{');
		const firstSquare = jsonString.indexOf('[');
		let startIndex = -1;
		if (firstBracket === -1 && firstSquare === -1) {
			console.error('extractAndParseJson: No JSON object or array structure found.');
			console.error('Original string:', jsonString);
			return null;
		}
		startIndex = (firstBracket === -1) ? firstSquare : (firstSquare === -1 ? firstBracket : Math.min(firstBracket, firstSquare));
		const isObject = jsonString[startIndex] === '{';
		const lastBracket = isObject ? jsonString.lastIndexOf('}') : jsonString.lastIndexOf(']');
		if (lastBracket === -1 || lastBracket < startIndex) {
			console.error('extractAndParseJson: Could not find matching closing bracket.');
			console.error('Original string:', jsonString);
			return null;
		}
		const potentialJson = jsonString.substring(startIndex, lastBracket + 1);
		try {
			const parsedJson = tryParse(potentialJson);
			console.log('Successfully parsed extracted & cleaned JSON.');
			return parsedJson;
		} catch (extractionParseError) {
			console.error(`extractAndParseJson: Failed to parse extracted & cleaned JSON substring: ${extractionParseError.message}`);
			console.error('Original string that failed parsing:', jsonString);
			return null;
		}
	}
};


// Define the handler function for Netlify
export const handler = async (event) => {
	// CORS Headers
	const allowedOrigin = process.env.NODE_ENV === 'development' ? '*' : process.env.URL;
	const headers = {
		'Access-Control-Allow-Origin': allowedOrigin || '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
	};

	// Handle CORS Preflight
	if (event.httpMethod === 'OPTIONS') {
		return { statusCode: 204, headers, body: '' };
	}

	// Handle incorrect method
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
	}

	try {
		// --- Request Body Parsing and Validation ---
		if (!event.body) throw new Error("Request body is missing.");
		let payload;
		try {
			payload = JSON.parse(event.body);
		} catch (parseError) {
			console.error("Failed to parse request body:", event.body, parseError);
			throw new Error("Invalid request format: Body must be valid JSON.");
		}
		const { action, ...data } = payload;
		if (!action) throw new Error("Missing 'action' field in request payload.");

		console.log(`Received action: ${action}`);
		let responseData = null;

        // ==================================================================
		// --- Action: Generate Birthday Plans (Using Native Web Search) ---
        // ==================================================================
		if (action === 'generatePlans') {
			const { userInput } = data;
			// Validate userInput fields (including country)
			if (!userInput || typeof userInput !== 'object' || !userInput.birthdayPersonName || !userInput.age || !userInput.theme || userInput.guestCountAdults === undefined || userInput.guestCountChildren === undefined || !userInput.budgetAmount || !userInput.currency || !userInput.location?.city || !userInput.location?.country || !userInput.location?.setting || !userInput.foodPreferences || !userInput.drinkPreferences) {
				console.error("Missing required fields in userInput for generatePlans:", userInput);
				throw new Error("Missing required user input data for generating plans. Please fill all fields including Country.");
			}

            // --- Define Enhanced Prompts for Plan Generation ---
            // Incorporates principles from user examples (Persona, Principles, Task, JSON, Content, Distinction, Personalization)
			const systemPrompt_GeneratePlans = `You are BirthdayPlannerAI, an expert, creative, and resourceful event planner specializing in personalized birthday celebrations.
**Core Principles:**
* **Age-Appropriateness:** All suggestions MUST be suitable for the birthday person's age (${userInput.age}) and guest mix (${userInput.guestCountAdults} adults, ${userInput.guestCountChildren} children).
* **Budget Respect:** Strictly adhere to the approximate budget of ${userInput.budgetAmount} ${userInput.currency}. Provide realistic cost estimates (\`costRange\`, \`estimatedCost\`) reflecting this budget and currency. If suggesting something potentially over budget, clearly state it and offer lower-cost alternatives.
* **Specificity & Resourcefulness:** Provide concrete, actionable suggestions. When specific local information (vendors, venues, current prices, availability) in "${userInput.location.city}, ${userInput.location.country}" is needed for accuracy, leverage your web search capability. Clearly indicate when information is based on search results versus general knowledge/estimation.
* **Safety & Inclusivity:** Ensure all suggestions are safe and inclusive. Consider accessibility if mentioned in preferences.
* **Honesty:** Be transparent. If exact pricing isn't available via search, provide realistic estimates and state they are estimates.

**Task:** Generate 3 distinct, detailed birthday plans based on the user's input.
**CRITICAL OUTPUT INSTRUCTIONS:**
1.  **JSON ONLY:** Respond ONLY with a single, valid JSON object: \`{ "plans": [...] }\`. NO extra text, NO markdown.
2.  **JSON Structure:** The "plans" value MUST be an array of exactly 3 plan objects.
3.  **Plan Object Structure:** Each plan object MUST contain keys: \`id\`(string: "plan-1", "plan-2", "plan-3"), \`name\`(string), \`description\`(string), \`profile\`(string: "DIY/Budget", "Premium/Convenience", or "Unique/Adventure"), \`venue\`(object), \`schedule\`(array of objects), \`catering\`(object), \`guestEngagement\`(object).
4.  **NESTED STRUCTURE DETAILS:**
    * \`venue\`: requires \`name\`, \`description\`, \`costRange\`(string estimate, e.g., "1000-1500 ${userInput.currency}"), \`amenities\`[string[]], \`suitability\`, \`venueSearchSuggestions\`[string[]](2-3 examples). Use web search results for real venue names/types if possible.
    * \`schedule\`: array requires objects with \`time\`, \`activity\`, \`description\`(optional).
    * \`catering\`: requires \`estimatedCost\`(string estimate), \`servingStyle\`, \`menu\`(object: \`appetizers\`[string[]], \`mainCourses\`[string[]], \`desserts\`(string), \`beverages\`[string[]]), \`cateringSearchSuggestions\`[string[]](2-3 examples). Incorporate user's food/drink preferences. Use web search results for real catering company names/types if possible.
    * \`guestEngagement\`: requires \`icebreakers\`[string[]], \`interactiveElements\`[string[]], \`photoOpportunities\`[string[]], \`partyFavors\`[string[]], \`techIntegration\`[string[]](optional), \`entertainmentSearchSuggestions\`[string[]](2-3 examples). Use web search for local entertainer types if needed.
5.  **JSON VALIDITY:** ALL keys and string values MUST use double quotes. NO trailing commas.
6.  **PLAN DISTINCTION:** Ensure Plan 1 fits "DIY/Budget", Plan 2 fits "Premium/Convenience", Plan 3 fits "Unique/Adventure".
7.  **PERSONALIZATION:** Deeply tailor plans to ALL inputs: ${userInput.birthdayPersonName}'s ${userInput.age}th birthday, ${userInput.theme} theme, guest mix, budget/currency, location (${userInput.location.city}, ${userInput.location.country}, ${userInput.location.setting}), activities (${userInput.activities?.join(', ')}), food (${userInput.foodPreferences}), drinks (${userInput.drinkPreferences}), other notes (${userInput.additionalPreferences}).`;

			const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans according to ALL instructions in the system prompt for ${userInput.birthdayPersonName} (${userInput.age}) in ${userInput.location.city}, ${userInput.location.country}. Use web search where necessary for specific local details. Output ONLY the valid JSON object.`;

            // --- Call OpenAI API with Native Web Search Tool ---
			console.log("Calling OpenAI (gpt-4o) for generatePlans with web search enabled...");
			const completion = await openai.chat.completions.create({
				model: 'gpt-4o', // ** CHANGED MODEL TO SUPPORT NATIVE SEARCH **
				messages: [
					{ role: 'system', content: systemPrompt_GeneratePlans },
					{ role: 'user', content: userPrompt_GeneratePlans }
				],
				// ** ADD NATIVE WEB SEARCH TOOL CONFIGURATION **
				tools: [{
					type: "web_search_preview",
					user_location: { // Provide location context to the tool
						type: "approximate",
						country: userInput.location.country, // Use country from input
						city: userInput.location.city,       // Use city from input
					}
				}],
				// tool_choice: "auto", // Default: Let model decide when to search
                // Optional: Force search: tool_choice: { type: "web_search_preview" },
                // Optional: Adjust search detail: search_context_size: "low", // "medium" (default), "high"
				temperature: 0.7,
			});

            // --- Process Final Response (Simpler: No manual tool handling loop) ---
            // The response message should now contain the final content after the model potentially used web search.
            // Citations will be in annotations if the model used search results.
			const finalMessage = completion.choices[0]?.message;
			const finalContent = finalMessage?.content;

			if (!finalContent) {
                console.error("OpenAI response missing final content:", completion);
                throw new Error('No final content returned from OpenAI (generatePlans)');
            }

            // We still need to parse the final content, as it should be JSON
			responseData = extractAndParseJson(finalContent);

			// ** Validate the parsed response structure **
			if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3) {
				console.error("Final parsed data is invalid or 'plans' array missing/incorrect length (generatePlans).");
				if (!responseData) console.error("Parsing returned null. Raw content:", finalContent);
				// Include citation info in error if available, might indicate search happened but formatting failed
                const citations = finalMessage?.annotations?.filter(a => a.type === 'url_citation');
                console.error("Citations (if any):", citations);
				throw new Error("AI response format error: Expected { plans: [plan1, plan2, plan3] }.");
			}

            // Optional: Log if search was used (check for citations in the original message)
            const wasSearchUsed = finalMessage?.annotations?.some(a => a.type === 'url_citation');
            console.log(`Successfully generated and parsed plans. Web search used: ${wasSearchUsed ? 'Yes' : 'No'}`);
            // You could potentially pass citation info back to the frontend if needed later
            // responseData.citations = finalMessage?.annotations?.filter(a => a.type === 'url_citation');

        // ==================================================================
		// --- Action: Generate Invitation (Simpler - No Search Needed) ---
        // ==================================================================
		} else if (action === 'generateInvitation') {
			const { plan, template, date, time } = data;
			if (!plan || typeof plan !== 'object' || !template || !date || !time) {
				throw new Error("Missing required data for generateInvitation action.");
			}
            // ** Get birthdayPersonName from plan if it exists (needs adding to plan type potentially) or fallback **
            // Let's assume it might be passed in userInput context if needed, or use plan name
			const birthdayPersonName = data.userInput?.birthdayPersonName || plan.name || "the birthday person";

			console.log("Calling OpenAI (gpt-3.5-turbo) for invitation text..."); // Can use cheaper model
			const textCompletion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{ role: 'system', content: `You create engaging birthday invitation text. Respond ONLY with the text, no extra comments.` },
					{ role: 'user', content: `Create invitation text for ${birthdayPersonName}'s birthday party. Theme: "${plan.name}" (${plan.description}). Venue: ${plan.venue?.name || 'the specified venue'}. Date: ${date}. Time: ${time}. Style: ${template}. Include key details concisely.` }
				],
				temperature: 0.7,
			});
			const text = textCompletion.choices[0]?.message?.content?.trim() || `You're invited to celebrate ${birthdayPersonName}'s birthday!`;

			console.log("Calling OpenAI (DALL-E) for invitation image...");
			const imageResponse = await openai.images.generate({
				model: 'dall-e-3',
				prompt: `Generate a visually appealing background image for a birthday invitation. Theme: "${plan.theme || plan.name}". Style: ${template}. Suitable as a background. Do NOT include any words or text characters.`,
				n: 1, size: '1024x1024', quality: 'standard',
			});
			const imageUrl = imageResponse.data?.[0]?.url || '';

			responseData = { text, imageUrl, template };
			console.log("Successfully generated invitation components.");

        // ==================================================================
		// --- Action: Optimize Budget (Simpler - No Search Needed) ---
        // ==================================================================
		} else if (action === 'optimizeBudget') {
			const { plan, priorities, numericBudget, currency } = data;
			if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) {
				throw new Error("Missing required data (plan, priorities, numericBudget, currency) for optimizeBudget action.");
			}

			// ** ADDED request for optimizationSummary field **
			const systemPrompt_OptimizeBudget = `You are a budget optimization expert for event planning.
**CRITICAL INSTRUCTIONS:**
1.  **Output Format:** Respond ONLY with a single, valid JSON object { "optimizedPlan": { ... } }. No extra text, no markdown.
2.  **JSON Structure:** The "optimizedPlan" value MUST be a complete birthday plan object, maintaining the exact same structure as the input plan (including all nested keys like venue, schedule, catering, guestEngagement).
3.  **Optimization Logic:** Analyze the input plan against the target budget (\`${numericBudget} ${currency}\`) and priorities (scale 1-5, 5=high). Suggest specific enhancements for high-priority items (if budget allows) and concrete cost-saving alternatives/reductions for low-priority items. Adjust descriptions and costs (\`costRange\`/\`estimatedCost\`) accordingly. Aim near the target budget.
4.  **Summary Field:** Include a brief summary of the key changes made within the 'optimizedPlan' object under a new key: \`optimizationSummary\` (string value, 1-3 sentences).
5.  **JSON Validity:** Ensure ALL keys/strings use double quotes. NO trailing commas.`;

			const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON based on the target budget and priorities. Return ONLY the valid JSON object containing the "optimizedPlan", including an "optimizationSummary" field within it.

Input Plan:
\`\`\`json
${JSON.stringify(plan)}
\`\`\`

Target Budget: ${numericBudget} ${currency}

Priorities (1=Low, 5=High):
Venue: ${priorities.venue}, Food & Beverages: ${priorities.food}, Activities & Entertainment: ${priorities.activities}, Decorations: ${priorities.decorations}, Party Favors: ${priorities.partyFavors}`;

			console.log("Calling OpenAI (gpt-3.5-turbo) for optimizeBudget..."); // Can use cheaper model
			const completion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo', // Cheaper model likely sufficient
				messages: [ { role: 'system', content: systemPrompt_OptimizeBudget }, { role: 'user', content: userPrompt_OptimizeBudget } ],
				temperature: 0.6,
			});

			const content = completion.choices[0]?.message?.content;
			if (!content) throw new Error('No content returned from OpenAI (optimizeBudget)');

			// **USE ENHANCED HELPER FUNCTION TO PARSE**
			responseData = extractAndParseJson(content);

			// **Validate the parsed response structure**
			if (!responseData || typeof responseData.optimizedPlan !== 'object' || responseData.optimizedPlan === null) {
				console.error("Parsed data is invalid or 'optimizedPlan' object missing (optimizeBudget).");
                if (!responseData) console.error("Parsing returned null. Raw content:", content);
				throw new Error("AI response format error: Expected { optimizedPlan: { ... } }.");
			}
            // Check for the summary (optional but good)
            if (typeof responseData.optimizedPlan.optimizationSummary !== 'string') {
                 console.warn("AI did not include 'optimizationSummary' string in the optimized plan.");
                 // Optionally add a default summary if needed by frontend
                 responseData.optimizedPlan.optimizationSummary = "Budget optimization applied based on priorities (summary not provided by AI).";
            }
			console.log("Successfully generated and parsed optimized plan.");

		// --- Action Not Recognized ---
		} else {
			console.error('Invalid action received:', action);
			throw new Error(`Invalid action specified: ${action}`);
		}

		// --- Return Successful Response ---
		return { statusCode: 200, headers, body: JSON.stringify(responseData) };

	// --- Global Error Handling ---
	} catch (error) {
		console.error('Error processing request in Netlify function:', error);
		const status = error.statusCode || error.status || (error.response && error.response.status) || 500;
		const message = error.message || 'An internal server error occurred.';
		if (error instanceof OpenAI.APIError) {
			console.error('OpenAI API Error Details:', { status: error.status, message: error.message, code: error.code, type: error.type });
		}
		return { statusCode: status, headers, body: JSON.stringify({ error: message }) };
	}
};

