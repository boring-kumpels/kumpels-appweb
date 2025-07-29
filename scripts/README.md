# Database Scripts

This directory contains scripts to populate and clean up the database with sample data.

## 📋 Available Scripts

### Population Scripts

#### `populate-lines-beds.ts`

Populates the database with:

- **5 Lines** (Línea 1-5)
- **20 Services** distributed across the lines
- **50 Beds** (10 beds per line, A1-A10)

```bash
npx tsx scripts/populate-lines-beds.ts
```

#### `populate-patients.ts`

Populates the database with **10 sample patients** distributed across different services.

**Prerequisite**: Must run `populate-lines-beds.ts` first.

```bash
npx tsx scripts/populate-patients.ts
```

### Cleanup Scripts

#### `cleanup-patients.ts`

Removes all patients from the database.

```bash
npx tsx scripts/cleanup-patients.ts
```

#### `cleanup-lines-beds.ts`

Removes all lines, services, and beds from the database.

**Note**: This will also remove any patients since they depend on services and beds.

```bash
npx tsx scripts/cleanup-lines-beds.ts
```

### Utility Scripts

#### `check-data.ts`

Displays current database content (lines, services, patients, beds).

```bash
npx tsx scripts/check-data.ts
```

## 🔄 Typical Workflow

### Fresh Start

```bash
# 1. Populate infrastructure
npx tsx scripts/populate-lines-beds.ts

# 2. Add patients
npx tsx scripts/populate-patients.ts

# 3. Verify data
npx tsx scripts/check-data.ts
```

### Reset Everything

```bash
# 1. Clean up patients
npx tsx scripts/cleanup-patients.ts

# 2. Clean up infrastructure
npx tsx scripts/cleanup-lines-beds.ts

# 3. Start fresh
npx tsx scripts/populate-lines-beds.ts
npx tsx scripts/populate-patients.ts
```

## 📊 Data Structure

### Lines

- **Línea 1**: UCI Pediátrica (3 services)
- **Línea 2**: Adultos y Transplantes (3 services)
- **Línea 3**: Adultos y Pediatría (3 services)
- **Línea 4**: Pediatría y Neonatos (3 services)
- **Línea 5**: UCI Médica y Urgencias (8 services)

### Services per Line

- **Línea 1**: UCI PEDIATRICA CARDIOVASCULAR, UCI QUIRÚRGICA, UCI PEDIATRICA GENERAL
- **Línea 2**: SEGUNDO ADULTOS, PEBELLON BENEFACTORES, UNIDAD DE TRANSPLANTES
- **Línea 3**: TERCERO ADULTOS, CUARTO ADULTOS, SEGUNDO PEDIATRIA
- **Línea 4**: TERCERO PEDIATRÍA, SUITE PEDIATRICA, NEONATOS
- **Línea 5**: TERCERO REINALDO, QUINTO REINALDO, SEXTO REINALDO, UCI MEDICA 1, UCI MEDICA 2, UCI MEDICA 3, UCI CARDIOVASCULAR, URGENCIAS

### Beds

- **10 beds per line** (A1-A10)
- **50 total beds** across all lines

### Sample Patients

- **10 patients** with realistic data
- Distributed across different services
- Each patient assigned to an available bed
