# Environment Configuration

## Environment Variable

The application now supports a `NEXT_PUBLIC_ENVIRONMENT` variable to control the visibility of development and debug features. This variable is accessible on both server and client side.

### Available Values

- `PRODUCTION`: Hides all development/debug features
- `DEBUG`: Shows all development/debug features

### Features Controlled by Environment

#### Daily Process Status Card

- **PRODUCTION**: Completely hidden (returns `null`)
- **DEBUG**: Fully visible with all functionality

#### QR Scanner Simulation Buttons

- **PRODUCTION**: Hidden (simulation buttons and instructions not shown)
- **DEBUG**: Visible (all simulation buttons and instructions shown)

#### Debug Information

- **PRODUCTION**: Hidden
- **DEBUG**: Visible (debug info in daily process status card)

### Setup Instructions

1. **Add to your `.env` file:**

   ```bash
   # For production
   NEXT_PUBLIC_ENVIRONMENT="PRODUCTION"

   # For development/debug
   NEXT_PUBLIC_ENVIRONMENT="DEBUG"
   ```

2. **Update your deployment scripts** to set the appropriate environment:

   ```bash
   # Production deployment
   export NEXT_PUBLIC_ENVIRONMENT="PRODUCTION"

   # Development deployment
   export NEXT_PUBLIC_ENVIRONMENT="DEBUG"
   ```

3. **Docker Compose** (update your docker-compose files):
   ```yaml
   environment:
     - NEXT_PUBLIC_ENVIRONMENT=DEBUG # or PRODUCTION
   ```

### Usage in Code

```typescript
import { isProduction, isDebug } from "@/lib/utils";

// For client-side components, use useEffect to avoid hydration issues
import { useState, useEffect } from "react";

function MyComponent() {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (isProduction()) {
      setShouldRender(false);
    }
  }, []);

  if (!shouldRender) {
    return null;
  }

  return <div>Development content</div>;
}

// For server-side only checks
if (isProduction()) {
  // Hide development features
  return null;
}

// Check if in debug mode
if (isDebug()) {
  // Show debug information
  console.log("Debug info...");
}
```

### Migration from NODE_ENV

Previously, the application used `NODE_ENV === "development"` to show debug features. This has been replaced with the more explicit `NEXT_PUBLIC_ENVIRONMENT` variable for better control.

### Hydration Considerations

When using environment checks in client-side components, use `useEffect` to avoid hydration mismatches between server and client rendering:

```typescript
// ❌ This can cause hydration errors
if (isProduction()) {
  return null;
}

// ✅ Use this pattern for client-side components
const [shouldRender, setShouldRender] = useState(true);

useEffect(() => {
  if (isProduction()) {
    setShouldRender(false);
  }
}, []);

if (!shouldRender) {
  return null;
}
```

**Old way:**

```typescript
{process.env.NODE_ENV === "development" && (
  <DebugComponent />
)}
```

**New way:**

```typescript
{isDebug() && (
  <DebugComponent />
)}
```
