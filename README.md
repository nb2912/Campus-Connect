# 🚀 SRM Social: The Ultimate Campus Companion

**SRM Social** is a high-performance, real-time community platform engineered exclusively for the students of SRM Institute of Science and Technology. It optimizes campus life by facilitating resource sharing, cost reduction, and peer-to-peer networking through a verified, secure ecosystem.

### [🔴 Enter the Dashboard](https://srm-buddy.vercel.app)

*(Note: Access is restricted to `@srmist.edu.in` domains)*

---

## 📖 Overview

Campus ecosystems often suffer from "coordination friction." Whether it's the high cost of solo travel to Chennai Airport or the lack of a reliable gym partner, students often pay a "loneliness tax."

SRM Social eliminates this friction. By leveraging **real-time data synchronization**, we connect students with identical intent—whether that's splitting a ₹1,200 cab fare or finding a hackathon teammate—all within a "walled garden" of verified peers.

## ✨ Key Features

### 🚕 Smart Pooling Engine

* **Dynamic Matching:** Post travel schedules for common hubs (Airport, Railway Stations, Malls).
* **Cost Efficiency:** Mathematically reduces individual travel expenditure by up to **75%**.

### 🍔 Collaborative Consumption

* **Order Splitting:** Coordinate food deliveries to bypass minimum order requirements and slash delivery fees.
* **Real-time Updates:** Stay notified when a peer in your hostel is ordering from your favorite spot.

### 🤝 Peer-to-Peer Networking

* **Activity Partners:** Find spotters for the gym, teammates for sports, or collaborators for academic projects.
* **Gamified Trust:** Earn **Karma Points (XP)** for successful interactions, building a community-wide reputation.

### 🛡️ Security & Privacy-First

* **OAuth 2.0 Integration:** Strict Firebase Authentication restricted to University G-Suite accounts.
* **Ephemeral Chat:** Secure, real-time coordination without disclosing personal phone numbers until trust is established.

---

## 🛠️ Technical Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), React |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) |
| **Backend-as-a-Service** | [Firebase](https://firebase.google.com/) |
| **Database** | [Firestore](https://firebase.google.com/docs/firestore) (Real-time Snapshots) |
| **Authentication** | Google Identity (Domain Restricted) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📐 Architecture Highlights

* **Real-time Reactivity:** Utilizes Firestore Snapshots for "zero-refresh" UI updates.
* **Thumb-Zone UX:** Designed with a mobile-first philosophy featuring sticky navigations and haptic-like feedback animations.
* **State Management:** Optimized using React Hooks and Firebase Context for seamless data flow across the dashboard.

---

## 🚀 Getting Started

To run a local instance of SRM Social:

1. **Clone the Repository**
```bash
git clone https://github.com/your-username/srm-social.git
cd srm-social
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env.local` file and add your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# ... etc
```

4. **Run Development Server**
```bash
npm run dev
```

---

## 🤝 Contributing

We welcome contributions! If you'd like to improve SRM Social:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

**Developed with ❤️ for the SRM Community.**
