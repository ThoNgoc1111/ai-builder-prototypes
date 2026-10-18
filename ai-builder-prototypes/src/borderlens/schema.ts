import { z } from "zod";
import { FindingSchema } from "../shared/types.js";
export const BorderInputSchema = z.object({
  invoice: z.object({ number:z.string(), seller:z.string(), buyer:z.string(), currency:z.string(), value:z.number(), incoterm:z.string(), quantityMt:z.number() }),
  customs: z.object({ declaration:z.string(), currency:z.string(), value:z.number(), incoterm:z.string(), quantityMt:z.number() }),
  erp: z.object({ document:z.string(), currency:z.string(), revenue:z.number() }),
  agreement: z.object({ pricingPolicy:z.string(), incoterm:z.string() })
});
export type BorderInput = z.infer<typeof BorderInputSchema>;
export const BorderResultSchema = z.object({ transactionId:z.string(), canonical:z.record(z.string(), z.unknown()), findings:z.array(FindingSchema), review:z.object({approved:z.boolean(), reasons:z.array(z.string())}), events:z.array(z.unknown()) });
