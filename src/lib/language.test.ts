import { describe, expect, it } from "vitest";
import { detectContentLocale } from "./language";

describe("content language detection", () => {
  it("detects a Turkish essay", () => {
    expect(
      detectContentLocale(
        "Okullarda küçük sebze bahçeleri kurulmalıdır çünkü öğrenciler deneyimleyerek daha iyi öğrenir.",
      ),
    ).toBe("tr");
  });

  it("detects Turkish without relying only on special characters", () => {
    expect(detectContentLocale("Bu bir okul projesi ve daha sonra devam edecek.")).toBe("tr");
  });

  it("detects English instructional content", () => {
    expect(
      detectContentLocale("Students learn how plants use light because the lesson connects science to daily life."),
    ).toBe("en");
  });
});
