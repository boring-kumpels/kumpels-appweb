# Role-Based Access Control (RBAC) System

This application implements a comprehensive role-based access control system for healthcare management. Each user role has specific permissions and access to different sections of the application.

## Available User Roles

### 1. SUPERADMIN

**Description**: System administrators with full access to all features and administrative controls.

**Access Level**: Complete system access

**Sidebar Navigation**:

- **Administration**

  - Dashboard
  - User Management
  - System Settings
  - Security & Permissions
  - Analytics & Reports

- **Medical Operations**

  - All Patients
  - Staff Management
  - Pharmacy Oversight

- **System**
  - Database Management
  - Audit Logs

**Responsibilities**:

- Manage all user accounts and permissions
- Configure system-wide settings
- Monitor system security and compliance
- Access all analytics and reporting features
- Oversee all medical and pharmacy operations

---

### 2. NURSE

**Description**: Healthcare professionals focused on patient care and medical operations.

**Access Level**: Patient care and nursing-specific features

**Sidebar Navigation**:

- **Patient Care**

  - Dashboard
  - My Patients
  - Patient Records
  - Vital Signs

- **Scheduling**

  - My Schedule
  - Shift Management

- **Communication**
  - Messages (with notification badges)
  - Emergency Contacts

**Responsibilities**:

- Manage assigned patients
- Record and monitor vital signs
- Maintain patient records
- Coordinate with other healthcare staff
- Emergency response coordination

---

### 3. PHARMACY_VALIDATOR

**Description**: Pharmacy staff responsible for validating prescriptions and ensuring drug safety.

**Access Level**: Pharmacy validation and quality control features

**Sidebar Navigation**:

- **Pharmacy Operations**

  - Dashboard
  - Prescription Validation (with pending count badges)
  - Drug Database
  - Inventory Check

- **Quality Control**
  - Validation Queue
  - Error Reports
  - Audit Trail

**Responsibilities**:

- Validate incoming prescriptions
- Check drug interactions and contraindications
- Maintain drug database accuracy
- Monitor inventory levels
- Generate quality control reports

---

### 4. PHARMACY_REGENT

**Description**: Senior pharmacy staff with management and oversight responsibilities.

**Access Level**: Pharmacy management and administrative features

**Sidebar Navigation**:

- **Pharmacy Management**

  - Dashboard
  - Staff Oversight
  - Validation Reports
  - Policy Management

- **Operations**

  - Inventory Management
  - Quality Metrics
  - Compliance Check

- **Administration**
  - System Settings
  - Validator Management

**Responsibilities**:

- Oversee pharmacy validation staff
- Manage pharmacy policies and procedures
- Monitor compliance with regulations
- Analyze pharmacy performance metrics
- Coordinate with system administrators

---

## Technical Implementation

### Database Schema

```sql
enum UserRole {
  SUPERADMIN
  NURSE
  PHARMACY_VALIDATOR
  PHARMACY_REGENT
}

model Profile {
  id            String    @id @default(cuid())
  userId        String    @unique
  role          UserRole  @default(SUPERADMIN)
  // ... other fields
}
```

### Role Assignment

- **Default Role**: New users are assigned `SUPERADMIN` role by default during signup
- **Role Changes**: Only SUPERADMIN users can modify other users' roles
- **Role Persistence**: User roles are stored in the database and persist across sessions

### Frontend Implementation

- **Sidebar Navigation**: Dynamic sidebar content based on user role
- **Route Protection**: Role-based access control for specific routes
- **UI Components**: Conditional rendering based on user permissions

### Files Structure

```
src/
├── components/sidebar/data/
│   ├── role-based-sidebar.ts    # Role-specific navigation definitions
│   └── sidebar-data.ts          # Default/fallback navigation
├── hooks/
│   └── use-current-user.ts      # Hook to get current user profile and role
└── app/api/profile/
    └── route.ts                 # Profile management with role assignment
```

## Usage Examples

### Checking User Role in Components

```tsx
import { useCurrentUser } from "@/hooks/use-current-user";

function MyComponent() {
  const { profile } = useCurrentUser();

  if (profile?.role === "SUPERADMIN") {
    return <AdminPanel />;
  }

  if (profile?.role === "NURSE") {
    return <NursePanel />;
  }

  return <DefaultPanel />;
}
```

### Role-Based Route Protection

```tsx
// In middleware.ts or layout components
if (requiredRole && profile?.role !== requiredRole) {
  redirect("/unauthorized");
}
```

## Security Considerations

1. **Server-Side Validation**: Always validate user roles on the server side
2. **API Protection**: Protect API routes with role-based middleware
3. **Database Queries**: Filter data based on user roles at the database level
4. **Audit Logging**: Log all role-based access attempts for security monitoring

## Future Enhancements

- **Granular Permissions**: Implement fine-grained permissions within roles
- **Role Hierarchies**: Create role inheritance and delegation systems
- **Temporary Access**: Implement temporary role assignments
- **Multi-Role Support**: Allow users to have multiple roles simultaneously

---

## Role Management Commands

### Updating User Roles (API)

```bash
# Update user role via API
curl -X PUT /api/user/[userId] \
  -H "Content-Type: application/json" \
  -d '{"role": "NURSE"}'
```

### Database Direct Updates

```sql
-- Update user role directly in database
UPDATE profiles
SET role = 'PHARMACY_VALIDATOR'
WHERE userId = 'user-id-here';
```

---

_Last Updated: January 2025_
_Version: 1.0.0_
