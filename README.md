# AI-Powered Birthday Planning System

## Overview

This project implements an AI-Powered Birthday Planning System as detailed in the provided implementation guide. It's a web application built using React, Vite, TypeScript, and Tailwind CSS that leverages the OpenAI API to generate personalized birthday party plans based on user inputs. Users can specify details like age, theme, budget, location, and preferences to receive tailored recommendations for venues, activities, catering, and more. The application also features AI-generated invitations and budget optimization capabilities.

## Features

* **Personalized Plan Generation:** Creates multiple distinct birthday plan options based on user input (age, theme, guest count, budget, location, activities, preferences).
* **Detailed Recommendations:** Each plan includes suggestions for:
    * Venue (name, description, cost, amenities, suitability)
    * Activity Schedule (timeline with descriptions)
    * Catering (menu items, beverages, cost, serving style)
    * Guest Engagement (icebreakers, interactive elements, photo ops, party favors)
* **Smart Invitation Generation:** Creates AI-generated invitation text and suggests relevant imagery based on the selected plan and theme. Users can choose different template styles (classic, playful, themed, minimalist).
* **Budget Optimization:** Allows users to adjust priorities (venue, food, activities, etc.) and receive an AI-optimized version of their selected plan.
* **Multi-Step User Form:** Guides the user through providing necessary details for plan generation.
* **Interactive Plan Viewing:** Displays generated plans in expandable cards for easy comparison and detail exploration.

## Tech Stack

* **Frontend:** React, Vite, TypeScript
* **Styling:** Tailwind CSS
* **API:** OpenAI API (GPT-4 for text, DALL-E 3 for images)
* **Forms:** React Hook Form
* **State Management:** React Query (`@tanstack/react-query`), React `useState`
* **Routing:** React Router DOM
* **Development Environment:** Node.js, npm, Ubuntu

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone git@github.com:Oded-Ben-Yair/birthday-planner.git
    cd birthday-planner
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    * Create a `.env` file in the project root directory:
        ```bash
        touch .env
        ```
    * Add your OpenAI API key to the `.env` file:
        ```env
        VITE_OPENAI_API_KEY=your_openai_api_key_here
        ```
    * **Note:** The `.env` file is included in `.gitignore` and should *not* be committed to version control.

## Running Locally

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to `http://localhost:5173` (or the address provided in the terminal).

## Building for Production

1.  **Create a production build:**
    ```bash
    npm run build
    ```
2.  The production-ready files will be located in the `dist/` directory.
