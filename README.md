# 🌌 Matrix Astronomy Club Web App

A full-stack website for the Matrix Astronomy Club built with **Next.js 15**, **React**, and **Firebase**. It includes a dynamic public-facing site and a secure admin panel with full content management. Optimized for performance, responsiveness, and maintainability.

Webpage Link:- https://matrix-astronomy-hub.web.app

## 🚀 Features

- 🔒 Firebase Authentication for admin access
- 🛠️ Full CRUD admin dashboard (events, gallery, site content)
- 🌐 Public website with static export + dynamic data fetching
- 💻 Responsive UI using Tailwind CSS and ShadCN UI
- ⚙️ GitHub Actions for CI/CD deployment to Firebase Hosting

## 🧱 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React, Tailwind CSS, ShadCN UI
- **Backend**: Firebase Firestore
- **Auth**: Firebase Authentication
- **CI/CD**: GitHub Actions
- **Hosting**: Firebase Hosting

## 📦 Project Structure
matrix-astronomy-club/
├── app/ # App Router pages
├── components/ # Shared UI components
├── lib/ # Firebase config and utilities
├── styles/ # Tailwind and ShadCN config
├── public/ # Static assets
└── .github/workflows/ # CI/CD workflows


## 📄 Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/matrix-astronomy-club.git
   cd matrix-astronomy-club

## 🛠️ Setup & Deployment Guide

### 1. Install Dependencies

```bash
npm install

Configure Firebase
Create a Firebase project at Firebase Console

Enable Authentication and Firestore

Create a .env.local file in the root directory and add:
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id


