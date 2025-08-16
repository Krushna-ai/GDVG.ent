# Project Overview: Global Drama Verse Guide (GDVG)

This document provides a comprehensive overview of the technical architecture, technology stack, and components of the Global Drama Verse Guide (GDVG) application.

## 1. High-Level Overview

GDVG is a full-stack web application designed to be a comprehensive guide to global entertainment, including dramas, movies, anime, and more. It features a powerful Python-based backend and a modern JavaScript-based frontend.

- **Backend:** A feature-rich API built with **FastAPI**.
- **Frontend:** A single-page application built with **React**.
- **Database:** A **MongoDB** NoSQL database for flexible data storage.

The application is designed with a sophisticated set of features that go beyond a simple content browser, including social networking, user analytics, and a premium subscription model.

## 2. Backend Architecture

The backend is a robust and scalable application built with FastAPI, a modern, high-performance Python web framework.

### Technology Stack

- **Framework:** **FastAPI** with **Uvicorn** as the ASGI server.
- **Database Driver:** **Motor**, an asynchronous Python driver for MongoDB, which integrates seamlessly with FastAPI's async capabilities.
- **Data Validation:** **Pydantic** is used extensively for data validation, serialization, and settings management.
- **Authentication:** **JSON Web Tokens (JWT)** are used for securing the API. The implementation includes libraries like `passlib` for password hashing and `python-jose` for JWT creation and decoding.
- **Data Processing:** **Pandas** and **NumPy** are included for data manipulation, particularly for the bulk import feature.
- **Environment:** Dependencies are managed via `requirements.txt`, and environment variables (like database credentials and JWT secrets) are loaded from a `.env` file using `python-dotenv`.

### Key Features & API Endpoints

The backend API is extensive. Here is a summary of its core capabilities, which are exposed via RESTful endpoints under the `/api/` prefix:

- **Authentication (`/auth`):** User registration, login, profile retrieval (`/me`), and profile updates.
- **Content (`/content`):** Full CRUD (Create, Read, Update, Delete) operations for entertainment content. Includes advanced search and filtering capabilities.
- **Admin (`/admin`):** A separate set of endpoints for administrative tasks, including user management, content management, and viewing site statistics. Features a powerful bulk import from CSV/Excel files.
- **Watchlists (`/watchlist`):** Allows users to manage personal watchlists with statuses like "Watching," "Completed," etc.
- **Reviews & Ratings (`/reviews`):** Endpoints for users to submit, edit, and view reviews and ratings for content.
- **Analytics (`/analytics`):** Tracks user viewing history and provides aggregated analytics on viewing habits.
- **Social Features (`/social`):** A suite of social networking features, including following users, an activity feed, and notifications.
- **Recommendations (`/recommendations`):** AI-powered endpoints to provide personalized, similar, and trending content recommendations.
- **Monetization (`/premium`, `/ads`):** Endpoints to manage premium subscriptions and control ad delivery for free users.

## 3. Frontend Architecture

The frontend is a modern single-page application (SPA) built with React. It is designed to be the user-facing interface for the powerful backend.

### Technology Stack

- **Framework:** **React** (v19) using Create React App as the foundation.
- **Routing:** **React Router (`react-router-dom`)** is used for client-side routing and navigation.
- **HTTP Client:** **Axios** is used for making API calls to the backend.
- **Styling:** **Tailwind CSS** is used for utility-first styling. The project is configured with `postcss` and `autoprefixer` for CSS processing.
- **Build Configuration:** **Craco** (`@craco/craco`) is used to override the default Create React App configuration, primarily to enable Tailwind CSS.
- **Package Manager:** **Yarn** is used for dependency management.

### Component Structure

The frontend is organized into several key components within the `frontend/src/` directory:

- **`App.js`:** The main component that acts as the entry point and orchestrates the overall layout and routing.
- **`Header.js`, `Footer.js`, `HeroSection.js`:** Core layout and presentational components.
- **`ContentGrid.js`, `ContentCard.js`:** Components responsible for displaying lists of content.
- **`ContentDetail.js`:** A component to show the detailed view of a single piece of content.
- **`UserAuth.js`:** Handles user login and registration.
- **`UserDashboard.js`, `UserProfile.js`, `WatchlistManager.js`:** Components for authenticated user features (currently placeholders).
- **`AdminLogin.js`, `AdminDashboard.js`:** Components for the admin interface (currently placeholders).

## 4. Database

The application uses **MongoDB**, a NoSQL document-oriented database. This choice provides flexibility in storing the diverse and nested data associated with entertainment content and user profiles.

### Key Collections

- **`admins`:** Stores administrator credentials.
- **`users`:** Stores user profiles, credentials, and preferences.
- **`content`:** The main collection for all entertainment content (movies, series, etc.).
- **`reviews`:** Stores user-submitted reviews and ratings.
- **`watchlist`:** Manages users' personal watchlists.
- **`viewing_history`, `user_follows`, `activity_feed`, etc.:** Collections supporting the analytics and social features.

The application is designed to connect to the MongoDB instance specified in the `backend/.env` file. On initial startup, the backend will populate the database with sample content if it is empty.
