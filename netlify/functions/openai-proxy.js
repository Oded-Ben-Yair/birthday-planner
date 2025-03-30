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
        // --- Action: Generate Birthday Plans (Minimal Request Diagnostic) ---
        // ==================================================================
        if (action === 'generatePlans') {
            const { userInput } = data;
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) {
                throw new Error("Missing required user input data, especially location city/country.");
            }

            // --- Define Simplified Prompt for Diagnostic ---
            // Temporarily removing detailed RCC structure to isolate truncation issue
            const systemPrompt_GeneratePlans_Simple = `You are a helpful birthday planning assistant.
Generate ONE birthday plan based on the user's input.
Respond ONLY with a single, valid JSON object: \`{ "plans": [ plan1 ] }\`. NO extra text. Double quotes. No trailing commas.
Use this SIMPLIFIED JSON structure for the single plan object inside the "plans" array:
\`\`\`json
{
  "id": "plan-1",
  "name": "Specific Plan Name Based on Theme/Venue",
  "description": "Concise description for age ${userInput.age} in ${userInput.location.city}.",
  "profile": "DIY/Budget", // Or "Premium/Convenience" or "Unique/Adventure" (choose one appropriate)
  "venue": { "name": "Plausible Venue Name for ${userInput.location.city}", "costRange": "Estimate: X-Y ${userInput.currency} or 'Free'" },
  "schedule": [ { "time": "Main Time Slot", "activity": "Primary Activity Suggestion" } ],
  "catering": { "estimatedCost": "Estimate: Approx. Z ${userInput.currency}", "servingStyle": "Brief Style Suggestion" },
  "guestEngagement": { "interactiveElements": ["One Key Interactive Element Suggestion"] }
}
\`\`\`
Base the plan details on the following user input, making plausible suggestions for the location:
* Birthday Person: ${userInput.birthdayPersonName} (Age: ${userInput.age})
* Theme: ${userInput.theme}
* Guests: ${userInput.guestCountAdults} adults, ${userInput.guestCountChildren} children
* Budget: ${userInput.budgetAmount} ${userInput.currency}
* Location: ${userInput.location.city}, ${userInput.location.country} (${userInput.location.setting})
* Activities: ${userInput.activities.join(', ')}
* Food/Drink: ${userInput.foodPreferences} / ${userInput.drinkPreferences}`;

            const userPrompt_GeneratePlans_Simple = `Generate ONE birthday plan according to the system prompt instructions and the simplified JSON structure specified. Output ONLY the valid JSON object.`;

            console.log(`Calling OpenAI model '${'gpt-4o'}' for generatePlans (Minimal Request Diagnostic)...`);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt_GeneratePlans_Simple },
                    { role: 'user', content: userPrompt_GeneratePlans_Simple }
                ],
                max_tokens: 1500, // Reduced significantly for simpler output
                temperature: 0.7, // Can use temperature with gpt-4o
                response_format: { type: "json_object" }, // Keep forcing JSON
            });

            const message = completion.choices[0]?.message;
            const finalContent = message?.content;

            if (!finalContent) throw new Error('No final content returned from OpenAI (generatePlans - Minimal Request)');

            responseData = extractAndParseJson(finalContent);

            // Validation - Check for ONE plan with the simplified structure
            if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 1 || !responseData.plans.every(p => // Expecting exactly ONE plan now
                p && p.id && p.name && p.description && p.profile &&
                p.venue && typeof p.venue === 'object' && p.venue.name && p.venue.costRange &&
                p.schedule && Array.isArray(p.schedule) && p.schedule.length >= 1 &&
                p.catering && typeof p.catering === 'object' && p.catering.estimatedCost && p.catering.servingStyle &&
                p.guestEngagement && typeof p.guestEngagement === 'object' && p.guestEngagement.interactiveElements
            )) {
                console.error("Final parsed data failed validation (generatePlans - Minimal Request). Parsed:", responseData);
                console.error("Raw content received that failed validation:", finalContent);
                throw new Error("AI response format error or missing required simplified plan fields after parsing.");
            }
            console.log("Successfully generated and parsed ONE simplified plan (Minimal Request Diagnostic).");

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

