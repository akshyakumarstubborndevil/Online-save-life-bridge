
# 🚨 Online Save Life Bridge

> Instead of the person in danger searching for help, help comes searching for the person in danger.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)
![Status](https://img.shields.io/badge/Status-Prototype-blue.svg)
![Radar Coverage](https://img.shields.io/badge/Radar-1%20KM-blue.svg)

---

## 💡 About the Project

Online Save Life Bridge is a hyper-local emergency response platform designed to connect people facing emergencies with nearby potential responders.

During emergencies, finding help quickly can be difficult. This platform aims to reduce response delays by notifying nearby community members about emergency situations.

The goal is simple: make emergency assistance more accessible through technology and community participation.

## 🌟 Key Features

### 1. Victim / SOS Mode
- Emergency SOS activation with a 2-second safety hold.
- Categorized emergencies:
  - Medical
  - Road Accident
  - Personal / Women Safety
  - Fire
  - Urgent Blood / Medicines
  - General Emergency
- Emergency siren and visual strobe effects.
- WhatsApp emergency message with GPS location link.

### 2. Guardian / Responder Mode
- Displays nearby active emergency alerts.
- 1-kilometer proximity-based emergency discovery.
- Responder alert notifications.
- Respond / En Route functionality.
- Map-based emergency location visualization.

### 3. Digital ICE Card
ICE means In Case of Emergency.

Stores important emergency information such as:
- Blood Group
- Critical Allergies
- Organ Donor Status
- Emergency Contact Details

### 4. CPR Metronome
- Audio-based CPR rhythm guidance.
- Browser Web Audio API implementation.
- Designed around a 110 BPM demonstration rhythm.

### 5. Real-Time Communication
- WebSocket-based communication.
- Supports real-time alert updates between connected browser sessions.
- Demonstrates SOS notifications and responder updates.

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| UI | Tailwind CSS |
| Maps | Leaflet.js, OpenStreetMap |
| Backend | Node.js, Express.js |
| Real-time Communication | WebSocket (`ws`) |
| Security | bcryptjs, Express Session |
| Storage | In-memory application data, LocalStorage |

---

## 📁 Project Structure

```text
Online-Save-Life-Bridge/
│
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── auth.js
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## 🚀 Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/akshyakumarstubborndevil/Online-save-life-bridge.git
```

### 2. Navigate to the Project

```bash
cd Online-save-life-bridge
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

### 5. Open in Browser

```text
http://localhost:3000
```

---

## 🎬 Demo Workflow

1. Open the application in two browser windows.
2. Set one window to SOS / Victim Mode.
3. Set the second window to Guardian / Responder Mode.
4. Trigger an emergency SOS.
5. Observe the emergency notification in the responder window.
6. Demonstrate the responder workflow and map visualization.
7. Explore the ICE Card and CPR Metronome.

---

## ⚠️ Important Disclaimer

This project is an emergency response prototype developed for demonstration and learning purposes.

It does not guarantee connection to police, ambulance services, hospitals, or verified emergency responders. Do not rely on this prototype as a replacement for official emergency services.

User and alert data may be stored temporarily in memory and may be lost when the server restarts. Production deployment requires secure persistent storage, verified responder networks, privacy controls, and extensive safety testing.

For real emergencies in India, contact the official emergency number **112**.

---

## 🔮 Future Enhancements

- Verified volunteer and responder registration.
- Persistent database integration.
- Emergency SMS and notification services.
- AI-powered emergency classification.
- Improved GPS tracking and navigation.
- Secure medical profile sharing.
- Production-ready deployment and security.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

**Online Save Life Bridge**

A community-focused emergency response technology prototype.
