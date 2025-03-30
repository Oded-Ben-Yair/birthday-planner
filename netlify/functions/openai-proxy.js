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
    	        let cleaned = str.replace(/,\s*([}\]])/g, '$1');
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
    		// --- Action: Generate Birthday Plans (Prompt-Based Search) ---
    		// ==================================================================
    		if (action === 'generatePlans') {
    			const { userInput } = data;
    			// Validate userInput fields
    			if (!userInput || typeof userInput !== 'object' || !userInput.birthdayPersonName || !userInput.age || !userInput.theme || userInput.guestCountAdults === undefined || userInput.guestCountChildren === undefined || !userInput.budgetAmount || !userInput.currency || !userInput.location?.city || !userInput.location?.country || !userInput.location?.setting || !userInput.foodPreferences || !userInput.drinkPreferences) {
    				console.error("Missing required fields in userInput for generatePlans:", userInput);
    				throw new Error("Missing required user input data for generating plans. Please fill all fields including Country.");
    			}

    			// --- Define Enhanced Prompts for Plan Generation ---
    			const systemPrompt_GeneratePlans = `You are BirthdayPlannerAI, an expert, creative, and resourceful event planner specializing in personalized birthday celebrations.
**Core Principles:**
* **Age-Appropriateness:** All suggestions MUST be suitable for the birthday person's age (${userInput.age}) and guest mix (${userInput.guestCountAdults} adults, ${userInput.guestCountChildren} children).
* **Budget Respect:** Strictly adhere to the approximate budget of ${userInput.budgetAmount} ${userInput.currency}. Provide realistic cost estimates (\`costRange\`, \`estimatedCost\`) reflecting this budget and currency.
* **Specificity & Resourcefulness:** Provide concrete, actionable suggestions. **Leverage your web browsing capabilities** to find specific, current details about potential vendors, venues, prices, or activities in "${userInput.location.city}, ${userInput.location.country}" when necessary to provide accurate and helpful recommendations. Clearly indicate when information is based on recent search results versus general knowledge/estimation (e.g., "Based on recent search...", "Estimated cost...", "Example vendor type:...").
* **Safety & Inclusivity:** Ensure all suggestions are safe and inclusive.
* **Honesty:** Be transparent about estimates vs. confirmed details.

**Task:** Generate 3 distinct, detailed birthday plans based on the user's input.
**CRITICAL OUTPUT INSTRUCTIONS:**
1.  **JSON ONLY:** Respond ONLY with a single, valid JSON object: \`{ "plans": [...] }\`. NO extra text, NO markdown.
2.  **JSON Structure:** The "plans" value MUST be an array of exactly 3 plan objects.
3.  **Plan Object Structure:** Each plan object MUST contain keys: \`id\`(string: "plan-1", "plan-2", "plan-3"), \`name\`(string), \`description\`(string), \`profile\`(string: "DIY/Budget", "Premium/Convenience", or "Unique/Adventure"), \`venue\`(object), \`schedule\`(array of objects), \`catering\`(object), \`guestEngagement\`(object).
4.  **NESTED STRUCTURE DETAILS:** (Ensure all fields are present as defined before)
    * \`venue\`: requires \`name\`, \`description\`, \`costRange\`(string estimate), \`amenities\`[string[]], \`suitability\`, \`venueSearchSuggestions\`[string[]].
    * \`schedule\`: array requires objects with \`time\`, \`activity\`, \`description\`(optional).
    * \`catering\`: requires \`estimatedCost\`(string estimate), \`servingStyle\`, \`menu\`(object: \`appetizers\`[string[]], \`mainCourses\`[string[]], \`desserts\`(string), \`beverages\`[string[]]), \`cateringSearchSuggestions\`[string[]].
    * \`guestEngagement\`: requires \`icebreakers\`[string[]], \`interactiveElements\`[string[]], \`photoOpportunities\`[string[]], \`partyFavors\`[string[]], \`techIntegration\`[string[]](optional), \`entertainmentSearchSuggestions\`[string[]].
5.  **JSON VALIDITY:** ALL keys and string values MUST use double quotes. NO trailing commas.
6.  **PLAN DISTINCTION:** Ensure Plan 1 fits "DIY/Budget", Plan 2 fits "Premium/Convenience", Plan 3 fits "Unique/Adventure".
7.  **PERSONALIZATION:** Deeply tailor plans to ALL inputs: ${userInput.birthdayPersonName}'s ${userInput.age}th birthday, ${userInput.theme} theme, guest mix, budget/currency, location (${userInput.location.city}, ${userInput.location.country}, ${userInput.location.setting}), activities (${userInput.activities?.join(', ')}), food (${userInput.foodPreferences}), drinks (${userInput.drinkPreferences}), other notes (${userInput.additionalPreferences}).`;

    			const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans according to ALL instructions in the system prompt for ${userInput.birthdayPersonName} (${userInput.age}) in ${userInput.location.city}, ${userInput.location.country}. Use your web search capabilities where necessary for specific local details like venue names, vendor types, or realistic cost estimates. Output ONLY the valid JSON object.`;

    			// --- Call OpenAI API (gpt-4o, no explicit tools parameter) ---
    			console.log("Calling OpenAI (gpt-4o) for generatePlans (prompt-based search)...");
    			const completion = await openai.chat.completions.create({
    				model: 'gpt-4o', // Use model with browsing capabilities
    				messages: [
    					{ role: 'system', content: systemPrompt_GeneratePlans },
    					{ role: 'user', content: userPrompt_GeneratePlans }
    				],
    				// ** REMOVED 'tools' and 'tool_choice' parameters **
    				temperature: 0.7,
    			});

    			// --- Process Final Response ---
    			const finalMessage = completion.choices[0]?.message;
    			const finalContent = finalMessage?.content;

    			if (!finalContent) {
    				console.error("OpenAI response missing final content:", completion);
    				throw new Error('No final content returned from OpenAI (generatePlans)');
    			}

    			// Parse the final content (should be JSON)
    			responseData = extractAndParseJson(finalContent);

    			// ** Validate the parsed response structure **
    			if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3) {
    				console.error("Final parsed data is invalid or 'plans' array missing/incorrect length (generatePlans).");
    				if (!responseData) console.error("Parsing returned null. Raw content:", finalContent);
    				throw new Error("AI response format error: Expected { plans: [plan1, plan2, plan3] }.");
    			}
    			console.log("Successfully generated and parsed plans (using prompt-based search).");

            // ==================================================================
    		// --- Action: Generate Invitation (No change needed here) ---
            // ==================================================================
    		} else if (action === 'generateInvitation') {
                // ... (Keep existing generateInvitation logic) ...
                const { plan, template, date, time } = data;
                if (!plan || typeof plan !== 'object' || !template || !date || !time) {
                    throw new Error("Missing required data for generateInvitation action.");
                }
                const birthdayPersonName = data.userInput?.birthdayPersonName || plan.name || "the birthday person";
                console.log("Calling OpenAI (gpt-3.5-turbo) for invitation text...");
                const textCompletion = await openai.chat.completions.create({ /* ... */ });
                const text = textCompletion.choices[0]?.message?.content?.trim() || `You're invited...`;
                console.log("Calling OpenAI (DALL-E) for invitation image...");
                const imageResponse = await openai.images.generate({ /* ... */ });
                const imageUrl = imageResponse.data?.[0]?.url || '';
                responseData = { text, imageUrl, template };
                console.log("Successfully generated invitation components.");

            // ==================================================================
    		// --- Action: Optimize Budget (No change needed here) ---
            // ==================================================================
    		} else if (action === 'optimizeBudget') {
                // ... (Keep existing optimizeBudget logic, including summary request) ...
                const { plan, priorities, numericBudget, currency } = data;
                if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) {
                    throw new Error("Missing required data for optimizeBudget action.");
                }
                const systemPrompt_OptimizeBudget = `You are a budget optimization expert... **Summary Field:** Include ... \`optimizationSummary\` (string). ...`;
                const userPrompt_OptimizeBudget = `Optimize the following ... including an "optimizationSummary" field within it....`;
                console.log("Calling OpenAI (gpt-3.5-turbo) for optimizeBudget...");
                const completion = await openai.chat.completions.create({ /* ... */ });
                const content = completion.choices[0]?.message?.content;
                if (!content) throw new Error('No content returned from OpenAI (optimizeBudget)');
                responseData = extractAndParseJson(content);
                if (!responseData || typeof responseData.optimizedPlan !== 'object' || responseData.optimizedPlan === null) { /* ... error handling ... */ }
                if (typeof responseData.optimizedPlan.optimizationSummary !== 'string') { /* ... warning/default ... */ }
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
    
