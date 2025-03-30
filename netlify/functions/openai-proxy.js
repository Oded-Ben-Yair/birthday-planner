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
        // ** Destructure profile along with action and userInput **
        const { action, userInput, profile, ...otherData } = payload; // Get profile if provided
        if (!action) throw new Error("Missing 'action' field in request payload.");

        console.log(`Received action: ${action}` + (profile ? ` for profile: ${profile}` : '')); // Log profile if present
        let responseData = null;

        // ==================================================================
        // --- Action: Generate Birthday Plans (RCC Prompt, 1 Specific Plan) ---
        // ==================================================================
        if (action === 'generatePlans') {
            // ** Validate userInput exists **
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) {
                throw new Error("Missing required user input data for generatePlans action.");
            }
            // ** Determine requested profile **
            const requestedProfile = profile || 'Premium/Convenience'; // Default if not specified, or choose dynamically
            const planId = profile === 'DIY/Budget' ? 'plan-1' : (profile === 'Premium/Convenience' ? 'plan-2' : 'plan-3'); // Assign ID based on profile

            // --- Use Detailed RCC Prompt Structure ---
            const systemPrompt_GeneratePlans_RCC_Detailed = `You are PartyPilot... (Keep the full detailed RCC System Prompt from immersive proxy_rcc_one_detailed_plan)

### TASK & INSTRUCTIONS:
1.  **Generate ONE Detailed Plan:** Create **ONE** high-quality, detailed plan based on the **USER INPUT SUMMARY** specifically for the **"${requestedProfile}"** profile.
2.  **SPECIFICITY & RESOURCEFULNESS (Use Knowledge):** Use your knowledge... for **"${userInput.location.city}, ${userInput.location.country}"**. Prioritize suggestions that fit the theme, budget, age, preferences, AND the **"${requestedProfile}"** profile.
3.  **Output Format:** Respond ONLY with a single, valid JSON object: \`{ "plans": [ plan1 ] }\`. It MUST contain exactly ONE plan object in the array. NO extra text...
4.  **Required JSON Structure (Per Plan):** The single plan object MUST follow this **DETAILED** structure EXACTLY:
    \`\`\`json
    {
      "id": "${planId}", // Use the ID corresponding to the requested profile
      "name": "Specific Plan Name Based on Theme/Venue",
      "description": "Concise description for age ${userInput.age} in ${userInput.location.city}.",
      "profile": "${requestedProfile}", // Ensure this matches the requested profile
      "venue": { ... }, // Fill detailed structure
      "schedule": [ ... ], // Fill detailed structure
      "catering": { ... }, // Fill detailed structure
      "guestEngagement": { ... } // Fill detailed structure
    }
    \`\`\`
5.  **Personalization & Adherence:** Ensure all plan elements reflect the **USER INPUT SUMMARY** and the **"${requestedProfile}"** profile. Adhere strictly to budget constraints appropriate for the profile.`;

            const userPrompt_GeneratePlans = `Generate ONE detailed birthday plan for the "${requestedProfile}" profile, according to ALL instructions in the system prompt, based *only* on the user input summary provided. Output ONLY the valid JSON object containing the single plan in the "plans" array.`;

            console.log(`Calling OpenAI model '${'gpt-4o'}' for generatePlans (Profile: ${requestedProfile})...`);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt_GeneratePlans_RCC_Detailed },
                    { role: 'user', content: userPrompt_GeneratePlans }
                ],
                max_tokens: 2500,
                temperature: 0.6,
                response_format: { type: "json_object" },
            });

            const message = completion.choices[0]?.message;
            const finalContent = message?.content;

            if (!finalContent) throw new Error(`No final content returned from OpenAI (generatePlans - Profile: ${requestedProfile})`);

            responseData = extractAndParseJson(finalContent);

            // Validation - Check for ONE plan with the DETAILED structure and matching profile/id
            if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 1 || !responseData.plans.every(p =>
                p && p.id === planId && // Check ID matches expected
                p.profile === requestedProfile && // Check profile matches expected
                p.name && p.description &&
                p.venue && typeof p.venue === 'object' && p.venue.name && p.venue.costRange && Array.isArray(p.venue.amenities) && p.venue.suitability &&
                p.schedule && Array.isArray(p.schedule) && p.schedule.length >= 1 &&
                p.catering && typeof p.catering === 'object' && p.catering.estimatedCost && p.catering.servingStyle && p.catering.menu && typeof p.catering.menu.desserts === 'string' &&
                p.guestEngagement && typeof p.guestEngagement === 'object'
            )) {
                console.error(`Final parsed data failed validation (generatePlans - Profile: ${requestedProfile}). Parsed:`, responseData);
                console.error("Raw content received that failed validation:", finalContent);
                throw new Error(`AI response format error, missing fields, or profile/id mismatch for profile ${requestedProfile}.`);
            }
            console.log(`Successfully generated and parsed ONE detailed plan (Profile: ${requestedProfile}).`);

        // ==================================================================
        // --- Other Actions (generateInvitation, optimizeBudget) ---
        // ==================================================================
        } else if (action === 'generateInvitation') {
            // ... (Keep existing generateInvitation logic) ...
             const { plan, template, date, time } = data; // Use otherData if profile was destructured earlier
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
            const { plan, priorities, numericBudget, currency } = data; // Use otherData if profile was destructured earlier
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

