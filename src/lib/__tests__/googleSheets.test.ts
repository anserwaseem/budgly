import { describe, it, expect } from "vitest";
import {
  extractSheetId,
  validateSheetUrl,
  formatDate,
  prepareTransactionData,
} from "../googleSheets";
import type { Transaction } from "../types";

describe("googleSheets", () => {
  describe("formatDate", () => {
    it("should format date as DD/MM/YYYY", () => {
      const date = "2024-01-15T12:00:00.000Z";
      expect(formatDate(date)).toBe("15/01/2024");
    });

    it("should pad single digit day and month with zeros", () => {
      const date = "2024-01-05T12:00:00.000Z";
      expect(formatDate(date)).toBe("05/01/2024");
    });

    it("should handle dates at end of month", () => {
      const date = "2024-12-31T12:00:00.000Z";
      expect(formatDate(date)).toBe("31/12/2024");
    });

    it("should handle dates at start of month", () => {
      const date = "2024-03-01T12:00:00.000Z";
      expect(formatDate(date)).toBe("01/03/2024");
    });

    it("should handle different years correctly", () => {
      const date2023 = "2023-06-15T12:00:00.000Z";
      const date2025 = "2025-06-15T12:00:00.000Z";
      expect(formatDate(date2023)).toBe("15/06/2023");
      expect(formatDate(date2025)).toBe("15/06/2025");
    });
  });

  describe("extractSheetId", () => {
    it("should extract sheet ID from valid Google Sheets URL", () => {
      const url = "https://docs.google.com/spreadsheets/d/abc123xyz/edit#gid=0";
      expect(extractSheetId(url)).toBe("abc123xyz");
    });

    it("should extract sheet ID from URL with query params", () => {
      const url =
        "https://docs.google.com/spreadsheets/d/test-sheet-id-456/edit?usp=sharing";
      expect(extractSheetId(url)).toBe("test-sheet-id-456");
    });

    it("should return null for invalid URL", () => {
      expect(extractSheetId("https://example.com")).toBeNull();
      expect(extractSheetId("not-a-url")).toBeNull();
      expect(extractSheetId("")).toBeNull();
    });

    it("should handle URLs with different formats", () => {
      const url = "https://docs.google.com/spreadsheets/d/SHEET_ID_123/view";
      expect(extractSheetId(url)).toBe("SHEET_ID_123");
    });

    it("should handle URLs with hyphens and underscores in sheet ID", () => {
      const url = "https://docs.google.com/spreadsheets/d/abc-123_xyz-456/edit";
      expect(extractSheetId(url)).toBe("abc-123_xyz-456");
    });
  });

  describe("validateSheetUrl", () => {
    it("should return true for valid Google Sheets URL", () => {
      const url = "https://docs.google.com/spreadsheets/d/abc123/edit";
      expect(validateSheetUrl(url)).toBe(true);
    });

    it("should return false for invalid URL", () => {
      expect(validateSheetUrl("https://example.com")).toBe(false);
      expect(validateSheetUrl("not-a-url")).toBe(false);
      expect(validateSheetUrl("")).toBe(false);
    });

    it("should return false for Google Docs URL (not Sheets)", () => {
      const url = "https://docs.google.com/document/d/doc-id/edit";
      expect(validateSheetUrl(url)).toBe(false);
    });
  });

  describe("prepareTransactionData", () => {
    it("should format transactions with headers as first row", () => {
      const transactions: Transaction[] = [
        {
          id: "1",
          date: "2024-01-15T12:00:00.000Z",
          reason: "coffee",
          amount: 100,
          paymentMode: "Cash",
          type: "expense",
          necessity: "need",
        },
        {
          id: "2",
          date: "2024-01-16T12:00:00.000Z",
          reason: "lunch",
          amount: 200,
          paymentMode: "Debit Card",
          type: "expense",
          necessity: "want",
        },
      ];

      const result = prepareTransactionData(transactions);

      expect(result).toHaveLength(3); // headers + 2 transactions
      expect(result[0]).toEqual([
        "date",
        "reason",
        "amount",
        "paymentMode",
        "type",
        "necessity",
      ]);
      expect(result[1]).toEqual([
        "15/01/2024",
        "coffee",
        "100",
        "Cash",
        "expense",
        "need",
      ]);
      expect(result[2]).toEqual([
        "16/01/2024",
        "lunch",
        "200",
        "Debit Card",
        "expense",
        "want",
      ]);
    });

    it("should convert null necessity to empty string", () => {
      const transactions: Transaction[] = [
        {
          id: "1",
          date: "2024-01-15T12:00:00.000Z",
          reason: "coffee",
          amount: 100,
          paymentMode: "Cash",
          type: "expense",
          necessity: null,
        },
      ];

      const result = prepareTransactionData(transactions);

      expect(result[1][5]).toBe(""); // necessity column should be empty string
    });

    it("should handle income transactions (no necessity)", () => {
      const transactions: Transaction[] = [
        {
          id: "1",
          date: "2024-01-15T12:00:00.000Z",
          reason: "salary",
          amount: 5000,
          paymentMode: "Bank",
          type: "income",
          necessity: null,
        },
      ];

      const result = prepareTransactionData(transactions);

      expect(result[1][4]).toBe("income");
      expect(result[1][5]).toBe(""); // income has no necessity
    });

    it("should convert amounts to strings", () => {
      const transactions: Transaction[] = [
        {
          id: "1",
          date: "2024-01-15T12:00:00.000Z",
          reason: "coffee",
          amount: 100.5,
          paymentMode: "Cash",
          type: "expense",
          necessity: null,
        },
      ];

      const result = prepareTransactionData(transactions);

      expect(result[1][2]).toBe("100.5"); // amount should be string
      expect(typeof result[1][2]).toBe("string");
    });

    it("should handle empty transactions array (only headers)", () => {
      const result = prepareTransactionData([]);

      expect(result).toHaveLength(1); // only headers
      expect(result[0]).toEqual([
        "date",
        "reason",
        "amount",
        "paymentMode",
        "type",
        "necessity",
      ]);
    });

    it("should format dates correctly for all transactions", () => {
      const transactions: Transaction[] = [
        {
          id: "1",
          date: "2024-01-05T12:00:00.000Z", // single digit day/month
          reason: "coffee",
          amount: 100,
          paymentMode: "Cash",
          type: "expense",
          necessity: null,
        },
        {
          id: "2",
          date: "2024-12-25T12:00:00.000Z", // double digit day/month
          reason: "lunch",
          amount: 200,
          paymentMode: "Cash",
          type: "expense",
          necessity: null,
        },
      ];

      const result = prepareTransactionData(transactions);

      expect(result[1][0]).toBe("05/01/2024"); // padded
      expect(result[2][0]).toBe("25/12/2024"); // not padded
    });
  });
});
