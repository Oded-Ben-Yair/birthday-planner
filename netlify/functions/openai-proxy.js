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
        let responseAnnotations = null;

        // ==================================================================
        // --- Action: Generate Birthday Plans (Using Web Search Tool) ---
        // ==================================================================
        if (action === 'generatePlans') {
            const { userInput } = data;
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) {
                throw new Error("Missing required user input data, especially location city/country.");
            }

            // --- Define Prompt Instructing AI to Use its Web Search Tool ---
            const systemPrompt_GeneratePlans = `You are PartyPilot, an AI-powered birthday planning assistant. You have access to a **built-in web search tool**.

### CONSTITUTIONAL PRINCIPLES
(Keep the 10 principles: INCLUSIVITY, AGE-APPROPRIATENESS, BUDGET RESPECT, SAFETY FIRST, HONESTY, HELPFULNESS, PRIVACY, PROACTIVITY, SPECIFICITY, RESOURCEFULNESS)
* Apply these principles, especially ensuring age (${userInput.age}) and budget (${userInput.budgetAmount} ${userInput.currency}) appropriateness.

### CHAIN STRUCTURE
You operate through phases. You are currently in the **PLAN GENERATION** phase.

### REACT PROCESS (Internal Guidance)
1.  **THINK:** Analyze user input. Identify where **web search is needed** for specific, local, up-to-date information (venues, caterers, activities, costs) in **${userInput.location.city}, ${userInput.location.country}**.
2.  **ACT (using Web Search):** Generate 3 distinct plans ('DIY/Budget', 'Premium/Convenience', 'Unique/Adventure') using the user input AND **leveraging your web search tool** to find real options. Incorporate search findings directly into the plan details.
3.  **OBSERVE:** (Handled by response generation).

### USER INPUT SUMMARY:
* Planning for: ${userInput.birthdayPersonName} (turning ${userInput.age})
* Theme: "${userInput.theme}"
* Guests: ${userInput.guestCountAdults} adults, ${userInput.guestCountChildren} children
* Budget: ${userInput.budgetAmount} ${userInput.currency}
* Location: **${userInput.location.city}, ${userInput.location.country}** (${userInput.location.setting})
* Activities: ${userInput.activities.join(', ')}
* Food/Drink Prefs: ${userInput.foodPreferences} / ${userInput.drinkPreferences}
* Additional Notes: ${userInput.additionalPreferences || 'None'}

### TASK & INSTRUCTIONS:
1.  **Generate 3 Distinct Plans:** Create 'DIY/Budget', 'Premium/Convenience', 'Unique/Adventure' plans based on the **USER INPUT SUMMARY**.
2.  **USE WEB SEARCH TOOL (CRITICAL):** You **MUST use your web search tool** to find specific, real, current information for venues, caterers, activities, and typical costs in **"${userInput.location.city}, ${userInput.location.country}"** that fit the user's requirements (theme, budget, age, etc.). Incorporate these findings (real names, estimated costs based on search) into the plan details. Do NOT invent details if search can provide them. Clearly label cost estimates ("Estimate: ...").
3.  **Output Format:** Respond ONLY with a single, valid JSON object: \`{ "plans": [ plan1, plan2, plan3 ] }\`. NO extra text. Double quotes. No trailing commas.
4.  **Required JSON Structure (Per Plan):** Each plan object MUST follow this structure EXACTLY (fill details based on user input and **web search findings**):
    \`\`\`json
    {
      "id": "plan-1", // Assign plan-1, plan-2, plan-3
      "name": "Specific Plan Name Based on Theme/Venue",
      "description": "Concise description for age ${userInput.age} in ${userInput.location.city}, reflecting search findings.",
      "profile": "DIY/Budget", // Or "Premium/Convenience" or "Unique/Adventure"
      "venue": { // BASE THIS ON WEB SEARCH RESULTS
        "name": "Real Venue Name from Search",
        "description": "Venue Description (from search if available)",
        "costRange": "Estimate based on search: X-Y ${userInput.currency} or 'Free'",
        "amenities": ["Amenity 1 (from search)", "..."],
        "suitability": "Why this venue (found via search) is suitable.",
        "venueSearchSuggestions": ["search term for chosen venue", "alternative local venue search"]
      },
      "schedule": [ // Tailor activities to theme, age, venue (search can inform activities too)
        { "time": "Start - End", "activity": "Activity Name", "description": "Optional description." }
      ],
      "catering": { // BASE THIS ON WEB SEARCH RESULTS for local options/costs
        "estimatedCost": "Estimate based on search: Approx. Z ${userInput.currency}",
        "servingStyle": "Style suitable for venue/theme (informed by search)",
        "menu": { // Menu reflecting user prefs and local options (search can inform)
          "appetizers": ["Appetizer 1"],
          "mainCourses": ["Main 1"],
          "desserts": "Dessert description (themed)", // String
          "beverages": ["Beverage 1"]
        },
        "cateringSearchSuggestions": ["local caterer search based on findings", "alternative catering search ${userInput.location.city}"]
      },
      "guestEngagement": { // Tailor to theme, age, venue
        "icebreakers": ["Icebreaker idea 1"],
        "interactiveElements": ["Interactive element 1"],
        "photoOpportunities": ["Photo op idea 1"],
        "partyFavors": ["Party favor idea 1"],
        "techIntegration": [],
        "entertainmentSearchSuggestions": ["local entertainment search ${userInput.location.city}"]
      }
    }
    \`\`\`
5.  **Personalization & Adherence:** Ensure all plan elements reflect the **USER INPUT SUMMARY**. Use the **web search results** to provide specific, accurate, and relevant details for **${userInput.location.city}, ${userInput.location.country}**. Adhere strictly to budget constraints for each profile.`;

            const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans according to ALL instructions in the system prompt, using the provided user input and your web search tool for local details. Output ONLY the valid JSON object containing the "plans" array.`;

            console.log(`Calling OpenAI model '${'gpt-4o-search-preview'}' for generatePlans (Web Search Enabled)...`);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-search-preview',
                messages: [
                    { role: 'system', content: systemPrompt_GeneratePlans },
                    { role: 'user', content: userPrompt_GeneratePlans }
                ],
                // ** max_tokens ADDED to allow longer response **
                max_tokens: 4000, // Set a higher limit (max output is 4096 for gpt-4o)
                web_search_options: {}, // Enable web search
                // response_format removed in previous step
                // temperature removed in previous step
            });

            const message = completion.choices[0]?.message;
            const finalContent = message?.content;
            responseAnnotations = message?.annotations; // Store annotations if present

            if (!finalContent) throw new Error('No final content returned from OpenAI (generatePlans - Web Search)');

            // Attempt to parse, relying on prompt instructions and parser robustness
            responseData = extractAndParseJson(finalContent);

            // Validation
            if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3 || !responseData.plans.every(p => p && p.id && p.name && p.venue && typeof p.venue === 'object' && p.schedule && Array.isArray(p.schedule) && p.catering && typeof p.catering === 'object' && p.guestEngagement && typeof p.guestEngagement === 'object')) {
                console.error("Final parsed data failed validation (generatePlans - Web Search). Parsed:", responseData);
                console.error("Raw content received that failed validation:", finalContent); // Log raw content on validation failure
                throw new Error("AI response format error or missing required plan fields/objects after parsing.");
            }
            console.log("Successfully generated and parsed plans (using Web Search Tool).");
            if (responseAnnotations) {
                console.log("Response included annotations (citations):", responseAnnotations);
            }

        // ==================================================================
        // --- Other Actions (generateInvitation, optimizeBudget) ---
        // ==================================================================
        } else if (action === 'generateInvitation') {
            // ... (Keep existing generateInvitation logic) ...
             const { plan, template, date, time } = data;
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
            const { plan, priorities, numericBudget, currency } = data;
            if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) { throw new Error("Missing required data for optimizeBudget action."); }
            const systemPrompt_OptimizeBudget = `You are a budget optimization expert...`;
            const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON...`;
            const messagesForOptimize = [ { role: 'system', content: systemPrompt_OptimizeBudget }, { role: 'user', content: userPrompt_OptimizeBudget } ];
            console.log("Calling OpenAI (gpt-4o) for optimizeBudget...");
            const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages: messagesForOptimize, temperature: 0.4, response_format: { type: "json_object" }, max_tokens: 4000 }); // Added max_tokens here too for safety
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
        console.error(caughtError);
        const status = caughtError?.status || caughtError?.response?.status || 500;
        const message = caughtError instanceof Error ? caughtError.message : 'An internal server error occurred.';
        if (caughtError instanceof OpenAI.APIError) { console.error('OpenAI API Error Details:', { status: caughtError.status, message: caughtError.message, code: caughtError.code, type: caughtError.type }); }
        return { statusCode: status, headers, body: JSON.stringify({ error: message }) };
    }
};

