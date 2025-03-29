// netlify/functions/openai-proxy.js
import OpenAI from 'openai';

// Initialize OpenAI client securely using the environment variable
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Define the handler function for Netlify
export const handler = async (event) => {
    // Allow requests only from your site's origin in production
    const allowedOrigin = process.env.URL; // Netlify provides the site's primary URL
    // const requestOrigin = event.headers.origin; // Can use requestOrigin for stricter checks if needed

    // Basic CORS check - enhance if needed
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigin || '*', // Allow deployed site or all in dev
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // No Content
            headers,
            body: '',
        };
    }

    // Only allow POST requests for actual API calls
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed', headers };
    }

    try {
        // Get the data sent from the frontend
        const payload = JSON.parse(event.body || '{}');
        const { action, ...data } = payload; // Expect an 'action' field to determine what to do

        let responseData;

        // --- Handle Different Actions ---
        if (action === 'generatePlans' && data.userInput) {
             // Call OpenAI for plan generation (Chat Completion)
             const response = await openai.chat.completions.create({
                 model: "gpt-3.5-turbo", // CHANGED to potentially faster model
                 messages: [
                     // --- PASTE YOUR FULL SYSTEM PROMPT FOR PLAN GENERATION HERE ---
                     { role: "system", content: `You are BirthdayPlannerAI, an expert event planner specializing in creating memorable birthday celebrations. Your task is to help users plan the perfect birthday event by generating personalized recommendations based on their preferences. You will maintain a friendly, enthusiastic tone while providing practical and creative suggestions.` },
                     // --- PASTE YOUR FULL USER PROMPT FOR PLAN GENERATION HERE (using data.userInput) ---
                     { role: "user", content: `Generate three distinct birthday plans for a ${data.userInput.age}-year-old with a ${data.userInput.theme} theme. Budget level: ${data.userInput.budget}. Location: ${data.userInput.location.city} (${data.userInput.location.setting}). Guest count: ${data.userInput.guestCount}. Preferred activities: ${data.userInput.activities.join(', ')}. Additional preferences: ${data.userInput.additionalPreferences || 'None'}. Return the response as a valid JSON object containing a single key "plans" which is an array of three plan objects. Each plan should include: 1. A unique id, name, and brief description 2. Venue recommendation with name, description, cost range, amenities, and suitability 3. Activity schedule with time slots 4. Catering suggestions with menu items (appetizers array, mainCourses array, desserts string, beverages array), estimated cost, and serving style 5. Guest engagement ideas with icebreakers, interactive elements, photo opportunities, and party favors. The first plan should be DIY-focused and budget-friendly. The second plan should focus on premium experiences with convenience as a priority. The third plan should highlight unique, memorable activities or adventure elements.` }
                 ],
                 temperature: 0.7,
                 // response_format removed previously
             });
             const content = response.choices[0]?.message?.content;
             if (!content) throw new Error("No content returned from OpenAI chat completion (generatePlans)");
             responseData = JSON.parse(content);

        } else if (action === 'generateInvitation' && data.plan && data.template && data.date && data.time) {
            // Generate invitation text
            const textResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // CHANGED to potentially faster model
                messages: [
                    // --- PASTE YOUR FULL SYSTEM PROMPT FOR INVITATION TEXT HERE ---
                    { role: "system", content: `You are an expert in creating engaging and appropriate birthday invitations.` },
                    // --- PASTE YOUR FULL USER PROMPT FOR INVITATION TEXT HERE (using data.plan, data.date, etc.) ---
                    { role: "user", content: `Create a birthday invitation text for a ${data.plan.description} birthday. The event will be at ${data.plan.venue.name} on ${data.date} at ${data.time}. The style should be ${data.template}. Keep it concise but engaging, and include all necessary details.` }
                ],
                temperature: 0.7,
            });
             const text = textResponse.choices[0]?.message?.content || "Join us for a birthday celebration!";

            // Generate invitation image (Keep DALL-E 3)
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: `Create a birthday invitation image for a ${data.plan.description} themed birthday party. Style: ${data.template}. No text in the image.`,
                n: 1,
                size: "1024x1024",
            });
            const imageUrl = imageResponse.data[0]?.url || "";

            responseData = { text, imageUrl, template: data.template };

        } else if (action === 'optimizeBudget' && data.plan && data.priorities) {
             // Call OpenAI for budget optimization (Chat Completion)
             const response = await openai.chat.completions.create({
                 model: "gpt-3.5-turbo", // CHANGED to potentially faster model
                 messages: [
                    // --- PASTE YOUR FULL SYSTEM PROMPT FOR BUDGET OPTIMIZATION HERE ---
                     { role: "system", content: `You are a budget optimization expert for event planning.` },
                    // --- PASTE YOUR FULL USER PROMPT FOR BUDGET OPTIMIZATION HERE (using data.plan, data.priorities) ---
                     { role: "user", content: `Optimize this birthday plan: ${JSON.stringify(data.plan)} based on the following budget priorities (1-5 scale, 5 being highest priority): Venue: ${data.priorities.venue} Food & Beverages: ${data.priorities.food} Activities & Entertainment: ${data.priorities.activities} Decorations: ${data.priorities.decorations} Party Favors: ${data.priorities.partyFavors}. Return an optimized version of the plan as valid JSON object containing a single key "optimizedPlan". Maintain the same structure but with adjustments to reflect the priorities. Increase quality/options for high-priority items and suggest cost-saving alternatives for low-priority items.` }
                 ],
                 temperature: 0.7,
                 // response_format removed previously
             });
             const content = response.choices[0]?.message?.content;
             if (!content) throw new Error("No content returned from OpenAI budget optimization");
             responseData = JSON.parse(content);

        } else {
            // Action not recognized or missing data
            console.error("Invalid action or missing data received:", { action, data });
            throw new Error(`Invalid action or missing data for action: ${action}`);
        }

        // Return successful response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(responseData),
        };

    } catch (error) {
        console.error('Error processing request in Netlify function:', error);
        const status = error.status || error.response?.status || 500;
        const message = error.message || 'An internal server error occurred.';
        return {
            statusCode: status,
            headers,
            body: JSON.stringify({ error: message }),
        };
    }
};