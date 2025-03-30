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
    		// Attempt parsing the potentially cleaned original string first
    		return tryParse(jsonString);
    	} catch (directParseError) {
    		console.warn(`Direct JSON parsing failed (even after cleaning): ${directParseError.message}. Attempting extraction...`);
    		// --- Extraction Logic (if direct parse fails) ---
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
    			console.error('Original string that failed parsing:', jsonString); // Log the problematic string
    			return null; // Return null if all attempts fail
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
    	if (event.httpMethod === 'OPTIONS') { return { statusCode: 204, headers, body: '' }; }
    	// Handle incorrect method
    	if (event.httpMethod !== 'POST') { return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }; }

    	try {
    		// --- Request Body Parsing and Validation ---
    		if (!event.body) throw new Error("Request body is missing.");
    		let payload;
    		try { payload = JSON.parse(event.body); }
            catch (parseError) { throw new Error("Invalid request format: Body must be valid JSON."); }
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
    			const systemPrompt_GeneratePlans = `You are BirthdayPlannerAI, an expert event planner... **Leverage your web browsing capabilities** ... Provide ONLY the valid JSON object: \`{ "plans": [...] }\` ...`; // Keep the detailed prompt
    			const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans ... for ${userInput.birthdayPersonName} ... in ${userInput.location.city}, ${userInput.location.country}. Use your web search capabilities ... Output ONLY the valid JSON object.`; // Keep the detailed prompt

    			// --- Call OpenAI API (gpt-4o, no explicit tools parameter) ---
    			console.log("Calling OpenAI (gpt-4o) for generatePlans (prompt-based search)...");
    			const completion = await openai.chat.completions.create({
    				model: 'gpt-4o', // Use model with browsing capabilities
    				messages: [
    					{ role: 'system', content: systemPrompt_GeneratePlans },
    					{ role: 'user', content: userPrompt_GeneratePlans }
    				],
    				temperature: 0.7,
    			});

    			// --- Process Final Response ---
    			const finalMessage = completion.choices[0]?.message;
    			const finalContent = finalMessage?.content;
    			if (!finalContent) throw new Error('No final content returned from OpenAI (generatePlans)');
    			responseData = extractAndParseJson(finalContent);
    			if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3) { /* ... validation ... */ throw new Error("AI response format error: Expected { plans: [plan1, plan2, plan3] }."); }
    			console.log("Successfully generated and parsed plans (using prompt-based search).");

            // ==================================================================
    		// --- Action: Generate Invitation ---
            // ==================================================================
    		} else if (action === 'generateInvitation') {
                const { plan, template, date, time } = data;
                if (!plan || typeof plan !== 'object' || !template || !date || !time) { throw new Error("Missing data for generateInvitation action."); }
                const birthdayPersonName = data.userInput?.birthdayPersonName || plan.name || "the birthday person";
                console.log("Calling OpenAI (gpt-3.5-turbo) for invitation text...");
                const textCompletion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: [/* System prompt */{ role: 'system', content: `You create engaging birthday invitation text. Respond ONLY with the text, no extra comments.` }, /* User prompt */ { role: 'user', content: `Create invitation text for ${birthdayPersonName}'s birthday party. Theme: "${plan.name}" (${plan.description}). Venue: ${plan.venue?.name || 'the specified venue'}. Date: ${date}. Time: ${time}. Style: ${template}. Include key details concisely.` }], temperature: 0.7 });
                const text = textCompletion.choices[0]?.message?.content?.trim() || `You're invited...`;
                console.log("Calling OpenAI (DALL-E) for invitation image...");
                const imageResponse = await openai.images.generate({ model: 'dall-e-3', prompt: `Generate a visually appealing background image for a birthday invitation. Theme: "${plan.theme || plan.name}". Style: ${template}. Suitable as a background. Do NOT include any words or text characters.`, n: 1, size: '1024x1024', quality: 'standard' });
                const imageUrl = imageResponse.data?.[0]?.url || '';
                responseData = { text, imageUrl, template };
                console.log("Successfully generated invitation components.");

            // ==================================================================
    		// --- Action: Optimize Budget (Fix: Add Model Parameter) ---
            // ==================================================================
    		} else if (action === 'optimizeBudget') {
    			const { plan, priorities, numericBudget, currency } = data;
    			if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) {
    				throw new Error("Missing required data for optimizeBudget action.");
    			}

    			const systemPrompt_OptimizeBudget = `You are a budget optimization expert... **Summary Field:** Include ... \`optimizationSummary\` (string). ...`; // Keep detailed prompt
    			const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON ... including an "optimizationSummary" field within it....`; // Keep detailed prompt

    			console.log("Calling OpenAI (gpt-3.5-turbo) for optimizeBudget...");
    			const completion = await openai.chat.completions.create({
    				// ** THE FIX: Add the missing model parameter **
                    model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo here (cost-effective)
    				messages: [ { role: 'system', content: systemPrompt_OptimizeBudget }, { role: 'user', content: userPrompt_OptimizeBudget } ],
    				temperature: 0.6,
    			});

    			const content = completion.choices[0]?.message?.content;
    			if (!content) throw new Error('No content returned from OpenAI (optimizeBudget)');
    			responseData = extractAndParseJson(content);
    			if (!responseData || typeof responseData.optimizedPlan !== 'object' || responseData.optimizedPlan === null) { /* ... validation ... */ throw new Error("AI response format error: Expected { optimizedPlan: { ... } }."); }
                if (typeof responseData.optimizedPlan.optimizationSummary !== 'string') { /* ... warning/default ... */ responseData.optimizedPlan.optimizationSummary = "Budget optimization applied (summary not provided).";}
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
    
