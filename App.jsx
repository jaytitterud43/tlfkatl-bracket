import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "";

// ── shared data: groups, flags, pairings (mirrors backend) ──
const GROUPS = {
  A:["Mexico","South Korea","South Africa","Czechia"],
  B:["Canada","Switzerland","Qatar","Bosnia-Herzegovina"],
  C:["Brazil","Morocco","Scotland","Haiti"],
  D:["United States","Paraguay","Australia","Türkiye"],
  E:["Germany","Ecuador","Ivory Coast","Curaçao"],
  F:["Netherlands","Japan","Tunisia","Sweden"],
  G:["Belgium","Iran","Egypt","New Zealand"],
  H:["Spain","Uruguay","Saudi Arabia","Cape Verde"],
  I:["France","Senegal","Norway","Iraq"],
  J:["Argentina","Austria","Algeria","Jordan"],
  K:["Portugal","Colombia","Uzbekistan","DR Congo"],
  L:["England","Croatia","Panama","Ghana"],
};
const PAIRINGS = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
const GLETTERS = Object.keys(GROUPS);
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
function gamesFor(L){
  const t=GROUPS[L];
  return PAIRINGS.map(([i,j],idx)=>({id:`${L}${idx+1}`,home:t[i],away:t[j]}));
}

const C = { ink:"#0E1B2A", paper:"#F4EFE6", grass:"#0B6E4F", grassDk:"#084d37",
  gold:"#E8B53A", red:"#C8472E", line:"#d8cfbf", mute:"#6b7d72", live:"#C8472E" };
const F_DISP="'Bebas Neue','Arial Narrow',sans-serif";
const F_BODY="'DM Sans',system-ui,sans-serif";

// Build {gid: "home"|"draw"|"away"} for COMPLETED games only, from the live feed.
function resultsFromLive(live){
  const out={};
  (live?.matches||[]).forEach(m=>{
    if(m.status!=="completed") return;
    const h=m.homeScore, a=m.awayScore;
    if(h==null||a==null) return;
    out[m.gid] = h>a?"home" : h<a?"away" : "draw";
  });
  return out;
}
// Given a person's picks + the results map, count correct/wrong on PLAYED games only.
function correctness(picks, results){
  let correct=0, wrong=0;
  const per=[];
  for(const gid of Object.keys(results)){
    const pick=picks?.[gid];
    if(!pick) continue;                 // they had no pick (shouldn't happen, but safe)
    const hit = pick===results[gid];
    hit?correct++:wrong++;
    per.push({gid, pick, actual:results[gid], hit});
  }
  const played = correct+wrong;
  const pct = played? Math.ceil((correct/played)*100) : null;   // round UP per request
  return { correct, wrong, played, pct, per };
}

export default function App(){
  const [tab,setTab] = useState("home");
  const [me,setMe] = useState(null);            // username string
  const [board,setBoard] = useState(null);
  const [live,setLive] = useState(null);
  const [allPicks,setAllPicks] = useState(null);
  const [knockout,setKnockout] = useState(null);
  const [brackets,setBrackets] = useState(null);

  // identity: remembered on device
  useEffect(()=>{ try{ const u=localStorage.getItem("tlfkatl_me"); if(u) setMe(u); }catch(e){} },[]);

  async function load(){
    try{
      const [s,l,p,k,b] = await Promise.all([
        fetch(`${API}/scores`).then(r=>r.json()),
        fetch(`${API}/live`).then(r=>r.json()),
        fetch(`${API}/picks`).then(r=>r.json()),
        fetch(`${API}/knockout`).then(r=>r.json()).catch(()=>null),
        fetch(`${API}/brackets`).then(r=>r.json()).catch(()=>null),
      ]);
      setBoard(s); setLive(l); setAllPicks(p); setKnockout(k); setBrackets(b);
    }catch(e){}
  }
  useEffect(()=>{ load(); const t=setInterval(load,60*1000); return ()=>clearInterval(t); },[]);

  function chooseMe(u){ setMe(u); try{ localStorage.setItem("tlfkatl_me",u); }catch(e){} }

  return (
    <div style={{fontFamily:F_BODY,color:C.ink,background:C.paper,minHeight:"100vh",
      maxWidth:430,margin:"0 auto",paddingBottom:74}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        @keyframes blink{50%{opacity:.35}} .livedot{animation:blink 1.4s infinite}
        @keyframes rise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
        .sec{animation:rise .25s ease}`}</style>

      <div style={{padding:"16px 16px 10px",textAlign:"center"}}>
        <div style={{fontFamily:F_DISP,fontSize:32,letterSpacing:1,lineHeight:.9}}>TLFKATL</div>
        <div style={{color:C.grass,fontWeight:700,letterSpacing:2.5,fontSize:10.5,marginTop:2}}>WORLD CUP 2026</div>
      </div>

      <div style={{padding:"0 16px"}}>
        {tab==="home" && <Home board={board} live={live} allPicks={allPicks} me={me} />}
        {tab==="leaderboard" && <Leaderboard board={board} live={live} />}
        {tab==="mypicks" && <MyPicks me={me} allPicks={allPicks} chooseMe={chooseMe} board={board} live={live} />}
        {tab==="everyone" && <Everyone allPicks={allPicks} />}
        {tab==="bracket" && <BracketView knockout={knockout} brackets={brackets} board={board} me={me} chooseMe={chooseMe} />}
        {tab==="rules" && <Rules />}
      </div>

      <Nav tab={tab} setTab={setTab} />
    </div>
  );
}

// ── HOME ──
function Home({board,live,allPicks,me}){
  if(!board||!live) return <Loading/>;
  const rows = board.leaderboard||[];
  const top3 = rows.slice(0,3);
  const matches = (live.matches||[]).slice().sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
  const now = Date.now();

  // tally everyone's pick for a given game id -> {home, draw, away, total}
  function tally(gid){
    const t={home:0,draw:0,away:0};
    (allPicks||[]).forEach(p=>{ const v=p.picks?.[gid]; if(v&&t[v]!==undefined) t[v]++; });
    return {...t, total:t.home+t.draw+t.away};
  }
  // the logged-in user's pick for a game, only if identified
  function myPick(gid){
    if(!me) return null;
    const rec=(allPicks||[]).find(p=>p.username===me);
    return rec?.picks?.[gid] || null;
  }
  // names grouped by pick for a game -> {home:[...], draw:[...], away:[...]}
  function namesByPick(gid){
    const g={home:[],draw:[],away:[]};
    (allPicks||[]).forEach(p=>{ const v=p.picks?.[gid]; if(v&&g[v]) g[v].push(p.username); });
    return g;
  }

  // "today/next" games: in progress, or the soonest upcoming day
  const liveNow = matches.filter(m=>m.status==="in_progress");
  const upcoming = matches.filter(m=>m.status==="scheduled");
  const nextDay = upcoming.length ? new Date(upcoming[0].datetime).toDateString() : null;
  const todays = matches.filter(m=>{
    if(m.status==="in_progress") return true;
    if(m.status==="scheduled" && nextDay) return new Date(m.datetime).toDateString()===nextDay;
    return false;
  }).slice(0,6);

  const anyPoints = rows.some(r=>r.points>0);

  return (
    <div className="sec">
      {/* games banner */}
      <SecLabel>{liveNow.length?"● LIVE & UP NEXT":"UP NEXT"}</SecLabel>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,marginBottom:18}}>
        {todays.length===0 && <Card><span style={{color:C.mute,fontSize:13}}>No games scheduled.</span></Card>}
        {todays.map(m=>{
          const playing=m.status==="in_progress", done=m.status==="completed";
          const t=new Date(m.datetime).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
          const tl=tally(m.gid);
          const mine=myPick(m.gid);
          const minePretty = mine==="home"?m.home : mine==="away"?m.away : mine==="draw"?"Draw" : null;
          return (
            <div key={m.gid} style={{minWidth:172,background:"#fff",border:`1px solid ${playing?C.live:C.line}`,
              borderRadius:12,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:playing?C.live:C.mute,fontWeight:700,marginBottom:6,letterSpacing:.5}}>
                {playing?<span><span className="livedot">●</span> LIVE</span>:done?"FT":t} · GRP {m.group}
              </div>
              <ScoreLine flag={FLAG[m.home]} team={m.home} score={m.homeScore} show={playing||done}/>
              <ScoreLine flag={FLAG[m.away]} team={m.away} score={m.awayScore} show={playing||done}/>

              {/* pick distribution (tap to expand who picked what) */}
              <PickBar tl={tl} homeTeam={m.home} awayTeam={m.away} names={namesByPick(m.gid)}/>

              {/* the logged-in user's pick, only if identified */}
              {minePretty && (
                <div style={{marginTop:7,fontSize:11,color:C.grass,fontWeight:700,
                  borderTop:`1px solid ${C.line}`,paddingTop:6}}>
                  Your pick: {mine==="draw"?"Draw":`${FLAG[minePretty]||""} ${minePretty}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* podium */}
      <SecLabel>PODIUM</SecLabel>
      <Podium top3={top3} anyPoints={anyPoints}/>

      {/* standings snapshot */}
      <SecLabel>STANDINGS</SecLabel>
      {rows.slice(0,5).map((r,i)=>(
        <div key={r.username} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",
          border:`1px solid ${C.line}`,borderRadius:11,padding:"9px 12px",marginBottom:6}}>
          <span style={{fontFamily:F_DISP,fontSize:22,minWidth:24,textAlign:"center",
            color:i===0?C.gold:C.mute}}>{i+1}</span>
          <span style={{flex:1,fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.username}</span>
          <span style={{fontFamily:F_DISP,fontSize:22,color:C.grass}}>{r.points}</span>
        </div>
      ))}
      <div style={{fontSize:12,color:C.mute,textAlign:"center",marginTop:8}}>Full standings in the Leaderboard tab.</div>
    </div>
  );
}

function Podium({top3,anyPoints}){
  const heights=[96,72,60]; const order=[1,0,2]; // silver, gold, bronze visual order
  const medal=["#E8B53A","#9aa5a0","#b08d57"];
  if(top3.length<3) return <Card><span style={{color:C.mute,fontSize:13}}>Podium fills in once standings exist.</span></Card>;
  return (
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:8,marginBottom:18}}>
      {order.map(idx=>{
        const r=top3[idx]; if(!r) return null;
        return (
          <div key={idx} style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:4,overflow:"hidden",
              textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.username}</div>
            <div style={{fontFamily:F_DISP,fontSize:20,color:C.grass}}>{anyPoints?r.points:"–"}</div>
            <div style={{height:heights[idx],background:medal[idx],borderRadius:"8px 8px 0 0",
              display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:6,marginTop:4}}>
              <span style={{fontFamily:F_DISP,fontSize:30,color:"#fff"}}>{idx+1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── LEADERBOARD ──
function Leaderboard({board,live}){
  if(!board) return <Loading/>;
  const rows=board.leaderboard||[];
  const topPts=Math.max(...rows.map(r=>r.points),0);
  const anyPoints=topPts>0;
  // games played so far = completed games in the live feed
  const played = Object.keys(resultsFromLive(live)).length;
  return (
    <div className="sec">
      <SecLabel>FULL STANDINGS</SecLabel>
      {rows.map((r,i)=>{
        const correct = r.detail?.correctGames ?? 0;
        const pct = played ? Math.ceil((correct/played)*100) : null;
        return (
        <div key={r.username} style={{display:"flex",alignItems:"center",gap:11,background:"#fff",
          border:`1px solid ${C.line}`,borderRadius:13,padding:"11px 13px",marginBottom:8}}>
          <div style={{fontFamily:F_DISP,fontSize:26,minWidth:30,textAlign:"center",
            color:i===0?C.gold:i===1?"#9aa5a0":i===2?"#b08d57":C.mute}}>{i+1}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {r.username}{anyPoints&&r.points===topPts&&" 🔥"}
            </div>
            <div style={{fontSize:12,color:C.mute,marginTop:2,display:"flex",gap:9,alignItems:"center"}}>
              {pct!==null && <span style={{fontWeight:700,color:C.ink}}>{pct}%</span>}
              <span>🐴 {FLAG[r.darkhorse]||"—"}</span>
              <span>💀 {FLAG[r.flop]||"—"}</span>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:96}}>👟 {r.goldenboot||"—"}</span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:F_DISP,fontSize:28,lineHeight:.9,color:C.grass}}>{r.points}</div>
            <div style={{fontSize:10,color:C.mute}}>{r.phase2>0?`${r.phase1}+${r.phase2}`:"PTS"}</div>
          </div>
        </div>
      );})}
      {played===0 && <div style={{fontSize:12,color:C.mute,textAlign:"center",marginTop:6}}>% correct appears once games are played.</div>}
    </div>
  );
}

// ── MY PICKS ──
function MyPicks({me,allPicks,chooseMe,board,live}){
  if(!allPicks) return <Loading/>;
  const names = allPicks.map(p=>p.username);
  if(!me || !names.includes(me)){
    return (
      <div className="sec">
        <SecLabel>WHO ARE YOU?</SecLabel>
        <div style={{fontSize:13,color:C.mute,marginBottom:12}}>Tap your name once — we'll remember you on this device.</div>
        {names.map(n=>(
          <button key={n} onClick={()=>chooseMe(n)} style={{display:"block",width:"100%",textAlign:"left",
            background:"#fff",border:`1.5px solid ${C.line}`,borderRadius:12,padding:"13px 15px",
            marginBottom:8,fontSize:15,fontWeight:600,color:C.ink,cursor:"pointer",fontFamily:F_BODY}}>{n}</button>
        ))}
      </div>
    );
  }
  const mine = allPicks.find(p=>p.username===me);
  const myScore = (board?.leaderboard||[]).find(r=>r.username===me);
  const results = resultsFromLive(live);
  const cc = correctness(mine?.picks, results);
  return (
    <div className="sec">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <SecLabel>{me.toUpperCase()}</SecLabel>
        <button onClick={()=>chooseMe("")} style={{background:"none",border:"none",color:C.grass,
          fontSize:12,fontWeight:700,cursor:"pointer"}}>not you?</button>
      </div>
      {myScore && <div style={{background:C.grass,color:"#fff",borderRadius:13,padding:"12px 15px",marginBottom:12,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontWeight:700}}>Your total</span>
        <span style={{fontFamily:F_DISP,fontSize:30}}>{myScore.points} pts</span>
      </div>}

      {/* right / wrong scorecard */}
      <Scorecard cc={cc} />

      <PicksDetail rec={mine}/>
    </div>
  );
}

// right/wrong summary + per-game list (played games only)
function Scorecard({cc}){
  if(!cc || cc.played===0){
    return <div style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:13,padding:"12px 15px",
      marginBottom:16,fontSize:13,color:C.mute}}>Your hits and misses show up here once your games are played.</div>;
  }
  const teamOf=(gid,side)=>{
    const L=gid[0], idx=parseInt(gid.slice(1))-1;
    const [i,j]=PAIRINGS[idx]; const t=GROUPS[L];
    return side==="home"?t[i]:t[j];
  };
  const outcomeLabel=(gid,o)=> o==="draw"?"Draw":`${FLAG[teamOf(gid,o)]||""} ${teamOf(gid,o)}`;
  const ordered=cc.per.slice().sort((a,b)=> a.gid<b.gid?-1:1);
  return (
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <Stat n={cc.correct} lbl="CORRECT" color={C.grass}/>
        <Stat n={cc.wrong} lbl="WRONG" color={C.red}/>
        <Stat n={`${cc.pct}%`} lbl="ACCURACY" color={C.ink}/>
      </div>
      <div style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:13,padding:"6px 14px"}}>
        {ordered.map(g=>(
          <div key={g.gid} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"7px 0",borderBottom:`1px solid ${C.paper}`,fontSize:12.5}}>
            <span style={{color:C.mute}}>
              <b style={{color:C.ink}}>{g.gid}</b> · you: {outcomeLabel(g.gid,g.pick)}
            </span>
            <span style={{fontWeight:700,color:g.hit?C.grass:C.red}}>
              {g.hit?"✅":"❌"} {outcomeLabel(g.gid,g.actual)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
function Stat({n,lbl,color}){
  return <div style={{flex:1,background:"#fff",border:`1px solid ${C.line}`,borderRadius:11,
    padding:"8px 4px",textAlign:"center"}}>
    <div style={{fontFamily:F_DISP,fontSize:26,color,lineHeight:1}}>{n}</div>
    <div style={{fontSize:9.5,color:C.mute,letterSpacing:.5,marginTop:2}}>{lbl}</div>
  </div>;
}

// ── EVERYONE'S PICKS ──
function Everyone({allPicks}){
  const [open,setOpen] = useState(null);
  if(!allPicks) return <Loading/>;
  return (
    <div className="sec">
      <SecLabel>EVERYONE'S PICKS</SecLabel>
      {allPicks.map(p=>(
        <div key={p.username} style={{marginBottom:8}}>
          <button onClick={()=>setOpen(open===p.username?null:p.username)} style={{display:"flex",
            justifyContent:"space-between",alignItems:"center",width:"100%",background:"#fff",
            border:`1.5px solid ${C.line}`,borderRadius:12,padding:"13px 15px",cursor:"pointer",fontFamily:F_BODY}}>
            <span style={{fontWeight:700,fontSize:15,color:C.ink}}>{p.username}</span>
            <span style={{fontSize:12,color:C.mute}}>🐴 {FLAG[p.bets?.darkhorse]||"—"} 💀 {FLAG[p.bets?.flop]||"—"} {open===p.username?"▴":"▾"}</span>
          </button>
          {open===p.username && <div style={{padding:"4px 2px 8px"}}><PicksDetail rec={p}/></div>}
        </div>
      ))}
    </div>
  );
}

// shared: render one person's full picks
function PicksDetail({rec}){
  if(!rec) return null;
  const picks = rec.picks||{};
  const order = rec.group_order||{};
  const bets = rec.bets||{};
  const label = {home:"home",draw:"draw",away:"away"};
  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,color:C.grass,letterSpacing:1,margin:"6px 0 8px"}}>SIDE BETS</div>
      <div style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13.5}}>
        <BetRow k="👟 Golden Boot" v={bets.goldenboot}/>
        <BetRow k="🐴 Dark Horse" v={bets.darkhorse?`${FLAG[bets.darkhorse]||""} ${bets.darkhorse}`:null}/>
        <BetRow k="💀 Flop" v={bets.flop?`${FLAG[bets.flop]||""} ${bets.flop}`:null}/>
        <BetRow k="🐐 Penaldo v Pessi" v={bets.penaldo}/>
        <BetRow k="👃 Golden Nostril" v={bets.nostril}/>
        <BetRow k="🌍 Chum v Cum" v={bets.chumcum}/>
      </div>
      <div style={{fontSize:11,fontWeight:700,color:C.grass,letterSpacing:1,marginBottom:8}}>GROUP PICKS</div>
      {GLETTERS.map(L=>(
        <div key={L} style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
          <div style={{fontFamily:F_DISP,fontSize:20,marginBottom:6}}>GROUP {L}</div>
          {gamesFor(L).map(g=>{
            const pick=picks[g.id];
            const txt = pick==="home"?`${g.home}`:pick==="away"?`${g.away}`:pick==="draw"?"Draw":"—";
            return (
              <div key={g.id} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,padding:"2px 0"}}>
                <span style={{color:C.mute}}>{FLAG[g.home]} {g.home} v {g.away} {FLAG[g.away]}</span>
                <span style={{fontWeight:700,color:pick==="draw"?C.mute:C.ink}}>{txt}</span>
              </div>
            );
          })}
          {order[L]?.length===4 && (
            <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.line}`,fontSize:12,color:C.mute}}>
              Order: {order[L].map((t,i)=>`${i+1}. ${FLAG[t]||""}`).join("  ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
function BetRow({k,v}){
  return <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
    <span style={{color:C.mute}}>{k}</span><span style={{fontWeight:700}}>{v||"—"}</span>
  </div>;
}

// ── RULES ──
function Rules(){
  const Row=({n,t,d})=>(
    <div style={{display:"flex",gap:12,marginBottom:14}}>
      <div style={{fontFamily:F_DISP,fontSize:28,color:C.grass,lineHeight:1,minWidth:40}}>{n}</div>
      <div><div style={{fontWeight:700,marginBottom:2,fontSize:14}}>{t}</div>
        <div style={{fontSize:13,color:C.mute,lineHeight:1.5}}>{d}</div></div>
    </div>
  );
  return (
    <div className="sec">
      <SecLabel>HOW SCORING WORKS</SecLabel>
      <Bucket color={C.grass} tag="BUCKET 1" name="GROUP STAGE">
        <Row n="3" t="Per correct game" d="Pick each group game's result — win, draw, or loss. 3 pts when you're right."/>
        <Row n="+2" t="Upset bonus" d="Correctly back a team ranked 10+ FIFA spots below their opponent for a bonus +2."/>
        <Row n="+10" t="Perfect group order" d="Nail a group's exact 1–4 finishing order for +10. All or nothing."/>
      </Bucket>
      <Bucket color={C.ink} tag="BUCKET 2" name="KNOCKOUT BRACKET">
        <div style={{fontSize:13,color:C.mute,lineHeight:1.6,marginBottom:10}}>
          After groups, fill a March-Madness-style bracket. Points climb each round (scored independently — an early miss never kills a later correct pick):
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["R32","6"],["R16","10"],["QF","18"],["SF","30"],["FINAL","52"]].map(([r,p])=>(
            <div key={r} style={{flex:"1 0 28%",background:"#fff",border:`1px solid ${C.line}`,borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
              <div style={{fontSize:11,color:C.mute}}>{r}</div>
              <div style={{fontFamily:F_DISP,fontSize:24}}>{p}</div>
            </div>
          ))}
        </div>
      </Bucket>
      <Bucket color={C.gold} tag="BUCKET 3" name="SIDE BETS">
        <div style={{fontSize:13,color:C.mute,lineHeight:1.6}}>
          Golden Boot (12), Dark Horse (5–25 by how far they go), Group Flop (6), and the three head-to-heads — Penaldo v Pessi, Golden Nostril, Chum v Cum (5 each). Enough to give you an edge, never enough to win it alone.
        </div>
      </Bucket>
    </div>
  );
}

// ── BRACKET VIEW (personal, vertical, color-coded) ──
function BracketView({knockout,brackets,board,me,chooseMe}){
  if(!knockout||!brackets) return <Loading/>;
  const ko = knockout.koByPair||{};
  const names = brackets.map(b=>b.username);

  // identity gate (same pattern as Mine)
  if(!me || !names.includes(me)){
    return (
      <div className="sec">
        <SecLabel>WHOSE BRACKET?</SecLabel>
        <div style={{fontSize:13,color:C.mute,marginBottom:12}}>Tap your name to see your bracket. (Set on the Mine tab too.)</div>
        {names.map(n=>(
          <button key={n} onClick={()=>chooseMe&&chooseMe(n)} style={{display:"block",width:"100%",textAlign:"left",
            background:"#fff",border:`1.5px solid ${C.line}`,borderRadius:12,padding:"13px 15px",
            marginBottom:8,fontSize:15,fontWeight:600,color:C.ink,cursor:"pointer",fontFamily:F_BODY}}>{n}</button>
        ))}
      </div>
    );
  }

  const rec = brackets.find(b=>b.username===me);
  const bk = rec?.bracket || {};
  const myScore = (board?.leaderboard||[]).find(r=>r.username===me);

  // result for a pick in a given match: "correct" | "wrong" | "pending"
  function statusOf(match,pick){
    if(!match||match.length!==2||!match[0]||!match[1]||!pick) return "pending";
    const k=[match[0],match[1]].sort().join("|");
    const w=ko[k]?.winner;
    if(!w) return "pending";
    return pick===w ? "correct" : "wrong";
  }
  const COLter = {correct:C.grass, wrong:C.red, pending:C.line};
  const BGter = {correct:"#e7f0ea", wrong:"#f7e4df", pending:"#fff"};

  const rounds = [
    {key:"r32", label:"ROUND OF 32", pts:6},
    {key:"r16", label:"ROUND OF 16", pts:10},
    {key:"qf",  label:"QUARTERFINALS", pts:18},
    {key:"sf",  label:"SEMIFINALS", pts:30},
    {key:"final", label:"FINAL", pts:52},
  ];

  return (
    <div className="sec">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <SecLabel>{me.toUpperCase()}'S BRACKET</SecLabel>
        {chooseMe && <button onClick={()=>chooseMe("")} style={{background:"none",border:"none",
          color:C.grass,fontSize:12,fontWeight:700,cursor:"pointer"}}>switch</button>}
      </div>
      {myScore && <div style={{background:C.grass,color:"#fff",borderRadius:13,padding:"10px 15px",marginBottom:8,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontWeight:700,fontSize:13}}>Knockout points</span>
        <span style={{fontFamily:F_DISP,fontSize:26}}>{myScore.phase2||0}</span>
      </div>}
      <div style={{display:"flex",gap:10,fontSize:10.5,color:C.mute,marginBottom:12}}>
        <span>🟩 correct</span><span>🟥 busted</span><span>⬜ pending</span>
      </div>

      {/* vertical narrowing bracket */}
      {rounds.map((rd,ri)=>{
        const picks = bk[rd.key]||[];
        if(picks.length===0) return null;
        // narrowing visual: indent deeper rounds
        const pad = ri*10;
        return (
          <div key={rd.key} style={{marginBottom:16}}>
            <div style={{fontSize:10.5,fontWeight:700,letterSpacing:1,color:C.mute,marginBottom:6}}>
              {rd.label} <span style={{color:C.grass}}>· {rd.pts} pts each</span>
            </div>
            <div style={{paddingLeft:pad}}>
              {picks.map((g,i)=>{
                const st=statusOf(g.match,g.pick);
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,
                    background:BGter[st],border:`1.5px solid ${COLter[st]}`,borderRadius:10,
                    padding:"9px 12px",marginBottom:6}}>
                    <span style={{fontSize:15}}>{FLAG[g.pick]||"·"}</span>
                    <span style={{flex:1,fontWeight:700,fontSize:14,
                      color:st==="wrong"?C.red:C.ink,
                      textDecoration:st==="wrong"?"line-through":"none"}}>{g.pick||"—"}</span>
                    {g.match&&g.match[0]&&g.match[1] &&
                      <span style={{fontSize:10.5,color:C.mute,overflow:"hidden",textOverflow:"ellipsis",
                        whiteSpace:"nowrap",maxWidth:120}}>{g.match[0]} v {g.match[1]}</span>}
                    <span style={{fontSize:13}}>{st==="correct"?"✅":st==="wrong"?"❌":""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* champion highlight */}
      {bk.champion && (
        <div style={{textAlign:"center",marginTop:8,padding:"16px",background:"#fff",
          border:`2px solid ${C.gold}`,borderRadius:14}}>
          <div style={{fontSize:10.5,fontWeight:700,letterSpacing:1.5,color:C.gold}}>YOUR CHAMPION</div>
          <div style={{fontSize:40,marginTop:6}}>{FLAG[bk.champion]}</div>
          <div style={{fontFamily:F_DISP,fontSize:30,letterSpacing:.5}}>{bk.champion}</div>
        </div>
      )}
    </div>
  );
}
function KORow({team,score,show,win}){
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0"}}>
    <span style={{fontSize:14,fontWeight:win?700:600,color:win?C.ink:C.mute}}>
      {FLAG[team]} {team} {win?"✓":""}
    </span>
    <span style={{fontFamily:F_DISP,fontSize:20,color:show?C.ink:"transparent"}}>{show?(score??0):"–"}</span>
  </div>;
}

// ── shared UI ──
function Nav({tab,setTab}){
  const items=[["home","Home","⌂"],["leaderboard","Board","≡"],["bracket","Bracket","⛛"],
    ["mypicks","Mine","★"],["everyone","All","⚇"],["rules","Rules","?"]];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:430,margin:"0 auto",
      background:"#fff",borderTop:`1px solid ${C.line}`,display:"flex",padding:"6px 2px 8px"}}>
      {items.map(([k,lbl,ic])=>(
        <button key={k} onClick={()=>setTab(k)} style={{flex:1,background:"none",border:"none",
          cursor:"pointer",padding:"6px 1px",color:tab===k?C.grass:C.mute,fontFamily:F_BODY}}>
          <div style={{fontSize:18,lineHeight:1}}>{ic}</div>
          <div style={{fontSize:9.5,fontWeight:tab===k?700:500,marginTop:3}}>{lbl}</div>
        </button>
      ))}
    </div>
  );
}
function ScoreLine({flag,team,score,show}){
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 0"}}>
    <span style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{flag} {team}</span>
    <span style={{fontFamily:F_DISP,fontSize:18,color:show?C.ink:"transparent",minWidth:16,textAlign:"right"}}>{show?(score??0):"–"}</span>
  </div>;
}
function PickBar({tl,homeTeam,awayTeam,names}){
  const [open,setOpen]=useState(false);
  if(!tl || tl.total===0){
    return <div style={{marginTop:7,fontSize:10.5,color:C.mute}}>No picks recorded</div>;
  }
  const seg=[
    {n:tl.home, c:C.grass,  lbl:"H"},
    {n:tl.draw, c:C.mute,   lbl:"D"},
    {n:tl.away, c:C.gold,   lbl:"A"},
  ];
  return (
    <div style={{marginTop:8}}>
      <div onClick={()=>setOpen(o=>!o)} style={{cursor:"pointer"}}>
        <div style={{display:"flex",height:8,borderRadius:99,overflow:"hidden",background:C.line}}>
          {seg.map((s,i)=> s.n>0 && (
            <div key={i} style={{width:`${(s.n/tl.total)*100}%`,background:s.c}}/>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.mute,marginTop:4}}>
          <span><b style={{color:C.grass}}>{tl.home}</b> {homeTeam.length>8?homeTeam.slice(0,7)+"…":homeTeam}</span>
          <span><b style={{color:C.mute}}>{tl.draw}</b> draw</span>
          <span><b style={{color:C.gold}}>{tl.away}</b> {awayTeam.length>8?awayTeam.slice(0,7)+"…":awayTeam}</span>
        </div>
        <div style={{textAlign:"center",fontSize:9.5,color:C.mute,marginTop:3}}>{open?"tap to hide ▴":"tap to see who ▾"}</div>
      </div>
      {open && names && (
        <div style={{marginTop:8,borderTop:`1px solid ${C.line}`,paddingTop:8,display:"flex",flexDirection:"column",gap:6}}>
          <NameGroup color={C.grass} label={homeTeam} list={names.home}/>
          <NameGroup color={C.mute}  label="Draw"     list={names.draw}/>
          <NameGroup color={C.gold}  label={awayTeam} list={names.away}/>
        </div>
      )}
    </div>
  );
}
function NameGroup({color,label,list}){
  if(!list||list.length===0) return null;
  return (
    <div style={{fontSize:11}}>
      <span style={{fontWeight:700,color}}>{label}:</span>{" "}
      <span style={{color:C.ink}}>{list.join(", ")}</span>
    </div>
  );
}
function SecLabel({children}){
  return <div style={{fontSize:11,fontWeight:700,letterSpacing:1.2,color:C.grass,margin:"4px 0 10px"}}>{children}</div>;
}
function Card({children}){
  return <div style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:12,padding:"14px 16px",minWidth:150}}>{children}</div>;
}
function Bucket({color,tag,name,children}){
  return <div style={{borderLeft:`3px solid ${color}`,paddingLeft:14,marginBottom:22}}>
    <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color}}>{tag}</div>
    <div style={{fontFamily:F_DISP,fontSize:24,letterSpacing:.5,marginBottom:10}}>{name}</div>
    {children}
  </div>;
}
function Loading(){
  return <div style={{textAlign:"center",padding:"50px 0",color:C.mute,fontSize:14}}>Loading…</div>;
}
