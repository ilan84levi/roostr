/* Roostr Mini Crossword — daily 5×5 puzzles. rows: '#' = block.
   Puzzle for the day = CROSSWORDS[dayIndex % CROSSWORDS.length]. */
var CROSSWORDS = [
 {
  "rows": [
   "SET##",
   "AVID#",
   "CEDAR",
   "#RARE",
   "##LED"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Tennis unit",
    "answer": "SET"
   },
   {
    "n": 4,
    "clue": "Enthusiastic",
    "answer": "AVID"
   },
   {
    "n": 6,
    "clue": "Chest wood",
    "answer": "CEDAR"
   },
   {
    "n": 8,
    "clue": "Hard to find",
    "answer": "RARE"
   },
   {
    "n": 9,
    "clue": "Guided",
    "answer": "LED"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Biological pouch",
    "answer": "SAC"
   },
   {
    "n": 2,
    "clue": "At any time",
    "answer": "EVER"
   },
   {
    "n": 3,
    "clue": "Like some waves",
    "answer": "TIDAL"
   },
   {
    "n": 5,
    "clue": "Truth's alternative",
    "answer": "DARE"
   },
   {
    "n": 7,
    "clue": "Stop-sign color",
    "answer": "RED"
   }
  ]
 },
 {
  "rows": [
   "APT##",
   "NEAT#",
   "TEXAS",
   "#KELP",
   "##SEA"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Fitting",
    "answer": "APT"
   },
   {
    "n": 4,
    "clue": "Tidy",
    "answer": "NEAT"
   },
   {
    "n": 6,
    "clue": "Lone Star State",
    "answer": "TEXAS"
   },
   {
    "n": 8,
    "clue": "Sea plant",
    "answer": "KELP"
   },
   {
    "n": 9,
    "clue": "Salty expanse",
    "answer": "SEA"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Picnic invader",
    "answer": "ANT"
   },
   {
    "n": 2,
    "clue": "Quick look",
    "answer": "PEEK"
   },
   {
    "n": 3,
    "clue": "April headaches",
    "answer": "TAXES"
   },
   {
    "n": 5,
    "clue": "Story",
    "answer": "TALE"
   },
   {
    "n": 7,
    "clue": "Pampering place",
    "answer": "SPA"
   }
  ]
 },
 {
  "rows": [
   "OHM##",
   "POEM#",
   "TULIP",
   "#ROLE",
   "##NET"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Resistance unit",
    "answer": "OHM"
   },
   {
    "n": 4,
    "clue": "Verse work",
    "answer": "POEM"
   },
   {
    "n": 6,
    "clue": "Dutch bloom",
    "answer": "TULIP"
   },
   {
    "n": 8,
    "clue": "Actor's part",
    "answer": "ROLE"
   },
   {
    "n": 9,
    "clue": "Fisherman's tool",
    "answer": "NET"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Choose",
    "answer": "OPT"
   },
   {
    "n": 2,
    "clue": "60 minutes",
    "answer": "HOUR"
   },
   {
    "n": 3,
    "clue": "Picnic fruit",
    "answer": "MELON"
   },
   {
    "n": 5,
    "clue": "Long measure",
    "answer": "MILE"
   },
   {
    "n": 7,
    "clue": "Furry companion",
    "answer": "PET"
   }
  ]
 },
 {
  "rows": [
   "KID##",
   "EDIT#",
   "GEARS",
   "#AREA",
   "##YET"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Young goat or child",
    "answer": "KID"
   },
   {
    "n": 4,
    "clue": "Polish text",
    "answer": "EDIT"
   },
   {
    "n": 6,
    "clue": "Bike shifters",
    "answer": "GEARS"
   },
   {
    "n": 8,
    "clue": "Region",
    "answer": "AREA"
   },
   {
    "n": 9,
    "clue": "So far",
    "answer": "YET"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Beer barrel",
    "answer": "KEG"
   },
   {
    "n": 2,
    "clue": "Light-bulb moment",
    "answer": "IDEA"
   },
   {
    "n": 3,
    "clue": "Private journal",
    "answer": "DIARY"
   },
   {
    "n": 5,
    "clue": "Leafy giant",
    "answer": "TREE"
   },
   {
    "n": 7,
    "clue": "Took a seat",
    "answer": "SAT"
   }
  ]
 },
 {
  "rows": [
   "JAW##",
   "ACHE#",
   "BREAD",
   "#EASY",
   "##TEE"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Chewing bone",
    "answer": "JAW"
   },
   {
    "n": 4,
    "clue": "Dull pain",
    "answer": "ACHE"
   },
   {
    "n": 6,
    "clue": "Loaf staple",
    "answer": "BREAD"
   },
   {
    "n": 8,
    "clue": "Simple",
    "answer": "EASY"
   },
   {
    "n": 9,
    "clue": "Golf peg",
    "answer": "TEE"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Quick punch",
    "answer": "JAB"
   },
   {
    "n": 2,
    "clue": "Farm measure",
    "answer": "ACRE"
   },
   {
    "n": 3,
    "clue": "Flour source",
    "answer": "WHEAT"
   },
   {
    "n": 5,
    "clue": "Comfort",
    "answer": "EASE"
   },
   {
    "n": 7,
    "clue": "Hair colorer",
    "answer": "DYE"
   }
  ]
 },
 {
  "rows": [
   "WHO##",
   "OARS#",
   "ELBOW",
   "#FILE",
   "##TOT"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Which person",
    "answer": "WHO"
   },
   {
    "n": 4,
    "clue": "Rowing pair",
    "answer": "OARS"
   },
   {
    "n": 6,
    "clue": "Arm joint",
    "answer": "ELBOW"
   },
   {
    "n": 8,
    "clue": "Nail smoother",
    "answer": "FILE"
   },
   {
    "n": 9,
    "clue": "Small child",
    "answer": "TOT"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Misery",
    "answer": "WOE"
   },
   {
    "n": 2,
    "clue": "Fifty percent",
    "answer": "HALF"
   },
   {
    "n": 3,
    "clue": "Planet's path",
    "answer": "ORBIT"
   },
   {
    "n": 5,
    "clue": "One-person show",
    "answer": "SOLO"
   },
   {
    "n": 7,
    "clue": "Rained-on",
    "answer": "WET"
   }
  ]
 },
 {
  "rows": [
   "ADS##",
   "CRAB#",
   "TULIP",
   "#MAKE",
   "##DEN"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Commercials",
    "answer": "ADS"
   },
   {
    "n": 4,
    "clue": "Sideways walker",
    "answer": "CRAB"
   },
   {
    "n": 6,
    "clue": "Dutch bloom",
    "answer": "TULIP"
   },
   {
    "n": 8,
    "clue": "Create",
    "answer": "MAKE"
   },
   {
    "n": 9,
    "clue": "Bear's home",
    "answer": "DEN"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Play division",
    "answer": "ACT"
   },
   {
    "n": 2,
    "clue": "Beat keeper",
    "answer": "DRUM"
   },
   {
    "n": 3,
    "clue": "Leafy dish",
    "answer": "SALAD"
   },
   {
    "n": 5,
    "clue": "Two-wheeler",
    "answer": "BIKE"
   },
   {
    "n": 7,
    "clue": "Ink writer",
    "answer": "PEN"
   }
  ]
 },
 {
  "rows": [
   "HIS##",
   "ORAL#",
   "TOTAL",
   "#NICE",
   "##NET"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Belonging to him",
    "answer": "HIS"
   },
   {
    "n": 4,
    "clue": "Spoken",
    "answer": "ORAL"
   },
   {
    "n": 6,
    "clue": "Sum",
    "answer": "TOTAL"
   },
   {
    "n": 8,
    "clue": "Pleasant",
    "answer": "NICE"
   },
   {
    "n": 9,
    "clue": "Fisherman's tool",
    "answer": "NET"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Scorching",
    "answer": "HOT"
   },
   {
    "n": 2,
    "clue": "Wrinkle remover",
    "answer": "IRON"
   },
   {
    "n": 3,
    "clue": "Smooth fabric",
    "answer": "SATIN"
   },
   {
    "n": 5,
    "clue": "Shoe string",
    "answer": "LACE"
   },
   {
    "n": 7,
    "clue": "Allow",
    "answer": "LET"
   }
  ]
 },
 {
  "rows": [
   "FOR##",
   "AVID#",
   "RADIO",
   "#LEND",
   "##RED"
  ],
  "across": [
   {
    "n": 1,
    "clue": "In favor of",
    "answer": "FOR"
   },
   {
    "n": 4,
    "clue": "Enthusiastic",
    "answer": "AVID"
   },
   {
    "n": 6,
    "clue": "Music box",
    "answer": "RADIO"
   },
   {
    "n": 8,
    "clue": "Give temporarily",
    "answer": "LEND"
   },
   {
    "n": 9,
    "clue": "Stop-sign color",
    "answer": "RED"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Distant",
    "answer": "FAR"
   },
   {
    "n": 2,
    "clue": "Egg shape",
    "answer": "OVAL"
   },
   {
    "n": 3,
    "clue": "Passenger",
    "answer": "RIDER"
   },
   {
    "n": 5,
    "clue": "Eat fancily",
    "answer": "DINE"
   },
   {
    "n": 7,
    "clue": "Strange",
    "answer": "ODD"
   }
  ]
 },
 {
  "rows": [
   "WED##",
   "EARS#",
   "BREAD",
   "#NAME",
   "##MEN"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Marry",
    "answer": "WED"
   },
   {
    "n": 4,
    "clue": "Corn units",
    "answer": "EARS"
   },
   {
    "n": 6,
    "clue": "Loaf staple",
    "answer": "BREAD"
   },
   {
    "n": 8,
    "clue": "What's yours?",
    "answer": "NAME"
   },
   {
    "n": 9,
    "clue": "Adult males",
    "answer": "MEN"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Spider's creation",
    "answer": "WEB"
   },
   {
    "n": 2,
    "clue": "Bring home",
    "answer": "EARN"
   },
   {
    "n": 3,
    "clue": "Sleep story",
    "answer": "DREAM"
   },
   {
    "n": 5,
    "clue": "Identical",
    "answer": "SAME"
   },
   {
    "n": 7,
    "clue": "Bear's home",
    "answer": "DEN"
   }
  ]
 },
 {
  "rows": [
   "OAR##",
   "FREE#",
   "TEACH",
   "#ACHE",
   "##HOW"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Rowboat mover",
    "answer": "OAR"
   },
   {
    "n": 4,
    "clue": "Costing nothing",
    "answer": "FREE"
   },
   {
    "n": 6,
    "clue": "Give lessons",
    "answer": "TEACH"
   },
   {
    "n": 8,
    "clue": "Dull pain",
    "answer": "ACHE"
   },
   {
    "n": 9,
    "clue": "In what way",
    "answer": "HOW"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Frequently, poetically",
    "answer": "OFT"
   },
   {
    "n": 2,
    "clue": "Region",
    "answer": "AREA"
   },
   {
    "n": 3,
    "clue": "Stretch toward",
    "answer": "REACH"
   },
   {
    "n": 5,
    "clue": "Canyon comeback",
    "answer": "ECHO"
   },
   {
    "n": 7,
    "clue": "Chop",
    "answer": "HEW"
   }
  ]
 },
 {
  "rows": [
   "ARC##",
   "MOOD#",
   "PARIS",
   "#RACE",
   "##LET"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Curved line",
    "answer": "ARC"
   },
   {
    "n": 4,
    "clue": "Frame of mind",
    "answer": "MOOD"
   },
   {
    "n": 6,
    "clue": "City of Light",
    "answer": "PARIS"
   },
   {
    "n": 8,
    "clue": "Speed contest",
    "answer": "RACE"
   },
   {
    "n": 9,
    "clue": "Allow",
    "answer": "LET"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Guitarist's box",
    "answer": "AMP"
   },
   {
    "n": 2,
    "clue": "Lion's sound",
    "answer": "ROAR"
   },
   {
    "n": 3,
    "clue": "Reef builder",
    "answer": "CORAL"
   },
   {
    "n": 5,
    "clue": "Casino cubes",
    "answer": "DICE"
   },
   {
    "n": 7,
    "clue": "Tennis unit",
    "answer": "SET"
   }
  ]
 },
 {
  "rows": [
   "AWE##",
   "RAMP#",
   "TRAIN",
   "#MINE",
   "##LET"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Wonder",
    "answer": "AWE"
   },
   {
    "n": 4,
    "clue": "Skateboard fixture",
    "answer": "RAMP"
   },
   {
    "n": 6,
    "clue": "Track traveler",
    "answer": "TRAIN"
   },
   {
    "n": 8,
    "clue": "Belonging to me",
    "answer": "MINE"
   },
   {
    "n": 9,
    "clue": "Allow",
    "answer": "LET"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Gallery display",
    "answer": "ART"
   },
   {
    "n": 2,
    "clue": "Cozy",
    "answer": "WARM"
   },
   {
    "n": 3,
    "clue": "Inbox item",
    "answer": "EMAIL"
   },
   {
    "n": 5,
    "clue": "Christmas-tree option",
    "answer": "PINE"
   },
   {
    "n": 7,
    "clue": "Fisherman's tool",
    "answer": "NET"
   }
  ]
 },
 {
  "rows": [
   "SEA##",
   "OURS#",
   "BREAD",
   "#ONLY",
   "##ATE"
  ],
  "across": [
   {
    "n": 1,
    "clue": "Salty expanse",
    "answer": "SEA"
   },
   {
    "n": 4,
    "clue": "Belonging to us",
    "answer": "OURS"
   },
   {
    "n": 6,
    "clue": "Loaf staple",
    "answer": "BREAD"
   },
   {
    "n": 8,
    "clue": "Sole",
    "answer": "ONLY"
   },
   {
    "n": 9,
    "clue": "Had dinner",
    "answer": "ATE"
   }
  ],
  "down": [
   {
    "n": 1,
    "clue": "Loud cry",
    "answer": "SOB"
   },
   {
    "n": 2,
    "clue": "Continental currency",
    "answer": "EURO"
   },
   {
    "n": 3,
    "clue": "Sports venue",
    "answer": "ARENA"
   },
   {
    "n": 5,
    "clue": "Pepper's partner",
    "answer": "SALT"
   },
   {
    "n": 7,
    "clue": "Hair colorer",
    "answer": "DYE"
   }
  ]
 }
];
if (typeof module !== "undefined" && module.exports) module.exports = CROSSWORDS;
