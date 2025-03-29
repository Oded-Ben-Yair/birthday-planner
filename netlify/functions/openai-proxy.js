// netlify/functions/openai-proxy.js
import OpenAI from 'openai';

// Initialize OpenAI client securely using the environment variable
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // No dangerouslyAllowBrowser here - this runs on the server
});

// Define the handler function for Netlify
export const handler = async (event) => {
    // Allow requests only from your site's origin in production
    const allowedOrigin = process.env.URL; // Netlify provides the site's primary URL
    const requestOrigin = event.headers.origin;

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
                 model: "gpt-4", // Or your preferred model
                 messages: [
                     { role: "system", content: `You are BirthdayPlannerAI...` }, // Use your full system prompt
                     { role: "user", content: `Generate three distinct birthday plans for a ${data.userInput.age}-year-old...${JSON.stringify(data.userInput)}` } // Use your full user prompt, passing necessary data
                 ],
                 temperature: 0.7,
                 response_format: { type: "json_object" }, // If required by your parsing
             });
             const content = response.choices[0]?.message?.content;
             if (!content) throw new Error("No content returned from OpenAI chat completion");
             // IMPORTANT: OpenAI might return a JSON *string*. The function should parse and return the actual object.
             // Or, if OpenAI returns the object directly (with response_format), parse that.
             // Assuming OpenAI returns a string that needs parsing, based on original api.ts
             responseData = JSON.parse(content); // May need adjustment based on actual OpenAI response format for { type: "json_object" }

        } else if (action === 'generateInvitation' && data.plan && data.template && data.date && data.time) {
            // Generate invitation text
            const textResponse = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                   { role: "system", content: `You are an expert in creating engaging... invitations.` },
                   { role: "user", content: `Create a birthday invitation text for a ${data.plan.description} birthday... at ${data.plan.venue.name} on ${data.date} at ${data.time}. Style: ${data.template}...` }
                ],
                temperature: 0.7,
            });
             const text = textResponse.choices[0]?.message?.content || "Join us!";

            // Generate invitation image
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: `Create a birthday invitation image for a ${data.plan.description} themed birthday party. Style: ${data.template}. No text.`,
                n: 1,
                size: "1024x1024",
            });
            const imageUrl = imageResponse.data[0]?.url || "";

            responseData = { text, imageUrl, template: data.template };

        } else if (action === 'optimizeBudget' && data.plan && data.priorities) {
             // Call OpenAI for budget optimization (Chat Completion)
             const response = await openai.chat.completions.create({
                 model: "gpt-4",
                 messages: [
                     { role: "system", content: `You are a budget optimization expert...` },
                     { role: "user", content: `Optimize this birthday plan: ${JSON.stringify(data.plan)} based on priorities: ${JSON.stringify(data.priorities)}...` }
                 ],
                 temperature: 0.7,
                 response_format: { type: "json_object" },
             });
             const content = response.choices[0]?.message?.content;
             if (!content) throw new Error("No content returned from OpenAI budget optimization");
             // Assuming OpenAI returns a string that needs parsing
             responseData = JSON.parse(content); // May need adjustment

        } else {
            // Action not recognized
            throw new Error(`Invalid action or missing data for action: ${action}`);
        }

        // Return successful response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(responseData), // Send the data back to the frontend
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: error.response?.status || 500, // Use OpenAI error status if available
            headers,
            body: JSON.stringify({ error: error.message || 'An internal server error occurred' }),
        };
    }
};