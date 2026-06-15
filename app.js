const GOALS={startWeight:128,targetWeight:95,steps:8000,water:3,startDateKey:"q_startDate"};
const DAYS=[["MO","Montag"],["TU","Dienstag"],["WE","Mittwoch"],["TH","Donnerstag"],["FR","Freitag"],["SA","Samstag"],["SU","Sonntag"]];
const dayNameToIndex={MO:1,TU:2,WE:3,TH:4,FR:5,SA:6,SU:0};
const defaultPlan={timeMeal1:"09:00",timeFood1:"12:30",timeQore:"15:00",timeWalk:"17:00",timeFood2:"18:30",timeMeal2:"20:30",training:{MO:{on:true,time:"18:00"},TU:{on:false,time:"18:00"},WE:{on:false,time:"18:00"},TH:{on:true,time:"18:00"},FR:{on:false,time:"18:00"},SA:{on:false,time:"11:00"},SU:{on:false,time:"11:00"}},mounjaroDay:"SU",mounjaroTime:"10:00",reviewDay:"SU",reviewTime:"10:15"};
const missionNormal=["Wiegen","Qomplete Meal #1","Mahlzeit 1","QORE","30 Min Spaziergang","Mahlzeit 2","Qomplete Meal #2","2-3 Liter Wasser","Training, falls geplant","7,5 Std. Bettzeit planen"];
const missionBad=["Wiegen","Qomplete Meal #1","QORE","Qomplete Meal #2","Wasser","10 Minuten Bewegung"];
let badDay=false;
function todayISO(){return new Date().toISOString().slice(0,10)}function load(){return JSON.parse(localStorage.getItem("qomplete_logs")||"[]")}function save(logs){localStorage.setItem("qomplete_logs",JSON.stringify(logs))}
function getPlan(){return JSON.parse(localStorage.getItem("q_plan")||JSON.stringify(defaultPlan))}function savePlanObj(p){localStorage.setItem("q_plan",JSON.stringify(p))}
function setStartDate(){if(!localStorage.getItem(GOALS.startDateKey))localStorage.setItem(GOALS.startDateKey,todayISO())}
function avg(arr){const nums=arr.filter(x=>typeof x==="number"&&!isNaN(x));return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null}
function rolling7(logs,idx){return avg(logs.slice(Math.max(0,idx-6),idx+1).map(x=>x.weight))}function pct(value,goal){if(!value||!goal)return 0;return Math.max(0,Math.min(100,(value/goal)*100))}
function fmt(n,d=1){return n===null||n===undefined||isNaN(n)?"–":Number(n).toFixed(d)}function latest(logs){return logs.length?logs[logs.length-1]:null}
function upsert(date,patch){let all=load();let logs=all.filter(x=>x.date!==date);const old=all.find(x=>x.date===date)||{date};logs.push({...old,...patch,date});save(logs.sort((a,b)=>a.date.localeCompare(b.date)))}
function getChecks(){return JSON.parse(localStorage.getItem("q_checks_"+todayISO())||"{}")}function setChecks(checks){localStorage.setItem("q_checks_"+todayISO(),JSON.stringify(checks))}
function initPlanner(){const training=document.getElementById("trainingPlan");training.innerHTML="";DAYS.forEach(([key,name])=>{const div=document.createElement("div");div.className="day-card";div.innerHTML=`<label><input id="tr_${key}" type="checkbox"> ${name}</label><input id="trtime_${key}" type="time">`;training.appendChild(div)});["mounjaroDay","reviewDay"].forEach(id=>{const sel=document.getElementById(id);sel.innerHTML="";DAYS.forEach(([k,n])=>{const o=document.createElement("option");o.value=k;o.textContent=n;sel.appendChild(o)})})}
function loadPlannerToInputs(){const p=getPlan();["timeMeal1","timeFood1","timeQore","timeWalk","timeFood2","timeMeal2","mounjaroTime","reviewTime"].forEach(id=>document.getElementById(id).value=p[id]||"");document.getElementById("mounjaroDay").value=p.mounjaroDay;document.getElementById("reviewDay").value=p.reviewDay;DAYS.forEach(([k])=>{document.getElementById("tr_"+k).checked=!!p.training[k]?.on;document.getElementById("trtime_"+k).value=p.training[k]?.time||"18:00"})}
function readPlanFromInputs(){const p=getPlan();["timeMeal1","timeFood1","timeQore","timeWalk","timeFood2","timeMeal2","mounjaroTime","reviewTime"].forEach(id=>p[id]=document.getElementById(id).value);p.mounjaroDay=document.getElementById("mounjaroDay").value;p.reviewDay=document.getElementById("reviewDay").value;p.training={};DAYS.forEach(([k])=>{p.training[k]={on:document.getElementById("tr_"+k).checked,time:document.getElementById("trtime_"+k).value||"18:00"}});return p}
function renderTimeline(){
  const p=getPlan();

  const daily=[
    {time:p.timeMeal1,label:"Qomplete Meal #1 + Wasser + Wiegen"},
    {time:p.timeFood1,label:"Mahlzeit 1, proteinreich"},
    {time:p.timeQore,label:"QORE"},
    {time:p.timeWalk,label:"30 Min Spaziergang"},
    {time:p.timeFood2,label:"Mahlzeit 2, proteinreich"},
    {time:p.timeMeal2,label:"Qomplete Meal #2"}
  ].filter(x=>x.time).sort((a,b)=>a.time.localeCompare(b.time));

  const training=Object.entries(p.training)
    .filter(([k,v])=>v.on)
    .map(([k,v])=>`${DAYS.find(d=>d[0]==k)[1]} ${v.time}`)
    .join(" · ") || "noch nicht geplant";

  const fixed=[
    `${DAYS.find(d=>d[0]==p.mounjaroDay)[1]} ${p.mounjaroTime} Mounjaro`,
    `${DAYS.find(d=>d[0]==p.reviewDay)[1]} ${p.reviewTime} Wochenreview`
  ].join(" · ");

  document.getElementById("timeline").innerHTML =
    daily.map(x=>`<div><b>${x.time}</b><span>${x.label}</span></div>`).join("")
    + `<div><b>Training</b><span>${training}</span></div>`
    + `<div><b>Fixpunkte</b><span>${fixed}</span></div>`;

  document.getElementById("calendarPreview").innerHTML =
    daily.map(x=>`<div><b>${x.time}</b><span>${x.label}</span></div>`).join("")
    + `<div><b>Training</b><span>${training}</span></div>`
    + `<div><b>Wöchentlich</b><span>${fixed}</span></div>`;
}
function renderMission(){const list=badDay?missionBad:missionNormal;const box=document.getElementById("mission");const checks=getChecks();box.innerHTML="";list.forEach(item=>{const id="c_"+item.replace(/\W/g,"_");const row=document.createElement("label");row.className="check";row.innerHTML=`<input type="checkbox" id="${id}" ${checks[item]?"checked":""}> <span>${item}</span>`;box.appendChild(row);row.querySelector("input").addEventListener("change",e=>{checks[item]=e.target.checked;setChecks(checks);renderScore()})})}
function renderScore(){const list=badDay?missionBad:missionNormal;const checks=getChecks();const done=list.filter(x=>checks[x]).length,total=list.length,percent=total?Math.round(done/total*100):0;document.getElementById("scoreText").textContent=`${done} / ${total}`;document.getElementById("routineBar").style.width=percent+"%";document.getElementById("routineText").textContent=percent+"%";let status="Noch nichts erledigt";if(percent>=80)status="Stark. Heute ist auf Kurs.";else if(percent>=50)status="Solide. Weiter abhaken.";else if(percent>0)status="Angefangen. Nächster Haken zählt.";document.getElementById("scoreStatus").textContent=status}

function getChallenge(){
  return JSON.parse(localStorage.getItem("q_challenge") || JSON.stringify({
    started:false,
    startDate:null,
    startWeight:null,
    targetWeight:95
  }));
}
function saveChallenge(c){
  localStorage.setItem("q_challenge", JSON.stringify(c));
}
function loadChallengeInputs(){
  const c=getChallenge();
  document.getElementById("challengeStartDate").value = c.startDate || todayISO();
  document.getElementById("challengeStartWeight").value = c.startWeight || "";
  document.getElementById("challengeTargetWeight").value = c.targetWeight || 95;
}
function latestWeightValue(){
  const logs=load().sort((a,b)=>a.date.localeCompare(b.date));
  const l=latest(logs);
  return l?.weight || null;
}
function startChallenge(){
  const date=document.getElementById("challengeStartDate").value || todayISO();
  let startWeight=parseFloat(document.getElementById("challengeStartWeight").value);
  const targetWeight=parseFloat(document.getElementById("challengeTargetWeight").value) || 95;
  if(!startWeight){
    startWeight=latestWeightValue();
  }
  if(!startWeight){
    alert("Startgewicht fehlt. Trag es ein oder speicher vorher dein Gewicht.");
    return;
  }
  saveChallenge({started:true,startDate:date,startWeight,targetWeight});
  alert("Challenge gestartet.");
  render();
}
function resetChallenge(){
  if(!confirm("Challenge zurücksetzen? Gewichtseinträge bleiben erhalten.")) return;
  saveChallenge({started:false,startDate:null,startWeight:null,targetWeight:95});
  loadChallengeInputs();
  render();
}
function deleteAllData(){
  if(!confirm("Wirklich ALLE App-Daten löschen? Gewicht, Plan, Haken, Challenge, alles weg.")) return;
  if(!confirm("Letzte Sicherheitsfrage: Das kann nicht rückgängig gemacht werden. Wirklich löschen?")) return;
  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith("q_") || k==="qomplete_logs") localStorage.removeItem(k);
  });
  loadPlannerToInputs();
  loadChallengeInputs();
  render();
}
function renderChallenge(logs){
  const c=getChallenge();
  const status=document.getElementById("challengeStatus");
  const progressText=document.getElementById("weightProgressText");
  const bar=document.getElementById("weightProgressBar");

  if(!c.started){
    status.textContent="Noch nicht gestartet";
    progressText.textContent="Startdatum festlegen und Challenge starten.";
    bar.style.width="0%";
    return {day:1, remaining:89};
  }

  const start=new Date(c.startDate);
  const day=Math.min(90,Math.max(1,Math.floor((new Date()-start)/(1000*60*60*24))+1));
  const remaining=Math.max(0,90-day);
  status.textContent=`Läuft seit ${c.startDate} · Tag ${day} / 90`;

  const current=latest(logs)?.weight || c.startWeight;
  const totalToLose=c.startWeight-c.targetWeight;
  const lost=c.startWeight-current;
  const percent=totalToLose>0 ? Math.max(0,Math.min(100,(lost/totalToLose)*100)) : 0;
  progressText.textContent=`Start ${fmt(c.startWeight)} kg · aktuell ${fmt(current)} kg · Ziel ${fmt(c.targetWeight)} kg · verloren ${fmt(lost)} kg`;
  bar.style.width=percent+"%";
  return {day, remaining};
}

function render(){setStartDate();const logs=load().sort((a,b)=>a.date.localeCompare(b.date));const l=latest(logs);document.getElementById("latestWeight").textContent=l?.weight?fmt(l.weight)+" kg":"– kg";const avg7=logs.length?avg(logs.slice(-7).map(x=>x.weight)):null;document.getElementById("avg7").textContent=avg7?fmt(avg7)+" kg":"– kg";const current7=avg(logs.slice(-7).map(x=>x.weight)),prev7=avg(logs.slice(-14,-7).map(x=>x.weight));const tr=current7&&prev7?current7-prev7:null;document.getElementById("trend").textContent=tr===null?"–":(tr<0?"↓ ":"↑ ")+fmt(Math.abs(tr))+" kg";const challengeInfo=renderChallenge(logs);document.getElementById("dayCount").textContent=`Tag ${challengeInfo.day} / 90`;document.getElementById("remainingDays").textContent=`${challengeInfo.remaining} Tage übrig`;document.getElementById("date").value=todayISO();const todayLog=logs.find(x=>x.date===todayISO())||{};const w=todayLog.water||0,s=todayLog.steps||0;document.getElementById("waterBar").style.width=pct(w,GOALS.water)+"%";document.getElementById("stepsBar").style.width=pct(s,GOALS.steps)+"%";document.getElementById("waterText").textContent=w?`${w}/${GOALS.water}L`:"–";document.getElementById("stepsText").textContent=s?`${s}/${GOALS.steps}`:"–";renderTimeline();renderMission();renderScore();renderTable(logs);drawChart(logs)}
function renderTable(logs){const body=document.getElementById("logBody");body.innerHTML="";[...logs].reverse().slice(0,30).forEach(row=>{const idx=logs.findIndex(x=>x.date===row.date);const mood=row.moodEvening||row.moodMorning||"";const tr=document.createElement("tr");tr.innerHTML=`<td>${row.date}</td><td>${fmt(row.weight)} kg</td><td>${fmt(rolling7(logs,idx))} kg</td><td>${row.steps||""}</td><td>${row.water||""}</td><td>${mood}</td><td><button onclick="deleteLog('${row.date}')">Löschen</button></td>`;body.appendChild(tr)})}
function deleteLog(date){save(load().filter(x=>x.date!==date));render()}
function drawChart(logs){const canvas=document.getElementById("chart"),ctx=canvas.getContext("2d");ctx.clearRect(0,0,canvas.width,canvas.height);const data=logs.filter(x=>x.weight).slice(-60);if(data.length<2){ctx.fillStyle="#b7b0a1";ctx.font="18px Arial";ctx.fillText("Trage ein paar Tage Gewicht ein, dann erscheint hier der Verlauf.",28,130);return}const weights=data.map(x=>x.weight),min=Math.min(...weights)-1,max=Math.max(...weights)+1,pad=34,W=canvas.width-pad*2,H=canvas.height-pad*2;function x(i){return pad+(i/(data.length-1))*W}function y(v){return pad+(max-v)/(max-min)*H}ctx.strokeStyle="#394236";ctx.lineWidth=1;for(let i=0;i<5;i++){let yy=pad+i*H/4;ctx.beginPath();ctx.moveTo(pad,yy);ctx.lineTo(pad+W,yy);ctx.stroke()}ctx.strokeStyle="#d7b56d";ctx.lineWidth=3;ctx.beginPath();data.forEach((d,i)=>{i?ctx.lineTo(x(i),y(d.weight)):ctx.moveTo(x(i),y(d.weight))});ctx.stroke();const avgs=data.map((_,i)=>avg(data.slice(Math.max(0,i-6),i+1).map(x=>x.weight)));ctx.strokeStyle="#7fc97f";ctx.lineWidth=3;ctx.beginPath();avgs.forEach((v,i)=>{i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v))});ctx.stroke();ctx.fillStyle="#b7b0a1";ctx.font="14px Arial";ctx.fillText("Gold = Tagesgewicht, Grün = 7-Tage-Schnitt",pad,22)}

function nextDateFor(dayKey){
  const now=new Date();
  const target=dayNameToIndex[dayKey];
  const d=new Date(now);
  const diff=(target+7-now.getDay())%7;
  d.setDate(now.getDate()+(diff||7));
  return d;
}
function dateWithTime(base,time){
  const [h,m]=time.split(":").map(Number);
  const d=new Date(base);
  d.setHours(h||0,m||0,0,0);
  return d;
}
function toICSDate(d){
  const pad=n=>String(n).padStart(2,"0");
  return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"T"+pad(d.getHours())+pad(d.getMinutes())+"00";
}
function uid(){
  return Date.now()+"-"+Math.random().toString(16).slice(2)+"@max-qomplete";
}
function alarm(minutesBefore){
  if(!minutesBefore) return "";
  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Erinnerung",
    "TRIGGER:-PT"+minutesBefore+"M",
    "END:VALARM"
  ].join("\r\n");
}
function pointEventICS(title,start,rrule,reminderMinutes){
  return [
    "BEGIN:VEVENT",
    "UID:"+uid(),
    "SUMMARY:"+title,
    "DTSTART;TZID=Europe/Berlin:"+toICSDate(start),
    rrule ? "RRULE:"+rrule : "",
    alarm(reminderMinutes),
    "END:VEVENT"
  ].filter(Boolean).join("\r\n");
}
function durationEventICS(title,start,minutes,rrule,reminderMinutes){
  const end=new Date(start.getTime()+minutes*60000);
  return [
    "BEGIN:VEVENT",
    "UID:"+uid(),
    "SUMMARY:"+title,
    "DTSTART;TZID=Europe/Berlin:"+toICSDate(start),
    "DTEND;TZID=Europe/Berlin:"+toICSDate(end),
    rrule ? "RRULE:"+rrule : "",
    alarm(reminderMinutes),
    "END:VEVENT"
  ].filter(Boolean).join("\r\n");
}
function downloadICS(){
  const p=getPlan();
  const now=new Date();
  const dailyBase=new Date(now);
  dailyBase.setDate(now.getDate()+1);

  const events=[];

  // Routine = Punkt-Erinnerungen, kein sichtbarer Block
  [
    ["Qomplete Meal #1",p.timeMeal1],
    ["Mahlzeit 1",p.timeFood1],
    ["QORE trinken",p.timeQore],
    ["Spaziergang starten",p.timeWalk],
    ["Mahlzeit 2",p.timeFood2],
    ["Qomplete Meal #2",p.timeMeal2]
  ].forEach(([title,time])=>{
    if(time) events.push(pointEventICS(title,dateWithTime(dailyBase,time),"FREQ=DAILY;COUNT=90",10));
  });

  // Training = echter Termin mit Dauer
  Object.entries(p.training).forEach(([k,v])=>{
    if(v.on&&v.time) events.push(durationEventICS("Krafttraining",dateWithTime(nextDateFor(k),v.time),75,"FREQ=WEEKLY;COUNT=13",30));
  });

  // Mounjaro = Punkt-Erinnerung
  if(p.mounjaroTime) events.push(pointEventICS("Mounjaro",dateWithTime(nextDateFor(p.mounjaroDay),p.mounjaroTime),"FREQ=WEEKLY;COUNT=13",60));

  // Wochenreview = kurzer Termin
  if(p.reviewTime) events.push(durationEventICS("Wochenreview",dateWithTime(nextDateFor(p.reviewDay),p.reviewTime),20,"FREQ=WEEKLY;COUNT=13",15));

  const ics=[
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Max Qomplete Dashboard//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR"
  ].join("\r\n");

  const blob=new Blob([ics],{type:"text/calendar;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="max_qomplete_routinen_mit_erinnerungen.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function exportBackup(){
  const data={
    version:"6",
    exportedAt:new Date().toISOString(),
    logs:JSON.parse(localStorage.getItem("qomplete_logs")||"[]"),
    plan:JSON.parse(localStorage.getItem("q_plan")||JSON.stringify(defaultPlan)),
    startDate:localStorage.getItem(GOALS.startDateKey),
    challenge:JSON.parse(localStorage.getItem("q_challenge")||"null"),
    checks:Object.keys(localStorage).filter(k=>k.startsWith("q_checks_")).reduce((acc,k)=>{acc[k]=JSON.parse(localStorage.getItem(k)||"{}");return acc;},{})
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="max_qomplete_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}
function importBackupFile(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(data.logs) localStorage.setItem("qomplete_logs",JSON.stringify(data.logs));
      if(data.plan) localStorage.setItem("q_plan",JSON.stringify(data.plan));
      if(data.startDate) localStorage.setItem(GOALS.startDateKey,data.startDate);
      if(data.challenge) localStorage.setItem("q_challenge",JSON.stringify(data.challenge));
      if(data.checks) Object.entries(data.checks).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));
      loadPlannerToInputs();
      render();
      alert("Backup importiert.");
    }catch(e){
      alert("Import fehlgeschlagen. Datei passt nicht.");
    }
  };
  reader.readAsText(file);
}

document.getElementById("saveMorningBtn").addEventListener("click",()=>{const date=document.getElementById("date").value||todayISO();const weight=parseFloat(document.getElementById("weight").value);const moodMorning=parseInt(document.getElementById("moodMorning").value)||null;if(!date||!weight){alert("Datum und Gewicht müssen rein.");return}upsert(date,{weight,moodMorning});const checks=getChecks();checks["Wiegen"]=true;setChecks(checks);document.getElementById("weight").value="";document.getElementById("moodMorning").value="";render()});
document.getElementById("saveEveningBtn").addEventListener("click",()=>{const date=document.getElementById("date").value||todayISO();const steps=parseInt(document.getElementById("steps").value)||null;const water=parseFloat(document.getElementById("water").value)||null;const moodEvening=parseInt(document.getElementById("moodEvening").value)||null;upsert(date,{steps,water,moodEvening});document.getElementById("steps").value="";document.getElementById("water").value="";document.getElementById("moodEvening").value="";render()});
document.getElementById("badDayBtn").addEventListener("click",()=>{badDay=!badDay;document.getElementById("badDayBtn").textContent=badDay?"Normaler Tag":"Schlechter Tag";renderMission();renderScore()});
document.getElementById("calendarBtn").addEventListener("click",()=>window.open("https://calendar.google.com/calendar/u/0/r","_blank"));
document.getElementById("icsBtn").addEventListener("click",downloadICS);
document.getElementById("exportBtn").addEventListener("click",exportBackup);
document.getElementById("importBtn").addEventListener("click",()=>document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change",e=>{
  if(e.target.files && e.target.files[0]) importBackupFile(e.target.files[0]);
});
document.getElementById("savePlanBtn").addEventListener("click",()=>{savePlanObj(readPlanFromInputs());render();alert("Plan gespeichert. Mit Kalenderdatei kannst du ihn jetzt exportieren.")});
document.getElementById("startChallengeBtn").addEventListener("click",startChallenge);
document.getElementById("resetChallengeBtn").addEventListener("click",resetChallenge);
document.getElementById("deleteAllBtn").addEventListener("click",deleteAllData);
initPlanner();loadPlannerToInputs();loadChallengeInputs();render();
