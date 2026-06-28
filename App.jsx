import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "";

const FLAG = {
  "Mexico":"🇲🇽","South Korea":"🇰🇷","South Africa":"🇿🇦","Czechia":"🇨🇿","Canada":"🇨🇦",
  "Switzerland":"🇨🇭","Qatar":"🇶🇦","Bosnia-Herzegovina":"🇧🇦","Brazil":"🇧🇷","Morocco":"🇲🇦",
  "Scotland":"🏴","Haiti":"🇭🇹","United States":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺",
  "Türkiye":"🇹🇷","Germany":"🇩🇪","Ecuador":"🇪🇨","Ivory Coast":"🇨🇮","Curaçao":"🇨🇼",
  "Netherlands":"🇳🇱","Japan":"🇯🇵","Tunisia":"🇹🇳","Sweden":"🇸🇪","Belgium":"🇧🇪","Iran":"🇮🇷",
  "Egypt":"🇪🇬","New Zealand":"🇳🇿","Spain":"🇪🇸","Uruguay":"🇺🇾","Saudi Arabia":"🇸🇦",
  "Cape Verde":"🇨🇻","France":"🇫🇷","Senegal":"🇸🇳","Norway":"🇳🇴","Iraq":"🇮🇶","Argentina":"🇦🇷",
  "Austria":"🇦🇹","Algeria":"🇩🇿","Jordan":"🇯🇴","Portugal":"🇵🇹","Colombia":"🇨🇴",
  "Uzbekistan":"🇺🇿","DR Congo":"🇨🇩","England":"🏴","Croatia":"🇭🇷","Panama":"🇵🇦","Ghana":"🇬🇭",
};

// R32 in official bracket order. Index pairs (0,1)->(2,3)... feed R16.
const R32 = [
  ["South Africa","Canada"],      // m1
  ["Brazil","Japan"],             // m2
  ["Germany","Paraguay"],         // m3
  ["Netherlands","Morocco"],      // m4
  ["Ivory Coast","Norway"],       // m5
  ["France","Sweden"],            // m6
  ["Mexico","Ecuador"],           // m7
  ["England","DR Congo"],         // m8
  ["Belgium","Senegal"],          // m9
  ["United States","Bosnia-Herzegovina"], // m10
  ["Spain","Austria"],            // m11
  ["Switzerland","Algeria"],      // m12
  ["Portugal","Croatia"],         // m13
  ["Australia","Egypt"],          // m14
  ["Argentina","Cape Verde"],     // m15
  ["Colombia","Ghana"],           // m16
];

const C = { ink:"#0E1B2A", paper:"#F4EFE6", grass:"#0B6E4F", grassDk:"#084d37",
  gold:"#E8B53A", red:"#C8472E", line:"#d8cfbf", mute:"#6b7d72" };
const F_DISP="'Bebas Neue','Arial Narrow',sans-serif";
const F_BODY="'DM Sans',system-ui,sans-serif";

const ROUNDS = [
  {key:"r32", name:"Round of 32", pts:"6 pts each", games:16},
  {key:"r16", name:"Round of 16", pts:"10 pts each", games:8},
  {key:"qf",  name:"Quarterfinals", pts:"18 pts each", games:4},
  {key:"sf",  name:"Semifinals", pts:"30 pts each", games:2},
  {key:"final", name:"Final", pts:"52 pts", games:1},
];

export default function App(){
  const [me,setMe] = useState("");
  const [phone,setPhone] = useState("");
  const [step,setStep] = useState("id"); // id -> r32 -> r16 -> qf -> sf -> final -> done
  // picks per round: arrays of winners advancing
  const [r32,setR32] = useState({});  // matchIndex -> team
  const [r16,setR16] = useState({});
  const [qf,setQf] = useState({});
  const [sf,setSf] = useState({});
  const [final,setFinal] = useState({});
  const [submitting,setSubmitting] = useState(false);

  // resume draft
  useEffect(()=>{ try{
    const raw=localStorage.getItem("tlfkatl_bracket_draft");
    if(raw){const d=JSON.parse(raw);setMe(d.me||"");setPhone(d.phone||"");
      setR32(d.r32||{});setR16(d.r16||{});setQf(d.qf||{});setSf(d.sf||{});setFinal(d.final||{});}
  }catch(e){} },[]);
  useEffect(()=>{ try{
    localStorage.setItem("tlfkatl_bracket_draft",JSON.stringify({me,phone,r32,r16,qf,sf,final}));
  }catch(e){} },[me,phone,r32,r16,qf,sf,final]);

  // derive the matchups for a round from prior round's winners
  function r16Games(){ return pairUp(R32.map((_,i)=>r32[i])); }
  function qfGames(){ return pairUp(idxArr(8).map(i=>r16[i])); }
  function sfGames(){ return pairUp(idxArr(4).map(i=>qf[i])); }
  function finalGame(){ return pairUp(idxArr(2).map(i=>sf[i])); }

  function pairUp(arr){
    const out=[]; for(let i=0;i<arr.length;i+=2) out.push([arr[i],arr[i+1]]); return out;
  }
  function idxArr(n){ return Array.from({length:n},(_,i)=>i); }

  const r32Done = R32.every((_,i)=>r32[i]);
  const r16Done = r16Games().every((g,i)=>g[0]&&g[1]&&r16[i]);
  const qfDone  = qfGames().every((g,i)=>g[0]&&g[1]&&qf[i]);
  const sfDone  = sfGames().every((g,i)=>g[0]&&g[1]&&sf[i]);
  const finalDone = finalGame().every((g,i)=>g[0]&&g[1]&&final[i]);

  async function submit(){
    if(submitting) return;
    setSubmitting(true);
    const bracket = {
      r32: R32.map((m,i)=>({match:m, pick:r32[i]})),
      r16: r16Games().map((m,i)=>({match:m, pick:r16[i]})),
      qf:  qfGames().map((m,i)=>({match:m, pick:qf[i]})),
      sf:  sfGames().map((m,i)=>({match:m, pick:sf[i]})),
      final: finalGame().map((m,i)=>({match:m, pick:final[i]})),
      champion: final[0],
    };
    try{
      const res=await fetch(`${API}/bracket`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username:me.trim(),phone:phone.trim(),bracket,submittedAt:Date.now()}),
      });
      if(!res.ok) throw new Error("save");
      localStorage.removeItem("tlfkatl_bracket_draft");
      setStep("done");
    }catch(e){ alert("Couldn't save — check connection and try again."); }
    finally{ setSubmitting(false); }
  }

  return (
    <div style={{fontFamily:F_BODY,color:C.ink,background:C.paper,minHeight:"100vh",
      maxWidth:430,margin:"0 auto",paddingBottom:96}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        @keyframes rise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}.sec{animation:rise .25s ease}`}</style>

      <div style={{padding:"18px 16px 8px",textAlign:"center"}}>
        <div style={{fontFamily:F_DISP,fontSize:30,letterSpacing:1}}>TLFKATL</div>
        <div style={{color:C.grass,fontWeight:700,letterSpacing:2.5,fontSize:10.5,marginTop:2}}>KNOCKOUT BRACKET</div>
      </div>

      {step!=="id" && step!=="done" && <Progress step={step}/>}

      <div style={{padding:"4px 16px"}}>
        {step==="id" && <Identify me={me} setMe={setMe} phone={phone} setPhone={setPhone} next={()=>setStep("r32")}/>}
        {step==="r32" && <RoundPicker title="Round of 32" sub="Pick all 16 winners · 6 pts each"
          games={R32} picks={r32} setPick={(i,t)=>setR32({...r32,[i]:t})}/>}
        {step==="r16" && <RoundPicker title="Round of 16" sub="10 pts each"
          games={r16Games()} picks={r16} setPick={(i,t)=>setR16({...r16,[i]:t})}/>}
        {step==="qf" && <RoundPicker title="Quarterfinals" sub="18 pts each"
          games={qfGames()} picks={qf} setPick={(i,t)=>setQf({...qf,[i]:t})}/>}
        {step==="sf" && <RoundPicker title="Semifinals" sub="30 pts each"
          games={sfGames()} picks={sf} setPick={(i,t)=>setSf({...sf,[i]:t})}/>}
        {step==="final" && <RoundPicker title="The Final" sub="52 pts · pick your champion"
          games={finalGame()} picks={final} setPick={(i,t)=>setFinal({...final,[i]:t})} champion/>}
        {step==="done" && <Done me={me} champ={final[0]}/>}
      </div>

      {step!=="done" && (
        <Footer
          step={step}
          canNext={
            step==="id" ? (me.trim().length>=2 && phone.trim().length>=7) :
            step==="r32" ? r32Done : step==="r16" ? r16Done :
            step==="qf" ? qfDone : step==="sf" ? sfDone : finalDone
          }
          submitting={submitting}
          back={()=>setStep(prevStep(step))}
          next={()=>{ step==="final" ? submit() : setStep(nextStep(step)); }}
        />
      )}
    </div>
  );
}

const ORDER=["id","r32","r16","qf","sf","final"];
function nextStep(s){ return ORDER[Math.min(ORDER.length-1,ORDER.indexOf(s)+1)]; }
function prevStep(s){ return ORDER[Math.max(0,ORDER.indexOf(s)-1)]; }

function Identify({me,setMe,phone,setPhone,next}){
  return (
    <div className="sec" style={{paddingTop:16}}>
      <div style={{textAlign:"center",fontSize:48,marginBottom:6}}>🏆</div>
      <h2 style={{fontFamily:F_DISP,fontSize:34,textAlign:"center",margin:"0 0 4px",letterSpacing:.5}}>FILL YOUR BRACKET</h2>
      <p style={{textAlign:"center",color:C.mute,fontSize:13.5,lineHeight:1.5,margin:"0 0 22px"}}>
        Pick every knockout game through to the champion. One-and-done — locks at the first Round of 32 kickoff.
      </p>
      <div style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:16,padding:18}}>
        <Label>USERNAME</Label>
        <div style={{fontSize:11.5,color:C.mute,margin:"0 0 6px"}}>Use the same name as your group-stage picks.</div>
        <input value={me} onChange={e=>setMe(e.target.value)} placeholder="e.g. himbo_jay" style={inp}/>
        <div style={{height:14}}/>
        <Label>PHONE</Label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" placeholder="(555) 123-4567" style={inp}/>
      </div>
    </div>
  );
}

function RoundPicker({title,sub,games,picks,setPick,champion}){
  return (
    <div className="sec" style={{paddingTop:8}}>
      <h2 style={{fontFamily:F_DISP,fontSize:34,margin:"2px 0 2px",letterSpacing:.5}}>{title}</h2>
      <div style={{fontSize:12.5,color:C.mute,marginBottom:14}}>{sub}</div>
      {games.map((g,i)=>(
        <div key={i} style={{marginBottom:10}}>
          <div style={{fontSize:10,color:C.mute,marginBottom:4,letterSpacing:.5}}>{champion?"CHAMPION":"MATCH "+(i+1)}</div>
          <div style={{display:"flex",gap:8}}>
            {[0,1].map(side=>{
              const team=g[side];
              const on=picks[i]===team;
              return (
                <button key={side} disabled={!team} onClick={()=>team&&setPick(i,team)} style={{
                  flex:1,padding:"14px 8px",borderRadius:12,fontSize:14,fontWeight:on?700:600,
                  border:`1.5px solid ${on?C.grass:C.line}`,background:on?C.grass:"#fff",
                  color:on?"#fff":(team?C.ink:C.mute),cursor:team?"pointer":"default",
                  fontFamily:F_BODY,textAlign:"left",lineHeight:1.2}}>
                  <div style={{fontSize:18}}>{team?FLAG[team]:"—"}</div>
                  <div style={{marginTop:3}}>{team||"TBD"}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Progress({step}){
  const idx=ORDER.indexOf(step)-1; // r32=0..final=4
  return (
    <div style={{padding:"6px 16px 4px"}}>
      <div style={{display:"flex",gap:5}}>
        {ROUNDS.map((r,i)=>(
          <div key={r.key} style={{flex:1,height:6,borderRadius:99,
            background:i<=idx?C.grass:C.line}}/>
        ))}
      </div>
      <div style={{fontSize:10.5,color:C.mute,marginTop:5,letterSpacing:.3}}>
        Step {idx+1} of 5 · {ROUNDS[idx]?.name}
      </div>
    </div>
  );
}

function Done({me,champ}){
  return (
    <div className="sec" style={{textAlign:"center",paddingTop:60}}>
      <div style={{fontSize:64}}>🏆</div>
      <h2 style={{fontFamily:F_DISP,fontSize:40,margin:"12px 0 6px",letterSpacing:1}}>BRACKET LOCKED</h2>
      <p style={{color:C.mute,fontSize:15,lineHeight:1.6,maxWidth:300,margin:"0 auto"}}>
        Saved for <b style={{color:C.ink}}>{me}</b>. Your pick to win it all:
      </p>
      <div style={{fontSize:40,marginTop:14}}>{FLAG[champ]}</div>
      <div style={{fontFamily:F_DISP,fontSize:30,marginTop:2}}>{champ}</div>
      <div style={{marginTop:24,fontSize:13,color:C.mute}}>You can close this page now.</div>
    </div>
  );
}

const inp={width:"100%",padding:"13px 14px",borderRadius:11,border:`1.5px solid ${C.line}`,
  fontSize:15,fontFamily:F_BODY,background:"#fff",color:C.ink,outline:"none"};
function Label({children}){
  return <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.mute,marginBottom:6}}>{children}</div>;
}
function Footer({step,canNext,back,next,submitting}){
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:430,margin:"0 auto",
      background:"rgba(244,239,230,.94)",backdropFilter:"blur(8px)",borderTop:`1px solid ${C.line}`,
      padding:"12px 16px",display:"flex",gap:10}}>
      {step!=="id" && (
        <button onClick={back} style={{padding:"14px 18px",borderRadius:12,border:`1.5px solid ${C.line}`,
          background:"#fff",fontWeight:700,fontSize:14,color:C.ink,cursor:"pointer"}}>Back</button>
      )}
      <button onClick={next} disabled={!canNext||submitting} style={{
        flex:1,padding:"14px",borderRadius:12,border:"none",fontWeight:700,fontSize:15,
        background:(canNext&&!submitting)?C.grass:C.line,color:(canNext&&!submitting)?"#fff":C.mute,
        cursor:(canNext&&!submitting)?"pointer":"not-allowed",fontFamily:F_BODY}}>
        {submitting?"Saving…": step==="id"?"Start bracket →": step==="final"?"Lock in bracket ✓":"Next round →"}
      </button>
    </div>
  );
}
