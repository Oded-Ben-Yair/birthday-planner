# AI-Powered Birthday Planning System

## Description

An AI-driven application designed to simplify birthday party planning by generating personalized, detailed event suggestions based on user preferences. Enter your requirements, and let the AI create tailored party plans!

## Key Features

* **Personalized Input:** Collects key details via a multi-step form:
    * Birthday Person's Name & Age
    * Party Theme
    * Guest Composition (Adults & Children)
    * Budget Amount & Currency (NIS, USD, EUR)
    * Location Details (City & Setting)
    * Activity Preferences
    * Specific Food & Drink Wishes
    * Other Notes/Preferences
* **AI-Generated Plans:** Leverages OpenAI to create three distinct plan options (e.g., budget-friendly, premium, unique) tailored to user input.
* **Detailed Suggestions:** Each plan provides comprehensive ideas for:
    * **Venues:** Including description, cost estimate, amenities, suitability, and example search terms.
    * **Activity Schedules:** A timed itinerary for the event.
    * **Catering:** Menu ideas reflecting preferences, cost estimate, serving style, and example search terms.
    * **Guest Engagement:** Ideas for icebreakers, activities, party favors, and example entertainment search terms.
* **Smart Invitation Generator:** Creates invitation text and a unique DALL-E 3 background image based on the selected plan and chosen style template.
* **AI Budget Optimizer:** Refines a selected plan based on user-defined priorities for different categories, aiming to align with the specified numeric budget.

## Technology Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **AI:** OpenAI API (GPT-3.5 Turbo, DALL-E 3)
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
    * Set the `OPENAI_API_KEY` environment variable in your Netlify deployment environment (Site configuration > Environment variables).
    * For local development using `netlify dev`, create a `.env` file in the project root:
        ```
        # .env
        OPENAI_API_KEY=sk-...your-key-here...
        ```
    * The application uses a Netlify function proxy (`openai-proxy`) to securely handle the API key.

4.  **Run Locally:**
    ```bash
    netlify dev
    ```
5.  **Access:** Open your browser to the local URL provided (usually `http://localhost:5173`).

## Usage

1.  Open the application in your browser.
2.  Fill out the multi-step form with your party details and preferences.
3.  Click "Generate Birthday Plans".
4.  Review the three generated plans on the Results page.
5.  Select your preferred plan.
6.  Navigate to the "Smart Invitation" tab to generate invitation text and an image.
7.  Navigate to the "Budget Optimizer" tab to fine-tune the selected plan based on category priorities and your budget.

## How It Works

The application follows this flow:

1.  The **React frontend** collects user input.
2.  On submission, the frontend sends the data to a **Netlify Function (`openai-proxy.js`)**.
3.  This serverless function acts as a secure proxy:
    * It receives the request data.
    * It constructs prompts based on the user input and the requested action (generate plans, invitation, optimize budget).
    * It securely adds the `OPENAI_API_KEY` (read from environment variables).
    * It calls the appropriate **OpenAI API** endpoints (Chat Completions for text/plans, Image Generation for invitations).
    * It parses and validates the AI response.
4.  The Netlify Function sends the processed data (plans, invitation components, optimized plan) back to the frontend.
5.  The **React frontend** displays the results to the user. Plan data is temporarily stored in `localStorage` for navigation between the form and results pages.
