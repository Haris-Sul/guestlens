# GuestLens PWA

Updated Lovable Prompt

Lovable Prompt: "Build a mobile-first Progressive Web App (PWA) called 'GuestLens' designed for rural tourism operators.

Top Navigation:

-Title: 'GuestLens'

-Connectivity Switcher: A toggle between '🟢 Online' and '🟠 Offline (Store-and-Forward Mode)'. When offline, show a banner: 'Offline mode active. Reviews cached locally.'

Section 1: Input Reviews

-Button: 'Load Sample Yelp Review'. When clicked, populate the text box with a simulated English Yelp review about a local farm tour.

-Text Box: Manual review entry.

-Guest Contact Field: Pre-filled with +254 712 345 678 (Label: 'Guest SMS Number').

Section 2: AI Insight Dashboard (Dynamic Generation)

-Button: 'Analyze Feedback'. When clicked, use AI to analyze the text box content and dynamically generate 3 cards. CRITICAL: Output the content in Swahili, followed immediately by the English translation in parentheses so the user can understand it.

1. 🌟 Kitu Kilichopendwa (Highlight): [Dynamic Swahili text] (English translation)

2. 🛠️ Mabadiliko (Fix Needed): [Dynamic Swahili text] (English translation)

3. 💡 Fursa Mpya (Opportunity): [Dynamic Swahili text] (English translation)

Section 3: Human-in-the-Loop Guest Follow-Up

-Drafted SMS box in English: Dynamically draft a short thank-you and a 10% discount code based on the review.

-Guardrail Indicator: Show a badge stating '⚠️ AI Confidence: Medium - Human Approval Required'. (Use only High, Medium, or Low).

-Action Button: 'Approve & Send SMS'. When clicked, do NOT open an external app. Instead, clear the drafted text and show a highly visible green in-app success toast/alert saying: '✅ SMS successfully queued to +254 712 345 678 via local gateway.'

Design: Clean, earthy tones, highly responsive for mobile."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://guestlens.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c1cd3742-8204-4657-9813-b36cae308ffe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
