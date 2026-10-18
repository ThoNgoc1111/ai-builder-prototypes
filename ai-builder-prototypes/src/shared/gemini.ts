import { GoogleGenAI } from "@google/genai";
import { z, type ZodType } from "zod";

const mock = process.env.MOCK_AI !== "false" || !process.env.GEMINI_API_KEY;
const client = mock ? null : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateStructured<T>(prompt: string, schema: ZodType<T>, fallback: T): Promise<T> {
  if (!client) return fallback;
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  const parsed = JSON.parse(response.text || "{}");
  return schema.parse(parsed);
}

export const ReviewerSchema = z.object({ approved: z.boolean(), reasons: z.array(z.string()) });
