# CoreInventory Odoo Solution

A premium, modern inventory management system built with React, TypeScript, and Vite, featuring a sleek deep black UI. This application provides a comprehensive solution for tracking products, receipts, deliveries, transfers, and adjustments.

## 🚀 Features

- **Advanced Dashboard**: Real-time overview of inventory metrics and recent activities.
- **Product Management**: Comprehensive tracking of inventory items with detailed metadata.
- **Operations Workflow**:
  - **Receipts**: Manage incoming stock from vendors.
  - **Deliveries**: Track outgoing shipments to customers.
  - **Transfers**: Handle internal stock movements between locations.
  - **Adjustments**: Record and reconcile inventory discrepancies.
- **History Tracking**: Complete audit trail of all inventory movements.
- **Premium UI**: Modern, responsive interface with a "Deep Black" theme and glassmorphic elements.
- **Authentication**: Secure login system for authorized personnel.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Vanilla CSS with PostCSS (Premium custom theme)
- **Routing**: React Router 7
- **State Management**: Zustand
- **Backend/DB**: Prisma, Express, PostgreSQL (via Vercel/Prisma Accelerate)
- **Utilities**: Lucide React (Icons), Date-fns, UUID

## 📦 Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd coreInventory-odoo-solution
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your database and JWT secrets.

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

### Running Locally

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🎨 UI Theme

The application features a "Deep Black" premium theme designed for high-contrast environments and reduced eye strain. Key color tokens:
- **Base Background**: `#020617` (Deep Obsidian)
- **Surface Background**: `#0f172a` (Deep Slate)
- **Primary Accent**: `#3b82f6` (Vibrant Blue)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
