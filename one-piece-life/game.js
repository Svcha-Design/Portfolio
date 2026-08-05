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
  drowning: "Emporté·e par les flots, ton pouvoir de fruit du démon ne t'a pas pardonné."
};

const SPECIAL_EVENTS = [
  {
    id:"onigashima",
    title:"La guerre d'Onigashima",
    condition:()=> state.stage===4 && state.island==="Wano" && state.age>=18 &&
      (state.hakiObs>0 || state.hakiArm>0) && ["pirate","marine","revolutionnaire"].includes(state.path),
    text:"Un déferlement de flammes et de cris embrase le ciel de Wano : la bataille d'Onigashima vient d'éclater entre les forces de Kaido et une coalition de rebelles. Voulez-vous la rejoindre ?",
    choices:[
      { label:"Rejoindre la coalition contre Kaido", sub:"Risque très élevé, gloire immense en cas de victoire",
        resolve(){
          const enemyPower = rand(180,260);
          const winProb = clamp(0.35 + (powerScore()-enemyPower)/220, 0.05, 0.85);
          if(Math.random()<winProb){
            const gain = rand(15000,40000);
            if(state.path==="pirate") state.bounty += gain;
            state.beli += Math.round(gain/3);
            state.happiness = clamp(state.happiness+15,0,100);
            if(!state.hakiConq && Math.random()<0.25){
              state.hakiConq = true;
              addLog("Une pression titanesque explose en toi en pleine bataille : le Haki des Rois s'éveille !", "major");
            }
            addLog("Tu combats aux côtés des rebelles et contribues à la chute de Kaido. Ton nom résonnera dans tout Wano.", "good");
          } else {
            state.health = clamp(state.health - rand(35,60), 0, 100);
            addLog("La bataille est d'une violence inouïe. Tu t'en sors à peine vivant·e.", "bad");
            if(state.health<=0 || Math.random()<0.12) death("battle");
          }
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
      { label:"Te jeter dans la bataille", sub:"Un affrontement historique",
        resolve(){
          const enemyPower = rand(150,220);
          const winProb = clamp(0.4 + (powerScore()-enemyPower)/200, 0.1, 0.85);
          if(Math.random()<winProb){
            if(state.path==="pirate"){
              state.bounty += rand(10000,30000);
              addLog("Tu marques les esprits en tenant tête à des vice-amiraux. Ta prime s'envole.", "good");
            } else {
              state.marineRank = Math.min(MARINE_RANKS.length-1, state.marineRank+1);
              addLog(`Ta bravoure au front te vaut une promotion immédiate : ${MARINE_RANKS[state.marineRank]} !`, "major");
            }
            state.happiness = clamp(state.happiness+10,0,100);
          } else {
            state.health = clamp(state.health - rand(30,55), 0, 100);
            addLog("Tu es pris·e dans la tourmente et ressors gravement blessé·e du champ de bataille.", "bad");
            if(state.health<=0 || Math.random()<0.15) death("battle");
          }
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
    id:"devilfruit_spawn",
    condition:()=> !state.devilFruit && ["pirate","chasseur"].includes(state.path),
    resolve(){
      const fruit = pick(DEVIL_FRUITS);
      state.devilFruit = fruit;
      applyMods(fruit.mods);
      addLog(`Sur une île isolée, tu remarques un fruit étrange à l'écorce spiralée. Sans réfléchir, tu le manges : c'est le ${fruit.name} (${fruit.type}) ! ${fruit.desc}`, "major");
    }
  }
];

function checkDiscovery(){
  if(Math.random() >= 0.12) return;
  const eligible = DISCOVERY_EVENTS.filter(e=>e.condition());
  if(!eligible.length) return;
  pick(eligible).resolve();
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

function triggerSpecialEvent(ev){
  state.flags[ev.id] = true;
  addLog(ev.text, "major");
  pendingChoice = { choices: ev.choices, onResolve:(idx)=>{
    ev.choices[idx].resolve();
    finishAgeUp();
  }};
  const html = ev.choices.map((c,i)=>`
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
    keys:0, islandVault:null
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
  checkDeath();
  checkBountyReveal();
  save();
  renderGame(true);

  if(state.age===16 && !state.pathChosen){
    setTimeout(openPathChoice, 300);
  }
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

function buildChildChoices(){
  const g = childYearGain();
  return [
    { label:pick(CHILD_TRAIN_LABELS), sub:`Force +${g} · Vitesse +${g} · Bonheur -3`,
      resolve(){
        applyMods({force:g, vitesse:g, happiness:-3});
        addLog(pick(CHILD_TRAIN_LOGS), "neutral");
      }
    },
    { label:pick(CHILD_STUDY_LABELS), sub:`Intelligence +${g+1} · Bonheur -3`,
      resolve(){
        applyMods({intelligence:g+1, happiness:-3});
        addLog(pick(CHILD_STUDY_LOGS), "neutral");
      }
    },
    { label:pick(CHILD_PLAY_LABELS), sub:`Charisme +${g} · Bonheur +6`,
      resolve(){
        applyMods({charisme:g, happiness:6});
        addLog(pick(CHILD_PLAY_LOGS), "neutral");
      }
    }
  ];
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

function buildYearChoices(){
  const path = state.path;
  const labels = PATH_YEAR_LABELS[path] || PATH_YEAR_LABELS.civil;
  const trainMods = PATH_TRAIN_MODS[path] || PATH_TRAIN_MODS.civil;

  return [
    { label:pick(labels.train), sub:"Progression sûre, mais fatigant",
      resolve(){
        applyMods({...trainMods, happiness:-4});
        addLog(pick(YEAR_TRAIN_LOGS), "neutral");
      }
    },
    { label:pick(labels.risky), sub:"Risqué : grand gain ou revers cuisant",
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
    { label:"Profiter de la vie", sub:"Bonheur & liens sociaux — l'option par défaut",
      resolve(){
        applyMods({happiness:12, charisme:1});
        addLog(pick(YEAR_SOCIAL_LOGS), "good");
      }
    }
  ];
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
    triggerHazard(danger);
  } else {
    checkDiscovery();
  }
  if(!state.alive){ finishAgeUp(); return; }

  // laugh tale victory check for pirates
  if(state.path==="pirate" && state.stage===5){
    const winChance = state.flags.hasRoadPoneglyph ? 0.6 : 0.35;
    if(powerScore() >= 240 && Math.random() < winChance){
      winEnding("pirate");
    }
  }

  finishAgeUp();
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
    if(Math.random()<0.3){
      state.keys += 1;
      addLog("Tu trouves une clé étrange sur ton adversaire vaincu.", "neutral");
    }
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
  rows.push({ label:"Fouiller l'île", sub:`Clés : ${state.keys}`, fn:searchIsland });

  if(["pirate","marine","chasseur","revolutionnaire"].includes(state.path)){
    rows.push({ label:"Chercher un combat", sub:"Tente ta chance contre un adversaire", fn:seekFight });
  }
  if(state.path==="pirate"){
    rows.push({ label:"Chercher un fruit du démon", sub: state.devilFruit? "Déjà obtenu" : "Chance rare de trouver un pouvoir", fn:seekDevilFruit, disabled: !!state.devilFruit });
    rows.push({ label:"Recruter un·e compagnon·gne", sub:`Équipage : ${state.crew.length}`, fn:recruitCrew });
  }
  if(state.islandVault && state.islandVault.island===state.island && state.islandVault.rumorHeard && !state.islandVault.resolved){
    const remaining = state.islandVault.chests.filter(c=>!c.opened).length;
    rows.push({ label:"Ouvrir les coffres", sub:`🔑 ${state.keys} clé(s) · ${remaining} coffre(s) restant(s)`, fn:openVaultMinigame });
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
function searchIsland(){
  const roll = Math.random();
  if(roll<0.4){
    state.keys += 1;
    addLog("Tu mets la main sur une vieille clé rouillée en fouillant les environs.", "good");
    toast("+1 clé");
  } else if(roll<0.7){
    const gain = rand(100,500);
    state.beli += gain;
    addLog(`Tu trouves ${fmt(gain)} Beli abandonnés sur le chemin.`, "good");
    toast(`+${fmt(gain)} Beli`);
  } else {
    addLog("Tu ne trouves rien d'intéressant cette fois.", "neutral");
    toast("Rien trouvé");
  }
  save(); renderGame(true);
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
  const html = choices.map((c,i)=>`
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

function openChest(idx){
  const vault = state.islandVault;
  if(!vault) return;
  const chest = vault.chests[idx];
  if(!chest || chest.opened) return;
  state.keys -= 1;
  chest.opened = true;
  if(chest.type==="fruit"){
    const fruit = pick(DEVIL_FRUITS);
    state.devilFruit = fruit;
    applyMods(fruit.mods);
    addLog(`Dans l'un des coffres, tu découvres le ${fruit.name} (${fruit.type}) ! ${fruit.desc}`, "major");
    vault.resolved = true;
    state.islandVault = null;
  } else if(chest.type==="beli"){
    state.beli += chest.amount;
    addLog(`Le coffre contenait ${fmt(chest.amount)} Beli.`, "good");
  } else if(chest.type==="trap"){
    state.health = clamp(state.health-chest.dmg,0,100);
    addLog(`Le coffre était piégé ! Tu perds ${chest.dmg} points de vie.`, "bad");
  } else {
    addLog("Le coffre est vide.", "neutral");
  }
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
  const nextAvailable = state.maxStage===s.id-1 && p>=s.req;
  const locked = !reached && !nextAvailable;

  let statusLine;
  if(isCurrent) statusLine = "Position actuelle";
  else if(reached) statusLine = "Région déjà explorée";
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
      const canTravel = state.maxStage>=stageId || (state.maxStage===stageId-1 && p>=stage.req);
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
      <div><div class="a-label">Localisation</div><div class="a-sub">${state.island && state.island!==STAGES[state.stage].name ? state.island+' — '+STAGES[state.stage].name : STAGES[state.stage].name}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Haki</div><div class="a-sub">Observation ${state.hakiObs} · Armement ${state.hakiArm}${state.hakiConq?' · Rois ⚡':''}</div></div>
    </div>
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Fruit du démon</div><div class="a-sub">${state.devilFruit ? state.devilFruit.name+' ('+state.devilFruit.type+')' : 'Aucun'}</div></div>
    </div>
    ${!state.flags.hasRoadPoneglyph && (state.flags.poneglyphFragments||0)>0 ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Fragments de Poneglyphe</div><div class="a-sub">${state.flags.poneglyphFragments}/3 — assez d'intelligence sur Grand Line peut t'en révéler d'autres</div></div>
    </div>` : ""}
    ${state.flags.hasRoadPoneglyph ? `
    <div class="action-row" style="cursor:default;">
      <div><div class="a-label">Poneglyphe Route</div><div class="a-sub">Complet — la voie vers Laugh Tale t'est ouverte</div></div>
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

  document.getElementById("modalClose").addEventListener("click", ()=>{
    if(pendingChoice){ resolvePendingDefault(); } else { closeModal(); }
  });
  document.getElementById("modalOverlay").addEventListener("click", (e)=>{
    if(e.target.id==="modalOverlay"){
      if(pendingChoice){ resolvePendingDefault(); } else { closeModal(); }
    }
  });

  const existing = loadSave();
  if(existing && existing.alive){
    if(existing.maxStage===undefined) existing.maxStage = existing.stage;
    if(!existing.flags) existing.flags = {};
    if(existing.keys===undefined) existing.keys = 0;
    if(existing.islandVault===undefined) existing.islandVault = null;
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
