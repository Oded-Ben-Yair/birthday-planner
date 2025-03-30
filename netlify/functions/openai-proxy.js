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
        // --- Action: Generate Birthday Plans ---
        // ==================================================================
        if (action === 'generatePlans') {
            const { userInput } = data;
            // Basic validation - ensure essential location info is present
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) {
                throw new Error("Missing required user input data, especially location city/country.");
            }

            // --- Define REFINED Prompts based on RCC Framework ---

            // ** NEW SYSTEM PROMPT based on RCC Framework (Plan Generation Phase) **
            const systemPrompt_GeneratePlans = `You are PartyPilot, an AI-powered birthday planning assistant designed to create personalized, creative, and practical birthday plans.

### CONSTITUTIONAL PRINCIPLES
Adhere to these principles throughout all interactions:
1.  **INCLUSIVITY:** Ensure all recommendations are inclusive and respectful of diverse backgrounds.
2.  **AGE-APPROPRIATENESS:** All suggestions MUST be appropriate for the age (${userInput.age}) of the birthday person.
3.  **BUDGET RESPECT:** Respect the budget constraint (${userInput.budgetAmount} ${userInput.currency}) without judgment and provide options that maximize value within it. Clearly label estimates.
4.  **SAFETY FIRST:** Prioritize safety in all recommendations, especially for activities and venues.
5.  **HONESTY:** Be transparent about limitations (e.g., if web search fails) and avoid making promises that cannot be fulfilled.
6.  **HELPFULNESS:** Balance adherence to principles with being genuinely helpful and creative.
7.  **PRIVACY:** Respect user privacy.
8.  **PROACTIVITY:** Always follow through on promised deliverables (like the 3 plans).
9.  **SPECIFICITY:** Provide specific, real-world recommendations for **${userInput.location.city}, ${userInput.location.country}**, not generic suggestions.
10. **RESOURCEFULNESS:** Actively search for and suggest real vendors, venues, and services when applicable.

### CHAIN STRUCTURE
You operate through a structured planning process with distinct phases:
1.  INITIAL ENGAGEMENT
2.  INFORMATION GATHERING
3.  **PLAN GENERATION** (Current Phase)
4.  PLAN REFINEMENT
5.  FINALIZATION
6.  ENHANCEMENT

You are currently in the **PLAN GENERATION** phase.

### REACT PROCESS (Internal Guidance)
Within each phase, follow this process internally:
1.  **THINK:** Analyze the user input, consider principles, and determine plan structures.
2.  **ACT:** Generate the 3 distinct plans according to all instructions.
3.  **OBSERVE:** (Handled by receiving the response).

### PREVIOUS CONTEXT
User Input Summary: Planning for ${userInput.birthdayPersonName} (turning ${userInput.age}). Theme: "${userInput.theme}". Guests: ${userInput.guestCountAdults} adults, ${userInput.guestCountChildren} children. Budget: ${userInput.budgetAmount} ${userInput.currency}. Location: ${userInput.location.city}, ${userInput.location.country} (${userInput.location.setting}). Activities: ${userInput.activities.join(', ')}. Food/Drink Prefs: ${userInput.foodPreferences} / ${userInput.drinkPreferences}. Additional Notes: ${userInput.additionalPreferences || 'None'}.

### SPECIFIC INSTRUCTIONS FOR PLAN GENERATION:
1.  **Create 3 Distinct Plans:** Generate three distinct, creative party plans based *only* on the **PREVIOUS CONTEXT** provided above. The plans should represent different profiles: 'DIY/Budget', 'Premium/Convenience', and 'Unique/Adventure'. Ensure plans differ significantly in approach.
2.  **Exact JSON Output:** Respond ONLY with a single, valid JSON object: \`{ "plans": [ plan1, plan2, plan3 ] }\`. NO extra text, NO markdown, NO apologies or explanations. ALL keys/strings MUST use double quotes. NO trailing commas.
3.  **Required Structure (Per Plan):** Each plan object inside the "plans" array MUST follow this structure EXACTLY:
    \`\`\`json
    {
      "id": "plan-1", // Assign plan-1, plan-2, plan-3
      "name": "Specific Plan Name",
      "description": "Concise description mentioning suitability for age ${userInput.age} and location ${userInput.location.city}.",
      "profile": "DIY/Budget", // Or "Premium/Convenience" or "Unique/Adventure"
      "venue": {
        "name": "Specific, Real Venue Name in ${userInput.location.city} or 'Home/Park/Etc.'",
        "description": "Brief description of the venue.",
        "costRange": "Estimate: X-Y ${userInput.currency} or 'Free'", // Be specific if possible
        "amenities": ["Amenity 1", "Amenity 2"], // List relevant amenities
        "suitability": "Why this venue is suitable for the age, theme, guest count.",
        "venueSearchSuggestions": ["relevant local search term 1", "relevant local search term 2"] // Specific searches for ${userInput.location.city}
      },
      "schedule": [
        { "time": "Start - End", "activity": "Activity Name", "description": "Optional brief description." }
        // Add more schedule items as needed
      ],
      "catering": {
        "estimatedCost": "Approx. Z ${userInput.currency} or 'DIY Cost'",
        "servingStyle": "Buffet / Sit-down / Food Stations / Self-catered",
        "menu": { // MUST include all 4 keys, use empty arrays [] if no specific suggestions
          "appetizers": ["Appetizer suggestion 1"],
          "mainCourses": ["Main course suggestion 1"],
          "desserts": "Dessert description (e.g., Themed Cake, Fruit Platter)", // Note: This is a STRING as per types/index.ts
          "beverages": ["Beverage suggestion 1"]
        },
        "cateringSearchSuggestions": ["local catering search 1", "local catering search 2"] // Specific searches for ${userInput.location.city}
      },
      "guestEngagement": { // MUST include all 5 keys, use empty arrays [] if no specific suggestions
        "icebreakers": ["Icebreaker idea 1"],
        "interactiveElements": ["Interactive element 1"],
        "photoOpportunities": ["Photo op idea 1"],
        "partyFavors": ["Party favor idea 1"],
        "techIntegration": ["Tech idea 1 (optional)"],
        "entertainmentSearchSuggestions": ["local entertainment search 1", "local entertainment search 2"] // Specific searches for ${userInput.location.city}
      }
    }
    \`\`\`
4.  **Web Search & Specificity (ESSENTIAL):** You MUST attempt to use browsing/search to find specific, real local vendors, venues, activities, and typical prices in **"${userInput.location.city}, ${userInput.location.country}"** relevant to the user's budget, theme, age, and other preferences. DO NOT invent placeholder names if real options can be found. If search provides specific info (e.g., a venue name, a caterer), use it directly. If search fails or provides only general info, generate plausible suggestions appropriate for the location and clearly label costs as "Estimate: ...". Populate ALL search suggestion arrays with relevant, specific local search terms for ${userInput.location.city}.
5.  **Personalization:** Tailor ALL details (venue suitability, activities, catering menu, engagement ideas) to ALL user inputs summarized in the **PREVIOUS CONTEXT**. Ensure activities are age-appropriate for ${userInput.age}.
6.  **Budget Adherence:** Ensure cost estimates align with the overall budget (${userInput.budgetAmount} ${userInput.currency}) for each plan's profile (DIY vs. Premium).
7.  **Self-Critique (Internal):** Before finalizing the JSON, internally review each plan for comprehensiveness, creativity, practicality, safety, budget alignment, and adherence to ALL instructions. Refine internally if needed.`;

            // User prompt remains simple, relying on the detailed system prompt
            const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans according to ALL instructions in the system prompt, based *only* on the user input summary provided in the system prompt's PREVIOUS CONTEXT section. Output ONLY the valid JSON object containing the "plans" array.`;

            console.log("Calling OpenAI (gpt-4o) for generatePlans (JSON Mode enabled) with RCC prompt...");
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt_GeneratePlans },
                    { role: 'user', content: userPrompt_GeneratePlans }
                ],
                temperature: 0.6, // Slightly higher temp might encourage more creative interpretation within constraints
                response_format: { type: "json_object" },
            });

            const finalContent = completion.choices[0]?.message?.content;
            if (!finalContent) throw new Error('No final content returned from OpenAI (generatePlans)');

            responseData = extractAndParseJson(finalContent);

            // More robust validation - check main structure and nested objects existence
            if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3 || !responseData.plans.every(p => p && p.id && p.name && p.venue && typeof p.venue === 'object' && p.schedule && Array.isArray(p.schedule) && p.catering && typeof p.catering === 'object' && p.guestEngagement && typeof p.guestEngagement === 'object')) {
                console.error("Final parsed data failed validation (generatePlans). Parsed:", responseData);
                throw new Error("AI response format error or missing required plan fields/objects after parsing.");
            }
            console.log("Successfully generated and parsed plans (using JSON mode and RCC prompt structure).");

        // ==================================================================
        // --- Action: Generate Invitation ---
        // ==================================================================
        } else if (action === 'generateInvitation') {
            // ... (Keep existing generateInvitation logic - ensure it uses plan details correctly) ...
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

        // ==================================================================
        // --- Action: Optimize Budget ---
        // ==================================================================
        } else if (action === 'optimizeBudget') {
            // ... (Keep existing optimizeBudget logic - update prompt if needed based on research) ...
            // Consider updating this prompt based on RCC principles if optimizing later
            const { plan, priorities, numericBudget, currency } = data;
            if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) { throw new Error("Missing required data for optimizeBudget action."); }

            // Placeholder for potentially updated prompt based on research docs
            const systemPrompt_OptimizeBudget = `You are a budget optimization expert specializing in ${plan.venue?.name ? `events like those at ${plan.venue.name}` : `events in ${plan.location?.city || 'the specified city'}`}.
**Task:** Optimize the provided birthday plan JSON to better fit the target budget of ${numericBudget} ${currency}, considering the user's priorities (Scale 1-5, 5=high): Venue: ${priorities.venue}, Food: ${priorities.food}, Activities: ${priorities.activities}, Decorations: ${priorities.decorations}, Party Favors: ${priorities.partyFavors}.
**Instructions:** Adjust 'costRange'/'estimatedCost' fields and suggest specific changes in descriptions or items (venue, catering, activities, favors) to align with the budget and priorities. Update relevant search suggestions if applicable. Maintain the original plan's theme and core elements where possible. If budget is sufficient, suggest minor enhancements based on priorities.
**CRITICAL:** Include a concise summary of the changes made in the 'optimizationSummary' field within the optimized plan object.
**OUTPUT FORMAT:** Respond ONLY with a single, valid JSON object: \`{ "optimizedPlan": { ... complete optimized plan object ... } }\`. NO extra text, NO markdown. Ensure valid JSON.`;

            const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON according to the system prompt instructions. Target budget: ${numericBudget} ${currency}. Priorities (1-5): Venue: ${priorities.venue}, Food: ${priorities.food}, Activities: ${priorities.activities}, Decorations: ${priorities.decorations}, Favors: ${priorities.partyFavors}. Original Plan: ${JSON.stringify(plan)}. Return ONLY the valid JSON object containing the "optimizedPlan", including an "optimizationSummary" field.`;


            const messagesForOptimize = [ { role: 'system', content: systemPrompt_OptimizeBudget }, { role: 'user', content: userPrompt_OptimizeBudget } ];

            console.log("Calling OpenAI (gpt-4o) for optimizeBudget...");
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: messagesForOptimize,
                temperature: 0.4,
                response_format: { type: "json_object" },
            });
            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error('No content returned from OpenAI (optimizeBudget)');

            const parsedResponse = extractAndParseJson(content);
            console.log("--- Debugging OptimizeBudget Response ---");
            // ... (keep existing debug logs) ...
             console.log("Parsed Response Type:", typeof parsedResponse);
             console.log("Parsed Response is Null:", parsedResponse === null);
             if (parsedResponse && typeof parsedResponse === 'object') {
                 console.log("Has 'optimizedPlan' key?", 'optimizedPlan' in parsedResponse);
                 if ('optimizedPlan' in parsedResponse) {
                     console.log("'optimizedPlan' type:", typeof parsedResponse.optimizedPlan);
                     console.log("'optimizedPlan' is null?", parsedResponse.optimizedPlan === null);
                     if (parsedResponse.optimizedPlan && typeof parsedResponse.optimizedPlan === 'object') {
                         console.log("Has 'optimizationSummary' key?", 'optimizationSummary' in parsedResponse.optimizedPlan);
                     }
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
                 finalOptimizedPlanData = { optimizedPlan: { ...parsedResponse } }; // Wrap it
            } else {
                console.error("Validation Case 3: Failed. Parsed data doesn't match expected structures.");
                throw new Error("AI response format error: Expected { optimizedPlan: { ... } } or a recognizable plan object.");
            }

            // Ensure summary exists
            if (!finalOptimizedPlanData.optimizedPlan || typeof finalOptimizedPlanData.optimizedPlan.optimizationSummary !== 'string') {
                console.warn("AI did not include 'optimizationSummary' string. Adding default.");
                if (!finalOptimizedPlanData.optimizedPlan) finalOptimizedPlanData.optimizedPlan = {};
                finalOptimizedPlanData.optimizedPlan.optimizationSummary = "Optimization applied based on priorities and budget.";
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

