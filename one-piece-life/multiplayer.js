/* ============================================================
   ONE PIECE LIFE — MULTIJOUEUR (1 à 4 joueurs, pair-à-pair)
   Repose sur window.OPL (export explicite de game.js) et sur
   PeerJS (WebRTC) pour la connexion directe entre appareils.
   Aucun serveur de jeu : l'hôte fait autorité sur le round en
   cours, chaque joueur résout son année en privé (mêmes écrans
   que le solo), puis les rencontres sur une île commune sont
   arbitrées par l'hôte.
============================================================ */
(() => {
"use strict";

const ROOM_PREFIX = "opl6-";
const MAX_PLAYERS = 4;
const ENCOUNTER_TIMEOUT_MS = 25000;

const mp = {
  active: false,
  isHost: false,
  peer: null,
  conns: {},              // hôte: peerId -> DataConnection ; invité: { host: DataConnection }
  selfId: null,
  roomCode: null,
  players: {},            // id -> snapshot public du joueur
  year: 0,
  phase: "idle",          // idle | lobby | creating | round_wait_ready | round_resolving | round_encounter
  pendingEncounters: {},
  encounterSeq: 0
};

/* ================= TRANSPORT (isolé pour permettre un test avec mock) ================= */

const transport = {
  sendToPeer(id, msg){
    if(mp.isHost){
      const c = mp.conns[id];
      if(c && c.open) c.send(msg);
    } else if(mp.conns.host && mp.conns.host.open){
      mp.conns.host.send(msg);
    }
  },
  broadcastFromHost(msg){
    Object.keys(mp.conns).forEach(id=>{
      const c = mp.conns[id];
      if(c && c.open) c.send(msg);
    });
  }
};

/* ================= HELPERS ================= */

function mpToast(msg){
  const t = document.getElementById("toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(mpToast._t);
  mpToast._t = setTimeout(()=> t.classList.remove("show"), 2200);
}

function genRoomCode(){
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for(let i=0;i<5;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

function mkEmptyPlayer(id, isHostPlayer){
  return {
    id, name:"", age:null, alive:true, island:null, stage:0, path:"civil",
    health:100, beli:0, bounty:0, power:0,
    ready:false, resolved:false, connected:true, born:false, isHost:!!isHostPlayer
  };
}

function buildSnapshot(){
  const s = window.OPL.getState();
  return {
    name: s.name, age: s.age, alive: s.alive, island: s.island, stage: s.stage,
    path: s.path, health: Math.round(s.health), beli: Math.round(s.beli),
    bounty: Math.round(s.bounty||0), power: window.OPL.powerScore()
  };
}

function activePlayers(){
  return Object.values(mp.players).filter(p=>p.connected && p.alive!==false);
}

/* ================= LOGIQUE DE ROUND (hôte, pure — testable via mock transport) ================= */

function hostHandle(fromId, msg){
  if(msg.type==="join"){
    mp.players[fromId] = mkEmptyPlayer(fromId, fromId===mp.selfId);
    hostBroadcastAndApplyLocally({ type:"roster", players: mp.players, phase: mp.phase });
    return;
  }
  const p = mp.players[fromId];
  if(!p) return;

  if(msg.type==="snapshot"){
    Object.assign(p, {
      name: msg.name, age: msg.age, alive: msg.alive, island: msg.island, stage: msg.stage,
      path: msg.path, health: msg.health, beli: msg.beli, bounty: msg.bounty, power: msg.power
    });
    if(msg.born) p.born = true;
    if(mp.phase==="creating"){
      const active = Object.values(mp.players).filter(pl=>pl.connected);
      if(active.length>0 && active.every(pl=>pl.born)){
        mp.phase = "round_wait_ready";
        mp.year = 1;
        hostBroadcastAndApplyLocally({ type:"roster", players: mp.players, phase: mp.phase });
        hostBroadcastAndApplyLocally({ type:"round_open", year: mp.year });
      } else {
        hostBroadcastAndApplyLocally({ type:"roster", players: mp.players, phase: mp.phase });
      }
    } else if(mp.phase==="round_resolving"){
      p.resolved = true;
      hostBroadcastAndApplyLocally({ type:"roster", players: mp.players, phase: mp.phase });
      checkAllResolved();
    } else {
      hostBroadcastAndApplyLocally({ type:"roster", players: mp.players, phase: mp.phase });
    }
    return;
  }

  if(msg.type==="ready"){
    if(mp.phase!=="round_wait_ready" || msg.year!==mp.year) return;
    p.ready = true;
    hostBroadcastAndApplyLocally({ type:"roster", players: mp.players, phase: mp.phase });
    checkAllReady();
    return;
  }

  if(msg.type==="encounter_choice"){
    const enc = mp.pendingEncounters[msg.encounterId];
    if(!enc) return;
    enc.choices[fromId] = msg.choice;
    if(enc.choices[enc.a] && enc.choices[enc.b]) resolveEncounter(msg.encounterId);
    return;
  }

  if(msg.type==="leave"){
    p.connected = false;
    hostBroadcastAndApplyLocally({ type:"roster", players: mp.players, phase: mp.phase });
    if(mp.phase==="round_wait_ready") checkAllReady();
    else if(mp.phase==="round_resolving") checkAllResolved();
    return;
  }
}

function checkAllReady(){
  const active = activePlayers();
  if(active.length===0 || !active.every(p=>p.ready)) return;
  mp.phase = "round_resolving";
  active.forEach(p=>{ p.resolved = false; });
  hostBroadcastAndApplyLocally({ type:"advance", year: mp.year });
}

function checkAllResolved(){
  const active = activePlayers();
  if(active.length===0 || !active.every(p=>p.resolved)) return;
  detectAndStartEncounters();
}

function detectAndStartEncounters(){
  const active = activePlayers();
  const byIsland = {};
  active.forEach(p=>{
    if(!p.island) return;
    (byIsland[p.island] = byIsland[p.island] || []).push(p.id);
  });
  const pairs = [];
  Object.values(byIsland).forEach(ids=>{
    for(let i=0; i+1<ids.length; i+=2) pairs.push([ids[i], ids[i+1]]);
  });
  if(pairs.length===0){ finalizeRound(); return; }
  mp.phase = "round_encounter";
  pairs.forEach(([a,b])=>{
    const id = "enc" + (mp.encounterSeq++);
    mp.pendingEncounters[id] = { a, b, choices:{} };
    const pa = mp.players[a], pb = mp.players[b];
    hostSendTo(a, { type:"encounter_prompt", encounterId:id, other:{ id:b, name:pb.name, island:pb.island, power:pb.power } });
    hostSendTo(b, { type:"encounter_prompt", encounterId:id, other:{ id:a, name:pa.name, island:pa.island, power:pa.power } });
    setTimeout(()=>{ if(mp.pendingEncounters[id]) resolveEncounter(id); }, ENCOUNTER_TIMEOUT_MS);
  });
}

function resolveEncounter(id){
  const enc = mp.pendingEncounters[id];
  if(!enc) return;
  const ca = enc.choices[enc.a] || "ignore";
  const cb = enc.choices[enc.b] || "ignore";
  const pa = mp.players[enc.a], pb = mp.players[enc.b];
  let result;
  if(ca==="fight" && cb==="fight") result = resolveDuel(pa, pb);
  else if(ca==="team" && cb==="team") result = resolveCoop(pa, pb);
  else result = resolveIgnore(pa, pb);

  hostSendTo(enc.a, Object.assign({ type:"encounter_result", encounterId:id }, result.forA));
  hostSendTo(enc.b, Object.assign({ type:"encounter_result", encounterId:id }, result.forB));
  delete mp.pendingEncounters[id];
  if(Object.keys(mp.pendingEncounters).length===0) finalizeRound();
}

function resolveDuel(pa, pb){
  const rand = window.OPL.rand, fmt = window.OPL.fmt;
  const powA = Math.max(1, pa.power), powB = Math.max(1, pb.power);
  let chanceA = powA / (powA + powB);
  chanceA = Math.min(0.85, Math.max(0.15, chanceA));
  const aWins = Math.random() < chanceA;
  const gain = rand(500,2000);
  const dmg = rand(12,28);
  return {
    forA: {
      outcome: aWins ? "win" : "lose",
      text: aWins
        ? `Tu affrontes ${pb.name} en duel amical et l'emportes ! Tu rafles ${fmt(gain)} Beli.`
        : `Tu affrontes ${pb.name} en duel amical et te fais battre. Tu perds ${dmg} PV.`,
      deltas: aWins ? { beli: gain } : { health: -dmg }
    },
    forB: {
      outcome: aWins ? "lose" : "win",
      text: aWins
        ? `${pa.name} t'affronte en duel amical et te bat. Tu perds ${dmg} PV.`
        : `${pa.name} t'affronte en duel amical... et c'est toi qui l'emportes ! Tu rafles ${fmt(gain)} Beli.`,
      deltas: aWins ? { health: -dmg } : { beli: gain }
    }
  };
}

function resolveCoop(pa, pb){
  const rand = window.OPL.rand, fmt = window.OPL.fmt;
  const combined = Math.max(1, pa.power + pb.power);
  const threat = rand(Math.round(combined*0.5), Math.round(combined*0.9));
  const successChance = Math.min(0.9, Math.max(0.35, combined/(combined+threat)));
  const success = Math.random() < successChance;
  const gain = rand(400,1200);
  const dmg = rand(8,18);
  const textFor = (otherName)=> success
    ? `Vous faites équipe avec ${otherName} contre une menace locale et triomphez ensemble ! +${fmt(gain)} Beli.`
    : `Vous faites équipe avec ${otherName}, mais la menace était trop forte. Vous repartez blessés (-${dmg} PV).`;
  const deltas = success ? { beli: gain } : { health: -dmg };
  return {
    forA: { outcome: success?"win":"lose", text: textFor(pb.name), deltas },
    forB: { outcome: success?"win":"lose", text: textFor(pa.name), deltas }
  };
}

function resolveIgnore(pa, pb){
  return {
    forA: { outcome:"ignore", text:`Tu croises ${pb.name} à ${pa.island}, mais vos routes ne se croisent pas vraiment cette fois.`, deltas:{} },
    forB: { outcome:"ignore", text:`Tu croises ${pa.name} à ${pb.island}, mais vos routes ne se croisent pas vraiment cette fois.`, deltas:{} }
  };
}

function finalizeRound(){
  mp.year += 1;
  Object.values(mp.players).forEach(p=>{ p.ready = false; p.resolved = false; });
  mp.phase = "round_wait_ready";
  hostBroadcastAndApplyLocally({ type:"roster", players: mp.players, phase: mp.phase });
  hostBroadcastAndApplyLocally({ type:"round_open", year: mp.year });
}

function hostSendTo(id, msg){
  const full = Object.assign({ forId: id }, msg);
  if(id===mp.selfId) clientApply(full);
  else transport.sendToPeer(id, full);
}

function hostBroadcastAndApplyLocally(msg){
  transport.broadcastFromHost(msg);
  clientApply(msg);
}

function sendToHost(msg){
  transport.sendToPeer("host", msg);
}

/* ================= RÉACTION CÔTÉ CLIENT (hôte-en-tant-que-joueur ET invités) ================= */

function clientApply(msg){
  switch(msg.type){
    case "roster": {
      mp.players = msg.players;
      if(msg.phase) mp.phase = msg.phase;
      renderLobbyIfOpen();
      renderPartyBar();
      updateAgeButtonLabel();
      break;
    }
    case "game_start": {
      mp.phase = "creating";
      window.OPL.closeModal();
      const backBtn = document.getElementById("btnBackTitle");
      if(backBtn) backBtn.hidden = true;
      window.OPL.renderCreateScreen();
      window.OPL.showScreen("screen-create");
      break;
    }
    case "round_open": {
      mp.phase = "round_wait_ready";
      mp.year = msg.year;
      if(mp.players[mp.selfId]) mp.players[mp.selfId].ready = false;
      updateAgeButtonLabel();
      break;
    }
    case "advance": {
      mp.phase = "round_resolving";
      updateAgeButtonLabel();
      window.OPL.ageUp();
      break;
    }
    case "encounter_prompt": {
      if(msg.forId && msg.forId!==mp.selfId) break;
      showEncounterModal(msg);
      break;
    }
    case "encounter_result": {
      if(msg.forId && msg.forId!==mp.selfId) break;
      applyEncounterResult(msg);
      break;
    }
    case "room_full": {
      mpToast("Cette partie est déjà complète (4 joueurs max).");
      deactivateMultiplayer();
      break;
    }
    case "game_in_progress": {
      mpToast("Cette partie a déjà commencé.");
      deactivateMultiplayer();
      break;
    }
    case "host_left": {
      mpToast("L'hôte a quitté la partie. Tu continues en solo.");
      deactivateMultiplayer();
      break;
    }
  }
}

function applyEncounterResult(msg){
  const s = window.OPL.getState();
  if(msg.deltas){
    if(msg.deltas.beli) s.beli = Math.max(0, s.beli + msg.deltas.beli);
    if(msg.deltas.health) s.health = Math.max(0, Math.min(100, s.health + msg.deltas.health));
  }
  window.OPL.addLog(msg.text, msg.outcome==="win" ? "good" : (msg.outcome==="lose" ? "bad" : "neutral"));
  if(s.alive && s.health<=0 && msg.outcome==="lose"){
    window.OPL.death("battle");
  }
  window.OPL.save();
  window.OPL.renderGame(true);
}

/* ================= ÉTAT LOCAL : ready / snapshot ================= */

function markReady(){
  const msg = { type:"ready", year: mp.year };
  if(mp.isHost) hostHandle(mp.selfId, msg);
  else sendToHost(msg);
  if(mp.players[mp.selfId]) mp.players[mp.selfId].ready = true;
  updateAgeButtonLabel();
}

function sendSnapshot(extra){
  const msg = Object.assign({ type:"snapshot" }, buildSnapshot(), extra||{});
  if(mp.isHost) hostHandle(mp.selfId, msg);
  else sendToHost(msg);
}

/* ================= UI : bouton Vieillir ================= */

function updateAgeButtonLabel(){
  const btn = document.getElementById("btnAge");
  if(!btn) return;
  const span = btn.querySelector("span");
  if(!span) return;
  if(!mp.active){ span.textContent = "Vieillir"; return; }
  if(mp.phase==="round_wait_ready"){
    const active = activePlayers();
    const readyCount = active.filter(p=>p.ready).length;
    const me = mp.players[mp.selfId];
    span.textContent = (me && me.ready) ? `En attente (${readyCount}/${active.length})` : `Prêt (${readyCount}/${active.length})`;
  } else if(mp.phase==="creating" || mp.phase==="lobby"){
    span.textContent = "Vieillir";
  } else {
    span.textContent = "En cours...";
  }
}

/* ================= UI : barre de groupe ================= */

function renderPartyBar(){
  if(!mp.active) return;
  const gameScreen = document.getElementById("screen-game");
  if(!gameScreen) return;
  let bar = document.getElementById("mpPartyBar");
  if(!bar){
    bar = document.createElement("div");
    bar.id = "mpPartyBar";
    bar.className = "mp-party-bar";
    const logEl = document.getElementById("log");
    gameScreen.insertBefore(bar, logEl || null);
  }
  const ids = Object.keys(mp.players);
  bar.innerHTML = ids.map(id=>{
    const p = mp.players[id];
    const me = id===mp.selfId;
    const dead = p.alive===false;
    const off = !p.connected;
    return `<div class="mp-chip ${me?"me":""} ${dead?"dead":""} ${off?"offline":""}">
      <span class="mp-chip-name">${me?"👤 ":""}${p.name || "…"}</span>
      <span class="mp-chip-meta">${p.age!=null ? ("Âge "+p.age) : "création..."}${p.island ? (" · "+p.island) : ""}</span>
    </div>`;
  }).join("");
}

/* ================= UI : rencontre sur une île commune ================= */

function showEncounterModal(msg){
  const other = msg.other;
  const html = `
    <p class="modal-intro">Tu croises <b>${other.name}</b> à ${other.island} !</p>
    <div class="action-row" data-enc="fight">
      <div><div class="a-label">⚔️ Combattre</div><div class="a-sub">Duel amical — un·e gagnant·e, un·e perdant·e</div></div>
      <div class="a-val">→</div>
    </div>
    <div class="action-row" data-enc="team">
      <div><div class="a-label">🤝 Faire équipe</div><div class="a-sub">Affrontez ensemble une menace locale</div></div>
      <div class="a-val">→</div>
    </div>
    <div class="action-row" data-enc="ignore">
      <div><div class="a-label">🚶 Chacun son chemin</div><div class="a-sub">Vous vous croisez sans plus</div></div>
      <div class="a-val">→</div>
    </div>`;
  window.OPL.openModal("Rencontre !", html);
  document.querySelectorAll("[data-enc]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const choice = el.dataset.enc;
      window.OPL.closeModal();
      mpToast("En attente de la décision de l'autre joueur...");
      const out = { type:"encounter_choice", encounterId: msg.encounterId, choice };
      if(mp.isHost) hostHandle(mp.selfId, out);
      else sendToHost(out);
    });
  });
}

/* ================= UI : salle d'attente (lobby) ================= */

function renderLobbyIfOpen(){
  if(mp.phase!=="lobby") return;
  renderLobbyModal();
}

function renderLobbyModal(){
  const ids = Object.keys(mp.players);
  const rows = ids.map(id=>{
    const p = mp.players[id];
    return `<div class="mp-lobby-row"><span>${id===mp.selfId ? "👤 " : "🧑 "}${p.name || (p.isHost ? "Hôte" : "Joueur")}${id===mp.selfId ? " (toi)" : ""}</span><span>${p.connected ? "✅" : "❌"}</span></div>`;
  }).join("");
  const canStart = mp.isHost && ids.length>=1 && ids.length<=MAX_PLAYERS;
  const html = `
    <p class="modal-intro">Code de partie : <b class="mp-room-code">${mp.roomCode}</b>${mp.isHost ? ' <button id="mpCopyCode" class="btn btn-chip" type="button">Copier</button>' : ""}</p>
    <div class="mp-lobby-list">${rows || '<p class="modal-intro">En attente de joueurs...</p>'}</div>
    ${mp.isHost
      ? `<button id="mpStartGame" class="btn btn-primary btn-lg" ${canStart?"":"disabled"} style="margin-top:14px;">Lancer la partie (${ids.length}/${MAX_PLAYERS})</button>`
      : `<p class="modal-intro" style="margin-top:14px;">En attente que l'hôte lance la partie...</p>`}
    <button id="mpLeaveLobby" class="btn btn-ghost" style="margin-top:8px;">Quitter</button>`;
  window.OPL.openModal(mp.isHost ? "Salle d'attente (hôte)" : "Salle d'attente", html);
  const copyBtn = document.getElementById("mpCopyCode");
  if(copyBtn) copyBtn.addEventListener("click", ()=>{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(mp.roomCode).then(()=> mpToast("Code copié !")).catch(()=>{});
    }
  });
  const startBtn = document.getElementById("mpStartGame");
  if(startBtn) startBtn.addEventListener("click", ()=>{
    if(startBtn.disabled) return;
    hostStartGame();
  });
  const leaveBtn = document.getElementById("mpLeaveLobby");
  if(leaveBtn) leaveBtn.addEventListener("click", ()=>{
    deactivateMultiplayer();
    window.OPL.closeModal();
  });
}

function hostStartGame(){
  mp.phase = "creating";
  Object.values(mp.players).forEach(p=>{ p.born = false; });
  hostBroadcastAndApplyLocally({ type:"game_start" });
}

/* ================= UI : écran d'entrée ================= */

function showEntryModal(){
  const html = `
    <button id="mpCreateBtn" class="btn btn-primary btn-lg">Créer une partie</button>
    <div class="mp-join-row">
      <input type="text" id="mpJoinCode" maxlength="5" placeholder="Code (5 caractères)">
      <button id="mpJoinBtn" class="btn btn-secondary">Rejoindre</button>
    </div>
    <p class="modal-intro" style="margin-top:10px;font-size:12px;">Jusqu'à 4 joueurs, connexion directe entre vos appareils (pair-à-pair, sans serveur de jeu). Gardez tous l'onglet ouvert pendant la partie.</p>`;
  window.OPL.openModal("Multijoueur", html);
  document.getElementById("mpCreateBtn").addEventListener("click", createRoom);
  document.getElementById("mpJoinBtn").addEventListener("click", ()=>{
    const code = document.getElementById("mpJoinCode").value.trim().toUpperCase();
    if(code.length<3){ mpToast("Entre un code valide."); return; }
    joinRoom(code);
  });
}

/* ================= CONNEXION RÉSEAU (PeerJS) ================= */

function createRoom(){
  if(typeof Peer==="undefined"){ mpToast("Erreur : librairie réseau non chargée."); return; }
  const code = genRoomCode();
  const peerId = ROOM_PREFIX + code;
  window.OPL.openModal("Multijoueur", '<p class="modal-intro">Connexion en cours...</p>');
  const peer = new Peer(peerId, { debug: 0 });
  mp.peer = peer;
  mp.isHost = true;
  mp.roomCode = code;
  mp.conns = {};
  peer.on("open", (id)=>{
    mp.selfId = id;
    mp.active = true;
    mp.phase = "lobby";
    mp.players = {};
    mp.players[id] = mkEmptyPlayer(id, true);
    renderLobbyModal();
  });
  peer.on("connection", setupGuestConnection);
  peer.on("error", (err)=>{
    mpToast("Erreur de connexion : " + (err && err.type ? err.type : "inconnue"));
  });
}

function joinRoom(code){
  if(typeof Peer==="undefined"){ mpToast("Erreur : librairie réseau non chargée."); return; }
  const peerId = ROOM_PREFIX + code;
  window.OPL.openModal("Multijoueur", '<p class="modal-intro">Connexion en cours...</p>');
  const peer = new Peer(undefined, { debug: 0 });
  mp.peer = peer;
  mp.isHost = false;
  mp.roomCode = code;
  mp.conns = {};
  peer.on("open", (id)=>{
    mp.selfId = id;
    const conn = peer.connect(peerId, { reliable:true });
    mp.conns.host = conn;
    conn.on("open", ()=>{
      mp.active = true;
      mp.phase = "lobby";
      mp.players = {};
      mp.players[id] = mkEmptyPlayer(id, false);
      conn.send({ type:"join" });
      renderLobbyModal();
    });
    conn.on("data", (data)=> clientApply(data));
    conn.on("close", ()=>{
      if(mp.active){ mpToast("L'hôte a quitté la partie. Tu continues en solo."); deactivateMultiplayer(); }
    });
    conn.on("error", ()=>{
      mpToast("Connexion perdue avec l'hôte.");
    });
  });
  peer.on("error", (err)=>{
    const reason = err && err.type==="peer-unavailable" ? "code introuvable" : (err && err.type) || "erreur";
    mpToast("Impossible de rejoindre : " + reason);
  });
}

function setupGuestConnection(conn){
  if(mp.phase!=="lobby"){
    conn.on("open", ()=>{ conn.send({ type:"game_in_progress" }); setTimeout(()=>conn.close(), 300); });
    return;
  }
  if(Object.keys(mp.players).length>=MAX_PLAYERS){
    conn.on("open", ()=>{ conn.send({ type:"room_full" }); setTimeout(()=>conn.close(), 300); });
    return;
  }
  mp.conns[conn.peer] = conn;
  conn.on("data", (data)=>{
    if(data.type==="join") hostHandle(conn.peer, { type:"join" });
    else hostHandle(conn.peer, data);
  });
  conn.on("close", ()=>{
    hostHandle(conn.peer, { type:"leave" });
    delete mp.conns[conn.peer];
  });
}

function deactivateMultiplayer(){
  mp.active = false;
  mp.phase = "idle";
  try{ if(mp.peer) mp.peer.destroy(); }catch(e){}
  mp.peer = null;
  mp.conns = {};
  mp.players = {};
  const bar = document.getElementById("mpPartyBar");
  if(bar) bar.remove();
  const backBtn = document.getElementById("btnBackTitle");
  if(backBtn) backBtn.hidden = false;
  updateAgeButtonLabel();
}

/* ================= HOOKS game.js ================= */

function wireHooks(){
  window.OPL._onAgeClick = function(){
    if(!mp.active) return false;
    if(mp.phase!=="round_wait_ready") return true;
    const s = window.OPL.getState();
    if(!s.alive) return true;
    const me = mp.players[mp.selfId];
    if(me && me.ready) return true;
    markReady();
    return true;
  };
  window.OPL._afterYearResolved = function(){
    if(!mp.active) return;
    sendSnapshot();
  };
  window.OPL._afterBirth = function(){
    if(!mp.active) return;
    sendSnapshot({ born:true });
  };
  window.OPL._afterRender = function(){
    if(!mp.active) return;
    renderPartyBar();
    updateAgeButtonLabel();
  };
}

/* ================= INIT ================= */

function init(){
  wireHooks();
  const btn = document.getElementById("btnMultiplayer");
  if(btn) btn.addEventListener("click", showEntryModal);
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Surface de test (mock du transport réseau) — voir scratchpad/test-mp-logic.js
window.__OPL_MP_TEST__ = { mp, transport, hostHandle, clientApply, buildSnapshot, mkEmptyPlayer };

})();
