// netlify/functions/openai-proxy.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Enhanced JSON parser
 */
const extractAndParseJson = (jsonString) => {
    // ... (Keep the enhanced extractAndParseJson function) ...
    if (!jsonString || typeof jsonString !== 'string') { console.error('extractAndParseJson: Input invalid.'); return null; }
    let potentialJson = jsonString.trim();
    const cleanJsonString = (str) => { try { return str.replace(/,\s*([}\]])/g, '$1'); } catch (e) { console.warn("Regex cleaning failed..."); return str; }};
    const tryParse = (str) => { const cleanedStr = cleanJsonString(str); return JSON.parse(cleanedStr); };
    try { const parsed = tryParse(potentialJson); console.log("Parsing successful (Function Args)."); return parsed; }
    catch (parseError) { console.error(`Failed to parse JSON (Function Args): ${parseError.message}`); const snippet = potentialJson.length > 500 ? potentialJson.substring(0, 500) + '...' : potentialJson; console.error('String that failed parsing (snippet):', snippet); return null; }
};

// --- Define the desired BirthdayPlan structure as an OpenAI Tool Schema ---
// Keep this schema definition as it guides the AI, even if adherence isn't perfect
const savePlanToolSchema = {
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
                venue: {
                    type: "object", properties: { name: { type: "string" }, description: { type: "string" }, costRange: { type: "string" }, amenities: { type: "array", items: { type: "string" } }, suitability: { type: "string" }, venueSearchSuggestions: { type: "array", items: { type: "string" } } },
                    required: ["name", "description", "costRange", "amenities", "suitability"]
                },
                schedule: { type: "array", items: { type: "object", properties: { time: { type: "string" }, activity: { type: "string" }, description: { type: "string" } }, required: ["time", "activity"] } },
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
            required: ["id", "name", "description", "profile", "venue", "schedule", "catering", "guestEngagement"]
        }
    }
};

// --- NEW: Cleanup Function ---
/**
 * Cleans up the raw plan object received from AI function arguments
 * to ensure it conforms to the BirthdayPlan type structure.
 * @param rawPlan The potentially malformed object parsed from AI arguments.
 * @param expectedProfile The profile requested.
 * @param expectedId The ID expected for this profile.
 * @returns A cleaned BirthdayPlan object.
 */
const cleanupPlanObject = (rawPlan, expectedProfile, expectedId) => {
    if (typeof rawPlan !== 'object' || rawPlan === null) {
        console.warn("Cleanup: Received non-object plan, returning default structure.");
        rawPlan = {}; // Start with empty object if input is invalid
    }

    // --- Venue Cleanup ---
    const rawVenue = (typeof rawPlan.venue === 'object' && rawPlan.venue !== null) ? rawPlan.venue : {};
    const cleanedVenue = {
        name: typeof rawVenue.name === 'string' ? rawVenue.name : 'Venue Name Missing',
        description: typeof rawVenue.description === 'string' ? rawVenue.description : '',
        costRange: typeof rawVenue.costRange === 'string' ? rawVenue.costRange : (typeof rawVenue.cost === 'string' ? rawVenue.cost : 'Cost Unknown'), // Handle 'cost' as fallback
        amenities: Array.isArray(rawVenue.amenities) ? rawVenue.amenities.filter(i => typeof i === 'string') : (Array.isArray(rawVenue.features) ? rawVenue.features.filter(i => typeof i === 'string') : []), // Handle 'features' as fallback
        suitability: typeof rawVenue.suitability === 'string' ? rawVenue.suitability : '',
        venueSearchSuggestions: Array.isArray(rawVenue.venueSearchSuggestions) ? rawVenue.venueSearchSuggestions.filter(i => typeof i === 'string') : [],
    };

    // --- Schedule Cleanup ---
    const cleanedSchedule = (Array.isArray(rawPlan.schedule) ? rawPlan.schedule : [])
        .map(item => ({
            time: typeof item?.time === 'string' ? item.time : '',
            activity: typeof item?.activity === 'string' ? item.activity : 'Activity Missing',
            description: typeof item?.description === 'string' ? item.description : undefined, // Keep optional
        }))
        .filter(item => item.activity); // Remove items without an activity

    // --- Catering & Menu Cleanup ---
    const rawCatering = (typeof rawPlan.catering === 'object' && rawPlan.catering !== null) ? rawPlan.catering : {};
    const rawMenu = (typeof rawCatering.menu === 'object' && rawCatering.menu !== null) ? rawCatering.menu : {};
    const cleanedMenu = {
        // Handle simple arrays OR string fallbacks if AI provides single items
        appetizers: Array.isArray(rawMenu.appetizers) ? rawMenu.appetizers.filter(i => typeof i === 'string') : (typeof rawMenu.appetizers === 'string' ? [rawMenu.appetizers] : (typeof rawMenu.starter === 'string' ? [rawMenu.starter] : [])),
        mainCourses: Array.isArray(rawMenu.mainCourses) ? rawMenu.mainCourses.filter(i => typeof i === 'string') : (typeof rawMenu.mainCourses === 'string' ? [rawMenu.mainCourses] : (typeof rawMenu.mainCourse === 'string' ? [rawMenu.mainCourse] : [])),
        // Ensure desserts is a string
        desserts: typeof rawMenu.desserts === 'string' ? rawMenu.desserts : (typeof rawMenu.dessert === 'string' ? rawMenu.dessert : ''),
        beverages: Array.isArray(rawMenu.beverages) ? rawMenu.beverages.filter(i => typeof i === 'string') : (typeof rawMenu.beverages === 'string' ? [rawMenu.beverages] : []),
    };
     // Handle case where AI puts beverages outside menu
    if (Array.isArray(rawCatering.beverages) && cleanedMenu.beverages.length === 0) {
        cleanedMenu.beverages = rawCatering.beverages.filter(i => typeof i === 'string');
    }
    const cleanedCatering = {
        estimatedCost: typeof rawCatering.estimatedCost === 'string' ? rawCatering.estimatedCost : 'Cost Unknown',
        servingStyle: typeof rawCatering.servingStyle === 'string' ? rawCatering.servingStyle : (typeof rawCatering.service === 'string' ? rawCatering.service : ''), // Handle 'service' fallback
        menu: cleanedMenu,
        cateringSearchSuggestions: Array.isArray(rawCatering.cateringSearchSuggestions) ? rawCatering.cateringSearchSuggestions.filter(i => typeof i === 'string') : [],
    };

    // --- Guest Engagement Cleanup ---
    const rawEngagement = (typeof rawPlan.guestEngagement === 'object' && rawPlan.guestEngagement !== null) ? rawPlan.guestEngagement : {};
    const cleanedEngagement = {
        icebreakers: Array.isArray(rawEngagement.icebreakers) ? rawEngagement.icebreakers.filter(i => typeof i === 'string') : [],
        interactiveElements: Array.isArray(rawEngagement.interactiveElements) ? rawEngagement.interactiveElements.filter(i => typeof i === 'string') : (Array.isArray(rawEngagement.activities) ? rawEngagement.activities.filter(i => typeof i === 'string') : []), // Handle 'activities' fallback
        photoOpportunities: Array.isArray(rawEngagement.photoOpportunities) ? rawEngagement.photoOpportunities.filter(i => typeof i === 'string') : [],
        partyFavors: Array.isArray(rawEngagement.partyFavors) ? rawEngagement.partyFavors.filter(i => typeof i === 'string') : [],
        techIntegration: Array.isArray(rawEngagement.techIntegration) ? rawEngagement.techIntegration.filter(i => typeof i === 'string') : [],
        entertainmentSearchSuggestions: Array.isArray(rawEngagement.entertainmentSearchSuggestions) ? rawEngagement.entertainmentSearchSuggestions.filter(i => typeof i === 'string') : (Array.isArray(rawEngagement.entertainment) ? rawEngagement.entertainment.filter(i => typeof i === 'string') : []), // Handle 'entertainment' fallback
    };

    // --- Assemble Cleaned Plan ---
    const cleanedPlan = {
        id: typeof rawPlan.id === 'string' && rawPlan.id === expectedId ? rawPlan.id : expectedId, // Ensure correct ID
        name: typeof rawPlan.name === 'string' ? rawPlan.name : 'Unnamed Plan',
        description: typeof rawPlan.description === 'string' ? rawPlan.description : '',
        profile: typeof rawPlan.profile === 'string' && rawPlan.profile === expectedProfile ? rawPlan.profile : expectedProfile, // Ensure correct profile
        venue: cleanedVenue,
        schedule: cleanedSchedule,
        catering: cleanedCatering,
        guestEngagement: cleanedEngagement,
        optimizationSummary: typeof rawPlan.optimizationSummary === 'string' ? rawPlan.optimizationSummary : undefined,
        // Add 'date' field if it's part of your BirthdayPlan type and might come from AI
        date: typeof rawPlan.date === 'string' ? rawPlan.date : '',
    };

    // Log if cleanup made significant changes (optional)
    // if (JSON.stringify(rawPlan) !== JSON.stringify(cleanedPlan)) {
    //     console.warn(`Cleanup applied changes for profile ${expectedProfile}. Original:`, rawPlan, "Cleaned:", cleanedPlan);
    // }

    return cleanedPlan;
};


// Define the handler function for Netlify
export const handler = async (event) => {
    // ... (keep CORS and method checks) ...
     const allowedOrigin = process.env.NODE_ENV === 'development' ? '*' : process.env.URL;
    const headers = { /* ... CORS headers ... */ };
    headers['Access-Control-Allow-Origin'] = allowedOrigin || '*';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';

    if (event.httpMethod === 'OPTIONS') { return { statusCode: 204, headers, body: '' }; }
    if (event.httpMethod !== 'POST') { return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }; }


    try {
        if (!event.body) throw new Error("Request body is missing.");
        let payload;
        try { payload = JSON.parse(event.body); }
        catch (parseError) { throw new Error("Invalid request format: Body must be valid JSON."); }
        const { action, userInput, profile, ...otherData } = payload;
        if (!action) throw new Error("Missing 'action' field in request payload.");

        console.log(`Received action: ${action}` + (profile ? ` for profile: ${profile}` : ''));
        let responseData = null;

        // ==================================================================
        // --- Action: Generate Birthday Plans (Function Calling + Cleanup) ---
        // ==================================================================
        if (action === 'generatePlans') {
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) {
                throw new Error("Missing required user input data for generatePlans action.");
            }
            const requestedProfile = profile || 'Premium/Convenience';
            const planId = profile === 'DIY/Budget' ? 'plan-1' : (profile === 'Premium/Convenience' ? 'plan-2' : 'plan-3');

            // --- Define Prompt Instructing AI to Call the Function ---
            // Keep the detailed RCC prompt with Function Calling instructions
            const systemPrompt_GeneratePlans_FunctionCall = `You are PartyPilot... (Keep the full detailed RCC System Prompt from immersive proxy_function_calling, including schema adherence instructions)

### TASK & INSTRUCTIONS:
1.  **Generate ONE Detailed Plan:** Create **ONE** plan for the **"${requestedProfile}"** profile (ID "${planId}").
2.  **Use Knowledge:** Use knowledge for **"${userInput.location.city}, ${userInput.location.country}"**...
3.  **Call Function (CRITICAL):** Call 'save_birthday_plan' function.
4.  **Schema Adherence (VERY IMPORTANT):** Arguments MUST strictly follow the function's parameter schema... Ensure ALL required fields... Field names exactly match... Data types match... NO extra fields... Double-check nested objects...`;

            const userPrompt_GeneratePlans = `Generate ONE detailed birthday plan for the "${requestedProfile}" profile based on my input summary, adhering strictly to all instructions, and then call the 'save_birthday_plan' function with the plan details conforming exactly to the function schema.`;


            console.log(`Calling OpenAI model '${'gpt-4o'}' for generatePlans (Function Calling, Profile: ${requestedProfile})...`);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt_GeneratePlans_FunctionCall },
                    { role: 'user', content: userPrompt_GeneratePlans }
                ],
                tools: [savePlanToolSchema],
                tool_choice: { type: "function", function: { name: "save_birthday_plan" } },
                max_tokens: 3000, // Keep reasonably high for detailed plan
                temperature: 0.5,
            });

            const message = completion.choices[0]?.message;

            if (message?.tool_calls && message.tool_calls.length > 0 && message.tool_calls[0].function?.name === "save_birthday_plan") {
                const functionArgsString = message.tool_calls[0].function.arguments;
                console.log("AI called save_birthday_plan function with args:", functionArgsString);

                const rawPlanObject = extractAndParseJson(functionArgsString);

                if (!rawPlanObject) {
                    throw new Error("Failed to parse function arguments returned by AI.");
                }

                // --- LOOSENED VALIDATION + CLEANUP ---
                console.log("Attempting to clean up received plan object...");
                const cleanedPlan = cleanupPlanObject(rawPlanObject, requestedProfile, planId);

                // Basic check after cleanup
                if (!cleanedPlan || !cleanedPlan.id || !cleanedPlan.name) {
                     console.error("Cleanup failed to produce a basic valid plan. Cleaned:", cleanedPlan);
                     throw new Error("Failed to clean up AI response into usable plan structure.");
                }

                // Wrap the cleaned plan object
                responseData = { plans: [cleanedPlan] };
                console.log(`Successfully processed function call and cleaned plan for profile: ${requestedProfile}.`);

            } else {
                console.error("AI did not call the expected function 'save_birthday_plan'. Response message:", message);
                throw new Error("AI failed to call the required function to save the plan.");
            }

        // ==================================================================
        // --- Other Actions (generateInvitation, optimizeBudget) ---
        // ==================================================================
        } else if (action === 'generateInvitation') {
            // ... (Keep existing generateInvitation logic) ...
             const { plan, template, date, time } = otherData;
             if (!plan || typeof plan !== 'object' || !template || !date || !time) { throw new Error("Missing data for generateInvitation action."); }
             const birthdayPersonName = plan.name ? plan.name.split("'s")[0] : "the birthday person";
             const messagesForInviteText = [ { role: 'system', content: `You create engaging birthday invitation text. Respond ONLY with the text, no extra comments.` }, { role: 'user', content: `Create invitation text for ${birthdayPersonName}'s birthday party. Theme: "${plan.name}" (${plan.description}). Venue: ${plan.venue?.name || 'the specified venue'}. Date: ${date}. Time: ${time}. Style: ${template}. Include key details concisely.` } ];
             console.log("Calling OpenAI (gpt-3.5-turbo) for invitation text...");
             const textCompletion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: messagesForInviteText, temperature: 0.7 });
             const text = textCompletion.choices[0]?.message?.content?.trim() || `You're invited...`;
             console.log("Calling OpenAI (DALL-E) for invitation image...");
             const imagePrompt = `Illustration for a birthday invitation. Theme: ${plan.name}. Style: ${template}. For ${birthdayPersonName}'s birthday. Key elements: ${plan.description}. Vibrant and celebratory.`;
             const imageResponse = await openai.images.generate({ model: 'dall-e-3', prompt: imagePrompt, n: 1, size: '1024x1024', quality: 'standard' });
             const imageUrl = imageResponse.data?.[0]?.url || '';
             responseData = { text, imageUrl, template };
             console.log("Successfully generated invitation components.");

        } else if (action === 'optimizeBudget') {
            // ... (Keep existing optimizeBudget logic) ...
             const { plan, priorities, numericBudget, currency } = otherData;
             if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) { throw new Error("Missing required data for optimizeBudget action."); }
             const systemPrompt_OptimizeBudget = `You are a budget optimization expert...`;
             const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON...`;
             const messagesForOptimize = [ { role: 'system', content: systemPrompt_OptimizeBudget }, { role: 'user', content: userPrompt_OptimizeBudget } ];
             console.log("Calling OpenAI (gpt-4o) for optimizeBudget...");
             const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages: messagesForOptimize, temperature: 0.4, response_format: { type: "json_object" }, max_tokens: 4000 });
             const content = completion.choices[0]?.message?.content;
             if (!content) throw new Error('No content returned from OpenAI (optimizeBudget)');
             const parsedResponse = extractAndParseJson(content);
             // ... (Keep existing validation and response assignment) ...
              let finalOptimizedPlanData;
              if (parsedResponse && typeof parsedResponse.optimizedPlan === 'object' && parsedResponse.optimizedPlan !== null) { finalOptimizedPlanData = parsedResponse; }
              else if (parsedResponse && typeof parsedResponse === 'object' && parsedResponse !== null && ('id' in parsedResponse || 'name' in parsedResponse || 'venue' in parsedResponse)) { finalOptimizedPlanData = { optimizedPlan: { ...parsedResponse } }; }
              else { throw new Error("AI response format error: Expected { optimizedPlan: { ... } } or a recognizable plan object."); }
             if (!finalOptimizedPlanData.optimizedPlan || typeof finalOptimizedPlanData.optimizedPlan.optimizationSummary !== 'string') { if (!finalOptimizedPlanData.optimizedPlan) finalOptimizedPlanData.optimizedPlan = {}; finalOptimizedPlanData.optimizedPlan.optimizationSummary = "Optimization applied based on priorities and budget."; }
             responseData = finalOptimizedPlanData;
             console.log("Successfully processed optimized plan.");

        } else { throw new Error(`Invalid action specified: ${action}`); }

        // --- Return Successful Response ---
        return { statusCode: 200, headers, body: JSON.stringify(responseData) };

    // --- Global Error Handling ---
    } catch (caughtError) {
        console.error('--- ERROR Processing Request in Netlify Function ---');
        console.error(caughtError); // Log the full error caught
        const status = caughtError?.status || caughtError?.response?.status || 500;
        const message = caughtError instanceof Error ? caughtError.message : 'An internal server error occurred.';
        if (caughtError instanceof OpenAI.APIError) { console.error('OpenAI API Error Details:', { status: caughtError.status, message: caughtError.message, code: caughtError.code, type: caughtError.type }); }
        return { statusCode: status, headers, body: JSON.stringify({ error: `Function Error: ${message}` }) };
    }
};

