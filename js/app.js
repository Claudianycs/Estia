(() => {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const S={map:null,marker:null,circle:null,pos:null,itag:null,port:null,reader:null,reading:false,hold:null,tick:null};
const els={itagState:$("#itagState"),espState:$("#espState"),itagName:$("#itagName"),itagId:$("#itagId"),espDetail:$("#espDetail"),log:$("#serialLog"),lat:$("#lat"),lng:$("#lng"),acc:$("#acc"),mapSource:$("#mapSource"),toast:$("#toast"),global:$("#globalStatus"),baud:$("#baud"),message:$("#message"),wa:$("#whatsapp"),include:$("#includeLocation"),sendEsp:$("#sendEsp"),history:$("#historyList"),overlay:$("#holdOverlay"),count:$("#count")};
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
function toast(m){els.toast.textContent=m;els.toast.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>els.toast.classList.remove("show"),2800)}
function nav(){ $$(".nav button").forEach(b=>b.onclick=()=>{$$(".nav button").forEach(x=>x.classList.toggle("active",x===b));$$(".page").forEach(p=>p.classList.toggle("active",p.id===b.dataset.page));if(b.dataset.page==="inicio"&&S.map)setTimeout(()=>S.map.invalidateSize(),80)})}
function mapInit(){if(!window.L)return;S.map=L.map("map",{zoomControl:false}).setView([-14.235,-51.9253],4);L.control.zoom({position:"bottomright"}).addTo(S.map);L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap"}).addTo(S.map)}
function setPos(p,source="Celular"){let {latitude,longitude,accuracy}=p.coords;S.pos={latitude,longitude,accuracy,timestamp:Date.now()};els.lat.textContent=latitude.toFixed(6);els.lng.textContent=longitude.toFixed(6);els.acc.textContent=Math.round(accuracy)+" m";els.mapSource.textContent="Fonte da posição: "+source+".";if(S.map){let ll=[latitude,longitude];if(!S.marker){S.marker=L.marker(ll).addTo(S.map).bindPopup("Localização atual");S.circle=L.circle(ll,{radius:accuracy,weight:1,fillOpacity:.08}).addTo(S.map)}else{S.marker.setLatLng(ll);S.circle.setLatLng(ll).setRadius(accuracy)}S.map.setView(ll,16)}}
function locate(){if(!navigator.geolocation)return toast("Geolocalização indisponível.");navigator.geolocation.getCurrentPosition(p=>setPos(p,"GPS/localização do celular"),e=>toast("Não foi possível obter a localização: "+e.message),{enableHighAccuracy:true,timeout:15000,maximumAge:3000})}
async function connectItag(){
 if(S.itag?.gatt?.connected){S.itag.gatt.disconnect();return}
 if(!navigator.bluetooth)return toast("Web Bluetooth não está disponível neste navegador.");
 try{
   const device=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:["battery_service","device_information"]});
   S.itag=device; els.itagName.textContent=device.name||"Dispositivo BLE"; els.itagId.textContent=device.id||"ID protegido";
   device.addEventListener("gattserverdisconnected",()=>itagUI(false));
   const server=await device.gatt.connect(); itagUI(true); toast("Dispositivo Bluetooth conectado.");
   try{const svc=await server.getPrimaryService("battery_service");const ch=await svc.getCharacteristic("battery_level");const v=await ch.readValue();toast("Conectado. Bateria: "+v.getUint8(0)+"%")}catch{}
 }catch(e){if(e.name!=="NotFoundError")toast("Falha no Bluetooth: "+e.message)}
}
function itagUI(on){els.itagState.textContent=on?"Bluetooth conectado":"Não conectado";$("#connectItag").textContent=$("#itagPanelConnect").textContent=on?"Desconectar iTag":"Procurar iTag por Bluetooth";updateGlobal()}
async function connectEsp(){
 if(S.port){await disconnectEsp();return}
 if(!("serial" in navigator))return toast("Web Serial não está disponível neste navegador.");
 try{S.port=await navigator.serial.requestPort();await S.port.open({baudRate:+els.baud.value||115200});S.reading=true;espUI(true);readLoop();await serialSend({type:"hello",app:"Estia",timestamp:new Date().toISOString()});toast("ESP32-C3 Mini conectado.")}catch(e){if(e.name!=="NotFoundError")toast("Falha USB: "+e.message);S.port=null;espUI(false)}
}
async function disconnectEsp(){S.reading=false;try{if(S.reader){await S.reader.cancel();S.reader.releaseLock();S.reader=null}if(S.port)await S.port.close()}catch{}S.port=null;espUI(false);toast("ESP32 desconectado.")}
function espUI(on){els.espState.textContent=on?"USB conectado":"Não conectado";els.espDetail.textContent=on?`Conectado a ${els.baud.value} baud`:"Desconectado";$("#connectEsp").textContent=$("#espPanelConnect").textContent=on?"Desconectar":"Conectar";updateGlobal()}
function updateGlobal(){let n=(S.itag?.gatt?.connected?1:0)+(S.port?1:0);els.global.textContent=n?`${n} conectado${n>1?"s":""}`:"Pronta"}
async function serialSend(obj){if(!S.port?.writable)return false;const w=S.port.writable.getWriter();try{await w.write(new TextEncoder().encode(JSON.stringify(obj)+"\n"));return true}finally{w.releaseLock()}}
async function readLoop(){if(!S.port?.readable)return;const dec=new TextDecoderStream();S.port.readable.pipeTo(dec.writable).catch(()=>{});S.reader=dec.readable.getReader();let buf="";try{while(S.reading){let {value,done}=await S.reader.read();if(done)break;buf+=value;let lines=buf.split("\n");buf=lines.pop()||"";for(const line of lines)handleSerial(line.trim())}}catch(e){if(S.reading)toast("Leitura serial interrompida.")}finally{try{S.reader?.releaseLock()}catch{}S.reader=null}}
function handleSerial(line){if(!line)return;els.log.textContent=(line+"\n"+els.log.textContent).slice(0,5000);try{let d=JSON.parse(line);if(d.type==="location"&&isFinite(d.latitude)&&isFinite(d.longitude))setPos({coords:{latitude:+d.latitude,longitude:+d.longitude,accuracy:+d.accuracy||20}},"ESP32 / GPS externo");if(d.type==="help"||d.event==="help")alertNow("Botão físico ESP32")}catch{}}
function alertText(){let m=els.message.value.trim()||"Preciso de ajuda.";if(els.include.checked&&S.pos){let {latitude,longitude}=S.pos;m+=`\n\nLocalização: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\nhttps://www.google.com/maps?q=${latitude},${longitude}`}return m}
function saveHistory(origin,status){let h=store.get("estia.history",[]);h.unshift({time:new Date().toISOString(),origin,status,lat:S.pos?.latitude??null,lng:S.pos?.longitude??null});store.set("estia.history",h.slice(0,100));renderHistory()}
async function alertNow(origin="Aplicação"){
 if(els.include.checked&&!S.pos){locate();await new Promise(r=>setTimeout(r,1400))}
 let msg=alertText(), sent=false;
 if(els.sendEsp.checked&&S.port)sent=await serialSend({type:"alert",message:els.message.value.trim(),latitude:S.pos?.latitude??null,longitude:S.pos?.longitude??null,whatsapp:els.wa.value.replace(/\D/g,""),timestamp:new Date().toISOString()});
 let phone=els.wa.value.replace(/\D/g,""); let url=`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
 if(phone)window.open(url,"_blank","noopener"); else toast("Informe o WhatsApp do contato.");
 saveHistory(origin,sent?"Comando enviado ao ESP32":"Alerta criado"); 
}
function renderHistory(){let h=store.get("estia.history",[]);els.history.innerHTML=h.length?h.map(x=>`<article class="history-item"><b>Pedido de ajuda</b><small>${new Date(x.time).toLocaleString("pt-BR")} · ${esc(x.origin)}</small><p>${x.lat!=null?`${(+x.lat).toFixed(5)}, ${(+x.lng).toFixed(5)}`:"Sem localização"} · ${esc(x.status)}</p></article>`).join(""):`<div class="empty">Nenhum pedido de ajuda registrado.</div>`}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function startHold(e){e.preventDefault();if(S.hold)return;let n=2;els.count.textContent=n;els.overlay.classList.remove("hidden");S.tick=setInterval(()=>{n--;els.count.textContent=Math.max(0,n)},1000);S.hold=setTimeout(()=>{stopHold(false);alertNow("Botão SOS")},2000)}
function stopHold(cancel=true){clearTimeout(S.hold);clearInterval(S.tick);S.hold=S.tick=null;els.overlay.classList.add("hidden");if(cancel)toast("Alerta cancelado.")}
function init(){
 nav();mapInit();renderHistory();
 $("#locate").onclick=locate;
 $("#connectItag").onclick=$("#itagPanelConnect").onclick=connectItag;
 $("#connectEsp").onclick=$("#espPanelConnect").onclick=connectEsp;
 $("#testAlert").onclick=()=>alertNow("Teste manual");
 $("#clearHistory").onclick=()=>{if(confirm("Limpar histórico?")){store.set("estia.history",[]);renderHistory()}};
 $("#sos").addEventListener("pointerdown",startHold);["pointerup","pointerleave","pointercancel"].forEach(ev=>$("#sos").addEventListener(ev,()=>S.hold&&stopHold(true)));
 let cfg=store.get("estia.cfg",{}); if(cfg.wa)els.wa.value=cfg.wa;if(cfg.message)els.message.value=cfg.message;
 [els.wa,els.message].forEach(x=>x.addEventListener("change",()=>store.set("estia.cfg",{wa:els.wa.value,message:els.message.value})));
}
document.addEventListener("DOMContentLoaded",init);
})();