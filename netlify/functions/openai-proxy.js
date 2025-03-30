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

        // ==================================================================
        // --- Action: Generate Birthday Plans (Standard Model + Simplified JSON) ---
        // ==================================================================
        if (action === 'generatePlans') {
            const { userInput } = data;
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) {
                throw new Error("Missing required user input data, especially location city/country.");
            }

            // --- Define Prompt using RCC Structure for Standard Model ---
            const systemPrompt_GeneratePlans = `You are PartyPilot, an AI-powered birthday planning assistant.

### CONSTITUTIONAL PRINCIPLES
(Keep the 10 principles: INCLUSIVITY, AGE-APPROPRIATENESS, BUDGET RESPECT, SAFETY FIRST, HONESTY, HELPFULNESS, PRIVACY, PROACTIVITY, SPECIFICITY, RESOURCEFULNESS)
* Apply these principles, especially ensuring age (${userInput.age}) and budget (${userInput.budgetAmount} ${userInput.currency}) appropriateness. Use your knowledge to provide specific and realistic suggestions for the target location.

### CHAIN STRUCTURE
You operate through phases. You are currently in the **PLAN GENERATION** phase.

### REACT PROCESS (Internal Guidance)
1.  **THINK:** Analyze user input. Identify key constraints and preferences. Use your internal knowledge to brainstorm specific, realistic options for **${userInput.location.city}, ${userInput.location.country}**.
2.  **ACT:** Generate 3 distinct plans ('DIY/Budget', 'Premium/Convenience', 'Unique/Adventure') incorporating the most suitable options based on your knowledge and the user input.
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
2.  **SPECIFICITY & RESOURCEFULNESS (Use Knowledge):** Use your knowledge base to provide specific, realistic, and relevant suggestions appropriate for **"${userInput.location.city}, ${userInput.location.country}"**. Prioritize suggestions that fit the theme, budget, age, and other preferences. Use plausible information based on your training data for the location. Clearly label cost estimates ("Estimate: ...").
3.  **Output Format:** Respond ONLY with a single, valid JSON object: \`{ "plans": [ plan1, plan2, plan3 ] }\`. NO extra text. Double quotes. No trailing commas.
4.  **Required JSON Structure (Per Plan):** Each plan object MUST follow this **SIMPLIFIED** structure EXACTLY:
    \`\`\`json
    {
      "id": "plan-1", // Assign plan-1, plan-2, plan-3
      "name": "Specific Plan Name Based on Theme/Venue",
      "description": "Concise description for age ${userInput.age} in ${userInput.location.city}.",
      "profile": "DIY/Budget", // Or "Premium/Convenience" or "Unique/Adventure"
      "venue": { // SIMPLIFIED
        "name": "Plausible Venue Name for Location",
        "costRange": "Estimate: X-Y ${userInput.currency} or 'Free'"
      },
      "schedule": [ // SIMPLIFIED - Just one key activity
        { "time": "Main Time Slot", "activity": "Primary Activity Suggestion" }
      ],
      "catering": { // SIMPLIFIED
        "estimatedCost": "Estimate: Approx. Z ${userInput.currency}",
        "servingStyle": "Brief Style Suggestion (e.g., BBQ, Pizza, Tapas)"
      },
      "guestEngagement": { // SIMPLIFIED - Just one key idea
        "interactiveElements": ["One Key Interactive Element Suggestion"]
      }
    }
    \`\`\`
    **(Note: Details like amenities, full menus, suitability, search suggestions, etc., are temporarily omitted to reduce output size).**
5.  **Personalization & Adherence:** Ensure the simplified plan elements reflect the **USER INPUT SUMMARY**. Adhere strictly to budget constraints for each profile.`;

            const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans according to ALL instructions in the system prompt, based *only* on the user input summary provided in the system prompt's PREVIOUS CONTEXT section. Use your knowledge to provide specific details relevant to the location. Output ONLY the valid JSON object containing the 3 plans in the **SIMPLIFIED** structure specified.`;

            console.log(`Calling OpenAI model '${'gpt-4o'}' for generatePlans (Standard Model, Simplified JSON Mode)...`);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt_GeneratePlans },
                    { role: 'user', content: userPrompt_GeneratePlans }
                ],
                max_tokens: 3000, // Reduced slightly as output is simpler
                temperature: 0.6,
                response_format: { type: "json_object" },
            });

            const message = completion.choices[0]?.message;
            const finalContent = message?.content;

            if (!finalContent) throw new Error('No final content returned from OpenAI (generatePlans - Standard Model)');

            responseData = extractAndParseJson(finalContent);

            // Validation - Check only for the simplified structure
            if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3 || !responseData.plans.every(p =>
                p && p.id && p.name && p.description && p.profile &&
                p.venue && typeof p.venue === 'object' && p.venue.name && p.venue.costRange && // Simplified venue check
                p.schedule && Array.isArray(p.schedule) && p.schedule.length >= 1 && // Simplified schedule check
                p.catering && typeof p.catering === 'object' && p.catering.estimatedCost && p.catering.servingStyle && // Simplified catering check
                p.guestEngagement && typeof p.guestEngagement === 'object' && p.guestEngagement.interactiveElements // Simplified engagement check
            )) {
                console.error("Final parsed data failed validation (generatePlans - Simplified JSON). Parsed:", responseData);
                console.error("Raw content received that failed validation:", finalContent);
                throw new Error("AI response format error or missing required simplified plan fields after parsing.");
            }
            console.log("Successfully generated and parsed plans (using Standard Model + Simplified JSON).");

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
        console.error(caughtError);
        const status = caughtError?.status || caughtError?.response?.status || 500;
        const message = caughtError instanceof Error ? caughtError.message : 'An internal server error occurred.';
        if (caughtError instanceof OpenAI.APIError) { console.error('OpenAI API Error Details:', { status: caughtError.status, message: caughtError.message, code: caughtError.code, type: caughtError.type }); }
        return { statusCode: status, headers, body: JSON.stringify({ error: message }) };
    }
};

