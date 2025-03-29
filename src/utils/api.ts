import openai from '../config/openai';
import type { UserInput, BirthdayPlan, SmartInvitation, BudgetPriorities } from '../types'; // Added BudgetPriorities based on its usage

export async function generateBirthdayPlans(userInput: UserInput): Promise<BirthdayPlan[]> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are BirthdayPlannerAI, an expert event planner specializing in
creating memorable birthday celebrations. Your task is to help users plan the
perfect birthday event by generating personalized recommendations based on
their preferences. You will maintain a friendly, enthusiastic tone while providing
practical and creative suggestions.`
                },
                {
                    role: "user",
                    content: `Generate three distinct birthday plans for a ${userInput.age}-year-
old with a ${userInput.theme} theme.
Budget level: ${userInput.budget}.
Location: ${userInput.location.city} (${userInput.location.setting}).
Guest count: ${userInput.guestCount}.
Preferred activities: ${userInput.activities.join(', ')}.
Additional preferences: ${userInput.additionalPreferences || 'None'}.
Return the response as a valid JSON array with three plan objects. Each
plan should include:
1. A unique id, name, and brief description
2. Venue recommendation with name, description, cost range,
amenities, and suitability
3. Activity schedule with time slots
4. Catering suggestions with menu items, beverages, estimated cost,
and serving style
5. Guest engagement ideas with icebreakers, interactive elements,
photo opportunities, and party favors
The first plan should be DIY-focused and budget-friendly.
The second plan should focus on premium experiences with
convenience as a priority.
The third plan should highlight unique, memorable activities or
adventure elements.`
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("No content returned from OpenAI");
        }

        // Ensure parsing and return are inside the try block
        const parsedContent = JSON.parse(content);
        return parsedContent.plans;

    } catch (error) {
        console.error("Error generating plans:", error);
        throw error;
    }
}

export async function generateSmartInvitation(
    plan: BirthdayPlan,
    template: 'classic' | 'playful' | 'themed' | 'minimalist',
    date: string,
    time: string
): Promise<SmartInvitation> {
    try {
        // Generate invitation text
        const textResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert in creating engaging and appropriate birthday
invitations.`
                },
                {
                    role: "user",
                    content: `Create a birthday invitation text for a ${plan.description} birthday.
The event will be at ${plan.venue.name} on ${date} at ${time}.
The style should be ${template}.
Keep it concise but engaging, and include all necessary details.`
                }
            ],
            temperature: 0.7,
        });

        // Generate invitation image
        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Create a birthday invitation image for a ${plan.description} themed
birthday party.
Style: ${template}. No text in the image.`,
            n: 1, // Corrected potential typo from prompt `prompt: ...,n: 1,` to separate parameters
            size: "1024x1024",
        });

        return {
            text: textResponse.choices[0].message.content || "Join us for a birthday celebration!",
            imageUrl: imageResponse.data[0].url || "",
            template: template
        };
    } catch (error) {
        console.error("Error generating invitation:", error);
        throw error;
    }
}

export async function optimizeBudget(plan: BirthdayPlan, priorities: BudgetPriorities): Promise<BirthdayPlan> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a budget optimization expert for event planning.`
                },
                {
                    role: "user",
                    content: `Optimize this birthday plan based on the following budget priorities
(1-5 scale, 5 being highest priority):
Venue: ${priorities.venue}
Food & Beverages: ${priorities.food}
Activities & Entertainment: ${priorities.activities}
Decorations: ${priorities.decorations}
Party Favors: ${priorities.partyFavors}
Original plan: ${JSON.stringify(plan)}
Return an optimized version of the plan as valid JSON, maintaining the
same structure but with adjustments to reflect the priorities.
Increase quality/options for high-priority items and suggest cost-saving
alternatives for low-priority items.`
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("No content returned from OpenAI");
        }
        // Ensure parsing and return are inside the try block
        return JSON.parse(content).optimizedPlan; // Assuming the API returns { "optimizedPlan": ... }

    } catch (error) {
        console.error("Error optimizing budget:", error);
        throw error;
    }
}
