import { describe, expect, it } from "vitest";
import { isOverdueAssignment, sitsOnDay, weekdayName } from "./commandLogic";

describe("isOverdueAssignment", () => {
  const now = new Date("2026-07-03T12:00:00");
  it("is overdue when unreturned and expected_return_at has passed", () => {
    expect(
      isOverdueAssignment({ returned_at: null, expected_return_at: "2026-07-01T09:00:00Z" }, now),
    ).toBe(true);
  });
  it("is not overdue when expected_return_at is in the future", () => {
    expect(
      isOverdueAssignment({ returned_at: null, expected_return_at: "2026-08-01T09:00:00Z" }, now),
    ).toBe(false);
  });
  it("is not overdue when there is no expected return date", () => {
    expect(isOverdueAssignment({ returned_at: null, expected_return_at: null }, now)).toBe(false);
  });
  it("is not overdue once returned, even past the expected date", () => {
    expect(
      isOverdueAssignment(
        { returned_at: "2026-07-02T10:00:00Z", expected_return_at: "2026-07-01T09:00:00Z" },
        now,
      ),
    ).toBe(false);
  });
});

describe("sitsOnDay", () => {
  it("a part with no schedule sits every court day", () => {
    expect(sitsOnDay(null, "Wednesday")).toBe(true);
    expect(sitsOnDay("", "Monday")).toBe(true);
  });
  it("a scheduled part sits only on its days", () => {
    expect(sitsOnDay("Tuesday,Thursday", "Thursday")).toBe(true);
    expect(sitsOnDay("Tuesday,Thursday", "Wednesday")).toBe(false);
  });
  it("nothing sits on weekends, schedule or not", () => {
    expect(sitsOnDay(null, "Saturday")).toBe(false);
    expect(sitsOnDay("Monday", "Sunday")).toBe(false);
  });
});

describe("weekdayName", () => {
  it("returns the long weekday name", () => {
    expect(weekdayName(new Date("2026-07-03T12:00:00"))).toBe("Friday");
    expect(weekdayName(new Date("2026-07-06T12:00:00"))).toBe("Monday");
  });
});
