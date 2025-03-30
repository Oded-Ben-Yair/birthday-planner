// netlify/functions/openai-proxy.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Enhanced JSON parser - Still useful for parsing function arguments
 */
const extractAndParseJson = (jsonString) => {
    // ... (Keep the enhanced extractAndParseJson function) ...
    if (!jsonString || typeof jsonString !== 'string') { console.error('extractAndParseJson: Input invalid.'); return null; }
    let potentialJson = jsonString.trim();
    // No need to strip ```json anymore as args should be clean JSON string
    const cleanJsonString = (str) => { try { return str.replace(/,\s*([}\]])/g, '$1'); } catch (e) { console.warn("Regex cleaning failed..."); return str; }};
    const tryParse = (str) => { const cleanedStr = cleanJsonString(str); return JSON.parse(cleanedStr); };
    try { const parsed = tryParse(potentialJson); console.log("Parsing successful (Function Args)."); return parsed; }
    catch (parseError) { console.error(`Failed to parse JSON (Function Args): ${parseError.message}`); const snippet = potentialJson.length > 500 ? potentialJson.substring(0, 500) + '...' : potentialJson; console.error('String that failed parsing (snippet):', snippet); return null; }
};

// --- Define the desired BirthdayPlan structure as an OpenAI Tool Schema ---
// Based on src/types/index.ts BirthdayPlan interface
const savePlanToolSchema = {
    type: "function",
    function: {
        name: "save_birthday_plan",
        description: "Saves a generated birthday plan.",
        parameters: {
            type: "object",
            properties: {
                // Match BirthdayPlan structure precisely
                id: { type: "string", description: "Unique ID for the plan (e.g., plan-1, plan-2, plan-3 based on profile)." },
                name: { type: "string", description: "Specific name for the birthday plan." },
                description: { type: "string", description: "Concise description of the plan." },
                profile: { type: "string", enum: ['DIY/Budget', 'Premium/Convenience', 'Unique/Adventure'], description: "The profile category of the plan." },
                venue: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        costRange: { type: "string", description: "Estimated cost range (e.g., 'Estimate: 1000-1500 NIS')." },
                        amenities: { type: "array", items: { type: "string" } },
                        suitability: { type: "string" },
                        venueSearchSuggestions: { type: "array", items: { type: "string" }, description: "Local search terms." }
                    },
                    required: ["name", "description", "costRange", "amenities", "suitability"] // Define required venue fields
                },
                schedule: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            time: { type: "string" },
                            activity: { type: "string" },
                            description: { type: "string" }
                        },
                        required: ["time", "activity"]
                    }
                },
                catering: {
                    type: "object",
                    properties: {
                        estimatedCost: { type: "string" },
                        servingStyle: { type: "string" },
                        menu: {
                            type: "object",
                            properties: {
                                appetizers: { type: "array", items: { type: "string" } },
                                mainCourses: { type: "array", items: { type: "string" } },
                                desserts: { type: "string", description: "String description of desserts." }, // Correct type
                                beverages: { type: "array", items: { type: "string" } }
                            },
                            required: ["appetizers", "mainCourses", "desserts", "beverages"]
                        },
                        cateringSearchSuggestions: { type: "array", items: { type: "string" } }
                    },
                    required: ["estimatedCost", "servingStyle", "menu"] // Define required catering fields
                },
                guestEngagement: {
                    type: "object",
                    properties: {
                        icebreakers: { type: "array", items: { type: "string" } },
                        interactiveElements: { type: "array", items: { type: "string" } },
                        photoOpportunities: { type: "array", items: { type: "string" } },
                        partyFavors: { type: "array", items: { type: "string" } },
                        techIntegration: { type: "array", items: { type: "string" } },
                        entertainmentSearchSuggestions: { type: "array", items: { type: "string" } }
                    },
                    required: ["icebreakers", "interactiveElements", "photoOpportunities", "partyFavors"] // Define required engagement fields
                },
                 optimizationSummary: { type: "string", description: "Optional summary if optimization was done." } // Keep optional fields if defined in type
            },
            // List all top-level required fields for a BirthdayPlan
            required: ["id", "name", "description", "profile", "venue", "schedule", "catering", "guestEngagement"]
        }
    }
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
        const { action, userInput, profile, ...otherData } = payload;
        if (!action) throw new Error("Missing 'action' field in request payload.");

        console.log(`Received action: ${action}` + (profile ? ` for profile: ${profile}` : ''));
        let responseData = null;

        // ==================================================================
        // --- Action: Generate Birthday Plans (Using Function Calling) ---
        // ==================================================================
        if (action === 'generatePlans') {
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) {
                throw new Error("Missing required user input data for generatePlans action.");
            }
            const requestedProfile = profile || 'Premium/Convenience';
            const planId = profile === 'DIY/Budget' ? 'plan-1' : (profile === 'Premium/Convenience' ? 'plan-2' : 'plan-3');

            // --- Define Prompt Instructing AI to Call the Function ---
            // Keep RCC structure but remove JSON format instructions, focus on calling the function
            const systemPrompt_GeneratePlans_FunctionCall = `You are PartyPilot, an AI-powered birthday planning assistant.

### CONSTITUTIONAL PRINCIPLES
(Keep the 10 principles: INCLUSIVITY, AGE-APPROPRIATENESS, BUDGET RESPECT, SAFETY FIRST, HONESTY, HELPFULNESS, PRIVACY, PROACTIVITY, SPECIFICITY, RESOURCEFULNESS)
* Apply these principles. Use your knowledge to provide specific and realistic suggestions for **${userInput.location.city}, ${userInput.location.country}**.

### CHAIN STRUCTURE
You are in the **PLAN GENERATION** phase.

### REACT PROCESS (Internal Guidance)
1.  **THINK:** Analyze user input. Brainstorm specific, realistic options for **${userInput.location.city}, ${userInput.location.country}** based on your knowledge for the requested profile.
2.  **ACT:** Generate the details for **ONE** detailed plan for the **"${requestedProfile}"** profile.
3.  **CALL FUNCTION:** Call the 'save_birthday_plan' function with the generated plan details, ensuring all required parameters match the function schema.

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
1.  **Generate ONE Detailed Plan:** Create **ONE** high-quality, detailed plan based on the **USER INPUT SUMMARY** specifically for the **"${requestedProfile}"** profile (ID should be "${planId}").
2.  **Use Knowledge:** Use your knowledge base for specific, realistic suggestions for **"${userInput.location.city}, ${userInput.location.country}"** fitting the theme, budget, age, and profile.
3.  **Call Function (CRITICAL):** After generating the plan details, you **MUST** call the provided 'save_birthday_plan' function. Pass all the generated plan details as arguments according to the function's parameter schema. Do not omit required fields.`;

            // User prompt is simpler, focusing on the request
            const userPrompt_GeneratePlans = `Generate ONE detailed birthday plan for the "${requestedProfile}" profile based on my input summary, and then call the 'save_birthday_plan' function with the plan details.`;

            console.log(`Calling OpenAI model '${'gpt-4o'}' for generatePlans (Function Calling, Profile: ${requestedProfile})...`);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt_GeneratePlans_FunctionCall },
                    { role: 'user', content: userPrompt_GeneratePlans }
                ],
                // ** Add tools and tool_choice **
                tools: [savePlanToolSchema],
                tool_choice: { type: "function", function: { name: "save_birthday_plan" } }, // Force calling our function
                max_tokens: 2500, // Keep reasonably high
                temperature: 0.6,
                // ** Remove response_format **
            });

            const message = completion.choices[0]?.message;

            // Check if the AI wanted to call the function
            if (message?.tool_calls && message.tool_calls.length > 0 && message.tool_calls[0].function?.name === "save_birthday_plan") {
                const functionArgsString = message.tool_calls[0].function.arguments;
                console.log("AI called save_birthday_plan function with args:", functionArgsString);

                // Parse the arguments string (which should be JSON)
                const planObject = extractAndParseJson(functionArgsString);

                if (!planObject) {
                    throw new Error("Failed to parse function arguments returned by AI.");
                }

                // ** Strict Validation (Optional but Recommended) **
                // Since function calling *should* enforce schema, we can add back stricter checks here
                // This ensures the object truly matches our BirthdayPlan type before sending to frontend
                if (
                    typeof planObject !== 'object' || planObject === null ||
                    planObject.id !== planId || // Check ID
                    planObject.profile !== requestedProfile || // Check Profile
                    !planObject.name || !planObject.description || // Check basic fields
                    !planObject.venue || typeof planObject.venue !== 'object' || !planObject.venue.name || !Array.isArray(planObject.venue.amenities) || // Check venue structure
                    !planObject.schedule || !Array.isArray(planObject.schedule) || // Check schedule
                    !planObject.catering || typeof planObject.catering !== 'object' || !planObject.catering.menu || typeof planObject.catering.menu.desserts !== 'string' || // Check catering structure
                    !planObject.guestEngagement || typeof planObject.guestEngagement !== 'object' // Check engagement structure
                    // Add more checks based on required fields in savePlanToolSchema.function.parameters.required
                ) {
                     console.error("Validation failed for function call arguments. Parsed Object:", planObject);
                     throw new Error("AI function call arguments do not match the required BirthdayPlan structure.");
                }


                // Wrap the validated plan object in the { plans: [...] } structure expected by frontend
                responseData = { plans: [planObject] };
                console.log(`Successfully processed function call and validated plan for profile: ${requestedProfile}.`);

            } else {
                // AI didn't call the function as expected
                console.error("AI did not call the expected function 'save_birthday_plan'. Response message:", message);
                throw new Error("AI failed to call the required function to save the plan.");
            }

        // ==================================================================
        // --- Other Actions (generateInvitation, optimizeBudget) ---
        // ==================================================================
        } else if (action === 'generateInvitation') {
            // ... (Keep existing generateInvitation logic) ...
             const { plan, template, date, time } = otherData; // Use otherData now
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
             const { plan, priorities, numericBudget, currency } = otherData; // Use otherData now
             if (!plan || typeof plan !== 'object' || !priorities || typeof priorities !== 'object' || numericBudget === undefined || !currency) { throw new Error("Missing required data for optimizeBudget action."); }
             const systemPrompt_OptimizeBudget = `You are a budget optimization expert...`;
             const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON...`;
             const messagesForOptimize = [ { role: 'system', content: systemPrompt_OptimizeBudget }, { role: 'user', content: userPrompt_OptimizeBudget } ];
             console.log("Calling OpenAI (gpt-4o) for optimizeBudget...");
             // Maybe use function calling here too eventually for structured output
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

