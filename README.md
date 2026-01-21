# CHROME-EXTENSION-FOR-TIME-TRACKING-AND-PRODUCTIVITY-ANALYTICS

# 🍪 ByteBreak: Focus & Productivity Tracker

****ByteBreak is a full-stack productivity tool that combines a Chrome Extension with a local analytics server. It monitors your browsing habits in real-time, categorizing your time into "Productive" work and "Unproductive" distractions (the Cookie Jar), then visualizes that data on a beautiful web dashboard.****

# 🚀 Project Overview

****The project is split into two main components:****

****Chrome Extension: The "sensor" that tracks active tab time and provides a quick-view popup.****

****Node.js Backend: A robust server that persists your data to data.json and provides API endpoints for deep analytics.****

# ✨ Key Features

****Real-time Tracking: Monitors active tab focus and browser window state to ensure accurate time logging.****

****Domain Classification: * Productive: GitHub, StackOverflow, MDN, Coursera, etc.****

****Cookie Jar: YouTube, Netflix, Reddit, and Social Media.****

****Quick Popup: A glassmorphism-styled extension popup to see your daily productivity percentage at a glance.****

****Analytics Dashboard: A full-screen web interface featuring Chart.js visualizations for weekly trends and daily summaries.****

****Local Persistence: Data is stored locally on your machine, ensuring your browsing habits stay private.****

# 🛠️ Tech Stack

****Frontend: HTML5, CSS3 (Custom Glassmorphism), JavaScript (ES6), Chart.js.****

****Extension: Manifest V3, Chrome Scripting & Storage APIs.****

****Backend: Node.js, Express.js, CORS, File System (fs) for JSON storage.****

# 📦 Installation & Setup

****1. The Backend (Analytics Server)****

****Navigate to the backend directory****

cd backend

****Install dependencies****

npm install

Start the server (runs on http://localhost:3000)

npm start

****2. The Chrome Extension****

****Open Chrome and navigate to chrome://extensions/.****

****Enable Developer Mode in the top-right corner.****

****Click Load Unpacked.****

****Select the folder containing your manifest.json and extension files.****

# Loaded extension

<img width="750" height="642" alt="Screenshot 2026-01-21 165416" src="https://github.com/user-attachments/assets/5cbd2d97-ea8e-45d0-9132-e2b2f5fe8b36" />

# Dashboard

<img width="750" height="642" alt="Screenshot 2026-01-19 215107" src="https://github.com/user-attachments/assets/78577ed3-6814-493e-ac4a-469b6f843686" />
<img width="750" height="642" alt="Screenshot 2026-01-19 215129" src="https://github.com/user-attachments/assets/efdfa316-7d1d-45dc-a564-90cc39e4218a" />

<img width="750" height="641" alt="Screenshot 2026-01-19 215138" src="https://github.com/user-attachments/assets/dc55ea93-9c15-4cb7-a2cb-18ab1ac6a304" />
