# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands and environment

- **Node / npm versions**: enforced via `package.json` engines – Node `>=20.0.0`, npm `>=10.0.0`.
- **Install dependencies** (from repo root):
  - `npm install`
- **Start dev server** (Create React App):
  - `npm start`
  - Serves the SPA on `http://localhost:3000`. The frontend expects a backend at `REACT_APP_API_BASE_URL` (defaults to `http://localhost:5000` in `src/services/backendClient.js`).
- **Run tests** (Jest via `react-scripts`):
  - All tests in watch mode: `npm test`
  - Single test file: `npm test -- App.test.js` (replace with the file name or pattern)
  - Single test name: `npm test -- -t "renders landing page"`
- **Build for production**:
  - Local build: `npm run build`
  - Netlify’s build (see `netlify.toml`): `npm install --legacy-peer-deps && npm run build`, publishing the `build` directory.
- **Linting**:
  - There is no dedicated `lint` script; ESLint runs as part of `react-scripts` during `npm start` and `npm run build` according to `eslintConfig` in `package.json`.

### Environment configuration

Environment variables are consumed via `process.env` and must be prefixed with `REACT_APP_` to be visible in the browser build (Create React App constraint):

- **Backend base URL** (used by `src/services/backendClient.js`):
  - `REACT_APP_API_BASE_URL` – e.g. `http://localhost:5000` for local dev.
- **AI / external services** (from `src/services/apiConfig.js`):
  - `REACT_APP_OPENAI_API_KEY`
  - `REACT_APP_DEEPSEEK_API_KEY`
  - `REACT_APP_RUNWAY_ML_API_KEY`
  - `REACT_APP_GEMINI_API_KEY`
  - `REACT_APP_TYPESENSE_API_KEY`
  - `REACT_APP_TYPESENSE_HOST` (defaults to `https://ts.jet-code.com` if unset)

The root `README.md` still shows un-prefixed keys (e.g. `OPENAI_API_KEY`); the actual runtime code uses the `REACT_APP_`-prefixed variants above.

Netlify-specific settings are in `netlify.toml` (SPA redirect `/* -> /index.html` and `NPM_FLAGS=--legacy-peer-deps`).

## High-level frontend architecture

### Entry point, routing, and layout

- **Entry**: `src/index.js`
  - Creates the React root, wraps the app with `BrowserRouter`, and applies `UserProvider` and `MealPlanProvider` context providers.
  - Sets up a custom `--fixed-svh` CSS variable based on `window.visualViewport`/`innerHeight` to stabilize viewport height on mobile.
- **Application shell**: `src/App.js`
  - Wraps `AppContent` again with `UserProvider` and `MealPlanProvider` (contexts are thus available regardless of how `App` is mounted).
  - Manages the global preload overlay (Lottie animation) and a Safari-specific `--vh` CSS variable for viewport height.
  - Owns the top-level React Router `<Routes>` for:
    - `/` (landing), `/wizard` (preference wizard), `/reviewmeals` (review generated plan), `/mymeals` (saved plan view)
    - Static pages under `components/Pages` (`/aboutus`, `/privacy`, `/cookies`, `/contact`, `/myprofile`, `/premium`, `/testing`) and catch-all 404.
  - Uses `Header` (`src/components/Common`) as a persistent layout header, wired with callbacks for logo navigation, country changes, “My meals” navigation, and back-button behavior.
- **Route guards and navigation rules**: `src/components/RouteGuards/ProtectedRoute.js`
  - `LandingGuard` and `WizardGuard` redirect users with an existing saved meal plan straight to `/mymeals` on initial load.
  - `ReviewMealsGuard` and `MyMealsGuard` enforce that `/reviewmeals` and `/mymeals` are only reachable when the wizard has completed, there’s an in-progress meal plan, or a saved meal plan.
  - Guards rely on in-progress state stored in localStorage via `utils/inProgressMealPlan` and the `hasSavedMealPlan` / `wizardCompleted` flags managed in `AppContent`.
- **Navigation blocking and tries drawer**:
  - `useNavigationBlocker` (in `src/hooks/useNavigationBlocker.js`) is used in `AppContent` to intercept navigation away from `/reviewmeals` and `/mymeals`.
  - When navigation would leave those routes while content is visible, `App` shows `TriesLeftDrawer` (`src/components/PremiumPromo/TriesLeftDrawer`), and only proceeds when the user confirms.
  - `handleTryAgainFromDrawer` can delete the existing meal plan via `backendClient.delete('/api/mealplan')`, reset `MealPlanContext`, clear in-progress state, and navigate back to `/wizard`.

### State management via Context

- **UserContext**: `src/contexts/UserContext.js`
  - Centralizes user-related preferences, not just authentication:
    - `numberOfPeople`, budget range, selected cuisine, dietary preferences, and `cookingStyle` (per-meal-type complexity and 2-day cooking flags).
  - Handles **migration** from older `cookingFrequency` formats to the newer structured `cookingStyle` object.
  - Supports both guest and authenticated flows:
    - Guests: preferences are persisted to localStorage under `9meals_preferences` and auto-loaded on startup.
    - Authenticated users: preferences are fetched from and saved to `/api/user/preferences` via `backendClient`; auto-save is debounced and only starts after initial load.
  - Integrates with `countryService` and `country_food_preferences.json` to derive a default budget range per country (including currency symbol).
  - Exposes helpers like `savePreferences`, `fetchPreferences`, and `resetPreferencesLoaded` for explicit control in components.

- **MealPlanContext**: `src/contexts/MealPlanContext.js`
  - Owns the live meal-planning state used across wizard, review, and saved-meals flows:
    - `mealPlan`, `productList`, `totalCost`, `maxStorageTime`, `budget`, and `leftovers`.
    - “I have it” state (`haveItState`) and `adjustedTotalCost`, which recomputes the total excluding items the user already owns.
    - `shoppingModeState` to track checklist-like state in shopping mode.
  - Provides **streaming-related state** (`isStreaming`, `streamProgress`) and helpers (`startStreaming`, `updateStreamProgress`, `endStreaming`) so the UI can progressively render AI-generated content.
  - `updateProductList` merges incremental product-list chunks by category while de-duplicating items.
  - `updateHaveItState` recalculates `adjustedTotalCost` whenever a product’s “have it” flag changes, using a supplied `getCurrencyInfo` callback from the UI.
  - `resetMealPlan` clears all meal-related state and also clears the Alternative Recipes cache via a dynamic import of `components/MealPlan/AlternativeRecipes`.

### Services and backend integration

- **HTTP client**: `src/services/backendClient.js`
  - A singleton wrapper around `fetch` with:
    - Base URL from `REACT_APP_API_BASE_URL` (default `http://localhost:5000`).
    - Default 3s timeout (overridable per request) using `AbortController`.
    - Automatic `Authorization: Bearer <authToken>` injection from localStorage.
    - Centralized error handling, with custom `TimeoutError`, `NetworkError`, and `RequestCancelledError` classes.
    - `cancelAllRequests()` for graceful teardown (e.g., on logout).
  - All backend endpoints (meal plan CRUD, limits, preferences, etc.) go through this client.

- **API service façade**: `src/services/apiService.js`
  - Re-exports granular service functions for meal planning, recipe details, grocery lists, and AI configuration, while also exposing a namespaced `services` object:
    - `services.mealPlan.fetch` → AI meal plan generation
    - `services.recipeDetails.fetch` / `.generateImage`
    - `services.groceryList.fetch` / `.processWithGemini` / `.calculatePrice`
    - `services.country.get` / `.set` / `.reset`
  - Manages process-wide **user country state**, backed by localStorage (`COUNTRY_STORAGE_KEY`) and IP-based detection (`detectCountryFromIP` in `countryService`).
  - Exposes both async (`getUserCountry`) and sync (`getUserCountrySync`) accessors, plus `setUserCountry` and `resetUserCountry`.

- **Country and currency logic**: `src/services/countryService.js`
  - Defines `SUPPORTED_COUNTRIES` (currently `['Spain']`) and `DEFAULT_COUNTRY` (`'Spain'`).
  - Normalizes country names from various user/IP-derived formats and maps them to canonical names.
  - Provides `getCountryMeasurementSystem` and `usesMetricSystem` using `country_food_preferences.json` and a small imperial-country list.
  - `getCountryCurrency` maps country → `{ code, symbol }`, used across grocery pricing and budget display (e.g., Spain → EUR/€; USA → USD/$).

### AI integration and domain services

- **AI configuration and clients**: `src/services/apiConfig.js`
  - Centralizes AI-related configuration and clients:
    - OpenAI via the `openai` client (`dangerouslyAllowBrowser: true`).
    - Gemini via `@google/generative-ai` (`geminiAI`).
    - Runware image generation via `initializeRunware()`.
    - Typesense host/key for product search.
  - Declares `ACTIVE_PROVIDER` (currently `'openai'`) and `MODEL_CONFIG` mapping logical tasks (completion, details, ingredients, grocery, alternative) to specific models per provider (OpenAI, DeepSeek, Gemini).
  - Provides helpers:
    - `cleanJsonResponse` to strip markdown fences and isolate JSON from AI responses.
    - `fetchDeepSeekCompletion` as a wrapper around DeepSeek’s chat-completions endpoint with optional streaming and reasoning.

- **Meal plan generation**: `src/services/mealPlanService.js`
  - Implements AI-backed meal plan generation using OpenAI or DeepSeek, with a **streaming architecture** that incrementally parses structured JSON from partial responses.
  - Uses utilities like `generateMealPlanPrompt` (from `src/utils/promptGenerators`) and `cleanJsonResponse` to create and post-process prompts.
  - Integrates with `testFlowLogger` (`storePromptForTestFlow`, `clearStoredPrompt`) to capture prompts for offline debugging/testing.
  - Designed to cooperate with `MealPlanContext` streaming state for progressive UI updates.

- **Recipe details and images**: `src/services/recipeDetailsService.js`
  - Fetches rich recipe details (cooking instructions, visual descriptions, tips, equipment) via streaming AI responses.
  - Contains robust partial-JSON recovery logic (e.g., `extractPartialRecipeData`, `repairJson`) to salvage usable data from malformed or truncated responses.
  - Uses `initializeRunware` for visual generation, and `formatInstructionsForImagePrompt` to derive high-signal prompts from the cooking steps.

- **Grocery list, pricing, and budget handling**: `src/services/groceryListService.js`
  - `fetchEnhancedGroceryList` orchestrates grocery list generation for a given meal plan, number of people, and budget, delegating to `processGroceryListAI` (`src/utils/aiGroceryFallback`) and streaming partial results back to the UI via `onProgress` / `onChunkProcessed` callbacks.
  - `processGroceryListWithGemini` is a Gemini-based implementation that:
    - Loads country-specific product data via `getCountryProducts` (`src/utils/countryProductsLoader`) and `getCountryCurrency`.
    - Filters to a **relevant** subset of products using `getRelevantProducts`, significantly shrinking the payload sent to Gemini.
    - Asks Gemini to produce a structured JSON grocery list grouped by category, with realistic pricing, leftovers, and total cost.
  - Provides a pricing fallback stack:
    - `calculateCorrectPrice` attempts to match requested items to country product databases and computes how many units to buy and the total/ per-unit prices.
    - `getFallbackPricing` and `calculateEnhancedTotalCost` compute reasonable prices for items missing from the database, based on broad product categories and country currency.
  - Helper functions like `guessIngredientCategory`, `findRelevantProducts`, and `getRandomProducts` support robust matching even when inputs are messy.

Many of the root-level `*_GROCERY_*`, `*_FLOW*`, `*_SUMMARY*`, and `*_BUG_TICKET*` markdown files document the evolution of this grocery/meal-plan pipeline and important edge cases. When making non-trivial changes to AI prompts, grocery calculations, or country-specific pricing, consulting those documents (plus `PROJECT_OVERVIEW.md`) is strongly recommended.

### Analytics and experimentation

- **Amplitude wrapper**: `src/analytics`
  - `index.js` re-exports the main public API:
    - Initialization and user identity: `initAmplitude`, `setUserId`, `clearUserId`, `setUserProperties`, `incrementUserProperty`, `flush`.
    - High-level event functions from `events.js` (e.g., `trackLandingViewed`, `trackWizardStarted`, `trackMealSetRequested`, `trackMealSetGenerationSucceeded/Failed`, `trackSaveClicked`, `trackMealSetSaved`, `trackLimitReached`, `trackMyMealsViewed`, etc.).
    - ID helpers from `flowId`, `generationId`, and `mealSetId` to correlate events across flows and sessions.
    - Event/enum constants from `constants.js` for consistent analytics payloads.
  - `App.js` calls `initAmplitude()` once on mount and sets user properties such as `country`, `language`, and `is_guest` / `is_registered` based on auth token presence.

### Internationalization and locales

- **i18n setup**: `src/services/i18n.js`
  - Uses `i18next`, `react-i18next`, and `i18next-browser-languagedetector`.
  - Supports at least English (`en`) and Spanish (`es`) via JSON namespace files under `src/locales/en` and `src/locales/es` (`common`, `auth`, `wizard`, `mealplan`, `recipes`, `profile`, `premium`, `pages`, `about`).
  - Detects language via `localStorage`, browser language, and `html` tag, with fallback to `en`.
  - Exports helpers `changeLanguage`, `getCurrentLanguage`, and `isLanguageSupported`, plus `supportedLanguages` metadata.

### Styling and configuration

- **Styling**:
  - Global styles: `src/index.css` and `src/App.css`.
  - Tailwind CSS is configured in `tailwind.config.js` with a custom font stack and a small color palette tuned for grocery categories (`fresh`, `produce`, `dairy`, `meat`, `pantry`, `frozen`, `spices`).
  - Tailwind’s `content` globs cover `src/components`, `src/contexts`, `src/hooks`, `src/services`, `src/utils`, and `public/index.html`.

- **Module resolution**:
  - `jsconfig.json` sets `baseUrl` to `src`, so imports can use absolute-from-`src` paths (e.g., `import Header from 'components/Common/Header';`) instead of long relative paths.

### Backend relationship

- This repository is the **frontend** only. The Express/MongoDB backend lives in a separate repo referenced in `README.md` (`urbaneats-backend`).
- The frontend communicates with that backend exclusively through `backendClient` and the REST endpoints it hits (e.g., `/api/mealplan`, `/api/mealplan/save`, `/api/meal-plan-limit/check`, `/api/user/preferences`).
- When debugging cross-cutting issues (e.g., meal plan hydration, saved-plan redirects, tries limits, OAuth login and in-progress meal saving), it is often necessary to inspect both this repo and the backend repo to get the full picture of the flow.
