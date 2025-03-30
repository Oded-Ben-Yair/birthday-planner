# AI-Powered Birthday Planning System

## Description

An AI-driven application designed to simplify birthday party planning by generating personalized, detailed event suggestions based on user preferences. Enter your requirements, and let the AI create tailored party plans, enhanced with real-time web search for relevant local information.

## Key Features

* **Personalized Input:** Collects key details via a multi-step form:
    * Birthday Person's Name & Age
    * Party Theme
    * Guest Composition (Adults & Children)
    * Budget Amount & Currency (NIS, USD, EUR)
    * Location Details (City, **Country**, & Setting)
    * Activity Preferences
    * Specific Food & Drink Wishes
    * Other Preferences/Notes
* **AI-Generated Plans with Web Search:** Leverages OpenAI (**GPT-4o** with **native web search** and **DALL-E 3**) via a secure Netlify serverless function proxy to generate three distinct plan options (e.g., budget-friendly, premium, unique) tailored to user input.
* **Detailed & Grounded Suggestions:** Each plan provides comprehensive ideas for:
    * **Venues:** Including description, cost estimate, amenities, suitability (using web search results where possible for names/types, plus example search terms).
    * **Activity Schedules:** A timed itinerary for the event.
    * **Catering:** Menu ideas reflecting preferences, cost estimate, serving style (using web search results where possible for names/types, plus example search terms).
    * **Guest Engagement:** Ideas for icebreakers, activities, party favors, and entertainment (using web search results where possible for entertainer types, plus example search terms).
* **Smart Invitation Generator:** Creates invitation text and a unique DALL-E 3 background image based on the selected plan and chosen style template.
* **AI Budget Optimizer:** Refines a selected plan based on user-defined priorities and the specified numeric budget, providing an optimized plan suggestion **including a summary of the changes made**.

## Technology Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **AI:** OpenAI API (**GPT-4o**, DALL-E 3, Native Web Search Tool)
* **Backend:** Netlify Functions (Serverless Node.js Proxy)
* **Development:** Netlify Dev

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Oded-Ben-Yair/birthday-planner.git](https://github.com/Oded-Ben-Yair/birthday-planner.git)
    cd birthday-planner
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    * An OpenAI API key is required.
    * Set the `OPENAI_API_KEY` environment variable in your Netlify deployment environment (Site configuration > Environment variables). This is used by the Netlify Function.
    * For local development using `netlify dev`, create a `.env` file in the project root:
        ```
        # .env
        OPENAI_API_KEY=sk-...your-key-here...
        ```
    * `netlify dev` will inject this key for local testing. The application uses a Netlify function proxy (`openai-proxy`) to securely handle the API key.

4.  **Run Locally:**
    ```bash
    netlify dev
    ```
5.  **Access:** Open your browser to the local URL provided by Vite (usually `http://localhost:5173`).

## Usage

1.  Open the application in your browser.
2.  Complete the multi-step form, providing party details including City and Country.
3.  Click "Generate Birthday Plans". The AI will use web search to inform its suggestions for local venues/vendors.
4.  Review the three generated plans on the Results page. Check for citations or more specific examples based on search.
5.  Select your preferred plan.
6.  Use the "Smart Invitation" tab to generate invitation text and an image.
7.  Use the "Budget Optimizer" tab to fine-tune the selected plan based on category priorities and your budget. Review the optimization summary provided.

## How It Works

1.  The **React frontend** collects user input (including city and country).
2.  On submission, data is sent to a **Netlify Function (`openai-proxy.js`)**.
3.  This proxy function:
    * Constructs prompts incorporating user details and specific instructions.
    * Securely adds the `OPENAI_API_KEY`.
    * Calls the **OpenAI API** (`gpt-4o` for plan generation, `dall-e-3` for images).
    * For plan generation, it enables the native `web_search_preview` tool, providing the user's location. The AI model decides when to use search to find relevant, current information.
    * Parses and validates the AI response (which may include web search citations).
4.  The Netlify Function sends the processed data back to the frontend.
5.  The **React frontend** displays the results. Plan data is temporarily stored in `localStorage`.

## Roadmap

Potential future enhancements include:

* **Plan Editing:** Allowing users to directly modify generated plan details within the UI.
* **Display Optimization Summary:** Update the UI to clearly display the `optimizationSummary` text provided by the AI.
* **Database Integration:** Migrating from `localStorage` to a persistent database (e.g., Firebase Firestore, Supabase) for saving plans.
* **Enhanced Vendor Integration:** Adding direct web search links based on AI suggestions or exploring vendor APIs.
* **User Accounts & Saving:** Implementing user accounts to save multiple party plans.
* **UI/UX Refinements:** Continuously improving the user interface and experience.

## License

MIT License

