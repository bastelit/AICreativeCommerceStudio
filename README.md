# 🎨 AI Creative Commerce Studio (Nano Banana Hackathon)

**Transform your voice into commercially-ready designs in seconds.**

---

## 🚀 Live Demo

[**Click here to view the live application**](https://ai-creative-commerce-studio-qxni.vercel.app/)

---

## 📖 Project Overview

The journey from a simple creative thought to a commercially viable, print-ready design is often long and requires significant technical skill. For entrepreneurs, content creators, and small business owners, this gap presents a major barrier to creating merchandise and marketing materials quickly.

The **AI Creative Commerce Studio** is a voice-first web application designed to bridge this gap. It empowers anyone to transform a spoken idea into a professional-quality design, ready for print-on-demand products, using a sophisticated multi-step AI workflow.

---

## ✨ Core Features

* **🎙️ Voice-to-Text Idea Capture**: A seamless interface to capture creative ideas and stylistic details using speech recognition.
* **🤖 AI-Powered Prompt Enhancement**: A "Creative Director" AI that transforms simple user ideas into rich, detailed, and artistically-sound prompts.
* **🍌 High-Quality Image Generation**: The "Nano Banana" engine (powered by the Gemini API) generates print-ready, vector-style artwork based on the enhanced prompt.
* **🗣️ Iterative Design Modification**: Users can refine their designs using either voice commands or text input, allowing for rapid iteration.
* **👕 AI-Assisted T-Shirt Mockups**: Generate realistic t-shirt mockups of the final design, with an AI-powered feature to suggest brand concepts if none is provided.
* **Bring Your Own Key (BYOK)**: Users can securely use the application with their own Gemini API key, which is saved only in their browser's local storage.

---

## 💡 How It Works (The "Magic" Behind the Scenes)

The power of this application lies in its **prompt-chaining** workflow. Instead of sending a simple user prompt directly to an image model, we use a two-step process to ensure superior results:

1.  **User Idea**: The user provides a simple idea, like `"a wolf howling"`.
2.  **Creative Director AI**: The app sends this idea to a text-based AI model with a specialized prompt, instructing it to act as an expert creative director. It returns an *enhanced prompt*:
    > *"Create a powerful vector art design of a wolf howling at the moon. The wolf should be in a dynamic, centered pose... Use a monochromatic color palette of deep blacks, crisp whites, and cool grays..."*
3.  **Nano Banana Image AI**: This rich, detailed prompt is then sent to the image generation model, resulting in a high-quality design that aligns with commercial best practices.

This process ensures that even the simplest user ideas are translated into technically sound and artistically compelling visuals.

---

## 🛠️ Tech Stack

* **Frontend**: React, Vite, TypeScript
* **Styling**: Tailwind CSS
* **AI**: Google Gemini API
* **Speech Recognition**: Web Speech API

---

## 🖥️ How to Use the Studio: A Walkthrough for Judges

Here’s how to navigate the AI Creative Commerce Studio:

1.  **Enter Your API Key**: Upon visiting the site, the first step is to enter your Google Gemini API key in the input field at the top right. The key is saved locally in your browser for the duration of your session.

2.  **Step 1: Voice Your Idea**: In the first card, click "Start Recording" and speak your core design concept (e.g., "A majestic lion wearing a crown").

3.  **Step 2: Add Style Details**: In the second card, you can add stylistic refinements (e.g., "Make it minimalist line art with gold colors").

4.  **Generate the Design**: Click the **"Generate with Nano Banana"** button. In the background, your idea will be sent to the "Creative Director AI" for enhancement, and you'll see the detailed prompt appear in the right-hand panel. Then, the image model will generate your design.

5.  **Step 3: Modify Your Design**: Once an image is generated, the "Modify Your Design" card becomes active.
    * Use the **Voice/Text toggle** to choose your input method.
    * Provide a modification command (e.g., "Change the background to dark blue").
    * Click "Apply Modification" to see the changes.

6.  **Use the Action Buttons**: Below the preview, you can:
    * **Regenerate**: Create a completely new variation of the design.
    * **T-Shirt Mockup**: Generate a mockup of your design on a t-shirt. If you don't provide a brand name, the AI will suggest one based on the design!

Thank you for reviewing my project for the Nano Banana Hackathon!
