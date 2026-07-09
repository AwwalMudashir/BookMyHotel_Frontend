# BookMyHotel Frontend

This is the React + Vite frontend for the BookMyHotel.com reservation platform. It is built for a multi-hotel booking experience with customer, hotel manager, and admin flows.

## Tech stack

- React 19 + Vite 8 for the UI shell and fast development workflow
- Tailwind CSS 4 for styling and responsive layouts
- React Router for route-based navigation and protected routes
- Axios for HTTP requests to the Java Spring Boot backend
- React Query for caching and server-state management
- React Hot Toast for notifications
- React DatePicker + date-fns for booking date selection and formatting
- Recharts for analytics dashboards
- Lucide React for icons

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Project structure overview

- src/api: API modules for authentication, hotels, search, bookings, services, payments, reviews, promotions, contact, manager, and admin operations.
- src/components: Reusable UI building blocks such as buttons, inputs, cards, modals, and role-based feature components.
- src/context: Shared app state for authentication and booking flow.
- src/hooks: Custom hooks for auth, search, bookings, reviews, manager operations, and admin analytics.
- src/pages: Public, customer, manager, and admin page components.
- src/routes: Route definitions and protected role-based route wrappers.
- src/utils: Helper functions for formatting currency/date and decoding JWT payloads.

## Dependency guide

The following packages are included and are worth knowing about when working in the project:

- @tailwindcss/vite: Vite plugin that enables Tailwind CSS in the Vite build pipeline.
- @tanstack/react-query: Manages server state, caching, background refetching, and mutation behaviour for API-driven screens.
- axios: Used for making HTTP requests to the backend API with shared config and auth headers.
- date-fns: Date utilities for formatting and manipulating booking dates.
- lucide-react: Icon component library used across cards, nav, and feature UI.
- react: Core React library for component-based UI development.
- react-datepicker: Calendar/date range picker for search and booking flows.
- react-dom: React DOM renderer for mounting the application in the browser.
- react-hot-toast: Lightweight toast notifications for success/error feedback.
- react-router-dom: Client-side routing and protected route handling.
- recharts: Chart components for admin analytics and reporting pages.
- tailwindcss: Utility-first CSS framework used for styling the app.

## Notes for future contributors

- The frontend expects the backend API to run at http://localhost:8080/api/v1.
- Authentication tokens are stored in localStorage under the key bmh_token.
- Role-based access is handled through the auth context and route guards.
