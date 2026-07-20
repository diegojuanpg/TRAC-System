import { describe, it, expect } from "vitest";
import {
  NutritionRow,
  weekStartMonday,
  weekdayIndexMon1,
  buildBodyweightRawRows,
  buildBodyweightWeeklyRows,
} from "@/lib/nutritionMath";

function row(date: string, bodyweight: number | null): NutritionRow {
  return {
    date,
    bodyweight,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    water: null,
    steps: null,
    cardio: null,
  };
}

describe("weekStartMonday / weekdayIndexMon1", () => {
  it("maps Wednesday 2025-06-25 to Monday 2025-06-23", () => {
    expect(weekStartMonday("2025-06-25")).toBe("2025-06-23");
    expect(weekdayIndexMon1("2025-06-23")).toBe(1);
    expect(weekdayIndexMon1("2025-06-25")).toBe(3);
    expect(weekdayIndexMon1("2025-06-29")).toBe(7);
  });
});

describe("buildBodyweightRawRows", () => {
  it("includes only days with bodyweight and computes MA7", () => {
    const rows = [
      row("2025-06-01", 80),
      row("2025-06-02", null),
      row("2025-06-03", 79),
    ];
    const raw = buildBodyweightRawRows(rows);
    expect(raw).toHaveLength(2);
    expect(raw[0]).toMatchObject({ date: "2025-06-01", bodyweight: 80, ma7: 80 });
    expect(raw[1].date).toBe("2025-06-03");
    expect(raw[1].ma7).toBe(79.5);
  });
});

describe("buildBodyweightWeeklyRows delta", () => {
  // Prev week Mon 16 – Sun 22: 80, 80, 80 → avg 80
  // This week Mon 23: 79 → avg so far 79 → delta -1
  // Tue 24: 77 → avg so far 78 → delta -2
  it("delta = avg(this week so far) − avg(last calendar week)", () => {
    const rows = [
      row("2025-06-16", 80),
      row("2025-06-17", 80),
      row("2025-06-18", 80),
      row("2025-06-23", 79),
      row("2025-06-24", 77),
    ];
    const weekly = buildBodyweightWeeklyRows(rows, "2025-06-23", "2025-06-25");
    expect(weekly).toHaveLength(3);

    expect(weekly[0]).toMatchObject({
      date: "2025-06-23",
      day: 1,
      bodyweight: 79,
      deltaDia: -1,
    });
    expect(weekly[1]).toMatchObject({
      date: "2025-06-24",
      day: 2,
      bodyweight: 77,
      deltaDia: -2,
    });
    // Wed no weight: bw null, but avg so far still 78 → delta -2
    expect(weekly[2]).toMatchObject({
      date: "2025-06-25",
      day: 3,
      bodyweight: null,
      deltaDia: -2,
    });
  });

  it("delta is null when previous week has no measurements", () => {
    const rows = [row("2025-06-23", 78)];
    const weekly = buildBodyweightWeeklyRows(rows, "2025-06-23", "2025-06-23");
    expect(weekly[0].deltaDia).toBeNull();
  });
});
