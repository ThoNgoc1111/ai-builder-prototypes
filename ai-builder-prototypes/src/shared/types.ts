import { z } from "zod";
export const EvidenceSchema = z.object({ source: z.string(), field: z.string(), value: z.union([z.string(), z.number()]) });
export type Evidence = z.infer<typeof EvidenceSchema>;
export const FindingSchema = z.object({
  code: z.string(), severity: z.enum(["LOW","MEDIUM","HIGH"]), title: z.string(),
  explanation: z.string(), recommendation: z.string(), evidence: z.array(EvidenceSchema)
});
export type Finding = z.infer<typeof FindingSchema>;
export type ExecutionEvent = { node: string; status: "STARTED"|"COMPLETED"; at: string; detail?: string };
