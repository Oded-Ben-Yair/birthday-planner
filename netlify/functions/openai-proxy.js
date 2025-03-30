    // netlify/functions/openai-proxy.js
    import OpenAI from 'openai';

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    /**
     * Enhanced JSON parser: Removes markdown fences, trailing commas, and attempts parsing.
     */
    const extractAndParseJson = (jsonString) => {
        // ... (Keep the enhanced extractAndParseJson function from openai_proxy_fix_wrapper_2) ...
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
            // --- Action: Generate Birthday Plans ---
            // ==================================================================
            if (action === 'generatePlans') {
                const { userInput } = data;
                if (!userInput || typeof userInput !== 'object' || /* ... validation ... */ !userInput.location?.country) { throw new Error("Missing required user input data."); }

                const systemPrompt_GeneratePlans = `You are BirthdayPlannerAI... **Leverage your web browsing capabilities** ... Provide ONLY the valid JSON object: \`{ "plans": [...] }\` ...`; // Keep detailed prompt
                const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans ... for ${userInput.birthdayPersonName} ... in ${userInput.location.city}, ${userInput.location.country}. Use your web search capabilities ... Output ONLY the valid JSON object.`; // Keep detailed prompt

                console.log("Calling OpenAI (gpt-4o) for generatePlans (prompt-based search)...");
                const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages: [/*...*/], temperature: 0.7 });
                const finalContent = completion.choices[0]?.message?.content;
                if (!finalContent) throw new Error('No final content returned from OpenAI (generatePlans)');
                responseData = extractAndParseJson(finalContent);
                if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3) { throw new Error("AI response format error: Expected { plans: [plan1, plan2, plan3] }."); }
                console.log("Successfully generated and parsed plans (using prompt-based search).");

            // ==================================================================
            // --- Action: Generate Invitation ---
            // ==================================================================
            } else if (action === 'generateInvitation') {
                // ... (Keep existing generateInvitation logic) ...
                 const { plan, template, date, time } = data;
                if (!plan || typeof plan !== 'object' || !template || !date || !time) { throw new Error("Missing data for generateInvitation action."); }
                const birthdayPersonName = data.userInput?.birthdayPersonName || plan.name || "the birthday person";
                console.log("Calling OpenAI (gpt-3.5-turbo) for invitation text...");
                const textCompletion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: [/*...*/], temperature: 0.7 });
                const text = textCompletion.choices[0]?.message?.content?.trim() || `You're invited...`;
                console.log("Calling OpenAI (DALL-E) for invitation image...");
                const imageResponse = await openai.images.generate({ model: 'dall-e-3', prompt: `...`, n: 1, size: '1024x1024', quality: 'standard' });
                const imageUrl = imageResponse.data?.[0]?.url || '';
                responseData = { text, imageUrl, template };
                console.log("Successfully generated invitation components.");

            // ==================================================================
            // --- Action: Optimize Budget ---
            // ==================================================================
            } else if (action === 'optimizeBudget') {
                // ... (Keep existing optimizeBudget logic with flexible validation) ...
                const { plan, priorities, numericBudget, currency } = data;
                if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) { throw new Error("Missing required data for optimizeBudget action."); }
                const systemPrompt_OptimizeBudget = `You are a budget optimization expert... **Summary Field:** Include ... \`optimizationSummary\` (string). ... Return ONLY the valid JSON object { "optimizedPlan": { ... } }.`;
                const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON ... Return ONLY the valid JSON object containing the "optimizedPlan", including an "optimizationSummary" field within it....`;
                console.log("Calling OpenAI (gpt-3.5-turbo) for optimizeBudget...");
                const completion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: [/*...*/], temperature: 0.6 });
                const content = completion.choices[0]?.message?.content;
                if (!content) throw new Error('No content returned from OpenAI (optimizeBudget)');
                const parsedResponse = extractAndParseJson(content);
                console.log("Parsed optimizeBudget response:", parsedResponse); // Log parsed object
                let finalOptimizedPlanData;
                if (parsedResponse && typeof parsedResponse.optimizedPlan === 'object' && parsedResponse.optimizedPlan !== null) { /* Case 1 */ finalOptimizedPlanData = parsedResponse; }
                else if (parsedResponse && typeof parsedResponse === 'object' && parsedResponse !== null && ('id' in parsedResponse || 'name' in parsedResponse || 'venue' in parsedResponse)) { /* Case 2 */ console.warn("Wrapping direct plan object."); finalOptimizedPlanData = { optimizedPlan: { ...parsedResponse } }; }
                else { /* Case 3 */ throw new Error("AI response format error: Expected { optimizedPlan: { ... } } or a plan object."); }
                if (typeof finalOptimizedPlanData.optimizedPlan.optimizationSummary !== 'string') { /* Add default summary */ finalOptimizedPlanData.optimizedPlan.optimizationSummary = "Optimization applied."; }
                responseData = finalOptimizedPlanData;
                console.log("Successfully processed optimized plan.");

            // --- Action Not Recognized ---
            } else { throw new Error(`Invalid action specified: ${action}`); }

            // --- Return Successful Response ---
            return { statusCode: 200, headers, body: JSON.stringify(responseData) };

        // ==================================================================
        // --- ** SIMPLIFIED Global Error Handling ** ---
        // ==================================================================
        } catch (caughtError) { // Use a different variable name like 'caughtError'
            console.error('--- ERROR Processing Request in Netlify Function ---');
            console.error(caughtError); // Log the full error object

            // Basic error information to return
            const status = caughtError?.status || caughtError?.response?.status || 500; // Get status if available
            const message = caughtError instanceof Error ? caughtError.message : 'An internal server error occurred.';

            return {
                statusCode: status,
                headers,
                // Return a simple error structure
                body: JSON.stringify({ error: message }),
            };
        }
    };
    
