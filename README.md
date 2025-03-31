# AI-Powered Birthday Planning System

[![Netlify Status](about:sanitized)](https://app.netlify.com/sites/birthday-planner/deploys) **Live Demo:** [https://birthday-planner.netlify.app/](https://birthday-planner.netlify.app/)

## Description

An AI-driven application designed to simplify birthday party planning by generating personalized, detailed event suggestions based on user preferences. Enter your requirements, and let the AI create tailored party plans, enhanced with real-time web search for relevant local information.

## Key Features

  * **Personalized Input:** Collects key details via a multi-step form (Name, Age, Theme, Guests, Budget, Location, Activities, Food/Drink Preferences, Notes).
  * **AI-Generated Plans:** Leverages OpenAI (GPT-4o with native web search and DALL-E 3) via a secure Netlify Function proxy to generate three distinct plan options (e.g., budget-friendly, premium, unique).
  * **Detailed & Grounded Suggestions:** Provides comprehensive ideas for Venues, Activity Schedules, Catering, and Guest Engagement, informed by web search results where applicable.
  * **Smart Invitation Generator:** Creates invitation text and a unique DALL-E 3 background image based on the selected plan and style template.
  * **AI Budget Optimizer:** Refines a selected plan based on user-defined priorities and budget, providing an optimized plan suggestion and a summary of changes.

## Technology Stack

  * **Frontend:** React, TypeScript, Vite, Tailwind CSS
  * **AI:** OpenAI API (GPT-4o, DALL-E 3, Native Web Search Tool)
  * **Backend:** Netlify Functions (Serverless Node.js Proxy)
  * **Deployment:** Netlify

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
      * Set the `OPENAI_API_KEY` environment variable in your Netlify deployment environment (Site configuration \> Build & deploy \> Environment \> Environment variables).
      * For local development using `netlify dev`, create a `.env` file in the project root:
        ```plaintext
        # .env
        OPENAI_API_KEY=sk-...your-key-here...
        ```
      * The application uses a Netlify Function proxy (`openai-proxy`) to securely handle the API key; the key is never exposed to the frontend.

4.  **Run Locally:**

    ```bash
    netlify dev
    ```

5.  **Access:** Open your browser to the local URL provided (usually `http://localhost:8888` or similar, check terminal output).

## Usage

1.  Open the application via the [Live Demo link](https://birthday-planner.netlify.app/) or your local development URL.
2.  Complete the multi-step form, providing party details including City and Country.
3.  Click "Generate Birthday Plans".
4.  Review the three generated plans on the Results page.
5.  Select a plan to view its details.
6.  From the detail page, use the "Create Invitation" button to generate invitation text and an image.
7.  Use the "Optimize Budget" button to fine-tune the selected plan based on category priorities and your budget.

## How It Works

1.  The **React frontend** collects user input.
2.  On submission, data is sent to the **`openai-proxy` Netlify Function**.
3.  This proxy function securely adds the `OPENAI_API_KEY` and calls the appropriate **OpenAI API** endpoints (`gpt-4o` for plan generation/optimization, `dall-e-3` for images).
4.  For plan generation, it enables the native `web_search_preview` tool, allowing the AI model to search for relevant, current information based on the user's location.
5.  The Netlify Function parses and validates the AI response before sending the processed data back to the frontend.
6.  The **React frontend** displays the results. Plan data is temporarily stored in `localStorage` between page views.

