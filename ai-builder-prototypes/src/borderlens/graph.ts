import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { BorderInputSchema, type BorderInput } from "./schema.js";
import { FindingSchema, type Finding, type ExecutionEvent } from "../shared/types.js";
import { generateStructured, ReviewerSchema } from "../shared/gemini.js";

const State = new StateSchema({
  input: BorderInputSchema,
  transactionId: z.string().default(""),
  canonical: z.record(z.string(), z.unknown()).default({}),
  findings: z.array(FindingSchema).default([]),
  review: ReviewerSchema.default({ approved:false, reasons:[] }),
  events: z.array(z.any()).default([])
});
const event=(node:string,status:"STARTED"|"COMPLETED",detail?:string):ExecutionEvent=>({node,status,at:new Date().toISOString(),detail});

function normalize(state: typeof State.State) {
  const i=state.input;
  return {
    transactionId:`${i.invoice.number}-${i.customs.declaration}`,
    canonical:{seller:i.invoice.seller,buyer:i.invoice.buyer,currency:i.invoice.currency,invoiceValue:i.invoice.value,customsValue:i.customs.value,erpRevenue:i.erp.revenue,invoiceIncoterm:i.invoice.incoterm,customsIncoterm:i.customs.incoterm,contractIncoterm:i.agreement.incoterm,quantityMt:i.invoice.quantityMt,pricingPolicy:i.agreement.pricingPolicy},
    events:[...state.events,event("normalize","COMPLETED","Canonical transaction created")]
  };
}
function reconcile(state: typeof State.State) {
  const i=state.input; const findings:Finding[]=[];
  const variance=Math.abs(i.invoice.value-i.customs.value)/Math.max(i.invoice.value,1);
  if(variance>0.01) findings.push({code:"VALUE_VARIANCE",severity:variance>0.05?"HIGH":"MEDIUM",title:"Invoice and customs values differ",explanation:`The customs value differs from the commercial invoice by ${(variance*100).toFixed(2)}%.`,recommendation:"Reconcile freight, insurance, valuation adjustments and declared customs basis.",evidence:[{source:i.invoice.number,field:"invoice.value",value:i.invoice.value},{source:i.customs.declaration,field:"customs.value",value:i.customs.value}]});
  if(i.invoice.incoterm!==i.customs.incoterm) findings.push({code:"INCOTERM_MISMATCH",severity:"HIGH",title:"Incoterm mismatch",explanation:`Invoice uses ${i.invoice.incoterm}; customs declaration uses ${i.customs.incoterm}.`,recommendation:"Confirm the contractual delivery term and whether freight and insurance are consistently included.",evidence:[{source:i.invoice.number,field:"invoice.incoterm",value:i.invoice.incoterm},{source:i.customs.declaration,field:"customs.incoterm",value:i.customs.incoterm}]});
  if(i.invoice.value!==i.erp.revenue) findings.push({code:"ERP_RECONCILIATION",severity:"HIGH",title:"ERP does not reconcile",explanation:"Invoice value and ERP revenue differ.",recommendation:"Trace posting, exchange rate and adjustment entries.",evidence:[{source:i.invoice.number,field:"invoice.value",value:i.invoice.value},{source:i.erp.document,field:"erp.revenue",value:i.erp.revenue}]});
  return {findings,events:[...state.events,event("reconcile","COMPLETED",`${findings.length} deterministic findings`)]};
}
async function explain(state: typeof State.State) {
  const fallback=state.findings;
  const findings=await generateStructured(`Improve these cross-border findings without changing numbers or evidence: ${JSON.stringify(state.findings)}`,z.array(FindingSchema),fallback);
  return {findings,events:[...state.events,event("explain","COMPLETED","Gemini explanation or deterministic fallback") ]};
}
async function review(state: typeof State.State) {
  const fallback={approved:state.findings.every(f=>f.evidence.length>=2),reasons:state.findings.every(f=>f.evidence.length>=2)?["Every finding has at least two evidence points"]:["Missing evidence"]};
  const review=await generateStructured(`Review whether every finding has concrete evidence. ${JSON.stringify(state.findings)}`,ReviewerSchema,fallback);
  return {review,events:[...state.events,event("review","COMPLETED",review.approved?"Approved":"Human review required")]};
}
export const borderGraph = new StateGraph(State).addNode("normalize",normalize).addNode("reconcile",reconcile).addNode("explain",explain).addNode("review",review).addEdge(START,"normalize").addEdge("normalize","reconcile").addEdge("reconcile","explain").addEdge("explain","review").addEdge("review",END).compile();
export async function analyzeBorderLens(input: BorderInput){ return borderGraph.invoke({input},{configurable:{thread_id:`border-${Date.now()}`}}); }
