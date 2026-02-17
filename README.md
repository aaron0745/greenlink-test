# Green-link

Smart Waste Management System for digital transformation of waste collection.

## Features

- **QR Based Collection**: Secure doorstep verification via QR codes.
- **Role-based Access**: Specialized portals for Admins, Collectors, and Residents.
- **Real-time Analytics**: Dashboard for monitoring collection coverage and revenue.
- **Appwrite Integration**: Backend powered by Appwrite for authentication and database.

## Technologies

- **Frontend**: React, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Appwrite
- **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js & npm
- Appwrite Instance

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup environment variables: `cp .env.example .env` (and fill in your Appwrite details)
4. Run setup script: `node scripts/setup_appwrite.cjs`
5. Seed initial data: `node scripts/seed_data.cjs`
6. Start development server: `npm run dev`
