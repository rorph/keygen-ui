# 🔐 Keygen UI

<div align="center">

**A beautiful, modern frontend interface for Keygen API licensing management**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black?style=for-the-badge)](https://ui.shadcn.com/)

[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-success?style=for-the-badge)](https://github.com/rorph/keygen-ui)
[![API Coverage](https://img.shields.io/badge/API_Coverage-95%25-brightgreen?style=for-the-badge)](https://keygen.sh)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success?style=for-the-badge)](https://github.com/rorph/keygen-ui)

[Features](#-features) •
[Demo](#-demo) •
[Quick Start](#-quick-start) •
[Documentation](#-documentation) •
[Contributing](#-contributing)

</div>

---

## 🌟 Overview

Keygen UI is a comprehensive, enterprise-grade frontend application that provides a beautiful interface for managing software licensing through the Keygen API. Built with modern web technologies, it offers complete CRUD operations for licenses, machines, products, policies, groups, entitlements, webhooks, and users with advanced organizational and notification capabilities.

### ✨ Why Keygen UI?

- 🎨 **Beautiful Design**: Modern, responsive interface built with shadcn/ui components
- 🚀 **Production Ready**: Fully functional with real API integration and enterprise features
- 📱 **Mobile First**: Responsive design that works on all devices
- ⚡ **Fast & Modern**: Built with Next.js 15, React 19, and Turbopack
- 🔒 **Secure**: Complete authentication system with protected routes
- 🏢 **Enterprise Grade**: Advanced organizational features with groups, entitlements, and webhooks
- 🛠 **Developer Friendly**: Full TypeScript support with comprehensive type safety

---

## 🎯 Features

### 🔐 Authentication & Security
- **Secure Login System** - Email/password authentication with session management
- **Protected Routes** - Role-based access control throughout the application
- **User Profiles** - Integrated user management with logout functionality

### 📊 Dashboard & Analytics
- **Real-time Overview** - Live statistics from your Keygen instance with 6 stat cards
- **Historical Metrics Charts** - Tabbed area charts (Licenses, Validations, Machines, Users) with 14-day trend data via Keygen metrics API
- **License Status Breakdown** - Visual status distribution with resource counts
- **Recent Items** - Latest licenses and machines at a glance
- **Quick Actions** - Create any resource from the header dropdown

### 🎫 License Management
- **Complete CRUD Operations** - Create, read, update, delete licenses with professional dialogs
- **Advanced Search & Filtering** - Find licenses by status, user, policy, product, or group
- **License Actions** - Suspend, reinstate, renew licenses with one click
- **Relationship Management** - Change policy, group, and owner via inline selects
- **User & Entitlement Attach/Detach** - Manage licensed users and entitlements directly from the details dialog
- **Permissions Display** - View license permissions as badges
- **Edit License Properties** - Update name, expiry, usage limits, and metadata
- **Activation Token Generation** - Generate secure tokens for license activation
- **License Key Management** - Copy keys, view detailed usage statistics

### 💻 Machine Management
- **Device Monitoring** - Real-time heartbeat status tracking
- **Full Hardware Details** - Hostname, IP, platform, CPU cores, memory, disk
- **Relationship Management** - Change owner and group via inline selects
- **Fingerprint Management** - Unique device identification
- **Status Controls** - Activate, deactivate, and manage machine states
- **Metadata Editing** - Custom key-value metadata with add/remove UI

### 📦 Product Management
- **Product Catalog** - Comprehensive product lifecycle management
- **Distribution Strategies** - Licensed, Open, and Closed distribution models
- **Permissions Management** - Tag-style add/remove UI for product permissions
- **Platform Support** - Multi-platform configuration and management
- **Metadata Management** - Custom product information and settings

### 🛡️ Policy Management
- **Comprehensive Policy Creation** - Collapsible advanced sections for scheme, limits (7 fields), flags (12 checkboxes), strategies (12 selects), heartbeat settings, and metadata
- **Full Strategy Support** - Machine uniqueness, matching, expiration, renewal, transfer, authentication, leasing, and overage strategies
- **Entitlement Management** - Attach/detach entitlements directly from policy details
- **Policy Templates** - Floating, strict, protected, and timed policies
- **Search & Filter** - Find policies by type and configuration
- **Professional Dialogs** - Beautiful delete confirmations with proper warnings

### 👥 Group Management
- **Organization Structure** - Create and manage user/license groups
- **Resource Limits** - Set maximum licenses, machines, and users per group
- **Metadata Support** - Full metadata editing in create and edit dialogs
- **Group Relationships** - Assign users and licenses to groups
- **Group Analytics** - View group usage and member details

### 🛡️ Entitlement Management
- **Feature Toggles** - Create and manage feature-based entitlements
- **Code-Based System** - Unique identifier system for integration
- **License Association** - Link entitlements to specific licenses
- **Auto-Code Generation** - Smart code generation from entitlement names

### 🔗 Webhook Management
- **Real-time Notifications** - Configure endpoints for event notifications
- **Event Selection** - Subscribe to 35+ event types organized by category
- **Webhook Testing** - Send test events to validate endpoints
- **Status Management** - Enable/disable webhooks with instant toggles
- **Delivery Tracking** - Monitor webhook delivery history and success rates
- **Security** - Signing key support for secure webhook verification

### 👥 User Administration
- **User Directory** - Complete user account management
- **Role-Based Access** - Admin, Developer, Sales Agent, Support roles
- **User Moderation** - Ban/unban functionality with audit trails
- **Profile Management** - User information and account settings

### ⚙️ Settings
- **Profile Editing** - Update first name, last name, and email
- **Password Management** - Change password with current password verification
- **Account Information** - View account ID, user ID, role, and status
- **Public Keys** - Display Ed25519 and RSA public keys with copy buttons
- **Verify Key** - View verification hash for key integrity

---

## 🖼️ Screenshots

<div align="center">

### 📊 Dashboard Overview
*Real-time analytics and comprehensive license management at a glance*

![Dashboard](./public/screenshots/Dashboard.png)

### 🎫 License Management
*Complete license lifecycle with professional dialogs*

![License Management](./public/screenshots/LicensesOverview.png)

### ➕ Create New License
*Intuitive license creation with policy and user selection*

![Create License](./public/screenshots/CreateNewLicense.png)

### 🛡️ Policy Management
*Smart policy creation with API-compliant minimal parameters*

![Create Policy](./public/screenshots/CreatePolicy.png)

### 🗑️ Professional Delete Dialogs
*Beautiful confirmation dialogs with proper warnings - no ugly browser popups!*

![Delete License](./public/screenshots/DeleteLicense.png)

</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **PNPM** (recommended package manager)
- **Keygen Account** with API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rorph/keygen-ui.git
   cd keygen-ui
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Keygen instance details:
   ```env
   KEYGEN_API_URL=https://api.keygen.sh/v1
   KEYGEN_ACCOUNT_ID=your-account-id
   KEYGEN_ADMIN_EMAIL=your-email@example.com
   KEYGEN_ADMIN_PASSWORD=your-secure-password
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🎉 That's it!

You should now have a fully functional Keygen UI running locally.

---

## 🛠️ Technology Stack

<div align="center">

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15 | React framework with App Router |
| **UI Library** | React | 19 | User interface library |
| **Language** | TypeScript | 5 | Type-safe JavaScript |
| **Styling** | Tailwind CSS | 4 | Utility-first CSS framework |
| **Components** | shadcn/ui | Latest | Beautiful, accessible components |
| **Bundler** | Turbopack | Latest | Fast development builds |
| **Charts** | Recharts | Latest | Area charts via shadcn ChartContainer |
| **Icons** | Lucide React + Tabler | Latest | Beautiful icon libraries |
| **Notifications** | Sonner | Latest | Toast notifications |

</div>

---

## 📖 Documentation

### API Integration

Keygen UI comes with a fully typed API client that handles all interactions with the Keygen API:

```typescript
import { getKeygenApi } from '@/lib/api'

const api = getKeygenApi()

// Example: List licenses
const licenses = await api.licenses.list({ limit: 50 })

// Example: Create a new license
const newLicense = await api.licenses.create({
  policyId: 'policy-123',
  userId: 'user-456'
})

// Example: Create a group
const group = await api.groups.create({
  name: 'Enterprise Customers',
  maxLicenses: 100
})

// Example: Create an entitlement
const entitlement = await api.entitlements.create({
  name: 'Premium Features',
  code: 'premium_features'
})

// Example: Create a webhook
const webhook = await api.webhooks.create({
  endpoint: 'https://myapp.com/webhooks',
  events: ['license.created', 'license.expired']
})
```

### Component Architecture

All components follow consistent patterns and use shadcn/ui:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ExampleComponent() {
  const [loading, setLoading] = useState(false)
  
  return (
    <Button 
      onClick={() => toast.success('Hello World!')}
      disabled={loading}
    >
      Click Me
    </Button>
  )
}
```

### Available Routes

- `/login` - Authentication page
- `/dashboard` - Main dashboard with metrics charts and analytics
- `/dashboard/licenses` - License management with relationship editing
- `/dashboard/machines` - Machine monitoring with hardware details
- `/dashboard/products` - Product management with permissions
- `/dashboard/policies` - Policy management with all advanced fields
- `/dashboard/groups` - Group management with metadata
- `/dashboard/entitlements` - Feature entitlement management
- `/dashboard/webhooks` - Real-time webhook configuration
- `/dashboard/users` - User administration
- `/settings` - User profile, password, account info, public keys

---

## 🎨 Customization

### Theming

Keygen UI uses Tailwind CSS with CSS variables for easy theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... more variables */
}
```

### Adding Components

Use the shadcn/ui CLI to add new components:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add data-table
```

### API Resources

Extend the API client by adding new resources:

```typescript
// src/lib/api/resources/custom.ts
export class CustomResource {
  constructor(private client: KeygenClient) {}
  
  async customMethod() {
    return this.client.request('/custom-endpoint')
  }
}
```

---

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking

# Dependencies
pnpm add <package>     # Add new dependency
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (dashboard)/     # Dashboard routes
│   │   ├── dashboard/   # Main dashboard with charts
│   │   ├── licenses/    # License management
│   │   ├── machines/    # Machine monitoring
│   │   ├── products/    # Product management
│   │   ├── policies/    # Policy management
│   │   ├── groups/      # Group management
│   │   ├── entitlements/# Entitlement management
│   │   ├── webhooks/    # Webhook management
│   │   ├── users/       # User administration
│   │   └── settings/    # User settings
│   └── login/           # Authentication
├── hooks/               # Custom React hooks
│   ├── use-pagination.ts # Shared pagination state
│   ├── use-debounce.ts  # Debounced search inputs
│   └── use-sorting.ts   # Client-side column sorting
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   ├── shared/          # Reusable (pagination, metadata, sorting)
│   ├── dashboard/       # Dashboard charts and stats
│   ├── settings/        # Settings page
│   ├── licenses/        # License CRUD + details + relationships
│   ├── machines/        # Machine CRUD + details + edit
│   ├── products/        # Product CRUD + details + edit
│   ├── policies/        # Policy CRUD + details (advanced fields)
│   ├── groups/          # Group CRUD + details + edit
│   ├── entitlements/    # Entitlement CRUD + details
│   ├── webhooks/        # Webhook CRUD + details + edit
│   └── users/           # User CRUD + details + edit
├── lib/                 # Utilities and API
│   ├── api/             # Keygen API client
│   │   └── resources/   # All API resource classes
│   ├── auth/            # Authentication
│   ├── types/           # TypeScript types
│   └── utils/           # Utility modules (clipboard, errors)
```

---

## 🏢 Enterprise Features

### New in Version 3.0

Keygen UI now includes comprehensive detail views with relationship management, historical metrics, and user settings:

#### 📊 **Dashboard Metrics Charts**
- **Historical Trends**: 14-day area charts for Licenses, Validations, Machines, and Users
- **Lazy Loading**: Each chart tab fetches data independently with caching
- **CE Compatible**: Works with Keygen Community Edition metrics API

#### ⚙️ **User Settings**
- **Profile Management**: Edit name, email, and change password
- **Account Info**: View account ID, role, status with copy buttons
- **Public Keys**: Display Ed25519/RSA keys for verification

#### 🔗 **Relationship Management**
- **Inline Editing**: Change policy, group, owner via select dropdowns in detail dialogs
- **Attach/Detach**: Manage users and entitlements on licenses and policies
- **On-Demand Loading**: Dropdown options load only when needed

#### 🛡️ **Comprehensive Policy Editor**
- **40+ Fields**: All scheme, limit, flag, strategy, and heartbeat settings
- **Collapsible Sections**: Advanced settings organized into 6 collapsible groups
- **Smart Submission**: Only sends non-default values to the API

#### 🏗️ **Organizational Management**
- **Groups**: Organize users and licenses with metadata support
- **Entitlements**: Feature-based licensing with code identifiers
- **Webhooks**: Configure 35+ event types with testing and signing keys

### API Coverage

Keygen UI covers **95%** of the Keygen API surface area with:
- 10 complete resource management interfaces (including metrics and settings)
- Full relationship management (policy, group, owner, users, entitlements)
- Advanced filtering, search, sorting, and pagination
- Comprehensive error handling and user feedback

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 1. Fork & Clone
```bash
git clone https://github.com/your-username/keygen-ui.git
```

### 2. Create a Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 4. Commit & Push
```bash
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

### 5. Open a Pull Request
Describe your changes and link any related issues.

### Development Guidelines

- **Use PNPM** for package management
- **Follow TypeScript** strict mode
- **Use shadcn/ui** components for UI
- **Add proper error handling** with toast notifications
- **Include loading states** for async operations

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Orçun Başlak](https://github.com/orcunbaslak/keygen-ui)** - Original author; this project is forked from his work
- **[Keygen](https://keygen.sh/)** - For providing an excellent software licensing API
- **[shadcn/ui](https://ui.shadcn.com/)** - For beautiful, accessible UI components
- **[Next.js Team](https://nextjs.org/)** - For the amazing React framework
- **[Tailwind CSS](https://tailwindcss.com/)** - For the utility-first CSS framework

---

## 📞 Support

- **Documentation**: Check out our [documentation](#-documentation)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/rorph/keygen-ui/issues)
- **Discussions**: Join conversations in [GitHub Discussions](https://github.com/rorph/keygen-ui/discussions)

---

<div align="center">

**Built with ❤️ for the Keygen community**

[⭐ Star this repository](https://github.com/rorph/keygen-ui) if you find it helpful!

</div>
