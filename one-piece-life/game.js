/* ============================================================
   ONE PIECE LIFE — simulateur de vie façon BitLife
   Fan-jeu non officiel. Tout est généré côté client, sauvegardé
   en localStorage. Aucune dépendance externe.
============================================================ */

(() => {
"use strict";

/* ================= DATA ================= */

const BIRTHPLACES = [
  "Fuchsia Village", "Shells Town", "Orange Town", "Syrup Village",
  "Baratie", "Cocoyasi", "Loguetown", "Water Seven",
  "Alabasta", "Drum Island", "Skypiea", "Fishman Island",
  "Wano", "Dressrosa", "Baltigo", "Marineford"
];

const FAMILIES = [
  { id:"pecheur", label:"Famille de pêcheurs", desc:"Une enfance simple au bord de l'eau.",
    mods:{ endurance:5, force:3, charisme:0, intelligence:0 } },
  { id:"marchand", label:"Famille de marchands", desc:"Le sens des affaires dans le sang.",
    mods:{ charisme:6, intelligence:4, force:-2 } },
  { id:"marine", label:"Famille de marines", desc:"Discipline et devoir dès le berceau.",
    mods:{ force:4, intelligence:3, endurance:2 }, repMarine:10 },
  { id:"pirate", label:"Famille de pirates", desc:"Le grand large avant même de savoir marcher.",
    mods:{ force:5, charisme:3, chance:5 }, repPirate:10 },
  { id:"noble", label:"Famille noble", desc:"Argent et éducation, mais peu de liberté.",
    mods:{ intelligence:6, charisme:5, endurance:-3 }, beli:5000 },
  { id:"orphelin", label:"Orphelin·e recueilli·e", desc:"Élevé·e par un vieux loup de mer solitaire.",
    mods:{ chance:8, endurance:3, intelligence:-2 } }
];

const NAME_FIRST = ["Ruy","Kaya","Ace","Nami","Roji","Sana","Kael","Miri","Doran","Yumi","Zeff","Tara","Coby","Elan","Suzu","Iro","Mako","Rena","Baku","Nell"];
const NAME_LAST = ["D. Owen","Newgate","Portgas","Cross","Silver","Redfield","Vance","Kurosaki","Alden","Voss","Nakahara","Steel","Farrow","Dune","Kessler"];

const DEVIL_FRUITS = [
  { name:"Gomu Gomu no Mi", type:"Paramecia", desc:"Le corps devient élastique comme du caoutchouc.", mods:{force:8,endurance:6} },
  { name:"Mera Mera no Mi", type:"Logia", desc:"Le corps se transforme en flammes.", mods:{force:10,vitesse:4} },
  { name:"Hie Hie no Mi", type:"Logia", desc:"Le corps se transforme en glace.", mods:{force:8,endurance:6} },
  { name:"Goro Goro no Mi", type:"Logia", desc:"Le corps se transforme en foudre.", mods:{force:12,vitesse:6} },
  { name:"Suna Suna no Mi", type:"Logia", desc:"Le corps se transforme en sable.", mods:{endurance:8,intelligence:2} },
  { name:"Yami Yami no Mi", type:"Logia", desc:"Contrôle des ténèbres, attire tout vers soi.", mods:{force:14,endurance:-4} },
  { name:"Ope Ope no Mi", type:"Paramecia", desc:"Crée une salle où tout peut être manipulé.", mods:{intelligence:10,charisme:4} },
  { name:"Bara Bara no Mi", type:"Paramecia", desc:"Le corps se découpe en morceaux, insensible aux lames.", mods:{endurance:6,vitesse:2} },
  { name:"Doku Doku no Mi", type:"Paramecia", desc:"Génère et contrôle des poisons mortels.", mods:{force:6,intelligence:4} },
  { name:"Zushi Zushi no Mi", type:"Paramecia", desc:"Contrôle de la gravité environnante.", mods:{force:12,vitesse:-2} },
  { name:"Neko Neko no Mi, Modèle Léopard", type:"Zoan", desc:"Transformation en félin puissant et agile.", mods:{force:6,vitesse:8} },
  { name:"Tori Tori no Mi, Modèle Faucon", type:"Zoan", desc:"Transformation en rapace, vitesse fulgurante.", mods:{vitesse:10,charisme:2} },
  { name:"Uma Uma no Mi", type:"Zoan", desc:"Transformation en cheval, endurance de fond.", mods:{endurance:9,vitesse:4} },
  { name:"Ryu Ryu no Mi, Modèle Ancien", type:"Zoan Mythique", desc:"Transformation en créature ancestrale massive.", mods:{force:16,endurance:8} },
  { name:"Hito Hito no Mi", type:"Zoan", desc:"Intelligence et dextérité décuplées.", mods:{intelligence:10,charisme:6} },
  { name:"Mochi Mochi no Mi", type:"Paramecia Spéciale", desc:"Le corps devient du mochi, collant et déformable.", mods:{force:9,endurance:5} },
  { name:"Chiyu Chiyu no Mi", type:"Paramecia", desc:"Pouvoir de guérison sur soi et les autres.", mods:{charisme:8,endurance:4} },
  { name:"Kage Kage no Mi", type:"Paramecia", desc:"Manipulation des ombres, vole leur puissance.", mods:{force:7,intelligence:5} },
  { name:"Magu Magu no Mi", type:"Logia", desc:"Le corps se transforme en magma incandescent.", mods:{force:15,endurance:2} },
  { name:"Soru Soru no Mi", type:"Paramecia", desc:"Manipulation des âmes et de la durée de vie.", mods:{intelligence:8,charisme:8} }
];

const CREW_FIRST = ["Kento","Lira","Bo","Sana","Dax","Miro","Elka","Toma","Rin","Jael","Osa","Neri","Farid","Coco","Wren"];
const CREW_ROLES = [
  { role:"Second", statKey:"force" }, { role:"Navigateur·rice", statKey:"intelligence" },
  { role:"Cuisinier·ère", statKey:"endurance" }, { role:"Médecin", statKey:"intelligence" },
  { role:"Tireur·se d'élite", statKey:"vitesse" }, { role:"Charpentier·ère", statKey:"force" },
  { role:"Archéologue", statKey:"intelligence" }, { role:"Musicien·ne", statKey:"charisme" },
  { role:"Sabreur·se", statKey:"force" }, { role:"Timonier", statKey:"vitesse" }
];

const MARINE_RANKS = [
  "Recrue","Matelot","Enseigne","Lieutenant","Capitaine de corvette",
  "Commandant","Capitaine de vaisseau","Commodore","Contre-amiral",
  "Vice-amiral","Amiral","Amiral en Chef"
];

const STAGES = [
  { id:0, name:"East Blue", req:0, danger:1 },
  { id:1, name:"Reverse Mountain", req:35, danger:2 },
  { id:2, name:"Paradise (Grand Line)", req:45, danger:3 },
  { id:3, name:"Le Mur de la Marine Rouge", req:90, danger:4 },
  { id:4, name:"Nouveau Monde", req:110, danger:5 },
  { id:5, name:"Laugh Tale", req:220, danger:7 }
];

const EPITHETS = [
  "le Tempétueux","aux Mille Cicatrices","le Silencieux","l'Insaisissable",
  "Cœur de Fer","le Vagabond","aux Yeux d'Orage","le Fléau des Mers",
  "l'Indompté","Poing de Braise"
];

const CHILDHOOD_EVENTS = [
  { min:0,max:3, texts:[
    "Tu fais tes premiers pas sur le port, sous le regard amusé des pêcheurs.",
    "Un vieux marin te raconte déjà des histoires de trésors cachés.",
    "Tu tombes de ta chaise haute en essayant d'attraper un poisson dans une assiette."
  ], mods:{} },
  { min:4,max:6, texts:[
    "Tu apprends à nager dans le lagon du village.",
    "Tu te bats avec les enfants du village pour un bâton en bois en guise d'épée.",
    "Tu regardes un navire pirate au loin, fasciné·e."
  ], mods:{force:1,vitesse:1} },
  { min:7,max:9, texts:[
    "Tu commences un entraînement physique avec les habitants du village.",
    "Tu lis en cachette des cartes de Grand Line trouvées dans un grenier.",
    "Un chasseur de primes de passage t'apprend quelques rudiments de combat."
  ], mods:{force:2,intelligence:1} },
  { min:10,max:12, texts:[
    "Tu construis ton premier petit radeau avec des amis.",
    "Tu défies le caïd du village et t'en sors avec quelques bleus.",
    "Un vétéran remarque ton potentiel et t'entraîne un peu."
  ], mods:{force:2,vitesse:2,charisme:1} },
  { min:13,max:16, texts:[
    "Tu rêves chaque nuit de prendre la mer.",
    "Tu t'entraînes dur, déterminé·e à devenir plus fort·e.",
    "Tu assistes à l'arrivée d'un navire de la Marine au port, impressionné·e.",
    "Une bagarre de rue tourne à ton avantage."
  ], mods:{force:2,vitesse:1,intelligence:1,charisme:1} }
];

function pathEvents(path){
  const common = [
    { txt:"Une tempête manque de couler le navire, mais l'équipage tient bon.", type:"neutral", mods:{endurance:1} },
    { txt:"Tu passes la soirée à raconter des histoires avec l'équipage.", type:"good", mods:{happiness:8,charisme:1} },
    { txt:"Un Roi des Mers surgit de l'eau et s'éloigne sans attaquer, à ton grand soulagement.", type:"neutral", mods:{} },
    { txt:"Tu perfectionnes ta technique de combat pendant des heures.", type:"neutral", mods:{force:1,vitesse:1} },
    { txt:"Une île mystérieuse t'offre un moment de répit bienvenu.", type:"good", mods:{happiness:10,health:5} }
  ];
  if(path==="pirate") return common.concat([
    { txt:"Tu pilles un entrepôt de la Marine et files avec le butin.", type:"good", mods:{beli:800,repMarine:-5} },
    { txt:"Une rumeur sur ta prime circule dans les tavernes.", type:"neutral", mods:{} },
    { txt:"Tu partages un festin légendaire avec ton équipage.", type:"good", mods:{happiness:15} },
    { txt:"Un autre équipage pirate te propose une alliance temporaire.", type:"neutral", mods:{charisme:1} }
  ]);
  if(path==="marine") return common.concat([
    { txt:"Tu diriges un exercice de discipline pour les nouvelles recrues.", type:"neutral", mods:{charisme:1} },
    { txt:"Une mission de patrouille se déroule sans accroc.", type:"good", mods:{beli:300} },
    { txt:"Tu reçois une lettre de félicitations du quartier général.", type:"good", mods:{happiness:8} }
  ]);
  if(path==="chasseur") return common.concat([
    { txt:"Tu traques un fugitif à travers une ville portuaire animée.", type:"neutral", mods:{vitesse:1} },
    { txt:"Une prime encaissée te met à l'aise financièrement pour un temps.", type:"good", mods:{beli:600} }
  ]);
  if(path==="revolutionnaire") return common.concat([
    { txt:"Tu aides à organiser la résistance dans un royaume opprimé.", type:"good", mods:{charisme:2,happiness:5} },
    { txt:"Une opération secrète contre un noble corrompu réussit.", type:"good", mods:{beli:400} }
  ]);
  return common.concat([
    { txt:"Tu tiens ton commerce avec sérieux, la vie suit son cours.", type:"neutral", mods:{beli:250} },
    { txt:"Tu profites d'une vie tranquille loin des tempêtes de Grand Line.", type:"good", mods:{happiness:6} }
  ]);
}

const DEATH_CAUSES = {
  storm: "Ton navire a sombré corps et biens durant une violente tempête.",
  seaking: "Un Roi des Mers a englouti ton navire en un instant.",
  battle: "Tu es tombé·e au combat, l'épée à la main.",
  execution: "Capturé·e par la Marine, tu as été exécuté·e sur la place publique.",
  old_age: "Tu t'es éteint·e paisiblement, entouré·e des tiens, à un âge avancé.",
  illness: "Une maladie a eu raison de toi après une vie bien remplie.",
  betrayal: "Trahi·e par un proche, tu n'as rien vu venir.",
  drowning: "Emporté·e par les flots, ton pouvoir de fruit du démon ne t'a pas pardonné."
};

/* ================= STATE ================= */

const SAVE_KEY = "opl_save_v1";
const HOF_KEY = "opl_hof_v1";

let state = null;

function freshState(){
  return {
    name:"", birthplace:"", familyId:"",
    age:0, year:0, alive:true,
    path:"civil", pathChosen:false,
    stage:0,
    health:100, happiness:70,
    force:10, vitesse:10, endurance:10, intelligence:10, charisme:10, chance:10,
    hakiObs:0, hakiArm:0, hakiConq:false,
    devilFruit:null,
    beli:0, bounty:0, bountyRevealed:false,
    repMarine:0, repPirate:0,
    marineRank:0,
    crew:[],
    epithet:"",
    log:[],
    inPrison:false
  };
}

function save(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){}
}
function loadSave(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }

function loadHOF(){
  try{
    const raw = localStorage.getItem(HOF_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function pushHOF(entry){
  const list = loadHOF();
  list.unshift(entry);
  list.sort((a,b)=>b.score-a.score);
  localStorage.setItem(HOF_KEY, JSON.stringify(list.slice(0,20)));
}

/* ================= UTIL ================= */

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[rand(0,arr.length-1)]; }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function fmt(n){ return Math.round(n).toLocaleString("fr-FR"); }

function applyMods(mods){
  if(!mods) return;
  for(const key in mods){
    if(key==="beli") state.beli = Math.max(0, state.beli + mods.beli);
    else if(key==="happiness") state.happiness = clamp(state.happiness + mods.happiness, 0, 100);
    else if(key==="health") state.health = clamp(state.health + mods.health, 0, 100);
    else if(key==="repMarine") state.repMarine += mods.repMarine;
    else if(key==="repPirate") state.repPirate += mods.repPirate;
    else if(["force","vitesse","endurance","intelligence","charisme","chance"].includes(key)){
      state[key] = clamp(state[key] + mods[key], 0, 100);
    }
  }
}

function powerScore(){
  let p = state.force + state.vitesse + state.endurance + state.hakiObs + state.hakiArm;
  if(state.devilFruit) p += (state.devilFruit.mods.force||0) + (state.devilFruit.mods.vitesse||0) + (state.devilFruit.mods.endurance||0);
  if(state.hakiConq) p += 20;
  const crewPower = state.crew.reduce((s,c)=>s+c.power,0) * 0.3;
  return Math.round(p + crewPower);
}

function currentStage(){ return STAGES[state.stage]; }

function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove("show"), 1800);
}

function addLog(text, type="neutral", showYear=true){
  state.log.push({ age: state.age, text, type });
}

/* ================= SCREEN NAV ================= */

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function openModal(title, bodyHTML){
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHTML;
  document.getElementById("modalOverlay").classList.add("open");
  const t = document.getElementById("toast");
  t.classList.remove("show");
  clearTimeout(toast._t);
}
function closeModal(){
  document.getElementById("modalOverlay").classList.remove("open");
}

/* ================= CHARACTER CREATION ================= */

let createSel = { birthplace:null, familyId:null };

function renderCreateScreen(){
  createSel = { birthplace:BIRTHPLACES[0], familyId:FAMILIES[0].id };
  document.getElementById("inputName").value = "";

  const bpGrid = document.getElementById("birthplaceGrid");
  bpGrid.innerHTML = BIRTHPLACES.map((b,i)=>
    `<div class="chip ${i===0?'selected':''}" data-bp="${b}">${b}</div>`).join("");
  bpGrid.querySelectorAll(".chip").forEach(el=>{
    el.addEventListener("click", ()=>{
      bpGrid.querySelectorAll(".chip").forEach(c=>c.classList.remove("selected"));
      el.classList.add("selected");
      createSel.birthplace = el.dataset.bp;
    });
  });

  const famGrid = document.getElementById("familyGrid");
  famGrid.innerHTML = FAMILIES.map((f,i)=>
    `<div class="option-card ${i===0?'selected':''}" data-fam="${f.id}">
      <b>${f.label}</b><span>${f.desc}</span>
    </div>`).join("");
  famGrid.querySelectorAll(".option-card").forEach(el=>{
    el.addEventListener("click", ()=>{
      famGrid.querySelectorAll(".option-card").forEach(c=>c.classList.remove("selected"));
      el.classList.add("selected");
      createSel.familyId = el.dataset.fam;
    });
  });
}

function randomName(){
  return `${pick(NAME_FIRST)} ${pick(NAME_LAST)}`;
}

function birthCharacter(){
  const nameInput = document.getElementById("inputName").value.trim();
  state = freshState();
  state.name = nameInput || randomName();
  state.birthplace = createSel.birthplace;
  state.familyId = createSel.familyId;

  const fam = FAMILIES.find(f=>f.id===state.familyId);
  applyMods(fam.mods);
  if(fam.beli) state.beli += fam.beli;
  if(fam.repMarine) state.repMarine += fam.repMarine;
  if(fam.repPirate) state.repPirate += fam.repPirate;

  addLog(`Tu nais à ${state.birthplace}, au sein d'une ${fam.label.toLowerCase()}.`, "major");
  save();
  showScreen("screen-game");
  renderGame();
}

/* ================= AGE UP / EVENTS ================= */

function ageUp(){
  if(!state.alive) return;

  state.age += 1;
  state.year += 1;

  // natural drift
  state.happiness = clamp(state.happiness - rand(0,3), 0, 100);
  if(state.age>0) state.health = clamp(state.health - (state.age>55 ? rand(1,4) : 0), 0, 100);

  if(state.age <= 16){
    const pool = CHILDHOOD_EVENTS.find(e=>state.age>=e.min && state.age<=e.max) || CHILDHOOD_EVENTS[CHILDHOOD_EVENTS.length-1];
    const txt = pick(pool.texts);
    applyMods(pool.mods);
    addLog(txt, "neutral");
  } else {
    if(!state.pathChosen){
      addLog("Tu es en âge de choisir la voie de ta vie.", "major");
    } else {
      runPathYear();
    }
  }

  checkDeath();
  checkBountyReveal();
  save();
  renderGame(true);

  if(state.age===16 && !state.pathChosen){
    setTimeout(openPathChoice, 300);
  }
}

function runPathYear(){
  const pool = pathEvents(state.path);
  const ev = pick(pool);
  applyMods(ev.mods);
  addLog(ev.txt, ev.type);

  // marine promotion chance
  if(state.path==="marine" && state.marineRank < MARINE_RANKS.length-1){
    const chanceUp = 0.12 + powerScore()/1000;
    if(Math.random() < chanceUp){
      state.marineRank++;
      addLog(`Tu es promu·e ${MARINE_RANKS[state.marineRank]} !`, "major");
      if(state.marineRank===MARINE_RANKS.length-1){
        winEnding("marine");
        return;
      }
    }
  }

  // random hazard scaling with stage danger
  const danger = currentStage().danger;
  const hazardChance = 0.06 * danger + (state.path==="civil" ? -0.05 : 0);
  if(Math.random() < Math.max(0,hazardChance)){
    triggerHazard(danger);
  }
  if(!state.alive) return;

  // laugh tale victory check for pirates
  if(state.path==="pirate" && state.stage===5){
    if(powerScore() >= 240 && Math.random() < 0.35){
      winEnding("pirate");
    }
  }
}

function triggerHazard(danger){
  const roll = Math.random();
  if(roll < 0.35){
    const dmg = rand(5,10)*danger*0.5;
    state.health = clamp(state.health - dmg, 0, 100);
    addLog("Une bagarre éclate et tu encaisses quelques coups.", "bad");
  } else if(roll < 0.6 && state.path!=="civil"){
    const power = powerScore();
    const enemyPower = rand(10,25) * danger;
    resolveFight(enemyPower, "un adversaire redoutable croisé en chemin");
  } else if(roll < 0.8){
    if(state.devilFruit && Math.random()<0.4){
      state.health = clamp(state.health - rand(10,20), 0, 100);
      addLog("Tombé·e à l'eau, ton fruit du démon te paralyse quelques instants terrifiants.", "bad");
      if(Math.random()<0.15){ death("drowning"); }
    } else {
      state.health = clamp(state.health - rand(8,18), 0, 100);
      addLog("Une tempête violente secoue ton navire.", "bad");
      if(Math.random()<0.05*danger){ death("storm"); }
    }
  } else {
    state.health = clamp(state.health - rand(10,25), 0, 100);
    addLog("Un Roi des Mers attaque soudainement !", "bad");
    if(Math.random()<0.05*danger){ death("seaking"); }
  }
}

function resolveFight(enemyPower, enemyLabel){
  const myPower = powerScore();
  const winProb = clamp(0.5 + (myPower-enemyPower)/200, 0.08, 0.92);
  const win = Math.random() < winProb;
  if(win){
    const gain = rand(200,1500) + enemyPower*10;
    if(state.path==="pirate"){ state.bounty += gain; }
    state.beli += Math.round(gain/2);
    state.happiness = clamp(state.happiness+5,0,100);
    addLog(`Tu triomphes de ${enemyLabel} ! Ta réputation grandit.`, "good");
  } else {
    const dmg = rand(15,35);
    state.health = clamp(state.health-dmg,0,100);
    addLog(`Défaite face à ${enemyLabel}. Tu t'en sors blessé·e.`, "bad");
    if(state.crew.length && Math.random()<0.2){
      const lost = state.crew.pop();
      addLog(`${lost.name} disparaît dans la bataille...`, "death");
    }
    if(state.health<=0){
      death(state.path==="marine" ? "battle" : (Math.random()<0.5?"battle":"execution"));
    } else if(state.path!=="marine" && Math.random()<0.08){
      death("execution");
    }
  }
}

/* ================= DEATH / ENDINGS ================= */

function checkDeath(){
  if(!state.alive) return;
  if(state.health<=0){
    death(state.age>55 ? "illness":"battle");
    return;
  }
  if(state.age>=65){
    const p = (state.age-65)*0.03 + 0.02;
    if(Math.random()<p){ death("old_age"); }
  }
}

function checkBountyReveal(){
  if(!state.alive) return;
  if(state.path==="pirate" && !state.bountyRevealed && state.bounty>3000){
    state.bountyRevealed = true;
    addLog(`Un avis de recherche à ton nom apparaît : ${fmt(state.bounty)} Beli !`, "major");
  }
  if(state.path==="pirate" && !state.epithet && state.bounty>20000){
    state.epithet = pick(EPITHETS);
    addLog(`On commence à t'appeler "${state.name.split(' ')[0]} ${state.epithet}".`, "major");
  }
}

function death(cause){
  state.alive = false;
  const label = DEATH_CAUSES[cause] || "Ta légende s'achève ici.";
  addLog(label, "death");
  finalizeLife(cause, false);
}

function winEnding(kind){
  state.alive = false;
  if(kind==="pirate"){
    addLog("Tu atteins Laugh Tale et découvres le One Piece ! Le monde entier apprend ton nom : tu es le nouveau Roi des Pirates !", "major");
    finalizeLife("pirate_king", true);
  } else if(kind==="marine"){
    addLog("Tu es nommé·e Amiral en Chef de la Marine, garant·e de la Justice Absolue sur toutes les mers.", "major");
    finalizeLife("fleet_admiral", true);
  }
}

function finalizeLife(cause, victory){
  const score = Math.round(powerScore()*10 + state.bounty/1000 + state.beli/500 + state.age*5 + (victory?5000:0));
  const fam = FAMILIES.find(f=>f.id===state.familyId);
  const hofEntry = {
    name: state.name + (state.epithet? " "+state.epithet:""),
    age: state.age,
    path: pathLabel(state.path),
    bounty: state.bounty,
    beli: state.beli,
    cause: victory ? (cause==="pirate_king"?"Devenu·e Roi des Pirates":"Devenu·e Amiral en Chef") : (DEATH_CAUSES[cause]||""),
    score,
    victory
  };
  pushHOF(hofEntry);
  clearSave();
  renderEndScreen(hofEntry, victory);
}

function pathLabel(p){
  return { civil:"Civil·e", pirate:"Pirate", marine:"Marine", chasseur:"Chasseur·se de primes", revolutionnaire:"Révolutionnaire" }[p] || p;
}

/* ================= PATH CHOICE ================= */

function openPathChoice(){
  const p = powerScore();
  const options = [
    { id:"civil", label:"Rester civil·e", sub:"Une vie tranquille, loin du danger.", ok:true },
    { id:"pirate", label:"Prendre la mer, devenir pirate", sub:"Liberté totale, mais la Marine te traquera.", ok:true },
    { id:"marine", label:"Rejoindre la Marine", sub:"Gravis les rangs de la Justice.", ok: state.force+state.intelligence>=15 },
    { id:"chasseur", label:"Devenir chasseur·se de primes", sub:"Traque les criminels contre récompense.", ok: state.vitesse+state.force>=15 },
    { id:"revolutionnaire", label:"Rejoindre l'Armée Révolutionnaire", sub:"Combats les Dragons Célestes dans l'ombre.", ok: state.charisme>=14 }
  ];
  const html = options.map(o=>`
    <div class="action-row ${o.ok?'':'disabled'}" data-path="${o.id}">
      <div><div class="a-label">${o.label}</div><div class="a-sub">${o.sub}</div></div>
      <div class="a-val">${o.ok?'→':'🔒'}</div>
    </div>`).join("");
  openModal("Choisis ta voie", html);
  document.querySelectorAll("[data-path]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.dataset.path;
      const opt = options.find(o=>o.id===id);
      if(!opt.ok) return;
      state.path = id;
      state.pathChosen = true;
      addLog(`Tu choisis ta voie : ${pathLabel(id)}.`, "major");
      closeModal();
      save();
      renderGame(true);
    });
  });
}

/* ================= ACTIONS MENU ================= */

function openActionsMenu(){
  if(!state.pathChosen){
    openPathChoice();
    return;
  }
  let rows = [];

  rows.push({ label:"Entraînement physique", sub:`Force ${state.force} / Vitesse ${state.vitesse} / Endurance ${state.endurance}`, fn:trainPhysical });
  rows.push({ label:"Étudier", sub:`Intelligence ${state.intelligence}`, fn:trainMind });
  rows.push({ label:"Socialiser", sub:`Charisme ${state.charisme} · Bonheur`, fn:socialize });

  if(["pirate","marine","chasseur","revolutionnaire"].includes(state.path)){
    rows.push({ label:"Chercher un combat", sub:"Tente ta chance contre un adversaire", fn:seekFight });
  }
  if(state.path==="pirate"){
    rows.push({ label:"Chercher un fruit du démon", sub: state.devilFruit? "Déjà obtenu" : "Chance rare de trouver un pouvoir", fn:seekDevilFruit, disabled: !!state.devilFruit });
    rows.push({ label:"Recruter un·e compagnon·gne", sub:`Équipage : ${state.crew.length}`, fn:recruitCrew });
  }
  if(powerScore()>=25 && state.age>=18){
    rows.push({ label:"S'entraîner au Haki", sub:`Observation ${state.hakiObs} · Armement ${state.hakiArm}`, fn:trainHaki });
  }
  if(state.path!=="civil"){
    rows.push({ label:"Prendre sa retraite", sub:"Terminer ta vie en paix", fn:retire });
  }

  const html = rows.map((r,i)=>`
    <div class="action-row ${r.disabled?'disabled':''}" data-idx="${i}">
      <div><div class="a-label">${r.label}</div><div class="a-sub">${r.sub}</div></div>
      <div class="a-val">→</div>
    </div>`).join("");
  openModal("Actions", html);
  document.querySelectorAll("[data-idx]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const idx = +el.dataset.idx;
      closeModal();
      rows[idx].fn();
    });
  });
}

function trainPhysical(){
  const g = rand(1,3);
  applyMods({ force:g, vitesse:g, endurance:g, happiness:-2 });
  addLog("Une session d'entraînement intense te rend plus fort·e.", "good");
  save(); renderGame(true);
  toast("+ Force / Vitesse / Endurance");
}
function trainMind(){
  applyMods({ intelligence:rand(2,4), happiness:-1 });
  addLog("Tu passes du temps à étudier cartes marines et stratégies.", "good");
  save(); renderGame(true);
  toast("+ Intelligence");
}
function socialize(){
  applyMods({ charisme:rand(1,3), happiness:rand(5,10) });
  addLog("Une bonne soirée passée avec du monde te fait du bien.", "good");
  save(); renderGame(true);
  toast("+ Charisme / Bonheur");
}
function trainHaki(){
  if(Math.random()<0.5){
    state.hakiObs = clamp(state.hakiObs+rand(3,7),0,100);
    addLog("Tu perçois désormais les présences et les intentions : le Haki de l'Observation s'éveille.", "major");
  } else {
    state.hakiArm = clamp(state.hakiArm+rand(3,7),0,100);
    addLog("Ton corps se durcit d'une force invisible : le Haki de l'Armement progresse.", "major");
  }
  if(!state.hakiConq && powerScore()>150 && state.charisme>60 && Math.random()<0.05){
    state.hakiConq = true;
    addLog("Une pression écrasante émane de toi : tu possèdes le rarissime Haki des Rois !", "major");
  }
  save(); renderGame(true);
}
function seekFight(){
  const danger = currentStage().danger;
  const enemyPower = rand(15,30)*danger;
  resolveFight(enemyPower, pick(["un pirate rival","un officier de Marine","un chasseur de primes","un monstre marin"]));
  checkDeath();
  save(); renderGame(true);
}
function seekDevilFruit(){
  if(state.devilFruit){ toast("Tu as déjà mangé un fruit du démon."); return; }
  const chance = 0.18 + state.chance/300;
  if(Math.random() < chance){
    const fruit = pick(DEVIL_FRUITS);
    state.devilFruit = fruit;
    applyMods(fruit.mods);
    addLog(`Tu manges le ${fruit.name} (${fruit.type}) ! ${fruit.desc}`, "major");
  } else {
    addLog("Tu explores une île à la recherche d'un fruit du démon, sans succès cette fois.", "neutral");
  }
  save(); renderGame(true);
}
function recruitCrew(){
  if(state.crew.length>=9){ toast("Ton équipage est complet !"); return; }
  const roleData = pick(CREW_ROLES);
  const power = rand(10,30) + Math.round(state.charisme/2);
  const member = { name: pick(CREW_FIRST), role: roleData.role, power, loyalty: rand(50,90) };
  state.crew.push(member);
  addLog(`${member.name} rejoint ton équipage en tant que ${member.role.toLowerCase()} !`, "good");
  save(); renderGame(true);
}
function retire(){
  state.alive = false;
  addLog("Tu décides de raccrocher et de couler une retraite paisible, loin des tempêtes.", "major");
  DEATH_CAUSES.retraite_paisible = "Tu as pris ta retraite en légende vivante, admiré·e de tous.";
  finalizeLife("retraite_paisible", false);
}

/* ================= MAP ================= */

function openMap(){
  const p = powerScore();
  const html = STAGES.map(s=>{
    const reached = state.stage>=s.id;
    const canGo = state.stage===s.id-1 && p>=s.req;
    let status = reached ? "Position actuelle" : (canGo ? `Puissance requise : ${s.req} (toi : ${p})` : `Verrouillé — puissance requise : ${s.req}`);
    return `<div class="action-row ${canGo?'':'disabled'} ${reached?'':''}" data-stage="${s.id}">
      <div><div class="a-label">${s.name}</div><div class="a-sub">${status}</div></div>
      <div class="a-val">${reached?'📍':(canGo?'⛵':'🔒')}</div>
    </div>`;
  }).join("");
  openModal("Carte du monde", html);
  document.querySelectorAll("[data-stage]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = +el.dataset.stage;
      if(id===state.stage+1 && p>=STAGES[id].req){
        state.stage = id;
        addLog(`Tu arrives à ${STAGES[id].name}. Un nouveau chapitre commence.`, "major");
        closeModal();
        save(); renderGame(true);
      }
    });
  });
}

/* ================= CREW VIEW ================= */

function openCrewView(){
  if(state.path!=="pirate" || state.crew.length===0){
    openModal("Équipage", `<p style="color:#9fb3c8;font-size:13px;">Tu n'as pas encore de compagnons de route. Utilise le menu Actions pour recruter.</p>`);
    return;
  }
  const html = state.crew.map(c=>`
    <div class="crew-card">
      <div><b>${c.name}</b><span>${c.role}</span></div>
      <div class="a-val">💪 ${c.power}</div>
    </div>`).join("");
  openModal(`Équipage (${state.crew.length}/9)`, html);
}

/* ================= STATUS SHEET ================= */

function openStatus(){
  const fam = FAMILIES.find(f=>f.id===state.familyId);
  const stats = [
    ["Force", state.force], ["Vitesse", state.vitesse], ["Endurance", state.endurance],
    ["Intelligence", state.intelligence], ["Charisme", state.charisme], ["Chance", state.chance]
  ];
  const statHTML = stats.map(([n,v])=>`
    <div class="stat-box"><div class="s-name">${n}</div><div class="s-val">${v}</div>
      <div class="stat-full-track"><div class="stat-full-fill" style="width:${clamp(v,0,100)}%"></div></div>
    </div>`).join("");

  const extra = `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Origine</div><div class="a-sub">${state.birthplace} · ${fam.label}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Voie</div><div class="a-sub">${pathLabel(state.path)}${state.path==='marine' ? ' — '+MARINE_RANKS[state.marineRank] : ''}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Haki</div><div class="a-sub">Observation ${state.hakiObs} · Armement ${state.hakiArm}${state.hakiConq?' · Rois ⚡':''}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Fruit du démon</div><div class="a-sub">${state.devilFruit ? state.devilFruit.name+' ('+state.devilFruit.type+')' : 'Aucun'}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Puissance totale</div><div class="a-sub">Score de combat estimé</div></div>
      <div class="a-val">${powerScore()}</div>
    </div>
  `;
  openModal("Fiche de personnage", `<div class="stat-grid">${statHTML}</div>${extra}`);
}

/* ================= RENDER GAME ================= */

function renderGame(scrollLog){
  document.getElementById("hudName").textContent = state.name + (state.epithet ? " "+state.epithet : "");
  document.getElementById("hudTag").textContent = pathLabel(state.path);
  document.getElementById("hudAge").textContent = state.age;
  document.getElementById("barHealth").style.width = state.health+"%";
  document.getElementById("barHappy").style.width = state.happiness+"%";
  document.getElementById("hudBeli").textContent = fmt(state.beli);

  const bountyWrap = document.getElementById("hudBountyWrap");
  if(state.path==="pirate" && state.bountyRevealed){
    bountyWrap.hidden = false;
    document.getElementById("hudBounty").textContent = fmt(state.bounty);
  } else {
    bountyWrap.hidden = true;
  }

  const logEl = document.getElementById("log");
  logEl.innerHTML = state.log.map(e=>
    `<div class="log-entry ${e.type}">Âge ${e.age} — ${e.text}</div>`
  ).join("");
  if(scrollLog) logEl.scrollTop = logEl.scrollHeight;

  document.getElementById("btnAge").style.opacity = state.alive ? 1 : 0.3;
  document.getElementById("btnAge").disabled = !state.alive;
}

/* ================= END SCREEN ================= */

function renderEndScreen(entry, victory){
  document.getElementById("endTitle").textContent = victory ? "🏆 Légende accomplie" : "Fin de la légende";
  document.getElementById("endCause").textContent = entry.cause;
  const rows = [
    ["Nom", entry.name],
    ["Âge atteint", entry.age+" ans"],
    ["Voie", entry.path],
    ["Beli amassés", fmt(entry.beli)+" ฿"],
  ];
  if(entry.bounty>0) rows.push(["Prime finale", fmt(entry.bounty)+" ฿"]);
  rows.push(["Score de légende", fmt(entry.score)]);

  document.getElementById("endStats").innerHTML = rows.map(([k,v])=>
    `<div class="end-row"><span>${k}</span><b>${v}</b></div>`).join("");

  showScreen("screen-end");
}

/* ================= HALL OF FAME ================= */

function renderHOF(){
  const list = loadHOF();
  const el = document.getElementById("hofList");
  if(list.length===0){
    el.innerHTML = `<p class="hof-empty">Aucune légende enregistrée pour l'instant. Vis ta première vie !</p>`;
    return;
  }
  el.innerHTML = list.map(e=>`
    <div class="hof-card">
      <div class="h-name">${e.victory?'🏆 ':''}${e.name} — ${e.age} ans</div>
      <div class="h-desc">${e.path} · Score ${fmt(e.score)}${e.bounty>0?' · Prime '+fmt(e.bounty)+' ฿':''}</div>
      <div class="h-desc">${e.cause}</div>
    </div>`).join("");
}

/* ================= WIRING ================= */

function wire(){
  document.getElementById("btnNewGame").addEventListener("click", ()=>{
    renderCreateScreen();
    showScreen("screen-create");
  });
  document.getElementById("btnBackTitle").addEventListener("click", ()=> showScreen("screen-start"));
  document.getElementById("btnRandomName").addEventListener("click", ()=>{
    document.getElementById("inputName").value = randomName();
  });
  document.getElementById("btnBirth").addEventListener("click", birthCharacter);

  document.getElementById("btnHOF").addEventListener("click", ()=>{ renderHOF(); showScreen("screen-hof"); });
  document.getElementById("btnHofBack").addEventListener("click", ()=> showScreen("screen-start"));
  document.getElementById("btnEndHOF").addEventListener("click", ()=>{ renderHOF(); showScreen("screen-hof"); });
  document.getElementById("btnEndNew").addEventListener("click", ()=>{
    renderCreateScreen();
    showScreen("screen-create");
  });

  document.getElementById("btnAge").addEventListener("click", ageUp);
  document.getElementById("btnActions").addEventListener("click", openActionsMenu);
  document.getElementById("btnMap").addEventListener("click", openMap);
  document.getElementById("btnCrew").addEventListener("click", openCrewView);
  document.getElementById("btnStatus").addEventListener("click", openStatus);

  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e)=>{
    if(e.target.id==="modalOverlay") closeModal();
  });

  const existing = loadSave();
  if(existing && existing.alive){
    document.getElementById("btnContinue").hidden = false;
    document.getElementById("btnContinue").addEventListener("click", ()=>{
      state = existing;
      showScreen("screen-game");
      renderGame(true);
    });
  }
}

document.addEventListener("DOMContentLoaded", wire);

})();
