import { useState, useEffect, useRef } from "react";

const PRIMARY  = "#C0440A";
const ACCENT   = "#9E3A08";
const WEEK_C   = "#7B5EA7";
const MONTH_C  = "#2E86AB";
const TEXT     = "#2C1A0E";
const MUTED    = "#8A7060";
const BG       = "#FAF6EF";
const SURFACE  = "#F2EBE0";
const BORDER   = "#E0D4C4";
const SURFACE2 = "#EDE4D6";

const CATEGORIES = {
  personal: { label:"Personal",         emoji:"🏠", color:"#C0440A", bg:"rgba(192,68,10,0.10)",   border:"rgba(192,68,10,0.30)"   },
  work:     { label:"Work",             emoji:"💼", color:"#1A6FA8", bg:"rgba(26,111,168,0.10)",  border:"rgba(26,111,168,0.30)"  },
  profdev:  { label:"Prof. Dev.",       emoji:"📈", color:"#7B5EA7", bg:"rgba(123,94,167,0.10)",  border:"rgba(123,94,167,0.30)"  },
  learning: { label:"Learning",         emoji:"📚", color:"#2E8B57", bg:"rgba(46,139,87,0.10)",   border:"rgba(46,139,87,0.30)"   },
  health:   { label:"Health & Fitness", emoji:"🏃", color:"#D4500A", bg:"rgba(212,80,10,0.10)",   border:"rgba(212,80,10,0.30)"   },
  finance:  { label:"Finance",          emoji:"💰", color:"#B8860B", bg:"rgba(184,134,11,0.12)",  border:"rgba(184,134,11,0.32)"  },
  social:   { label:"Social",           emoji:"👥", color:"#C2185B", bg:"rgba(194,24,91,0.10)",   border:"rgba(194,24,91,0.30)"   },
  creative: { label:"Creative",         emoji:"🎨", color:"#E65100", bg:"rgba(230,81,0,0.10)",    border:"rgba(230,81,0,0.30)"    },
  other:    { label:"Other",            emoji:"✦",  color:"#607D8B", bg:"rgba(96,125,139,0.10)",  border:"rgba(96,125,139,0.30)"  },
};

const PRIORITIES = {
  high:   { label:"High",   color:"#C0440A", bg:"rgba(192,68,10,0.10)",  border:"rgba(192,68,10,0.30)",  icon:"🔴", order:0 },
  medium: { label:"Medium", color:"#B8860B", bg:"rgba(184,134,11,0.10)", border:"rgba(184,134,11,0.30)", icon:"🟡", order:1 },
  low:    { label:"Low",    color:"#2E8B57", bg:"rgba(46,139,87,0.10)",  border:"rgba(46,139,87,0.30)",  icon:"🟢", order:2 },
};

const DURATION_PRESETS = ["15m","30m","1h","2h","3h+"];

const SPAN_COLORS = {
  week:  { bg:"rgba(123,94,167,0.08)",  border:"rgba(123,94,167,0.32)", dot:WEEK_C,  text:WEEK_C  },
  month: { bg:"rgba(46,134,171,0.08)",  border:"rgba(46,134,171,0.32)", dot:MONTH_C, text:MONTH_C },
};

const F  = "'DM Sans',sans-serif";
const FM = "'DM Mono',monospace";

function toKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fromKey(k) { return new Date(k+"T00:00:00"); }
function getWeekStart(d) { const c=new Date(d); c.setDate(c.getDate()-c.getDay()); return c; }
function weekKey(d)  { return "W-"+toKey(getWeekStart(d)); }
function monthKey(d) { return `M-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function uid()       { return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function getWeekDates(a)  { const ws=getWeekStart(a); return Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(d.getDate()+i);return d;}); }
function getMonthDates(a) { const y=a.getFullYear(),m=a.getMonth(); return Array.from({length:new Date(y,m+1,0).getDate()},(_,i)=>new Date(y,m,i+1)); }
function fmt(d) { const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${DAYS[d.getDay()]}, ${MO[d.getMonth()]} ${d.getDate()}`; }

function durationToMins(dur) {
  if (!dur) return 0;
  if (dur==="15m") return 15;
  if (dur==="30m") return 30;
  if (dur==="1h")  return 60;
  if (dur==="2h")  return 120;
  if (dur==="3h+") return 180;
  const m=dur.match(/(\d+)\s*h/i); const n=dur.match(/(\d+)\s*m/i);
  return (m?parseInt(m[1])*60:0)+(n?parseInt(n[1]):0)||parseInt(dur)||0;
}

const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const INIT = { tasks:{}, spanTasks:[] };

export default function App() {
  const today    = new Date();
  const todayKey = toKey(today);

  const [data,        setData]        = useState(() => { try { return JSON.parse(localStorage.getItem("dailyplanner-v3")||"null")||INIT; } catch { return INIT; } });
  const [view,        setView]        = useState("day");
  const [selDate,     setSelDate]     = useState(todayKey);
  const [weekAnchor,  setWeekAnchor]  = useState(today);
  const [monthAnchor, setMonthAnchor] = useState(today);
  const [input,       setInput]       = useState("");
  const [newCat,      setNewCat]      = useState("personal");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDuration, setNewDuration] = useState("");
  const [customDur,   setCustomDur]   = useState("");
  const [showCustom,  setShowCustom]  = useState(false);
  const [spanInput,   setSpanInput]   = useState("");
  const [spanCat,     setSpanCat]     = useState("personal");
  const [spanPriority,setSpanPriority]= useState("medium");
  const [spanDuration,setSpanDuration]= useState("");
  const [editingId,   setEditingId]   = useState(null);
  const [editText,    setEditText]    = useState("");
  const [editingCatId,setEditingCatId]= useState(null);
  const [spanModal,   setSpanModal]   = useState(false);
  const [spanType,    setSpanType]    = useState("week");
  const [filterSpan,  setFilterSpan]  = useState("all");
  const [filterCat,   setFilterCat]   = useState("all");
  const [sortBy,      setSortBy]      = useState("added");
  const [sortDir,     setSortDir]     = useState("asc");
  const inputRef = useRef();

  useEffect(() => { try { localStorage.setItem("dailyplanner-v3",JSON.stringify(data)); } catch {} }, [data]);

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

  const getTasks   = k  => data.tasks[k]||[];
  const getSpanFor = sk => (data.spanTasks||[]).filter(t=>t.scopeKey===sk);

  function appliedDuration() {
    if (showCustom) return customDur.trim();
    return newDuration;
  }

  function addDayTask() {
    if (!input.trim()) return;
    const dur = appliedDuration();
    const t={id:uid(),text:input.trim(),done:false,carried:false,category:newCat,priority:newPriority,duration:dur,createdAt:Date.now()};
    setData(prev=>({...prev,tasks:{...prev.tasks,[selDate]:[...(prev.tasks[selDate]||[]),t]}}));
    setInput(""); setNewDuration(""); setCustomDur(""); setShowCustom(false);
    inputRef.current?.focus();
  }
  function toggleDay(key,id) { setData(prev=>({...prev,tasks:{...prev.tasks,[key]:(prev.tasks[key]||[]).map(t=>t.id===id?{...t,done:!t.done}:t)}})); }
  function deleteDay(key,id) { setData(prev=>({...prev,tasks:{...prev.tasks,[key]:(prev.tasks[key]||[]).filter(t=>t.id!==id)}})); }
  function updateTaskField(key,id,fields) { setData(prev=>({...prev,tasks:{...prev.tasks,[key]:(prev.tasks[key]||[]).map(t=>t.id===id?{...t,...fields}:t)}})); }

  function addSpanTask(sk) {
    if (!spanInput.trim()) return;
    const t={id:uid(),text:spanInput.trim(),done:false,span:spanType,scopeKey:sk,category:spanCat,priority:spanPriority,duration:spanDuration,createdAt:Date.now()};
    setData(prev=>({...prev,spanTasks:[...(prev.spanTasks||[]),t]}));
    setSpanInput(""); setSpanDuration(""); setSpanModal(false);
  }
  function toggleSpan(id) { setData(prev=>({...prev,spanTasks:(prev.spanTasks||[]).map(t=>t.id===id?{...t,done:!t.done}:t)})); }
  function deleteSpan(id) { setData(prev=>({...prev,spanTasks:(prev.spanTasks||[]).filter(t=>t.id!==id)})); }
  function updateSpanField(id,fields) { setData(prev=>({...prev,spanTasks:(prev.spanTasks||[]).map(t=>t.id===id?{...t,...fields}:t)})); }

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

  function sortTasks(tasks) {
    const sorted = [...tasks].sort((a,b) => {
      if (sortBy==="priority") {
        const pa=PRIORITIES[a.priority||"medium"]?.order??1;
        const pb=PRIORITIES[b.priority||"medium"]?.order??1;
        return pa-pb;
      }
      if (sortBy==="duration") {
        return durationToMins(a.duration||"")-durationToMins(b.duration||"");
      }
      if (sortBy==="category") {
        return (a.category||"other").localeCompare(b.category||"other");
      }
      return (a.createdAt||0)-(b.createdAt||0);
    });
    return sortDir==="desc" ? sorted.reverse() : sorted;
  }

  const stats = k => { const t=getTasks(k); return {total:t.length,done:t.filter(x=>x.done).length}; };
  const pct   = k => { const {total,done}=stats(k); return total?Math.round((done/total)*100):0; };

  const selObj     = fromKey(selDate);
  const weekDates  = getWeekDates(weekAnchor);
  const monthDates = getMonthDates(monthAnchor);

  const applyFilter = ts => filterCat==="all" ? ts : ts.filter(t=>(t.category||"other")===filterCat);

  const dayTasks = getTasks(selDate);
  const wSpan    = getSpanFor(weekKey(selObj));
  const mSpan    = getSpanFor(monthKey(selObj));

  const visCarried = sortTasks(applyFilter(dayTasks.filter(t=>t.carried&&!t.done)));
  const visActive  = sortTasks(applyFilter(dayTasks.filter(t=>!t.carried&&!t.done)));
  const visDone    = sortTasks(applyFilter(dayTasks.filter(t=>t.done)));
  const visWSpan   = sortTasks(applyFilter(wSpan));
  const visMSpan   = sortTasks(applyFilter(mSpan));

  const showWSpan = filterSpan==="all"||filterSpan==="week";
  const showMSpan = filterSpan==="all"||filterSpan==="month";
  const showDay   = filterSpan==="all"||filterSpan==="day";

  const spanScopeKey = view==="week" ? weekKey(weekAnchor) : view==="month" ? monthKey(monthAnchor) : weekKey(selObj);

  // ── Micro components ──────────────────────────────────────────────────────

  const Chip = ({label, active, color, onClick}) => (
    <button onClick={onClick} style={{
      padding:"4px 12px", borderRadius:20, cursor:"pointer", transition:"all 0.15s",
      fontFamily:F, fontSize:10, fontWeight:600, whiteSpace:"nowrap",
      border:`1.5px solid ${active ? color : BORDER}`,
      background: active ? `${color}18` : "white",
      color: active ? color : MUTED,
    }}>{label}</button>
  );

  const CatBadge = ({catKey, taskId, dayKey, isSpan}) => {
    const c = CATEGORIES[catKey]||CATEGORIES.other;
    const isEditing = editingCatId===taskId;
    if (isEditing) {
      return (
        <div style={{position:"relative",zIndex:50}}>
          <div style={{position:"absolute",top:0,left:0,background:"white",border:`1.5px solid ${BORDER}`,borderRadius:12,padding:10,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",display:"flex",flexWrap:"wrap",gap:5,width:260,zIndex:100}}>
            {Object.entries(CATEGORIES).map(([k,cat])=>(
              <button key={k} onClick={()=>{
                if(isSpan) updateSpanField(taskId,{category:k});
                else updateTaskField(dayKey,taskId,{category:k});
                setEditingCatId(null);
              }} style={{
                padding:"4px 9px",borderRadius:8,cursor:"pointer",fontFamily:F,fontSize:10,fontWeight:600,
                border:`1.5px solid ${catKey===k?cat.color:BORDER}`,
                background:catKey===k?cat.bg:"white",color:catKey===k?cat.color:MUTED,
                display:"flex",alignItems:"center",gap:3,
              }}>{cat.emoji} {cat.label}</button>
            ))}
            <button onClick={()=>setEditingCatId(null)} style={{padding:"4px 9px",borderRadius:8,cursor:"pointer",fontFamily:F,fontSize:10,border:`1.5px solid ${BORDER}`,background:"white",color:MUTED}}>✕ close</button>
          </div>
        </div>
      );
    }
    return (
      <span onClick={()=>setEditingCatId(taskId)} title="Click to change category" style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:10,
        background:c.bg, border:`1px solid ${c.border}`,
        fontSize:9, color:c.color, fontFamily:F, fontWeight:700, whiteSpace:"nowrap", cursor:"pointer"}}>
        {c.emoji} {c.label} ✎
      </span>
    );
  };

  const PriorityBadge = ({priority}) => {
    const p = PRIORITIES[priority||"medium"];
    return (
      <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:10,
        background:p.bg, border:`1px solid ${p.border}`,
        fontSize:9, color:p.color, fontFamily:F, fontWeight:700, whiteSpace:"nowrap"}}>
        {p.icon} {p.label}
      </span>
    );
  };

  const DurationBadge = ({duration}) => {
    if (!duration) return null;
    return (
      <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:10,
        background:"rgba(96,125,139,0.08)", border:"1px solid rgba(96,125,139,0.25)",
        fontSize:9, color:"#607D8B", fontFamily:FM, fontWeight:600, whiteSpace:"nowrap"}}>
        ⏱ {duration}
      </span>
    );
  };

  const NavBtn = ({onClick, label}) => (
    <button onClick={onClick} style={{
      width:30, height:30, borderRadius:8, cursor:"pointer", fontSize:15, fontFamily:FM,
      border:`1.5px solid ${BORDER}`, background:"white", color:MUTED,
      boxShadow:"0 1px 3px rgba(0,0,0,0.06)",
    }}>{label}</button>
  );

  const Stat = ({label, value, color}) => (
    <div>
      <div style={{fontSize:24,fontWeight:700,color,fontFamily:FM,lineHeight:1}}>{value}</div>
      <div style={{fontSize:9,color:MUTED,fontFamily:F,marginTop:2,fontWeight:600,letterSpacing:"0.05em"}}>{label}</div>
    </div>
  );

  const CatSelect = ({value, onChange}) => (
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {Object.entries(CATEGORIES).map(([k,c])=>(
        <button key={k} onClick={()=>onChange(k)} style={{
          padding:"5px 11px", borderRadius:8, cursor:"pointer",
          fontFamily:F, fontSize:10, fontWeight:600,
          border:`1.5px solid ${value===k ? c.color : BORDER}`,
          background: value===k ? c.bg : "white",
          color: value===k ? c.color : MUTED,
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span>{c.emoji}</span><span>{c.label}</span>
        </button>
      ))}
    </div>
  );

  const PrioritySelect = ({value, onChange}) => (
    <div style={{display:"flex",gap:6}}>
      {Object.entries(PRIORITIES).map(([k,p])=>(
        <button key={k} onClick={()=>onChange(k)} style={{
          flex:1, padding:"6px 0", borderRadius:8, cursor:"pointer",
          fontFamily:F, fontSize:10, fontWeight:700,
          border:`1.5px solid ${value===k?p.color:BORDER}`,
          background:value===k?p.bg:"white",
          color:value===k?p.color:MUTED,
          display:"flex",alignItems:"center",justifyContent:"center",gap:4,
        }}>{p.icon} {p.label}</button>
      ))}
    </div>
  );

  const DurationSelect = ({value, onChange, custom, onCustom, showCustom, setShowCustom}) => (
    <div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {DURATION_PRESETS.map(d=>(
          <button key={d} onClick={()=>{onChange(d);setShowCustom(false);}} style={{
            padding:"5px 11px", borderRadius:8, cursor:"pointer",
            fontFamily:FM, fontSize:10, fontWeight:600,
            border:`1.5px solid ${value===d&&!showCustom?PRIMARY:BORDER}`,
            background:value===d&&!showCustom?"rgba(192,68,10,0.10)":"white",
            color:value===d&&!showCustom?PRIMARY:MUTED,
          }}>{d}</button>
        ))}
        <button onClick={()=>{setShowCustom(!showCustom);onChange("");}} style={{
          padding:"5px 11px", borderRadius:8, cursor:"pointer",
          fontFamily:F, fontSize:10, fontWeight:600,
          border:`1.5px solid ${showCustom?PRIMARY:BORDER}`,
          background:showCustom?"rgba(192,68,10,0.10)":"white",
          color:showCustom?PRIMARY:MUTED,
        }}>✎ custom</button>
        {(value||showCustom)&&<button onClick={()=>{onChange("");onCustom("");setShowCustom(false);}} style={{padding:"5px 9px",borderRadius:8,cursor:"pointer",fontFamily:F,fontSize:10,border:`1.5px solid ${BORDER}`,background:"white",color:MUTED}}>✕</button>}
      </div>
      {showCustom&&(
        <input value={custom} onChange={e=>onCustom(e.target.value)} placeholder="e.g. 45m, 1.5h, 90 mins"
          style={{marginTop:7,padding:"7px 10px",borderRadius:8,border:`1.5px solid ${BORDER}`,background:SURFACE,color:TEXT,fontFamily:FM,fontSize:12,width:"100%"}}/>
      )}
    </div>
  );

  const SortBar = () => (
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:12,padding:"9px 13px",borderRadius:10,background:"white",border:`1.5px solid ${BORDER}`}}>
      <span style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.04em",marginRight:2,fontFamily:F}}>SORT</span>
      {[["added","Date Added"],["priority","Priority"],["duration","Duration"],["category","Category"]].map(([v,l])=>(
        <button key={v} onClick={()=>{if(sortBy===v)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(v);setSortDir("asc");}}} style={{
          padding:"4px 11px",borderRadius:8,cursor:"pointer",fontFamily:F,fontSize:10,fontWeight:600,whiteSpace:"nowrap",
          border:`1.5px solid ${sortBy===v?PRIMARY:BORDER}`,
          background:sortBy===v?"rgba(192,68,10,0.09)":"white",
          color:sortBy===v?PRIMARY:MUTED,
          display:"flex",alignItems:"center",gap:4,
        }}>
          {l} {sortBy===v&&<span style={{fontSize:11}}>{sortDir==="asc"?"↑":"↓"}</span>}
        </button>
      ))}
    </div>
  );

  const TR = ({task, onToggle, onDelete, onEdit, onSave, ekey, isSpan=false}) => {
    const sc  = isSpan ? SPAN_COLORS[task.span] : null;
    const cat = CATEGORIES[task.category||"other"]||CATEGORIES.other;
    const isEd = editingId===task.id;
    const checkColor = isSpan ? sc.dot : (PRIORITIES[task.priority||"medium"]?.color||PRIMARY);
    const rowBg     = task.done ? "#F5F0E8" : isSpan ? sc.bg : task.carried ? "rgba(192,68,10,0.04)" : "white";
    const rowBorder = task.done ? BORDER : isSpan ? sc.border : task.carried&&!task.done ? "rgba(192,68,10,0.22)" : BORDER;
    return (
      <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 13px",borderRadius:10,marginBottom:6,
        background:rowBg, border:`1.5px solid ${rowBorder}`,
        boxShadow: task.done?"none":"0 1px 4px rgba(0,0,0,0.05)"}}>
        <button onClick={onToggle} style={{
          width:19,height:19,borderRadius:5,border:"2px solid",flexShrink:0,marginTop:2,
          borderColor:checkColor, background:task.done?checkColor:"white",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          {task.done&&<svg width="9" height="7" viewBox="0 0 9 7"><polyline points="1,3.5 3.5,6 8,1" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
        <div style={{flex:1,minWidth:0}}>
          {isEd ? (
            <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")isSpan?saveSpanEdit(task.id):onSave(ekey);if(e.key==="Escape")setEditingId(null);}}
              onBlur={()=>isSpan?saveSpanEdit(task.id):onSave(ekey)}
              style={{width:"100%",background:"white",border:`1.5px solid ${cat.color}`,borderRadius:6,padding:"3px 8px",color:TEXT,fontFamily:F,fontSize:13,outline:"none"}}/>
          ) : (
            <div onDoubleClick={()=>onEdit(task.id,task.text)} style={{
              color:task.done?MUTED:TEXT,
              textDecoration:task.done?"line-through":"none",
              fontFamily:F, fontSize:13, lineHeight:1.5, wordBreak:"break-word",
            }}>{task.text}</div>
          )}
          <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap",alignItems:"center",position:"relative"}}>
            <CatBadge catKey={task.category||"other"} taskId={task.id} dayKey={ekey} isSpan={isSpan}/>
            <PriorityBadge priority={task.priority||"medium"}/>
            <DurationBadge duration={task.duration}/>
            {task.carried&&!task.done&&<span style={{fontSize:9,color:PRIMARY,fontFamily:F,fontWeight:700,background:"rgba(192,68,10,0.08)",padding:"1px 6px",borderRadius:8,border:"1px solid rgba(192,68,10,0.20)"}}>↩ carried</span>}
            {isSpan&&<span style={{fontSize:9,color:sc.text,fontFamily:F,fontWeight:700,background:sc.bg,padding:"1px 6px",borderRadius:8,border:`1px solid ${sc.border}`}}>⬡ {task.span}-span</span>}
          </div>
          {/* Inline priority/duration edit for existing tasks */}
          {!isEd&&!task.done&&(
            <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:9,color:MUTED,fontFamily:F,fontWeight:600}}>Priority:</span>
              {Object.entries(PRIORITIES).map(([k,p])=>(
                <button key={k} onClick={()=>isSpan?updateSpanField(task.id,{priority:k}):updateTaskField(ekey,task.id,{priority:k})} style={{
                  padding:"2px 7px",borderRadius:6,cursor:"pointer",fontFamily:F,fontSize:9,fontWeight:700,
                  border:`1px solid ${(task.priority||"medium")===k?p.color:BORDER}`,
                  background:(task.priority||"medium")===k?p.bg:"white",
                  color:(task.priority||"medium")===k?p.color:MUTED,
                }}>{p.icon} {p.label}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onDelete} style={{background:"none",border:"none",color:"#C4B0A0",cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0,marginTop:1,padding:"0 3px"}}
          onMouseEnter={e=>e.target.style.color=PRIMARY} onMouseLeave={e=>e.target.style.color="#C4B0A0"}>×</button>
      </div>
    );
  };

  const MiniDay = ({date}) => {
    const k=toKey(date); const isToday=k===todayKey; const isSel=k===selDate;
    const {total,done}=stats(k); const p=total?(done/total)*100:0;
    return (
      <div onClick={()=>{setSelDate(k);setView("day");}} style={{
        padding:"10px 8px",borderRadius:10,cursor:"pointer",transition:"all 0.15s",
        background: isToday?"rgba(192,68,10,0.07)":isSel?"rgba(158,58,8,0.04)":"white",
        border:`1.5px solid ${isToday?PRIMARY:isSel?ACCENT:BORDER}`,
        boxShadow: isToday?"0 2px 8px rgba(192,68,10,0.12)":"0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{fontSize:9,color:MUTED,fontFamily:F,fontWeight:700,letterSpacing:"0.05em"}}>{DAYS_SHORT[date.getDay()].toUpperCase()}</div>
        <div style={{fontSize:17,fontWeight:700,fontFamily:FM,lineHeight:1.2,color:isToday?PRIMARY:isSel?ACCENT:TEXT}}>{date.getDate()}</div>
        <div style={{height:3,background:BORDER,borderRadius:2,marginTop:6}}>
          <div style={{height:"100%",borderRadius:2,width:`${p}%`,background:p===100?PRIMARY:ACCENT,transition:"width 0.3s"}}/>
        </div>
        <div style={{fontSize:9,color:MUTED,fontFamily:FM,marginTop:4}}>{done}/{total}</div>
        {getTasks(k).slice(0,2).map(t=>{const c=CATEGORIES[t.category||"other"]||CATEGORIES.other; return (
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:3,marginTop:3}}>
            <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:t.done?BORDER:c.color}}/>
            <div style={{fontSize:9,color:t.done?MUTED:TEXT,textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:F}}>{t.text}</div>
          </div>
        );})}
        {getTasks(k).length>2&&<div style={{fontSize:9,color:MUTED,fontFamily:F}}>+{getTasks(k).length-2}</div>}
      </div>
    );
  };

  const SpanPanel = ({scopeKey, span}) => {
    const sc = SPAN_COLORS[span];
    const all = getSpanFor(scopeKey);
    const visible = sortTasks(filterCat==="all" ? all : all.filter(t=>(t.category||"other")===filterCat));
    return (
      <div style={{marginBottom:16,padding:"13px 16px",borderRadius:12,background:sc.bg,border:`1.5px solid ${sc.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:all.length?10:0}}>
          <div style={{fontSize:10,color:sc.text,fontWeight:700,letterSpacing:"0.05em",fontFamily:F}}>
            ⬡ {span.toUpperCase()}-SPAN TASKS {filterCat!=="all"&&`· ${CATEGORIES[filterCat]?.label}`}
          </div>
          <button onClick={()=>{setSpanType(span);setSpanModal(true);}} style={{
            padding:"4px 11px",borderRadius:8,cursor:"pointer",fontFamily:F,fontSize:10,fontWeight:700,
            border:`1.5px solid ${sc.border}`,background:"white",color:sc.text,
          }}>+ ADD</button>
        </div>
        {visible.length===0&&<div style={{fontSize:12,color:MUTED,fontFamily:F}}>No {span}-span tasks{filterCat!=="all"?` in ${CATEGORIES[filterCat]?.label}`:""}.</div>}
        {visible.map(t=><TR key={t.id} task={t} onToggle={()=>toggleSpan(t.id)} onDelete={()=>deleteSpan(t.id)} onEdit={startEdit} onSave={()=>saveSpanEdit(t.id)} isSpan/>)}
      </div>
    );
  };

  const SpanModal = ({sk}) => {
    const sc = SPAN_COLORS[spanType];
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(44,26,14,0.45)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
        onClick={()=>{setSpanModal(false);setSpanInput("");}}>
        <div onClick={e=>e.stopPropagation()} style={{
          background:"white", border:`1.5px solid ${BORDER}`,
          borderRadius:16, padding:26, width:440, maxHeight:"90vh", overflowY:"auto",
          boxShadow:"0 12px 60px rgba(44,26,14,0.18)",
        }}>
          <div style={{fontFamily:F,fontSize:16,fontWeight:700,color:TEXT,marginBottom:4}}>Add Span Task</div>
          <div style={{fontSize:12,color:MUTED,fontFamily:F,marginBottom:16}}>This task persists across the full {spanType}.</div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {["week","month"].map(s=>{const c=SPAN_COLORS[s]; return (
              <button key={s} onClick={()=>setSpanType(s)} style={{
                flex:1,padding:"8px 0",borderRadius:9,cursor:"pointer",
                fontFamily:F,fontSize:12,fontWeight:700,textTransform:"capitalize",
                border:`1.5px solid ${spanType===s?c.dot:BORDER}`,
                background:spanType===s?c.bg:"white",
                color:spanType===s?c.text:MUTED,
              }}>{s}-long</button>
            );})}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.04em",marginBottom:7,fontFamily:F}}>CATEGORY</div>
            <CatSelect value={spanCat} onChange={setSpanCat}/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.04em",marginBottom:7,fontFamily:F}}>PRIORITY</div>
            <PrioritySelect value={spanPriority} onChange={setSpanPriority}/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.04em",marginBottom:7,fontFamily:F}}>DURATION (optional)</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {DURATION_PRESETS.map(d=>(
                <button key={d} onClick={()=>setSpanDuration(spanDuration===d?"":d)} style={{
                  padding:"5px 11px",borderRadius:8,cursor:"pointer",fontFamily:FM,fontSize:10,fontWeight:600,
                  border:`1.5px solid ${spanDuration===d?PRIMARY:BORDER}`,
                  background:spanDuration===d?"rgba(192,68,10,0.10)":"white",
                  color:spanDuration===d?PRIMARY:MUTED,
                }}>{d}</button>
              ))}
            </div>
          </div>
          <input autoFocus value={spanInput} onChange={e=>setSpanInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")addSpanTask(sk);if(e.key==="Escape"){setSpanModal(false);setSpanInput("");}}}
            placeholder={`Describe this ${spanType}-long task…`}
            style={{width:"100%",padding:"10px 13px",borderRadius:10,background:SURFACE,border:`1.5px solid ${sc.border}`,color:TEXT,fontFamily:F,fontSize:13,outline:"none",marginBottom:14}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setSpanModal(false);setSpanInput("");}} style={{flex:1,padding:"9px 0",borderRadius:10,cursor:"pointer",fontFamily:F,fontSize:12,fontWeight:600,border:`1.5px solid ${BORDER}`,background:"white",color:MUTED}}>Cancel</button>
            <button onClick={()=>addSpanTask(sk)} style={{flex:2,padding:"9px 0",borderRadius:10,cursor:"pointer",fontFamily:F,fontSize:12,fontWeight:700,border:"none",background:sc.dot,color:"white"}}>+ Add {spanType}-span task</button>
          </div>
        </div>
      </div>
    );
  };

  const SectionLabel = ({color, children}) => (
    <div style={{fontSize:10,color,marginBottom:7,fontWeight:700,letterSpacing:"0.05em",fontFamily:F,display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:3,height:12,borderRadius:2,background:color}}/>
      {children}
    </div>
  );

  const FilterBar = () => (
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12,padding:"13px 15px",borderRadius:12,background:"white",border:`1.5px solid ${BORDER}`,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.04em",marginRight:3,fontFamily:F}}>SCOPE</span>
        {[["all","All"],["day","Day"],["week","Week-span"],["month","Month-span"]].map(([v,l])=>(
          <Chip key={v} label={l} active={filterSpan===v} color={v==="week"?WEEK_C:v==="month"?MONTH_C:PRIMARY} onClick={()=>setFilterSpan(v)}/>
        ))}
      </div>
      <div style={{height:1,background:BORDER}}/>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.04em",marginRight:3,fontFamily:F}}>CATEGORY</span>
        <Chip label="All" active={filterCat==="all"} color={PRIMARY} onClick={()=>setFilterCat("all")}/>
        {Object.entries(CATEGORIES).map(([k,c])=>(
          <Chip key={k} label={`${c.emoji} ${c.label}`} active={filterCat===k} color={c.color} onClick={()=>setFilterCat(k)}/>
        ))}
      </div>
    </div>
  );

  const CatFilterBar = () => (
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:12,padding:"11px 14px",borderRadius:11,background:"white",border:`1.5px solid ${BORDER}`}}>
      <span style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.04em",marginRight:3,fontFamily:F}}>CATEGORY</span>
      <Chip label="All" active={filterCat==="all"} color={PRIMARY} onClick={()=>setFilterCat("all")}/>
      {Object.entries(CATEGORIES).map(([k,c])=>(
        <Chip key={k} label={`${c.emoji} ${c.label}`} active={filterCat===k} color={c.color} onClick={()=>setFilterCat(k)}/>
      ))}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:BG,color:TEXT,fontFamily:F}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${BORDER};border-radius:2px;}
        button:focus,input:focus{outline:none;}
        .day-card:hover{box-shadow:0 3px 12px rgba(192,68,10,0.12)!important;border-color:rgba(192,68,10,0.28)!important;transform:translateY(-1px);}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{borderBottom:`1.5px solid ${BORDER}`,padding:"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"white",boxShadow:"0 2px 8px rgba(44,26,14,0.06)"}}>
        <div>
          <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.5px",fontFamily:F,
            background:`linear-gradient(120deg,${PRIMARY} 0%,${ACCENT} 100%)`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            DAILY PLANNER
          </div>
          <div style={{fontSize:10,color:MUTED,fontFamily:FM,marginTop:2,letterSpacing:"0.04em"}}>
            {DAYS_SHORT[today.getDay()].toUpperCase()} · {MONTHS_FULL[today.getMonth()].toUpperCase()} {today.getDate()}, {today.getFullYear()}
          </div>
        </div>
        <div style={{display:"flex",gap:5}}>
          {["day","week","month"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:"6px 16px",borderRadius:8,cursor:"pointer",
              fontFamily:F,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",
              border:`1.5px solid ${view===v?PRIMARY:BORDER}`,
              background:view===v?"rgba(192,68,10,0.08)":"white",
              color:view===v?PRIMARY:MUTED,
              boxShadow:view===v?`0 2px 6px rgba(192,68,10,0.14)`:"0 1px 3px rgba(0,0,0,0.05)",
            }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"22px 28px",maxWidth:1180,margin:"0 auto"}}>

        {/* ── DAY VIEW ── */}
        {view==="day"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:22}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                <NavBtn onClick={()=>{const d=fromKey(selDate);d.setDate(d.getDate()-1);setSelDate(toKey(d));}} label="‹"/>
                <div style={{fontFamily:F,fontSize:22,fontWeight:700,letterSpacing:"-0.4px",color:TEXT}}>
                  {fmt(selObj)}
                  {selDate===todayKey&&<span style={{marginLeft:10,fontSize:9,color:PRIMARY,background:"rgba(192,68,10,0.10)",padding:"3px 9px",borderRadius:20,verticalAlign:"middle",fontWeight:700,border:`1px solid rgba(192,68,10,0.22)`}}>TODAY</span>}
                </div>
                <NavBtn onClick={()=>{const d=fromKey(selDate);d.setDate(d.getDate()+1);setSelDate(toKey(d));}} label="›"/>
                {selDate!==todayKey&&<button onClick={()=>setSelDate(todayKey)} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,cursor:"pointer",border:`1.5px solid rgba(192,68,10,0.28)`,background:"rgba(192,68,10,0.06)",color:PRIMARY,fontFamily:F,fontSize:10,fontWeight:700}}>→ TODAY</button>}
              </div>

              <FilterBar/>
              <SortBar/>

              {dayTasks.length>0&&(
                <div style={{marginBottom:16,padding:"12px 15px",borderRadius:11,background:"white",border:`1.5px solid ${BORDER}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                    <span style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.05em",fontFamily:F}}>DAILY PROGRESS</span>
                    <span style={{fontSize:10,color:pct(selDate)===100?PRIMARY:ACCENT,fontFamily:FM,fontWeight:600}}>{stats(selDate).done}/{stats(selDate).total} · {pct(selDate)}%</span>
                  </div>
                  <div style={{height:6,background:SURFACE2,borderRadius:3}}>
                    <div style={{height:"100%",borderRadius:3,width:`${pct(selDate)}%`,background:pct(selDate)===100?PRIMARY:`linear-gradient(90deg,${ACCENT},${PRIMARY})`,transition:"width 0.4s"}}/>
                  </div>
                </div>
              )}

              {showWSpan&&visWSpan.length>0&&(<div style={{marginBottom:14}}><SectionLabel color={WEEK_C}>⬡ WEEK-SPAN</SectionLabel>{visWSpan.map(t=><TR key={t.id} task={t} onToggle={()=>toggleSpan(t.id)} onDelete={()=>deleteSpan(t.id)} onEdit={startEdit} onSave={()=>saveSpanEdit(t.id)} isSpan/>)}</div>)}
              {showMSpan&&visMSpan.length>0&&(<div style={{marginBottom:14}}><SectionLabel color={MONTH_C}>⬡ MONTH-SPAN</SectionLabel>{visMSpan.map(t=><TR key={t.id} task={t} onToggle={()=>toggleSpan(t.id)} onDelete={()=>deleteSpan(t.id)} onEdit={startEdit} onSave={()=>saveSpanEdit(t.id)} isSpan/>)}</div>)}
              {showDay&&visCarried.length>0&&(<div style={{marginBottom:14}}><SectionLabel color={PRIMARY}>↩ CARRIED OVER</SectionLabel>{visCarried.map(t=><TR key={t.id} task={t} onToggle={()=>toggleDay(selDate,t.id)} onDelete={()=>deleteDay(selDate,t.id)} onEdit={startEdit} onSave={saveDayEdit} ekey={selDate}/>)}</div>)}
              {showDay&&visActive.length>0&&(<div style={{marginBottom:14}}><SectionLabel color={TEXT}>● ACTIVE</SectionLabel>{visActive.map(t=><TR key={t.id} task={t} onToggle={()=>toggleDay(selDate,t.id)} onDelete={()=>deleteDay(selDate,t.id)} onEdit={startEdit} onSave={saveDayEdit} ekey={selDate}/>)}</div>)}
              {showDay&&visDone.length>0&&(<div style={{marginBottom:14}}><SectionLabel color={MUTED}>✓ DONE</SectionLabel>{visDone.map(t=><TR key={t.id} task={t} onToggle={()=>toggleDay(selDate,t.id)} onDelete={()=>deleteDay(selDate,t.id)} onEdit={startEdit} onSave={saveDayEdit} ekey={selDate}/>)}</div>)}

              {dayTasks.length===0&&wSpan.length===0&&mSpan.length===0&&(
                <div style={{textAlign:"center",padding:"48px 0",color:MUTED,fontSize:13,fontFamily:F}}>
                  <div style={{fontSize:28,marginBottom:10,opacity:0.3}}>◎</div>Nothing yet. Add a task below.
                </div>
              )}

              {/* ── ADD TASK PANEL ── */}
              <div style={{marginTop:18,padding:"16px",borderRadius:12,background:"white",border:`1.5px solid ${BORDER}`,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.05em",marginBottom:7,fontFamily:F}}>CATEGORY</div>
                  <CatSelect value={newCat} onChange={setNewCat}/>
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.05em",marginBottom:7,fontFamily:F}}>PRIORITY</div>
                  <PrioritySelect value={newPriority} onChange={setNewPriority}/>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:"0.05em",marginBottom:7,fontFamily:F}}>DURATION (optional)</div>
                  <DurationSelect
                    value={newDuration} onChange={setNewDuration}
                    custom={customDur} onCustom={setCustomDur}
                    showCustom={showCustom} setShowCustom={setShowCustom}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDayTask()}
                    placeholder="Add a task and press Enter…"
                    style={{flex:1,padding:"10px 13px",borderRadius:10,background:SURFACE,border:`1.5px solid ${BORDER}`,color:TEXT,fontFamily:F,fontSize:13}}/>
                  <button onClick={addDayTask} style={{padding:"10px 16px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:700,background:`linear-gradient(135deg,${PRIMARY},${ACCENT})`,color:"white",whiteSpace:"nowrap",boxShadow:`0 2px 8px ${PRIMARY}44`}}>+ ADD</button>
                  <button onClick={()=>setSpanModal(true)} style={{padding:"10px 14px",borderRadius:10,cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:700,border:`1.5px solid ${WEEK_C}55`,background:`rgba(123,94,167,0.07)`,color:WEEK_C,whiteSpace:"nowrap"}}>⬡ SPAN</button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div style={{fontSize:10,color:MUTED,marginBottom:10,fontWeight:700,letterSpacing:"0.05em",fontFamily:F}}>RECENT DAYS</div>
              {Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-i);return d;}).map(d=>{
                const k=toKey(d);
                return (
                  <div key={k} className="day-card" onClick={()=>setSelDate(k)} style={{
                    padding:"10px 13px",borderRadius:10,marginBottom:6,cursor:"pointer",transition:"all 0.15s",
                    background:selDate===k?"rgba(192,68,10,0.06)":"white",
                    border:`1.5px solid ${selDate===k?"rgba(192,68,10,0.28)":BORDER}`,
                    boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:12,color:k===todayKey?PRIMARY:selDate===k?ACCENT:TEXT,fontWeight:600,fontFamily:F}}>{k===todayKey?"Today":fmt(d)}</div>
                      <div style={{fontSize:10,color:MUTED,fontFamily:FM}}>{stats(k).done}/{stats(k).total}</div>
                    </div>
                    {stats(k).total>0&&<div style={{height:3,background:SURFACE2,borderRadius:2,marginTop:7}}><div style={{height:"100%",borderRadius:2,background:pct(k)===100?PRIMARY:ACCENT,width:`${pct(k)}%`,transition:"width 0.3s"}}/></div>}
                    <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                      {Object.entries(CATEGORIES).filter(([ck])=>getTasks(k).some(t=>(t.category||"other")===ck)).map(([ck,c])=>(
                        <div key={ck} title={c.label} style={{width:7,height:7,borderRadius:"50%",background:c.color}}/>
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
              <div style={{fontFamily:F,fontSize:21,fontWeight:700,color:TEXT}}>
                {MONTHS_FULL[weekDates[0].getMonth()].slice(0,3)} {weekDates[0].getDate()} – {weekDates[6].getDate()}, {weekDates[0].getFullYear()}
              </div>
              <NavBtn onClick={()=>{const d=new Date(weekAnchor);d.setDate(d.getDate()+7);setWeekAnchor(d);}} label="›"/>
              <button onClick={()=>setWeekAnchor(today)} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,cursor:"pointer",border:`1.5px solid rgba(192,68,10,0.28)`,background:"rgba(192,68,10,0.06)",color:PRIMARY,fontFamily:F,fontSize:10,fontWeight:700}}>THIS WEEK</button>
            </div>
            <CatFilterBar/>
            <SortBar/>
            {(()=>{
              const all=weekDates.flatMap(d=>getTasks(toKey(d)));
              const wst=getSpanFor(weekKey(weekAnchor));
              const done=all.filter(t=>t.done).length;
              return (
                <div style={{padding:"14px 18px",borderRadius:12,background:"white",border:`1.5px solid ${BORDER}`,marginBottom:16,display:"flex",gap:24,flexWrap:"wrap"}}>
                  <Stat label="DAY TASKS"  value={all.length}          color={TEXT}/>
                  <Stat label="COMPLETED"  value={done}                color={PRIMARY}/>
                  <Stat label="REMAINING"  value={all.length-done}     color={ACCENT}/>
                  <Stat label="RATE"       value={`${all.length?Math.round((done/all.length)*100):0}%`} color={PRIMARY}/>
                  <div style={{width:1,background:BORDER}}/>
                  <Stat label="WEEK-SPAN"  value={wst.length}                   color={WEEK_C}/>
                  <Stat label="SPAN DONE"  value={wst.filter(t=>t.done).length} color={WEEK_C}/>
                </div>
              );
            })()}
            <SpanPanel scopeKey={weekKey(weekAnchor)} span="week"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:7}}>
              {weekDates.map(d=><MiniDay key={toKey(d)} date={d}/>)}
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view==="month"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <NavBtn onClick={()=>{const d=new Date(monthAnchor);d.setMonth(d.getMonth()-1);setMonthAnchor(d);}} label="‹"/>
              <div style={{fontFamily:F,fontSize:21,fontWeight:700,color:TEXT}}>{MONTHS_FULL[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}</div>
              <NavBtn onClick={()=>{const d=new Date(monthAnchor);d.setMonth(d.getMonth()+1);setMonthAnchor(d);}} label="›"/>
              <button onClick={()=>setMonthAnchor(today)} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,cursor:"pointer",border:`1.5px solid rgba(192,68,10,0.28)`,background:"rgba(192,68,10,0.06)",color:PRIMARY,fontFamily:F,fontSize:10,fontWeight:700}}>THIS MONTH</button>
            </div>
            <CatFilterBar/>
            <SortBar/>
            {(()=>{
              const all=monthDates.flatMap(d=>getTasks(toKey(d)));
              const mst=getSpanFor(monthKey(monthAnchor));
              const done=all.filter(t=>t.done).length;
              const active=monthDates.filter(d=>getTasks(toKey(d)).length>0).length;
              return (
                <div style={{padding:"14px 18px",borderRadius:12,background:"white",border:`1.5px solid ${BORDER}`,marginBottom:16,display:"flex",gap:24,flexWrap:"wrap"}}>
                  <Stat label="TOTAL TASKS"  value={all.length}         color={TEXT}/>
                  <Stat label="COMPLETED"    value={done}               color={PRIMARY}/>
                  <Stat label="ACTIVE DAYS"  value={active}             color={MONTH_C}/>
                  <Stat label="RATE"         value={`${all.length?Math.round((done/all.length)*100):0}%`} color={PRIMARY}/>
                  <div style={{width:1,background:BORDER}}/>
                  <Stat label="MONTH-SPAN"   value={mst.length}                   color={MONTH_C}/>
                  <Stat label="SPAN DONE"    value={mst.filter(t=>t.done).length} color={MONTH_C}/>
                </div>
              );
            })()}
            <SpanPanel scopeKey={monthKey(monthAnchor)} span="month"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
              {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:MUTED,padding:"4px 0",fontFamily:F,fontWeight:700,letterSpacing:"0.05em"}}>{d.toUpperCase()}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
              {Array.from({length:new Date(monthAnchor.getFullYear(),monthAnchor.getMonth(),1).getDay()},(_,i)=><div key={"e"+i}/>)}
              {monthDates.map(d=>{
                const k=toKey(d); const isToday=k===todayKey;
                const {total,done}=stats(k); const p=total?(done/total)*100:0;
                const catDots=Object.entries(CATEGORIES).filter(([ck])=>getTasks(k).some(t=>(t.category||"other")===ck));
                return (
                  <div key={k} className="day-card" onClick={()=>{setSelDate(k);setView("day");}} style={{
                    padding:"8px 7px",borderRadius:9,cursor:"pointer",minHeight:65,transition:"all 0.15s",
                    background:isToday?"rgba(192,68,10,0.06)":"white",
                    border:`1.5px solid ${isToday?"rgba(192,68,10,0.32)":BORDER}`,
                    boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,color:isToday?PRIMARY:TEXT,fontFamily:FM}}>{d.getDate()}</span>
                      {total>0&&<span style={{fontSize:9,color:MUTED,fontFamily:FM}}>{done}/{total}</span>}
                    </div>
                    {total>0&&<div style={{height:3,background:SURFACE2,borderRadius:2}}><div style={{height:"100%",borderRadius:2,background:p===100?PRIMARY:ACCENT,width:`${p}%`,transition:"width 0.3s"}}/></div>}
                    <div style={{display:"flex",gap:3,marginTop:5,flexWrap:"wrap"}}>
                      {catDots.map(([ck,c])=><div key={ck} title={c.label} style={{width:6,height:6,borderRadius:"50%",background:c.color}}/>)}
                    </div>
                    {getTasks(k).slice(0,1).map(t=>(
                      <div key={t.id} style={{fontSize:9,color:t.done?MUTED:TEXT,textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:F,marginTop:4}}>{t.text}</div>
                    ))}
                    {getTasks(k).length>1&&<div style={{fontSize:9,color:MUTED,fontFamily:F}}>+{getTasks(k).length-1}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{borderTop:`1.5px solid ${BORDER}`,padding:"14px 28px",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center",background:"white"}}>
        {Object.entries(CATEGORIES).map(([k,c])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:MUTED}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:c.color}}/>
            <span style={{fontFamily:F,fontWeight:600}}>{c.label}</span>
          </div>
        ))}
        <div style={{fontSize:10,color:"#C4B0A0",marginLeft:"auto",fontFamily:F,fontWeight:500}}>Double-click text to edit · Click category badge to change it</div>
      </div>

      {spanModal&&<SpanModal sk={spanScopeKey}/>}
    </div>
  );
}

