// === Config ===
const SHEET_ID = '1R3KRlvqYgrnxW2nXB4U5KOY379R54uHohpU-JCO300M';
const SHEET_NAME = 'registros';
const CALENDAR_ID = 'primary';

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.clear();
    sh.getRange(1,1,1,headers_().length).setValues([headers_()]);
  }
  return sh;
}

function toRow_(registro, id) {
  const parto = registro.fechaPartoEstimada || '';
  return [ id, registro.madre||'', registro.padre||'', registro.raza||'', registro.fechaMonta||'', Number(registro.diasGestacion||65), parto, registro.camadaEstimada||'', registro.notas||'', registro.estado||'pendiente', '' ];
}

function headers_(){ return ['id','madre','padre','raza','fechaMonta','diasGestacion','fechaPartoEstimada','camadaEstimada','notas','estado','calendarEventId']; }
function ensureHeader_(){ const sh=getSheet_(); const w=headers_().length; const r=sh.getRange(1,1,1,w).getValues()[0]; if(r[0]!=='id'){ sh.getRange(1,1,1,w).setValues([headers_()]); } }
function generateId_(){ return Utilities.getUuid(); }

function upsertCalendarEvent_(row) {
  const [id, madre, padre, raza, fechaMonta, diasGestacion, fechaPartoEstimada, camada, notas, estado, calendarEventId] = row;
  if (!fechaPartoEstimada) return null;
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  const title = `Parto estimado: ${madre} (${raza || 'Gata'})`;
  const desc = `Stoacat\nMadre: ${madre}\nPadre: ${padre}\nMonta: ${fechaMonta}\nNotas: ${notas || ''}\nEstado: ${estado}`;
  let event;
  const start = new Date(fechaPartoEstimada + 'T08:00:00');
  const end = new Date(fechaPartoEstimada + 'T09:00:00');
  if (calendarEventId) {
    try { event = cal.getEventById(calendarEventId); } catch(e) {}
    if (event) { event.setTitle(title); event.setDescription(desc); event.setTime(start, end); }
  }
  if (!event) {
    event = cal.createEvent(title, start, end, { description: desc });
    event.addPopupReminder(24*60 * 3);
    event.addPopupReminder(24*60 * 1);
    return event.getId();
  }
  return calendarEventId || null;
}

function doGet(){
  ensureHeader_();
  const sh=getSheet_();
  const data=sh.getRange(2,1,Math.max(0, sh.getLastRow()-1), headers_().length).getValues();
  const rows=data.map(r=>({id:r[0],madre:r[1],padre:r[2],raza:r[3],fechaMonta:r[4],diasGestacion:r[5],fechaPartoEstimada:r[6],camadaEstimada:r[7],notas:r[8],estado:r[9],calendarEventId:r[10]}));
  return ContentService.createTextOutput(JSON.stringify({rows})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  ensureHeader_();
  const body=JSON.parse(e.postData.contents||'{}');
  if(body.action==='add'){
    const id=generateId_();
    const row=toRow_(body.registro||{}, id);
    const sh=getSheet_();
    sh.appendRow(row);
    const saved=sh.getRange(sh.getLastRow(),1,1,headers_().length).getValues()[0];
    const eventId=upsertCalendarEvent_(saved);
    if(eventId){ sh.getRange(sh.getLastRow(), headers_().length, 1, 1).setValue(eventId); }
    return json_({ok:true,id});
  }
  return json_({ok:false,error:'Acción no soportada'}, 400);
}

function json_(obj, code){ const out=ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); if(code){ return {status:code,headers:{},body:out.getContent()}; } return out; }
function dailyCheck(){ ensureHeader_(); const sh=getSheet_(); const data=sh.getRange(2,1,Math.max(0, sh.getLastRow()-1), headers_().length).getValues(); data.forEach((row,i)=>{ const parto=row[6]; if(!parto)return; const ev=upsertCalendarEvent_(row); if(ev && !row[10]){ sh.getRange(2+i, headers_().length, 1, 1).setValue(ev); } }); }
function setupDailyTrigger(){ ScriptApp.newTrigger('dailyCheck').timeBased().everyDays(1).atHour(7).create(); }
