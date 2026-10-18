import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { ComparableInputSchema, CandidateSchema, type ComparableInput } from "./schema.js";
import { generateStructured } from "../shared/gemini.js";
const Decision=z.object({id:z.string(),name:z.string(),decision:z.enum(["ACCEPT","REJECT","REVIEW"]),score:z.number(),reasons:z.array(z.string()),matchedKeywords:z.array(z.string())});
const State=new StateSchema({input:ComparableInputSchema,quantitative:z.array(CandidateSchema).default([]),decisions:z.array(Decision).default([]),stats:z.record(z.string(),z.number()).default({})});
function quantitative(state:typeof State.State){const c=state.input.criteria;const kept=state.input.candidates.filter(x=>x.independent&&x.revenue>=c.minRevenue&&x.revenue<=c.maxRevenue&&x.yearsAvailable>=c.minYears&&c.countries.includes(x.country));return {quantitative:kept,stats:{input:state.input.candidates.length,quantitativePass:kept.length}};}
async function qualitative(state:typeof State.State){
 const keys=state.input.criteria.keywords.map(k=>k.toLowerCase());
 const fallback=state.quantitative.map(x=>{const matched=keys.filter(k=>x.description.toLowerCase().includes(k));const score=matched.length/Math.max(keys.length,1);return {id:x.id,name:x.name,decision:score>=0.5?"ACCEPT" as const:score>0?"REVIEW" as const:"REJECT" as const,score,reasons:[matched.length?`Matched ${matched.join(", ")}`:"No required activity keyword found"],matchedKeywords:matched};});
 const decisions=await generateStructured(`Screen candidates against tested activity ${state.input.testedParty.activity}. Criteria keywords: ${keys.join(", ")}. Never invent facts. Candidates: ${JSON.stringify(state.quantitative)}`,z.array(Decision),fallback);
 return {decisions,stats:{...state.stats,accepted:decisions.filter(x=>x.decision==="ACCEPT").length,review:decisions.filter(x=>x.decision==="REVIEW").length,rejected:decisions.filter(x=>x.decision==="REJECT").length}};
}
export const comparableGraph=new StateGraph(State).addNode("quantitative",quantitative).addNode("qualitative",qualitative).addEdge(START,"quantitative").addEdge("quantitative","qualitative").addEdge("qualitative",END).compile();
export async function screenComparables(input:ComparableInput){return comparableGraph.invoke({input},{configurable:{thread_id:`comp-${Date.now()}`}});}
