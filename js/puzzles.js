/* Pecking Order — puzzle data.
   Items are stored in ASCENDING order of the hidden value (index 0 = lowest).
   Only relative order is used by the game; display values are shown after the
   round ends. Values curated 2026-06 from stable public reference knowledge. */
const PUZZLES = [
  {
    q: "Planets, by size", metric: "Diameter", lo: "Smallest", hi: "Biggest",
    items: [["Mercury", "4,879 km"], ["Mars", "6,779 km"], ["Earth", "12,742 km"], ["Neptune", "49,244 km"], ["Jupiter", "139,820 km"]],
    fact: "Over 1,300 Earths could fit inside Jupiter."
  },
  {
    q: "Sprinters of the animal kingdom", metric: "Top speed", lo: "Slowest", hi: "Fastest",
    items: [["Garden snail", "0.05 km/h"], ["Chicken", "14 km/h"], ["Usain Bolt", "45 km/h"], ["Greyhound", "70 km/h"], ["Cheetah", "112 km/h"]],
    fact: "A cheetah out-accelerates most sports cars from 0 to 60."
  },
  {
    q: "Famous structures", metric: "Height", lo: "Shortest", hi: "Tallest",
    items: [["Big Ben", "96 m"], ["Great Pyramid of Giza", "139 m"], ["Eiffel Tower", "330 m"], ["Empire State Building", "443 m"], ["Burj Khalifa", "828 m"]],
    fact: "The Great Pyramid was the world's tallest structure for 3,800 years."
  },
  {
    q: "Countries, by people", metric: "Population", lo: "Fewest", hi: "Most",
    items: [["Australia", "≈ 27 million"], ["Brazil", "≈ 216 million"], ["United States", "≈ 340 million"], ["China", "≈ 1.41 billion"], ["India", "≈ 1.44 billion"]],
    fact: "India overtook China as the world's most populous country in 2023."
  },
  {
    q: "Your morning fix", metric: "Caffeine per serving", lo: "Least", hi: "Most",
    items: [["Decaf coffee", "≈ 5 mg"], ["Green tea", "≈ 28 mg"], ["Espresso shot", "≈ 63 mg"], ["Red Bull (250 ml)", "≈ 80 mg"], ["Mug of drip coffee", "≈ 95 mg"]],
    fact: "A plain mug of drip coffee beats a Red Bull."
  },
  {
    q: "Video game history", metric: "Release year", lo: "Oldest", hi: "Newest",
    items: [["Pong", "1972"], ["Pac-Man", "1980"], ["Tetris", "1984"], ["Doom", "1993"], ["Minecraft", "2011"]],
    fact: "Tetris was written behind the Iron Curtain on a Soviet Elektronika 60."
  },
  {
    q: "Heavyweights", metric: "Weight", lo: "Lightest", hi: "Heaviest",
    items: [["Vending machine", "≈ 300 kg"], ["Grand piano", "≈ 450 kg"], ["Walrus", "≈ 1,200 kg"], ["Blue whale's tongue", "≈ 2,700 kg"], ["T. rex", "≈ 8,000 kg"]],
    fact: "A blue whale's tongue alone outweighs a family car."
  },
  {
    q: "Great inventions", metric: "Year invented", lo: "Oldest", hi: "Newest",
    items: [["Telescope", "1608"], ["Steam locomotive", "1804"], ["Telephone", "1876"], ["Television", "1927"], ["Microwave oven", "1945"]],
    fact: "The microwave was discovered when a radar engineer's chocolate bar melted in his pocket."
  },
  {
    q: "Rivers of the world", metric: "Length", lo: "Shortest", hi: "Longest",
    items: [["Thames", "346 km"], ["Rhine", "1,230 km"], ["Danube", "2,850 km"], ["Mississippi", "3,766 km"], ["Nile", "6,650 km"]],
    fact: "The Nile flows through eleven countries."
  },
  {
    q: "Peaks", metric: "Height above sea level", lo: "Lowest", hi: "Highest",
    items: [["Ben Nevis", "1,345 m"], ["Mount Fuji", "3,776 m"], ["Mont Blanc", "4,808 m"], ["Kilimanjaro", "5,895 m"], ["Everest", "8,849 m"]],
    fact: "Everest grows about 4 mm taller every year."
  },
  {
    q: "Time on Earth", metric: "Typical lifespan", lo: "Shortest", hi: "Longest",
    items: [["Adult mayfly", "≈ 1 day"], ["Hamster", "≈ 3 years"], ["Dog", "≈ 13 years"], ["African elephant", "≈ 65 years"], ["Greenland shark", "300+ years"]],
    fact: "Some Greenland sharks swimming today were born before the United States existed."
  },
  {
    q: "Snack check", metric: "Calories per 100 g", lo: "Lightest", hi: "Heaviest",
    items: [["Cucumber", "15 kcal"], ["Apple", "52 kcal"], ["Avocado", "160 kcal"], ["Milk chocolate", "535 kcal"], ["Macadamia nuts", "718 kcal"]],
    fact: "Gram for gram, macadamia nuts pack more calories than chocolate."
  },
  {
    q: "Company origin stories", metric: "Year founded", lo: "Oldest", hi: "Newest",
    items: [["Nintendo", "1889"], ["Disney", "1923"], ["Sony", "1946"], ["Microsoft", "1975"], ["Google", "1998"]],
    fact: "Nintendo spent its first 80 years selling playing cards."
  },
  {
    q: "Need for speed", metric: "Top speed", lo: "Slowest", hi: "Fastest",
    items: [["Formula 1 car", "≈ 370 km/h"], ["Airliner at cruise", "≈ 900 km/h"], ["Sound (sea level)", "1,235 km/h"], ["International Space Station", "≈ 27,600 km/h"], ["Light", "1.08 billion km/h"]],
    fact: "The ISS laps the entire planet in about 90 minutes."
  },
  {
    q: "Distance from the Sun", metric: "Average distance", lo: "Closest", hi: "Farthest",
    items: [["Mercury", "58 million km"], ["Venus", "108 million km"], ["Mars", "228 million km"], ["Saturn", "1,434 million km"], ["Neptune", "4,495 million km"]],
    fact: "Sunlight takes over 4 hours to reach Neptune — and 8 minutes to reach Earth."
  },
  {
    q: "The waiting game", metric: "Pregnancy length", lo: "Shortest", hi: "Longest",
    items: [["Hamster", "≈ 16 days"], ["Cat", "≈ 65 days"], ["Human", "≈ 280 days"], ["Giraffe", "≈ 450 days"], ["African elephant", "≈ 645 days"]],
    fact: "Elephants are pregnant for nearly two years."
  },
  {
    q: "Console wars", metric: "Launch year", lo: "Oldest", hi: "Newest",
    items: [["Atari 2600", "1977"], ["Game Boy", "1989"], ["PlayStation", "1994"], ["Xbox 360", "2005"], ["Nintendo Switch", "2017"]],
    fact: "The Game Boy survived a Gulf War bombing and still works — it's on display at Nintendo New York."
  },
  {
    q: "Things that melt", metric: "Melting point", lo: "Lowest", hi: "Highest",
    items: [["Mercury (metal)", "−39 °C"], ["Tin", "232 °C"], ["Aluminium", "660 °C"], ["Gold", "1,064 °C"], ["Tungsten", "3,422 °C"]],
    fact: "Tungsten's melting point is why it survived inside old light bulbs."
  },
  {
    q: "Into the deep", metric: "Deepest point", lo: "Shallowest", hi: "Deepest",
    items: [["Mediterranean Sea", "≈ 5,267 m"], ["Arctic Ocean", "≈ 5,550 m"], ["Indian Ocean", "≈ 7,290 m"], ["Atlantic Ocean", "≈ 8,376 m"], ["Pacific Ocean", "≈ 10,935 m"]],
    fact: "Everest would vanish into the Mariana Trench with 2 km of water to spare."
  },
  {
    q: "A night at the movies", metric: "Release year", lo: "Oldest", hi: "Newest",
    items: [["The Wizard of Oz", "1939"], ["Psycho", "1960"], ["Jaws", "1975"], ["Jurassic Park", "1993"], ["Avatar", "2009"]],
    fact: "Jaws' mechanical shark broke so often that Spielberg mostly implied it — and invented the blockbuster."
  },
  {
    q: "Heartbeats", metric: "Resting heart rate", lo: "Slowest", hi: "Fastest",
    items: [["Blue whale", "≈ 10 bpm"], ["Elephant", "≈ 30 bpm"], ["Human", "≈ 70 bpm"], ["Cat", "≈ 150 bpm"], ["Hummingbird", "≈ 1,200 bpm"]],
    fact: "A hummingbird's heart can beat 20 times a second."
  },
  {
    q: "Champion nappers", metric: "Sleep per day", lo: "Least", hi: "Most",
    items: [["Giraffe", "≈ 4.5 h"], ["Human", "≈ 8 h"], ["Dog", "≈ 10.5 h"], ["Cat", "≈ 12.5 h"], ["Koala", "≈ 20 h"]],
    fact: "Wild giraffes often sleep standing up, minutes at a time."
  },
  {
    q: "US states", metric: "Land area", lo: "Smallest", hi: "Biggest",
    items: [["Rhode Island", "≈ 4,000 km²"], ["Florida", "≈ 170,000 km²"], ["California", "≈ 424,000 km²"], ["Texas", "≈ 696,000 km²"], ["Alaska", "≈ 1.72 million km²"]],
    fact: "Alaska is bigger than the next three largest states combined."
  },
  {
    q: "Countries, by land", metric: "Area", lo: "Smallest", hi: "Biggest",
    items: [["Monaco", "≈ 2 km²"], ["Singapore", "≈ 730 km²"], ["Iceland", "≈ 103,000 km²"], ["India", "≈ 3.29 million km²"], ["Russia", "≈ 17.1 million km²"]],
    fact: "Russia spans 11 time zones."
  },
  {
    q: "Masterpieces", metric: "Year painted", lo: "Oldest", hi: "Newest",
    items: [["Mona Lisa", "≈ 1503"], ["Girl with a Pearl Earring", "≈ 1665"], ["The Starry Night", "1889"], ["The Persistence of Memory", "1931"], ["Campbell's Soup Cans", "1962"]],
    fact: "Van Gogh painted The Starry Night from an asylum window — from memory, by day."
  },
  {
    q: "One sitting", metric: "Calories per serving", lo: "Least", hi: "Most",
    items: [["Carrot", "≈ 25 kcal"], ["Glazed donut", "≈ 260 kcal"], ["Big Mac", "≈ 563 kcal"], ["Loaded burrito", "≈ 1,000 kcal"], ["Whole medium pizza", "≈ 1,800 kcal"]],
    fact: "One loaded burrito can pass half a day's calories."
  },
  {
    q: "Turning points", metric: "Year", lo: "Earliest", hi: "Latest",
    items: [["Magna Carta", "1215"], ["Gutenberg's press", "≈ 1440"], ["Columbus reaches the Americas", "1492"], ["French Revolution", "1789"], ["Moon landing", "1969"]],
    fact: "Only 477 years separate the printing press from the Saturn V."
  },
  {
    q: "The feed", metric: "Year launched", lo: "Oldest", hi: "Newest",
    items: [["Wikipedia", "2001"], ["Facebook", "2004"], ["Instagram", "2010"], ["TikTok", "2016"], ["Threads", "2023"]],
    fact: "Instagram had 13 employees when it sold for $1 billion."
  },
  {
    q: "Good dogs", metric: "Typical adult weight", lo: "Lightest", hi: "Heaviest",
    items: [["Chihuahua", "≈ 2 kg"], ["Beagle", "≈ 10 kg"], ["Border Collie", "≈ 18 kg"], ["Labrador", "≈ 30 kg"], ["Great Dane", "≈ 60 kg"]],
    fact: "A Great Dane can outweigh an adult human."
  },
  {
    q: "Hot and cold", metric: "Temperature", lo: "Coldest", hi: "Hottest",
    items: [["Coldest recorded on Earth", "−89 °C"], ["Human body", "37 °C"], ["Hottest air recorded", "56.7 °C"], ["Boiling water", "100 °C"], ["Fresh lava", "≈ 1,100 °C"]],
    fact: "The −89 °C record was set at Vostok Station, Antarctica, in 1983."
  },
  {
    q: "Moon collectors", metric: "Number of known moons", lo: "Fewest", hi: "Most",
    items: [["Earth", "1"], ["Mars", "2"], ["Neptune", "16"], ["Uranus", "28"], ["Saturn", "270+"]],
    fact: "Saturn snatched the moon crown from Jupiter after a wave of new discoveries."
  },
  {
    q: "Mother tongues", metric: "Native speakers", lo: "Fewest", hi: "Most",
    items: [["Italian", "≈ 64 million"], ["Japanese", "≈ 123 million"], ["Portuguese", "≈ 250 million"], ["Spanish", "≈ 485 million"], ["Mandarin", "≈ 940 million"]],
    fact: "Portuguese has more native speakers than French and German combined."
  },
  {
    q: "Game day firsts", metric: "First edition", lo: "Earliest", hi: "Latest",
    items: [["Modern Olympics", "1896"], ["FIFA World Cup", "1930"], ["Super Bowl", "1967"], ["X Games", "1995"], ["League of Legends Worlds", "2011"]],
    fact: "The first World Cup final drew 68,000 fans; the first esports Worlds, a few hundred."
  },
  {
    q: "The periodic table", metric: "Atomic number", lo: "Lowest", hi: "Highest",
    items: [["Helium", "2"], ["Oxygen", "8"], ["Iron", "26"], ["Silver", "47"], ["Uranium", "92"]],
    fact: "Every atom of silver on Earth was forged in a stellar explosion."
  },
  {
    q: "Standing tall", metric: "Statue height (without pedestal)", lo: "Shortest", hi: "Tallest",
    items: [["Michelangelo's David", "5 m"], ["Christ the Redeemer", "30 m"], ["Statue of Liberty", "46 m"], ["The Motherland Calls", "85 m"], ["Statue of Unity", "182 m"]],
    fact: "India's Statue of Unity stands four Liberties tall."
  },
  {
    q: "Brain budget", metric: "Brain weight", lo: "Lightest", hi: "Heaviest",
    items: [["Ostrich", "≈ 26 g"], ["Dog", "≈ 70 g"], ["Human", "≈ 1,400 g"], ["Elephant", "≈ 5,000 g"], ["Sperm whale", "≈ 7,800 g"]],
    fact: "An ostrich's eye is bigger than its brain."
  },
  {
    q: "Which came first", metric: "Egg weight", lo: "Lightest", hi: "Heaviest",
    items: [["Hummingbird", "≈ 0.5 g"], ["Quail", "≈ 9 g"], ["Chicken", "≈ 50 g"], ["Emu", "≈ 600 g"], ["Ostrich", "≈ 1,400 g"]],
    fact: "One ostrich egg is about a two-dozen-chicken-egg omelette."
  },
  {
    q: "Family game night", metric: "Year published", lo: "Oldest", hi: "Newest",
    items: [["Monopoly", "1935"], ["Scrabble", "1948"], ["Risk", "1957"], ["Dungeons & Dragons", "1974"], ["Catan", "1995"]],
    fact: "Monopoly began as 'The Landlord's Game' — a protest against monopolists."
  },
  {
    q: "The space race and after", metric: "Year", lo: "Earliest", hi: "Latest",
    items: [["Sputnik 1", "1957"], ["Gagarin orbits Earth", "1961"], ["Apollo 11 lands", "1969"], ["Hubble launches", "1990"], ["First crewed SpaceX flight", "2020"]],
    fact: "Twelve years separate the first satellite from boots on the Moon."
  },
  {
    q: "Online milestones", metric: "Year", lo: "Earliest", hi: "Latest",
    items: [["First email sent", "1971"], ["First website", "1991"], ["Google founded", "1998"], ["First iPhone", "2007"], ["ChatGPT released", "2022"]],
    fact: "The first website is still online at info.cern.ch."
  },
  {
    q: "Head and shoulders", metric: "Standing height", lo: "Shortest", hi: "Tallest",
    items: [["Meerkat", "≈ 0.3 m"], ["Emperor penguin", "≈ 1.2 m"], ["Ostrich", "≈ 2.8 m"], ["African elephant", "≈ 3.3 m"], ["Giraffe", "≈ 5.5 m"]],
    fact: "A giraffe's neck has the same number of vertebrae as yours: seven."
  },
  {
    q: "Turn it down", metric: "Loudest call", lo: "Quietest", hi: "Loudest",
    items: [["Lion's roar", "≈ 114 dB"], ["Cicada chorus", "≈ 120 dB"], ["Howler monkey", "≈ 140 dB"], ["Blue whale", "≈ 188 dB"], ["Sperm whale clicks", "≈ 230 dB"]],
    fact: "A sperm whale's click is louder than a rocket launch."
  },
  {
    q: "Required reading", metric: "Year published", lo: "Oldest", hi: "Newest",
    items: [["Don Quixote", "1605"], ["Pride and Prejudice", "1813"], ["Sherlock Holmes debuts", "1887"], ["The Hobbit", "1937"], ["Harry Potter debuts", "1997"]],
    fact: "Don Quixote is often called the first modern novel."
  },
  {
    q: "Disney classics", metric: "Release year", lo: "Oldest", hi: "Newest",
    items: [["Snow White", "1937"], ["Cinderella", "1950"], ["The Little Mermaid", "1989"], ["The Lion King", "1994"], ["Frozen", "2013"]],
    fact: "Snow White was the first full-length cel-animated feature ever made."
  },
  {
    q: "Heavy metal", metric: "Density", lo: "Lightest", hi: "Densest",
    items: [["Aluminium", "2.7 g/cm³"], ["Iron", "7.9 g/cm³"], ["Lead", "11.3 g/cm³"], ["Gold", "19.3 g/cm³"], ["Osmium", "22.6 g/cm³"]],
    fact: "A gold brick the size of a milk carton weighs ~19 kg."
  },
  {
    q: "Handle with care", metric: "Scoville heat units", lo: "Mildest", hi: "Hottest",
    items: [["Bell pepper", "0 SHU"], ["Jalapeño", "≈ 5,000 SHU"], ["Habanero", "≈ 225,000 SHU"], ["Ghost pepper", "≈ 1,000,000 SHU"], ["Carolina Reaper", "≈ 1,600,000 SHU"]],
    fact: "The Carolina Reaper is 300 times hotter than a jalapeño."
  },
  {
    q: "Big city lights", metric: "Metro-area population", lo: "Smallest", hi: "Biggest",
    items: [["Reykjavik", "≈ 0.25 million"], ["Amsterdam", "≈ 2.5 million"], ["Berlin", "≈ 6 million"], ["Cairo", "≈ 22 million"], ["Tokyo", "≈ 37 million"]],
    fact: "Greater Tokyo holds more people than all of Canada."
  },
  {
    q: "Taking flight", metric: "First flight", lo: "Earliest", hi: "Latest",
    items: [["Wright Flyer", "1903"], ["Spirit of St. Louis", "1927"], ["de Havilland Comet (first jetliner)", "1952"], ["Boeing 747", "1969"], ["Airbus A380", "2005"]],
    fact: "The Wright brothers' first flight was shorter than a 747's wingspan."
  },
  {
    q: "Cats, big and small", metric: "Typical weight", lo: "Lightest", hi: "Heaviest",
    items: [["House cat", "≈ 4.5 kg"], ["Caracal", "≈ 12 kg"], ["Cheetah", "≈ 50 kg"], ["Lion", "≈ 190 kg"], ["Siberian tiger", "≈ 260 kg"]],
    fact: "Tigers are the only big cats that genuinely enjoy swimming."
  },
  {
    q: "Wingspans", metric: "Wingspan", lo: "Narrowest", hi: "Widest",
    items: [["Bee hummingbird", "≈ 7 cm"], ["Pigeon", "≈ 65 cm"], ["Peregrine falcon", "≈ 100 cm"], ["Bald eagle", "≈ 200 cm"], ["Wandering albatross", "≈ 350 cm"]],
    fact: "An albatross can glide for hours without a single wingbeat."
  },
  {
    q: "Hello, world", metric: "Year created", lo: "Oldest", hi: "Newest",
    items: [["Fortran", "1957"], ["C", "1972"], ["Python", "1991"], ["JavaScript", "1995"], ["Swift", "2014"]],
    fact: "JavaScript was built in 10 days — and now runs most of the web."
  },
  {
    q: "Small worlds", metric: "Diameter", lo: "Smallest", hi: "Biggest",
    items: [["Pluto", "2,377 km"], ["The Moon", "3,474 km"], ["Mercury", "4,879 km"], ["Mars", "6,779 km"], ["Earth", "12,742 km"]],
    fact: "Two moons — Ganymede and Titan — are bigger than the planet Mercury."
  },
  {
    q: "Everyday noise", metric: "Loudness", lo: "Quietest", hi: "Loudest",
    items: [["Whisper", "≈ 30 dB"], ["Conversation", "≈ 60 dB"], ["Lawnmower", "≈ 90 dB"], ["Rock concert", "≈ 115 dB"], ["Jet at takeoff (25 m)", "≈ 140 dB"]],
    fact: "Every 10 dB is roughly a doubling of perceived loudness."
  },
  {
    q: "Scratch test", metric: "Mohs hardness", lo: "Softest", hi: "Hardest",
    items: [["Talc", "1"], ["Fingernail", "≈ 2.5"], ["Glass", "≈ 5.5"], ["Quartz", "7"], ["Diamond", "10"]],
    fact: "Beach sand is mostly quartz — hard enough to scratch glass."
  },
  {
    q: "Landmark openings", metric: "Year completed", lo: "Oldest", hi: "Newest",
    items: [["Leaning Tower of Pisa", "1372"], ["Big Ben", "1859"], ["Eiffel Tower", "1889"], ["Empire State Building", "1931"], ["CN Tower", "1976"]],
    fact: "Pisa's tower took 199 years to build — it was leaning before it was finished."
  },
  {
    q: "Pedal to the metal", metric: "Top speed", lo: "Slowest", hi: "Fastest",
    items: [["Golf cart", "≈ 25 km/h"], ["Ford Model T", "≈ 72 km/h"], ["Modern hatchback", "≈ 190 km/h"], ["Formula 1 car", "≈ 370 km/h"], ["Bugatti Chiron SS", "≈ 490 km/h"]],
    fact: "At top speed, the Chiron empties its fuel tank in about 8 minutes."
  },
  {
    q: "Dry spells", metric: "Desert area", lo: "Smallest", hi: "Biggest",
    items: [["Mojave", "≈ 120,000 km²"], ["Gobi", "≈ 1.3 million km²"], ["Arabian", "≈ 2.3 million km²"], ["Sahara", "≈ 9.2 million km²"], ["Antarctica", "≈ 14.2 million km²"]],
    fact: "The largest desert on Earth is made of ice — deserts are defined by dryness, not sand."
  },
  {
    q: "Still waters", metric: "Maximum depth", lo: "Shallowest", hi: "Deepest",
    items: [["Loch Ness", "≈ 230 m"], ["Crater Lake", "≈ 594 m"], ["Caspian Sea", "≈ 1,025 m"], ["Lake Tanganyika", "≈ 1,470 m"], ["Lake Baikal", "≈ 1,642 m"]],
    fact: "Lake Baikal holds about a fifth of Earth's unfrozen fresh water."
  },
  {
    q: "Islands", metric: "Area", lo: "Smallest", hi: "Biggest",
    items: [["Manhattan", "≈ 59 km²"], ["Bali", "≈ 5,780 km²"], ["Iceland", "≈ 103,000 km²"], ["Madagascar", "≈ 587,000 km²"], ["Greenland", "≈ 2.17 million km²"]],
    fact: "Greenland looks Africa-sized on most maps — it's actually 14× smaller."
  },
  {
    q: "How far up?", metric: "Distance from Earth's surface", lo: "Closest", hi: "Farthest",
    items: [["International Space Station", "≈ 400 km"], ["GPS satellites", "≈ 20,200 km"], ["Geostationary satellites", "≈ 35,786 km"], ["The Moon", "≈ 384,400 km"], ["Mars at its closest", "≈ 54.6 million km"]],
    fact: "The ISS is closer to you than London is to Paris."
  },
  {
    q: "A year elsewhere", metric: "Length of one orbit", lo: "Shortest", hi: "Longest",
    items: [["Mercury", "88 days"], ["Venus", "225 days"], ["Earth", "365 days"], ["Mars", "687 days"], ["Jupiter", "4,333 days"]],
    fact: "A 12-year-old on Earth would be turning 1 on Jupiter."
  },
  {
    q: "The very small", metric: "Size", lo: "Smallest", hi: "Biggest",
    items: [["Coronavirus", "≈ 0.0001 mm"], ["Red blood cell", "≈ 0.007 mm"], ["Width of a hair", "≈ 0.07 mm"], ["Grain of salt", "≈ 0.3 mm"], ["Flea", "≈ 2 mm"]],
    fact: "About 700 red blood cells fit across a single grain of salt."
  },
  {
    q: "Open wide", metric: "Number of teeth", lo: "Fewest", hi: "Most",
    items: [["Cat", "30"], ["Human", "32"], ["Dog", "42"], ["Great white shark", "≈ 300"], ["Garden snail", "≈ 14,000"]],
    fact: "A garden snail's 14,000 teeth sit on its tongue, like a microscopic cheese grater."
  }
];
if (typeof module !== "undefined") module.exports = PUZZLES;
