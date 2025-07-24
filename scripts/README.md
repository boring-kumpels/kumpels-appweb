# Database Management Scripts

This directory contains scripts for managing the hospital database, including populating sample data, cleaning the database, and importing patients from external systems.

## Prerequisites

1. Make sure you have the database set up and migrations applied:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

2. Install the CSV parser dependency:
   ```bash
   npm install csv-parse
   ```

## Available Scripts

### 1. Populate Sample Data

Populates the database with 5 lines (A, B, C, D, E), 10 beds per line, and 5 sample patients.

```bash
npm run db:populate
```

This script will:
- Create 5 lines: Line A (General Medicine), Line B (Surgery), Line C (Pediatrics), Line D (ICU), Line E (Maternity)
- Create 10 beds per line (A1-A10, B1-B10, etc.)
- Create 5 sample patients assigned to different beds

### 2. Clean Database

Removes all patients, beds, and lines from the database.

```bash
npm run db:cleanup
```

⚠️ **Warning**: This will permanently delete all data in the patients, beds, and lines tables.

### 3. Import Patients from CSV

Imports patients from a CSV file that comes from an external system.

```bash
npm run db:import-patients <path-to-csv-file>
```

Example:
```bash
npm run db:import-patients scripts/sample-patients.csv
```

#### CSV Format

The CSV file should have the following columns:

```csv
externalId,firstName,lastName,dateOfBirth,gender,admissionDate,lineName,bedNumber,medicalRecord,notes
EXT001,Maria,Garcia,1985-03-15,F,2024-01-15,Line A,A1,MR001,Patient with diabetes
```

**Required columns:**
- `externalId`: Unique identifier from external system
- `firstName`: Patient's first name
- `lastName`: Patient's last name
- `dateOfBirth`: Date of birth (YYYY-MM-DD format)
- `gender`: Gender (M/F)
- `admissionDate`: Admission date (YYYY-MM-DD format)
- `lineName`: Name of the line (must match existing line names)
- `bedNumber`: Bed number (must match existing bed numbers in the line)

**Optional columns:**
- `medicalRecord`: Medical record number
- `notes`: Additional notes

## Database Schema

### Lines
- Represents hospital wards/units
- Each line has a name and description
- Contains multiple beds

### Beds
- Belongs to a specific line
- Has a unique number within the line
- Can be occupied by one active patient at a time

### Patients
- Assigned to a specific bed
- Has an external ID for integration with external systems
- Includes personal information, medical record, and status
- Status can be: ACTIVE, DISCHARGED, TRANSFERRED, DECEASED

## API Endpoints

The following API endpoints are available for managing the data:

### Patients
- `GET /api/patients` - List all patients with optional filters
- `POST /api/patients` - Create a new patient
- `GET /api/patients/[id]` - Get a specific patient
- `PUT /api/patients/[id]` - Update a patient
- `DELETE /api/patients/[id]` - Delete a patient

### Lines
- `GET /api/lines` - List all lines with their beds and patients
- `POST /api/lines` - Create a new line

### Beds
- `GET /api/beds` - List all beds with optional filters
- `POST /api/beds` - Create a new bed

## Usage Examples

### 1. Set up the database from scratch

```bash
# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate

# Populate with sample data
npm run db:populate
```

### 2. Import patients from external system

```bash
# First, ensure lines and beds exist
npm run db:populate

# Then import patients
npm run db:import-patients data/patients-export.csv
```

### 3. Clean and start fresh

```bash
# Clean all data
npm run db:cleanup

# Populate with new data
npm run db:populate
```

## Error Handling

The scripts include comprehensive error handling:

- **Duplicate data**: Scripts use `upsert` operations to handle existing data gracefully
- **Missing dependencies**: Scripts check for required lines and beds before creating patients
- **Bed conflicts**: Scripts warn about bed occupancy conflicts
- **Invalid data**: Scripts validate required fields and data formats

## Troubleshooting

### Common Issues

1. **"Line not found" error**: Make sure the line names in your CSV match exactly with the lines in the database
2. **"Bed not found" error**: Ensure bed numbers exist in the specified line
3. **"Bed is already occupied" warning**: The script will warn you if a bed is already occupied but will still create the patient

### Database Connection Issues

If you encounter database connection issues:

1. Check your `.env` file has the correct `DATABASE_URL`
2. Ensure the database is running and accessible
3. Verify that Prisma migrations have been applied

### Performance Tips

- For large imports, consider running the script during off-peak hours
- The scripts use transactions where appropriate to ensure data consistency
- Consider using the `--batch-size` option for very large datasets (future enhancement) 