// Headless test suite for the rules engine. Run: node tests/run-tests.js
// The same scenarios also run live in the browser on the Validation page.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const E = require(path.join(root, "src", "engine.js"));
const D = JSON.parse(fs.readFileSync(path.join(root, "data", "catalog.json"), "utf8"));
const S = JSON.parse(fs.readFileSync(path.join(root, "data", "students.json"), "utf8"));
const AUDIT = fs.readFileSync(path.join(root, "data", "sample-audit.txt"), "utf8");
const run = s => { const r = E.runAll(s, D); r.bn = E.bottlenecks(r.model, r.plan); return r; };
const stu = (id, patch) => ({...JSON.parse(JSON.stringify(S[id])), globalChoice:null, electivesOverride:null, ...(patch||{})});
function invariants(r){
  const errs = [], when = {};
  r.plan.terms.forEach((t, ix) => t.items.forEach(i => { if(i.code) when[i.code] = ix; }));
  r.plan.terms.forEach((t, ix) => {
    if(t.credits > r.model.st.maxCredits + 0.001 && !t.abroad) errs.push(`${t.code} over cap`);
    t.items.forEach(i => {
      if(!i.code || i.kind === "abroad") return;
      if(!i.terms.includes(t.code[0])) errs.push(`${i.code} in wrong term`);
      (i.pre||[]).forEach(([pp]) => { const o = pp.split("|"), pl = o.filter(p => when[p] !== undefined); if(pl.length && pl.every(p => when[p] >= ix) && !o.some(p => r.model.recs[p])) errs.push(`${i.code} before ${pp}`); });
    });
  });
  return errs;
}
let pass = 0, fail = 0;
const t = (name, ok) => { if(ok){ pass++; console.log("  ✓", name); } else { fail++; console.log("  ✕", name); } };
console.log("Scenario 1 · Maya on time"); { const r = run(stu("maya")); t("finishes Spring 2029", r.plan.grad === "S2029"); t("requirements covered", r.val.checks[0].status === "pass"); t("no rule broken", !invariants(r).length); t("time clash detected", r.plan.events.some(e => e.code === "ACCT 30253")); }
console.log("Scenario 2 · Minor"); { const r = run(stu("maya", {minor:"Min-BIS"})); t("BIS minor courses planned", ["INSC 30723","INSC 30823","INSC 30833","INSC 30853"].every(c => r.plan.terms.some(x => x.items.some(i => i.code === c)))); }
console.log("Scenario 3 · Jordan"); { const s = stu("jordan"), r = run(s), alt = E.findAlternative(r.model, s, D); t("late to Fall 2028", r.plan.grad === "F2028"); t("retake planned", r.model.items.some(i => i.kind === "retake")); t("fix found for Spring 2028", alt && alt.found && alt.plan.grad === "S2028"); }
console.log("Scenario 4 · Sam"); { const r = run(stu("sam")); t("refused (advisor)", r.status.kind === "advisor"); t("unknown transfer courses not guessed", r.model.tx.unknown.length === 2); }
console.log("First year · Noah"); { const r = run(stu("noah")); t("19 exam hours counted", r.model.exam.countedHours === 19); t("AP Statistics flagged", r.model.exam.credits.some(c => c.noCount)); t("no rule broken", !invariants(r).length); }
console.log("Audit import"); { const a = E.parseAudit(AUDIT), r = E.runAudit(a, {career:"consulting", maxCredits:15}, D); t("33 courses, 4 open requirements", a.history.length === 33 && a.unmet.length === 4); t("finishes Spring 2027", r.plan.grad === "S2027"); t("no rule broken", !invariants(r).length); }
console.log("Every major and minor"); Object.values(D.programs).filter(p => ["Major","Minor","Certificate"].includes(p.category)).forEach(p => { const r = run(stu("maya", p.category === "Major" ? {major:p.id} : {minor:p.id})); t(`${p.name}: plans without breaking a rule`, !r.plan.leftovers.length && !invariants(r).length); });
console.log("What if"); { const w = E.whatIf(stu("maya"), D, {major:"MARK"}); t("ACCT 30153 stops counting when switching to Marketing", w.stopCounting.includes("ACCT 30153")); t("Finance + Real Estate double major blocked", E.whatIf(stu("maya"), D, {second:"FIRE"}).blockers.length > 0); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
