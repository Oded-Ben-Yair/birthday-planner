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

// ==================================================================
// --- NEW: Simulate Retrieval Function ---
// ==================================================================
/**
 * Simulates retrieving local venue/catering data based on user input.
 * In a real implementation, this would query a database or search API.
 * @param {object} userInput - The user's input object.
 * @returns {object} An object containing arrays of example venues and caterers.
 */
const simulateRetrieval = (userInput) => {
    console.log(`Simulating retrieval for city: ${userInput.location?.city}`);
    const city = userInput.location?.city?.toLowerCase();
    let venues = [];
    let caterers = [];

    // --- Hardcoded Examples ---
    if (city === 'eilat') {
        venues = [
            { name: "King Solomon Hotel Eilat Venue", description: "Hotel venue with event spaces.", costRange: "Estimate: 6000-9000 NIS", amenities: ["Pool Access", "Kosher Catering Option", "Sound System"], suitability: "Good for mixed adult/child groups, premium feel." },
            { name: "Dolphin Reef Eilat Event Area", description: "Unique venue with dolphin interaction possibilities.", costRange: "Estimate: 8000-12000 NIS", amenities: ["Beach Area", "Observation Points", "Basic Catering"], suitability: "Unique/Adventure profile, memorable experience." },
            { name: "Red Sea Beach Park (Public)", description: "Public beach area suitable for DIY picnics.", costRange: "Free (Permits may be needed for large setup)", amenities: ["Beach Access", "Public Restrooms"], suitability: "DIY/Budget profile, requires self-catering." }
        ];
        caterers = [
            { name: "Eilat Gourmet Catering", estimatedCost: "Approx. 150-250 NIS/person", servingStyle: "Buffet or Sit-down", menu: { appetizers: ["Fish Ceviche", "Mini Quiches"], mainCourses: ["Grilled Sea Bream", "Chicken Skewers"], desserts: "Fruit Platter & Pastries", beverages: ["Local Wine", "Juices"] }, searchSuggestion: "gourmet catering eilat" },
            { name: "Tamarind Indian Restaurant (Catering)", estimatedCost: "Approx. 100-180 NIS/person", servingStyle: "Buffet", menu: { appetizers: ["Samosas", "Pakoras"], mainCourses: ["Butter Chicken", "Vegetable Korma"], desserts: "Gulab Jamun", beverages: ["Lassi", "Soft Drinks"] }, searchSuggestion: "indian catering eilat" }
        ];
    } else if (city === 'tel aviv') {
        venues = [
            { name: "The Norman Hotel Rooftop (Simulated)", description: "Exclusive rooftop venue.", costRange: "Estimate: 7000-8000 NIS", amenities: ["Rooftop bar", "Lounge seating", "In-house catering"], suitability: "Ideal for an upscale gathering." },
            { name: "Park Hayarkon Picnic Area (Simulated)", description: "Large park with designated picnic spots.", costRange: "Free (Setup costs apply)", amenities: ["Open Space", "Restrooms Nearby"], suitability: "Great for DIY/Budget outdoor events." },
            { name: "Art Factory TLV (Simulated)", description: "Creative space suitable for workshops/parties.", costRange: "Estimate: 3000-5000 NIS", amenities: ["Art Supplies", "Workshop Space", "Basic Kitchenette"], suitability: "Good for themed/activity-based parties." }
        ];
        caterers = [
            { name: "Messa Catering (Simulated)", estimatedCost: "Approx. 200-350 NIS/person", servingStyle: "Sit-down or Buffet", menu: { appetizers: ["Tuna Tartare", "Beef Carpaccio"], mainCourses: ["Sea Bass", "Filet Mignon"], desserts: "Chocolate Fondant", beverages: ["Wine Selection", "Cocktails"] }, searchSuggestion: "luxury catering tel aviv" },
            { name: "Hummus Abu Hassan (DIY Pickup - Simulated)", estimatedCost: "Approx. 30-50 NIS/person", servingStyle: "Self-catered", menu: { appetizers: ["Hummus", "Pita", "Salads"], mainCourses: ["Msabbaha"], desserts: "N/A", beverages: ["Lemonade"] }, searchSuggestion: "best hummus tel aviv pickup" }
        ];
    } else {
        // Default/Generic examples if city doesn't match
        venues = [{ name: "Generic Community Hall", description: "Basic event space.", costRange: "Estimate: 1000-2000 Currency", amenities: ["Tables", "Chairs", "Restrooms"], suitability: "Basic indoor events." }];
        caterers = [{ name: "Local Pizza Place (Catering)", estimatedCost: "Approx. 40-60 Currency/person", servingStyle: "Delivery/Buffet", menu: { appetizers: ["Garlic Bread"], mainCourses: ["Assorted Pizzas"], desserts: "N/A", beverages: ["Soft Drinks"] }, searchSuggestion: "pizza catering [city]" }];
    }

    return { venues, caterers };
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
        // --- Action: Generate Birthday Plans (Simulated RAG) ---
        // ==================================================================
        if (action === 'generatePlans') {
            const { userInput } = data;
            if (!userInput || typeof userInput !== 'object' || !userInput.location?.city || !userInput.location?.country) {
                throw new Error("Missing required user input data, especially location city/country.");
            }

            // --- Step 1: Simulate Retrieval ---
            const retrievedData = simulateRetrieval(userInput);
            const retrievedInfoString = JSON.stringify(retrievedData, null, 2); // Format for prompt
            console.log("Simulated Retrieved Data:", retrievedInfoString);

            // --- Step 2: Define Prompt using Retrieved Data ---
            // ** UPDATED SYSTEM PROMPT for RAG **
            const systemPrompt_GeneratePlans = `You are PartyPilot, an AI-powered birthday planning assistant. Your task is to generate 3 distinct birthday plans based on user input and **specifically using the provided retrieved local information**.

### CONSTITUTIONAL PRINCIPLES
(Keep the 10 principles as defined before: INCLUSIVITY, AGE-APPROPRIATENESS, BUDGET RESPECT, SAFETY FIRST, HONESTY, HELPFULNESS, PRIVACY, PROACTIVITY, SPECIFICITY, RESOURCEFULNESS)
* Apply these principles, especially ensuring age (${userInput.age}) and budget (${userInput.budgetAmount} ${userInput.currency}) appropriateness.

### PROVIDED USER INPUT SUMMARY:
* Planning for: ${userInput.birthdayPersonName} (turning ${userInput.age})
* Theme: "${userInput.theme}"
* Guests: ${userInput.guestCountAdults} adults, ${userInput.guestCountChildren} children
* Budget: ${userInput.budgetAmount} ${userInput.currency}
* Location: ${userInput.location.city}, ${userInput.location.country} (${userInput.location.setting})
* Activities: ${userInput.activities.join(', ')}
* Food/Drink Prefs: ${userInput.foodPreferences} / ${userInput.drinkPreferences}
* Additional Notes: ${userInput.additionalPreferences || 'None'}

### RETRIEVED LOCAL INFORMATION (${userInput.location.city}):
\`\`\`json
${retrievedInfoString}
\`\`\`

### TASK & INSTRUCTIONS:
1.  **Generate 3 Distinct Plans:** Create three plans ('DIY/Budget', 'Premium/Convenience', 'Unique/Adventure') based on the **USER INPUT SUMMARY**.
2.  **USE RETRIEVED INFO (CRITICAL):** You MUST incorporate details from the **RETRIEVED LOCAL INFORMATION** section above when selecting venues and caterers. Choose options from the retrieved data that best fit each plan's profile (Budget/Premium/Unique) and the user's preferences. If retrieved options don't fit a profile well, adapt them or note why they were chosen (e.g., "Using [Venue Name] from retrieved info, adapting for budget..."). Do NOT invent venues/caterers if suitable options are provided in the retrieved info.
3.  **Output Format:** Respond ONLY with a single, valid JSON object: \`{ "plans": [ plan1, plan2, plan3 ] }\`. NO extra text, NO markdown. Use double quotes. No trailing commas.
4.  **Required JSON Structure (Per Plan):** Each plan object MUST follow this structure EXACTLY (fill details based on user input and retrieved info):
    \`\`\`json
    {
      "id": "plan-1", // Assign plan-1, plan-2, plan-3
      "name": "Specific Plan Name",
      "description": "Concise description for age ${userInput.age} in ${userInput.location.city}, potentially mentioning the chosen venue.",
      "profile": "DIY/Budget", // Or "Premium/Convenience" or "Unique/Adventure"
      "venue": { // USE DETAILS FROM RETRIEVED INFO PRIMARILY
        "name": "Venue Name (from retrieved info if used)",
        "description": "Venue Description (from retrieved info or adapted)",
        "costRange": "Cost Range (from retrieved info or estimated)",
        "amenities": ["Amenity 1 (from retrieved info)", "..."],
        "suitability": "Why this venue (from retrieved info) is suitable.",
        "venueSearchSuggestions": ["relevant local search term 1", "relevant local search term 2"] // Suggest searches for the CHOSEN venue or alternatives
      },
      "schedule": [
        { "time": "Start - End", "activity": "Activity Name", "description": "Optional description." }
        // Add schedule items relevant to theme, age, venue
      ],
      "catering": { // USE DETAILS FROM RETRIEVED INFO PRIMARILY
        "estimatedCost": "Cost (from retrieved info or estimated)",
        "servingStyle": "Serving Style (from retrieved info or suitable style)",
        "menu": { // Adapt menu based on retrieved info and user prefs
          "appetizers": ["Appetizer 1 (inspired by retrieved/prefs)"],
          "mainCourses": ["Main 1 (inspired by retrieved/prefs)"],
          "desserts": "Dessert description (themed)", // String
          "beverages": ["Beverage 1 (inspired by retrieved/prefs)"]
        },
        "cateringSearchSuggestions": ["search for chosen caterer", "alternative local catering search"]
      },
      "guestEngagement": { // Tailor these to theme, age, venue
        "icebreakers": ["Icebreaker idea 1"],
        "interactiveElements": ["Interactive element 1"],
        "photoOpportunities": ["Photo op idea 1"],
        "partyFavors": ["Party favor idea 1"],
        "techIntegration": [],
        "entertainmentSearchSuggestions": ["local entertainment search 1", "local entertainment search 2"]
      }
    }
    \`\`\`
5.  **Personalization & Adherence:** Ensure all plan elements (schedule, engagement, menu details beyond retrieved info) are tailored to the **USER INPUT SUMMARY** (age, theme, activities, food/drink prefs). Adhere to budget constraints for each profile.`;

            // User prompt focuses on the core request, relying on the detailed system prompt.
            const userPrompt_GeneratePlans = `Generate the 3 distinct birthday plans according to ALL instructions in the system prompt, using the provided user input and retrieved local information. Output ONLY the valid JSON object containing the "plans" array.`;

            console.log("Calling OpenAI (gpt-4o) for generatePlans (Simulated RAG)...");
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt_GeneratePlans },
                    { role: 'user', content: userPrompt_GeneratePlans }
                ],
                temperature: 0.5, // Lower temp might help follow instructions more closely
                response_format: { type: "json_object" },
            });

            const finalContent = completion.choices[0]?.message?.content;
            if (!finalContent) throw new Error('No final content returned from OpenAI (generatePlans)');

            responseData = extractAndParseJson(finalContent);

            // Validation
            if (!responseData || !Array.isArray(responseData.plans) || responseData.plans.length !== 3 || !responseData.plans.every(p => p && p.id && p.name && p.venue && typeof p.venue === 'object' && p.schedule && Array.isArray(p.schedule) && p.catering && typeof p.catering === 'object' && p.guestEngagement && typeof p.guestEngagement === 'object')) {
                console.error("Final parsed data failed validation (generatePlans - RAG). Parsed:", responseData);
                throw new Error("AI response format error or missing required plan fields/objects after parsing.");
            }
            console.log("Successfully generated and parsed plans (using simulated RAG approach).");

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
            const systemPrompt_OptimizeBudget = `You are a budget optimization expert...`; // Keep existing or refine later
            const userPrompt_OptimizeBudget = `Optimize the following birthday plan JSON...`; // Keep existing or refine later
            const messagesForOptimize = [ { role: 'system', content: systemPrompt_OptimizeBudget }, { role: 'user', content: userPrompt_OptimizeBudget } ];
            console.log("Calling OpenAI (gpt-4o) for optimizeBudget...");
            const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages: messagesForOptimize, temperature: 0.4, response_format: { type: "json_object" }, });
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
        // ... (Keep simplified catch block) ...
        console.error('--- ERROR Processing Request in Netlify Function ---');
        console.error(caughtError);
        const status = caughtError?.status || caughtError?.response?.status || 500;
        const message = caughtError instanceof Error ? caughtError.message : 'An internal server error occurred.';
        if (caughtError instanceof OpenAI.APIError) { console.error('OpenAI API Error Details:', { status: caughtError.status, message: caughtError.message, code: caughtError.code, type: caughtError.type }); }
        return { statusCode: status, headers, body: JSON.stringify({ error: message }) };
    }
};

