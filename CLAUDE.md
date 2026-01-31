# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keygen-UI is a comprehensive frontend interface for Keygen API licensing management. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS v4, it provides complete CRUD operations for licenses, machines, products, policies, and users.

**Status**: Phase 3 Complete - Dashboard Charts, Settings, Enhanced Details & Relationships ✅
**API Integration**: Connected to Keygen instance at `https://lms.pvx.ai/v1`
**Authentication**: Fully implemented with protected routes

## Development Commands

**IMPORTANT: This project uses PNPM as the package manager. Always use pnpm commands.**

```bash
# Development server with Turbopack
pnpm dev

# Production build with Turbopack
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint

# TypeScript type checking
pnpm typecheck

# Install new dependencies
pnpm add <package-name>

# Install shadcn/ui components (REQUIRED for UI work)
npx shadcn@latest add <component-name>
```

## Architecture & Structure

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui (New York style)
- **Language**: TypeScript with strict mode
- **Package Manager**: PNPM (REQUIRED - never use npm or yarn)
- **API Client**: Custom TypeScript client with full type safety
- **Authentication**: React Context + localStorage with protected routes
- **State Management**: React Context + SWR for data fetching
- **Charts**: Recharts via shadcn ChartContainer/ChartTooltip
- **Icons**: Lucide React + Tabler Icons (sidebar)
- **Notifications**: Sonner toast notifications

### Key Configuration
- **Path Aliases**: `@/*` maps to `./src/*`
- **shadcn/ui**: Configured with components.json for New York style, CSS variables, and component installation
- **Tailwind CSS v4**: Using new PostCSS-based configuration
- **Utilities**: `cn()` function in `src/lib/utils.ts` for className merging

### Project Structure
```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (dashboard)/        # Dashboard layout group
│   │   ├── dashboard/      # Main dashboard page
│   │   ├── licenses/       # License management
│   │   ├── machines/       # Machine monitoring
│   │   ├── products/       # Product management
│   │   ├── policies/       # Policy management
│   │   ├── users/          # User administration
│   │   ├── groups/         # Group management
│   │   ├── entitlements/   # Entitlement management
│   │   ├── webhooks/       # Webhook management
│   │   ├── settings/       # User settings page
│   │   └── layout.tsx      # Dashboard layout with sidebar
│   ├── login/              # Authentication pages
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── hooks/                  # Custom React hooks
│   ├── use-pagination.ts   # Shared pagination state hook
│   ├── use-debounce.ts     # Debounced value hook (search inputs)
│   └── use-sorting.ts      # Client-side column sorting hook
├── lib/                    # Utility functions and shared code
│   ├── api/                # Keygen API client
│   │   ├── client.ts       # Main API client (array params, page[size]/page[number] pagination)
│   │   ├── index.ts        # API exports
│   │   └── resources/      # Resource-specific API methods
│   ├── auth/               # Authentication context and utilities
│   ├── types/              # TypeScript type definitions
│   ├── utils.ts            # Utility functions
│   └── utils/              # Utility modules
│       └── clipboard.ts    # Copy-to-clipboard helper
└── components/             # React components
    ├── ui/                 # shadcn/ui components
    ├── shared/             # Shared components (pagination, metadata, sorting)
    ├── dashboard/          # Dashboard-specific components (metrics charts, stats)
    ├── settings/           # Settings page components
    ├── auth/               # Authentication components
    ├── licenses/           # License management components
    ├── machines/           # Machine management components
    ├── products/           # Product management components
    ├── policies/           # Policy management components
    ├── groups/             # Group management components
    ├── entitlements/       # Entitlement management components
    ├── webhooks/           # Webhook management components
    └── users/              # User management components
```

## Implementation Guidelines

### MANDATORY Requirements

1. **Package Manager**: ALWAYS use `pnpm` - never npm or yarn
2. **UI Components**: MUST use shadcn/ui for all UI components
3. **TypeScript**: All code must be fully typed
4. **API Integration**: Use existing Keygen API client (`src/lib/api/`)
5. **Authentication**: Use existing auth context (`src/lib/auth/context.tsx`)

### shadcn/ui Component Installation

**REQUIRED for all UI work:**
```bash
npx shadcn@latest add [component-name]
```

Components are installed to `@/components/ui/` with New York style and CSS variables.

### Coding Standards

1. **File Naming**: Use kebab-case for files (e.g., `license-management.tsx`)
2. **Component Naming**: Use PascalCase for components (e.g., `LicenseManagement`)
3. **Client Components**: Add `'use client'` directive when using hooks or browser APIs
4. **Error Handling**: Always implement proper error handling with toast notifications
5. **Loading States**: Always show loading states during API calls
6. **Form Validation**: Use proper form validation for all user inputs

### API Integration Pattern

```typescript
// Use existing API client with pagination
import { getKeygenApi } from '@/lib/api'
import { usePagination } from '@/hooks/use-pagination'

const api = getKeygenApi()
const pagination = usePagination()

// Paginated API call with error handling
const loadData = useCallback(async () => {
  try {
    setLoading(true)
    const response = await api.licenses.list(pagination.paginationParams)
    setData(response.data || [])
    const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
    pagination.setTotalCount(count)
  } catch (error: unknown) {
    handleLoadError(error, 'licenses')
  } finally {
    setLoading(false)
  }
}, [api.licenses, pagination.paginationParams])
```

### Pagination Pattern

All management pages use the `usePagination` hook + `PaginationControls` component:

- **`src/hooks/use-pagination.ts`** - Manages `pageSize` (default 25), `pageNumber`, `totalCount`, navigation actions
- **`src/components/shared/pagination-controls.tsx`** - Renders "Showing X-Y of Z", page size selector, navigation buttons
- The Keygen API uses `page[size]` and `page[number]` query parameters (handled by `client.buildPaginationParams()`)
- Stats cards use separate API calls with `limit: 1` to get accurate `meta.count` values (not derived from loaded array)

### User Listing Pattern

The Keygen API defaults to only returning `role=user` accounts. To list all users, always pass `ALL_USER_ROLES`:

```typescript
import { User } from '@/lib/types/keygen'

const ALL_USER_ROLES: User['attributes']['role'][] = [
  'admin', 'developer', 'sales-agent', 'support-agent', 'read-only', 'user'
]

const response = await api.users.list({ ...pagination.paginationParams, roles: ALL_USER_ROLES })
```

This is used in both `user-management.tsx` and dashboard stats components.

### Component Structure

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ExampleComponent() {
  const [loading, setLoading] = useState(true)
  const api = getKeygenApi()
  
  // Implementation...
}
```

## Environment Configuration

The application is configured to work with Keygen instance at `https://lms.pvx.ai/v1`:

```env
KEYGEN_API_URL=https://lms.pvx.ai/v1
KEYGEN_ACCOUNT_ID=aca05a24-461a-4db5-8ed1-c12b6040d1c6
KEYGEN_ADMIN_EMAIL=orcun@pvx.ai
KEYGEN_ADMIN_PASSWORD=[configured]
```

## Implemented Features

### ✅ Complete Features
- **Authentication System** (`/login`) - Full login/logout with protected routes
- **Dashboard** (`/dashboard`) - Real-time analytics with stat cards, historical metrics charts (Licenses, Validations, Machines, Users tabs), license status breakdown, and recent items
- **Settings** (`/settings`) - User profile editing, password change, account info display, public keys (Ed25519/RSA) with copy buttons
- **License Management** (`/dashboard/licenses`) - Complete CRUD, suspend/reinstate, permissions display, policy/group/owner relationship management, user and entitlement attach/detach
- **Machine Management** (`/dashboard/machines`) - Full hardware details (hostname, IP, platform, CPU cores, memory, disk), owner/group relationship management, heartbeat monitoring
- **Product Management** (`/dashboard/products`) - Product lifecycle management with permissions (tag-style add/remove UI in create/edit)
- **Policy Management** (`/dashboard/policies`) - Comprehensive policy creation with collapsible advanced sections (scheme, 7 limit fields, 12 flag checkboxes, 12 strategy selects, heartbeat settings, metadata), entitlement attach/detach in details view
- **Group Management** (`/dashboard/groups`) - Complete group CRUD, user/license assignment, metadata editing
- **Entitlement Management** (`/dashboard/entitlements`) - Feature toggle management and license association
- **Webhook Management** (`/dashboard/webhooks`) - Real-time event notification configuration
- **User Management** (`/dashboard/users`) - User administration with roles, profile editing

### Shared Components
- **MetadataEditor** (`shared/metadata-editor.tsx`) - Key-value metadata editor with stable internal state and add/remove support
- **MetadataViewer** (`shared/metadata-viewer.tsx`) - Read-only metadata display
- **MetadataIndicator** (`shared/metadata-indicator.tsx`) - Table cell indicator for metadata presence
- **PaginationControls** (`shared/pagination-controls.tsx`) - Page size selector, navigation, item counts
- **SortableTableHead** (`shared/sortable-table-head.tsx`) - Client-side column sorting headers

### Available API Resources
- `api.licenses` - License management (CRUD, suspend, reinstate, attach/detach users & entitlements)
- `api.machines` - Machine management (CRUD, heartbeat, owner/group relationships)
- `api.products` - Product management (CRUD with permissions)
- `api.policies` - Policy management (CRUD with all strategy/limit/flag fields, entitlement attach/detach)
- `api.groups` - Group management (CRUD with metadata, user/license relationships)
- `api.entitlements` - Entitlement management
- `api.webhooks` - Webhook management and event notifications
- `api.metrics` - Historical metrics (`countByName()` for charting)
- `api.eventLogs` - Event log queries
- `api.requestLogs` - Request log analytics
- `api.users` - User administration (CRUD, password change, role management)

## Important Notes

- **Production Ready**: Phase 3 complete with dashboard charts, settings, enhanced detail views, and relationship management
- **Real API Integration**: Connected to live Keygen instance (CE edition compatible)
- **Type Safety**: Complete TypeScript coverage with strict mode
- **Pagination**: All listing pages use server-side pagination via `page[size]`/`page[number]`
- **Search + Pagination**: All search inputs reset pagination to page 1 via `resetToFirstPage()` in useEffect dependency arrays
- **Stats Accuracy**: Stats cards use dedicated API calls with `limit: 1` to get `meta.count`, not array length
- **Array Parameters**: API client supports `key[]=value` format for array query parameters (e.g., `roles[]`)
- **Performance**: Optimized with Turbopack bundling
- **Responsive Design**: Mobile-first approach with Tailwind CSS v4
- **Error Handling**: Comprehensive error management with `handleLoadError` and `handleCrudError` utilities
- **Relationship Management**: Inline select + save pattern for changing relationships (no modal-in-modal)
- **Lazy Loading**: Dashboard chart tabs and detail dialog dropdowns load data on demand, not on mount

## 🤖 Agentic Development Patterns & Troubleshooting

### Critical Implementation Lessons Learned

#### 1. **Keygen API Parameter Constraints**
**Issue**: Policy creation failed with "unpermitted parameter" errors
**Root Cause**: Sending advanced strategy parameters during creation
**Solution**: Only send fields with actual user-set values — skip empty strings, false booleans, and undefined values
**Pattern**: Build attributes object conditionally, only including non-default values

```typescript
// ✅ CORRECT - Only send non-default values
const attributes: Record<string, unknown> = { name: formData.name.trim() }
if (formData.duration) attributes.duration = parseInt(formData.duration)
if (formData.scheme) attributes.scheme = formData.scheme
if (formData.maxMachines) attributes.maxMachines = parseInt(formData.maxMachines)
// ... only include fields the user explicitly set
```

#### 2. **Professional Dialog Patterns**
**Anti-Pattern**: Using browser `confirm()` and `alert()` popups
**Best Practice**: Always use shadcn dialogs with proper error handling

```typescript
// ✅ CORRECT - Professional delete dialog
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

const handleDelete = (item: Item) => {
  setSelectedItem(item)
  setDeleteDialogOpen(true)
}
```

#### 3. **API Error Handling Patterns**
**Critical**: Always handle specific HTTP status codes with user-friendly messages

```typescript
catch (error: any) {
  if (error.status === 404) {
    toast.error('Item not found - it may have been deleted')
    onItemDeleted() // Refresh list
  } else if (error.status === 422) {
    toast.error('Cannot delete - item may be in use')
  } else if (error.status === 403) {
    toast.error('Permission denied')
  } else {
    toast.error(`Operation failed: ${error.message || 'Unknown error'}`)
  }
}
```

#### 4. **Empty Response Handling**
**Issue**: JSON parsing errors on DELETE requests (empty responses)
**Solution**: Handle empty responses gracefully in client

```typescript
// In client.ts - handle empty responses
try {
  data = await response.json()
} catch (jsonError) {
  if (response.ok && method === 'DELETE') {
    data = null // DELETE often returns empty body
  }
}
```

#### 5. **Search Must Reset Pagination**
**Issue**: Searching while on page 2+ showed stale results from previous page
**Root Cause**: `searchTerm` was missing from the `resetToFirstPage()` useEffect dependency array
**Solution**: Always include search-related state in the pagination reset dependencies

```typescript
// ✅ CORRECT - Reset pagination when search or filters change
useEffect(() => {
  pagination.resetToFirstPage()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [statusFilter, typeFilter, searchTerm])
```

#### 6. **Relationship Management Pattern**
**Best Practice**: Use inline Select + Save/Cancel for changing relationships (policy, group, owner) instead of nested modals
- Load dropdown options on-demand (when user clicks "Change"), not on dialog open
- Each action gets its own loading state with `Loader2` spinner
- After mutation, call `loadRelationships()` to refresh all data
- Call `onResourceUpdated()` to refresh parent list

#### 7. **Collapsible Form Sections**
**Pattern**: For complex create/edit forms (e.g., policies with 40+ fields), use collapsible sections
- Basic fields always visible at top
- Advanced sections collapsed by default with `ChevronDown`/`ChevronRight` toggle
- `max-h-[90vh] overflow-y-auto` on DialogContent for scrollability

#### 8. **MetadataEditor Internal State**
**Issue**: Adding entries would cause them to disappear immediately
**Root Cause**: `onChange` converted entries to object, filtering empty keys, causing React state loop
**Solution**: Use internal `useState<MetadataEntry[]>` with stable numeric IDs. `handleAdd` only calls `setEntries` (not `onChange`), so empty-key entries persist in UI until filled in.

### Development Workflow Patterns

#### 1. **API-First Development**
1. Test API endpoint with minimal data using console/script
2. Implement API resource method
3. Build UI component with proper error handling
4. Add professional dialogs and loading states

#### 2. **Error-Driven Development**  
1. Implement basic functionality
2. Test with edge cases and invalid data
3. Handle all error scenarios with specific messages
4. Add loading states and success feedback

#### 3. **Progressive Enhancement**
1. Start with minimal required fields
2. Add optional fields incrementally
3. Test each addition separately
4. Maintain backwards compatibility

### Common Debugging Techniques

#### 1. **API Request Debugging**
```typescript
// Temporary logging for debugging
console.log('Sending data:', requestData)
console.log('API response:', response)
// Remove after debugging is complete
```

#### 2. **Authentication Debugging**
```typescript
// Check token presence and format
console.log('Token:', api.getToken()?.substring(0, 20) + '...')
// Verify token is being sent in requests
```

#### 3. **Form Data Debugging**
```typescript  
// Log form data before API call
console.log('Form data before processing:', formData)
console.log('Processed API payload:', processedData)
```

### Performance Optimization Patterns

#### 1. **Conditional Rendering**
```typescript
// Only render dialogs when needed
{selectedItem && (
  <DeleteDialog
    item={selectedItem}
    open={deleteDialogOpen}
    onOpenChange={setDeleteDialogOpen}
  />
)}
```

#### 2. **Efficient State Management**
```typescript
// Use single handler for multiple similar actions
const handleAction = (action: string, item: Item) => {
  switch (action) {
    case 'edit': handleEdit(item); break;
    case 'delete': handleDelete(item); break;
  }
}
```

### Testing Strategies

#### 1. **Console Testing Pattern**
Create isolated test scripts for complex API operations before implementing in UI:

```javascript
// Test in browser console first
async function testOperation() {
  const api = getKeygenApi()
  const result = await api.resource.operation(data)
  console.log('Result:', result)
}
```

#### 2. **Error Scenario Testing**
- Test with invalid data
- Test with missing required fields  
- Test with network failures
- Test with expired tokens