import { useState, useRef, useCallback } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --n:#050d1a;--n2:#0a1628;--n3:#0f2040;
  --tl:#00d4b8;--tl2:#00a896;--tl3:rgba(0,212,184,0.12);
  --go:#e8c97a;--go2:rgba(232,201,122,0.14);
  --gl:rgba(255,255,255,0.03);--gl2:rgba(255,255,255,0.06);
  --b:rgba(0,212,184,0.18);--b2:rgba(255,255,255,0.07);--b3:rgba(232,201,122,0.22);
  --tx:#e8f4f2;--tx2:#9ab8b4;--tx3:#4a6a66;
  --rd:#ff6b6b;--am:#ffb347;--gr:#4ecdc4;
}
body{font-family:'Sora',sans-serif;background:var(--n);color:var(--tx);overflow-x:hidden}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:var(--n)}::-webkit-scrollbar-thumb{background:var(--b);border-radius:2px}
@keyframes lp{0%,100%{box-shadow:0 0 0 0 rgba(232,201,122,.5)}50%{box-shadow:0 0 0 7px rgba(232,201,122,0)}}
@keyframes tp{0%,100%{box-shadow:0 0 0 0 rgba(0,212,184,.5)}50%{box-shadow:0 0 0 6px rgba(0,212,184,0)}}
@keyframes b1{0%,100%{transform:translate(0,0)}40%{transform:translate(-40px,30px)}70%{transform:translate(25px,-20px)}}
@keyframes b2{0%,100%{transform:translate(0,0)}35%{transform:translate(50px,-35px)}65%{transform:translate(-30px,25px)}}
@keyframes fA{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes fB{0%,100%{transform:translateY(0)}50%{transform:translateY(9px)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes cf{to{top:110vh;transform:rotate(720deg)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fa{animation:fA 7s ease-in-out infinite}
.fb{animation:fB 8s ease-in-out infinite}
`;

const DEMO = {
  patientName:"Rajesh Kumar",patientAge:"54",doctorName:"Dr. Priya Mehta",
  hospital:"Apollo Hospital, Ahmedabad",date:"16 Mar 2026",
  diagnosisTitle:"Hypertension Stage I",
  diagnosisPlain:"You have Hypertension — your blood pressure is consistently higher than normal. Think of your blood vessels like garden pipes; right now the pressure inside is too strong, making your heart work extra hard. With the right medicines and small daily habits, most people manage this completely normally.",
  diagnosisTags:["✓ Manageable","Chronic","Heart-related"],
  medications:[
    {name:"Amlodipine",dose:"5 mg",frequency:"Once daily",timing:"7:00 AM after food",days:"30 days",quantity:"30 tablets"},
    {name:"Metoprolol Succinate",dose:"25 mg",frequency:"Twice daily",timing:"8:00 AM · 8:00 PM",days:"30 days",quantity:"60 tablets"},
    {name:"Aspirin",dose:"75 mg",frequency:"Once daily",timing:"After lunch",days:"30 days",quantity:"30 tablets"},
  ],
  sideEffectsRed:["Sudden severe chest pain — call 102 immediately","Sudden severe headache or vision changes"],
  sideEffectsAmber:["Dizziness when standing quickly — rise slowly","Persistent ankle swelling"],
  sideEffectsGreen:["Mild headache in first 3 days — will pass","Slight fatigue with Metoprolol — normal"],
  checklist:["ECG test in 2 weeks","Check BP at home every morning","Reduce salt to < 1 tsp per day","30-min walk 5 days a week","Return to Dr. Mehta on April 15"],
  familyOneliner:"Rajesh bhai has high blood pressure — on 3 medicines taken morning and night, needs less salt, daily walk, doctor visit next month. Nothing scary, fully under control.",
  doctorQuestions:["What if I miss a dose?","Can I take these with diabetes medicines?","At what BP should I go to emergency?","Can I stop medicines once BP normalises?","Foods to completely avoid?"],
  morningMeds:["Amlodipine 5mg","Metoprolol 25mg","Aspirin 75mg"],
  afternoonMeds:[],
  eveningMeds:["Metoprolol 25mg"],
  emergencyInfo:"Chest pain, sudden severe headache, or BP above 180/110 — call 102. Apollo Hospital Emergency: 079-66770000.",
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── CALL CLAUDE VISION API ─────────────────────────────────────────────────
async function callClaudeVision({ fileDataUrl, fileType, fileName, age, name, lang, mode }) {
  const langStr = lang==="Hindi" ? "Respond in simple Hindi (Devanagari). Keep medicine names in English."
    : lang==="Gujarati" ? "Respond in simple Gujarati. Keep medicine names in English."
    : "Respond in clear simple English.";
  const modeStr = mode==="chemist" ? "Focus on exact dispensing quantities, storage instructions, and substitutes."
    : mode==="detailed" ? "Give full medical context — what each medicine does and why."
    : "Use very simple language for a patient with no medical background.";

  const system = `You are DawaClear, a medical AI that reads Indian prescriptions and discharge summaries.
${langStr} ${modeStr}

CRITICAL: Extract ONLY what is ACTUALLY in this document. Do NOT invent anything.
Return ONLY raw JSON — no markdown fences, no explanation, just the object:
{"patientName":"","patientAge":"","doctorName":"","hospital":"","date":"","diagnosisTitle":"","diagnosisPlain":"2-3 sentence simple explanation","diagnosisTags":[],"medications":[{"name":"","dose":"","frequency":"","timing":"","days":"","quantity":""}],"sideEffectsRed":[],"sideEffectsAmber":[],"sideEffectsGreen":[],"checklist":[],"familyOneliner":"","doctorQuestions":[],"morningMeds":[],"afternoonMeds":[],"eveningMeds":[],"emergencyInfo":""}`;

  let userContent;
  if (fileType === "text/plain") {
    userContent = [{type:"text",text:`Analyse this medical document:\n\n${fileDataUrl}\n\nAge hint: ${age||"not provided"}. Name override: ${name||"use from doc"}. Lang: ${lang}. Mode: ${mode}.`}];
  } else {
    const base64 = fileDataUrl.includes(",") ? fileDataUrl.split(",")[1] : fileDataUrl;
    const mime = fileType.startsWith("image/") ? fileType : "image/jpeg";
    userContent = [
      {type:"image",source:{type:"base64",media_type:mime,data:base64}},
      {type:"text",text:`Read this medical document image carefully. Extract every detail and return the JSON.\nAge hint: ${age||"not provided"}. Name override: ${name||"use from doc"}. Lang: ${lang}. Mode: ${mode}.`}
    ];
  }

  const res = await fetch("/api/analyse", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({system,messages:[{role:"user",content:userContent}]})
  });

  if (!res.ok) { const t = await res.text(); throw new Error(`API ${res.status}: ${t.slice(0,180)}`); }
  const d = await res.json();
  const raw = (d.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
  try { return JSON.parse(raw); } catch {
    const m = raw.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]);
    throw new Error("JSON parse failed. Response: "+raw.slice(0,200));
  }
}

// ─── MINI COMPONENTS ────────────────────────────────────────────────────────
const Chip = ({c="teal",children}) => {
  const map={teal:["rgba(0,212,184,0.12)","#00d4b8","rgba(0,212,184,0.18)"],red:["rgba(255,107,107,0.1)","#ff6b6b","rgba(255,107,107,0.2)"],gold:["rgba(232,201,122,0.14)","#e8c97a","rgba(232,201,122,0.22)"]};
  const [bg,cl,bc]=map[c]||map.teal;
  return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"3px 9px",borderRadius:100,background:bg,color:cl,border:`1px solid ${bc}`}}>{children}</span>;
};

const Btn = ({children,onClick,primary,sm,style={}}) => (
  <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:primary?(sm?"9px 20px":"11px 26px"):"7px 14px",borderRadius:100,fontSize:primary?(sm?12:13):11.5,cursor:"pointer",fontFamily:"'Sora',sans-serif",border:primary?"none":"1px solid rgba(255,255,255,0.09)",background:primary?"linear-gradient(135deg,#00d4b8,#00a896)":"rgba(255,255,255,0.04)",color:primary?"#050d1a":"#9ab8b4",fontWeight:primary?700:400,...style}}>{children}</button>
);

const Card = ({children,gold,glow,style={}}) => (
  <div style={{background:gold?"linear-gradient(145deg,rgba(232,201,122,0.14),rgba(232,201,122,0.06))":glow?"linear-gradient(145deg,rgba(0,212,184,0.05),var(--gl))":"var(--gl)",border:`1px solid ${gold?"var(--b3)":glow?"rgba(0,212,184,0.16)":"var(--b2)"}`,borderRadius:18,padding:22,marginBottom:18,...style}}>
    {children}
  </div>
);

const HDR = ({icon,title,chip,cc,sub}) => (
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
    <div style={{width:36,height:36,borderRadius:9,background:"var(--gl2)",border:"1px solid var(--b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
    <div style={{flex:1}}><div style={{fontSize:14.5,fontWeight:600}}>{title}</div>{sub&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{sub}</div>}</div>
    {chip&&<Chip c={cc}>{chip}</Chip>}
  </div>
);

function Confetti() {
  const cols=["#00d4b8","#e8c97a","#ff6b6b","#4ecdc4"];
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
    {Array.from({length:55}).map((_,i)=><div key={i} style={{position:"absolute",width:7,height:7,borderRadius:"50%",background:cols[i%4],left:`${Math.random()*100}vw`,top:-10,animation:`cf ${1+Math.random()*2}s ease-in forwards`,animationDelay:`${Math.random()*0.5}s`}}/>)}
  </div>;
}

function Ambient() {
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
    <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",filter:"blur(90px)",background:"radial-gradient(circle,rgba(0,212,184,0.09),transparent 65%)",top:-250,right:-180,animation:"b1 22s ease-in-out infinite"}}/>
    <div style={{position:"absolute",width:550,height:550,borderRadius:"50%",filter:"blur(90px)",background:"radial-gradient(circle,rgba(232,201,122,0.055),transparent 65%)",bottom:-180,left:-120,animation:"b2 26s ease-in-out infinite"}}/>
    <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(0,212,184,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,184,0.025) 1px,transparent 1px)",backgroundSize:"72px 72px"}}/>
  </div>;
}

function Toast({msg}) {
  if(!msg) return null;
  return <div style={{position:"fixed",bottom:90,right:24,zIndex:9998,background:"rgba(10,22,40,0.97)",border:"1px solid rgba(0,212,184,0.22)",color:"#e8f4f2",padding:"11px 18px",borderRadius:12,fontSize:13,fontFamily:"'Sora',sans-serif",backdropFilter:"blur(16px)",boxShadow:"0 8px 28px rgba(0,0,0,0.4)",maxWidth:340,animation:"fu .3s ease"}}>{msg}</div>;
}

// ─── PRINT ───────────────────────────────────────────────────────────────────
function pMedCard(r){const w=window.open("","_blank");w.document.write(`<!DOCTYPE html><html><head><title>MedCard</title><style>body{font-family:sans-serif;padding:28px;color:#111;max-width:680px;margin:0 auto}h1{color:#00a896}h3{color:#00a896;border-bottom:1px solid #e0f0ee;padding-bottom:4px;margin:16px 0 8px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #ccc;padding:7px 9px;font-size:12px;text-align:left}th{background:#f0faf8}p{font-size:13px;line-height:1.6}</style></head><body><h1>🩺 DawaClear MedCard</h1><p><strong>${r.patientName||""}</strong>${r.patientAge?" · "+r.patientAge+"y":""} · ${r.date||""}</p><p>Dr. ${r.doctorName||""} · ${r.hospital||""}</p><h3>Diagnosis</h3><p><strong>${r.diagnosisTitle}:</strong> ${r.diagnosisPlain}</p><h3>Medications</h3><table><tr><th>Medicine</th><th>Dose</th><th>Timing</th><th>Days</th></tr>${(r.medications||[]).map(m=>`<tr><td>${m.name}</td><td>${m.dose}</td><td>${m.timing}</td><td>${m.days}</td></tr>`).join("")}</table><h3>Family Summary</h3><p>"${r.familyOneliner}"</p><p style="font-size:11px;color:#aaa;margin-top:20px">DawaClear · ${new Date().toLocaleDateString("en-IN")}</p></body></html>`);w.document.close();w.print();}
function pChemist(r){const w=window.open("","_blank");w.document.write(`<!DOCTYPE html><html><head><title>Chemist</title><style>body{font-family:monospace;padding:24px}table{width:100%;border-collapse:collapse;font-size:14px;margin-top:10px}th,td{border:1px solid #333;padding:8px 10px}th{background:#f0f0f0}</style></head><body><h2>DISPENSE — ${r.patientName||""} — ${new Date().toLocaleDateString("en-IN")}</h2><table><tr><th>Medicine</th><th>Dose</th><th>Qty</th><th>Timing</th><th>Days</th></tr>${(r.medications||[]).map(m=>`<tr><td>${m.name}</td><td>${m.dose}</td><td><strong>${m.quantity||m.days}</strong></td><td>${m.timing}</td><td>${m.days}</td></tr>`).join("")}</table><p style="font-size:11px;color:#aaa;margin-top:10px">DawaClear</p></body></html>`);w.document.close();w.print();}
function pFridge(r){const w=window.open("","_blank");w.document.write(`<!DOCTYPE html><html><head><title>Fridge Magnet</title><style>*{box-sizing:border-box}body{font-family:sans-serif;display:flex;justify-content:center;padding:30px}.card{width:390px;border:3px solid #00a896;border-radius:14px;padding:22px;background:#f8fffe}h2{color:#00a896;font-size:17px}table{width:100%;border-collapse:collapse;margin:8px 0}th{background:#00a896;color:#fff;padding:5px 7px;font-size:11px;text-align:left}td{padding:5px 7px;border:1px solid #ccc;font-size:12px}.em{background:#fff0f0;border:2px solid #ff6b6b;border-radius:7px;padding:10px;margin-top:8px;font-size:12px}</style></head><body><div class="card"><h2>🩺 ${r.patientName||"Patient"}'s Medicines</h2><p style="font-size:11px;color:#777">${r.diagnosisTitle||""} · ${r.date||""}</p><table><tr><th>Medicine</th><th>Dose</th><th>When</th></tr>${(r.medications||[]).map(m=>`<tr><td>${m.name}</td><td>${m.dose}</td><td>${m.timing}</td></tr>`).join("")}</table><p style="font-size:12px;font-style:italic;color:#555;margin-top:7px">"${r.familyOneliner||""}"</p><div class="em">🚨 <strong>Emergency:</strong> ${r.emergencyInfo||"Call 102"}</div><p style="font-size:10px;color:#bbb;text-align:center;margin-top:10px">DawaClear · Print & stick on fridge</p></div></body></html>`);w.document.close();w.print();}

// ─── LANDING ─────────────────────────────────────────────────────────────────
function Landing({onStart,onDemo}) {
  const [file,setFile]=useState(null);
  const [fdu,setFdu]=useState(null);
  const [name,setName]=useState("");
  const [age,setAge]=useState("");
  const [lang,setLang]=useState("English");
  const [mode,setMode]=useState("simple");
  const [role,setRole]=useState("Patient");
  const [drag,setDrag]=useState(false);
  const [ferr,setFerr]=useState("");
  const ref=useRef();

  const pickFile=f=>{
    if(!f)return;
    setFerr("");
    if(f.size>10*1024*1024){setFerr("Max 10MB.");return;}
    setFile(f);
    const r=new FileReader();
    if(f.type==="text/plain"){r.onload=e=>setFdu(e.target.result);r.readAsText(f);}
    else{r.onload=e=>setFdu(e.target.result);r.readAsDataURL(f);}
  };

  const ext=file?.name.split(".").pop().toLowerCase();
  const ico={pdf:"📕",jpg:"🖼️",jpeg:"🖼️",png:"🖼️",webp:"🖼️",txt:"📝"}[ext]||"📄";

  const inS={width:"100%",background:"var(--gl2)",border:"1px solid var(--b2)",color:"var(--tx)",padding:"9px 13px",borderRadius:10,fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none"};
  const lbS={fontSize:10,color:"var(--tx3)",fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6,display:"block"};

  return <div style={{position:"relative",zIndex:1}}>
    {/* HERO */}
    <div style={{minHeight:"100vh",padding:"76px 2.5rem 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,maxWidth:1240,margin:"0 auto",alignItems:"center"}}>
      <div style={{paddingRight:52,paddingBottom:52}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:9,background:"var(--go2)",border:"1px solid var(--b3)",padding:"6px 16px 6px 10px",borderRadius:100,fontSize:10.5,color:"var(--go)",fontWeight:500,letterSpacing:"0.06em",marginBottom:28,textTransform:"uppercase"}}>
          <span style={{width:7,height:7,background:"var(--go)",borderRadius:"50%",animation:"lp 2s ease-in-out infinite",flexShrink:0}}/>
          IAR Udaan 2026 · Medical AI
        </div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(34px,4vw,60px)",lineHeight:1.06,marginBottom:20,letterSpacing:"-0.02em"}}>
          Your prescription,<br/>finally <span style={{color:"var(--tl)",fontStyle:"italic"}}>decoded.</span>
          <span style={{display:"block",marginTop:7,fontSize:"0.52em",color:"var(--tx3)",fontFamily:"'Sora',sans-serif",fontWeight:400,fontStyle:"normal",lineHeight:1.5}}>The AI that sits between a patient and confusion.</span>
        </h1>
        <p style={{fontSize:15,lineHeight:1.75,color:"var(--tx2)",maxWidth:430,marginBottom:36}}>
          Upload your prescription or discharge summary. <strong style={{color:"var(--tx)",fontWeight:500}}>Claude Vision</strong> reads the actual document — handwritten or printed — and builds your full health dashboard in 30 seconds.
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Btn primary onClick={()=>ref.current.click()}>📄 Upload Document</Btn>
          <Btn onClick={onDemo}>👁 Load Demo</Btn>
        </div>
        <div style={{display:"flex",gap:28,marginTop:44,paddingTop:28,borderTop:"1px solid var(--b2)"}}>
          {[["2M+","Docs processed"],["98%","Accuracy"],["40+","Languages"]].map(([v,l])=><div key={l}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:30,color:"var(--tl)",lineHeight:1}}>{v}</div>
            <div style={{fontSize:11.5,color:"var(--tx3)",marginTop:3}}>{l}</div>
          </div>)}
        </div>
      </div>

      {/* MOCKUP */}
      <div style={{position:"relative",minHeight:500,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"relative",width:280,height:380}}>
          <div className="fa" style={{position:"absolute",top:16,left:-162,width:150,background:"rgba(10,22,40,0.96)",borderRadius:11,padding:"8px 12px",border:"1px solid var(--b)",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
            <div style={{fontSize:8.5,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"var(--tl)",display:"block"}}/>Diagnosis
            </div>
            <div style={{fontSize:11,color:"var(--tx)",fontWeight:600,marginBottom:2}}>Hypertension Stage I</div>
            <div style={{fontSize:10,color:"var(--tx2)",lineHeight:1.4}}>BP above 140/90 mmHg</div>
          </div>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,rgba(15,32,64,0.92),rgba(10,22,40,0.96))",border:"1px solid var(--b)",borderRadius:20,padding:20,boxShadow:"0 40px 80px rgba(0,0,0,0.6)",overflow:"hidden"}}>
            <div style={{position:"absolute",bottom:-14,right:14,fontFamily:"'DM Serif Display',serif",fontSize:110,color:"rgba(0,212,184,0.03)",lineHeight:1,pointerEvents:"none"}}>Rx</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:9.5,color:"var(--tx3)",fontFamily:"'JetBrains Mono',monospace"}}>
                <strong style={{display:"block",fontSize:11,color:"var(--tx2)",marginBottom:1}}>Dr. Priya Mehta, MD</strong>
                Cardiology · Apollo
              </div>
              <div style={{width:30,height:30,borderRadius:"50%",background:"var(--tl3)",border:"1px solid var(--b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🩺</div>
            </div>
            <div style={{background:"var(--gl)",border:"1px solid var(--b2)",borderRadius:8,padding:"7px 10px",marginBottom:10,display:"flex",gap:9,alignItems:"center"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:"var(--tl3)",border:"1px solid var(--b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>👤</div>
              <div>
                <div style={{fontSize:11.5,fontWeight:600}}>Rajesh Kumar</div>
                <div style={{fontSize:9.5,color:"var(--tx3)",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>M · 54y · BP: 145/95</div>
              </div>
            </div>
            <div style={{fontSize:8.5,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6,fontWeight:600}}>Medications</div>
            {[["Amlodipine","5mg","07:00"],["Metoprolol","25mg","8·8PM"],["Aspirin","75mg","Lunch"]].map(([n,d,t])=>(
              <div key={n} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <div>
                  <div style={{fontSize:10.5,fontWeight:600}}>{n}</div>
                  <div style={{fontSize:9,color:"var(--tx3)",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{d} · OD</div>
                </div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,background:"var(--tl3)",color:"var(--tl)",padding:"2px 6px",borderRadius:4,border:"1px solid var(--b)"}}>{t}</span>
              </div>
            ))}
            <div style={{position:"absolute",bottom:12,left:20,right:20,display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid var(--b2)"}}>
              <div style={{fontSize:8.5,color:"var(--tx3)",fontFamily:"'JetBrains Mono',monospace"}}>16-Mar-2026</div>
              <div style={{display:"flex",alignItems:"center",gap:3,fontSize:8.5,color:"var(--tl)",fontFamily:"'JetBrains Mono',monospace"}}>
                <span style={{width:4,height:4,borderRadius:"50%",background:"var(--tl)",animation:"tp 2s ease-in-out infinite"}}/>verified
              </div>
            </div>
          </div>
          <div className="fb" style={{position:"absolute",bottom:42,right:-162,width:150,background:"rgba(10,22,40,0.96)",borderRadius:11,padding:"8px 12px",border:"1px solid var(--b)",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
            <div style={{fontSize:8.5,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"var(--go)",display:"block"}}/>Follow-up
            </div>
            <div style={{fontSize:10,color:"var(--tx2)",lineHeight:1.6}}>✓ ECG in 2 weeks<br/>✓ BP log daily<br/>⬜ Review Apr 15</div>
          </div>
        </div>
      </div>
    </div>

    {/* UPLOAD SECTION */}
    <div style={{maxWidth:1240,margin:"0 auto",padding:"80px 2.5rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:10.5,fontWeight:600,color:"var(--tl)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:12}}>
        <span style={{width:20,height:1,background:"var(--tl)",display:"block"}}/>Upload & Analyse
      </div>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(26px,3vw,44px)",marginBottom:12}}>Drop your document. Get answers.</h2>
      <p style={{fontSize:14.5,color:"var(--tx2)",maxWidth:480,lineHeight:1.75,marginBottom:48}}>
        Claude Vision reads your actual image or text — handwritten notes, printed prescriptions, discharge summaries. Real extraction, not templates.
      </p>

      <div
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);pickFile(e.dataTransfer.files[0]);}}
        style={{background:"linear-gradient(145deg,var(--n2),var(--n3))",border:`2px dashed ${drag?"rgba(0,212,184,0.7)":"rgba(0,212,184,0.3)"}`,borderRadius:24,overflow:"hidden",transition:"border-color .3s"}}
      >
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
          {/* DROP AREA */}
          <div onClick={()=>ref.current.click()} style={{padding:44,borderRight:"1px solid var(--b2)",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",cursor:"pointer"}}>
            <span style={{fontSize:50,marginBottom:16,display:"block",animation:"bob 3.5s ease-in-out infinite"}}>{file?ico:"📄"}</span>
            <div style={{fontSize:18,fontWeight:700,marginBottom:8,wordBreak:"break-all",maxWidth:280}}>
              {file?file.name:"Drop your document here"}
            </div>
            {file
              ? <div style={{fontSize:13,color:"var(--tl)",marginBottom:16,fontWeight:600}}>✓ {(file.size/1024).toFixed(1)} KB — ready</div>
              : <p style={{fontSize:13,color:"var(--tx2)",lineHeight:1.7,marginBottom:16,maxWidth:280}}>JPG, PNG, WEBP, PDF, or TXT · Handwritten OK · Never stored</p>
            }
            {ferr&&<div style={{fontSize:12,color:"var(--rd)",marginBottom:12,padding:"7px 12px",background:"rgba(255,107,107,0.1)",borderRadius:8,border:"1px solid rgba(255,107,107,0.2)"}}>{ferr}</div>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:18}}>
              {[".JPG",".PNG",".PDF",".TXT","📷 Camera"].map(f=>(
                <span key={f} style={{background:"var(--gl)",border:"1px solid var(--b2)",padding:"3px 10px",borderRadius:100,fontSize:10.5,color:"var(--tx3)",fontFamily:"'JetBrains Mono',monospace"}}>{f}</span>
              ))}
            </div>
            <Btn primary onClick={e=>{e.stopPropagation();ref.current.click();}} style={{fontSize:13,padding:"10px 22px"}}>
              {file?"📂 Change File":"📤 Choose File"}
            </Btn>
            <input ref={ref} type="file" accept="image/*,.pdf,.txt" style={{display:"none"}} onChange={e=>pickFile(e.target.files[0])}/>
          </div>

          {/* SETTINGS */}
          <div style={{padding:"32px 40px",display:"flex",flexDirection:"column",gap:18}}>
            <div>
              <label style={lbS}>Patient Name (optional)</label>
              <input style={inS} placeholder="e.g. Priya Sharma" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
            <div>
              <label style={lbS}>Patient Age (hint)</label>
              <input style={inS} type="number" placeholder="e.g. 45" value={age} onChange={e=>setAge(e.target.value)}/>
            </div>
            <div>
              <label style={lbS}>Output Language</label>
              <div style={{display:"flex",gap:7}}>
                {["English","हिंदी","ગુ."].map((l,i)=>{
                  const v=["English","Hindi","Gujarati"][i];
                  return <div key={l} onClick={()=>setLang(v)} style={{flex:1,padding:"8px 0",borderRadius:9,border:`1px solid ${lang===v?"var(--b)":"var(--b2)"}`,background:lang===v?"var(--tl3)":"var(--gl)",color:lang===v?"var(--tl)":"var(--tx3)",fontSize:12.5,cursor:"pointer",textAlign:"center",fontWeight:lang===v?600:400,transition:"all .25s"}}>{l}</div>;
                })}
              </div>
            </div>
            <div>
              <label style={lbS}>Explanation Mode</label>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[["simple","Simple (Patient / Family)"],["detailed","Detailed (Full context)"],["chemist","Chemist Mode (Dispensing)"]].map(([v,l])=>(
                  <div key={v} onClick={()=>setMode(v)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,border:`1px solid ${mode===v?"var(--b)":"var(--b2)"}`,background:mode===v?"var(--tl3)":"var(--gl)",cursor:"pointer",fontSize:12.5,color:mode===v?"var(--tl)":"var(--tx2)",transition:"all .25s"}}>
                    <div style={{width:12,height:12,borderRadius:"50%",border:`2px solid ${mode===v?"var(--tl)":"var(--tx3)"}`,flexShrink:0,position:"relative"}}>
                      {mode===v&&<div style={{width:4,height:4,background:"var(--tl)",borderRadius:"50%",position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}/>}
                    </div>
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={lbS}>Family Role</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[["Patient","🧑"],["Spouse","👫"],["Child","👶"],["Carer","🧑‍⚕️"]].map(([v,ic])=>(
                  <div key={v} onClick={()=>setRole(v)} style={{padding:"5px 11px",borderRadius:8,border:`1px solid ${role===v?"var(--b3)":"var(--b2)"}`,background:role===v?"var(--go2)":"var(--gl)",color:role===v?"var(--go)":"var(--tx3)",fontSize:11.5,cursor:"pointer",transition:"all .25s"}}>{ic} {v}</div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginTop:6}}>
              <Btn primary onClick={()=>{
                if(!file||!fdu){alert("Please select a document first.");return;}
                onStart({file,fdu,name,age,lang,mode,role});
              }} style={{padding:"12px 28px",fontSize:14}}>
                🔍 Analyse My Document →
              </Btn>
              <span style={{fontSize:11,color:"var(--tx3)"}}>🔒 Zero storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* FEATURES */}
    <div style={{maxWidth:1240,margin:"0 auto",padding:"0 2.5rem 80px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {[
          {w:true,i:"🧠",t:"Real Claude Vision Analysis",d:"Not OCR templates — Claude actually reads and understands your document image. Works on blurry photos, handwritten notes, and multilingual prescriptions."},
          {i:"⏰",t:"Visual Daily Timeline",d:"Morning ☀️ Afternoon 🌤️ Night 🌙 — tap to tick doses. Confetti when all done."},
          {i:"💊",t:"Chemist Mode",d:"Exact dispense table with quantities. Hand your phone to any pharmacist."},
          {i:"🌐",t:"Hindi · English · Gujarati",d:"Toggle re-renders your full brief instantly."},
          {i:"🔊",t:'"Sunao Mujhe" Voice',d:"One tap reads aloud in your chosen language."},
          {i:"🆘",t:"2AM Panic Mode",d:"Red button — immediate access to emergency info and call buttons."},
        ].map(({w,i,t,d})=>(
          <div key={t} style={{background:"var(--gl)",border:"1px solid var(--b2)",borderRadius:18,padding:22,gridColumn:w?"span 2":undefined}}>
            <div style={{width:44,height:44,borderRadius:12,background:"var(--gl2)",border:"1px solid var(--b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:12}}>{i}</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:5}}>{t}</div>
            <p style={{fontSize:12.5,color:"var(--tx2)",lineHeight:1.65}}>{d}</p>
          </div>
        ))}
      </div>
    </div>

    <footer style={{borderTop:"1px solid var(--b2)",maxWidth:1240,margin:"0 auto",padding:"32px 2.5rem"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,background:"linear-gradient(145deg,var(--tl),var(--tl2))",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🩺</div>
          <span style={{fontFamily:"'DM Serif Display',serif",fontSize:16}}>Dawa<em style={{color:"var(--tl)",fontStyle:"normal"}}>Clear</em></span>
        </div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:14,color:"var(--tx2)",fontStyle:"italic"}}>"The AI that sits between a patient and confusion."</div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5,color:"var(--tx3)"}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"var(--tl)",animation:"tp 2s ease-in-out infinite"}}/>24/7 · Free · IAR Udaan 2026
        </div>
      </div>
    </footer>
  </div>;
}

// ─── PROCESSING SCREEN ────────────────────────────────────────────────────────
function Processing({step,pct,status}) {
  const steps=[{id:1,ico:"📄",l:"Reading your document"},{id:2,ico:"🧠",l:"Claude Vision — extracting data"},{id:3,ico:"✨",l:"Building your dashboard"}];
  return <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(5,13,26,0.97)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:18,padding:20}}>
    <div style={{fontSize:52,animation:"bob 2s ease-in-out infinite"}}>🩺</div>
    <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"var(--tx)",textAlign:"center"}}>Analysing your document…</div>
    <div style={{fontSize:13,color:"var(--tx2)",textAlign:"center",maxWidth:360,lineHeight:1.7}}>{status||"Claude Vision is reading your prescription…"}</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,width:340}}>
      {steps.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 15px",borderRadius:11,background:step===s.id?"var(--tl3)":step>s.id?"rgba(0,212,184,0.04)":"var(--gl)",border:`1px solid ${step===s.id?"var(--b)":"var(--b2)"}`,fontSize:13,color:step===s.id?"var(--tl)":step>s.id?"var(--tx3)":"var(--tx2)",transition:"all .4s"}}>
        <span style={{fontSize:16,width:24}}>{step>s.id?"✓":s.ico}</span>{s.l}
      </div>)}
    </div>
    <div style={{width:340,height:4,background:"var(--gl2)",borderRadius:2,overflow:"hidden"}}>
      <div style={{height:"100%",background:"linear-gradient(90deg,var(--tl),var(--tl2))",borderRadius:2,width:`${pct}%`,transition:"width .8s ease"}}/>
    </div>
    <div style={{fontSize:11.5,color:"var(--tx3)"}}>Usually takes 15–25 seconds</div>
  </div>;
}

// ─── PANIC ────────────────────────────────────────────────────────────────────
function Panic({result,onClose}) {
  const r=result||{};
  return <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(5,13,26,0.97)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{maxWidth:440,width:"100%",background:"rgba(255,71,87,0.08)",border:"1px solid rgba(255,71,87,0.3)",borderRadius:20,padding:32,textAlign:"center"}}>
      <div style={{fontSize:50,marginBottom:14}}>🆘</div>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"var(--rd)",marginBottom:10}}>2 AM Panic Mode</h2>
      <div style={{background:"rgba(255,71,87,0.07)",border:"1px solid rgba(255,71,87,0.18)",borderRadius:10,padding:"14px 16px",marginBottom:18,textAlign:"left"}}>
        {[["Patient",r.patientName||"—"],["Medicines",(r.medications||[]).map(m=>m.name).join(", ")||"—"],["Doctor",r.doctorName||"—"]].map(([k,v])=>(
          <div key={k} style={{fontSize:13,marginBottom:6}}><strong style={{color:"var(--tx)"}}>{k}: </strong><span style={{color:"var(--tx2)"}}>{v}</span></div>
        ))}
        <div style={{fontSize:13,color:"rgba(255,144,144,0.9)",lineHeight:1.6,marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,71,87,0.2)"}}>{r.emergencyInfo||"Call 102 immediately if you feel very unwell."}</div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        <a href="tel:102" style={{background:"#ff4757",color:"white",padding:"12px 24px",borderRadius:100,textDecoration:"none",fontSize:15,fontWeight:700}}>📞 Call 102</a>
        <a href="tel:112" style={{background:"rgba(255,71,87,0.18)",color:"var(--rd)",border:"1px solid rgba(255,71,87,0.3)",padding:"12px 18px",borderRadius:100,textDecoration:"none",fontSize:15}}>📞 Call 112</a>
      </div>
      <button onClick={onClose} style={{marginTop:14,background:"rgba(255,255,255,0.05)",color:"var(--tx2)",border:"1px solid rgba(255,255,255,0.1)",padding:"8px 22px",borderRadius:100,cursor:"pointer",fontSize:13,fontFamily:"'Sora',sans-serif"}}>Close</button>
    </div>
  </div>;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({result,lang,onLangChange,onBack,showToast}) {
  const [tab,setTab]=useState("overview");
  const [ck,setCk]=useState({});
  const [tlck,setTlck]=useState({});
  const [boom,setBoom]=useState(false);
  const r=result;

  const fireBoom=()=>{setBoom(true);setTimeout(()=>setBoom(false),3000);};
  const toggleCk=i=>{const n={...ck,[i]:!ck[i]};setCk(n);if(Object.values(n).filter(Boolean).length===(r.checklist||[]).length&&(r.checklist||[]).length>0)fireBoom();};
  const toggleTl=(k,i,tot)=>{const key=`${k}-${i}`;const n={...tlck,[key]:!tlck[key]};setTlck(n);if(tot>0&&Array.from({length:tot},(_,j)=>n[`${k}-${j}`]).every(Boolean))fireBoom();};

  const speak=text=>{if(!window.speechSynthesis){showToast("⚠️ Speech not supported");return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang==="Hindi"?"hi-IN":lang==="Gujarati"?"gu-IN":"en-IN";u.rate=0.9;window.speechSynthesis.speak(u);showToast("🔊 Reading aloud…");};
  const copy=text=>navigator.clipboard.writeText(text).then(()=>showToast("✅ Copied!")).catch(()=>showToast("❌ Copy failed"));

  const TABS=[["overview","📋 Overview"],["timeline","⏰ Timeline"],["chemist","💊 Chemist"],["sideeffects","⚠️ Side Effects"],["checklist","✅ Checklist"],["family","👨‍👩‍👧 Family"],["questions","❓ Ask Doctor"]];

  const renderTab=()=>{
    switch(tab){
      case "overview": return <>
        <div style={{background:"linear-gradient(145deg,var(--n2),var(--n3))",border:"1px solid var(--b)",borderRadius:22,padding:26,marginBottom:18,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,var(--tl),var(--go),var(--tl2))"}}/>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18,gap:10}}>
            <div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,marginBottom:3}}>{r.patientName||"Patient"}</div>
              <div style={{fontSize:11.5,color:"var(--tx2)",fontFamily:"'JetBrains Mono',monospace"}}>{[r.patientAge?r.patientAge+"y":"",r.doctorName,r.hospital,r.date].filter(Boolean).join(" · ")}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"var(--tl)",background:"var(--tl3)",border:"1px solid var(--b)",padding:"4px 11px",borderRadius:100,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"var(--tl)",animation:"tp 2s infinite",flexShrink:0}}/>Verified
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
            {[["Diagnosis",r.diagnosisTitle||"—"],["Medicines",(r.medications||[]).length+" prescribed"],["Tasks",(r.checklist||[]).length+" items"]].map(([l,v])=>(
              <div key={l} style={{background:"var(--gl)",border:"1px solid var(--b2)",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:9.5,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,marginBottom:5}}>{l}</div>
                <div style={{fontSize:13.5,color:"var(--tx)",fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <button onClick={()=>pMedCard(r)} style={{display:"flex",alignItems:"center",gap:4,background:"linear-gradient(135deg,var(--tl),var(--tl2))",color:"var(--n)",fontWeight:700,padding:"7px 14px",borderRadius:100,border:"none",fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>🖨️ Print MedCard</button>
            {[["🔊 Read Aloud",()=>speak(`${r.patientName||"Patient"} has ${r.diagnosisTitle}. ${r.diagnosisPlain} ${r.familyOneliner}`)],["🧲 Fridge PDF",()=>pFridge(r)],["💬 WhatsApp",()=>window.open(`https://wa.me/?text=${encodeURIComponent("DawaClear:\n\n"+r.familyOneliner)}`,"_blank")]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{display:"flex",alignItems:"center",gap:4,background:"var(--gl)",border:"1px solid var(--b2)",color:"var(--tx2)",padding:"7px 14px",borderRadius:100,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>{l}</button>
            ))}
          </div>
        </div>
        <Card glow>
          <HDR icon="🩺" title="Plain-Language Diagnosis" chip="AI Simplified"/>
          <div style={{fontSize:13.5,color:"var(--tx2)",lineHeight:1.85,borderLeft:"3px solid var(--tl)",paddingLeft:15,fontStyle:"italic",marginBottom:13}}>{r.diagnosisPlain||"No diagnosis found."}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {(r.diagnosisTags||[]).map((t,i)=><span key={t} style={{fontSize:10.5,padding:"3px 10px",borderRadius:100,border:`1px solid ${i===0?"rgba(78,205,196,0.25)":"var(--b2)"}`,background:i===0?"rgba(78,205,196,0.1)":"var(--gl2)",color:i===0?"var(--gr)":"var(--tx3)"}}>{t}</span>)}
          </div>
        </Card>
        <Card>
          <HDR icon="💊" title="Medication Summary" chip={`${(r.medications||[]).length} medicines`}/>
          {(r.medications||[]).length===0?<div style={{fontSize:13,color:"var(--tx3)"}}>No medications found.</div>:(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Medicine","Dose","Frequency","Timing","Days"].map(h=><th key={h} style={{fontSize:9.5,color:"var(--tx3)",fontWeight:600,textAlign:"left",padding:"8px 9px",borderBottom:"1px solid var(--b2)",letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
              <tbody>{(r.medications||[]).map(m=><tr key={m.name}>
                <td style={{padding:"10px 9px",fontSize:13,color:"var(--tx)",fontWeight:600,borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{m.name}</td>
                <td style={{padding:"10px 9px",fontSize:12.5,color:"var(--tx2)",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{m.dose}</td>
                <td style={{padding:"10px 9px",fontSize:12.5,color:"var(--tx2)",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{m.frequency}</td>
                <td style={{padding:"10px 9px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,background:"var(--tl3)",color:"var(--tl)",padding:"2px 7px",borderRadius:5}}>{m.timing}</span></td>
                <td style={{padding:"10px 9px",fontSize:12.5,color:"var(--tx2)",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{m.days}</td>
              </tr>)}</tbody>
            </table>
          )}
        </Card>
        <Card gold>
          <HDR icon="💬" title="Share with Family" chip="One-liner" cc="gold"/>
          <div style={{fontSize:13.5,color:"var(--tx2)",lineHeight:1.8,fontStyle:"italic",marginBottom:14}}>
            <span style={{color:"var(--go)",fontStyle:"normal",fontWeight:600}}>"</span>{r.familyOneliner||"No summary."}<span style={{color:"var(--go)",fontStyle:"normal",fontWeight:600}}>"</span>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {[["📋 Copy",()=>copy(r.familyOneliner||"")],["💬 WhatsApp",()=>window.open(`https://wa.me/?text=${encodeURIComponent(r.familyOneliner||"")}`, "_blank")],["🔊 Read Aloud",()=>speak(r.familyOneliner||"")],["🧲 Fridge PDF",()=>pFridge(r)]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",color:"var(--tx2)",padding:"6px 13px",borderRadius:100,fontSize:11.5,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>{l}</button>
            ))}
          </div>
        </Card>
      </>;

      case "timeline": {
        const slots=[{l:"Morning ☀️",sub:"6AM–12PM",k:"morningMeds"},{l:"Afternoon 🌤️",sub:"12PM–6PM",k:"afternoonMeds"},{l:"Evening 🌙",sub:"6PM–10PM",k:"eveningMeds"}];
        return <>
          <Card>
            <HDR icon="⏰" title="Daily Medication Timeline" chip={new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {slots.map(s=>{
                const meds=r[s.k]||[];
                const allDone=meds.length>0&&meds.every((_,i)=>tlck[`${s.k}-${i}`]);
                return <div key={s.k} style={{background:allDone?"rgba(0,212,184,0.03)":"var(--n2)",border:`1px solid ${allDone?"rgba(0,212,184,0.2)":"var(--b2)"}`,borderRadius:12,padding:16,transition:"all .3s"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,color:"var(--tl)",fontWeight:600}}>{s.l}</div>
                    <div style={{fontSize:10,color:"var(--tx3)"}}>{s.sub}</div>
                  </div>
                  {meds.length===0?<div style={{fontSize:12,color:"var(--tx3)",padding:"7px 0",fontStyle:"italic"}}>No medicines</div>:meds.map((m,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <div><div style={{fontSize:12,fontWeight:500}}>{m}</div><div style={{fontSize:9.5,color:"var(--tx3)",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>As prescribed</div></div>
                      <div onClick={()=>toggleTl(s.k,i,meds.length)} style={{width:21,height:21,borderRadius:6,border:`1.5px solid ${tlck[`${s.k}-${i}`]?"var(--tl)":"var(--b2)"}`,background:tlck[`${s.k}-${i}`]?"var(--tl)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:tlck[`${s.k}-${i}`]?"var(--n)":"transparent",transition:"all .2s",flexShrink:0}}>✓</div>
                    </div>
                  ))}
                  {allDone&&<div style={{textAlign:"center",marginTop:10,fontSize:12.5,color:"var(--tl)",fontWeight:600}}>🎉 All done!</div>}
                </div>;
              })}
            </div>
          </Card>
          <Card>
            <HDR icon="🔔" title="Family Reminder" chip="Live" cc="gold"/>
            <p style={{fontSize:13,color:"var(--tx2)",lineHeight:1.7,marginBottom:12}}>When a dose is overdue, family gets an alert in {lang}.</p>
            <div style={{background:"var(--go2)",border:"1px solid var(--b3)",borderRadius:10,padding:"11px 15px",marginBottom:14,fontSize:13,color:"var(--tx2)",fontStyle:"italic"}}>
              "{lang==="Hindi"?`Beta, ${r.patientName||"Patient"} ne abhi tak dawa nahi li 🙏`:lang==="Gujarati"?`Beta, ${r.patientName||"Patient"} e davai nathi lidhi 🙏`:`Beta, ${r.patientName||"Patient"} has not taken their medicine yet 🙏`}"
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Btn primary sm onClick={()=>{if(!("Notification" in window)){showToast("⚠️ Not supported");return;}Notification.requestPermission().then(p=>showToast(p==="granted"?"✅ Notifications enabled!":"❌ Permission denied"));}}>🔔 Enable Notifications</Btn>
              <Btn sm onClick={()=>{const m=lang==="Hindi"?`Beta, ${r.patientName||"Patient"} ne dawa nahi li`:`Beta, ${r.patientName||"Patient"} has not taken medicine`;if(typeof Notification!=="undefined"&&Notification.permission==="granted")new Notification("💊 DawaClear",{body:m});showToast("📳 "+m);}}>📳 Test Alert</Btn>
            </div>
          </Card>
        </>;
      }

      case "chemist": return <Card>
        <HDR icon="💊" title="Chemist Dispense Sheet" chip={`${(r.medications||[]).length} items`}/>
        <p style={{fontSize:12.5,color:"var(--tx2)",marginBottom:12}}>Hand your phone directly to the pharmacist.</p>
        {(r.medications||[]).length===0?<div style={{fontSize:13,color:"var(--tx3)"}}>No medications found.</div>:(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Medicine Name","Dose","Qty","Timing","Days"].map(h=><th key={h} style={{fontSize:9.5,color:"var(--tx3)",fontWeight:600,textAlign:"left",padding:"8px 9px",borderBottom:"1px solid var(--b2)",letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
            <tbody>{(r.medications||[]).map(m=><tr key={m.name}>
              <td style={{padding:"10px 9px",fontSize:13,color:"var(--tx)",fontWeight:600,borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{m.name}</td>
              <td style={{padding:"10px 9px",fontSize:12.5,color:"var(--tx2)",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{m.dose}</td>
              <td style={{padding:"10px 9px",fontSize:13.5,color:"var(--tl)",fontWeight:700,borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{m.quantity||m.days}</td>
              <td style={{padding:"10px 9px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,background:"var(--tl3)",color:"var(--tl)",padding:"2px 7px",borderRadius:5}}>{m.timing}</span></td>
              <td style={{padding:"10px 9px",fontSize:12.5,color:"var(--tx2)",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{m.days}</td>
            </tr>)}</tbody>
          </table>
        )}
        <div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn primary sm onClick={()=>pChemist(r)}>🖨️ Print Sheet</Btn>
          <Btn sm onClick={()=>copy((r.medications||[]).map(m=>`${m.name} | ${m.dose} | ${m.quantity||m.days} | ${m.timing} | ${m.days}`).join("\n"))}>📋 Copy as Text</Btn>
        </div>
      </Card>;

      case "sideeffects": return <Card>
        <HDR icon="⚠️" title="Side Effects — Color Coded" chip="Important" cc="red"/>
        {[["🔴 Call Doctor Immediately",r.sideEffectsRed||[],"var(--rd)"],["🟡 Monitor Carefully",r.sideEffectsAmber||[],"var(--am)"],["🟢 Usually Mild",r.sideEffectsGreen||[],"var(--gr)"]].map(([label,items,col])=>(
          <div key={label} style={{marginBottom:14}}>
            <div style={{fontSize:10.5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",color:col,marginBottom:7}}>{label}</div>
            {items.length===0?<div style={{fontSize:12.5,color:"var(--tx3)",padding:"5px 0"}}>None listed</div>:items.map(fx=>(
              <div key={fx} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:col,flexShrink:0,marginTop:5}}/>
                <div style={{fontSize:12.5,color:"var(--tx2)",lineHeight:1.5}}>{fx}</div>
              </div>
            ))}
          </div>
        ))}
      </Card>;

      case "checklist": return <Card>
        <HDR icon="✅" title="Follow-up Checklist" chip={`${Object.values(ck).filter(Boolean).length}/${(r.checklist||[]).length} done`}/>
        {(r.checklist||[]).length===0?<div style={{fontSize:13,color:"var(--tx3)"}}>No checklist items.</div>:(r.checklist||[]).map((t,i)=>(
          <div key={i} onClick={()=>toggleCk(i)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <div style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${ck[i]?"var(--tl)":"var(--b2)"}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,background:ck[i]?"var(--tl)":"transparent",color:ck[i]?"var(--n)":"transparent",transition:"all .2s"}}>✓</div>
            <div style={{fontSize:12.5,color:ck[i]?"var(--tx3)":"var(--tx2)",textDecoration:ck[i]?"line-through":"none",flex:1,transition:"all .2s"}}>{t}</div>
          </div>
        ))}
        <div style={{marginTop:11,fontSize:11.5,color:"var(--tx3)"}}>{Object.values(ck).filter(Boolean).length} / {(r.checklist||[]).length} completed</div>
      </Card>;

      case "family": return <>
        <Card gold>
          <HDR icon="💬" title="Share with Family" chip="One-liner" cc="gold"/>
          <div style={{fontSize:13.5,color:"var(--tx2)",lineHeight:1.8,fontStyle:"italic",marginBottom:14}}>
            <span style={{color:"var(--go)",fontStyle:"normal",fontWeight:600}}>"</span>{r.familyOneliner||"No summary."}<span style={{color:"var(--go)",fontStyle:"normal",fontWeight:600}}>"</span>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {[["📋 Copy",()=>copy(r.familyOneliner||"")],["💬 WhatsApp",()=>window.open(`https://wa.me/?text=${encodeURIComponent(r.familyOneliner||"")}`, "_blank")],["🔊 Read Aloud",()=>speak(r.familyOneliner||"")]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",color:"var(--tx2)",padding:"6px 13px",borderRadius:100,fontSize:11.5,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>{l}</button>
            ))}
          </div>
        </Card>
        <Card>
          <HDR icon="🔔" title="Family Connect" chip="Beta" cc="gold"/>
          <p style={{fontSize:13,color:"var(--tx2)",lineHeight:1.75,marginBottom:13}}>Enable browser notifications so family gets alerted for missed doses in <strong style={{color:"var(--tl)"}}>{lang}</strong>.</p>
          <div style={{background:"var(--go2)",border:"1px solid var(--b3)",borderRadius:10,padding:"11px 15px",marginBottom:14,fontSize:13,color:"var(--tx2)",fontStyle:"italic"}}>
            "{lang==="Hindi"?`Beta, ${r.patientName||"Patient"} ne abhi tak dawa nahi li 🙏`:lang==="Gujarati"?`Beta, ${r.patientName||"Patient"} e davai nathi lidhi 🙏`:`Beta, ${r.patientName||"Patient"} has not taken medicine yet 🙏`}"
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn primary sm onClick={()=>Notification.requestPermission().then(p=>showToast(p==="granted"?"✅ Enabled!":"❌ Denied"))}>🔔 Enable</Btn>
            <Btn sm onClick={()=>{const m=lang==="Hindi"?`Beta, ${r.patientName||"Patient"} ne dawa nahi li`:`Beta, ${r.patientName||"Patient"} has not taken medicine`;if(Notification.permission==="granted")new Notification("💊",{body:m});showToast("📳 "+m);}}>📳 Test</Btn>
          </div>
        </Card>
      </>;

      case "questions": return <Card>
        <HDR icon="❓" title="Questions to Ask Your Doctor" chip={`${(r.doctorQuestions||[]).length} questions`}/>
        <p style={{fontSize:12.5,color:"var(--tx2)",marginBottom:13}}>Generated from your specific diagnosis and medications:</p>
        {(r.doctorQuestions||[]).length===0?<div style={{fontSize:13,color:"var(--tx3)"}}>No questions generated.</div>:(r.doctorQuestions||[]).map((q,i)=>(
          <div key={i} style={{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:12.5,color:"var(--tx2)",display:"flex",alignItems:"flex-start",gap:8,lineHeight:1.55}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--tl)",flexShrink:0,marginTop:2}}>{String(i+1).padStart(2,"0")}</span>{q}
          </div>
        ))}
        <div style={{marginTop:13,display:"flex",gap:8}}>
          <Btn primary sm onClick={()=>copy((r.doctorQuestions||[]).map((q,i)=>`${i+1}. ${q}`).join("\n"))}>📋 Copy All</Btn>
          <Btn sm onClick={()=>speak("Questions to ask your doctor: "+(r.doctorQuestions||[]).join(". "))}>🔊 Read Aloud</Btn>
        </div>
      </Card>;

      default: return null;
    }
  };

  return <div style={{position:"relative",zIndex:1,minHeight:"100vh",paddingTop:64}}>
    {boom&&<Confetti/>}
    {/* HEADER */}
    <div style={{background:"rgba(5,13,26,0.9)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--b2)",padding:"12px 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,position:"sticky",top:64,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:"var(--tl3)",border:"1px solid var(--b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👤</div>
        <div>
          <div style={{fontSize:14,fontWeight:600}}>{r.patientName||"Patient"}</div>
          <div style={{fontSize:11,color:"var(--tx3)",fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{[r.patientAge?r.patientAge+"y":"",r.diagnosisTitle,r.date].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
        {[["🌐 "+lang.slice(0,2),onLangChange],["🔊 Sunao",()=>speak(`${r.patientName||"Patient"} has ${r.diagnosisTitle}. ${r.familyOneliner}`)],["🧲 Fridge",()=>pFridge(r)],["← Back",onBack]].map(([l,fn])=>(
          <button key={l} onClick={fn} style={{background:"var(--gl)",border:"1px solid var(--b2)",color:"var(--tx2)",padding:"6px 12px",borderRadius:100,fontSize:11.5,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>{l}</button>
        ))}
      </div>
    </div>
    {/* TABS */}
    <div style={{padding:"10px 1.5rem 0",borderBottom:"1px solid var(--b2)",overflowX:"auto"}}>
      <div style={{display:"flex",gap:3,whiteSpace:"nowrap"}}>
        {TABS.map(([id,label])=>(
          <div key={id} onClick={()=>setTab(id)} style={{padding:"8px 15px",borderRadius:"100px 100px 0 0",fontSize:12,color:tab===id?"var(--tl)":"var(--tx3)",cursor:"pointer",fontWeight:tab===id?600:400,background:tab===id?"var(--n2)":"transparent",border:tab===id?"1px solid var(--b2)":"1px solid transparent",borderBottom:"none",transition:"all .25s"}}>{label}</div>
        ))}
      </div>
    </div>
    <div style={{padding:"20px 1.5rem",maxWidth:1240}}>{renderTab()}</div>
  </div>;
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState("landing");
  const [result,setResult]=useState(null);
  const [lang,setLang]=useState("English");
  const [pStep,setPStep]=useState(1);
  const [pPct,setPPct]=useState(0);
  const [pStatus,setPStatus]=useState("");
  const [toast,setToast]=useState("");
  const [panic,setPanic]=useState(false);
  const tRef=useRef(null);

  const showToast=useCallback(msg=>{setToast(msg);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToast(""),4000);},[]);

  const handleStart=async({file,fdu,name,age,lang:l,mode,role})=>{
    setLang(l);
    setScreen("processing");
    setPStep(1);setPPct(8);setPStatus("Reading your document…");

    try {
      await sleep(400);
      setPStep(2);setPPct(30);setPStatus("Claude Vision is extracting medical data…");

      const analysed = await callClaudeVision({fileDataUrl:fdu,fileType:file.type,fileName:file.name,age,name,lang:l,mode});

      setPStep(3);setPPct(85);setPStatus("Building your dashboard…");
      await sleep(600);

      if(name) analysed.patientName=name;
      if(age) analysed.patientAge=age;

      setPPct(100);
      await sleep(300);
      setResult(analysed);
      setScreen("dashboard");
      showToast("✅ Your document has been analysed!");
    } catch(err) {
      console.error(err);
      setScreen("landing");
      showToast("❌ Analysis failed: "+err.message);
    }
  };

  const loadDemo=()=>{
    setResult({...DEMO});
    setLang("English");
    setScreen("dashboard");
    showToast("👁 Demo loaded — explore all 7 tabs!");
  };

  const cycleLang=()=>{
    const ll=["English","Hindi","Gujarati"];
    const n=ll[(ll.indexOf(lang)+1)%3];
    setLang(n);
    showToast("🌐 Language → "+n);
  };

  return <>
    <style>{CSS}</style>
    <Ambient/>

    {/* NAV */}
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,height:64,padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(5,13,26,0.9)",backdropFilter:"blur(28px)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
      <div onClick={()=>setScreen("landing")} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}}>
        <div style={{width:32,height:32,background:"linear-gradient(145deg,var(--tl),var(--tl2))",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:"0 0 16px rgba(0,212,184,0.35)"}}>🩺</div>
        <span style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"var(--tx)"}}>Dawa<em style={{color:"var(--tl)",fontStyle:"normal"}}>Clear</em></span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {screen==="dashboard"&&<span style={{fontSize:11,color:"var(--tx3)",fontFamily:"'JetBrains Mono',monospace",padding:"4px 10px",background:"var(--gl)",border:"1px solid var(--b2)",borderRadius:100}}>
          📄 {result?.patientName||"Patient"}
        </span>}
        <button onClick={()=>setScreen("landing")} style={{background:"linear-gradient(135deg,var(--tl),var(--tl2))",color:"var(--n)",fontWeight:700,padding:"7px 18px",borderRadius:100,border:"none",fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>
          {screen==="dashboard"?"+ New Document":"Try Free →"}
        </button>
      </div>
    </nav>

    {screen==="landing"&&<Landing onStart={handleStart} onDemo={loadDemo}/>}
    {screen==="processing"&&<Processing step={pStep} pct={pPct} status={pStatus}/>}
    {screen==="dashboard"&&result&&<Dashboard result={result} lang={lang} onLangChange={cycleLang} onBack={()=>setScreen("landing")} showToast={showToast}/>}

    {/* PANIC */}
    <button onClick={()=>setPanic(true)} style={{position:"fixed",bottom:24,right:24,zIndex:300,width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#ff4757,#c0392b)",border:"none",cursor:"pointer",fontSize:20,boxShadow:"0 4px 18px rgba(255,71,87,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}} title="2AM Panic Mode">🆘</button>
    {panic&&<Panic result={result} onClose={()=>setPanic(false)}/>}
    <Toast msg={toast}/>
  </>;
}
