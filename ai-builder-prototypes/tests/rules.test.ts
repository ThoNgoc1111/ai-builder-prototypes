import test from "node:test";import assert from "node:assert/strict";
process.env.MOCK_AI="true";
const border=JSON.parse(await (await import("node:fs/promises")).readFile("data/borderlens/sample.json","utf8"));
const comp=JSON.parse(await (await import("node:fs/promises")).readFile("data/comparablescreen/sample.json","utf8"));
test("BorderLens finds value and Incoterm discrepancies",async()=>{const {analyzeBorderLens}=await import("../src/borderlens/graph.js");const r=await analyzeBorderLens(border);assert.deepEqual(r.findings.map((x:any)=>x.code),["VALUE_VARIANCE","INCOTERM_MISMATCH"]);assert.equal(r.review.approved,true)});
test("ComparableScreen excludes related and out-of-range candidates",async()=>{const {screenComparables}=await import("../src/comparablescreen/graph.js");const r=await screenComparables(comp);assert.equal(r.stats.input,5);assert.equal(r.stats.quantitativePass,3);assert.equal(r.stats.accepted,2)});
