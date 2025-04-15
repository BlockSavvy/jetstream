# Migrating to Next.js 15

Next.js 15 introduced significant changes to how route parameters are handled:

1. For server components and API routes, `params` is now a Promise that must be awaited
2. For client components, this creates a type conflict since client components can't be async

## Client Component Migration Strategy

To properly migrate client components with dynamic parameters to Next.js 15:

### Option 1: Convert to Server Component (Preferred)

The best approach is to convert client components with dynamic routes to server components:

```tsx
// Before (client component)
'use client'
export default function MyPage({ params }: { params: { id: string } }) {
  // Component code
}

// After (server component)
export default async function MyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Component code
}
```

### Option 2: Use Client-Side Router Hooks (Alternative)

If the component must remain a client component, use client-side router hooks instead:

```tsx
'use client'
import { useParams } from 'next/navigation';

export default function MyPage() {
  const params = useParams();
  const id = params.id;
  // Component code
}
```

### Option 3: Use Type Overrides (Temporary Solution)

For a temporary solution during migration, you can use the provided types:

```tsx
'use client'
import { ClientIdParams } from '@/lib/types/route-types';

export default function MyPage({ params }: ClientIdParams) {
  const id = params.id;
  // Component code
}
```

## API Route Migration

For API routes, use the route-types.ts utility:

```tsx
import { GetRouteHandler, IdParam } from '@/lib/types/route-types';

export const GET: GetRouteHandler<{ id: string }> = async (
  request: NextRequest,
  context: IdParam
) => {
  const { id } = await context.params;
  // Route handler code
};
```

## Need Help?

Review the scripts in the `scripts/` directory:

- `update-route-types.js` - Updates API route handlers
- `update-page-types.js` - Updates server component pages
- `update-client-components.js` - Updates client component pages

These scripts automate the migration process.

## Current Status

- [x] All API route handlers updated to use Promise params
- [x] All server component pages updated to use Promise params
- [ ] Client component pages need review and migration

Note: We currently have TypeScript checking disabled (`ignoreBuildErrors: true`) in next.config.js until all client components are properly migrated.
