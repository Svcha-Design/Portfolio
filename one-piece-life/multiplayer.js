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
const VOTE_TIMEOUT_MS = 25000;
const CHAT_LOG_MAX = 100;
const REVIVE_TIMEOUT_MS = 30000;

const mp = {
  active: false,
  isHost: false,
  coopVoteMode: false,    // false = mode parallèle (par défaut) ; true = mode équipage (vote de groupe)
  peer: null,
  conns: {},              // hôte: peerId -> DataConnection ; invité: { host: DataConnection }
  selfId: null,
  roomCode: null,
  players: {},            // id -> snapshot public du joueur
  year: 0,
  phase: "idle",          // idle | lobby | creating | round_wait_ready | round_resolving | round_encounter
  pendingEncounters: {},
  encounterSeq: 0,
  pendingVotes: {},
  voteSeq: 0,
  chatLog: [],
  chatUnread: 0,
  pendingRevivals: {},
  reviveSeq: 0
};

let pendingVoteEvent = null; // l'événement (choices avec resolve()) en attente de vote, côté joueur concerné
let chatModalOpen = false;
let skipRevivalHook = false; // évite une boucle quand on rejoue death() après un refus de sauvetage

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

function rosterMsg(){
  return { type:"roster", players: mp.players, phase: mp.phase, coopVoteMode: mp.coopVoteMode };
}

/* ================= LOGIQUE DE ROUND (hôte, pure — testable via mock transport) ================= */

function hostHandle(fromId, msg){
  if(msg.type==="join"){
    mp.players[fromId] = mkEmptyPlayer(fromId, fromId===mp.selfId);
    hostBroadcastAndApplyLocally(rosterMsg());
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
        hostBroadcastAndApplyLocally(rosterMsg());
        hostBroadcastAndApplyLocally({ type:"round_open", year: mp.year });
      } else {
        hostBroadcastAndApplyLocally(rosterMsg());
      }
    } else if(mp.phase==="round_resolving"){
      p.resolved = true;
      hostBroadcastAndApplyLocally(rosterMsg());
      checkAllResolved();
    } else {
      hostBroadcastAndApplyLocally(rosterMsg());
    }
    return;
  }

  if(msg.type==="ready"){
    if(mp.phase!=="round_wait_ready" || msg.year!==mp.year) return;
    p.ready = true;
    hostBroadcastAndApplyLocally(rosterMsg());
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
    hostBroadcastAndApplyLocally(rosterMsg());
    if(mp.phase==="round_wait_ready") checkAllReady();
    else if(mp.phase==="round_resolving") checkAllResolved();
    if(Object.keys(mp.pendingVotes).length) checkVotesForDisconnect();
    return;
  }

  if(msg.type==="vote_request"){
    const seq = mp.voteSeq++;
    mp.pendingVotes[seq] = { forId: msg.forId, forName: msg.forName, choices: msg.choices, votes:{} };
    hostBroadcastAndApplyLocally({ type:"vote_open", seq, forId: msg.forId, forName: msg.forName, title: msg.title, text: msg.text, choices: msg.choices });
    setTimeout(()=>{ if(mp.pendingVotes[seq]) finalizeVote(seq); }, VOTE_TIMEOUT_MS);
    return;
  }

  if(msg.type==="vote_cast"){
    const v = mp.pendingVotes[msg.seq];
    if(!v) return;
    v.votes[fromId] = msg.choice;
    const active = activePlayers();
    if(active.length>0 && active.every(pl=>v.votes[pl.id]!==undefined)) finalizeVote(msg.seq);
    return;
  }

  if(msg.type==="chat_send"){
    const text = String(msg.text||"").slice(0,300).trim();
    if(!text) return;
    const entry = { fromId, fromName: p.name || "Joueur", text, ts: Date.now() };
    hostBroadcastAndApplyLocally({ type:"chat_message", entry });
    return;
  }

  if(msg.type==="revive_request"){
    const seq = mp.reviveSeq++;
    mp.pendingRevivals[seq] = { forId: msg.forId, forName: msg.forName, cause: msg.cause, resolved:false };
    hostBroadcastAndApplyLocally({ type:"revive_open", seq, forId: msg.forId, forName: msg.forName, island: msg.island, cause: msg.cause });
    setTimeout(()=> finalizeRevival(seq, null), REVIVE_TIMEOUT_MS);
    return;
  }

  if(msg.type==="revive_accept"){
    finalizeRevival(msg.seq, fromId);
    return;
  }
}

function finalizeRevival(seq, byId){
  const r = mp.pendingRevivals[seq];
  if(!r || r.resolved) return;
  r.resolved = true;
  delete mp.pendingRevivals[seq];
  const byPlayer = byId ? mp.players[byId] : null;
  hostBroadcastAndApplyLocally({
    type:"revive_result", seq, forId: r.forId, cause: r.cause,
    accepted: !!byPlayer, byName: byPlayer ? byPlayer.name : null,
    syncAge: byPlayer ? byPlayer.age : null
  });
}

function checkVotesForDisconnect(){
  const active = activePlayers();
  Object.keys(mp.pendingVotes).forEach(seq=>{
    const v = mp.pendingVotes[seq];
    if(active.length>0 && active.every(pl=>v.votes[pl.id]!==undefined)) finalizeVote(+seq);
  });
}

function finalizeVote(seq){
  const v = mp.pendingVotes[seq];
  if(!v) return;
  delete mp.pendingVotes[seq];
  const tally = {};
  Object.values(v.votes).forEach(idx=>{ tally[idx] = (tally[idx]||0) + 1; });
  let winner = 0, best = -1;
  Object.keys(tally).forEach(k=>{
    if(tally[k]>best){ best = tally[k]; winner = +k; }
  });
  const tiedCount = Object.values(tally).filter(c=>c===best).length;
  if(tiedCount>1 && v.votes[v.forId]!==undefined){
    winner = v.votes[v.forId];
  }
  hostBroadcastAndApplyLocally({ type:"vote_result", seq, forId:v.forId, forName:v.forName, choice: winner, tally });
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
  hostBroadcastAndApplyLocally(rosterMsg());
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
      if(msg.coopVoteMode!==undefined) mp.coopVoteMode = msg.coopVoteMode;
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
    case "vote_open": {
      showVoteModal(msg);
      break;
    }
    case "vote_result": {
      window.OPL.closeModal();
      if(msg.forId===mp.selfId && pendingVoteEvent){
        const ev = pendingVoteEvent;
        pendingVoteEvent = null;
        const isAsync = ev.choices[msg.choice].resolve(window.OPL.finishAgeUp);
        if(!isAsync) window.OPL.finishAgeUp();
      } else {
        mpToast(`Vote conclu pour ${msg.forName || "un·e camarade"} de l'équipage.`);
      }
      break;
    }
    case "chat_message": {
      mp.chatLog.push(msg.entry);
      if(mp.chatLog.length>CHAT_LOG_MAX) mp.chatLog.shift();
      if(chatModalOpen){
        renderChatMessages();
      } else if(msg.entry.fromId!==mp.selfId){
        mp.chatUnread++;
      }
      renderPartyBar();
      break;
    }
    case "revive_open": {
      if(msg.forId===mp.selfId) break; // on ne se demande pas à soi-même de se sauver
      showRevivalModal(msg);
      break;
    }
    case "revive_result": {
      if(msg.forId===mp.selfId){
        applyRevivalResult(msg);
      } else {
        window.OPL.closeModal();
      }
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
  const chips = ids.map(id=>{
    const p = mp.players[id];
    const me = id===mp.selfId;
    const dead = p.alive===false;
    const off = !p.connected;
    return `<div class="mp-chip ${me?"me":""} ${dead?"dead":""} ${off?"offline":""}">
      <span class="mp-chip-name">${me?"👤 ":""}${p.name || "…"}</span>
      <span class="mp-chip-meta">${p.age!=null ? ("Âge "+p.age) : "création..."}${p.island ? (" · "+p.island) : ""}</span>
    </div>`;
  }).join("");
  const unreadBadge = mp.chatUnread>0 ? `<span class="mp-chat-badge">${mp.chatUnread>9?"9+":mp.chatUnread}</span>` : "";
  bar.innerHTML = chips + `<button id="mpChatBtn" class="mp-chat-btn" type="button">💬${unreadBadge}</button>`;
  const chatBtn = document.getElementById("mpChatBtn");
  if(chatBtn) chatBtn.addEventListener("click", openChatModal);
}

/* ================= UI : rencontre sur une île commune ================= */

/* ================= UI : vote d'équipage (mode Équipage) ================= */

function startVoteForEvent(ev){
  pendingVoteEvent = ev;
  const msg = {
    type:"vote_request", forId: mp.selfId,
    forName: (mp.players[mp.selfId] && mp.players[mp.selfId].name) || "",
    title: ev.title, text: ev.text,
    choices: ev.choices.map(c=>({ label:c.label, sub:c.sub||"" }))
  };
  if(mp.isHost) hostHandle(mp.selfId, msg);
  else sendToHost(msg);
}

function showVoteModal(msg){
  const html = `
    <p class="modal-intro"><b>${msg.forName || "Un·e camarade"}</b> doit décider : ${msg.text}</p>
    ${msg.choices.map((c,i)=>`
      <div class="action-row" data-vote="${i}">
        <div><div class="a-label">${c.label}</div>${c.sub ? `<div class="a-sub">${c.sub}</div>` : ""}</div>
        <div class="a-val">→</div>
      </div>`).join("")}`;
  window.OPL.openModal(`🗳️ Vote de l'équipage — ${msg.title}`, html);
  document.querySelectorAll("[data-vote]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const idx = +el.dataset.vote;
      window.OPL.closeModal();
      mpToast("Vote envoyé, en attente du reste de l'équipage...");
      const out = { type:"vote_cast", seq: msg.seq, choice: idx };
      if(mp.isHost) hostHandle(mp.selfId, out);
      else sendToHost(out);
    });
  });
}

/* ================= UI : chat d'équipage ================= */

function openChatModal(){
  chatModalOpen = true;
  mp.chatUnread = 0;
  renderPartyBar();
  const html = `
    <div id="mpChatMessages" class="mp-chat-messages"></div>
    <div class="mp-chat-input-row">
      <input type="text" id="mpChatInput" maxlength="300" placeholder="Écris un message...">
      <button id="mpChatSendBtn" class="btn btn-chip" type="button">Envoyer</button>
    </div>`;
  window.OPL.openModal("💬 Chat de l'équipage", html);
  renderChatMessages();
  const input = document.getElementById("mpChatInput");
  const sendBtn = document.getElementById("mpChatSendBtn");
  const doSend = ()=>{
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;
    input.value = "";
    sendChatMessage(text);
  };
  if(sendBtn) sendBtn.addEventListener("click", doSend);
  if(input){
    input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") doSend(); });
    input.focus();
  }
}

function renderChatMessages(){
  const el = document.getElementById("mpChatMessages");
  if(!el) return;
  if(mp.chatLog.length===0){
    el.innerHTML = `<p class="modal-intro">Aucun message pour l'instant — dis bonjour à l'équipage !</p>`;
  } else {
    el.innerHTML = mp.chatLog.map(m=>{
      const mine = m.fromId===mp.selfId;
      return `<div class="mp-chat-msg ${mine?"mine":""}">
        <span class="mp-chat-msg-name">${mine?"Toi":(m.fromName||"?")}</span>
        <span class="mp-chat-msg-text">${escapeHtml(m.text)}</span>
      </div>`;
    }).join("");
  }
  el.scrollTop = el.scrollHeight;
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function sendChatMessage(text){
  const msg = { type:"chat_send", text };
  if(mp.isHost) hostHandle(mp.selfId, msg);
  else sendToHost(msg);
}

/* ================= UI : sauvetage par un membre de l'équipage ================= */

function requestRevival(cause){
  const s = window.OPL.getState();
  const msg = { type:"revive_request", forId: mp.selfId, forName: s.name, island: s.island, cause };
  if(mp.isHost) hostHandle(mp.selfId, msg);
  else sendToHost(msg);
  window.OPL.addLog("Ta vie ne tient plus qu'à un fil... quelqu'un de ton équipage pourrait encore te sauver.", "major");
  window.OPL.save();
  window.OPL.renderGame(true);
}

function showRevivalModal(msg){
  const html = `
    <p class="modal-intro"><b>${msg.forName || "Un·e camarade"}</b> vient de tomber à ${msg.island || "?"}...</p>
    <div class="action-row" data-revive="yes">
      <div><div class="a-label">Le/la ramener à la vie</div><div class="a-sub">Il/elle reprendra ton âge actuel</div></div>
      <div class="a-val">→</div>
    </div>
    <div class="action-row" data-revive="no">
      <div><div class="a-label">Laisser partir</div><div class="a-sub">Sa légende s'achève ici</div></div>
      <div class="a-val">→</div>
    </div>`;
  window.OPL.openModal("Un membre de l'équipage est tombé", html);
  document.querySelectorAll("[data-revive]").forEach(el=>{
    el.addEventListener("click", ()=>{
      window.OPL.closeModal();
      if(el.dataset.revive==="yes"){
        const out = { type:"revive_accept", seq: msg.seq };
        if(mp.isHost) hostHandle(mp.selfId, out);
        else sendToHost(out);
      }
    });
  });
}

function applyRevivalResult(msg){
  const s = window.OPL.getState();
  if(msg.accepted){
    s.alive = true;
    s.health = Math.max(s.health, 45);
    if(msg.syncAge!=null && msg.syncAge>s.age) s.age = msg.syncAge;
    window.OPL.addLog(`${msg.byName || "Un·e camarade"} refuse de te laisser mourir et te ramène in extremis. Tu as maintenant ${s.age} ans, comme le reste de l'équipage.`, "major");
    window.OPL.save();
    window.OPL.renderGame(true);
  } else {
    skipRevivalHook = true;
    window.OPL.death(msg.cause);
    skipRevivalHook = false;
  }
}

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
  if(mp.phase!=="lobby" || chatModalOpen) return;
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
    <p class="modal-intro" style="font-size:12px;">Mode : <b>${mp.coopVoteMode ? "Équipage (vote)" : "Parallèle"}</b> — ${MODE_DESCRIPTIONS[mp.coopVoteMode?"coop":"parallel"]}</p>
    <div class="mp-lobby-list">${rows || '<p class="modal-intro">En attente de joueurs...</p>'}</div>
    ${mp.isHost
      ? `<button id="mpStartGame" class="btn btn-primary btn-lg" ${canStart?"":"disabled"} style="margin-top:14px;">Lancer la partie (${ids.length}/${MAX_PLAYERS})</button>`
      : `<p class="modal-intro" style="margin-top:14px;">En attente que l'hôte lance la partie...</p>`}
    <button id="mpLobbyChatBtn" class="btn btn-secondary" style="margin-top:8px;">💬 Chat</button>
    <button id="mpLeaveLobby" class="btn btn-ghost" style="margin-top:8px;">Quitter</button>`;
  window.OPL.openModal(mp.isHost ? "Salle d'attente (hôte)" : "Salle d'attente", html);
  const copyBtn = document.getElementById("mpCopyCode");
  if(copyBtn) copyBtn.addEventListener("click", ()=>{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(mp.roomCode).then(()=> mpToast("Code copié !")).catch(()=>{});
    }
  });
  const lobbyChatBtn = document.getElementById("mpLobbyChatBtn");
  if(lobbyChatBtn) lobbyChatBtn.addEventListener("click", openChatModal);
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

const MODE_DESCRIPTIONS = {
  parallel: "Chacun vit sa vie de son côté, années synchronisées. Interactions si vous vous croisez sur la même île.",
  coop: "Personnages individuels, mais les grandes décisions de quête et d'histoire se tranchent par vote de l'équipage."
};

function showEntryModal(){
  const html = `
    <p class="modal-intro" style="margin-bottom:6px;">Mode de partie</p>
    <div class="mp-mode-row">
      <button id="mpModeParallel" class="btn btn-chip mp-mode-btn active" type="button" data-mode="parallel">Parallèle</button>
      <button id="mpModeCoop" class="btn btn-chip mp-mode-btn" type="button" data-mode="coop">Équipage (vote)</button>
    </div>
    <p class="modal-intro" id="mpModeDesc" style="font-size:12px;margin:6px 0 16px;">${MODE_DESCRIPTIONS.parallel}</p>
    <button id="mpCreateBtn" class="btn btn-primary btn-lg">Créer une partie</button>
    <div class="mp-join-row">
      <input type="text" id="mpJoinCode" maxlength="5" placeholder="Code (5 caractères)">
      <button id="mpJoinBtn" class="btn btn-secondary">Rejoindre</button>
    </div>
    <p class="modal-intro" style="margin-top:10px;font-size:12px;">Jusqu'à 4 joueurs, connexion directe entre vos appareils (pair-à-pair, sans serveur de jeu). Gardez tous l'onglet ouvert pendant la partie.</p>`;
  window.OPL.openModal("Multijoueur", html);
  let selectedMode = "parallel";
  document.querySelectorAll(".mp-mode-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".mp-mode-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      selectedMode = btn.dataset.mode;
      document.getElementById("mpModeDesc").textContent = MODE_DESCRIPTIONS[selectedMode];
    });
  });
  document.getElementById("mpCreateBtn").addEventListener("click", ()=> createRoom(selectedMode==="coop"));
  document.getElementById("mpJoinBtn").addEventListener("click", ()=>{
    const code = document.getElementById("mpJoinCode").value.trim().toUpperCase();
    if(code.length<3){ mpToast("Entre un code valide."); return; }
    joinRoom(code);
  });
}

/* ================= CONNEXION RÉSEAU (PeerJS) ================= */

function createRoom(coopMode){
  if(typeof Peer==="undefined"){ mpToast("Erreur : librairie réseau non chargée."); return; }
  mp.coopVoteMode = !!coopMode;
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
  mp.coopVoteMode = false;
  mp.pendingVotes = {};
  mp.pendingRevivals = {};
  mp.chatLog = [];
  mp.chatUnread = 0;
  pendingVoteEvent = null;
  chatModalOpen = false;
  skipRevivalHook = false;
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
  window.OPL._onSpecialEvent = function(ev){
    if(!mp.active || !mp.coopVoteMode) return false;
    window.OPL.addLog(ev.text, "major");
    window.OPL.save();
    window.OPL.renderGame(true);
    startVoteForEvent(ev);
    return true;
  };
  window.OPL._onModalClosed = function(){
    chatModalOpen = false;
  };
  window.OPL._onFinalDeath = function(cause){
    if(skipRevivalHook) return false;
    if(!mp.active) return false;
    const others = activePlayers().filter(p=>p.id!==mp.selfId);
    if(others.length===0) return false;
    requestRevival(cause);
    return true;
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
window.__OPL_MP_TEST__ = { mp, transport, hostHandle, clientApply, buildSnapshot, mkEmptyPlayer, finalizeRevival };

})();
