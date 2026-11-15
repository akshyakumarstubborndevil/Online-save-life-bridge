# 🚨 Online Save Life Bridge
### *“Instead of the person in danger searching for help, help comes searching for the person in danger.”*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Hackathon%20Ready-rose.svg)](#)
[![Radar Coverage](https://img.shields.io/badge/Radar-1.0%20KM%20Perimeter-blue.svg)](#)

---

## 💡 The Core Problem: The Agonizing "Void"

Over **50% of traumatic injury and cardiac arrest deaths** occur within the first 10 to 15 minutes — long before an ambulance can navigate urban traffic to reach the scene.

When an emergency happens, a victim or bystander must:
1. Panic-dial 112 / 911 / family.
2. Articulate exact street landmarks under extreme stress.
3. Wait 15 to 30 minutes for dispatch.

Yet, in almost every neighborhood, **someone capable of saving that life is standing just 200 meters away** — an off-duty nurse, a medical student, a CPR-certified gym coach, or an agile citizen with a first-aid kit.

**Online Save Life Bridge** bridges this life-or-death void.

---

## 🌟 Key Features

### 1. Dual-Persona Tactical Architecture
- **Victim / SOS Mode**: High-contrast, high-urgency panic screen.
  - **2-Second Safety Hold**: Eliminates accidental clicks.
  - **Categorized Emergency Dispatch**: Medical 🚑, Road Accident 🚗, Personal/Women Safety 🛡️, Fire 🔥, Urgent Blood/Meds 🩸, General ⚠️.
  - **Hardware Deterrent Toolkit**: Screen Strobe Flasher (for nighttime danger/assaults) and Web Audio Synthesized Siren.
  - **1-Click WhatsApp Broadcast**: Pre-populated emergency message with Google Maps GPS pin.
- **Guardian / Responder Mode**:
  - **1-KM Radar Scan**: Monitors active distress calls within walking distance.
  - **Good Samaritan Legal Shield**: Displays clear legal protection disclaimers to eliminate bystander hesitation.
  - **Route Navigation & ETA**: Real-time route vector line connecting responder to victim.

### 2. Digital ICE (In Case of Emergency) Card
- Accessible to first responders even if the victim is unconscious.
- Displays Blood Group, Critical Allergies (e.g. Penicillin, Asthma), Organ Donor Status, and Emergency ICE contacts.

### 3. Acoustic CPR Life-Saving Metronome
- Built directly into the platform using the browser **Web Audio API**.
- Follows the **American Heart Association (AHA) 110-BPM guideline** with an audible rhythmic click and pulsating chest-compression target.

### 4. Real-Time Multi-Device WebSocket Engine
- Open two browser tabs or mobile devices simultaneously:
  - Tab 1 triggers an SOS.
  - Tab 2 (Responder) instantly receives the audible alert, map marker, and dispatch card in real time!

---

## 🛠️ Architecture & Tech Stack

```
[ Victim Browser ]  <---- WebSockets (Full Duplex) ---->  [ Node.js + Express Server ]
         │                                                            │
         ├─ Leaflet.js GPS Radar (1-KM)                               ├─ Alert State Manager
         ├─ Web Audio API Siren & CPR Metronome                       ├─ Proximity Filter
         └─ LocalStorage ICE Medical Card                             └─ Static Asset Pipeline
                                                                      │
[ Nearby Responders ] <------------------------------------------------┘
```

- **Frontend**: HTML5, Tailwind CSS, Leaflet.js, OpenStreetMap, FontAwesome 6, Web Audio API.
- **Backend**: Node.js, Express, `ws` (WebSockets).
- **Zero Heavy Build Toolchains**: Runs directly with standard Node.js without complex bundlers breaking during judge demos.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/online-save-life-bridge.git
cd online-save-life-bridge
npm install
```

### 2. Start the Application
```bash
npm start
```

### 3. Open in Browser
Navigate to:
```
http://localhost:3000
```

---

## 🎬 2-Minute Hackathon Demo Script for Judges

1. **Step 1 (Open Two Windows)**: Open `http://localhost:3000` in two separate browser windows (side-by-side) or one on your phone and one on laptop.
2. **Step 2 (Set Tab 2 to Guardian)**: On Window 2, click the **"Guardian Mode"** button at the top. Notice the 1-km radar active feed.
3. **Step 3 (Trigger SOS in Tab 1)**: On Window 1, select **"Medical"**, then **press & hold the SOS button for 2 seconds**.
4. **Step 4 (Watch the Magic)**:
   - Window 1 activates the emergency strobe and audio siren.
   - Window 2 immediately chimes, pops up an emergency banner, plots the victim's pin on the map, and displays their Blood Group & Allergies.
5. **Step 5 (Respond)**: Click **"Respond (En Route)"** on Window 2. Watch the blue vector navigation line draw on the map and the victim's screen update to show *"Volunteer En Route!"*.
6. **Step 6 (Show CPR Metronome)**: Click the **"CPR Metronome"** button in the header to demonstrate AHA-standard chest compression audio guidance.

---

## 📦 Pushing to Your GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: Online Save Life Bridge Hackathon Prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/online-save-life-bridge.git
git push -u origin main
```

---

## ⚖️ Good Samaritan Protection Notice

Online Save Life Bridge adheres to international Good Samaritan legal protections (e.g., Indian Good Samaritan Law, US Good Samaritan Acts) ensuring any citizen rendering emergency assistance in good faith is protected from civil and criminal liability.

---

## 📄 License
This project is licensed under the MIT License.
