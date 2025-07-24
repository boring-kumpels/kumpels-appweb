import { LineName } from "@/types/patient";

export const LINES = {
  [LineName.LINE_1]: {
    name: "Line 1",
    description: "First floor - General Medicine",
  },
  [LineName.LINE_2]: {
    name: "Line 2",
    description: "First floor - Surgery",
  },
  [LineName.LINE_3]: {
    name: "Line 3",
    description: "Second floor - Pediatrics",
  },
  [LineName.LINE_4]: {
    name: "Line 4",
    description: "Second floor - ICU",
  },
  [LineName.LINE_5]: {
    name: "Line 5",
    description: "Third floor - Maternity",
  },
} as const;

export const LINE_NAMES = Object.values(LineName);

export function getLineDisplayName(lineName: LineName): string {
  return LINES[lineName].name;
}

export function getLineDescription(lineName: LineName): string {
  return LINES[lineName].description;
}

export function getAllLines() {
  return LINE_NAMES.map((lineName) => ({
    name: lineName,
    displayName: getLineDisplayName(lineName),
    description: getLineDescription(lineName),
  }));
}
