# Apostle

> **Map the world's knowledge. Discover the connections between everything.**

Apostle is an intelligent knowledge exploration platform that transforms static Wikipedia information into dynamic, interactive knowledge graphs. Ask about any topic, visualize how ideas connect, and follow the threads that tie all human knowledge together.

---

## ✨ Features

### 🗺️ Interactive Knowledge Map
The core of Apostle. As you explore topics, the map builds itself — nodes represent concepts, edges represent connections. Navigate by clicking, zoom into rabbit holes, and watch your knowledge graph grow in real time.

### 🤖 Apostle AI
A conversational AI guide embedded directly in the platform. Ask it to explain complex concepts, find surprising connections between topics, or suggest what to explore next. Powered by **Qwen3 Coder** via OpenRouter.

### 🔍 Instant Topic Search
Search any topic — from "The History of Jazz" to "Quantum Entanglement" — and get a sharp, accurate summary with pathways to explore further.

### 💾 Save Your Journeys
Capture your unique learning paths. Save your knowledge map at any point and pick up exactly where you left off.

### 🌗 Light & Dark Mode
Seamlessly toggle between light and dark themes for comfortable exploration in any environment.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| AI Model | Qwen3 Coder (via OpenRouter API) |
| Backend | Node.js & Express |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key

### Installation

```bash
# Clone the repo
git clone https://github.com/arnav-rath11/apostle.git
cd apostle

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your VITE_OPENROUTER_API_KEY to .env

# Start the dev server
npm run dev
```

Open `http://localhost:5173` and start exploring.

### Environment Variables

```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## 🔮 Roadmap

- [ ] **PDF Export** — Export your knowledge journeys as structured documents
- [ ] **Enhanced UI/UX** — More polished and intuitive interface
- [ ] **Wikipedia Account Integration** — Sync with your personal Wikipedia account
- [ ] **Apostle AI Precision** — Higher accuracy in concept mapping and connections
- [ ] **Optimized Latency** — Faster, near-instant AI responses

---

## 👤 Creator

Built with passion by [arnav-rath11](https://github.com/arnav-rath11)

---

<p align="center">
  <i>Knowledge is infinite. Start mapping it.</i>
</p>
