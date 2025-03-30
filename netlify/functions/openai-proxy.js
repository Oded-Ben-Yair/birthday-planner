    // netlify/functions/openai-proxy.js
    import OpenAI from 'openai';

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    /**
     * Enhanced JSON parser: Removes markdown fences, trailing commas, and attempts parsing.
     */
    const extractAndParseJson = (jsonString) => {
        // ... (Keep the enhanced extractAndParseJson function - handles fences, commas) ...
        if (!jsonString || typeof jsonString !== 'string') { console.error('extractAndParseJson: Input invalid.'); return null; }
        let potentialJson = jsonString.trim();
        if (potentialJson.startsWith('```json')) { potentialJson = potentialJson.substring(7).trim(); if (potentialJson.endsWith('```')) { potentialJson = potentialJson.substring(0, potentialJson.length - 3).trim(); }}
        else if (potentialJson.startsWith('```')) { potentialJson = potentialJson.substring(3).trim(); if (potentialJson.endsWith('```')) { potentialJson = potentialJson.substring(0, potentialJson.length - 3).trim(); }}
        const cleanJsonString = (str) => { try { return str.replace(/,\s*([}\]])/g, '$1'); } catch (e) { console.warn("Regex cleaning failed..."); return str; }};
        const tryParse = (str) => { const cleanedStr = cleanJsonString(str); return JSON.parse(cleanedStr); };
        try { const parsed = tryParse(potentialJson); console.log("Parsing successful."); return parsed; }
        catch (parseError) { console.error(`Failed to parse JSON: ${parseError.message}`); const snippet = potentialJson.length > 500 ? potentialJson.substring(0, 500) + '...' : potentialJson; console.error('String that failed parsing (snippet):', snippet); return null; }
    };

    // Define the handler function for Netlify
    export const handler = async (event) => {
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
            const { action, ...data } = payload;
            if (!action) throw new Error("Missing 'action' field in request payload.");

            console.log(`Received action: ${action}`);
            let responseData = null;

            // ==================================================================
            // --- Action: Generate Birthday Plans (Add Example Structure) ---
            // ==================================================================
            if (action === 'generatePlans') {
                const { userInput } = data;
                if (!userInput || typeof userInput !== 'object' || /* ... validation ... */ !userInput.location?.country) { throw new Error("Missing required user input data."); }

                // --- Define REFINED Prompts for Plan Generation ---
                const systemPrompt_GeneratePlans = `You are BirthdayPlannerAI, an expert event planner.
**Core Principles:** Age-Appropriateness, Budget Respect (${userInput.budgetAmount} ${userInput.currency}), Specificity/Resourcefulness (using search), Safety, Honesty (about estimates).
**Task:** Generate 3 distinct plans (DIY/Budget, Premium/Convenience, Unique/Adventure).
**CRITICAL OUTPUT FORMAT:** Respond ONLY with a single, valid JSON object: \`{ "plans": [ plan1, plan2, plan3 ] }\`. NO extra text, NO markdown. ALL keys/strings MUST use double quotes. NO trailing commas.
**REQUIRED JSON STRUCTURE EXAMPLE (Follow this structure EXACTLY for EACH plan object):**
\`\`\`json
{
  "id": "plan-1",
  "name": "Example Plan Name",
  "description": "Example description.",
  "profile": "DIY/Budget", // Or "Premium/Convenience" or "Unique/Adventure"
  "venue": { "name": "Venue Name", "description": "Venue Desc", "costRange": "Estimate: X-Y ${userInput.currency}", "amenities": ["Amenity 1", "Amenity 2"], "suitability": "Suitability desc.", "venueSearchSuggestions": ["search 1", "search 2"] },
  "schedule": [ { "time": "Start - End", "activity": "Activity Name", "description": "Optional Desc" } ],
  "catering": { "estimatedCost": "Approx. Z ${userInput.currency}", "servingStyle": "Style", "menu": { "appetizers": ["App 1"], "mainCourses": ["Main 1"], "desserts": "Dessert Desc", "beverages": ["Bev 1"] }, "cateringSearchSuggestions": ["search 1", "search 2"] },
  "guestEngagement": { "icebreakers": ["Ice 1"], "interactiveElements": ["Elem 1"], "photoOpportunities": ["Photo 1"], "partyFavors": ["Favor 1"], "techIntegration": [], "entertainmentSearchSuggestions": ["search 1", "search 2"] }
}
\`\`\`
**WEB SEARCH:** Use browsing for specific local vendors/venues/activities/prices in "${userInput.location.city}, ${userInput.location.country}" for budget ${userInput.budgetAmount} ${userInput.currency}. Prefix search-based info with "[Web Search]: ". Label estimates clearly ("Estimate: ..."). Populate ALL search suggestion arrays.
**PERSONALIZATION:** Tailor ALL details to ALL user inputs.`;

                const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans according to ALL instructions and the EXACT JSON structure example provided in the system prompt for ${userInput.birthdayPersonName} (${userInput.age}) in ${userInput.location.city}, ${userInput.location.country}. Use web search for local details. Output ONLY the valid JSON object.`;

                console.log("Calling OpenAI (gpt-4o) for generatePlans (JSON Mode enabled)...");
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [ { role: 'system', content: systemPrompt_GeneratePlans }, { role: 'user', content: userPrompt_GeneratePlans } ],
                    temperature: 0.5, // Keep lower temperature
                    response_format: { type: "json_object" },
                });

                const finalContent = completion.choices[0]?.message?.content;
                if (!finalContent) throw new Error('No final content returned from OpenAI (generatePlans)');
                responseData = extractAndParseJson(finalContent);
                // More robust validation checking for nested objects existence
                if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3 || !responseData.plans.every(p => p && p.id && p.name && p.venue && typeof p.venue === 'object' && p.schedule && Array.isArray(p.schedule) && p.catering && typeof p.catering === 'object' && p.guestEngagement && typeof p.guestEngagement === 'object')) {
                    console.error("Final parsed data failed validation (generatePlans). Parsed:", responseData);
                    throw new Error("AI response format error or missing required plan fields/objects.");
                }
                console.log("Successfully generated and parsed plans (using JSON mode).");

            // ==================================================================
            // --- Action: Generate Invitation ---
            // ==================================================================
            } else if (action === 'generateInvitation') {
                // ... (Keep existing generateInvitation logic) ...
                const { plan, template, date, time } = data;
                if (!plan || typeof plan !== 'object' || !template || !date || !time) { throw new Error("Missing data for generateInvitation action."); }
                const birthdayPersonName = data.userInput?.birthdayPersonName || plan.name || "the birthday person";
                const messagesForInviteText = [ { role: 'system', content: `You create engaging birthday invitation text. Respond ONLY with the text, no extra comments.` }, { role: 'user', content: `Create invitation text for ${birthdayPersonName}'s birthday party. Theme: "${plan.name}" (${plan.description}). Venue: ${plan.venue?.name || 'the specified venue'}. Date: ${date}. Time: ${time}. Style: ${template}. Include key details concisely.` } ];
                console.log("Calling OpenAI (gpt-3.5-turbo) for invitation text...");
                const textCompletion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: messagesForInviteText, temperature: 0.7 });
                const text = textCompletion.choices[0]?.message?.content?.trim() || `You're invited...`;
                console.log("Calling OpenAI (DALL-E) for invitation image...");
                const imageResponse = await openai.images.generate({ model: 'dall-e-3', prompt: `...`, n: 1, size: '1024x1024', quality: 'standard' });
                const imageUrl = imageResponse.data?.[0]?.url || '';
                responseData = { text, imageUrl, template };
                console.log("Successfully generated invitation components.");

            // ==================================================================
            // --- Action: Optimize Budget (Add Logging Before Validation) ---
            // ==================================================================
            } else if (action === 'optimizeBudget') {
                const { plan, priorities, numericBudget, currency } = data;
                if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) { throw new Error("Missing required data for optimizeBudget action."); }

                const systemPrompt_OptimizeBudget = `You are a budget optimization expert... **Summary Field:** Include ... \`optimizationSummary\` (string). ... Return ONLY the valid JSON object { "optimizedPlan": { ... } }.`;
                const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON ... Return ONLY the valid JSON object containing the "optimizedPlan", including an "optimizationSummary" field within it....`;
                const messagesForOptimize = [ { role: 'system', content: systemPrompt_OptimizeBudget }, { role: 'user', content: userPrompt_OptimizeBudget } ];

                console.log("Calling OpenAI (gpt-3.5-turbo) for optimizeBudget with messages:", messagesForOptimize);
                const completion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: messagesForOptimize, temperature: 0.6 });
                const content = completion.choices[0]?.message?.content;
                if (!content) throw new Error('No content returned from OpenAI (optimizeBudget)');

                const parsedResponse = extractAndParseJson(content);

                // ** ADDED: Detailed logging before validation **
                console.log("--- Debugging OptimizeBudget Response ---");
                console.log("Parsed Response Type:", typeof parsedResponse);
                console.log("Parsed Response is Null:", parsedResponse === null);
                if (parsedResponse && typeof parsedResponse === 'object') {
                    console.log("Has 'optimizedPlan' key?", 'optimizedPlan' in parsedResponse);
                    if ('optimizedPlan' in parsedResponse) {
                        console.log("'optimizedPlan' type:", typeof parsedResponse.optimizedPlan);
                        console.log("'optimizedPlan' is null?", parsedResponse.optimizedPlan === null);
                    }
                    console.log("Has 'id' key?", 'id' in parsedResponse);
                    console.log("Has 'name' key?", 'name' in parsedResponse);
                    console.log("Has 'venue' key?", 'venue' in parsedResponse);
                    if ('venue' in parsedResponse) {
                         console.log("'venue' type:", typeof parsedResponse.venue);
                    }
                }
                console.log("--- End Debugging ---");

                // Keep flexible validation logic
                let finalOptimizedPlanData;
                if (parsedResponse && typeof parsedResponse.optimizedPlan === 'object' && parsedResponse.optimizedPlan !== null) {
                    console.log("Validation Case 1: Correct structure found.");
                    finalOptimizedPlanData = parsedResponse;
                } else if (parsedResponse && typeof parsedResponse === 'object' && parsedResponse !== null && ('id' in parsedResponse || 'name' in parsedResponse || 'venue' in parsedResponse)) {
                    console.log("Validation Case 2: Direct plan object found. Wrapping.");
                    finalOptimizedPlanData = { optimizedPlan: { ...parsedResponse } };
                } else {
                    console.error("Validation Case 3: Failed. Parsed data doesn't match expected structures.");
                    throw new Error("AI response format error: Expected { optimizedPlan: { ... } } or a recognizable plan object.");
                }

                // Ensure summary exists
                if (typeof finalOptimizedPlanData.optimizedPlan.optimizationSummary !== 'string') {
                    console.warn("AI did not include 'optimizationSummary' string. Adding default.");
                    finalOptimizedPlanData.optimizedPlan.optimizationSummary = "Optimization applied.";
                }
                responseData = finalOptimizedPlanData;
                console.log("Successfully processed optimized plan.");

            // --- Action Not Recognized ---
            } else { throw new Error(`Invalid action specified: ${action}`); }

            // --- Return Successful Response ---
            return { statusCode: 200, headers, body: JSON.stringify(responseData) };

        // --- Global Error Handling ---
        } catch (caughtError) {
            // ... (Keep simplified catch block) ...
            console.error('--- ERROR Processing Request in Netlify Function ---');
            console.error(caughtError);
            const status = caughtError?.status || caughtError?.response?.status || 500;
            const message = caughtError instanceof Error ? caughtError.message : 'An internal server error occurred.';
            if (caughtError instanceof OpenAI.APIError) { console.error('OpenAI API Error Details:', { status: caughtError.status, message: caughtError.message, code: caughtError.code, type: caughtError.type }); }
            return { statusCode: status, headers, body: JSON.stringify({ error: message }) };
        }
    };
    
