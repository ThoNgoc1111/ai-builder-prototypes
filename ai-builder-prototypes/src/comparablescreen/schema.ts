import { z } from "zod";
export const CandidateSchema=z.object({id:z.string(),name:z.string(),description:z.string(),country:z.string(),revenue:z.number(),operatingMargin:z.number(),independent:z.boolean(),yearsAvailable:z.number()});
export type Candidate=z.infer<typeof CandidateSchema>;
export const ComparableInputSchema=z.object({testedParty:z.object({name:z.string(),activity:z.string(),country:z.string()}),criteria:z.object({keywords:z.array(z.string()),minRevenue:z.number(),maxRevenue:z.number(),minYears:z.number(),countries:z.array(z.string())}),candidates:z.array(CandidateSchema)});
export type ComparableInput=z.infer<typeof ComparableInputSchema>;
