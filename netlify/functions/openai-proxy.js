// netlify/functions/openai-proxy.js
import OpenAI from 'openai';

// Ensure API key is configured in Netlify environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Enhanced JSON parser: Attempts to extract and parse JSON even if embedded in text or slightly malformed.
 * @param {string} jsonString - The raw string potentially containing JSON.
 * @returns {object|null} Parsed JSON object or null if parsing fails.
 */
const extractAndParseJson = (jsonString) => {
    // ...(keep the existing robust extractAndParseJson function)...
    if (!jsonString || typeof jsonString !== 'string') {
        console.error('extractAndParseJson: Input invalid (not a string or empty).');
        return null;
    }
    let potentialJson = jsonString.trim();
    const cleanJsonString = (str) => {
        try { return str.replace(/,\s*([}\]])/g, '$1'); }
        catch (e) { console.warn("Regex cleaning for trailing commas failed..."); return str; }
    };
    const tryParse = (str) => {
        const cleanedStr = cleanJsonString(str);
        return JSON.parse(cleanedStr);
    };
    try {
        const parsed = tryParse(potentialJson);
        console.log("Parsing successful (Function Args / Direct JSON).");
        return parsed;
    } catch (parseError) {
        const codeBlockMatch = potentialJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            console.log("Found JSON within Markdown code block, attempting parse...");
            try {
                const parsedFromBlock = tryParse(codeBlockMatch[1]);
                console.log("Parsing successful (from Code Block).");
                return parsedFromBlock;
            } catch (codeBlockParseError) {
                console.error(`Failed to parse JSON from code block: ${codeBlockParseError.message}`);
            }
        }
        console.error(`extractAndParseJson: Failed to parse JSON. Error: ${parseError.message}`);
        const snippet = potentialJson.length > 500 ? potentialJson.substring(0, 500) + '...' : potentialJson;
        console.error('String snippet that failed parsing:', snippet);
        return null;
    }
};

// --- Define the desired BirthdayPlan structure as an OpenAI Tool Schema ---
const savePlanToolSchema = {
    // ...(keep existing savePlanToolSchema)...
    type: "function",
    function: {
        name: "save_birthday_plan",
        description: "Saves a generated birthday plan.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "Unique ID for the plan (e.g., plan-1, plan-2, plan-3 based on profile)." },
                name: { type: "string", description: "Specific name for the birthday plan." },
                description: { type: "string", description: "Concise description of the plan." },
                profile: { type: "string", enum: ['DIY/Budget', 'Premium/Convenience', 'Unique/Adventure'], description: "The profile category of the plan." },
                date: { type: "string", description: "The date for the party (YYYY-MM-DD format preferred)." }, // Added date based on usage
                venue: {
                    type: "object", properties: { name: { type: "string" }, description: { type: "string" }, costRange: { type: "string" }, amenities: { type: "array", items: { type: "string" } }, suitability: { type: "string" }, venueSearchSuggestions: { type: "array", items: { type: "string" } } },
                    required: ["name", "description", "costRange", "amenities", "suitability"]
                },
                schedule: { type: "array", items: { type: "object", properties: { time: { type: "string" }, activity: { type: "string" }, details: { type: "string", description: "Optional details for the schedule item." } }, required: ["time", "activity"] } }, // Added details based on usage
                catering: {
                    type: "object", properties: { estimatedCost: { type: "string" }, servingStyle: { type: "string" }, menu: { type: "object", properties: { appetizers: { type: "array", items: { type: "string" } }, mainCourses: { type: "array", items: { type: "string" } }, desserts: { type: "string" }, beverages: { type: "array", items: { type: "string" } } }, required: ["appetizers", "mainCourses", "desserts", "beverages"] }, cateringSearchSuggestions: { type: "array", items: { type: "string" } } },
                    required: ["estimatedCost", "servingStyle", "menu"]
                },
                guestEngagement: {
                    type: "object", properties: { icebreakers: { type: "array", items: { type: "string" } }, interactiveElements: { type: "array", items: { type: "string" } }, photoOpportunities: { type: "array", items: { type: "string" } }, partyFavors: { type: "array", items: { type: "string" } }, techIntegration: { type: "array", items: { type: "string" } }, entertainmentSearchSuggestions: { type: "array", items: { type: "string" } } },
                    required: ["icebreakers", "interactiveElements", "photoOpportunities", "partyFavors"]
                },
                optimizationSummary: { type: "string", description: "Optional summary if optimization was done." }
            },
            required: ["id", "name", "description", "profile", "venue", "schedule", "catering", "guestEngagement", "date"]
        }
    }
};

/**
 * Cleans up the raw plan object received from AI function arguments
 */
const cleanupPlanObject = (rawPlan, expectedProfile, expectedId) => {
    // ...(keep the existing cleanupPlanObject function)...
    if (typeof rawPlan !== 'object' || rawPlan === null) {
        console.warn("Cleanup: Received non-object plan, returning default structure.");
        rawPlan = {}; // Start with empty object if input is invalid
    }
    const rawVenue = (typeof rawPlan.venue === 'object' && rawPlan.venue !== null) ? rawPlan.venue : {};
    const cleanedVenue = {
        name: typeof rawVenue.name === 'string' ? rawVenue.name : 'Venue Name Missing',
        description: typeof rawVenue.description === 'string' ? rawVenue.description : '',
        costRange: typeof rawVenue.costRange === 'string' ? rawVenue.costRange : (typeof rawVenue.cost === 'string' ? rawVenue.cost : 'Cost Unknown'),
        amenities: Array.isArray(rawVenue.amenities) ? rawVenue.amenities.filter(i => typeof i === 'string') : (Array.isArray(rawVenue.features) ? rawVenue.features.filter(i => typeof i === 'string') : []),
        suitability: typeof rawVenue.suitability === 'string' ? rawVenue.suitability : '',
        venueSearchSuggestions: Array.isArray(rawVenue.venueSearchSuggestions) ? rawVenue.venueSearchSuggestions.filter(i => typeof i === 'string') : [],
    };
    const cleanedSchedule = (Array.isArray(rawPlan.schedule) ? rawPlan.schedule : [])
        .map(item => ({
            time: typeof item?.time === 'string' ? item.time : '',
            activity: typeof item?.activity === 'string' ? item.activity : 'Activity Missing',
            details: typeof item?.details === 'string' ? item.details : undefined,
        }))
        .filter(item => item.activity && item.activity !== 'Activity Missing');
    const rawCatering = (typeof rawPlan.catering === 'object' && rawPlan.catering !== null) ? rawPlan.catering : {};
    const rawMenu = (typeof rawCatering.menu === 'object' && rawCatering.menu !== null) ? rawCatering.menu : {};
    const cleanedMenu = {
        appetizers: Array.isArray(rawMenu.appetizers) ? rawMenu.appetizers.filter(i => typeof i === 'string') : (typeof rawMenu.appetizers === 'string' ? [rawMenu.appetizers] : (typeof rawMenu.starter === 'string' ? [rawMenu.starter] : [])),
        mainCourses: Array.isArray(rawMenu.mainCourses) ? rawMenu.mainCourses.filter(i => typeof i === 'string') : (typeof rawMenu.mainCourses === 'string' ? [rawMenu.mainCourses] : (typeof rawMenu.mainCourse === 'string' ? [rawMenu.mainCourse] : [])),
        desserts: typeof rawMenu.desserts === 'string' ? rawMenu.desserts : (typeof rawMenu.dessert === 'string' ? rawMenu.dessert : ''),
        beverages: Array.isArray(rawMenu.beverages) ? rawMenu.beverages.filter(i => typeof i === 'string') : (typeof rawMenu.beverages === 'string' ? [rawMenu.beverages] : []),
    };
    if (Array.isArray(rawCatering.beverages) && cleanedMenu.beverages.length === 0) {
        cleanedMenu.beverages = rawCatering.beverages.filter(i => typeof i === 'string');
    }
    const cleanedCatering = {
        estimatedCost: typeof rawCatering.estimatedCost === 'string' ? rawCatering.estimatedCost : 'Cost Unknown',
        servingStyle: typeof rawCatering.servingStyle === 'string' ? rawCatering.servingStyle : (typeof rawCatering.service === 'string' ? rawCatering.service : ''),
        menu: cleanedMenu,
        cateringSearchSuggestions: Array.isArray(rawCatering.cateringSearchSuggestions) ? rawCatering.cateringSearchSuggestions.filter(i => typeof i === 'string') : [],
    };
    const rawEngagement = (typeof rawPlan.guestEngagement === 'object' && rawPlan.guestEngagement !== null) ? rawPlan.guestEngagement : {};
    const cleanedEngagement = {
        icebreakers: Array.isArray(rawEngagement.icebreakers) ? rawEngagement.icebreakers.filter(i => typeof i === 'string') : [],
        interactiveElements: Array.isArray(rawEngagement.interactiveElements) ? rawEngagement.interactiveElements.filter(i => typeof i === 'string') : (Array.isArray(rawEngagement.activities) ? rawEngagement.activities.filter(i => typeof i === 'string') : []),
        photoOpportunities: Array.isArray(rawEngagement.photoOpportunities) ? rawEngagement.photoOpportunities.filter(i => typeof i === 'string') : [],
        partyFavors: Array.isArray(rawEngagement.partyFavors) ? rawEngagement.partyFavors.filter(i => typeof i === 'string') : [],
        techIntegration: Array.isArray(rawEngagement.techIntegration) ? rawEngagement.techIntegration.filter(i => typeof i === 'string') : [],
        entertainmentSearchSuggestions: Array.isArray(rawEngagement.entertainmentSearchSuggestions) ? rawEngagement.entertainmentSearchSuggestions.filter(i => typeof i === 'string') : (Array.isArray(rawEngagement.entertainment) ? rawEngagement.entertainment.filter(i => typeof i === 'string') : []),
    };
    const cleanedPlan = {
        id: typeof rawPlan.id === 'string' && rawPlan.id === expectedId ? rawPlan.id : expectedId,
        name: typeof rawPlan.name === 'string' ? rawPlan.name : 'Unnamed Plan',
        description: typeof rawPlan.description === 'string' ? rawPlan.description : '',
        profile: typeof rawPlan.profile === 'string' && rawPlan.profile === expectedProfile ? rawPlan.profile : expectedProfile,
        date: typeof rawPlan.date === 'string' ? rawPlan.date : '',
        venue: cleanedVenue,
        schedule: cleanedSchedule,
        catering: cleanedCatering,
        guestEngagement: cleanedEngagement,
        optimizationSummary: typeof rawPlan.optimizationSummary === 'string' ? rawPlan.optimizationSummary : undefined,
    };
    return cleanedPlan;
};


// Define the main handler function for Netlify Functions
export const handler = async (event) => {
    // Set CORS headers
    const allowedOrigin = process.env.NODE_ENV === 'development' ? '*' : process.env.URL;
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigin || '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    // Handle incorrect method
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // --- Main Request Processing ---
    try {
        // Validate and parse body
        if (!event.body) throw new Error("Request body is missing.");
        let payload;
        try { payload = JSON.parse(event.body); }
        catch (parseError) { console.error("Failed to parse request body:", event.body); throw new Error("Invalid request format: Body must be valid JSON."); }

        const { action, userInput, profile, ...otherData } = payload;
        if (!action) throw new Error("Missing 'action' field in request payload.");

        console.log(`Received action: ${action}` + (profile ? ` for profile: ${profile}` : ''));
        let responseData = null;

        // ==================================================================
        // --- Action: Generate Birthday Plans ---
        // ==================================================================
        if (action === 'generatePlans') {
            // ...(keep existing generatePlans logic using function calling)...
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) { throw new Error("Missing required user input data (including location) for generatePlans action."); }
            const requestedProfile = profile || 'Premium/Convenience';
            const planId = profile === 'DIY/Budget' ? 'plan-1' : (profile === 'Premium/Convenience' ? 'plan-2' : 'plan-3');
            const systemPrompt_GeneratePlans_FunctionCall = `You are PartyPilot... (Ensure full prompt is used) ### TASK & INSTRUCTIONS: 1. Generate ONE Detailed Plan... 2. Use Knowledge... 3. Call Function (CRITICAL)... 4. Schema Adherence (VERY IMPORTANT)...`;
            const userPrompt_GeneratePlans = `My input summary: ${JSON.stringify(userInput)}. Generate ONE detailed birthday plan for the "${requestedProfile}" profile (ID: ${planId})... Then, call the 'save_birthday_plan' function...`;
            console.log(`Calling OpenAI model '${'gpt-4o'}' for generatePlans (Function Calling, Profile: ${requestedProfile})...`);
            const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages: [ { role: 'system', content: systemPrompt_GeneratePlans_FunctionCall }, { role: 'user', content: userPrompt_GeneratePlans } ], tools: [savePlanToolSchema], tool_choice: { type: "function", function: { name: "save_birthday_plan" } }, max_tokens: 3000, temperature: 0.5, });
            const message = completion.choices[0]?.message;
            if (message?.tool_calls && message.tool_calls.length > 0 && message.tool_calls[0].function?.name === "save_birthday_plan") {
                const functionArgsString = message.tool_calls[0].function.arguments;
                console.log("AI called save_birthday_plan function with args string:", functionArgsString);
                const rawPlanObject = extractAndParseJson(functionArgsString);
                if (!rawPlanObject) { throw new Error("Failed to parse function arguments JSON returned by AI."); }
                console.log("Attempting to clean up received plan object...");
                const cleanedPlan = cleanupPlanObject(rawPlanObject, requestedProfile, planId);
                if (!cleanedPlan || !cleanedPlan.id || !cleanedPlan.name) { console.error("Cleanup failed to produce a basic valid plan. Cleaned:", cleanedPlan); throw new Error("Failed to clean up AI response into usable plan structure."); }
                responseData = { plans: [cleanedPlan] };
                console.log(`Successfully processed function call and cleaned plan for profile: ${requestedProfile}.`);
            } else { console.error("AI did not call the expected function 'save_birthday_plan'. Response message:", message); throw new Error("AI failed to call the required function to save the plan."); }

        // ==================================================================
        // --- Action: Generate Invitation ---
        // ==================================================================
        } else if (action === 'generateInvitation') {
            // ...(keep existing generateInvitation logic)...
             const { plan, template, date, time } = otherData;
             if (!plan || typeof plan !== 'object' || !template || !date || !time) { throw new Error("Missing required data (plan, template, date, time) for generateInvitation action."); }
             const birthdayPersonName = plan.name ? plan.name.split("'s")[0] : "the birthday person";
             const messagesForInviteText = [ { role: 'system', content: `You create engaging birthday invitation text based on provided details. Respond ONLY with the invitation text, nothing else.` }, { role: 'user', content: `Create concise and appealing invitation text for ${birthdayPersonName}'s birthday party. Theme: "${plan.name}" (${plan.description}). Venue: ${plan.venue?.name || 'the specified venue'}. Date: ${date}. Time: ${time}. Style: ${template}. Include key details clearly.` } ];
             console.log("Calling OpenAI (gpt-3.5-turbo) for invitation text...");
             const textCompletion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: messagesForInviteText, temperature: 0.7 });
             const text = textCompletion.choices[0]?.message?.content?.trim() || `You're invited to celebrate ${birthdayPersonName}'s birthday! Join us for a ${plan.name} themed party on ${date} at ${time}. More details to follow.`;
             console.log("Calling OpenAI (DALL-E 3) for invitation image...");
             const imagePrompt = `Illustration for a birthday invitation card. Theme: ${plan.name}. Style: ${template}. For ${birthdayPersonName}'s birthday. Key visual elements: ${plan.description}. Make it vibrant, celebratory, and visually appealing. Avoid text unless absolutely necessary for the style.`;
             const imageResponse = await openai.images.generate({ model: 'dall-e-3', prompt: imagePrompt, n: 1, size: '1024x1024', quality: 'standard' });
             const imageUrl = imageResponse.data?.[0]?.url || '';
             responseData = { text, imageUrl, template };
             console.log("Successfully generated invitation components.");

        // ==================================================================
        // --- Action: Optimize Budget ---
        // ==================================================================
        } else if (action === 'optimizeBudget') {
            // Validate required input
            const { plan, priorities, numericBudget, currency } = otherData;
            if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) {
                throw new Error("Missing required data (plan, priorities, numericBudget, currency) for optimizeBudget action.");
            }

            // --- Define **UPDATED** Prompts for Budget Optimization ---
            const systemPrompt_OptimizeBudget = `You are a budget optimization expert specializing in event planning. Your task is to revise the provided birthday plan JSON to better align with the target budget, considering the user's priorities.

            **CRITICAL INSTRUCTIONS:**
            1.  **Analyze Plan & Budget:** Review the entire 'plan' JSON object and the 'targetBudget'.
            2.  **Consider Priorities:** Use the 'priorities' object (scale 1-5, 5=most important) to guide your adjustments. Reduce costs more significantly in lower-priority areas.
            3.  **Suggest Concrete Changes:** Modify the plan details (venue type/description, schedule activities, catering menu items/style, guest engagement elements) to reduce costs realistically while preserving the theme and higher-priority elements. Suggest specific alternatives (e.g., "Community hall instead of hotel ballroom", "Simpler appetizers", "DIY decorations").
            4.  **Update Costs (Estimate):** If possible, update 'estimatedCost' fields (e.g., in catering) to reflect suggested changes. If cost ranges are given, suggest options within the lower end. Acknowledge these are estimates.
            5.  **Add Optimization Summary:** Include a brief 'optimizationSummary' field (string) within the returned plan object, explaining the key changes made and why (e.g., "Reduced catering cost by simplifying appetizers (lower priority), suggested community hall venue.").
            6.  **RETURN JSON ONLY:** Your *entire* response MUST be a single, valid JSON object. Do NOT include ANY text, commentary, greetings, apologies, or markdown formatting before or after the JSON object.
            7.  **REQUIRED JSON STRUCTURE:** The JSON object MUST contain ONLY ONE top-level key: "optimizedPlan". The value of "optimizedPlan" must be the complete, revised birthday plan object, adhering to the original plan structure (including id, name, profile, venue, schedule, catering, guestEngagement, date, and the new optimizationSummary).
            8.  **FAILURE CASE:** If you absolutely cannot generate a valid optimized plan in the required JSON format, return ONLY the following JSON object: { "error": "Optimization failed." }`; // Added failure instruction

            const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON object:
            \`\`\`json
            ${JSON.stringify(plan, null, 2)}
            \`\`\`
            My budget priorities (1=least important, 5=most important) are:
            \`\`\`json
            ${JSON.stringify(priorities, null, 2)}
            \`\`\`
            My target budget is ${numericBudget} ${currency}.

            Please return ONLY the optimized plan as a single JSON object with the structure { "optimizedPlan": { /* complete revised plan object here, including optimizationSummary */ } }, adhering strictly to all instructions in the system prompt. Remember, NO text outside the JSON object. If optimization fails, return { "error": "Optimization failed." }.`; // Reinforced instructions


            console.log("Calling OpenAI (gpt-4o) for optimizeBudget...");
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt_OptimizeBudget }, // Use updated system prompt
                    { role: 'user', content: userPrompt_OptimizeBudget }     // Use updated user prompt
                ],
                temperature: 0.4,
                response_format: { type: "json_object" },
                max_tokens: 4000
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content returned from OpenAI (optimizeBudget)');
            }

            // Log the raw response string from AI
            console.log("Raw AI content string for optimizeBudget:", content);

            const parsedResponse = extractAndParseJson(content);

            // Log the object after parsing
            console.log("Parsed AI response object for optimizeBudget:", parsedResponse);

            // --- Validate Parsed Response ---
            let finalOptimizedPlanData;

            // **NEW:** Check for the specific error structure first
            if (parsedResponse && typeof parsedResponse.error === 'string') {
                 console.error("AI indicated optimization failed:", parsedResponse.error);
                 // Throw an error that reflects the AI's inability to optimize
                 throw new Error(`AI reported an issue: ${parsedResponse.error}`);
            }
            // Check 1: Does it have the expected { optimizedPlan: { ... } } structure?
            else if (parsedResponse && typeof parsedResponse.optimizedPlan === 'object' && parsedResponse.optimizedPlan !== null) {
                console.log("Parsed response contains 'optimizedPlan' key.");
                finalOptimizedPlanData = parsedResponse; // Use as is
            }
            // Check 2: If not, is the parsed response *itself* a plan-like object? (Fallback)
            else if (parsedResponse && typeof parsedResponse === 'object' && parsedResponse !== null && ('id' in parsedResponse || 'name' in parsedResponse || 'venue' in parsedResponse)) {
                console.warn("Parsed response did not contain 'optimizedPlan' key, but looks like a plan object itself. Wrapping it.");
                // Wrap the received object into the expected structure
                finalOptimizedPlanData = { optimizedPlan: { ...parsedResponse } };
            }
            // Check 3: If neither matches, the format is wrong.
            else {
                console.error("Parsed response is not in the expected format. Parsed:", parsedResponse);
                throw new Error("AI response format error: Expected { optimizedPlan: { ... } } or a recognizable plan object.");
            }

            // Ensure optimizationSummary exists (add default if missing)
            if (!finalOptimizedPlanData.optimizedPlan) {
                 finalOptimizedPlanData.optimizedPlan = {};
                 console.warn("Optimized plan object was missing after validation checks, creating empty object.");
            }
            if (typeof finalOptimizedPlanData.optimizedPlan.optimizationSummary !== 'string' || !finalOptimizedPlanData.optimizedPlan.optimizationSummary) {
                console.warn("Optimization summary was missing or not a string, adding default summary.");
                finalOptimizedPlanData.optimizedPlan.optimizationSummary = "Optimization applied based on priorities and budget.";
            }

            // Assign the validated/wrapped data to the response
            responseData = finalOptimizedPlanData;
            console.log("Successfully processed optimized plan.");

        // ==================================================================
        // --- Invalid Action ---
        // ==================================================================
        } else {
            throw new Error(`Invalid action specified: ${action}`);
        }

        // --- Return Successful Response ---
        return { statusCode: 200, headers, body: JSON.stringify(responseData) };

    // --- Global Error Handling ---
    } catch (caughtError) {
        // ...(keep existing detailed error logging)...
        console.error('--- ERROR Processing Request in Netlify Function ---');
        console.error("Timestamp:", new Date().toISOString());
        console.error("Error Message:", caughtError?.message);
        if (caughtError?.stack) { console.error("Stack Trace:", caughtError.stack); }
        if (caughtError instanceof OpenAI.APIError) { console.error('OpenAI API Error Details:', { status: caughtError.status, message: caughtError.message, code: caughtError.code, type: caughtError.type, }); }
        else { console.error("Caught Error Object:", caughtError); }
        const status = caughtError?.status || caughtError?.response?.status || 500;
        const message = caughtError instanceof Error ? caughtError.message : 'An internal server error occurred.';
        return { statusCode: status, headers, body: JSON.stringify({ error: `Function Error: ${message}` }) };
    }
};

