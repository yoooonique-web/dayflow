import { useState, useEffect, useRef } from "react";

// ─── PALETTE ─────────────────────────────────────────────────────────────────
// Matcha green:  #8BAF52  (primary active / complete)
// Mustard yellow: #C9973A (accent / span week)
// Browns:        #7A5C3A (span month), #4A3728 (bg surface), #2E2218 (deep bg)
// Text:          #E8DCC8 (warm cream), #A08060 (muted), #5C4030 (very muted)

const MATCHA   = "#8BAF52";
const MUSTARD  = "#C9973A";
const BROWN    = "#9C6B3C";
const BROWN_DK = "#7A5038";

const CATEGORIES = {
  personal: { label:"Personal",         emoji:"🏠", color:"#8BAF52", bg:"rgba(139,175,82,0.12)",  border:"rgba(139,175,82,0.35)"  },
  work:     { label:"Work",             emoji:"💼", color:"#C9973A", bg:"rgba(201,151,58,0.12)",  border:"rgba(201,151,58,0.35)"  },
  profdev:  { label:"Prof. Dev.",       emoji:"📈", color:"#B8895A", bg:"rgba(184,137,90,0.12)",  border:"rgba(184,137,90,0.35)"  },
  learning: { label:"Learning",         emoji:"📚", color:"#A0B870", bg:"rgba(160,184,112,0.12)", border:"rgba(160,184,112,0.35)" },
  health:   { label:"Health & Fitness", emoji:"🏃", color:"#7A9E4E", bg:"rgba(122,158,78,0.12)",  border:"rgba(122,158,78,0.35)"  },
  finance:  { label:"Finance",          emoji:"💰", color:"#D4AA5A", bg:"rgba(212,170,90,0.12)",  border:"rgba(212,170,90,0.35)"  },
  social:   { label:"Social",           emoji:"👥", color:"#C4884A", bg:"rgba(196,136,74,0.12)",  border:"rgba(196,136,74,0.35)"  },
  creative: { label:"Creative",         emoji:"🎨", color:"#B09060", bg:"rgba(176,144,96,0.12)",  border:"rgba(176,144,96,0.35)"  },
  other:    { label:"Other",            emoji:"✦",  color:"#7A6850", bg:"rgba(122,104,80,0.12)",  border:"rgba(122,104,80,0.35)"  },
};

const SPAN_COLORS = {
  week:  { bg:"rgba(201,151,58,0.12)",  border:"rgba(201,151,58,0.38)",  dot:MUSTARD,  text:MUSTARD  },
  month: { bg:"rgba(156,107,60,0.12)",  border:"rgba(156,107,60,0.38)",  dot:BROWN,    text:BROWN    },
};

const F  = "'DM Sans',sans-serif";
const FM = "'DM Mono',monospace";

// ─── UTILS ───────────────────────────────────────────────────────────────────
function toKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fromKey(k) { return new Date(k+"T00:00:00"); }
function getWeekStart(d) { const c=new Date(d); c.setDate(c.getDate()-c.getDay()); return c; }
function weekKey(d)  { return "W-"+toKey(getWeekStart(d)); }
function monthKey(d) { return `M-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function uid()       { return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function getWeekDates(a)  { const ws=getWeekStart(a); return Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(d.getDate()+i);return d;}); }
function getMonthDates(a) { const y=a.getFullYear(),m=a.getMonth(); return Array.from({length:new Date(y,m+1,0).getDate()},(_,i)=>new Date(y,m,i+1)); }
function fmt(d) { const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${DAYS[d.getDay()]}, ${MO[d.getMonth()]} ${d.getDate()}`; }

const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const INIT = { tasks:{}, spanTasks:[] };

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const today    = new Date();
  const todayKey = toKey(today);

  const [data,        setData]        = useState(() => { try { return JSON.parse(localStorage.getItem("dayflow-v4")||"null")||INIT; } catch { return INIT; } });
  const [view,        setView]        = useState("day");
  const [selDate,     setSelDate]     = useState(todayKey);
  const [weekAnchor,  setWeekAnchor]  = useState(today);
  const [monthAnchor, setMonthAnchor] = useState(today);
  const [input,       setInput]       = useState("");
  const [newCat,      setNewCat]      = useState("personal");
  const [spanInput,   setSpanInput]   = useState("");
  const [spanCat,     setSpanCat]     = useState("personal");
  const [editingId,   setEditingId]   = useState(null);
  const [editText,    setEditText]    = useState("");
  const [spanModal,   setSpanModal]   = useState(false);
  const [spanType,    setSpanType]    = useState("week");
  const [filterSpan,  setFilterSpan]  = useState("all");
  const [filterCat,   setFilterCat]   = useState("all");
  const inputRef = useRef();

  useEffect(() => { try { localStorage.setItem("dayflow-v4",JSON.stringify(data)); } catch {} }, [data]);

  // Carryover on mount
  useEffect(() => {
    const yest=new Date(today); yest.setDate(yest.getDate()-1);
    const yk=toKey(yest);
    const yTasks=(data.tasks[yk]||[]).filter(t=>!t.done&&!t.carried);
    const alreadyCarried=(data.tasks[todayKey]||[]).some(t=>t.carried);
    if (yTasks.length>0&&!alreadyCarried) {
      const carried=yTasks.map(t=>({...t,id:uid(),carried:true,done:false,createdAt:Date.now()}));
      setData(prev=>({...prev,tasks:{...prev.tasks,[todayKey]:[...carried,...(prev.tasks[todayKey]||[])]}}));
    }
  }, []);

  // ── Data helpers ─────────────────────────────────────────────────────────────
  const getTasks   = k  => data.tasks[k]||[];
  const getSpanFor = sk => (data.spanTasks||[]).filter(t=>t.scopeKey===sk);

  function addDayTask() {
    if (!input.trim()) return;
    const t={id:uid(),text:input.trim(),done:false,carried:false,category:newCat,createdAt:Date.now()};
    setData(prev=>({...prev,tasks:{...prev.tasks,[selDate]:[...(prev.tasks[selDate]||[]),t]}}));
    setInput(""); inputRef.current?.focus();
  }
  function toggleDay(key,id) { setData(prev=>({...prev,tasks:{...prev.tasks,[key]:(prev.tasks[key]||[]).map(t=>t.id===id?{...t,done:!t.done}:t)}})); }
  function deleteDay(key,id) { setData(prev=>({...prev,tasks:{...prev.tasks,[key]:(prev.tasks[key]||[]).filter(t=>t.id!==id)}})); }

  function addSpanTask(sk) {
    if (!spanInput.trim()) return;
    const t={id:uid(),text:spanInput.trim(),done:false,span:spanType,scopeKey:sk,category:spanCat,createdAt:Date.now()};
    setData(prev=>({...prev,spanTasks:[...(prev.spanTasks||[]),t]}));
    setSpanInput(""); setSpanModal(false);
  }
  function toggleSpan(id) { setData(prev=>({...prev,spanTasks:(prev.spanTasks||[]).map(t=>t.id===id?{...t,done:!t.done}:t)})); }
  function deleteSpan(id) { setData(prev=>({...prev,spanTasks:(prev.spanTasks||[]).filter(t=>t.id!==id)})); }

  function startEdit(id,text) { setEditingId(id); setEditText(text); }
  function saveDayEdit(key) {
    if (!editText.trim()) return;
    setData(prev=>({...prev,tasks:{...prev.tasks,[key]:(prev.tasks[key]||[]).map(t=>t.id===editingId?{...t,text:editText.trim()}:t)}}));
    setEditingId(null);
  }
  function saveSpanEdit(id) {
    if (!editText.trim()) return;
    setData(prev=>({...prev,spanTasks:(prev.spanTasks||[]).map(t=>t.id===id?{...t,text:editText.trim()}:t)}));
    setEditingId(null);
  }

  const stats = k => { const t=getTasks(k); return {total:t.length,done:t.filter(x=>x.done).length}; };
  const pct   = k => { const {total,done}=stats(k); return total?Math.round((done/total)*100):0; };

  const selObj     = fromKey(selDate);
  const weekDates  = getWeekDates(weekAnchor);
  const monthDates = getMonthDates(monthAnchor);

  const applyDayFilter  = ts => filterCat==="all" ? ts : ts.filter(t=>(t.category||"other")===filterCat);
  const applySpanFilter = ts => filterCat==="all" ? ts : ts.filter(t=>(t.category||"other")===filterCat);

  const dayTasks = getTasks(selDate);
  const wSpan    = getSpanFor(weekKey(selObj));
  const mSpan    = getSpanFor(monthKey(selObj));

  const visCarried = applyDayFilter(dayTasks.filter(t=>t.carried&&!t.done));
  const visActive  = applyDayFilter(dayTasks.filter(t=>!t.carried&&!t.done));
  const visDone    = applyDayFilter(dayTasks.filter(t=>t.done));
  const visWSpan   = applySpanFilter(wSpan);
  const visMSpan   = applySpanFilter(mSpan);

  const showWSpan = filterSpan==="all"||filterSpan==="week";
  const showMSpan = filterSpan==="all"||filterSpan==="month";
  const showDay   = filterSpan==="all"||filterSpan==="day";

  const spanScopeKey = view==="week" ? weekKey(weekAnchor) : view==="month" ? monthKey(monthAnchor) : weekKey(selObj);

  // ── Micro components ─────────────────────────────────────────────────────────

  const Chip = ({label, active, color, onClick}) => (
    <button onClick={onClick} style={{
      padding:"4px 11px", borderRadius:20, cursor:"pointer", transition:"all 0.15s",
      fontFamily:F, fontSize:10, fontWeight:600, letterSpacing:"0.01em", whiteSpace:"nowrap",
      border:`1px solid ${active ? color : "rgba(168,136,96,0.22)"}`,
      background: active ? `${color}22` : "transparent",
      color: active ? color : "#7A6048",
    }}>{label}</button>
  );

  const CatBadge = ({catKey}) => {
    const c = CATEGORIES[catKey]||CATEGORIES.other;
    return (
      <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:10,
        background:c.bg, border:`1px solid ${c.border}`,
        fontSize:9, color:c.color, fontFamily:F, fontWeight:600, whiteSpace:"nowrap"}}>
        {c.emoji} {c.label}
      </span>
    );
  };

  const NavBtn = ({onClick, label}) => (
    <button onClick={onClick} style={{
      width:28, height:28, borderRadius:7, cursor:"pointer", fontSize:14, fontFamily:FM,
      border:"1px solid rgba(168,136,96,0.25)", background:"transparent", color:"#7A6048",
      transition:"background 0.15s",
    }}>{label}</button>
  );

  const Stat = ({label, value, color}) => (
    <div>
      <div style={{fontSize:22,fontWeight:700,color,fontFamily:FM,lineHeight:1}}>{value}</div>
      <div style={{fontSize:9,color:"#6A5040",fontFamily:F,marginTop:2,fontWeight:600,letterSpacing:"0.04em"}}>{label}</div>
    </div>
  );

  const CatSelect = ({value, onChange}) => (
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {Object.entries(CATEGORIES).map(([k,c])=>(
        <button key={k} onClick={()=>onChange(k)} style={{
          padding:"4px 10px", borderRadius:8, cursor:"pointer", transition:"all 0.15s",
          fontFamily:F, fontSize:10, fontWeight:600,
          border:`1px solid ${value===k ? c.color : "rgba(168,136,96,0.2)"}`,
          background: value===k ? c.bg : "transparent",
          color: value===k ? c.color : "#7A6048",
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span>{c.emoji}</span><span>{c.label}</span>
        </button>
      ))}
    </div>
  );

  // Task Row
  const TR = ({task, onToggle, onDelete, onEdit, onSave, ekey, isSpan=false}) => {
    const sc  = isSpan ? SPAN_COLORS[task.span] : null;
    const cat = CATEGORIES[task.category||"other"]||CATEGORIES.other;
    const isEd = editingId===task.id;
    const checkColor = isSpan ? sc.dot : cat.color;
    const rowBg     = task.done ? "rgba(60,45,30,0.3)" : isSpan ? sc.bg : task.carried ? "rgba(201,151,58,0.08)" : "rgba(80,60,40,0.25)";
    const rowBorder = isSpan ? sc.border : task.carried&&!task.done ? "rgba(201,151,58,0.3)" : "rgba(120,90,60,0.2)";
    return (
      <div style={{display:"flex",alignItems:"flex-start",gap:9,padding:"9px 12px",borderRadius:9,marginBottom:5,background:rowBg,border:`1px solid ${rowBorder}`,transition:"all 0.15s"}}>
        <button onClick={onToggle} style={{
          width:18,height:18,borderRadius:4,border:"2px solid",flexShrink:0,marginTop:2,
          borderColor:checkColor, background:task.done?checkColor:"transparent",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",
        }}>
          {task.done&&<svg width="8" height="6" viewBox="0 0 8 6"><polyline points="1,3 3,5 7,1" fill="none" stroke="#2E2010" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
        <div style={{flex:1,minWidth:0}}>
          {isEd ? (
            <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")isSpan?saveSpanEdit(task.id):onSave(ekey);if(e.key==="Escape")setEditingId(null);}}
              onBlur={()=>isSpan?saveSpanEdit(task.id):onSave(ekey)}
              style={{width:"100%",background:"rgba(80,60,40,0.4)",border:`1px solid ${cat.color}`,borderRadius:5,padding:"2px 7px",color:"#E8DCC8",fontFamily:F,fontSize:13,outline:"none"}}/>
          ) : (
            <div onDoubleClick={()=>onEdit(task.id,task.text)} style={{
              color:task.done?"#5A4030":"#D4C4A8",
              textDecoration:task.done?"line-through":"none",
              fontFamily:F,fontSize:13,lineHeight:1.45,wordBreak:"break-word",
            }}>{task.text}</div>
          )}
          <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
            <CatBadge catKey={task.category||"other"}/>
            {task.carried&&!task.done&&<span style={{fontSize:9,color:MUSTARD,fontFamily:F,fontWeight:600}}>↩ carried</span>}
            {isSpan&&<span style={{fontSize:9,color:sc.text,fontFamily:F,fontWeight:600}}>⬡ {task.span}-span</span>}
          </div>
        </div>
        <button onClick={onDelete} style={{background:"none",border:"none",color:"#5A4030",cursor:"pointer",fontSize:14,lineHeight:1,flexShrink:0,marginTop:2,padding:"0 2px"}}>×</button>
      </div>
    );
  };

  // Mini day card
  const MiniDay = ({date}) => {
    const k=toKey(date); const isToday=k===todayKey; const isSel=k===selDate;
    const {total,done}=stats(k); const p=total?(done/total)*100:0;
    return (
      <div onClick={()=>{setSelDate(k);setView("day");}} style={{
        padding:"9px 7px",borderRadius:9,cursor:"pointer",transition:"all 0.15s",
        background: isToday?"rgba(139,175,82,0.12)":isSel?"rgba(201,151,58,0.09)":"rgba(60,45,30,0.4)",
        border:`1px solid ${isToday?"rgba(139,175,82,0.4)":isSel?"rgba(201,151,58,0.35)":"rgba(100,75,50,0.3)"}`,
      }}>
        <div style={{fontSize:9,color:"#6A5040",fontFamily:F,fontWeight:700,letterSpacing:"0.04em"}}>{DAYS_SHORT[date.getDay()].toUpperCase()}</div>
        <div style={{fontSize:16,fontWeight:700,fontFamily:FM,lineHeight:1.2,color:isToday?MATCHA:isSel?MUSTARD:"#B09070"}}>{date.getDate()}</div>
        <div style={{height:2,background:"rgba(100,75,50,0.3)",borderRadius:1,marginTop:6}}>
          <div style={{height:"100%",borderRadius:1,width:`${p}%`,background:p===100?MATCHA:MUSTARD,transition:"width 0.3s"}}/>
        </div>
        <div style={{fontSize:9,color:"#5A4030",fontFamily:FM,marginTop:4}}>{done}/{total}</div>
        {getTasks(k).slice(0,2).map(t=>{const c=CATEGORIES[t.category||"other"]||CATEGORIES.other; return (
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:3,marginTop:3}}>
            <div style={{width:4,height:4,borderRadius:"50%",flexShrink:0,background:t.done?MATCHA:c.color,opacity:t.done?0.4:0.85}}/>
            <div style={{fontSize:9,color:t.done?"#5A4030":"#8A7060",textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:F}}>{t.text}</div>
          </div>
        );})}
        {getTasks(k).length>2&&<div style={{fontSize:9,color:"#4A3828",fontFamily:F}}>+{getTasks(k).length-2}</div>}
      </div>
    );
  };

  const SpanPanel = ({scopeKey, span}) => {
    const sc = SPAN_COLORS[span];
    const all = getSpanFor(scopeKey);
    const visible = filterCat==="all" ? all : all.filter(t=>(t.category||"other")===filterCat);
    return (
      <div style={{marginBottom:16,padding:"12px 15px",borderRadius:11,background:sc.bg,border:`1px solid ${sc.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:all.length?10:0}}>
          <div style={{fontSize:9,color:sc.text,fontWeight:700,letterSpacing:"0.05em",fontFamily:F}}>
            ⬡ {span.toUpperCase()}-SPAN TASKS {filterCat!=="all"&&`· ${CATEGORIES[filterCat]?.label}`}
          </div>
          <button onClick={()=>{setSpanType(span);setSpanModal(true);}} style={{
            padding:"3px 10px",borderRadius:7,cursor:"pointer",fontFamily:F,fontSize:9,fontWeight:700,
            border:`1px solid ${sc.border}`,background:`${sc.dot}20`,color:sc.text,
          }}>+ ADD</button>
        </div>
        {visible.length===0&&<div style={{fontSize:11,color:"#6A5040",fontFamily:F}}>No {span}-span tasks{filterCat!=="all"?` in ${CATEGORIES[filterCat]?.label}`:""}.</div>}
        {visible.map(t=><TR key={t.id} task={t} onToggle={()=>toggleSpan(t.id)} onDelete={()=>deleteSpan(t.id)} onEdit={startEdit} onSave={()=>saveSpanEdit(t.id)} isSpan/>)}
      </div>
    );
  };

  const SpanModal = ({sk}) => {
    const sc = SPAN_COLORS[spanType];
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(20,12,6,0.82)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
        onClick={()=>{setSpanModal(false);setSpanInput("");}}>
        <div onClick={e=>e.stopPropagation()} style={{
          background:"#2A1E12",border:"1px solid rgba(140,100,60,0.35)",
          borderRadius:14,padding:24,width:400,boxShadow:`0 8px 60px rgba(0,0,0,0.5)`,
        }}>
          <div style={{fontFamily:F,fontSize:15,fontWeight:700,color:"#E0CBA8",marginBottom:3}}>Add Span Task</div>
          <div style={{fontSize:11,color:"#7A6048",fontFamily:F,marginBottom:16}}>This task persists across the full {spanType}.</div>
          <div style={{display:"flex",gap:7,marginBottom:14}}>
            {["week","month"].map(s=>{const c=SPAN_COLORS[s]; return (
              <button key={s} onClick={()=>setSpanType(s)} style={{
                flex:1,padding:"7px 0",borderRadius:8,cursor:"pointer",transition:"all 0.15s",
                fontFamily:F,fontSize:11,fontWeight:700,textTransform:"capitalize",
                border:`1px solid ${spanType===s?c.dot:"rgba(140,100,60,0.25)"}`,
                background:spanType===s?c.bg:"transparent",
                color:spanType===s?c.text:"#7A6048",
              }}>{s}-long</button>
            );})}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,color:"#6A5040",fontWeight:700,letterSpacing:"0.04em",marginBottom:7,fontFamily:F}}>CATEGORY</div>
            <CatSelect value={spanCat} onChange={setSpanCat}/>
          </div>
          <input autoFocus value={spanInput} onChange={e=>setSpanInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")addSpanTask(sk);if(e.key==="Escape"){setSpanModal(false);setSpanInput("");}}}
            placeholder={`Describe this ${spanType}-long task…`}
            style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"rgba(80,55,30,0.5)",border:`1px solid ${sc.border}`,color:"#E0CBA8",fontFamily:F,fontSize:13,outline:"none",marginBottom:12}}/>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>{setSpanModal(false);setSpanInput("");}} style={{flex:1,padding:"8px 0",borderRadius:9,cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:600,border:"1px solid rgba(140,100,60,0.25)",background:"transparent",color:"#7A6048"}}>Cancel</button>
            <button onClick={()=>addSpanTask(sk)} style={{flex:2,padding:"8px 0",borderRadius:9,cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:700,border:"none",background:`linear-gradient(135deg,${sc.dot}dd,${sc.dot}99)`,color:"#2A1608"}}>+ Add {spanType}-span task</button>
          </div>
        </div>
      </div>
    );
  };

  const SectionLabel = ({color, children}) => (
    <div style={{fontSize:9,color,marginBottom:6,fontWeight:700,letterSpacing:"0.05em",fontFamily:F}}>{children}</div>
  );

  const FilterBar = () => (
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16,padding:"11px 13px",borderRadius:10,background:"rgba(60,42,24,0.6)",border:"1px solid rgba(120,88,55,0.25)"}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,color:"#6A5040",fontWeight:700,letterSpacing:"0.04em",marginRight:2,fontFamily:F}}>SCOPE</span>
        {[["all","All"],["day","Day"],["week","Week-span"],["month","Month-span"]].map(([v,l])=>(
          <Chip key={v} label={l} active={filterSpan===v} color={v==="week"?MUSTARD:v==="month"?BROWN:MATCHA} onClick={()=>setFilterSpan(v)}/>
        ))}
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,color:"#6A5040",fontWeight:700,letterSpacing:"0.04em",marginRight:2,fontFamily:F}}>CATEGORY</span>
        <Chip label="All" active={filterCat==="all"} color={MATCHA} onClick={()=>setFilterCat("all")}/>
        {Object.entries(CATEGORIES).map(([k,c])=>(
          <Chip key={k} label={`${c.emoji} ${c.label}`} active={filterCat===k} color={c.color} onClick={()=>setFilterCat(k)}/>
        ))}
      </div>
    </div>
  );

  const CatFilterBar = () => (
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:16,padding:"10px 13px",borderRadius:9,background:"rgba(60,42,24,0.6)",border:"1px solid rgba(120,88,55,0.25)"}}>
      <span style={{fontSize:9,color:"#6A5040",fontWeight:700,letterSpacing:"0.04em",marginRight:2,fontFamily:F}}>CATEGORY</span>
      <Chip label="All" active={filterCat==="all"} color={MATCHA} onClick={()=>setFilterCat("all")}/>
      {Object.entries(CATEGORIES).map(([k,c])=>(
        <Chip key={k} label={`${c.emoji} ${c.label}`} active={filterCat===k} color={c.color} onClick={()=>setFilterCat(k)}/>
      ))}
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#1C1208",color:"#E8DCC8",fontFamily:F}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#4A3020;border-radius:2px;}
        button:focus,input:focus{outline:none;}
        .day-card:hover{border-color:rgba(139,175,82,0.35)!important;transform:translateY(-1px);}
      `}</style>

      {/* Ambient warm blobs */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-18%",left:"-8%",width:440,height:440,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,175,82,0.07) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-12%",right:"-6%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,151,58,0.08) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",top:"40%",right:"15%",width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(156,107,60,0.06) 0%,transparent 70%)"}}/>
      </div>

      {/* ── HEADER ── */}
      <div style={{position:"relative",zIndex:1,borderBottom:"1px solid rgba(120,88,55,0.3)",padding:"15px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(14px)",background:"rgba(28,18,8,0.9)"}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.3px",fontFamily:F,
            background:`linear-gradient(120deg,${MATCHA} 0%,${MUSTARD} 100%)`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            DAYFLOW
          </div>
          <div style={{fontSize:10,color:"#4A3828",fontFamily:FM,marginTop:1}}>
            {DAYS_SHORT[today.getDay()].toUpperCase()} · {MONTHS_FULL[today.getMonth()].toUpperCase()} {today.getDate()}, {today.getFullYear()}
          </div>
        </div>
        <div style={{display:"flex",gap:5}}>
          {["day","week","month"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:"5px 14px",borderRadius:7,cursor:"pointer",transition:"all 0.15s",
              fontFamily:F,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",
              border:`1px solid ${view===v?MATCHA:"rgba(120,88,55,0.3)"}`,
              background:view===v?"rgba(139,175,82,0.12)":"transparent",
              color:view===v?MATCHA:"#6A5040",
            }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{position:"relative",zIndex:1,padding:"20px 26px",maxWidth:1160,margin:"0 auto"}}>

        {/* ── DAY VIEW ── */}
        {view==="day"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:20}}>
            <div>
              {/* Date nav */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <NavBtn onClick={()=>{const d=fromKey(selDate);d.setDate(d.getDate()-1);setSelDate(toKey(d));}} label="‹"/>
                <div style={{fontFamily:F,fontSize:21,fontWeight:700,letterSpacing:"-0.3px",color:"#E0CBA8"}}>
                  {fmt(selObj)}
                  {selDate===todayKey&&<span style={{marginLeft:9,fontSize:9,color:MATCHA,background:"rgba(139,175,82,0.14)",padding:"2px 8px",borderRadius:20,verticalAlign:"middle",fontWeight:700,letterSpacing:"0.04em"}}>TODAY</span>}
                </div>
                <NavBtn onClick={()=>{const d=fromKey(selDate);d.setDate(d.getDate()+1);setSelDate(toKey(d));}} label="›"/>
                {selDate!==todayKey&&<button onClick={()=>setSelDate(todayKey)} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:7,cursor:"pointer",border:`1px solid rgba(139,175,82,0.3)`,background:"transparent",color:MATCHA,fontFamily:F,fontSize:9,fontWeight:700}}>→ TODAY</button>}
              </div>

              <FilterBar/>

              {/* Progress */}
              {dayTasks.length>0&&(
                <div style={{marginBottom:14,padding:"10px 13px",borderRadius:9,background:"rgba(60,42,24,0.6)",border:"1px solid rgba(100,72,44,0.3)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:9,color:"#6A5040",fontWeight:700,letterSpacing:"0.04em",fontFamily:F}}>DAILY PROGRESS</span>
                    <span style={{fontSize:9,color:pct(selDate)===100?MATCHA:MUSTARD,fontFamily:FM,fontWeight:500}}>{stats(selDate).done}/{stats(selDate).total} · {pct(selDate)}%</span>
                  </div>
                  <div style={{height:3,background:"rgba(80,58,35,0.5)",borderRadius:2}}>
                    <div style={{height:"100%",borderRadius:2,width:`${pct(selDate)}%`,background:pct(selDate)===100?MATCHA:`linear-gradient(90deg,${MUSTARD},${MATCHA})`,transition:"width 0.4s"}}/>
                  </div>
                </div>
              )}

              {showWSpan&&visWSpan.length>0&&(<div style={{marginBottom:12}}><SectionLabel color={MUSTARD}>⬡ WEEK-SPAN</SectionLabel>{visWSpan.map(t=><TR key={t.id} task={t} onToggle={()=>toggleSpan(t.id)} onDelete={()=>deleteSpan(t.id)} onEdit={startEdit} onSave={()=>saveSpanEdit(t.id)} isSpan/>)}</div>)}
              {showMSpan&&visMSpan.length>0&&(<div style={{marginBottom:12}}><SectionLabel color={BROWN}>⬡ MONTH-SPAN</SectionLabel>{visMSpan.map(t=><TR key={t.id} task={t} onToggle={()=>toggleSpan(t.id)} onDelete={()=>deleteSpan(t.id)} onEdit={startEdit} onSave={()=>saveSpanEdit(t.id)} isSpan/>)}</div>)}
              {showDay&&visCarried.length>0&&(<div style={{marginBottom:12}}><SectionLabel color={MUSTARD}>↩ CARRIED OVER</SectionLabel>{visCarried.map(t=><TR key={t.id} task={t} onToggle={()=>toggleDay(selDate,t.id)} onDelete={()=>deleteDay(selDate,t.id)} onEdit={startEdit} onSave={saveDayEdit} ekey={selDate}/>)}</div>)}
              {showDay&&visActive.length>0&&(<div style={{marginBottom:12}}><SectionLabel color={MATCHA}>● ACTIVE</SectionLabel>{visActive.map(t=><TR key={t.id} task={t} onToggle={()=>toggleDay(selDate,t.id)} onDelete={()=>deleteDay(selDate,t.id)} onEdit={startEdit} onSave={saveDayEdit} ekey={selDate}/>)}</div>)}
              {showDay&&visDone.length>0&&(<div style={{marginBottom:12}}><SectionLabel color="#4A3828">✓ DONE</SectionLabel>{visDone.map(t=><TR key={t.id} task={t} onToggle={()=>toggleDay(selDate,t.id)} onDelete={()=>deleteDay(selDate,t.id)} onEdit={startEdit} onSave={saveDayEdit} ekey={selDate}/>)}</div>)}

              {dayTasks.length===0&&wSpan.length===0&&mSpan.length===0&&(
                <div style={{textAlign:"center",padding:"40px 0",color:"#3A2A1A",fontSize:12,fontFamily:F}}>
                  <div style={{fontSize:24,marginBottom:8,opacity:0.4}}>◎</div>Nothing yet. Add a task below.
                </div>
              )}

              {/* Add task panel */}
              <div style={{marginTop:16,padding:"13px",borderRadius:10,background:"rgba(50,34,18,0.7)",border:"1px solid rgba(110,80,50,0.3)"}}>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:9,color:"#6A5040",fontWeight:700,letterSpacing:"0.04em",marginBottom:6,fontFamily:F}}>CATEGORY FOR NEW TASK</div>
                  <CatSelect value={newCat} onChange={setNewCat}/>
                </div>
                <div style={{display:"flex",gap:7,marginTop:10}}>
                  <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDayTask()}
                    placeholder="Add a day task…"
                    style={{flex:1,padding:"9px 12px",borderRadius:9,background:"rgba(70,48,26,0.6)",border:"1px solid rgba(110,80,50,0.35)",color:"#E0CBA8",fontFamily:F,fontSize:13}}/>
                  <button onClick={addDayTask} style={{padding:"9px 15px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:700,background:`linear-gradient(135deg,${MATCHA},#6A8C3A)`,color:"#1A1008",whiteSpace:"nowrap"}}>+ ADD</button>
                  <button onClick={()=>setSpanModal(true)} style={{padding:"9px 13px",borderRadius:9,cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:700,border:`1px solid rgba(201,151,58,0.4)`,background:"rgba(201,151,58,0.1)",color:MUSTARD,whiteSpace:"nowrap"}}>⬡ SPAN</button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div style={{fontSize:9,color:"#4A3828",marginBottom:10,fontWeight:700,letterSpacing:"0.04em",fontFamily:F}}>RECENT DAYS</div>
              {Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-i);return d;}).map(d=>{
                const k=toKey(d);
                return (
                  <div key={k} className="day-card" onClick={()=>setSelDate(k)} style={{
                    padding:"9px 12px",borderRadius:9,marginBottom:5,cursor:"pointer",transition:"all 0.15s",
                    background:selDate===k?"rgba(201,151,58,0.1)":"rgba(50,35,18,0.6)",
                    border:`1px solid ${selDate===k?"rgba(201,151,58,0.35)":"rgba(90,65,38,0.3)"}`,
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:11,color:k===todayKey?MATCHA:selDate===k?MUSTARD:"#A08060",fontWeight:600,fontFamily:F}}>{k===todayKey?"Today":fmt(d)}</div>
                      <div style={{fontSize:9,color:"#4A3828",fontFamily:FM}}>{stats(k).done}/{stats(k).total}</div>
                    </div>
                    {stats(k).total>0&&<div style={{height:2,background:"rgba(80,55,30,0.4)",borderRadius:1,marginTop:6}}><div style={{height:"100%",borderRadius:1,background:pct(k)===100?MATCHA:MUSTARD,width:`${pct(k)}%`,transition:"width 0.3s"}}/></div>}
                    <div style={{display:"flex",gap:3,marginTop:5,flexWrap:"wrap"}}>
                      {Object.entries(CATEGORIES).filter(([ck])=>getTasks(k).some(t=>(t.category||"other")===ck)).map(([ck,c])=>(
                        <div key={ck} title={c.label} style={{width:6,height:6,borderRadius:"50%",background:c.color,opacity:0.75}}/>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── WEEK VIEW ── */}
        {view==="week"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <NavBtn onClick={()=>{const d=new Date(weekAnchor);d.setDate(d.getDate()-7);setWeekAnchor(d);}} label="‹"/>
              <div style={{fontFamily:F,fontSize:20,fontWeight:700,letterSpacing:"-0.3px",color:"#E0CBA8"}}>
                {MONTHS_FULL[weekDates[0].getMonth()].slice(0,3)} {weekDates[0].getDate()} – {weekDates[6].getDate()}, {weekDates[0].getFullYear()}
              </div>
              <NavBtn onClick={()=>{const d=new Date(weekAnchor);d.setDate(d.getDate()+7);setWeekAnchor(d);}} label="›"/>
              <button onClick={()=>setWeekAnchor(today)} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:7,cursor:"pointer",border:`1px solid rgba(139,175,82,0.3)`,background:"transparent",color:MATCHA,fontFamily:F,fontSize:9,fontWeight:700}}>THIS WEEK</button>
            </div>

            <CatFilterBar/>

            {(()=>{
              const all=weekDates.flatMap(d=>getTasks(toKey(d)));
              const wst=getSpanFor(weekKey(weekAnchor));
              const done=all.filter(t=>t.done).length;
              return (
                <div style={{padding:"13px 16px",borderRadius:11,background:"rgba(50,35,18,0.7)",border:"1px solid rgba(100,72,44,0.3)",marginBottom:16,display:"flex",gap:22,flexWrap:"wrap"}}>
                  <Stat label="DAY TASKS"  value={all.length}          color={MATCHA}/>
                  <Stat label="COMPLETED"  value={done}                color={MATCHA}/>
                  <Stat label="REMAINING"  value={all.length-done}     color={MUSTARD}/>
                  <Stat label="RATE"       value={`${all.length?Math.round((done/all.length)*100):0}%`} color="#C4A878"/>
                  <div style={{width:1,background:"rgba(100,72,44,0.3)"}}/>
                  <Stat label="WEEK-SPAN"  value={wst.length}                    color={MUSTARD}/>
                  <Stat label="SPAN DONE"  value={wst.filter(t=>t.done).length}  color={MUSTARD}/>
                </div>
              );
            })()}

            <SpanPanel scopeKey={weekKey(weekAnchor)} span="week"/>

            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
              {weekDates.map(d=><MiniDay key={toKey(d)} date={d}/>)}
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view==="month"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <NavBtn onClick={()=>{const d=new Date(monthAnchor);d.setMonth(d.getMonth()-1);setMonthAnchor(d);}} label="‹"/>
              <div style={{fontFamily:F,fontSize:20,fontWeight:700,letterSpacing:"-0.3px",color:"#E0CBA8"}}>{MONTHS_FULL[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}</div>
              <NavBtn onClick={()=>{const d=new Date(monthAnchor);d.setMonth(d.getMonth()+1);setMonthAnchor(d);}} label="›"/>
              <button onClick={()=>setMonthAnchor(today)} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:7,cursor:"pointer",border:`1px solid rgba(139,175,82,0.3)`,background:"transparent",color:MATCHA,fontFamily:F,fontSize:9,fontWeight:700}}>THIS MONTH</button>
            </div>

            <CatFilterBar/>

            {(()=>{
              const all=monthDates.flatMap(d=>getTasks(toKey(d)));
              const mst=getSpanFor(monthKey(monthAnchor));
              const done=all.filter(t=>t.done).length;
              const active=monthDates.filter(d=>getTasks(toKey(d)).length>0).length;
              return (
                <div style={{padding:"13px 16px",borderRadius:11,background:"rgba(50,35,18,0.7)",border:"1px solid rgba(100,72,44,0.3)",marginBottom:16,display:"flex",gap:22,flexWrap:"wrap"}}>
                  <Stat label="TOTAL TASKS"  value={all.length}         color={MATCHA}/>
                  <Stat label="COMPLETED"    value={done}               color={MATCHA}/>
                  <Stat label="ACTIVE DAYS"  value={active}             color={BROWN}/>
                  <Stat label="RATE"         value={`${all.length?Math.round((done/all.length)*100):0}%`} color="#C4A878"/>
                  <div style={{width:1,background:"rgba(100,72,44,0.3)"}}/>
                  <Stat label="MONTH-SPAN"   value={mst.length}                   color={BROWN}/>
                  <Stat label="SPAN DONE"    value={mst.filter(t=>t.done).length} color={BROWN}/>
                </div>
              );
            })()}

            <SpanPanel scopeKey={monthKey(monthAnchor)} span="month"/>

            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:5}}>
              {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:"#4A3828",padding:"3px 0",fontFamily:F,fontWeight:700,letterSpacing:"0.04em"}}>{d.toUpperCase()}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {Array.from({length:new Date(monthAnchor.getFullYear(),monthAnchor.getMonth(),1).getDay()},(_,i)=><div key={"e"+i}/>)}
              {monthDates.map(d=>{
                const k=toKey(d); const isToday=k===todayKey;
                const {total,done}=stats(k); const p=total?(done/total)*100:0;
                const catDots=Object.entries(CATEGORIES).filter(([ck])=>getTasks(k).some(t=>(t.category||"other")===ck));
                return (
                  <div key={k} className="day-card" onClick={()=>{setSelDate(k);setView("day");}} style={{
                    padding:"7px 6px",borderRadius:8,cursor:"pointer",minHeight:62,transition:"all 0.15s",
                    background:isToday?"rgba(139,175,82,0.1)":"rgba(50,35,18,0.5)",
                    border:`1px solid ${isToday?"rgba(139,175,82,0.38)":"rgba(90,65,38,0.28)"}`,
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <span style={{fontSize:11,fontWeight:700,color:isToday?MATCHA:"#907060",fontFamily:FM}}>{d.getDate()}</span>
                      {total>0&&<span style={{fontSize:8,color:"#4A3828",fontFamily:FM}}>{done}/{total}</span>}
                    </div>
                    {total>0&&<div style={{height:2,background:"rgba(80,55,30,0.4)",borderRadius:1}}><div style={{height:"100%",borderRadius:1,background:p===100?MATCHA:MUSTARD,width:`${p}%`,transition:"width 0.3s"}}/></div>}
                    <div style={{display:"flex",gap:2,marginTop:4,flexWrap:"wrap"}}>
                      {catDots.map(([ck,c])=><div key={ck} title={c.label} style={{width:5,height:5,borderRadius:"50%",background:c.color,opacity:0.8}}/>)}
                    </div>
                    {getTasks(k).slice(0,1).map(t=>(
                      <div key={t.id} style={{fontSize:8,color:t.done?"#4A3828":"#7A6050",textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:F,marginTop:3}}>{t.text}</div>
                    ))}
                    {getTasks(k).length>1&&<div style={{fontSize:8,color:"#3A2A18",fontFamily:F}}>+{getTasks(k).length-1}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{position:"relative",zIndex:1,borderTop:"1px solid rgba(90,65,38,0.25)",padding:"12px 26px",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
        {Object.entries(CATEGORIES).map(([k,c])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#4A3828"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:c.color}}/>
            <span style={{fontFamily:F,fontWeight:600}}>{c.label}</span>
          </div>
        ))}
        <div style={{fontSize:9,color:"#2E2010",marginLeft:"auto",fontFamily:F,fontWeight:600}}>Double-click to edit · Enter to save</div>
      </div>

      {spanModal&&<SpanModal sk={spanScopeKey}/>}
    </div>
  );
}

