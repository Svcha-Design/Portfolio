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
const CREW_ROLES_MARINE = [
  { role:"Second·e", statKey:"force" }, { role:"Officier·ère tacticien·ne", statKey:"intelligence" },
  { role:"Artilleur·se", statKey:"force" }, { role:"Médecin militaire", statKey:"intelligence" },
  { role:"Tireur·se d'élite", statKey:"vitesse" }, { role:"Instructeur·rice", statKey:"endurance" },
  { role:"Agent de renseignement", statKey:"intelligence" }, { role:"Officier·ère de liaison", statKey:"charisme" },
  { role:"Sabreur·se", statKey:"force" }, { role:"Timonier·ère", statKey:"vitesse" }
];
const CREW_ROLES_CHASSEUR = [
  { role:"Second·e", statKey:"force" }, { role:"Traqueur·se", statKey:"vitesse" },
  { role:"Informateur·rice", statKey:"charisme" }, { role:"Médecin de fortune", statKey:"intelligence" },
  { role:"Tireur·se d'élite", statKey:"vitesse" }, { role:"Négociateur·rice", statKey:"charisme" },
  { role:"Archiviste de primes", statKey:"intelligence" }, { role:"Expert·e en évasion", statKey:"endurance" },
  { role:"Sabreur·se", statKey:"force" }, { role:"Éclaireur·se", statKey:"vitesse" }
];
const CREW_ROLES_REVOLUTIONNAIRE = [
  { role:"Second·e", statKey:"force" }, { role:"Stratège", statKey:"intelligence" },
  { role:"Artificier·ère", statKey:"force" }, { role:"Médecin clandestin·e", statKey:"intelligence" },
  { role:"Tireur·se d'élite", statKey:"vitesse" }, { role:"Messager·ère", statKey:"vitesse" },
  { role:"Recruteur·se", statKey:"charisme" }, { role:"Archiviste", statKey:"intelligence" },
  { role:"Sabreur·se", statKey:"force" }, { role:"Agent·e de terrain", statKey:"endurance" }
];
const CREW_ROLES_BY_PATH = {
  pirate: CREW_ROLES, marine: CREW_ROLES_MARINE,
  chasseur: CREW_ROLES_CHASSEUR, revolutionnaire: CREW_ROLES_REVOLUTIONNAIRE
};
const CREW_LABELS = {
  pirate: { action:"Recruter un·e compagnon·gne", groupTitle:"Équipage", poss:"Ton", group:"équipage", member:"compagnon·gne", emptyMsg:"Aucun compagnon de route pour l'instant. Recrute-en depuis le menu Actions." },
  marine: { action:"Recruter un·e subordonné·e", groupTitle:"Escouade", poss:"Ton", group:"escouade", member:"subordonné·e", emptyMsg:"Aucun·e subordonné·e pour l'instant. Recrute-en depuis le menu Actions." },
  chasseur: { action:"Recruter un·e partenaire", groupTitle:"Équipe de chasse", poss:"Ton", group:"équipe", member:"partenaire", emptyMsg:"Aucun·e partenaire pour l'instant. Recrute-en depuis le menu Actions." },
  revolutionnaire: { action:"Recruter un·e camarade", groupTitle:"Cellule", poss:"Ta", group:"cellule", member:"camarade", emptyMsg:"Aucun·e camarade pour l'instant. Recrute-en depuis le menu Actions." }
};

const STAT_LABELS = { force:"Force", vitesse:"Vitesse", endurance:"Endurance", intelligence:"Intelligence", charisme:"Charisme" };

const SHIP_TIERS = [
  { name:"Radeau de fortune", cost:0, capacity:2, firepower:5 },
  { name:"Petit voilier", cost:3000, capacity:4, firepower:15 },
  { name:"Caravelle", cost:12000, capacity:6, firepower:35 },
  { name:"Galion de guerre", cost:35000, capacity:8, firepower:60 },
  { name:"Vaisseau amiral", cost:90000, capacity:10, firepower:100 }
];

const WEAPONS = [
  { name:"Sabre court", cost:800, mods:{force:5, vitesse:3, endurance:-3} },
  { name:"Pistolet", cost:1000, mods:{vitesse:5, intelligence:3, force:-4} },
  { name:"Bâton de combat", cost:600, mods:{vitesse:6, charisme:2, force:-3} },
  { name:"Gants cloutés", cost:700, mods:{force:4, endurance:4, intelligence:-3} },
  { name:"Fleuret", cost:1200, mods:{vitesse:7, intelligence:2, endurance:-4} },
  { name:"Lance lourde", cost:1500, mods:{force:8, endurance:4, vitesse:-6} },
  { name:"Marteau de guerre", cost:1800, mods:{force:10, vitesse:-7, endurance:2} },
  { name:"Hache de guerre", cost:2000, mods:{force:9, endurance:-2, vitesse:-4} }
];

const MARINE_RANKS = [
  "Recrue","Matelot","Enseigne","Lieutenant","Capitaine de corvette",
  "Commandant","Capitaine de vaisseau","Commodore","Contre-amiral",
  "Vice-amiral","Amiral","Amiral en Chef"
];

const STAGES = [
  { id:0, name:"East Blue", req:0, danger:1 },
  { id:1, name:"Reverse Mountain", req:50, danger:2 },
  { id:2, name:"Paradise (Grand Line)", req:70, danger:3 },
  { id:3, name:"Le Mur de la Marine Rouge", req:130, danger:4 },
  { id:4, name:"Nouveau Monde", req:180, danger:5 },
  { id:5, name:"Laugh Tale", req:260, danger:7 }
];

const ISLANDS = {
  0: ["Fuchsia Village","Shells Town","Orange Town","Syrup Village","Baratie","Loguetown","Cocoyasi"],
  2: ["Whiskey Peak","Little Garden","Drum Island","Alabasta","Skypiea","Water Seven","Enies Lobby","Thriller Bark"],
  4: ["Fishman Island","Punk Hazard","Dressrosa","Zou","Whole Cake Island","Wano","Elbaf"]
};

const ISLAND_ICONS = {
  "Fuchsia Village":"🐐", "Shells Town":"⚓", "Orange Town":"🍊", "Syrup Village":"🐑",
  "Baratie":"🍳", "Loguetown":"⚔️", "Cocoyasi":"🍊",
  "Whiskey Peak":"🌵", "Little Garden":"🦖", "Drum Island":"❄️", "Alabasta":"🏜️",
  "Skypiea":"☁️", "Water Seven":"🚢", "Enies Lobby":"⚖️", "Thriller Bark":"👻",
  "Fishman Island":"🐠", "Punk Hazard":"🌋", "Dressrosa":"🎪", "Zou":"🐘",
  "Whole Cake Island":"🍰", "Wano":"🎏", "Elbaf":"🪓"
};

const VILLAIN_ARCHETYPES = [
  "Un seigneur pirate local, redouté de tout l'archipel.",
  "Un ancien officier de la Marine passé du côté obscur.",
  "Une chasseuse de primes solitaire à la réputation glaçante.",
  "Un monstre marin territorial qui garde les eaux environnantes.",
  "Un maître d'armes invaincu depuis vingt ans.",
  "Un noble corrompu protégé par une garde privée nombreuse.",
  "Un commandant de la Marine zélé, prêt à tout pour une promotion.",
  "Une organisation clandestine qui contrôle les docks.",
  "Un capitaine pirate à la prime déjà conséquente.",
  "Un colosse local que personne n'a jamais vaincu en duel."
];

const MARINE_THREAT_LABELS = ["quasi nulle","faible","modérée","élevée","très élevée","critique","extrême"];

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

const DEATH_CAUSES = {
  storm: "Ton navire a sombré corps et biens durant une violente tempête.",
  seaking: "Un Roi des Mers a englouti ton navire en un instant.",
  battle: "Tu es tombé·e au combat, l'épée à la main.",
  execution: "Capturé·e par la Marine, tu as été exécuté·e sur la place publique.",
  old_age: "Tu t'es éteint·e paisiblement, entouré·e des tiens, à un âge avancé.",
  illness: "Une maladie a eu raison de toi après une vie bien remplie.",
  betrayal: "Trahi·e par un proche, tu n'as rien vu venir.",
  drowning: "Emporté·e par les flots, ton pouvoir de fruit du démon ne t'a pas pardonné.",
  laughtale_fall: "Tu sombres corps et biens en forçant les portes de Laugh Tale, ton rêve inachevé.",
  erased_by_imu: "Tu as croisé la route d'Imu... et le monde a fait comme si tu n'avais jamais existé."
};

/* ================= FINS & MUR DES ACHIEVEMENTS ================= */

const ENDINGS_KEY = "opl_endings_v1";
const ENDINGS_CATALOG = [
  { id:"pirate_king", icon:"👑", label:"Roi des Pirates" },
  { id:"fleet_admiral", icon:"⚓", label:"Amiral en Chef" },
  { id:"battle", icon:"⚔️", label:"Tombé·e au combat" },
  { id:"execution", icon:"🪓", label:"Exécuté·e par la Marine" },
  { id:"old_age", icon:"🕯️", label:"Mort·e de vieillesse" },
  { id:"illness", icon:"💊", label:"Emporté·e par la maladie" },
  { id:"storm", icon:"🌊", label:"Perdu·e dans la tempête" },
  { id:"seaking", icon:"🐋", label:"Englouti·e par un Roi des Mers" },
  { id:"drowning", icon:"🌀", label:"Emporté·e par les flots" },
  { id:"betrayal", icon:"🗡️", label:"Trahi·e par un proche" },
  { id:"retraite_paisible", icon:"🌅", label:"Retraite paisible" },
  { id:"laughtale_fall", icon:"🌑", label:"Sombré·e aux portes de Laugh Tale" },
  { id:"imu_slayer", icon:"🌒", label:"A affronté Imu et survécu" },
  { id:"erased_by_imu", icon:"🕳️", label:"Effacé·e par Imu" }
];

function loadUnlockedEndings(){
  try{
    const raw = localStorage.getItem(ENDINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function unlockEnding(id){
  const list = loadUnlockedEndings();
  if(!list.includes(id)) list.push(id);
  try{ localStorage.setItem(ENDINGS_KEY, JSON.stringify(list)); }catch(e){}
  return list;
}

const SPECIAL_EVENTS = [
  {
    id:"wano_quest_1",
    title:"Un pays sous le joug",
    condition:()=> state.stage>=4 && state.island==="Wano" && state.age>=16 && (state.flags.wanoQuestStage||0)===0,
    text:"Wano vit sous la coupe d'un shogun tyrannique allié aux pirates de Kaido. Dans l'ombre des izakayas, on murmure qu'une résistance clandestine prépare sa revanche.",
    choices:[
      { label:"Chercher à rejoindre la résistance", sub:"Le premier pas vers une longue lutte",
        resolve(){
          state.flags.wanoQuestStage = 1;
          state.flags.wanoQuestBonus = 0;
          applyMods({charisme:2});
          addLog("Tu prends discrètement contact avec des rebelles. Ta place dans leurs rangs reste à prouver.", "good");
        }
      },
      { label:"Rester en retrait, ce n'est pas ton problème", sub:"",
        resolve(){
          addLog("Tu préfères ne pas te mêler des affaires de Wano et poursuis ta route.", "neutral");
        }
      }
    ]
  },
  {
    id:"wano_quest_2",
    title:"Une caravane à intercepter",
    condition:()=> state.stage>=4 && state.island==="Wano" && (state.flags.wanoQuestStage||0)===1,
    text:"La résistance te met à l'épreuve : une caravane de ravitaillement destinée aux forces de Kaido traverse la région à découvert.",
    choices:[
      { label:"Saboter la caravane", sub:"Risqué, mais ça prouverait ta valeur",
        resolve(){
          state.flags.wanoQuestStage = 2;
          const enemyPower = rand(30,55);
          if(Math.random() < clamp(0.5+(powerScore()-enemyPower)/180,0.2,0.9)){
            state.flags.wanoQuestBonus = (state.flags.wanoQuestBonus||0) + 1;
            state.beli += rand(500,1500);
            addLog("La caravane est neutralisée sans perte. La résistance commence à te faire confiance.", "good");
          } else {
            state.health = clamp(state.health-rand(10,20),0,100);
            addLog("L'embuscade tourne court et tu t'en sors blessé·e, sans grand résultat.", "bad");
          }
        }
      },
      { label:"Décliner, trop risqué", sub:"",
        resolve(){
          state.flags.wanoQuestStage = 2;
          state.happiness = clamp(state.happiness-3,0,100);
          addLog("Tu laisses passer l'occasion. La résistance semble déçue, mais continue de t'informer.", "neutral");
        }
      }
    ]
  },
  {
    id:"wano_quest_3",
    title:"Les clans samouraïs",
    condition:()=> state.stage>=4 && state.island==="Wano" && (state.flags.wanoQuestStage||0)===2,
    text:"Un noble déchu propose de te présenter aux chefs de clans samouraïs encore fidèles à l'ancien régime, en échange d'un service discret.",
    choices:[
      { label:"Rendre le service demandé", sub:"Coûte du Beli, mais ouvre des portes",
        resolve(){
          state.flags.wanoQuestStage = 3;
          const cost = rand(800,2000);
          if(state.beli >= cost){
            state.beli -= cost;
            state.flags.wanoQuestBonus = (state.flags.wanoQuestBonus||0) + 1;
            addLog("Le service rendu t'ouvre les portes des clans samouraïs. De nouveaux alliés rejoignent la cause.", "good");
          } else {
            addLog("Tu n'as pas les moyens de rendre ce service. L'opportunité t'échappe.", "neutral");
          }
        }
      },
      { label:"Refuser, la proposition sent le piège", sub:"",
        resolve(){
          state.flags.wanoQuestStage = 3;
          applyMods({intelligence:2});
          addLog("Ta méfiance t'épargne peut-être un piège, mais les clans restent hors de portée pour l'instant.", "neutral");
        }
      }
    ]
  },
  {
    id:"wano_quest_4",
    title:"Le dernier commandant",
    condition:()=> state.stage>=4 && state.island==="Wano" && (state.flags.wanoQuestStage||0)===3,
    text:"La résistance est presque prête. Il ne manque qu'un ancien commandant retraité, désabusé, pour rallier les derniers hésitants.",
    choices:[
      { label:"Le convaincre de reprendre les armes", sub:"Une question de conviction",
        resolve(){
          state.flags.wanoQuestStage = 4;
          if(Math.random() < clamp(0.4+state.charisme/150,0.2,0.85)){
            state.flags.wanoQuestBonus = (state.flags.wanoQuestBonus||0) + 1;
            addLog("Tes mots portent : le vieux commandant reprend les armes. La résistance est prête à frapper.", "major");
          } else {
            addLog("Le commandant reste inflexible, mais la résistance se prépare tout de même sans lui.", "neutral");
          }
        }
      },
      { label:"Laisser tomber, tu as fait ta part", sub:"",
        resolve(){
          state.flags.wanoQuestStage = 4;
          addLog("Tu laisses la résistance se débrouiller pour cette dernière étape.", "neutral");
        }
      }
    ]
  },
  {
    id:"onigashima",
    title:"La guerre d'Onigashima",
    condition:()=> state.stage===4 && state.island==="Wano" && state.age>=18 &&
      (state.hakiObs>0 || state.hakiArm>0) && ["pirate","marine","revolutionnaire"].includes(state.path),
    text:"Un déferlement de flammes et de cris embrase le ciel de Wano : la bataille d'Onigashima vient d'éclater entre les forces de Kaido et une coalition de rebelles. Voulez-vous la rejoindre ?",
    choices:[
      { label:"Rejoindre la coalition contre Kaido", sub:"Trois vagues de combat, gloire immense en cas de victoire totale",
        resolve(done){
          const bonus = state.flags.wanoQuestBonus||0;
          const questStage = state.flags.wanoQuestStage||0;
          const alliedBoost = (state.ally && state.ally.allied) ? 12 : 0;
          const basePower = questStage===0 ? 180 : clamp(170 - bonus*12 - alliedBoost, 100, 180);
          if(questStage===0){
            addLog("Tu te jettes dans la bataille seul·e, sans le soutien d'une résistance que tu as ignorée.", "neutral");
          } else if(bonus>=3){
            addLog("Les alliés que tu as rassemblés se battent à tes côtés : caravane sabotée, clans samouraïs, et le vieux commandant en renfort.", "good");
          } else if(bonus>0){
            addLog(`Une partie de la résistance que tu as aidé à bâtir combat à tes côtés (${bonus} soutien${bonus>1?'s':''}).`, "neutral");
          }
          if(alliedBoost>0){
            addLog(`${state.ally.name} se bat à tes côtés dans la bataille.`, "good");
          }
          startWarSequence({
            enemyLabel: "Un guerrier de l'équipage de Kaido",
            basePower,
            onComplete(wins){
              if(state.alive){
                if(wins>=3){
                  const gain = rand(15000,40000) + bonus*2000;
                  if(state.path==="pirate") state.bounty += gain;
                  state.beli += Math.round(gain/3);
                  state.happiness = clamp(state.happiness+15,0,100);
                  if(!state.hakiConq && Math.random()<0.35){
                    state.hakiConq = true;
                    addLog("Une pression titanesque explose en toi en pleine bataille : le Haki des Rois s'éveille !", "major");
                  }
                  addLog("Tu domines les trois vagues d'assaut et contribues directement à la chute de Kaido. Ton nom résonnera dans tout Wano.", "good");
                } else if(wins===2){
                  const gain = rand(6000,15000) + bonus*1000;
                  if(state.path==="pirate") state.bounty += gain;
                  state.beli += Math.round(gain/3);
                  addLog("Tu tiens bon face à l'essentiel de l'assaut, même si la bataille te laisse épuisé·e.", "good");
                } else if(wins===1){
                  state.happiness = clamp(state.happiness-6,0,100);
                  addLog("Tu ne remportes qu'une victoire avant de devoir te replier, la bataille bien trop intense.", "neutral");
                } else {
                  state.happiness = clamp(state.happiness-10,0,100);
                  addLog("Débordé·e dès les premiers instants, tu bats en retraite sans gloire.", "bad");
                }
              }
              done();
            }
          });
          return true;
        }
      },
      { label:"Observer à distance, hors de danger", sub:"Prudent, mais tu rates ta chance de gloire",
        resolve(){
          state.happiness = clamp(state.happiness-6,0,100);
          addLog("Tu regardes le ciel s'embraser depuis un lieu sûr, le cœur lourd de ne pas y participer.", "neutral");
        }
      }
    ]
  },
  {
    id:"marineford",
    title:"Guerre au sommet",
    condition:()=> state.stage>=2 && state.age>=18 && state.age<=50 &&
      ((state.path==="pirate" && state.bounty>50000) || (state.path==="marine" && state.marineRank>=2)),
    text:"La nouvelle tombe comme un couperet : une guerre au sommet éclate à Marineford entre la Marine et les forces d'un Empereur.",
    choices:[
      { label:"Te jeter dans la bataille", sub:"Trois vagues de combat, un affrontement historique",
        resolve(done){
          const allied = state.ally && state.ally.allied;
          if(allied) addLog(`${state.ally.name} se bat à tes côtés dans la bataille.`, "good");
          startWarSequence({
            enemyLabel: state.path==="marine" ? "Un commandant pirate de l'Empereur" : "Un vice-amiral de la Marine",
            basePower: Math.max(100, 150 - (allied?12:0)),
            onComplete(wins){
              if(state.alive){
                if(wins>=3){
                  if(state.path==="pirate"){
                    state.bounty += rand(20000,35000);
                    addLog("Tu tiens tête aux plus hauts gradés de la Marine sur les trois vagues. Ta prime s'envole.", "good");
                  } else {
                    state.marineRank = Math.min(MARINE_RANKS.length-1, state.marineRank+2);
                    addLog(`Ta bravoure exceptionnelle te vaut une double promotion : ${MARINE_RANKS[state.marineRank]} !`, "major");
                  }
                  state.happiness = clamp(state.happiness+15,0,100);
                } else if(wins===2){
                  if(state.path==="pirate") state.bounty += rand(8000,15000);
                  else state.marineRank = Math.min(MARINE_RANKS.length-1, state.marineRank+1);
                  addLog("Tu te distingues sur le champ de bataille, même si le prix à payer est lourd.", "good");
                } else if(wins===1){
                  state.happiness = clamp(state.happiness-6,0,100);
                  addLog("Tu ne tiens qu'une vague avant d'être débordé·e et de devoir te replier.", "neutral");
                } else {
                  state.happiness = clamp(state.happiness-10,0,100);
                  addLog("La bataille est trop intense : tu bats en retraite dès les premiers instants.", "bad");
                }
              }
              done();
            }
          });
          return true;
        }
      },
      { label:"Te tenir à l'écart du chaos", sub:"La prudence avant tout",
        resolve(){
          state.happiness = clamp(state.happiness-5,0,100);
          addLog("Tu choisis de ne pas te mêler à cette guerre qui ne te concerne pas directement.", "neutral");
        }
      }
    ]
  },
  {
    id:"alabasta_rebellion",
    title:"Rébellion à Alabasta",
    condition:()=> state.stage===2 && state.island==="Alabasta" && state.age>=16 && (state.path==="pirate" || state.path==="revolutionnaire"),
    text:"Le royaume d'Alabasta est au bord de la guerre civile : une organisation criminelle manipule la rébellion dans l'ombre.",
    choices:[
      { label:"Aider la famille royale à rétablir la paix", sub:"Combat contre les agitateurs",
        resolve(){
          const enemyPower = rand(40,70);
          if(Math.random()<clamp(0.5+(powerScore()-enemyPower)/180,0.15,0.9)){
            state.charisme = clamp(state.charisme+4,0,100);
            state.beli += rand(2000,5000);
            addLog("Grâce à toi, la guerre civile est évitée de justesse. Le peuple d'Alabasta te salue en héros.", "good");
          } else {
            state.health = clamp(state.health - rand(15,30), 0, 100);
            addLog("Tu es blessé·e en affrontant les meneurs de la rébellion.", "bad");
          }
        }
      },
      { label:"Ne pas s'en mêler", sub:"Ce n'est pas ton combat",
        resolve(){ addLog("Tu laisses Alabasta régler ses affaires seule et poursuis ta route.", "neutral"); }
      }
    ]
  },
  {
    id:"skypiea_trial",
    title:"L'épreuve de la Cloche d'Or",
    condition:()=> state.stage===2 && state.island==="Skypiea" && (state.force+state.vitesse)>=40,
    text:"Les prêtres de Skypiea te mettent au défi de sonner la Cloche d'Or, tout en haut du Giant Jack.",
    choices:[
      { label:"Relever le défi", sub:"Épreuve de force et d'agilité",
        resolve(){
          const score = state.force + state.vitesse + rand(-15,15);
          if(score>=55){
            state.beli += rand(3000,8000);
            state.happiness = clamp(state.happiness+12,0,100);
            if(!state.epithet){
              state.epithet = pick(EPITHETS);
              addLog(`Ton exploit résonne jusqu'en bas : on te surnomme désormais "${state.epithet}".`, "major");
            }
            addLog("La Cloche d'Or résonne dans tout le ciel ! Ton exploit devient une légende.", "good");
          } else {
            state.health = clamp(state.health - rand(10,20), 0, 100);
            addLog("Tu chutes avant d'atteindre la cloche. Douloureux, mais tu t'en sors.", "bad");
          }
        }
      },
      { label:"Décliner poliment", sub:"",
        resolve(){ addLog("Tu préfères ne pas tenter le sort et poursuis ton exploration de l'île céleste.", "neutral"); }
      }
    ]
  },
  {
    id:"fishman_tension",
    title:"Tensions à Fishman Island",
    condition:()=> state.stage>=3 && state.island==="Fishman Island",
    text:"Tu es témoin de vives tensions entre humains et hommes-poissons, exacerbées par des décennies de discrimination.",
    choices:[
      { label:"Prendre position pour l'égalité", sub:"",
        resolve(){
          state.charisme = clamp(state.charisme+3,0,100);
          if(state.path==="marine") state.repMarine -= 5;
          state.repPirate += 3;
          addLog("Ton discours marque les esprits et apaise un peu les tensions.", "good");
        }
      },
      { label:"Rester en retrait", sub:"",
        resolve(){ addLog("Tu préfères ne pas t'immiscer dans un conflit qui te dépasse.", "neutral"); }
      }
    ]
  },
  {
    id:"whole_cake_wedding",
    title:"Le piège du mariage",
    condition:()=> state.stage===4 && state.island==="Whole Cake Island" && state.path==="pirate",
    text:"Tu reçois une invitation somptueuse à un mariage organisé par une Impératrice de la piraterie. L'odeur du sucre... et du piège... flotte dans l'air.",
    choices:[
      { label:"Accepter, quitte à foncer dans le piège", sub:"Risque élevé",
        resolve(){
          const enemyPower = rand(120,180);
          if(Math.random()<clamp(0.4+(powerScore()-enemyPower)/200,0.1,0.8)){
            state.bounty += rand(8000,20000);
            addLog("Tu déjoues le piège et humilies l'Impératrice devant tout son clan. Ta prime explose.", "good");
          } else {
            state.health = clamp(state.health - rand(25,45), 0, 100);
            if(state.crew.length && Math.random()<0.3){
              const lost = state.crew.pop();
              addLog(`${lost.name} est capturé·e dans la confusion...`, "death");
            }
            addLog("Le piège se referme sur toi. Tu t'échappes de justesse, blessé·e.", "bad");
            if(state.health<=0) death("battle");
          }
        }
      },
      { label:"Décliner et fuir discrètement", sub:"",
        resolve(){ addLog("Tu flaires le piège à temps et lèves l'ancre avant la cérémonie.", "neutral"); }
      }
    ]
  },
  {
    id:"dressrosa_liberation",
    title:"La libération de Dressrosa",
    condition:()=> state.stage===4 && state.island==="Dressrosa" && (state.path==="pirate" || state.path==="revolutionnaire") && state.charisme>=25,
    text:"À Dressrosa, un roi tyrannique transforme ses opposants politiques en jouets vivants depuis des années.",
    choices:[
      { label:"Aider à libérer le royaume", sub:"Grand combat, grande cause",
        resolve(){
          const enemyPower = rand(100,160);
          if(Math.random()<clamp(0.45+(powerScore()-enemyPower)/200,0.15,0.85)){
            state.charisme = clamp(state.charisme+6,0,100);
            if(state.path==="pirate") state.bounty += rand(6000,15000);
            addLog("Le royaume est libéré ! Les habitants, rendus à leur forme humaine, célèbrent ton nom.", "good");
          } else {
            state.health = clamp(state.health - rand(20,35), 0, 100);
            addLog("Le combat contre les hommes de main du roi tourne mal pour toi.", "bad");
            if(state.health<=0) death("battle");
          }
        }
      },
      { label:"Passer ton chemin", sub:"",
        resolve(){
          state.happiness = clamp(state.happiness-4,0,100);
          addLog("Tu quittes Dressrosa, hanté·e par les jouets aux regards vides.", "neutral");
        }
      }
    ]
  },
  {
    id:"marine_village_order",
    title:"Un ordre controversé",
    condition:()=> state.path==="marine" && state.age>=19 && state.marineRank>=1,
    text:"Un supérieur t'ordonne de réprimer un village civil accusé, sans preuve solide, d'héberger des pirates.",
    choices:[
      { label:"Obéir aux ordres", sub:"Discipline avant tout",
        resolve(){
          if(Math.random()<0.4) state.marineRank = Math.min(MARINE_RANKS.length-1, state.marineRank+1);
          state.happiness = clamp(state.happiness-10,0,100);
          state.repPirate -= 8;
          addLog("Tu exécutes les ordres. L'opération renforce ta position au sein de la hiérarchie, mais te laisse un goût amer.", "neutral");
        }
      },
      { label:"Refuser et protéger les civils", sub:"Risque de cour martiale",
        resolve(){
          state.happiness = clamp(state.happiness+10,0,100);
          if(Math.random()<0.3){
            state.marineRank = Math.max(0, state.marineRank-1);
            addLog("Ton refus te vaut un blâme sévère et une rétrogradation.", "bad");
          } else {
            addLog("Ton refus fait scandale, mais ton intégrité forcera plus tard le respect.", "good");
          }
        }
      }
    ]
  },
  {
    id:"revolutionary_slaves",
    title:"Mission d'infiltration",
    condition:()=> state.path==="revolutionnaire" && state.stage>=3 && state.charisme>=30,
    text:"L'Armée Révolutionnaire te confie une mission d'infiltration pour libérer des esclaves détenus par un noble influent.",
    choices:[
      { label:"Accepter la mission", sub:"Extrêmement risqué",
        resolve(){
          const enemyPower = rand(90,150);
          if(Math.random()<clamp(0.4+(powerScore()-enemyPower)/190,0.1,0.85)){
            state.charisme = clamp(state.charisme+8,0,100);
            state.beli += rand(1000,3000);
            addLog("La mission est un succès : des dizaines de personnes retrouvent leur liberté grâce à toi.", "good");
          } else {
            state.health = clamp(state.health - rand(25,40), 0, 100);
            addLog("L'opération tourne mal, tu t'extrais de justesse d'une garde renforcée.", "bad");
            if(state.health<=0 || Math.random()<0.1) death("execution");
          }
        }
      },
      { label:"Refuser, trop dangereux", sub:"",
        resolve(){
          state.happiness = clamp(state.happiness-5,0,100);
          addLog("Tu déclines la mission. Un·e camarade s'en chargera à ta place.", "neutral");
        }
      }
    ]
  },
  {
    id:"road_poneglyph",
    title:"Rumeur de Poneglyphe",
    condition:()=> state.path==="pirate" && state.stage===4 && powerScore()>=150,
    text:"Une rumeur insistante évoque la présence d'un Poneglyphe Route caché sur une île voisine, une clé vers Laugh Tale.",
    choices:[
      { label:"Partir à sa recherche", sub:"Long et incertain, mais précieux",
        resolve(){
          if(Math.random()<0.6){
            state.flags.hasRoadPoneglyph = true;
            addLog("Après des semaines de fouilles, tu mets la main sur le Poneglyphe Route ! Laugh Tale n'a jamais semblé aussi proche.", "major");
          } else {
            state.happiness = clamp(state.happiness-8,0,100);
            addLog("Après des semaines de recherches infructueuses, tu rentres bredouille.", "bad");
          }
        }
      },
      { label:"Continuer ta route sans t'attarder", sub:"",
        resolve(){ addLog("Tu laisses cette rumeur aux autres et poursuis ton chemin.", "neutral"); }
      }
    ]
  },

  /* ---- Whiskey Peak ---- */
  {
    id:"whiskeypeak_1",
    title:"Un accueil trop chaleureux",
    condition:()=> state.stage>=2 && state.island==="Whiskey Peak" && (state.flags.whiskeypeakStage||0)===0 && state.path==="pirate",
    text:"Le village de Whiskey Peak t'accueille en héros : festin, musique, hospitalité débordante. Étrangement chaleureux pour un lieu réputé si désert.",
    choices:[
      { label:"Profiter de la fête sans te méfier", sub:"",
        resolve(){ state.flags.whiskeypeakStage=1; applyMods({happiness:8}); addLog("Tu te laisses porter par la fête, insouciant·e.", "neutral"); } },
      { label:"Rester sur tes gardes, l'accueil sonne faux", sub:"",
        resolve(){ state.flags.whiskeypeakStage=1; state.flags.whiskeypeakWary=true; applyMods({intelligence:2}); addLog("Quelque chose cloche. Tu restes discrètement en alerte durant la soirée.", "neutral"); } }
    ]
  },
  {
    id:"whiskeypeak_2",
    title:"Le piège se referme",
    condition:()=> state.stage>=2 && state.island==="Whiskey Peak" && (state.flags.whiskeypeakStage||0)===1,
    text:"En pleine nuit, les villageois révèlent leur vraie nature : des chasseurs de primes de l'organisation Baroque Works, armés jusqu'aux dents, encerclent la place.",
    choices:[
      { label:"Te battre pour t'échapper", sub:"Combat",
        resolve(done){
          const enemyPower = rand(25,45) - (state.flags.whiskeypeakWary?10:0);
          startBattle(Math.max(15,enemyPower), "des chasseurs de primes de Baroque Works", (outcome)=>{ done(); });
          return true;
        }
      },
      { label:"Fuir dans la confusion", sub:"Chance basée sur ta Vitesse",
        resolve(){
          if(Math.random() < clamp(0.4 + state.vitesse/150 + (state.flags.whiskeypeakWary?0.15:0), 0.15, 0.9)){
            addLog("Tu profites de la confusion pour t'éclipser sans encombre.", "good");
          } else {
            state.health = clamp(state.health-rand(10,20),0,100);
            addLog("Rattrapé·e avant d'avoir pu fuir, tu t'en sors avec quelques blessures.", "bad");
          }
        }
      }
    ]
  },

  /* ---- Little Garden ---- */
  {
    id:"littlegarden_1",
    title:"Le duel des géants",
    condition:()=> state.stage>=2 && state.island==="Little Garden" && (state.flags.littlegardenStage||0)===0,
    text:"Sur cette île oubliée du temps où rôdent des créatures préhistoriques, deux géants s'affrontent dans un duel qui dure depuis des décennies, par respect mutuel.",
    choices:[
      { label:"Aller à leur rencontre, impressionné·e", sub:"",
        resolve(){ state.flags.littlegardenStage=1; state.flags.littlegardenAlly=true; applyMods({charisme:2}); addLog("Les géants apprécient ton audace et t'accueillent sans hostilité.", "good"); } },
      { label:"Les éviter et explorer discrètement l'île", sub:"",
        resolve(){ state.flags.littlegardenStage=1; applyMods({chance:2}); addLog("Tu préfères observer de loin ce duel titanesque.", "neutral"); } }
    ]
  },
  {
    id:"littlegarden_2",
    title:"Rugissement dans la jungle",
    condition:()=> state.stage>=2 && state.island==="Little Garden" && (state.flags.littlegardenStage||0)===1,
    text:"Un dinosaure féroce surgit soudainement, menaçant de mettre fin au duel séculaire des géants et de te dévorer au passage.",
    choices:[
      { label:"Affronter la bête", sub:"Combat, les géants peuvent intervenir",
        resolve(done){
          const enemyPower = rand(35,60) - (state.flags.littlegardenAlly?12:0);
          startBattle(Math.max(20,enemyPower), "un dinosaure féroce", (outcome)=>{
            if(outcome==="victory" && state.flags.littlegardenAlly){
              addLog("Les géants saluent ta bravoure d'un signe de tête respectueux.", "good");
            }
            done();
          });
          return true;
        }
      },
      { label:"Fuir vers la côte", sub:"",
        resolve(){ addLog("Tu détales vers le rivage, laissant la bête à sa jungle.", "neutral"); } }
    ]
  },

  /* ---- Drum Island ---- */
  {
    id:"drumisland_1",
    title:"L'épidémie du royaume gelé",
    condition:()=> state.stage>=2 && state.island==="Drum Island" && (state.flags.drumislandStage||0)===0,
    text:"Un village de l'île enneigée de Drum souffre d'une épidémie. Les habitants implorent l'aide de quiconque pourrait atteindre les herbes médicinales en haute montagne.",
    choices:[
      { label:"Partir chercher les herbes en montagne", sub:"Épreuve d'Endurance dans le froid",
        resolve(){
          state.flags.drumislandStage=1;
          if(Math.random() < clamp(0.4+state.endurance/150,0.2,0.85)){
            state.flags.drumislandCure=true;
            addLog("Après une ascension glaciale, tu redescends avec les herbes rares.", "good");
          } else {
            state.health = clamp(state.health-rand(10,20),0,100);
            addLog("La montagne est impitoyable : tu rentres bredouille et épuisé·e.", "bad");
          }
        }
      },
      { label:"Continuer ta route, ce n'est pas ton problème", sub:"",
        resolve(){ state.flags.drumislandStage=1; applyMods({happiness:-3}); addLog("Tu tournes le dos au village, non sans un pincement de culpabilité.", "neutral"); } }
    ]
  },
  {
    id:"drumisland_2",
    title:"Le sort du village",
    condition:()=> state.stage>=2 && state.island==="Drum Island" && (state.flags.drumislandStage||0)===1,
    text:"De retour au village, le moment est venu de voir ce que tes efforts — ou ton absence — auront changé.",
    choices:[
      { label:"Aider les villageois du mieux que tu peux", sub:"",
        resolve(){
          if(state.flags.drumislandCure){
            state.beli += rand(2000,5000);
            applyMods({charisme:3, happiness:10});
            addLog("Le remède sauve le village. Ta légende commence à se répandre sur l'île.", "good");
          } else {
            applyMods({happiness:4});
            addLog("Sans remède, tu ne peux qu'apporter un peu de réconfort aux habitants.", "neutral");
          }
        }
      },
      { label:"Repartir sans t'attarder", sub:"",
        resolve(){ applyMods({happiness:-4}); addLog("Tu quittes Drum Island sans un regard en arrière.", "neutral"); } }
    ]
  },

  /* ---- Water Seven ---- */
  {
    id:"waterseven_1",
    title:"Plans volés",
    condition:()=> state.stage>=2 && state.island==="Water Seven" && (state.flags.watersevenStage||0)===0 && state.path==="pirate",
    text:"Le grand chantier naval de Water Seven grouille d'activité. Le maître charpentier cherche des bras solides pour récupérer des plans volés par des rivaux.",
    choices:[
      { label:"Aider à récupérer les plans", sub:"Épreuve de Force et de Vitesse",
        resolve(){
          state.flags.watersevenStage=1;
          if(Math.random() < clamp(0.35+(state.force+state.vitesse)/220,0.2,0.85)){
            state.flags.watersevenFavor=true;
            addLog("Les plans sont récupérés sans accroc. Le charpentier n'oubliera pas ce service.", "good");
          } else {
            state.health = clamp(state.health-rand(8,16),0,100);
            addLog("La récupération tourne mal, mais tu t'en sors avec seulement quelques bleus.", "bad");
          }
        }
      },
      { label:"Décliner, tu as tes propres affaires", sub:"",
        resolve(){ state.flags.watersevenStage=1; addLog("Tu laisses le chantier naval régler ses affaires seul.", "neutral"); } }
    ]
  },
  {
    id:"waterseven_2",
    title:"La faveur du chantier naval",
    condition:()=> state.stage>=2 && state.island==="Water Seven" && (state.flags.watersevenStage||0)===1,
    text:"Le chantier naval de Water Seven est prêt à te faire une offre, à la hauteur du service que tu lui as rendu — ou non.",
    choices:[
      { label:"Négocier une refonte de ton navire", sub:"",
        resolve(){
          if(state.flags.watersevenFavor && state.ship.tier < SHIP_TIERS.length-1){
            state.ship.tier++;
            addLog(`Reconnaissants, les charpentiers t'offrent une refonte complète : ton navire devient un(e) ${SHIP_TIERS[state.ship.tier].name} !`, "major");
          } else if(state.flags.watersevenFavor){
            const gain = rand(3000,8000);
            state.beli += gain;
            addLog(`Ton navire est déjà au sommet de leur art ; ils t'offrent plutôt ${fmt(gain)} Beli de matériel.`, "good");
          } else {
            const gain = rand(300,900);
            state.beli += gain;
            addLog(`Sans service rendu, tu n'obtiens qu'une remise modeste : ${fmt(gain)} Beli de matériel.`, "neutral");
          }
        }
      },
      { label:"Repartir sans rien demander", sub:"",
        resolve(){ addLog("Tu quittes Water Seven sans solliciter le chantier naval.", "neutral"); } }
    ]
  },

  /* ---- Enies Lobby ---- */
  {
    id:"enieslobby_1",
    title:"Un allié capturé",
    condition:()=> state.stage>=2 && state.island==="Enies Lobby" && (state.flags.enieslobbyStage||0)===0 && ["pirate","revolutionnaire"].includes(state.path),
    text:"Tu apprends qu'un allié a été capturé par les agents du gouvernement et retenu à Enies Lobby, bastion de la Justice, en attente d'un tribunal expéditif.",
    choices:[
      { label:"Préparer un plan d'évasion", sub:"",
        resolve(){ state.flags.enieslobbyStage=1; state.flags.enieslobbyPrepped=true; applyMods({intelligence:2}); addLog("Tu étudies les rondes des gardes et prépares méticuleusement ton coup.", "neutral"); } },
      { label:"Laisser faire, trop risqué de défier le Gouvernement", sub:"",
        resolve(){ state.flags.enieslobbyStage=1; applyMods({happiness:-5}); addLog("Tu renonces à intervenir, non sans remords.", "neutral"); } }
    ]
  },
  {
    id:"enieslobby_2",
    title:"L'assaut d'Enies Lobby",
    condition:()=> state.stage>=2 && state.island==="Enies Lobby" && (state.flags.enieslobbyStage||0)===1,
    text:"Le moment est venu d'agir, ou de renoncer définitivement au sort de ton allié.",
    choices:[
      { label:"Infiltrer Enies Lobby pour le libérer", sub:"Combat contre les agents du CP",
        resolve(done){
          const enemyPower = rand(50,85) - (state.flags.enieslobbyPrepped?15:0);
          startBattle(Math.max(30,enemyPower), "des agents du Cipher Pol", (outcome)=>{
            if(outcome==="victory"){
              if(state.path==="pirate" && state.crew.length<SHIP_TIERS[state.ship.tier].capacity){
                const roleData = pick(CREW_ROLES);
                const member = { name: pick(CREW_FIRST), role: roleData.role, power: rand(15,30), loyalty: rand(70,95) };
                state.crew.push(member);
                addLog(`Libéré·e, ${member.name} rejoint ton équipage par gratitude, en tant que ${member.role.toLowerCase()}.`, "good");
              } else {
                state.beli += rand(3000,7000);
                addLog("Ton allié est libéré et t'offre tout ce qu'il possède en remerciement.", "good");
              }
            } else {
              state.repMarine -= 10;
              addLog("L'assaut échoue. Ta réputation auprès de la Marine en pâtit sérieusement.", "bad");
            }
            done();
          });
          return true;
        }
      },
      { label:"Renoncer", sub:"",
        resolve(){ applyMods({happiness:-8}); addLog("Tu abandonnes ton allié à son sort. Le poids de ce choix te suit longtemps.", "bad"); } }
    ]
  },

  /* ---- Thriller Bark ---- */
  {
    id:"thrillerbark_1",
    title:"Le navire-île hanté",
    condition:()=> state.stage>=2 && state.island==="Thriller Bark" && (state.flags.thrillerbarkStage||0)===0,
    text:"Un brouillard épais et une atmosphère glaçante enveloppent ce navire-île gigantesque. Des ombres semblent se détacher des passants et s'évanouir dans la nuit.",
    choices:[
      { label:"Enquêter sur ce phénomène", sub:"",
        resolve(){ state.flags.thrillerbarkStage=1; state.flags.thrillerbarkBrave=true; applyMods({chance:2}); addLog("Ta curiosité l'emporte sur ta peur, et tu suis les ombres jusqu'à leur source.", "neutral"); } },
      { label:"Fuir cette île maudite au plus vite", sub:"",
        resolve(){ state.flags.thrillerbarkStage=1; applyMods({happiness:4}); addLog("Tu préfères ne rien savoir et quittes les lieux au plus vite.", "neutral"); } }
    ]
  },
  {
    id:"thrillerbark_2",
    title:"Le voleur d'ombres",
    condition:()=> state.stage>=2 && state.island==="Thriller Bark" && (state.flags.thrillerbarkStage||0)===1,
    text:"Un savant fou manipulateur d'ombres surgit de la brume, prêt à voler la tienne pour grossir son armée de zombies.",
    choices:[
      { label:"Combattre pour protéger ton ombre", sub:"Combat",
        resolve(done){
          const enemyPower = rand(40,70) - (state.flags.thrillerbarkBrave?10:0);
          startBattle(Math.max(25,enemyPower), "un savant manipulateur d'ombres", (outcome)=>{
            if(outcome==="victory" && !state.epithet){
              state.epithet = pick(EPITHETS);
              addLog(`Ta victoire sur cette créature de cauchemar te vaut un surnom : "${state.epithet}".`, "major");
            }
            done();
          });
          return true;
        }
      },
      { label:"Tenter de fuir le navire", sub:"Chance basée sur ta Vitesse",
        resolve(){
          if(Math.random() < clamp(0.4+state.vitesse/150,0.2,0.85)){
            addLog("Tu regagnes ton navire à temps, ombre intacte.", "good");
          } else {
            if(state.crew.length && Math.random()<0.15){
              const lost = state.crew.pop();
              addLog(`Dans la panique, ${lost.name} disparaît dans la brume, son ombre volée.`, "death");
            } else {
              state.health = clamp(state.health-rand(10,18),0,100);
              addLog("Tu t'échappes de justesse, mais non sans dommages.", "bad");
            }
          }
        }
      }
    ]
  },

  /* ---- Punk Hazard ---- */
  {
    id:"punkhazard_1",
    title:"Le laboratoire clandestin",
    condition:()=> state.stage>=4 && state.island==="Punk Hazard" && (state.flags.punkhazardStage||0)===0,
    text:"Sur cette île à moitié gelée, moitié brûlante, tu découvres les vestiges d'un laboratoire clandestin où des enfants semblent retenus prisonniers.",
    choices:[
      { label:"Explorer le laboratoire", sub:"",
        resolve(){ state.flags.punkhazardStage=1; state.flags.punkhazardScout=true; applyMods({intelligence:2}); addLog("Tu repères discrètement les issues et les points faibles de la garde.", "neutral"); } },
      { label:"T'éloigner, ce lieu est trop dangereux", sub:"",
        resolve(){ state.flags.punkhazardStage=1; addLog("Tu préfères ne pas t'attarder près de ce lieu inquiétant.", "neutral"); } }
    ]
  },
  {
    id:"punkhazard_2",
    title:"La libération des prisonniers",
    condition:()=> state.stage>=4 && state.island==="Punk Hazard" && (state.flags.punkhazardStage||0)===1,
    text:"Les gardes du laboratoire te repèrent : c'est le moment d'agir pour libérer les enfants prisonniers, ou de partir sans intervenir.",
    choices:[
      { label:"Affronter les gardes et libérer les enfants", sub:"Combat",
        resolve(done){
          const enemyPower = rand(60,100) - (state.flags.punkhazardScout?15:0);
          startBattle(Math.max(35,enemyPower), "les gardes du laboratoire", (outcome)=>{
            if(outcome==="victory"){
              applyMods({happiness:15, charisme:3});
              state.beli += rand(2000,5000);
              if(!state.epithet){ state.epithet = pick(EPITHETS); addLog(`Ce sauvetage éclatant te vaut un surnom : "${state.epithet}".`, "major"); }
              addLog("Les enfants sont libérés. Leur gratitude te réchauffe le cœur.", "good");
            }
            done();
          });
          return true;
        }
      },
      { label:"Partir sans intervenir", sub:"",
        resolve(){ applyMods({happiness:-10}); addLog("Tu quittes Punk Hazard sans intervenir, hanté·e par ce que tu as vu.", "bad"); } }
    ]
  },

  /* ---- Zou ---- */
  {
    id:"zou_1",
    title:"L'île sur le dos de l'éléphant",
    condition:()=> state.stage>=4 && state.island==="Zou" && (state.flags.zouStage||0)===0,
    text:"Zou, l'île portée par un éléphant géant millénaire, abrite le peuple mink. Des rumeurs annoncent une attaque imminente contre leur sanctuaire.",
    choices:[
      { label:"Proposer ton aide aux minks", sub:"",
        resolve(){ state.flags.zouStage=1; state.flags.zouAlly=true; applyMods({charisme:2}); addLog("Les minks accueillent ta proposition avec une confiance prudente.", "good"); } },
      { label:"Rester à l'écart des affaires du peuple mink", sub:"",
        resolve(){ state.flags.zouStage=1; addLog("Tu préfères ne pas t'impliquer dans les affaires de Zou.", "neutral"); } }
    ]
  },
  {
    id:"zou_2",
    title:"L'assaut sur Zou",
    condition:()=> state.stage>=4 && state.island==="Zou" && (state.flags.zouStage||0)===1,
    text:"L'attaque contre Zou commence : des assaillants déferlent sur le dos de l'éléphant géant, décidés à piller le sanctuaire mink.",
    choices:[
      { label:"Défendre Zou aux côtés des minks", sub:"Combat",
        resolve(done){
          const enemyPower = rand(55,90) - (state.flags.zouAlly?15:0);
          startBattle(Math.max(30,enemyPower), "des pillards venus attaquer Zou", (outcome)=>{
            if(outcome==="victory"){
              state.beli += rand(2000,6000);
              applyMods({happiness:10});
              addLog("Zou est sauvée. Le peuple mink célèbre ta bravoure dans tout le sanctuaire.", "good");
            }
            done();
          });
          return true;
        }
      },
      { label:"Te mettre à l'abri", sub:"",
        resolve(){ applyMods({happiness:-5}); addLog("Tu te réfugies à l'écart pendant que Zou affronte seule les assaillants.", "neutral"); } }
    ]
  },

  /* ---- Elbaf ---- */
  {
    id:"elbaf_1",
    title:"Le jugement du vétéran",
    condition:()=> state.stage>=4 && state.island==="Elbaf" && (state.flags.elbafStage||0)===0,
    text:"Elbaf, la terre des guerriers géants, ne respecte que la force et l'honneur. Un vétéran te toise, prêt à juger si tu mérites qu'on t'adresse la parole.",
    choices:[
      { label:"Relever son défi avec fierté", sub:"",
        resolve(){ state.flags.elbafStage=1; state.flags.elbafRespect=true; applyMods({force:2}); addLog("Le vétéran approuve ton audace d'un grognement satisfait.", "good"); } },
      { label:"Décliner poliment, prudence est mère de sûreté", sub:"",
        resolve(){ state.flags.elbafStage=1; addLog("Le vétéran hausse les épaules, indifférent à ta prudence.", "neutral"); } }
    ]
  },
  {
    id:"elbaf_2",
    title:"Le grand tournoi",
    condition:()=> state.stage>=4 && state.island==="Elbaf" && (state.flags.elbafStage||0)===1,
    text:"Les guerriers d'Elbaf organisent un grand tournoi. Y participer pourrait forger ta légende... ou te briser.",
    choices:[
      { label:"Participer au tournoi", sub:"Combat",
        resolve(done){
          const enemyPower = rand(50,85) - (state.flags.elbafRespect?12:0);
          startBattle(Math.max(30,enemyPower), "un champion guerrier d'Elbaf", (outcome)=>{
            if(outcome==="victory"){
              applyMods({force:3, happiness:12});
              if(!state.epithet){ state.epithet = pick(EPITHETS); addLog(`Ta victoire au tournoi d'Elbaf te vaut un surnom : "${state.epithet}".`, "major"); }
              addLog("Tu remportes le tournoi sous les acclamations des géants. Ta légende grandit.", "good");
            } else if(state.alive){
              applyMods({happiness:5});
              addLog("Vaincu·e mais debout, tu gagnes malgré tout le respect des géants pour ton courage.", "neutral");
            }
            done();
          });
          return true;
        }
      },
      { label:"Observer depuis les gradins", sub:"",
        resolve(){ addLog("Tu préfères observer le tournoi plutôt que d'y risquer ta peau.", "neutral"); } }
    ]
  },

  {
    id:"ally_offer",
    title:"Une rencontre providentielle",
    condition:()=> ["pirate","marine","chasseur","revolutionnaire"].includes(state.path) && state.age>=18 && state.stage>=2 && !state.ally,
    text:"Tu croises la route d'un individu au potentiel impressionnant. Vos objectifs semblent alignés — pour un temps, du moins.",
    choices:[
      { label:"Proposer une alliance", sub:"",
        resolve(){
          state.ally = { name: randomName(), epithet: pick(EPITHETS), allied:true };
          applyMods({charisme:2});
          addLog(`${state.ally.name} "${state.ally.epithet}" accepte de faire équipe avec toi. Vous vous soutiendrez dans les grandes batailles à venir.`, "major");
        }
      },
      { label:"Décliner, tu préfères rester libre", sub:"",
        resolve(){ addLog("Tu préfères poursuivre seul·e ta route.", "neutral"); } }
    ]
  },

  /* ---- Quête secrète : Imu ---- */
  {
    id:"marigeoise_1",
    title:"Une rumeur insensée",
    condition:()=> state.path==="pirate" && state.stage>=4 && state.age>=20 && powerScore()>=200 && !state.flags.marigeoiseStage && Math.random()<0.15,
    text:"Dans les bas-fonds d'un port oublié, un vieil informateur te glisse à l'oreille une rumeur insensée : Mary Geoise, la Terre Sainte où siège le Gouvernement Mondial, ne serait pas gardée aussi hermétiquement qu'on le prétend...",
    choices:[
      { label:"Tenter de t'infiltrer à Mary Geoise", sub:"Un secret que peu ont approché — et dont peu sont revenus",
        resolve(){
          state.flags.marigeoiseStage = 1;
          addLog("Tu prends la lourde décision de suivre cette rumeur jusqu'au bout du monde.", "major");
        }
      },
      { label:"Ignorer cette folie", sub:"",
        resolve(){ addLog("Tu préfères ne pas tenter le diable et laisses cette rumeur mourir d'elle-même.", "neutral"); } }
    ]
  },
  {
    id:"marigeoise_2",
    title:"Le Conseil des Cinq",
    condition:()=> (state.flags.marigeoiseStage||0)===1,
    text:"Dissimulé·e dans les hauteurs de la Terre Sainte, tu observes le Conseil des Cinq Anciens en pleine délibération. Puis, dans l'ombre derrière eux, tu perçois une masse sombre, informe, que rien ni personne ne semble pouvoir nommer. Un frisson glacial te parcourt l'échine.",
    choices:[
      { label:"Continuer d'observer, hypnotisé·e", sub:"",
        resolve(done){
          addLog("Une sentinelle t'aperçoit soudain. L'alarme retentit dans toute la Terre Sainte !", "major");
          startMarigeoiseEscape(done, false);
          return true;
        }
      },
      { label:"Fuir immédiatement, terrifié·e", sub:"Plus prudent",
        resolve(done){
          addLog("Tu ne demandes pas ton reste et amorces ta fuite sur-le-champ.", "neutral");
          startMarigeoiseEscape(done, true);
          return true;
        }
      }
    ]
  },
  {
    id:"marigeoise_3",
    title:"L'ombre de la Terre Sainte",
    condition:()=> (state.flags.marigeoiseStage||0)===2 && state.island==="Elbaf" && (state.flags.elbafStage||0)>=1,
    text:"Alors que tu penses avoir semé tes poursuivants pour de bon, une présence glaçante t'attend sur les rivages d'Elbaf. La masse sombre que tu as aperçue à Mary Geoise... c'est Imu en personne, venu·e effacer ce que tu as vu.",
    choices:[
      { label:"Affronter Imu avec ton équipage", sub:"Le combat de ta vie",
        resolve(done){
          state.flags.marigeoiseStage = 3;
          let enemyPower = clamp(Math.round(powerScore()*0.4), 110, 170);
          if(state.crew.length) enemyPower -= Math.min(30, state.crew.length*8);
          if(state.ally && !state.ally.defeated) enemyPower -= 15;
          enemyPower = Math.max(90, enemyPower);
          addLog(state.crew.length || (state.ally && !state.ally.defeated)
            ? "Ton équipage et tes alliés se rangent à tes côtés face à l'impensable."
            : "Seul·e face à l'impensable, tu te prépares au combat.", "major");
          startBattle(enemyPower, "Imu", (outcome)=>{
            if(outcome==="victory"){
              const gain = rand(20000,50000);
              state.beli += gain;
              state.bounty += rand(50000,150000);
              unlockEnding("imu_slayer");
              addLog(`Tu repousses Imu dans les ténèbres dont il n'aurait jamais dû sortir. Le monde ne saura jamais ce qui s'est joué ici, mais toi, tu le sais : tu rafles ${fmt(gain)} Beli et une nouvelle légende naît. 🌒 Exploit débloqué : "A affronté Imu et survécu".`, "major");
            } else {
              addLog("Imu se joue de toi sans effort apparent. Tu t'en sors à peine vivant·e, l'esprit marqué à jamais.", "bad");
              if(state.alive && Math.random()<0.3){
                death("erased_by_imu");
              }
            }
            done();
          });
          return true;
        }
      },
      { label:"Tenter de fuir, la peur au ventre", sub:"Plus sûr, mais tu ne sauras jamais ce que tu aurais pu accomplir",
        resolve(){
          state.flags.marigeoiseStage = 3;
          const fleeChance = clamp(0.3 + state.vitesse/200, 0.15, 0.7);
          if(Math.random()<fleeChance){
            addLog("Tu parviens à fuir, le cœur battant, laissant derrière toi une question qui te hantera : et si tu avais tenté ta chance ?", "neutral");
          } else {
            const dmg = rand(20,40);
            state.health = clamp(state.health-dmg, 0, 100);
            addLog(`Imu te rattrape sans effort et t'inflige une blessure cinglante avant de te laisser partir, comme par mépris (-${dmg} PV).`, "bad");
          }
        }
      }
    ]
  }
];

const CHILD_SPECIAL_EVENTS = [
  {
    id:"child_marine_capture",
    title:"Une arrestation brutale",
    condition:()=> state.age>=5 && state.age<=14,
    text:"Des navires de la Marine accostent sans prévenir. Des soldats accusent ta famille de complicité avec des pirates et emmènent tes parents sous tes yeux, menottés.",
    choices:[
      { label:"Supplier les soldats de les relâcher", sub:"Risqué, mais tu ne peux pas rester sans rien faire",
        resolve(){
          if(Math.random()<0.4){
            addLog("Ton insistance touche un officier hésitant : tes parents sont finalement relâchés, sous surveillance.", "good");
            applyMods({charisme:3, happiness:8});
          } else {
            addLog("Les soldats t'écartent sans ménagement. Tes parents sont emmenés malgré tes cris.", "bad");
            applyMods({happiness:-15});
            state.repPirate += 5;
          }
        }
      },
      { label:"Te cacher, impuissant·e", sub:"",
        resolve(){
          addLog("Tu regardes la scène depuis ta cachette, le cœur brisé par ton impuissance. Ce jour restera gravé en toi.", "bad");
          applyMods({happiness:-10, chance:3});
          state.repPirate += 3;
        }
      }
    ]
  },
  {
    id:"child_pirate_takeover",
    title:"Le village sous contrôle pirate",
    condition:()=> state.age>=4 && state.age<=15,
    text:"Un équipage de pirates débarque et prend le contrôle du village pendant plusieurs semaines, pillant les réserves et effrayant les habitants.",
    choices:[
      { label:"Observer les pirates avec fascination plutôt que peur", sub:"",
        resolve(){
          addLog("Loin d'être terrifié·e, tu observes leur assurance et leur liberté avec une fascination grandissante.", "neutral");
          applyMods({charisme:3, chance:3});
        }
      },
      { label:"Te cacher avec ta famille jusqu'à leur départ", sub:"",
        resolve(){
          addLog("Tu restes caché·e de longues semaines, rongé·e par la peur, jusqu'à ce que les pirates repartent enfin.", "neutral");
          applyMods({endurance:3, happiness:-6});
        }
      }
    ]
  },
  {
    id:"child_devilfruit",
    title:"Un fruit étrange",
    condition:()=> state.age>=6 && state.age<=12 && !state.devilFruit,
    text:"En jouant près du port, tu trouves un fruit étrange à l'écorce spiralée, abandonné dans une caisse défoncée.",
    choices:[
      { label:"Le manger, intrigué·e", sub:"Un choix qui pourrait tout changer",
        resolve(){
          const fruit = pick(DEVIL_FRUITS);
          state.devilFruit = fruit;
          applyMods(fruit.mods);
          applyMods({endurance:-3});
          addLog(`Sans réfléchir, tu croques dedans. Un goût infect... et une sensation étrange t'envahit : tu viens de manger le ${fruit.name} (${fruit.type}) ! ${fruit.desc}`, "major");
        }
      },
      { label:"Le laisser, ça a l'air dangereux", sub:"",
        resolve(){
          addLog("Ta prudence l'emporte : tu laisses ce fruit suspect là où tu l'as trouvé.", "neutral");
          applyMods({intelligence:2});
        }
      }
    ]
  },
  {
    id:"child_mentor",
    title:"Un vieux loup de mer",
    condition:()=> state.age>=8 && state.age<=15,
    text:"Un vieux marin retraité, épuisé par des décennies en mer, s'installe près de chez toi. Il propose de t'enseigner ce qu'il sait, à condition que tu sois sérieux·se.",
    choices:[
      { label:"Accepter son enseignement", sub:"Entraînement exigeant",
        resolve(){
          addLog("Le vieux marin t'enseigne sans relâche pendant des mois. Ses leçons resteront gravées en toi.", "good");
          applyMods({force:4, intelligence:3, happiness:-3});
        }
      },
      { label:"Décliner, tu préfères rester avec tes amis", sub:"",
        resolve(){
          addLog("Tu préfères profiter de ton enfance plutôt que de t'astreindre à un entraînement strict.", "neutral");
          applyMods({charisme:2, happiness:5});
        }
      }
    ]
  }
];

const DISCOVERY_EVENTS = [
  {
    id:"haki_awaken",
    condition:()=> state.hakiObs===0 && state.hakiArm===0 && state.force>=25,
    resolve(){
      if(Math.random()<0.5){
        state.hakiObs = rand(8,15);
        addLog("Une intuition fulgurante t'envahit en plein effort : tu perçois soudain les présences et intentions autour de toi. Le Haki de l'Observation s'éveille en toi !", "major");
      } else {
        state.hakiArm = rand(8,15);
        addLog("Ton corps se durcit d'une force invisible en plein effort : le Haki de l'Armement s'éveille en toi !", "major");
      }
    }
  },
  {
    id:"poneglyph_fragment",
    condition:()=> state.stage>=1 && state.intelligence>=25,
    resolve(){
      state.flags.poneglyphFragments = (state.flags.poneglyphFragments||0) + 1;
      const gain = rand(1500,4000);
      state.beli += gain;
      state.intelligence = clamp(state.intelligence+1,0,100);
      addLog(`Tu découvres un fragment de Poneglyphe gravé d'une écriture ancienne. Son étude t'apporte ${fmt(gain)} Beli et de précieuses connaissances.`, "good");
      if(!state.flags.hasRoadPoneglyph && state.flags.poneglyphFragments>=3){
        state.flags.hasRoadPoneglyph = true;
        addLog("En recoupant tes fragments, tu réalises qu'ils forment ensemble un Poneglyphe Route complet ! Laugh Tale n'a jamais semblé aussi proche.", "major");
      }
    }
  },
  {
    id:"treasure_cache",
    condition:()=> true,
    resolve(){
      const danger = currentStage().danger;
      const gain = rand(500,1500) * danger;
      state.beli += gain;
      state.happiness = clamp(state.happiness+4,0,100);
      addLog(`Tu tombes sur une cache de trésor oubliée par un équipage disparu : ${fmt(gain)} Beli !`, "good");
    }
  },
  {
    id:"chance_encounter",
    condition:()=> true,
    resolve(){
      const flavor = pick([
        "Tu croises un vieux sage qui partage avec toi quelques conseils avisés.",
        "Une conversation inattendue avec un inconnu t'ouvre l'esprit.",
        "Un enfant du village te remercie pour un petit geste, touché·e par sa gratitude.",
        "Un ancien combattant reconnaît en toi un potentiel certain."
      ]);
      const statKey = pick(["force","vitesse","endurance","intelligence","charisme"]);
      applyMods({ [statKey]:1, happiness:4 });
      addLog(flavor, "neutral");
    }
  },
  {
    id:"fruit_collector",
    condition:()=> !!state.devilFruit && !state.flags.fruitCollectorAsked,
    resolve(done){
      state.flags.fruitCollectorAsked = true;
      addLog("Un collectionneur excentrique t'aborde, fasciné par les rumeurs entourant ton pouvoir.", "major");
      const offer = rand(15000,35000);
      const choices = [
        { label:`Vendre ton fruit pour ${fmt(offer)} Beli`, sub:"Tu perds définitivement ses pouvoirs",
          resolve(){
            const reversed = {};
            for(const k in state.devilFruit.mods) reversed[k] = -state.devilFruit.mods[k];
            applyMods(reversed);
            state.beli += offer;
            addLog(`Tu cèdes le ${state.devilFruit.name} contre une fortune. Tes pouvoirs s'évanouissent.`, "major");
            state.devilFruit = null;
          }
        },
        { label:"Refuser, ce pouvoir n'a pas de prix", sub:"",
          resolve(){ addLog("Tu déclines poliment son offre extravagante.", "neutral"); } }
      ];
      pendingChoice = { choices, onResolve:(idx)=>{
        choices[idx].resolve();
        save();
        renderGame(true);
        done();
      }};
      const html = choices.map((c,i)=>`
        <div class="action-row" data-choice="${i}">
          <div><div class="a-label">${c.label}</div>${c.sub?`<div class="a-sub">${c.sub}</div>`:''}</div>
          <div class="a-val">→</div>
        </div>`).join("");
      openModal("Une offre alléchante", html);
      document.querySelectorAll("[data-choice]").forEach(el=>{
        el.addEventListener("click", ()=> resolvePendingChoice(+el.dataset.choice));
      });
      return true;
    }
  },
  {
    id:"devilfruit_spawn",
    condition:()=> !state.devilFruit && ["pirate","chasseur"].includes(state.path),
    resolve(done){
      addLog("Sur une île isolée, tu remarques un fruit étrange à l'écorce spiralée.", "major");
      offerDevilFruit(pick(DEVIL_FRUITS), done);
      return true;
    }
  }
];

function checkDiscovery(onDone){
  if(Math.random() >= 0.12){ onDone(); return; }
  const eligible = DISCOVERY_EVENTS.filter(e=>e.condition());
  if(!eligible.length){ onDone(); return; }
  const chosen = pick(eligible);
  const isAsync = chosen.resolve(onDone);
  if(!isAsync) onDone();
}

/* ================= RIVAL & ALLIÉ ================= */

function ensureRival(){
  if(!state.rival){
    state.rival = { name: randomName(), epithet: pick(EPITHETS), encounters:0, defeated:false, lastEncounterAge:0 };
  }
}

function checkRival(){
  if(!["pirate","marine","chasseur","revolutionnaire"].includes(state.path)) return false;
  ensureRival();
  const r = state.rival;
  if(r.defeated || r.encounters>=4) return false;
  if(state.age - r.lastEncounterAge < 3) return false;
  if(Math.random() >= 0.12) return false;
  return true;
}

function triggerRivalEncounter(onDone){
  const r = state.rival;
  r.encounters++;
  r.lastEncounterAge = state.age;
  const isFinal = r.encounters>=4;
  const allied = state.ally && state.ally.allied;
  const enemyPower = Math.max(15, Math.round(powerScore() * (rand(90,125)/100)) - (allied?15:0));
  const label = `${r.name} "${r.epithet}"`;
  addLog(`${label} surgit devant toi${r.encounters===1?", un rival dont tu entendras reparler":''} !${allied?` ${state.ally.name} se tient prêt·e à intervenir.`:''}`, "major");
  startBattle(enemyPower, label, (outcome)=>{
    if(outcome==="victory"){
      const gain = rand(1000,3000) + powerScore()*20;
      state.beli += gain;
      state.happiness = clamp(state.happiness+8,0,100);
      if(isFinal){
        r.defeated = true;
        addLog(`Cette fois, ${r.name} ne se relève pas. Votre rivalité s'achève, et ta légende grandit.`, "major");
        if(!state.epithet){
          state.epithet = pick(EPITHETS);
          addLog(`On te surnomme désormais "${state.epithet}".`, "major");
        }
      } else {
        addLog(`Tu triomphes de ${r.name}, qui jure de revenir plus fort·e.`, "good");
      }
    } else if(outcome==="defeat"){
      addLog(`${r.name} prend le dessus cette fois et s'évanouit dans la nature.`, "bad");
    } else {
      addLog(`Tu réussis à échapper à ${r.name}, pour cette fois.`, "neutral");
    }
    onDone();
  });
}

let pendingChoice = null;

function resolvePendingChoice(idx){
  if(!pendingChoice) return;
  const pc = pendingChoice;
  pendingChoice = null;
  closeModal();
  pc.onResolve(idx);
}

function resolvePendingDefault(){
  if(!pendingChoice) return;
  const idx = pendingChoice.choices.length>1 ? pendingChoice.choices.length-1 : 0;
  resolvePendingChoice(idx);
}

function findSpecialEvent(){
  return SPECIAL_EVENTS.find(e => !state.flags[e.id] && e.condition());
}

function findChildSpecialEvent(){
  if(Math.random() >= 0.10) return null;
  const eligible = CHILD_SPECIAL_EVENTS.filter(e => !state.flags[e.id] && e.condition());
  if(!eligible.length) return null;
  return pick(eligible);
}

function triggerSpecialEvent(ev){
  state.flags[ev.id] = true;
  if(window.OPL && window.OPL._onSpecialEvent && window.OPL._onSpecialEvent(ev)) return;
  addLog(ev.text, "major");
  pendingChoice = { choices: ev.choices, onResolve:(idx)=>{
    const isAsync = ev.choices[idx].resolve(finishAgeUp);
    if(!isAsync) finishAgeUp();
  }};
  const html = `<p class="modal-intro">${ev.text}</p>` + ev.choices.map((c,i)=>`
    <div class="action-row" data-choice="${i}">
      <div><div class="a-label">${c.label}</div>${c.sub ? `<div class="a-sub">${c.sub}</div>` : ''}</div>
      <div class="a-val">→</div>
    </div>`).join("");
  openModal(ev.title, html);
  document.querySelectorAll("[data-choice]").forEach(el=>{
    el.addEventListener("click", ()=> resolvePendingChoice(+el.dataset.choice));
  });
  save();
  renderGame(true);
}

/* ================= STATE ================= */

const SAVE_KEY = "opl_save_v1";
const HOF_KEY = "opl_hof_v1";

let state = null;

function freshState(){
  return {
    name:"", birthplace:"", familyId:"",
    age:0, year:0, alive:true,
    path:"civil", pathChosen:false,
    stage:0, maxStage:0, island:null,
    flags:{},
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
    inPrison:false,
    keys:0, islandVault:null,
    energy:100,
    ship:{ tier:0 },
    rival:null, ally:null, weapon:null
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
  const shipPower = (SHIP_TIERS[state.ship.tier].firepower||0) * 0.3;
  return Math.round(p + crewPower + shipPower);
}

function crewCapacity(){
  return state.path==="pirate" ? SHIP_TIERS[state.ship.tier].capacity : SHIP_TIERS[0].capacity;
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
  state.island = createSel.birthplace;

  const fam = FAMILIES.find(f=>f.id===state.familyId);
  applyMods(fam.mods);
  if(fam.beli) state.beli += fam.beli;
  if(fam.repMarine) state.repMarine += fam.repMarine;
  if(fam.repPirate) state.repPirate += fam.repPirate;

  addLog(`Tu nais à ${state.birthplace}, au sein d'une ${fam.label.toLowerCase()}.`, "major");
  save();
  showScreen("screen-game");
  renderGame();
  if(window.OPL && window.OPL._afterBirth) window.OPL._afterBirth();
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
    const childSpecial = findChildSpecialEvent();
    if(childSpecial){ triggerSpecialEvent(childSpecial); return; }
    openChildChoice();
    return;
  }
  if(!state.pathChosen){
    addLog("Tu es en âge de choisir la voie de ta vie.", "major");
    finishAgeUp();
    return;
  }
  const special = findSpecialEvent();
  if(special){ triggerSpecialEvent(special); return; }
  openYearChoice();
}

function finishAgeUp(){
  state.energy = clamp(state.energy + 45, 0, 100);
  checkDeath();
  checkBountyReveal();
  save();
  renderGame(true);

  if(state.age===16 && !state.pathChosen){
    setTimeout(openPathChoice, 300);
  }
  if(window.OPL && window.OPL._afterYearResolved) window.OPL._afterYearResolved();
}

function childYearGain(){
  if(state.age<=6) return 1;
  if(state.age<=12) return 2;
  return 3;
}

const CHILD_TRAIN_LABELS = ["S'entraîner physiquement", "Repousser tes limites à l'entraînement", "Enchaîner les exercices physiques", "Te muscler sans relâche"];
const CHILD_TRAIN_LOGS = ["Tu passes l'année à t'entraîner sans relâche.", "Tu enchaînes les exercices du matin au soir.", "Chaque jour, tu repousses un peu plus tes limites physiques.", "Tu t'endurcis à force de répétition."];
const CHILD_STUDY_LABELS = ["Étudier et lire", "Te plonger dans les livres", "Apprendre à lire les cartes marines", "Écouter les récits des vieux marins"];
const CHILD_STUDY_LOGS = ["Tu passes l'année plongé·e dans les livres et les cartes marines.", "Tu apprends patiemment à déchiffrer les cartes de navigation.", "Les récits des vieux loups de mer nourrissent ta curiosité.", "Tu dévores tout ce qui te tombe sous la main."];
const CHILD_PLAY_LABELS = ["Jouer avec les autres enfants", "Profiter de ton enfance", "Passer du temps avec tes amis", "Explorer les environs en t'amusant"];
const CHILD_PLAY_LOGS = ["Tu passes une année insouciante à jouer avec les enfants du village.", "Tu ris, tu cours, tu profites simplement d'être enfant.", "Les journées passent vite entre amis, sans souci.", "Tu explores les environs, curieux·se de tout."];
const CHILD_EXPLORE_LABELS = ["Explorer les environs", "Partir en exploration au bord de l'eau", "Fouiner dans les recoins du village", "Suivre un sentier inconnu"];
const CHILD_EXPLORE_LOGS = ["Tu explores chaque recoin du village, curieux·se de tout.", "Une vieille pièce trouvée sur la plage te met de bonne humeur.", "Tu rentres les poches pleines de babioles ramassées ici et là.", "Ton sens de l'exploration commence déjà à se dessiner."];
const CHILD_HELP_LABELS = ["Aider ta famille au quotidien", "Donner un coup de main à la maison", "Participer aux tâches du village", "Se rendre utile auprès des adultes"];
const CHILD_HELP_LOGS = ["Tu aides ta famille du mieux que tu peux, jour après jour.", "Les adultes du village apprécient ton sérieux pour ton âge.", "Tu apprends beaucoup en donnant un coup de main partout où tu peux.", "Ta contribution, même modeste, ne passe pas inaperçue."];
const CHILD_DAYDREAM_LABELS = ["Rêvasser en observant les bateaux au loin", "Imaginer de grandes aventures", "Contempler l'horizon pendant des heures", "Te perdre dans tes pensées"];
const CHILD_DAYDREAM_LOGS = ["Tu passes des heures à observer les bateaux disparaître à l'horizon, l'esprit ailleurs.", "Tu imagines déjà les aventures qui t'attendent un jour.", "Perdu·e dans tes pensées, tu rêves d'un ailleurs.", "Ces rêveries nourrissent en toi une soif d'aventure grandissante."];

function buildChildChoices(){
  const g = childYearGain();
  const pool = [
    { labels:CHILD_TRAIN_LABELS, logs:CHILD_TRAIN_LOGS, sub:`Force +${g} · Vitesse +${g} · Bonheur -3`,
      apply(){ applyMods({force:g, vitesse:g, happiness:-3}); } },
    { labels:CHILD_STUDY_LABELS, logs:CHILD_STUDY_LOGS, sub:`Intelligence +${g+1} · Bonheur -3`,
      apply(){ applyMods({intelligence:g+1, happiness:-3}); } },
    { labels:CHILD_PLAY_LABELS, logs:CHILD_PLAY_LOGS, sub:`Charisme +${g} · Bonheur +6`,
      apply(){ applyMods({charisme:g, happiness:6}); } },
    { labels:CHILD_EXPLORE_LABELS, logs:CHILD_EXPLORE_LOGS, sub:`Chance +${g} · Beli +${100*g}`,
      apply(){ applyMods({chance:g, beli:100*g}); } },
    { labels:CHILD_HELP_LABELS, logs:CHILD_HELP_LOGS, sub:`Endurance +${g} · Beli +${80*g}`,
      apply(){ applyMods({endurance:g, beli:80*g}); } },
    { labels:CHILD_DAYDREAM_LABELS, logs:CHILD_DAYDREAM_LOGS, sub:"Bonheur +8 · une stat au hasard +1",
      apply(){ applyMods({ [pick(["force","vitesse","endurance","intelligence","charisme"])]:1, happiness:8 }); } }
  ];
  for(let i=pool.length-1;i>0;i--){
    const j = rand(0,i);
    [pool[i],pool[j]] = [pool[j],pool[i]];
  }
  return pool.slice(0,3).map(entry=>({
    label: pick(entry.labels),
    sub: entry.sub,
    resolve(){
      entry.apply();
      addLog(pick(entry.logs), "neutral");
    }
  }));
}

function openChildChoice(){
  const bracket = CHILDHOOD_EVENTS.find(e=>state.age>=e.min && state.age<=e.max) || CHILDHOOD_EVENTS[CHILDHOOD_EVENTS.length-1];
  const intro = pick(bracket.texts);
  const choices = buildChildChoices();
  pendingChoice = { choices, onResolve:(idx)=>{ choices[idx].resolve(); finishAgeUp(); } };

  const html = `<p class="modal-intro">${intro}</p>` + choices.map((c,i)=>`
    <div class="action-row" data-choice="${i}">
      <div><div class="a-label">${c.label}</div><div class="a-sub">${c.sub}</div></div>
      <div class="a-val">→</div>
    </div>`).join("");
  openModal("Cette année...", html);
  document.querySelectorAll("[data-choice]").forEach(el=>{
    el.addEventListener("click", ()=> resolvePendingChoice(+el.dataset.choice));
  });
}

const PATH_YEAR_LABELS = {
  pirate: {
    train: ["S'entraîner dur avec l'équipage", "Renforcer tes techniques de combat", "Passer la journée à t'endurcir sur le pont"],
    risky: ["Tenter un coup d'éclat risqué", "Monter un coup fumant avec l'équipage", "Provoquer le destin en pleine mer"]
  },
  marine: {
    train: ["Suivre un entraînement rigoureux", "Perfectionner ta discipline militaire", "T'astreindre à un entraînement intensif"],
    risky: ["Mener une opération audacieuse", "Te porter volontaire pour une mission délicate", "Prendre des risques calculés pour la Justice"]
  },
  chasseur: {
    train: ["Peaufiner tes techniques de traque", "Affiner ton instinct de chasseur·se", "T'entraîner à repérer tes cibles"],
    risky: ["Traquer une prime dangereuse", "Accepter un contrat à haut risque", "Foncer sur une piste incertaine"]
  },
  revolutionnaire: {
    train: ["T'endurcir pour la cause", "Renforcer ta discipline de combattant·e", "Te préparer aux prochaines luttes"],
    risky: ["Mener une action clandestine risquée", "Infiltrer une position ennemie", "Prendre un risque calculé pour la cause"]
  },
  civil: {
    train: ["Te former à un nouveau savoir-faire", "Perfectionner ton métier", "Investir du temps dans ton apprentissage"],
    risky: ["Investir dans une affaire risquée", "Tenter ta chance dans une nouvelle activité", "Miser gros sur une opportunité incertaine"]
  }
};

const PATH_TRAIN_MODS = {
  pirate: {force:2, vitesse:2}, marine: {force:2, intelligence:1},
  chasseur: {vitesse:2, force:1}, revolutionnaire: {charisme:2, intelligence:1},
  civil: {intelligence:2}
};

const YEAR_TRAIN_LOGS = ["Tu consacres ton année à progresser avec sérieux.", "Chaque jour t'endurcit un peu plus.", "Tu ne relâches jamais tes efforts, année après année.", "La discipline finit par payer."];
const YEAR_SOCIAL_LOGS = ["Tu prends le temps de vivre, de rire, et de tisser des liens.", "Cette année, tu savoures chaque instant de répit.", "Les liens que tu tisses valent tous les trésors.", "Tu profites pleinement de la vie, loin des soucis."];
const YEAR_RISKY_WIN_LOGS = ["Ton audace paie : l'année se termine sur un vrai coup d'éclat.", "Le risque en valait la peine.", "Ton pari audacieux se révèle payant.", "Tu sors de cette aventure la tête haute."];
const YEAR_RISKY_LOSE_LOGS = ["Ton coup de poker tourne mal, tu en gardes des séquelles.", "Cette fois, la chance ne t'a pas souri.", "L'audace a un prix, et tu le payes cher.", "Le risque était trop grand cette fois."];
const YEAR_REST_LABELS = ["Te reposer et soigner tes blessures", "Prendre un peu de repos", "Faire une pause bien méritée", "Laisser ton corps récupérer"];
const YEAR_REST_LOGS = ["Tu prends le temps de te reposer et de soigner tes blessures.", "Un peu de repos ne fait jamais de mal.", "Tu recharges tes batteries avant la suite.", "Ce répit te fait le plus grand bien."];
const YEAR_EXPLORE_LABELS = ["Explorer les environs", "Partir en reconnaissance", "Parcourir la région à la recherche d'opportunités", "Suivre une piste incertaine"];
const YEAR_EXPLORE_LOGS = ["Tu explores les environs et débusques quelques opportunités.", "Ta curiosité te mène vers d'heureuses surprises.", "Une reconnaissance discrète porte ses fruits.", "Le hasard des chemins te sourit un peu."];
const YEAR_NETWORK_LABELS = {
  pirate: ["Renforcer les liens avec ton équipage", "Resserrer les rangs de l'équipage", "Consolider la confiance de tes compagnons"],
  marine: ["Cultiver tes relations dans la hiérarchie", "Te rapprocher de tes supérieurs", "Soigner ton réseau au sein de la Marine"],
  chasseur: ["Étoffer ton réseau d'informateurs", "Nouer des contacts utiles", "Entretenir tes relations dans le milieu"],
  revolutionnaire: ["Renforcer les liens avec la cause", "Consolider ta cellule révolutionnaire", "Resserrer les liens avec tes camarades"],
  civil: ["Tisser des liens dans ta communauté", "Te rapprocher de tes voisins", "Entretenir ton réseau local"]
};
const YEAR_NETWORK_LOGS = ["Ces liens renforcés te seront précieux.", "La confiance mutuelle grandit.", "Ton réseau s'élargit peu à peu.", "Ces relations solides valent de l'or."];

function buildYearChoices(){
  const path = state.path;
  const labels = PATH_YEAR_LABELS[path] || PATH_YEAR_LABELS.civil;
  const trainMods = PATH_TRAIN_MODS[path] || PATH_TRAIN_MODS.civil;
  const networkLabels = YEAR_NETWORK_LABELS[path] || YEAR_NETWORK_LABELS.civil;

  const pool = [
    { key:"train", label:pick(labels.train), sub:"Progression sûre, mais fatigant",
      resolve(){
        applyMods({...trainMods, happiness:-4});
        addLog(pick(YEAR_TRAIN_LOGS), "neutral");
      }
    },
    { key:"risky", label:pick(labels.risky), sub:"Risqué : grand gain ou revers cuisant",
      resolve(){
        const danger = currentStage().danger;
        const enemyPower = rand(15,30) * danger;
        const winProb = clamp(0.5 + (powerScore()-enemyPower)/200, 0.15, 0.85);
        if(Math.random() < winProb){
          const gain = rand(500,2000) + danger*300;
          if(path==="pirate") state.bounty += gain;
          if(path==="marine" && Math.random()<0.3) state.marineRank = Math.min(MARINE_RANKS.length-1, state.marineRank+1);
          state.beli += Math.round(gain/2);
          state.happiness = clamp(state.happiness+6,0,100);
          addLog(pick(YEAR_RISKY_WIN_LOGS), "good");
        } else {
          state.health = clamp(state.health - rand(12,28), 0, 100);
          addLog(pick(YEAR_RISKY_LOSE_LOGS), "bad");
        }
      }
    },
    { key:"social", label:"Profiter de la vie", sub:"Bonheur & liens sociaux",
      resolve(){
        applyMods({happiness:12, charisme:1});
        addLog(pick(YEAR_SOCIAL_LOGS), "good");
      }
    },
    { key:"rest", label:pick(YEAR_REST_LABELS), sub:"Santé et Bonheur en hausse, sans progression",
      resolve(){
        applyMods({health:rand(15,25), happiness:5});
        addLog(pick(YEAR_REST_LOGS), "good");
      }
    },
    { key:"explore", label:pick(YEAR_EXPLORE_LABELS), sub:"Un peu de Beli et de Chance, sans risque",
      resolve(){
        applyMods({beli:rand(300,900), chance:1});
        addLog(pick(YEAR_EXPLORE_LOGS), "neutral");
      }
    },
    { key:"network", label:pick(networkLabels), sub:"Charisme & Bonheur",
      resolve(){
        applyMods({charisme:2, happiness:3});
        addLog(pick(YEAR_NETWORK_LOGS), "good");
      }
    }
  ];

  for(let i=pool.length-1;i>0;i--){
    const j = rand(0,i);
    [pool[i],pool[j]] = [pool[j],pool[i]];
  }
  const chosen = pool.slice(0,3);
  const riskyIdx = chosen.findIndex(c=>c.key==="risky");
  if(riskyIdx === chosen.length-1){
    [chosen[riskyIdx], chosen[0]] = [chosen[0], chosen[riskyIdx]];
  }

  return chosen.map(c=>({ label:c.label, sub:c.sub, resolve:c.resolve }));
}

function openYearChoice(){
  const choices = buildYearChoices();
  pendingChoice = { choices, onResolve:(idx)=>{ choices[idx].resolve(); afterYearChoiceContinue(); } };

  const html = choices.map((c,i)=>`
    <div class="action-row" data-choice="${i}">
      <div><div class="a-label">${c.label}</div><div class="a-sub">${c.sub}</div></div>
      <div class="a-val">→</div>
    </div>`).join("");
  openModal("Comment passer cette année ?", html);
  document.querySelectorAll("[data-choice]").forEach(el=>{
    el.addEventListener("click", ()=> resolvePendingChoice(+el.dataset.choice));
  });
}

function afterYearChoiceContinue(){
  // navigation vers une autre île de la même région
  const islandPool = ISLANDS[state.stage];
  if(islandPool && islandPool.length>1 && Math.random()<0.22){
    const others = islandPool.filter(i=>i!==state.island);
    if(others.length){
      state.island = pick(others);
      addLog(`Après plusieurs jours de navigation, vous accostez à ${state.island}.`, "neutral");
    }
  }

  // marine promotion chance
  if(state.path==="marine" && state.marineRank < MARINE_RANKS.length-1){
    const chanceUp = 0.12 + powerScore()/1000;
    if(Math.random() < chanceUp){
      state.marineRank++;
      addLog(`Tu es promu·e ${MARINE_RANKS[state.marineRank]} !`, "major");
      if(state.marineRank===MARINE_RANKS.length-1){
        winEnding("marine");
        finishAgeUp();
        return;
      }
    }
  }

  // random hazard scaling with stage danger
  const danger = currentStage().danger;
  const hazardChance = 0.06 * danger + (state.path==="civil" ? -0.05 : 0);
  if(Math.random() < Math.max(0,hazardChance)){
    triggerHazard(danger, finishYearTail);
    return;
  }

  if(checkRival()){
    triggerRivalEncounter(finishYearTail);
    return;
  }

  checkDiscovery(finishYearTail);
}

function finishYearTail(){
  if(!state.alive){ finishAgeUp(); return; }

  // les épreuves de Laugh Tale, pour les pirates qui ont atteint l'île
  const eligibleForTrials = state.path==="pirate" && state.stage===5 &&
    (!state.flags.laughTaleNextAttemptAge || state.age>=state.flags.laughTaleNextAttemptAge);
  if(eligibleForTrials){
    startLaughTaleTrials(finishAgeUp);
    return;
  }

  finishAgeUp();
}

/* ================= LES ÉPREUVES DE LAUGH TALE ================= */

function startLaughTaleTrials(onDone){
  addLog("Laugh Tale se dresse enfin devant toi. Pour percer son secret et devenir le nouveau Roi des Pirates, tu dois prouver ta valeur à travers trois épreuves.", "major");
  save(); renderGame(true);
  const results = { force:false, sagesse:false, volonte:false };
  runForceTrial(results, ()=>{
    if(!state.alive){ onDone(); return; }
    runWisdomTrial(results, ()=>{
      if(!state.alive){ onDone(); return; }
      runWillTrial(results, ()=>{
        if(!state.alive){ onDone(); return; }
        resolveLaughTaleTrials(results, onDone);
      });
    });
  });
}

function runForceTrial(results, next){
  addLog("Épreuve de la Force : un Gardien spectral surgit pour te barrer la route.", "major");
  const enemyPower = clamp(Math.round(powerScore()*0.3), 90, 140);
  startBattle(enemyPower, "le Gardien de Laugh Tale", (outcome)=>{
    results.force = outcome==="victory";
    addLog(results.force
      ? "Tu triomphes du Gardien : la première épreuve est franchie."
      : "Le Gardien te repousse rudement, mais tu tiens encore debout.", results.force?"good":"bad");
    save(); renderGame(true);
    next();
  });
}

let laughTaleTrialState = null;

function runWisdomTrial(results, next){
  addLog("Épreuve de la Sagesse : une inscription ancienne scintille sur la roche, à déchiffrer avant qu'elle ne s'efface.", "major");
  const seq = [];
  for(let i=0;i<5;i++) seq.push(pick(FRUIT_QTE_SYMBOLS));
  laughTaleTrialState = { sequence:seq, input:[], results, onNext:next, timeoutId:null };
  setMiniGameActive(true);
  renderWisdomTrial();
  laughTaleTrialState.timeoutId = setTimeout(()=> resolveWisdomTrial(), 4000);
}

function renderWisdomTrial(){
  const t = laughTaleTrialState;
  if(!t) return;
  const seq = t.sequence;
  const options = [...new Set(seq)];
  while(options.length<4){
    const extra = pick(FRUIT_QTE_SYMBOLS);
    if(!options.includes(extra)) options.push(extra);
  }
  for(let i=options.length-1;i>0;i--){ const j=rand(0,i); [options[i],options[j]]=[options[j],options[i]]; }
  openModal("Épreuve de la Sagesse", `
    <p class="modal-intro">Reproduis l'inscription avant qu'elle ne s'efface.</p>
    <div class="qte-sequence">${seq.map((s,i)=>`<span class="qte-symbol ${i<t.input.length?'done':''}">${s}</span>`).join("")}</div>
    <div class="qte-buttons">${options.map(s=>`<button class="btn btn-chip qte-btn" data-symbol="${s}">${s}</button>`).join("")}</div>
  `);
  document.querySelectorAll(".qte-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> onWisdomTrialTap(btn.dataset.symbol));
  });
}

function onWisdomTrialTap(symbol){
  const t = laughTaleTrialState;
  if(!t) return;
  const expected = t.sequence[t.input.length];
  if(symbol!==expected){
    clearTimeout(t.timeoutId);
    resolveWisdomTrial();
    return;
  }
  t.input.push(symbol);
  if(t.input.length >= t.sequence.length){
    clearTimeout(t.timeoutId);
    resolveWisdomTrial();
    return;
  }
  renderWisdomTrial();
}

function resolveWisdomTrial(){
  const t = laughTaleTrialState;
  if(!t) return;
  const accuracy = t.input.length / t.sequence.length;
  t.results.sagesse = accuracy >= 0.8;
  laughTaleTrialState = null;
  setMiniGameActive(false);
  closeModal();
  addLog(t.results.sagesse
    ? "Tu déchiffres l'inscription juste à temps : la deuxième épreuve est franchie."
    : "L'inscription s'efface avant que tu n'aies percé son secret.", t.results.sagesse?"good":"bad");
  save(); renderGame(true);
  t.onNext();
}

/* ================= ÉVASION DE MARY GEOISE ================= */

const ESCAPE_QTE_SYMBOLS = ["⬆️","⬇️","⬅️","➡️"];
let marigeoiseEscapeState = null;

function startMarigeoiseEscape(onDone, easier){
  const len = easier ? 5 : 6;
  const seq = [];
  for(let i=0;i<len;i++) seq.push(pick(ESCAPE_QTE_SYMBOLS));
  marigeoiseEscapeState = { sequence:seq, input:[], onDone, timeoutId:null };
  setMiniGameActive(true);
  renderMarigeoiseEscape();
  marigeoiseEscapeState.timeoutId = setTimeout(()=> resolveMarigeoiseEscape(), 4500);
}

function renderMarigeoiseEscape(){
  const t = marigeoiseEscapeState;
  if(!t) return;
  const seq = t.sequence;
  openModal("Fuite de la Terre Sainte", `
    <p class="modal-intro">Mémorise le chemin de sortie et reproduis-le avant que les gardes ne te rattrapent !</p>
    <div class="qte-sequence">${seq.map((s,i)=>`<span class="qte-symbol ${i<t.input.length?'done':''}">${s}</span>`).join("")}</div>
    <div class="qte-buttons">${ESCAPE_QTE_SYMBOLS.map(s=>`<button class="btn btn-chip qte-btn" data-symbol="${s}">${s}</button>`).join("")}</div>
  `);
  document.querySelectorAll(".qte-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> onMarigeoiseEscapeTap(btn.dataset.symbol));
  });
}

function onMarigeoiseEscapeTap(symbol){
  const t = marigeoiseEscapeState;
  if(!t) return;
  const expected = t.sequence[t.input.length];
  if(symbol!==expected){
    clearTimeout(t.timeoutId);
    resolveMarigeoiseEscape();
    return;
  }
  t.input.push(symbol);
  if(t.input.length >= t.sequence.length){
    clearTimeout(t.timeoutId);
    resolveMarigeoiseEscape();
    return;
  }
  renderMarigeoiseEscape();
}

function resolveMarigeoiseEscape(){
  const t = marigeoiseEscapeState;
  if(!t) return;
  const accuracy = t.input.length / t.sequence.length;
  const success = accuracy >= 0.7;
  marigeoiseEscapeState = null;
  setMiniGameActive(false);
  closeModal();
  state.flags.marigeoiseStage = 2;
  if(success){
    addLog("Tu sèmes tes poursuivants dans un dédale de couloirs et t'échappes de la Terre Sainte, le cœur battant. Ce que tu as vu là-bas continuera de te hanter.", "major");
  } else {
    const dmg = rand(15,30);
    state.health = clamp(state.health-dmg, 0, 100);
    addLog(`Rattrapé·e par une patrouille, tu te bats pour t'échapper et t'en sors blessé·e (-${dmg} PV), mais libre.`, "bad");
  }
  save(); renderGame(true);
  t.onDone();
}

function runWillTrial(results, next){
  addLog("Épreuve de la Volonté : un mirage de tout ce que tu as sacrifié pour en arriver là se dresse devant toi.", "major");
  const choices = [
    { label:"Puiser dans ta détermination et avancer", sub:"Refuse de céder au doute",
      resolve(){
        const chance = clamp(0.5 + (state.hakiConq?0.25:0) + state.chance/300 + (state.happiness-50)/300, 0.2, 0.9);
        results.volonte = Math.random() < chance;
      }
    },
    { label:"Céder un instant au doute", sub:"Plus sûr, mais moins déterminé·e",
      resolve(){ results.volonte = Math.random() < 0.25; }
    }
  ];
  pendingChoice = { choices, onResolve:(idx)=>{
    choices[idx].resolve();
    addLog(results.volonte
      ? "Le mirage se dissipe : ta détermination l'a emporté. La troisième épreuve est franchie."
      : "Le mirage t'engloutit un instant ; tu en ressors ébranlé·e mais vivant·e.", results.volonte?"good":"bad");
    save(); renderGame(true);
    next();
  }};
  const html = choices.map((c,i)=>`
    <div class="action-row" data-choice="${i}">
      <div><div class="a-label">${c.label}</div><div class="a-sub">${c.sub}</div></div>
      <div class="a-val">→</div>
    </div>`).join("");
  openModal("Épreuve de la Volonté", html);
  document.querySelectorAll("[data-choice]").forEach(el=>{
    el.addEventListener("click", ()=> resolvePendingChoice(+el.dataset.choice));
  });
}

function resolveLaughTaleTrials(results, onDone){
  const successCount = [results.force, results.sagesse, results.volonte].filter(Boolean).length;
  if(successCount>=2){
    winEnding("pirate");
    onDone();
    return;
  }
  if(successCount===0 && Math.random()<0.25){
    death("laughtale_fall");
    onDone();
    return;
  }
  const dmg = successCount===0 ? rand(30,50) : rand(10,25);
  state.health = clamp(state.health-dmg, 0, 100);
  addLog(successCount===0
    ? `Laugh Tale rejette ta tentative. Tu t'en sors gravement blessé·e (-${dmg} PV), le rêve encore hors de portée.`
    : `Tu n'as pas su convaincre Laugh Tale de tes preuves. Tu t'en sors blessé·e (-${dmg} PV), mais tu pourras retenter ta chance.`, "bad");
  state.flags.laughTaleNextAttemptAge = state.age + 2;
  onDone();
}

function triggerHazard(danger, onDone){
  const roll = Math.random();
  if(roll < 0.20){
    const dmg = rand(5,10)*danger*0.5;
    state.health = clamp(state.health - dmg, 0, 100);
    addLog("Une bagarre éclate et tu encaisses quelques coups.", "bad");
    onDone();
  } else if(roll < 0.40 && state.path!=="civil"){
    if(state.path==="pirate" && state.crew.length>0 && Math.random()<0.5){
      triggerNavalBattle(danger, onDone);
      return;
    }
    const enemyPower = rand(10,25) * danger;
    const marineTargetsMe = ["pirate","revolutionnaire"].includes(state.path);
    const pirateTargetsMe = ["marine","chasseur"].includes(state.path);
    let enemyLabel = "un adversaire redoutable croisé en chemin";
    if(marineTargetsMe && Math.random()<0.65){
      enemyLabel = pick(["une patrouille de la Marine qui te repère", "un officier zélé bien décidé à t'arrêter", "un vice-amiral de passage, à l'affût"]);
    } else if(pirateTargetsMe && Math.random()<0.65){
      enemyLabel = pick(["un équipage pirate hostile", "des pirates en maraude", "un capitaine pirate cherchant les ennuis"]);
    }
    startBattle(enemyPower, enemyLabel, onDone);
  } else if(roll < 0.60){
    if(state.devilFruit && Math.random()<0.4){
      state.health = clamp(state.health - rand(10,20), 0, 100);
      addLog("Tombé·e à l'eau, ton fruit du démon te paralyse quelques instants terrifiants.", "bad");
      if(Math.random()<0.15){ death("drowning"); }
    } else {
      state.health = clamp(state.health - rand(8,18), 0, 100);
      addLog("Une tempête violente secoue ton navire.", "bad");
      if(Math.random()<0.05*danger){ death("storm"); }
    }
    onDone();
  } else if(roll < 0.80){
    addLog("Un Roi des Mers surgit et fonce droit sur ton navire !", "bad");
    startShipDodgeGame(danger, onDone);
  } else {
    addLog("Une frégate de la Marine te repère et ouvre le feu !", "bad");
    startHolePlugGame(danger, onDone);
  }
}

/* ================= SYSTÈME DE COMBAT ================= */

let battle = null;

function fruitPower(){
  if(!state.devilFruit) return 0;
  const m = state.devilFruit.mods;
  return (m.force||0) + (m.vitesse||0) + (m.endurance||0) + (m.intelligence||0) + (m.charisme||0);
}

function getBattleMoves(){
  const moves = [{ id:"basic", label:"Coup basique", cost:12 }];
  if(state.devilFruit){
    moves.push({ id:"fruit", label:`Fruit : ${state.devilFruit.name}`, cost:30 });
  }
  if(state.hakiArm>0) moves.push({ id:"armement", label:"Haki Armement", cost:25 });
  if(state.hakiObs>0) moves.push({ id:"observation", label:"Haki Observation", cost:20 });
  moves.push({ id:"guard", label:"Défendre", cost:0 });
  moves.push({ id:"flee", label:"Fuir", cost:0 });
  return moves;
}

const BATTLE_BASIC_LOGS = ["Tu frappes de toutes tes forces.", "Un coup net atteint l'adversaire.", "Tu enchaînes les coups avec détermination.", "Ton attaque porte."];

function battleHTML(){
  const b = battle;
  const hpPct = clamp(state.health,0,100);
  const enemyPct = Math.round(clamp(b.enemyHP,0,b.enemyMaxHP)/b.enemyMaxHP*100);
  const stamPct = Math.round(clamp(b.stamina,0,b.maxStamina)/b.maxStamina*100);
  return `
    <div class="battle-fighters">
      <div class="battle-side">
        <div class="battle-name">${state.name}</div>
        <div class="hp-track"><div class="hp-fill" style="width:${hpPct}%"></div></div>
        <div class="battle-sub">${Math.max(0,Math.round(state.health))} PV</div>
      </div>
      <div class="battle-vs">⚔️</div>
      <div class="battle-side">
        <div class="battle-name">${b.enemyLabel}</div>
        <div class="hp-track enemy"><div class="hp-fill" style="width:${enemyPct}%"></div></div>
        <div class="battle-sub">${Math.max(0,Math.round(b.enemyHP))} PV</div>
      </div>
    </div>
    <div class="stamina-row">
      <span>⚡ Endurance</span>
      <div class="hp-track stamina"><div class="hp-fill" style="width:${stamPct}%"></div></div>
    </div>
    <div class="battle-feed" id="battleFeed">${b.feed.map(l=>`<div>${l}</div>`).join("")}</div>
    <div class="battle-actions" id="battleActions">${battleActionsHTML()}</div>
  `;
}

function battleActionsHTML(){
  return getBattleMoves().map(m=>{
    const disabled = m.cost > battle.stamina;
    return `<button class="btn btn-chip battle-move ${disabled?'disabled':''}" data-move="${m.id}" ${disabled?'disabled':''}>
      <span class="move-label">${m.label}</span>${m.cost>0?`<span class="move-cost">⚡${m.cost}</span>`:''}
    </button>`;
  }).join("");
}

function wireBattleButtons(){
  document.querySelectorAll(".battle-move:not(.disabled)").forEach(btn=>{
    btn.addEventListener("click", ()=> battleAction(btn.dataset.move));
  });
}

function battlePush(line){
  battle.feed.push(line);
  if(battle.feed.length>4) battle.feed.shift();
}

function renderBattleUpdate(){
  if(!battle) return;
  document.getElementById("modalBody").innerHTML = battleHTML();
  wireBattleButtons();
}

function startBattle(enemyPower, enemyLabel, onDone){
  const enemyMaxHP = Math.round(40 + enemyPower*0.8);
  battle = {
    enemyLabel, enemyPower, enemyMaxHP, enemyHP: enemyMaxHP,
    maxStamina: 60 + Math.round(state.endurance/2),
    stamina: 0, guarding:false, dodging:false,
    feed:[], round:0, onDone, ended:false
  };
  battle.stamina = battle.maxStamina;
  setMiniGameActive(true);
  openModal("Combat !", battleHTML());
  wireBattleButtons();
}

function battleAction(move){
  const b = battle;
  if(!b || b.ended) return;
  const chosen = getBattleMoves().find(m=>m.id===move);
  if(!chosen || chosen.cost>b.stamina) return;

  b.stamina -= chosen.cost;
  b.guarding = false;
  b.dodging = false;

  if(move==="flee"){
    const fleeChance = clamp(0.3 + (state.vitesse - b.enemyPower*0.3)/150, 0.1, 0.75);
    if(Math.random() < fleeChance){
      battleFlee();
      return;
    }
    battlePush("Ta tentative de fuite échoue !");
    renderBattleUpdate();
    setTimeout(enemyTurn, 700);
    return;
  }

  if(move==="guard"){
    b.guarding = true;
    b.stamina = Math.min(b.maxStamina, b.stamina+25);
    battlePush("Tu te mets en garde, prêt·e à encaisser.");
  } else if(move==="observation"){
    b.dodging = true;
    battlePush("Tu anticipes le prochain mouvement adverse grâce à ton Haki de l'Observation.");
  } else if(move==="fruit"){
    startFruitQTE();
    return;
  } else {
    let dmg, text;
    if(move==="armement"){
      dmg = rand(10,18) + Math.round(state.hakiArm*0.4);
      text = "Ton poing se durcit d'une force invisible : le Haki de l'Armement frappe fort.";
    } else {
      dmg = rand(6,12) + Math.round((state.force+state.vitesse)/6);
      text = pick(BATTLE_BASIC_LOGS);
    }
    b.enemyHP = Math.max(0, b.enemyHP-dmg);
    battlePush(`${text} (-${dmg} PV)`);
  }

  renderBattleUpdate();

  if(b.enemyHP<=0){
    setTimeout(battleVictory, 500);
    return;
  }
  setTimeout(enemyTurn, 700);
}

const FRUIT_QTE_SYMBOLS = ["🔥","💧","⚡","🌪️","❄️","🌑"];

function startFruitQTE(){
  const b = battle;
  if(!b) return;
  const seq = [];
  for(let i=0;i<4;i++) seq.push(pick(FRUIT_QTE_SYMBOLS));
  b.qte = { sequence:seq, input:[], timeoutId:null };
  renderFruitQTE();
  b.qte.timeoutId = setTimeout(()=> resolveFruitQTE(), 3500);
}

function renderFruitQTE(){
  const b = battle;
  if(!b || !b.qte) return;
  const seq = b.qte.sequence;
  const options = [...new Set(seq)];
  while(options.length<4){
    const extra = pick(FRUIT_QTE_SYMBOLS);
    if(!options.includes(extra)) options.push(extra);
  }
  for(let i=options.length-1;i>0;i--){ const j=rand(0,i); [options[i],options[j]]=[options[j],options[i]]; }

  document.getElementById("modalBody").innerHTML = `
    <p class="modal-intro">Reproduis la séquence pour déchaîner la pleine puissance de ton fruit !</p>
    <div class="qte-sequence">${seq.map((s,i)=>`<span class="qte-symbol ${i<b.qte.input.length?'done':''}">${s}</span>`).join("")}</div>
    <div class="qte-buttons">${options.map(s=>`<button class="btn btn-chip qte-btn" data-symbol="${s}">${s}</button>`).join("")}</div>
  `;
  document.querySelectorAll(".qte-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> onFruitQTETap(btn.dataset.symbol));
  });
}

function onFruitQTETap(symbol){
  const b = battle;
  if(!b || !b.qte) return;
  const expected = b.qte.sequence[b.qte.input.length];
  if(symbol!==expected){
    clearTimeout(b.qte.timeoutId);
    resolveFruitQTE();
    return;
  }
  b.qte.input.push(symbol);
  if(b.qte.input.length >= b.qte.sequence.length){
    clearTimeout(b.qte.timeoutId);
    resolveFruitQTE();
    return;
  }
  renderFruitQTE();
}

function resolveFruitQTE(){
  const b = battle;
  if(!b || !b.qte) return;
  const correctCount = b.qte.input.length;
  const totalCount = b.qte.sequence.length;
  b.qte = null;
  const accuracy = correctCount/totalCount;
  let dmg = rand(15,25) + Math.round(fruitPower()*0.5);
  dmg = Math.round(dmg * (0.4 + accuracy*0.6));
  b.enemyHP = Math.max(0, b.enemyHP-dmg);
  const text = accuracy>=1 ? `Tu déchaînes le pouvoir du ${state.devilFruit.name} à la perfection !` :
    accuracy>0 ? `Tu déchaînes le pouvoir du ${state.devilFruit.name}, avec quelques ratés.` :
    `Ta maîtrise du ${state.devilFruit.name} te fait défaut : l'attaque part de travers.`;
  battlePush(`${text} (-${dmg} PV)`);
  renderBattleUpdate();
  if(b.enemyHP<=0){
    setTimeout(battleVictory, 500);
    return;
  }
  setTimeout(enemyTurn, 700);
}

function enemyTurn(){
  const b = battle;
  if(!b || b.ended) return;
  b.round++;

  let dmg = rand(Math.round(b.enemyPower*0.18), Math.round(b.enemyPower*0.38));
  if(b.guarding){
    dmg = Math.round(dmg*0.5);
    battlePush(`${b.enemyLabel} riposte, mais ta garde absorbe une partie du choc. (-${dmg} PV)`);
  } else if(b.dodging){
    const reduced = Math.round(dmg*0.3);
    if(Math.random()<0.5){
      const counter = rand(4,8);
      b.enemyHP = Math.max(0, b.enemyHP-counter);
      dmg = reduced;
      battlePush(`Tu esquives et places une riposte pour ${counter} dégâts ! (-${dmg} PV)`);
    } else {
      dmg = reduced;
      battlePush(`Tu anticipes et limites les dégâts. (-${dmg} PV)`);
    }
  } else {
    battlePush(`${b.enemyLabel} riposte violemment. (-${dmg} PV)`);
  }

  state.health = clamp(state.health-dmg, 0, 100);
  b.guarding = false;
  b.dodging = false;
  b.stamina = Math.min(b.maxStamina, b.stamina+12);

  renderBattleUpdate();

  if(state.health<=0){
    setTimeout(battleDefeat, 500);
  } else if(b.enemyHP<=0){
    setTimeout(battleVictory, 500);
  }
}

function battleVictory(){
  const b = battle;
  b.ended = true;
  const gain = rand(200,1500) + b.enemyPower*10;
  if(state.path==="pirate") state.bounty += gain;
  state.beli += Math.round(gain/2);
  state.happiness = clamp(state.happiness+5,0,100);
  let summary = `Tu triomphes de ${b.enemyLabel} ! Ta réputation grandit.`;
  if(Math.random()<0.3){
    state.keys += 1;
    summary += " Tu trouves une clé étrange sur lui.";
  }
  addLog(summary, "good");
  endBattle(b.onDone, "victory");
}

function battleFlee(){
  const b = battle;
  b.ended = true;
  state.happiness = clamp(state.happiness-3,0,100);
  addLog(`Tu prends la fuite face à ${b.enemyLabel}, le cœur battant.`, "neutral");
  endBattle(b.onDone, "flee");
}

function battleDefeat(){
  const b = battle;
  b.ended = true;
  addLog(`Défaite face à ${b.enemyLabel}. Tu t'en sors gravement blessé·e.`, "bad");
  if(state.crew.length && Math.random()<0.2){
    const lost = state.crew.pop();
    addLog(`${lost.name} disparaît dans la bataille...`, "death");
  }
  if(state.health<=0){
    death(state.path==="marine" ? "battle" : (Math.random()<0.5?"battle":"execution"));
  } else if(state.path!=="marine" && Math.random()<0.08){
    death("execution");
  }
  endBattle(b.onDone, "defeat");
}

function endBattle(onDone, outcome){
  battle = null;
  setMiniGameActive(false);
  checkDeath();
  save();
  renderGame(true);
  closeModal();
  if(onDone) onDone(outcome);
}

function startWarSequence(config){
  const totalRounds = config.rounds || 3;
  let wins = 0;
  let roundIndex = 0;

  function nextRound(){
    roundIndex++;
    if(roundIndex > totalRounds){
      config.onComplete(wins, totalRounds);
      return;
    }
    const scale = totalRounds>1 ? 0.7 + (roundIndex-1) * (0.45/(totalRounds-1)) : 1;
    const enemyPower = Math.round(config.basePower * scale);
    const label = `${config.enemyLabel} — Vague ${roundIndex}/${totalRounds}`;
    startBattle(enemyPower, label, (outcome)=>{
      if(outcome==="victory") wins++;
      if(!state.alive || outcome==="flee"){
        config.onComplete(wins, roundIndex);
        return;
      }
      nextRound();
    });
  }
  nextRound();
}

function triggerNavalBattle(danger, onDone){
  const allied = state.ally && state.ally.allied;
  const enemyPower = Math.max(15, rand(20,40)*danger - (allied?15:0));
  const hadDevilFruit = !state.devilFruit && Math.random() < 0.25;
  const enemyLabel = pick(["un navire pirate rival", "une flotte pirate hostile", "un équipage de chasseurs de trésors armés jusqu'aux dents"]);
  addLog(`${enemyLabel[0].toUpperCase()}${enemyLabel.slice(1)} ouvre le feu sur ton navire !${allied?` ${state.ally.name} combat à tes côtés.`:''}`, "bad");
  startBattle(enemyPower, enemyLabel, (outcome)=>{
    if(outcome==="victory"){
      const bonus = rand(1000,4000) * danger;
      state.beli += bonus;
      addLog(`Le navire ennemi est vaincu : tu pilles ${fmt(bonus)} Beli dans ses cales.`, "good");
      if(hadDevilFruit){
        addLog("Parmi le butin, un fruit du démon !", "major");
        offerDevilFruit(pick(DEVIL_FRUITS), ()=>onDone(outcome));
        return;
      }
    } else if(outcome==="defeat" && state.crew.length && Math.random()<0.4){
      const lost = state.crew.pop();
      addLog(`Dans la confusion de l'abordage, ${lost.name} est porté·e disparu·e.`, "death");
    }
    onDone(outcome);
  });
}

/* ================= MINI-JEUX : ATTAQUES EN MER ================= */

let miniGameActive = false;

function setMiniGameActive(active){
  miniGameActive = active;
  const closeBtn = document.getElementById("modalClose");
  if(closeBtn) closeBtn.classList.toggle("disabled", active);
}

let shipGame = null;
let holeGame = null;

function shipDodgeHTML(){
  return `
    <p class="modal-intro">Une frégate de la Marine ouvre le feu ! Regarde où l'impact ⚠️ est annoncé et déplace ton navire ailleurs.</p>
    <div class="ship-lanes" id="shipLanes">
      <div class="lane" data-lane="0"></div>
      <div class="lane" data-lane="1"></div>
      <div class="lane" data-lane="2"></div>
    </div>
    <div class="minigame-status" id="shipStatus">Vague 0/6</div>
    <div class="minigame-controls">
      <button class="btn btn-chip" data-move="0">◀ Bâbord</button>
      <button class="btn btn-chip" data-move="1">Centre</button>
      <button class="btn btn-chip" data-move="2">Tribord ▶</button>
    </div>
  `;
}

function renderShipGame(){
  const g = shipGame;
  if(!g) return;
  for(let i=0;i<3;i++){
    const el = document.querySelector(`.lane[data-lane="${i}"]`);
    if(!el) continue;
    el.classList.toggle("has-ship", g.lane===i);
    el.classList.toggle("incoming", g.warnLane===i);
    el.textContent = g.lane===i ? "⛵" : (g.warnLane===i ? "⚠️" : "");
  }
  const statusEl = document.getElementById("shipStatus");
  if(statusEl) statusEl.textContent = `Vague ${Math.min(g.wave,g.totalWaves)}/${g.totalWaves} — Touché·e : ${g.hits}`;
}

function onShipMove(laneIdx){
  if(!shipGame) return;
  shipGame.lane = laneIdx;
  renderShipGame();
}

function shipGameNextWave(){
  const g = shipGame;
  if(!g) return;
  g.wave++;
  if(g.wave > g.totalWaves){ endShipGame(); return; }
  g.warnLane = rand(0,2);
  renderShipGame();
  g.timeoutId = setTimeout(()=>{
    if(!shipGame) return;
    if(g.lane===g.warnLane){ g.hits++; } else { g.dodges++; }
    g.warnLane = -1;
    renderShipGame();
    g.timeoutId = setTimeout(shipGameNextWave, 400);
  }, 1300);
}

function startShipDodgeGame(danger, onDone){
  setMiniGameActive(true);
  shipGame = { lane:1, warnLane:-1, hits:0, dodges:0, wave:0, totalWaves:6, danger, onDone };
  openModal("Sous le feu !", shipDodgeHTML());
  document.querySelectorAll("[data-move]").forEach(btn=>{
    btn.addEventListener("click", ()=> onShipMove(+btn.dataset.move));
  });
  renderShipGame();
  setTimeout(shipGameNextWave, 600);
}

function endShipGame(){
  const g = shipGame;
  shipGame = null;
  setMiniGameActive(false);
  if(g.hits===0){
    addLog("Manœuvre parfaite : pas un seul tir ne t'a touché !", "good");
    state.happiness = clamp(state.happiness+6,0,100);
  } else {
    const dmg = g.hits * rand(6,10);
    state.health = clamp(state.health-dmg,0,100);
    addLog(`Tu es touché·e ${g.hits} fois par les tirs ennemis avant de t'en sortir.`, g.hits>=4 ? "bad" : "neutral");
  }
  checkDeath();
  save();
  renderGame(true);
  closeModal();
  if(g.onDone) g.onDone();
}

function holePlugHTML(){
  return `
    <p class="modal-intro">Les tirs de la Marine ont crevé la coque ! Colmate les brèches avant qu'elles n'inondent le navire.</p>
    <div class="minigame-status" id="holeStatus">Colmatées : 0 · Inondées : 0</div>
    <div class="hole-grid" id="holeGrid">
      ${Array(9).fill(0).map((_,i)=>`<button class="hole-cell" data-cell="${i}"></button>`).join("")}
    </div>
  `;
}

function renderHoleCell(i){
  const el = document.querySelector(`.hole-cell[data-cell="${i}"]`);
  if(!el || !holeGame) return;
  const c = holeGame.cells[i];
  el.classList.toggle("active", c.active);
  el.textContent = c.active ? "🕳️" : "";
}

function updateHoleStatus(){
  const g = holeGame;
  if(!g) return;
  const el = document.getElementById("holeStatus");
  if(el) el.textContent = `Colmatées : ${g.plugged} · Inondées : ${g.flooded}`;
}

function spawnHole(){
  const g = holeGame;
  if(!g) return;
  if(g.spawned >= g.totalHoles){
    clearInterval(g.intervalId);
    checkHoleGameEnd();
    return;
  }
  const inactive = g.cells.map((c,i)=>({c,i})).filter(o=>!o.c.active);
  if(!inactive.length) return;
  const target = pick(inactive);
  g.spawned++;
  target.c.active = true;
  renderHoleCell(target.i);
  target.c.timeoutId = setTimeout(()=>{
    if(!holeGame || !target.c.active) return;
    target.c.active = false;
    g.flooded++;
    renderHoleCell(target.i);
    updateHoleStatus();
    checkHoleGameEnd();
  }, 1400);
}

function onHoleClick(i){
  const g = holeGame;
  if(!g) return;
  const c = g.cells[i];
  if(!c.active) return;
  clearTimeout(c.timeoutId);
  c.active = false;
  g.plugged++;
  renderHoleCell(i);
  updateHoleStatus();
  checkHoleGameEnd();
}

function checkHoleGameEnd(){
  const g = holeGame;
  if(!g) return;
  if(g.spawned>=g.totalHoles && (g.plugged+g.flooded)>=g.spawned){
    endHoleGame();
  }
}

function startHolePlugGame(danger, onDone){
  setMiniGameActive(true);
  holeGame = {
    cells: Array(9).fill(null).map(()=>({active:false, timeoutId:null})),
    plugged:0, flooded:0, spawned:0, totalHoles:8, danger, onDone
  };
  openModal("Voie d'eau !", holePlugHTML());
  document.querySelectorAll(".hole-cell").forEach(btn=>{
    btn.addEventListener("click", ()=> onHoleClick(+btn.dataset.cell));
  });
  holeGame.intervalId = setInterval(spawnHole, 800);
  spawnHole();
}

function endHoleGame(){
  const g = holeGame;
  holeGame = null;
  setMiniGameActive(false);
  if(g.flooded===0){
    addLog("Tu colmates chaque brèche à temps : le navire reste sec !", "good");
    state.happiness = clamp(state.happiness+6,0,100);
  } else {
    const dmg = g.flooded * rand(5,9);
    state.health = clamp(state.health-dmg,0,100);
    addLog(`${g.flooded} brèche(s) inondée(s) avant que tu ne les colmates : la coque encaisse.`, g.flooded>=4 ? "bad" : "neutral");
  }
  checkDeath();
  save();
  renderGame(true);
  closeModal();
  if(g.onDone) g.onDone();
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
  const unlocked = unlockEnding(cause);
  clearSave();
  renderEndScreen(hofEntry, victory, cause, unlocked);
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

  rows.push({ label:"Entraînement physique", sub:`Force ${state.force} / Vitesse ${state.vitesse} / Endurance ${state.endurance}`, fn:trainPhysical, cost:20 });
  rows.push({ label:"Étudier", sub:`Intelligence ${state.intelligence}`, fn:trainMind, cost:15 });
  rows.push({ label:"Socialiser", sub:`Charisme ${state.charisme} · Bonheur`, fn:socialize, cost:15 });
  rows.push({ label:"Explorer l'île", sub:`Choisis un lieu à visiter · Clés : ${state.keys}`, fn:openIslandMap, cost:15 });
  rows.push({ label:"Soins", sub:`Santé ${Math.round(state.health)}/100`, fn:openHealMenu, cost:0, disabled: state.health>=100 });
  rows.push({ label:"Arsenal", sub: state.weapon ? `Équipée : ${state.weapon.name}` : "Aucune arme équipée", fn:openWeaponMarket, cost:15 });

  if(["pirate","marine","chasseur","revolutionnaire"].includes(state.path)){
    rows.push({ label:"Chercher un combat", sub:"Tente ta chance contre un adversaire", fn:seekFight, cost:25 });
  }
  if(state.path==="pirate"){
    rows.push({ label:"Chercher un fruit du démon", sub: state.devilFruit? "Déjà obtenu" : "Chance rare de trouver un pouvoir", fn:seekDevilFruit, disabled: !!state.devilFruit, cost:20 });
  }
  if(CREW_LABELS[state.path]){
    const labels = CREW_LABELS[state.path];
    const capacity = crewCapacity();
    rows.push({ label:labels.action, sub:`${labels.groupTitle} ${state.crew.length}/${capacity} · coûte du Beli`, fn:scoutRecruits, cost:15, disabled: state.crew.length>=capacity });
  }
  if(state.islandVault && state.islandVault.island===state.island && state.islandVault.rumorHeard && !state.islandVault.resolved){
    const remaining = state.islandVault.chests.filter(c=>!c.opened).length;
    rows.push({ label:"Ouvrir les coffres", sub:`🔑 ${state.keys} clé(s) · ${remaining} coffre(s) restant(s)`, fn:openVaultMinigame, cost:10 });
  }
  if(powerScore()>=25 && state.age>=18){
    rows.push({ label:"S'entraîner au Haki", sub:`Observation ${state.hakiObs} · Armement ${state.hakiArm}`, fn:trainHaki, cost:25 });
  }
  if(state.path!=="civil"){
    rows.push({ label:"Prendre sa retraite", sub:"Terminer ta vie en paix", fn:retire, cost:0 });
  }

  const html = `<div class="modal-intro">⚡ Énergie disponible : <b>${state.energy}</b>/100</div>` + rows.map((r,i)=>{
    const tooExpensive = state.energy < r.cost;
    return `<div class="action-row ${(r.disabled||tooExpensive)?'disabled':''}" data-idx="${i}">
      <div><div class="a-label">${r.label}</div><div class="a-sub">${r.sub}</div></div>
      <div class="a-val">${r.cost>0?'⚡'+r.cost:'→'}</div>
    </div>`;
  }).join("");
  openModal("Actions", html);
  document.querySelectorAll("[data-idx]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const idx = +el.dataset.idx;
      const row = rows[idx];
      if(state.energy < row.cost) return;
      state.energy = clamp(state.energy - row.cost, 0, 100);
      closeModal();
      row.fn();
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
const ISLAND_POIS = [
  { id:"village", icon:"🏘️", name:"Le village" },
  { id:"nature", icon:"🌿", name:"La nature sauvage" },
  { id:"port", icon:"⚓", name:"Le port" },
  { id:"ruins", icon:"🗿", name:"Ruines & grottes" },
  { id:"tavern", icon:"🍺", name:"La taverne" }
];

function openIslandMap(){
  const label = state.island || STAGES[state.stage].name;
  const html = `<p class="modal-intro">Choisis un lieu à explorer à ${label}.</p>
    <div class="poi-grid">${ISLAND_POIS.map(p=>`
      <div class="poi-card" data-poi="${p.id}">
        <span class="poi-icon">${p.icon}</span>
        <span class="poi-name">${p.name}</span>
      </div>`).join("")}</div>`;
  openModal(`Explorer ${label}`, html);
  document.querySelectorAll("[data-poi]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.dataset.poi;
      closeModal();
      explorePOI(id);
    });
  });
}

function explorePOI(id){
  if(id==="village") return exploreVillage();
  if(id==="nature") return exploreNature();
  if(id==="port") return explorePort();
  if(id==="ruins") return exploreRuins();
  if(id==="tavern") return exploreTavern();
}

function exploreVillage(){
  const roll = Math.random();
  if(roll<0.35){
    applyMods({charisme:2, happiness:5});
    addLog("Tu discutes avec les habitants du village, qui t'accueillent chaleureusement.", "good");
  } else if(roll<0.6){
    const gain = rand(200,600);
    state.beli += gain;
    addLog(`Un marchand reconnaissant te remercie pour un service rendu : ${fmt(gain)} Beli.`, "good");
  } else if(roll<0.8 && state.path==="pirate"){
    applyMods({intelligence:1});
    addLog("Les villageois te parlent d'un équipage prometteur qui pourrait vouloir embarquer avec toi.", "neutral");
  } else {
    addLog("Le village vaque à ses occupations sans incident notable.", "neutral");
  }
  save(); renderGame(true);
}

function exploreNature(){
  const roll = Math.random();
  if(roll<0.3){
    state.keys += 1;
    addLog("Tu déniches une vieille clé rouillée cachée sous des racines.", "good");
  } else if(roll<0.55){
    applyMods({endurance:1});
    addLog("Une randonnée exigeante à travers la végétation dense t'endurcit.", "neutral");
  } else if(roll<0.75){
    state.health = clamp(state.health-rand(5,12),0,100);
    addLog("Une créature sauvage te surprend et t'égratigne avant de s'enfuir.", "bad");
  } else {
    const gain = rand(100,400);
    state.beli += gain;
    addLog(`Tu trouves des plantes rares à revendre : ${fmt(gain)} Beli.`, "good");
  }
  save(); renderGame(true);
}

function explorePort(){
  const roll = Math.random();
  if(roll<0.3){
    state.keys += 1;
    addLog("Un vieux marin ivre te glisse une clé étrange contre quelques services rendus.", "good");
  } else if(roll<0.55){
    addLog("Tu écoutes les rumeurs des quais : rien de bien nouveau aujourd'hui.", "neutral");
  } else if(roll<0.75){
    const gain = rand(150,500);
    state.beli += gain;
    addLog(`Tu donnes un coup de main au déchargement d'un navire : ${fmt(gain)} Beli.`, "good");
  } else {
    state.health = clamp(state.health-rand(6,14),0,100);
    addLog("Une rixe éclate sur les quais et tu en sors avec quelques bleus.", "bad");
  }
  save(); renderGame(true);
}

function exploreRuins(){
  if(!state.devilFruit && !state.islandVault && Math.random()<0.45){
    addLog("Au détour de ruines oubliées, tu perçois une présence étrange...", "neutral");
    state.islandVault = { island: state.island, stageId: state.stage, rumorHeard:false, chests: buildVaultChests(), resolved:false };
    save();
    openRumorChoice();
    return;
  }
  const roll = Math.random();
  if(roll<0.3){
    const gain = rand(500,1500);
    state.beli += gain;
    addLog(`Tu mets la main sur un lot d'antiquités que tu revends pour ${fmt(gain)} Beli.`, "good");
  } else if(roll<0.5 && state.stage>=1 && state.intelligence>=20){
    state.flags.poneglyphFragments = (state.flags.poneglyphFragments||0)+1;
    addLog("Ces ruines cachent une inscription ancienne, semblable à un fragment de Poneglyphe.", "good");
    if(!state.flags.hasRoadPoneglyph && state.flags.poneglyphFragments>=3){
      state.flags.hasRoadPoneglyph = true;
      addLog("Tes fragments accumulés forment un Poneglyphe Route complet !", "major");
    }
  } else if(roll<0.7){
    state.health = clamp(state.health-rand(8,16),0,100);
    addLog("Un piège ancien se déclenche alors que tu explores les ruines.", "bad");
  } else {
    addLog("Ces ruines gardent leurs secrets pour aujourd'hui.", "neutral");
  }
  save(); renderGame(true);
}

function exploreTavern(){
  const roll = Math.random();
  if(roll<0.3){
    applyMods({charisme:1, happiness:6});
    addLog("Une soirée conviviale à la taverne te remonte le moral.", "good");
  } else if(roll<0.5 && state.rival && !state.rival.defeated){
    addLog(`Des rumeurs de comptoir évoquent les exploits de ${state.rival.name} "${state.rival.epithet}" quelque part non loin d'ici.`, "neutral");
  } else if(roll<0.7){
    const gain = rand(100,350);
    state.beli += gain;
    addLog(`Tu gagnes une petite fortune à un pari de comptoir : ${fmt(gain)} Beli.`, "good");
  } else {
    addLog("La taverne est calme ce soir, rien à signaler.", "neutral");
  }
  save(); renderGame(true);
}

function openHealMenu(){
  const missing = 100 - state.health;
  if(missing<=0){ toast("Tu es déjà en pleine santé."); return; }
  const buyCost = Math.round(missing * 25);
  const canBuy = state.beli >= buyCost;
  const canRest = state.energy >= 50;
  const html = `
    <div class="action-row ${canBuy?'':'disabled'}" id="btnHealBuy">
      <div><div class="a-label">Payer un médecin</div><div class="a-sub">Soigne entièrement · ${fmt(buyCost)} Beli</div></div>
      <div class="a-val">${canBuy?'💰':'🔒'}</div>
    </div>
    <div class="action-row ${canRest?'':'disabled'}" id="btnHealRest">
      <div><div class="a-label">Puiser dans tes réserves</div><div class="a-sub">Soigne entièrement · 50 Énergie, sans frais</div></div>
      <div class="a-val">${canRest?'⚡':'🔒'}</div>
    </div>
  `;
  openModal("Soins", html);
  const buyBtn = document.getElementById("btnHealBuy");
  if(buyBtn) buyBtn.addEventListener("click", ()=>{
    if(state.beli<buyCost) return;
    state.beli -= buyCost;
    state.health = 100;
    addLog(`Un médecin te soigne entièrement contre ${fmt(buyCost)} Beli.`, "good");
    closeModal(); save(); renderGame(true);
  });
  const restBtn = document.getElementById("btnHealRest");
  if(restBtn) restBtn.addEventListener("click", ()=>{
    if(state.energy<50) return;
    state.energy -= 50;
    state.health = 100;
    addLog("Tu puises dans tes dernières réserves d'énergie pour te remettre sur pied.", "good");
    closeModal(); save(); renderGame(true);
  });
}

function openWeaponMarket(){
  const html = WEAPONS.map((w,i)=>{
    const equipped = state.weapon && state.weapon.name===w.name;
    const affordable = state.beli >= w.cost;
    const modsText = Object.entries(w.mods).map(([k,v])=>`${v>0?'+':''}${v} ${STAT_LABELS[k]}`).join(" · ");
    return `<div class="action-row ${equipped||!affordable?'disabled':''}" data-weapon="${i}">
      <div><div class="a-label">${w.name}${equipped?' (équipée)':''}</div><div class="a-sub">${modsText} · ${fmt(w.cost)} Beli</div></div>
      <div class="a-val">${equipped?'✓':(affordable?'→':'🔒')}</div>
    </div>`;
  }).join("");
  openModal("Arsenal", html);
  document.querySelectorAll("[data-weapon]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const w = WEAPONS[+el.dataset.weapon];
      if(state.weapon && state.weapon.name===w.name) return;
      if(state.beli < w.cost) return;
      state.beli -= w.cost;
      if(state.weapon){
        const reversed = {};
        for(const k in state.weapon.mods) reversed[k] = -state.weapon.mods[k];
        applyMods(reversed);
      }
      state.weapon = w;
      applyMods(w.mods);
      addLog(`Tu t'équipes d'un(e) ${w.name}.`, "good");
      closeModal();
      save();
      renderGame(true);
    });
  });
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
  startBattle(enemyPower, pick(["un pirate rival","un officier de Marine","un chasseur de primes","un monstre marin"]), ()=>{});
}
function offerDevilFruit(fruit, onDone){
  const canGiveCrew = state.path!=="civil" && state.crew.length>0;
  const FRUIT_SELL_VALUES = { "Logia":()=>rand(6000,12000), "Zoan Mythique":()=>rand(6000,12000), "Paramecia Spéciale":()=>rand(4000,8000) };
  const choices = [
    { label:"La manger", sub:`Fruit ${fruit.type} — effet permanent`,
      resolve(){
        state.devilFruit = fruit;
        applyMods(fruit.mods);
        addLog(`Tu manges le ${fruit.name} (${fruit.type}) ! ${fruit.desc}`, "major");
      }
    }
  ];
  if(canGiveCrew){
    const giveLabels = CREW_LABELS[state.path]||CREW_LABELS.pirate;
    choices.push({ label:`La donner à ${giveLabels.poss.toLowerCase()} ${giveLabels.group}`, sub:`Renforce un·e ${giveLabels.member} au hasard`,
      resolve(){
        const member = pick(state.crew);
        const boost = rand(15,30);
        member.power += boost;
        addLog(`${member.name} mange le ${fruit.name} et devient bien plus puissant·e (+${boost} de puissance de combat).`, "good");
      }
    });
  }
  choices.push({ label:"La revendre", sub:"Beli garanti, sans risque",
    resolve(){
      const value = (FRUIT_SELL_VALUES[fruit.type] || (()=>rand(3000,6000)))();
      state.beli += value;
      addLog(`Tu revends le ${fruit.name} au marché noir pour ${fmt(value)} Beli.`, "good");
    }
  });

  pendingChoice = { choices, onResolve:(idx)=>{
    choices[idx].resolve();
    save();
    renderGame(true);
    onDone();
  }};
  const html = `<p class="modal-intro">${fruit.desc} (${fruit.type})</p>` + choices.map((c,i)=>`
    <div class="action-row" data-choice="${i}">
      <div><div class="a-label">${c.label}</div>${c.sub?`<div class="a-sub">${c.sub}</div>`:''}</div>
      <div class="a-val">→</div>
    </div>`).join("");
  openModal(fruit.name, html);
  document.querySelectorAll("[data-choice]").forEach(el=>{
    el.addEventListener("click", ()=> resolvePendingChoice(+el.dataset.choice));
  });
}

function seekDevilFruit(){
  if(state.devilFruit){ toast("Tu as déjà mangé un fruit du démon."); return; }
  const chance = 0.18 + state.chance/300;
  if(Math.random() < chance){
    offerDevilFruit(pick(DEVIL_FRUITS), ()=>{});
  } else {
    addLog("Tu explores une île à la recherche d'un fruit du démon, sans succès cette fois.", "neutral");
    save(); renderGame(true);
  }
}
function scoutRecruits(){
  const labels = CREW_LABELS[state.path];
  if(!labels) return;
  const capacity = crewCapacity();
  if(state.crew.length>=capacity){ toast(`${labels.poss} ${labels.group} est au complet !`); return; }
  const cost = rand(400,900) * currentStage().danger;
  if(state.beli < cost){ toast(`Il te faut au moins ${fmt(cost)} Beli pour recruter.`); return; }
  state.beli -= cost;

  const rolePool = CREW_ROLES_BY_PATH[state.path] || CREW_ROLES;
  const candidates = [];
  for(let i=0;i<3;i++){
    const roleData = pick(rolePool);
    const power = rand(10,30) + Math.round(state.charisme/2);
    const bonusAmount = rand(2,5);
    candidates.push({ name: pick(CREW_FIRST), role: roleData.role, power, statKey: roleData.statKey, bonusAmount });
  }
  addLog(`Tu dépenses ${fmt(cost)} Beli pour repérer des recrues potentielles sur les quais.`, "neutral");
  save();
  renderGame(true);
  openRecruitChoice(candidates);
}

function openRecruitChoice(candidates){
  const html = candidates.map((c,i)=>`
    <div class="action-row" data-recruit="${i}">
      <div><div class="a-label">${c.name} — ${c.role}</div><div class="a-sub">+${c.bonusAmount} ${STAT_LABELS[c.statKey]} · Puissance ${c.power}</div></div>
      <div class="a-val">→</div>
    </div>`).join("") + `
    <div class="action-row" data-recruit="decline">
      <div><div class="a-label">Repartir les mains vides</div><div class="a-sub">Aucune de ces recrues ne te convainc</div></div>
      <div class="a-val">→</div>
    </div>`;
  openModal("Recrues disponibles", html);
  document.querySelectorAll("[data-recruit]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const key = el.dataset.recruit;
      closeModal();
      if(key==="decline"){
        addLog("Aucune de ces recrues ne te convainc ; tu repars les mains vides.", "neutral");
        save();
        renderGame(true);
        return;
      }
      const c = candidates[+key];
      state.crew.push({ name:c.name, role:c.role, power:c.power, loyalty: rand(50,90) });
      applyMods({ [c.statKey]: c.bonusAmount });
      const labels = CREW_LABELS[state.path]||CREW_LABELS.pirate;
      addLog(`${c.name} rejoint ${labels.poss.toLowerCase()} ${labels.group} en tant que ${c.role.toLowerCase()} ! Ses conseils t'apportent +${c.bonusAmount} ${STAT_LABELS[c.statKey]}.`, "good");
      save();
      renderGame(true);
    });
  });
}
function retire(){
  state.alive = false;
  addLog("Tu décides de raccrocher et de couler une retraite paisible, loin des tempêtes.", "major");
  DEATH_CAUSES.retraite_paisible = "Tu as pris ta retraite en légende vivante, admiré·e de tous.";
  finalizeLife("retraite_paisible", false);
}

/* ================= MAP ================= */

let mapInsightCache = {};

function buildIslandInsight(stageId){
  const danger = STAGES[stageId].danger;
  const enemyPower = rand(15,30)*danger + rand(0,20);
  const diff = enemyPower - powerScore();
  let menaceLevel;
  if(diff>40) menaceLevel = "Danger extrême — hors de portée pour l'instant";
  else if(diff>15) menaceLevel = "Danger élevé — combat risqué";
  else if(diff>-15) menaceLevel = "Adversaire à ta mesure";
  else menaceLevel = "Danger faible — tu peux prendre le dessus";
  return {
    menaceText: pick(VILLAIN_ARCHETYPES),
    menaceLevel,
    marineThreat: MARINE_THREAT_LABELS[clamp(danger-1,0,MARINE_THREAT_LABELS.length-1)],
    devilFruitRumor: Math.random()<0.3
  };
}

function travelTo(stageId, islandName){
  const stage = STAGES[stageId];
  const wasNewRegion = stageId > state.maxStage;
  state.stage = stageId;
  state.maxStage = Math.max(state.maxStage, stageId);
  state.island = islandName || (ISLANDS[stageId] ? state.island : stage.name);
  const label = state.island && state.island!==stage.name ? `${state.island}, dans ${stage.name}` : stage.name;
  addLog(wasNewRegion ? `Tu arrives à ${label}. Un nouveau chapitre commence.` : `Tu navigues vers ${label}.`, wasNewRegion ? "major" : "neutral");
  closeModal();
  save();
  renderGame(true);
  maybeSpawnIslandVault();
}

/* ================= DEVIL FRUIT VAULT MINI-GAME ================= */

function buildVaultChests(){
  const pool = [
    { type:"fruit" },
    { type:"beli", amount: rand(800,2500) },
    { type:"beli", amount: rand(800,2500) },
    { type:"trap", dmg: rand(8,18) },
    { type:"empty" }
  ];
  for(let i=pool.length-1;i>0;i--){
    const j = rand(0,i);
    [pool[i],pool[j]] = [pool[j],pool[i]];
  }
  return pool.map(c=>({ ...c, opened:false }));
}

const CHEST_ICONS = { fruit:"🍈", beli:"💰", trap:"💥", empty:"💨" };

function maybeSpawnIslandVault(){
  if(state.devilFruit){ state.islandVault = null; return; }
  if(state.islandVault && state.islandVault.island!==state.island){ state.islandVault = null; }
  if(state.islandVault) return;
  if(Math.random() < 0.32){
    state.islandVault = { island: state.island, stageId: state.stage, rumorHeard:false, chests: buildVaultChests(), resolved:false };
    save();
    openRumorChoice();
  }
}

function openRumorChoice(){
  const choices = [
    { label:"Écouter les rumeurs", sub:"Une rumeur circule sur un trésor caché ici",
      resolve(){
        state.islandVault.rumorHeard = true;
        addLog("Tu tends l'oreille dans une taverne du port : des rumeurs insistent sur un trésor caché — peut-être un fruit du démon — quelque part sur cette île.", "major");
        save();
        renderGame(true);
        openVaultMinigame();
      }
    },
    { label:"Ignorer et poursuivre ta route", sub:"",
      resolve(){
        state.islandVault = null;
        addLog("Tu préfères ne pas t'attarder sur de simples rumeurs de taverne.", "neutral");
        save();
        renderGame(true);
      }
    }
  ];
  pendingChoice = { choices, onResolve:(idx)=> choices[idx].resolve() };
  const html = `<p class="modal-intro">Dans une taverne du port, des voix murmurent qu'un trésor — peut-être un fruit du démon — serait caché quelque part sur cette île.</p>` + choices.map((c,i)=>`
    <div class="action-row" data-choice="${i}">
      <div><div class="a-label">${c.label}</div>${c.sub?`<div class="a-sub">${c.sub}</div>`:''}</div>
      <div class="a-val">→</div>
    </div>`).join("");
  openModal("Rumeurs de port", html);
  document.querySelectorAll("[data-choice]").forEach(el=>{
    el.addEventListener("click", ()=> resolvePendingChoice(+el.dataset.choice));
  });
}

function renderVaultHTML(){
  const vault = state.islandVault;
  const chestsHTML = vault.chests.map((c,i)=>{
    const icon = c.opened ? (CHEST_ICONS[c.type]||"📦") : "📦";
    const label = !c.opened ? "Coffre scellé" :
      c.type==="fruit" ? "Fruit du démon !" :
      c.type==="beli" ? `${fmt(c.amount)} Beli` :
      c.type==="trap" ? "Un piège !" : "Vide";
    return `<button class="chest-btn ${c.opened?'opened':''}" data-chest="${i}" ${c.opened?'disabled':''}>
      <span class="chest-icon">${icon}</span>
      <span class="chest-label">${label}</span>
    </button>`;
  }).join("");
  return `
    <p class="modal-intro">Des coffres scellés attendent d'être ouverts. Chaque coffre coûte une clé.</p>
    <div class="vault-keys">🔑 Clés disponibles : <b>${state.keys}</b></div>
    <div class="vault-grid">${chestsHTML}</div>
    <button class="btn btn-ghost btn-lg" id="btnVaultClose" style="margin-top:10px;">Fermer</button>
  `;
}

function openVaultMinigame(){
  if(!state.islandVault) return;
  openModal(`Les coffres de ${state.islandVault.island}`, renderVaultHTML());
  wireVaultButtons();
}

function wireVaultButtons(){
  document.querySelectorAll(".chest-btn:not(.opened)").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(state.keys<=0){ toast("Tu n'as pas de clé pour l'instant."); return; }
      openChest(+btn.dataset.chest);
    });
  });
  const closeBtn = document.getElementById("btnVaultClose");
  if(closeBtn) closeBtn.addEventListener("click", closeModal);
}

function finishChestUI(){
  checkDeath();
  save();
  renderGame(true);
  if(!state.alive){ closeModal(); return; }
  if(state.islandVault){
    document.getElementById("modalBody").innerHTML = renderVaultHTML();
    wireVaultButtons();
  } else {
    closeModal();
  }
}

function openChest(idx){
  const vault = state.islandVault;
  if(!vault) return;
  const chest = vault.chests[idx];
  if(!chest || chest.opened) return;
  state.keys -= 1;
  chest.opened = true;
  if(chest.type==="fruit"){
    vault.resolved = true;
    state.islandVault = null;
    addLog("Dans l'un des coffres, un fruit du démon repose sur un lit de velours.", "major");
    offerDevilFruit(pick(DEVIL_FRUITS), finishChestUI);
    return;
  } else if(chest.type==="beli"){
    state.beli += chest.amount;
    addLog(`Le coffre contenait ${fmt(chest.amount)} Beli.`, "good");
  } else if(chest.type==="trap"){
    state.health = clamp(state.health-chest.dmg,0,100);
    addLog(`Le coffre était piégé ! Tu perds ${chest.dmg} points de vie.`, "bad");
  } else {
    addLog("Le coffre est vide.", "neutral");
  }
  finishChestUI();
}

function islandChipHTML(name, stage){
  const isHere = state.stage===stage.id && state.island===name;
  return `<div class="island-chip ${isHere?'here':''}" data-island="${name}">
    <div class="island-chip-head">
      <span class="island-icon">${ISLAND_ICONS[name]||'🏝️'}</span>
      <span>${name}</span>
      ${isHere?'<span class="here-badge">ici</span>':''}
    </div>
    <div class="island-detail" hidden></div>
  </div>`;
}

function stageBlockHTML(s, p){
  const reached = state.maxStage>=s.id;
  const isCurrent = state.stage===s.id;
  const canLeaveEastBlue = state.pathChosen;
  const nextAvailable = state.maxStage===s.id-1 && p>=s.req && canLeaveEastBlue;
  const locked = !reached && !nextAvailable;

  let statusLine;
  if(isCurrent) statusLine = "Position actuelle";
  else if(reached) statusLine = "Région déjà explorée";
  else if(!canLeaveEastBlue && state.maxStage===s.id-1) statusLine = "Verrouillé — choisis ta voie à l'âge adulte pour prendre la mer";
  else if(nextAvailable) statusLine = `Région accessible — puissance requise ${s.req} (toi : ${p})`;
  else statusLine = `Verrouillé — puissance requise : ${s.req}`;

  const islandPool = ISLANDS[s.id];
  const showIslands = (reached || nextAvailable) && islandPool;
  const islandsHTML = showIslands ? `<div class="map-islands">${islandPool.map(name=>islandChipHTML(name,s)).join("")}</div>` : "";
  const singleWaypoint = (!islandPool && nextAvailable) ? `<button class="btn btn-chip map-go" data-goto-stage="${s.id}" data-goto-island="">Naviguer ici</button>` : "";

  return `<div class="map-node ${locked?'locked':''} ${isCurrent?'current':''}" data-stage-id="${s.id}">
    <div class="map-node-marker">${isCurrent?'⛵':(reached?'📍':(nextAvailable?'🧭':'🔒'))}</div>
    <div class="map-node-body">
      <div class="map-node-title">${s.name}</div>
      <div class="map-node-sub">${statusLine}</div>
      ${islandsHTML}
      ${singleWaypoint}
    </div>
  </div>`;
}

function openMap(){
  mapInsightCache = {};
  const p = powerScore();
  const html = `<div class="map-route">${STAGES.map(s=>stageBlockHTML(s,p)).join("")}</div>`;
  openModal("Carte du monde", html);

  document.querySelectorAll(".island-chip").forEach(chip=>{
    const head = chip.querySelector(".island-chip-head");
    const detail = chip.querySelector(".island-detail");
    const name = chip.dataset.island;
    head.addEventListener("click", ()=>{
      if(!detail.hidden){ detail.hidden = true; return; }
      const stageId = +chip.closest(".map-node").dataset.stageId;
      if(!mapInsightCache[name]) mapInsightCache[name] = buildIslandInsight(stageId);
      const insight = mapInsightCache[name];
      const stage = STAGES[stageId];
      const canTravel = state.maxStage>=stageId || (state.maxStage===stageId-1 && p>=stage.req && state.pathChosen);
      const already = state.stage===stageId && state.island===name;
      detail.hidden = false;
      detail.innerHTML = `
        <div class="insight-row">⚔️ <b>${insight.menaceLevel}</b><br>${insight.menaceText}</div>
        <div class="insight-row">🎖️ Présence de la Marine : <b>${insight.marineThreat}</b></div>
        ${insight.devilFruitRumor ? `<div class="insight-row">🍈 Rumeur d'un fruit du démon caché sur l'île.</div>` : ""}
        ${canTravel && !already ? `<button class="btn btn-primary map-go" data-goto-stage="${stageId}" data-goto-island="${name}">Naviguer vers ${name}</button>` : ""}
      `;
      const goBtn = detail.querySelector(".map-go");
      if(goBtn) goBtn.addEventListener("click", ()=> travelTo(+goBtn.dataset.gotoStage, goBtn.dataset.gotoIsland));
    });
  });

  document.querySelectorAll(".map-node > .map-node-body > .map-go").forEach(btn=>{
    btn.addEventListener("click", ()=> travelTo(+btn.dataset.gotoStage, btn.dataset.gotoIsland));
  });
}

/* ================= CREW VIEW ================= */

function openShipView(){
  const isPirate = state.path==="pirate";
  const labels = CREW_LABELS[state.path];
  const tier = SHIP_TIERS[state.ship.tier];
  const nextTier = SHIP_TIERS[state.ship.tier+1];

  let html = "";

  if(isPirate){
    html += `
      <div class="action-row" style="cursor:default;">
        <div><div class="a-label">${tier.name}</div><div class="a-sub">Capacité ${state.crew.length}/${tier.capacity} · Puissance de feu ${tier.firepower}</div></div>
      </div>`;

    if(nextTier){
      const affordable = state.beli >= nextTier.cost;
      html += `<div class="action-row ${affordable?'':'disabled'}" id="btnUpgradeShip">
        <div><div class="a-label">Améliorer : ${nextTier.name}</div><div class="a-sub">Capacité ${nextTier.capacity} · Puissance de feu ${nextTier.firepower} · ${fmt(nextTier.cost)} Beli</div></div>
        <div class="a-val">${affordable?'⬆️':'🔒'}</div>
      </div>`;
    } else {
      html += `<div class="action-row" style="cursor:default;"><div><div class="a-label">Navire au niveau maximum</div></div></div>`;
    }
  } else if(labels){
    html += `
      <div class="action-row" style="cursor:default;">
        <div><div class="a-label">${labels.groupTitle}</div><div class="a-sub">${state.crew.length}/${crewCapacity()} membres</div></div>
      </div>`;
  }

  if(labels && state.crew.length>0){
    html += state.crew.map(c=>`
      <div class="crew-card">
        <div><b>${c.name}</b><span>${c.role}</span></div>
        <div class="a-val">💪 ${c.power}</div>
      </div>`).join("");
  } else if(labels){
    html += `<p style="color:#9fb3c8;font-size:13px;margin-top:10px;">${labels.emptyMsg}</p>`;
  } else {
    html += `<p style="color:#9fb3c8;font-size:13px;margin-top:10px;">Le navire et l'équipage sont réservés aux voies actives : Pirate, Marine, Chasseur de primes ou Révolutionnaire.</p>`;
  }

  openModal(isPirate ? "Navire" : (labels ? labels.groupTitle : "Navire"), html);
  const upgradeBtn = document.getElementById("btnUpgradeShip");
  if(upgradeBtn){
    upgradeBtn.addEventListener("click", ()=>{
      if(!nextTier || state.beli < nextTier.cost) return;
      state.beli -= nextTier.cost;
      state.ship.tier++;
      addLog(`Ton navire devient un(e) ${nextTier.name} ! Plus grand, plus rapide, plus armé.`, "major");
      closeModal();
      save();
      renderGame(true);
    });
  }
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
      <div><div class="a-label">Localisation</div><div class="a-sub">${state.island && state.island!==STAGES[state.stage].name ? state.island+' — '+STAGES[state.stage].name : STAGES[state.stage].name}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Haki</div><div class="a-sub">Observation ${state.hakiObs} · Armement ${state.hakiArm}${state.hakiConq?' · Rois ⚡':''}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Fruit du démon</div><div class="a-sub">${state.devilFruit ? state.devilFruit.name+' ('+state.devilFruit.type+')' : 'Aucun'}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Arme</div><div class="a-sub">${state.weapon ? state.weapon.name : 'Aucune arme équipée'}</div></div>
    </div>
    ${state.rival && !state.rival.defeated ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Rival</div><div class="a-sub">${state.rival.name} "${state.rival.epithet}" · ${state.rival.encounters}/4 affrontements</div></div>
    </div>` : ""}
    ${state.rival && state.rival.defeated ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Rival</div><div class="a-sub">${state.rival.name} "${state.rival.epithet}" — rivalité achevée</div></div>
    </div>` : ""}
    ${state.ally && state.ally.allied ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Allié·e</div><div class="a-sub">${state.ally.name} "${state.ally.epithet}" · te soutient dans les grandes batailles</div></div>
    </div>` : ""}
    ${!state.flags.hasRoadPoneglyph && (state.flags.poneglyphFragments||0)>0 ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Fragments de Poneglyphe</div><div class="a-sub">${state.flags.poneglyphFragments}/3 — assez d'intelligence sur Grand Line peut t'en révéler d'autres</div></div>
    </div>` : ""}
    ${state.flags.hasRoadPoneglyph ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Poneglyphe Route</div><div class="a-sub">Complet — la voie vers Laugh Tale t'est ouverte</div></div>
    </div>` : ""}
    ${(state.flags.wanoQuestStage||0)>0 && (state.flags.wanoQuestStage||0)<4 ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Résistance de Wano</div><div class="a-sub">Étape ${state.flags.wanoQuestStage}/4 · ${state.flags.wanoQuestBonus||0} soutien(s) acquis</div></div>
    </div>` : ""}
    ${(state.flags.wanoQuestStage||0)>=4 ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Résistance de Wano</div><div class="a-sub">Prête à frapper · ${state.flags.wanoQuestBonus||0} soutien(s) pour la bataille finale</div></div>
    </div>` : ""}
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
  document.getElementById("barEnergy").style.width = state.energy+"%";
  document.getElementById("hudBeli").textContent = fmt(state.beli);

  const locLabel = state.island && state.island !== STAGES[state.stage].name
    ? `${state.island} — ${STAGES[state.stage].name}`
    : STAGES[state.stage].name;
  document.getElementById("hudLoc").textContent = "📍 " + locLabel;

  const bountyWrap = document.getElementById("hudBountyWrap");
  if(state.path==="pirate" && state.bountyRevealed){
    bountyWrap.hidden = false;
    document.getElementById("hudBounty").textContent = fmt(state.bounty);
  } else {
    bountyWrap.hidden = true;
  }

  const logEl = document.getElementById("log");
  const wasNearBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 80;
  logEl.innerHTML = state.log.map(e=>
    `<div class="log-entry ${e.type}">Âge ${e.age} — ${e.text}</div>`
  ).join("");
  if(scrollLog && wasNearBottom) logEl.scrollTop = logEl.scrollHeight;

  document.getElementById("btnAge").style.opacity = state.alive ? 1 : 0.3;
  document.getElementById("btnAge").disabled = !state.alive;

  if(window.OPL && window.OPL._afterRender) window.OPL._afterRender();
}

/* ================= END SCREEN ================= */

function renderEndScreen(entry, victory, causeId, unlockedList){
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

  const achEl = document.getElementById("endAchievements");
  if(achEl){
    const unlockedSet = new Set(unlockedList || loadUnlockedEndings());
    achEl.innerHTML = `
      <div class="ach-head">Fins découvertes : <b>${unlockedSet.size}</b> / ${ENDINGS_CATALOG.length}</div>
      <div class="ach-grid">
        ${ENDINGS_CATALOG.map(e=>{
          const got = unlockedSet.has(e.id);
          const isNew = e.id===causeId;
          return `<div class="ach-badge ${got?'unlocked':'locked'} ${isNew?'just-unlocked':''}">
            <span class="ach-icon">${got?e.icon:'❔'}</span>
            <span class="ach-label">${got?e.label:'???'}</span>
          </div>`;
        }).join("")}
      </div>`;
  }

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

  document.getElementById("btnAge").addEventListener("click", ()=>{
    if(window.OPL && window.OPL._onAgeClick && window.OPL._onAgeClick()) return;
    ageUp();
  });
  document.getElementById("btnActions").addEventListener("click", openActionsMenu);
  document.getElementById("btnMap").addEventListener("click", openMap);
  document.getElementById("btnCrew").addEventListener("click", openShipView);
  document.getElementById("btnStatus").addEventListener("click", openStatus);

  document.getElementById("modalClose").addEventListener("click", ()=>{
    if(miniGameActive) return;
    if(pendingChoice){ resolvePendingDefault(); } else { closeModal(); }
  });
  document.getElementById("modalOverlay").addEventListener("click", (e)=>{
    if(e.target.id==="modalOverlay"){
      if(miniGameActive) return;
      if(pendingChoice){ resolvePendingDefault(); } else { closeModal(); }
    }
  });

  const existing = loadSave();
  if(existing && existing.alive){
    if(existing.maxStage===undefined) existing.maxStage = existing.stage;
    if(!existing.flags) existing.flags = {};
    if(existing.keys===undefined) existing.keys = 0;
    if(existing.islandVault===undefined) existing.islandVault = null;
    if(existing.energy===undefined) existing.energy = 100;
    if(!existing.ship) existing.ship = { tier:0 };
    if(existing.rival===undefined) existing.rival = null;
    if(existing.ally===undefined) existing.ally = null;
    if(existing.weapon===undefined) existing.weapon = null;
    document.getElementById("btnContinue").hidden = false;
    document.getElementById("btnContinue").addEventListener("click", ()=>{
      state = existing;
      showScreen("screen-game");
      renderGame(true);
    });
  }
}

document.addEventListener("DOMContentLoaded", wire);

/* ================= EXPORT SURFACE (multijoueur) =================
   game.js tourne dans une IIFE fermée ; ce petit export explicite est
   le seul point d'accès pour multiplayer.js, chargé après ce script. */
window.OPL = {
  getState: () => state,
  setState: (s) => { state = s; },
  freshState,
  birthCharacter,
  renderCreateScreen,
  ageUp,
  finishAgeUp,
  death,
  save,
  renderGame,
  showScreen,
  openModal,
  closeModal,
  addLog,
  applyMods,
  powerScore,
  crewCapacity,
  startBattle,
  fmt,
  rand,
  pick,
  currentStage,
  STAGES,
  ISLAND_ICONS,
  pathLabel,
  // hook slots multiplayer.js peut renseigner ; no-op tant qu'ils ne le sont pas
  _onAgeClick: null,
  _afterYearResolved: null,
  _afterBirth: null,
  _afterRender: null,
  _onSpecialEvent: null
};

})();
