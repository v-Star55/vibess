// Quick Draw word list — exported as a flat array for easy random picking
export const QUICK_DRAW_WORDS: string[] = [
  // Classic English game words
  "trip", "cobra", "bottle", "curtains", "soap", "mailman", "banana peel", "railroad",
  "back", "lipstick", "knee", "broccoli", "face", "tape", "hot dog", "shadow",
  "lawnmower", "table", "trash can", "rainbow", "hippopotamus", "soda", "laundry basket",
  "city", "match", "hill", "violin", "mailbox", "tire", "pumpkin", "zebra", "shelf",
  "eel", "beach", "salt and pepper", "ladder", "blue jeans", "address", "radish",
  "sea turtle", "dress", "lid", "family", "ladybug", "window", "cheeseburger", "yo-yo",
  "frog", "whistle", "glove", "magazine", "church", "chameleon", "boot", "tongue",
  "hospital", "thief", "smile", "potato", "hairbrush", "stork", "computer", "school",
  "heel", "pogo stick", "tent", "cucumber", "fox", "three-toed sloth", "sprinkler",
  "garden", "blowfish", "crib", "wing", "brain", "net", "song", "drums", "bagel",
  "baby", "starfish", "corner", "carpet", "bicycle", "strawberry", "horse", "rug",
  "puzzle", "snowball", "aircraft", "gate", "sidewalk", "pan", "marshmallow",
  "bell pepper", "watering can", "plate", "jungle", "camera", "forehead", "towel",
  "surfboard", "coin", "watch", "chin", "key", "blimp", "cowboy", "picture frame",
  "piano", "lake", "pirate", "box", "paw", "toast", "swimming pool", "silverware",
  "salt", "tissue", "shovel", "hoof", "dominoes", "roller blading", "base", "rose",
  "spider web", "hopscotch", "spoon", "elbow", "pinwheel", "french fries", "log",
  "doorknob", "bag", "attic", "beaver", "unicorn", "seahorse", "scar", "snowflake",
  "eraser", "jelly", "battery", "easel", "jar", "barn", "bathtub", "paperclip",
  "photograph", "maid", "ring", "outside", "vase", "electrical outlet", "room",
  "birthday cake", "map", "coconut", "spool", "chocolate chip cookie", "muffin", "ski",
  "stapler", "t-shirt", "lock", "braid", "seesaw", "half", "paper", "pizza", "dock",
  "shoulder", "lunchbox", "spring", "treasure", "queen", "fang", "round", "dragonfly",
  "newspaper", "mail", "knot", "tusk", "umbrella", "ticket", "lawn mower", "shark",
  "neck", "toothbrush", "hook", "wax", "mop", "beehive", "forest", "money", "napkin",
  "wreath", "music", "quilt", "chain", "backbone", "sheep", "banana split", "baseball",
  "basket", "printer", "cello", "circus", "whisk", "dimple", "hummingbird", "nest",
  "wrench", "fork", "garage", "stump", "pine tree", "saw", "stove", "toaster", "park",
  "hula hoop", "garbage", "peanut", "daddy longlegs", "hair", "bib", "spare",
  "light switch", "king", "headband", "nature", "milk", "refrigerator", "mattress",
  "tennis", "popsicle", "stomach", "pajamas", "nail", "stamp", "nut", "palace",
  "gingerbread man", "dog leash", "front porch", "wood", "mitten", "rhinoceros",
  "popcorn", "teeth", "stingray", "happy", "onion", "wall", "pen", "alarm clock",
  "door", "crayon", "swing", "maze", "jewelry", "golf", "gift", "bowtie", "fur",
  "gumball", "pear", "tiger", "peach", "washing machine", "doormat", "desk", "hockey",
  "crack", "cast", "flashlight", "dustpan", "scissors", "skate", "wallet", "sink",
  "coal", "brick", "hug", "doghouse", "deep", "pelican", "page", "lightsaber", "toe",
  "rake", "tulip", "torch", "teapot", "bucket", "trumpet", "paint", "hair dryer",
  "pineapple", "calendar", "pretzel", "candle", "sailboat", "storm", "tank", "volcano",
  "flute", "ironing board", "clam", "waist", "catfish", "top hat", "skirt", "astronaut",
  "rain", "button", "dollar", "spaceship", "fishing pole", "video camera", "penguin",
  "lemon", "poodle", "hip", "roof", "claw", "clown", "rocking chair", "belt",
  "mini blinds", "airport", "cheetah", "spine", "pond", "cage", "mouse", "bomb",
  "ice", "cake", "cockroach", "batteries", "fist", "flamingo", "purse", "lighthouse",
  "manatee", "telephone", "harp", "eagle", "electricity", "lobster", "cheek",
  "shallow", "suitcase", "campfire", "flagpole", "chalk", "artist", "skunk",
  "apple pie", "mushroom", "corndog", "smoke", "ship", "grill", "food", "cricket",
  "pencil", "rolly polly", "dolphin", "bathroom scale", "bubble", "porcupine", "owl",
  "stoplight", "chimney", "light bulb", "deer", "platypus", "globe", "tadpole",
  "cell phone", "river", "sunflower", "mouth",

  // General objects & everyday items
  "Aeroplane", "Alarm", "Ambulance", "Anchor", "Ant", "Apple", "Auto",
  "Avocado", "Backpack", "Badminton", "Ball", "Balloon", "Banana", "Bangles",
  "Barber", "Bat", "Bear", "Bed", "Bee", "Bell", "Bench", "Biryani", "Biscuit",
  "Blanket", "Blender", "Boat", "Bow", "Bowl", "Bread", "Bridge", "Broom",
  "Burger", "Bus", "Butter", "Butterfly", "Cabbage", "Cable", "Calculator",
  "Camel", "Candy", "Cap", "Car", "Carrot", "Cartoon", "Cat", "Chair",
  "Chapati", "Cheese", "Chess", "Chicken", "Chilli", "Chips", "Chocolate",
  "Clock", "Cloud", "Coffee", "Comb", "Cookie", "Cow", "Crab",
  "Crow", "Cup", "Curtain", "Cycle", "Dance", "Diamond", "Diary",
  "Dinosaur", "Doctor", "Dog", "Doll", "Donkey", "Dragon", "Drum", "Duck",
  "Duster", "Ear", "Earth", "Egg", "Elephant", "Envelope",
  "Fan", "Farmer", "Feather", "Fence", "Finger", "Fire", "Fish", "Flag",
  "Flower", "Football", "Fridge", "Garlic", "Ghost",
  "Glass", "Glasses", "Goat", "Gold", "Grapes", "Grass", "Guitar", "Gun",
  "Hammer", "Hand", "Hat", "Helmet", "Hen", "House",
  "Icecream", "Idli", "Iron", "Jacket", "Jalebi", "Jeans", "Jeep",
  "Juice", "Kangaroo", "Kettle", "Keyboard", "Kite", "Knife",
  "Koala", "Laptop", "Leaf", "Lion", "Lizard", "Lollipop", "Lotus",
  "Magnet", "Mango", "Mask", "Matchbox", "Medicine", "Microphone",
  "Mirror", "Mobile", "Monkey", "Moon", "Mosquito", "Motorcycle", "Mountain",
  "Nail", "Needle", "Notebook", "Nurse", "Octopus", "Orange",
  "Painter", "Panda", "Parachute", "Parrot", "Pillow", "Plant",
  "Police", "Rabbit", "Radio", "Raincoat", "Rat", "Remote",
  "Rice", "Robot", "Rocket", "Roti", "Samosa", "Sandwich", "Scarf",
  "Scooter", "Shampoo", "Shirt", "Shoes", "Shop", "Snake",
  "Socks", "Sofa", "Spider", "Star", "Stone",
  "Sugar", "Sun", "Tablet", "Tap", "Teacher", "Television",
  "Temple", "Tomato", "Toothpaste", "Train", "Truck", "Turtle",
  "Van", "Volleyball", "Watermelon", "Whale", "Wheel", "Wolf", "Yak",
  "Yogurt",

  // Indian food & drinks
  "Paneer", "Pakora", "Pani Puri", "Golgappa", "Dhokla", "Poha", "Upma",
  "Vada Pav", "Pav Bhaji", "Misal Pav", "Lassi", "Chaas", "Kulfi", "Rabri",
  "Rasgulla", "Gulab Jamun", "Barfi", "Laddu", "Peda", "Halwa", "Khichdi",
  "Rajma", "Paratha", "Naan", "Butter Chicken", "Bhel Puri", "Sev Puri",
  "Papdi Chaat", "Chaat", "Kachori", "Thepla", "Khakra", "Modak", "Payasam",
  "Sambar", "Dosa", "Uttapam", "Filter Coffee", "Sugarcane", "Chai",
  "Coffee Mug", "Pressure Cooker", "Tiffin", "Steel Plate", "Steel Glass",
  "Masala", "Turmeric", "Coriander", "Jeera", "Cardamom", "Clove",
  "Cinnamon", "Pepper",

  // Indian transport & city life
  "Rickshaw", "Metro", "Traffic", "Horn", "Petrol", "Diesel", "Tyre",
  "Signal", "Speedbreaker", "Passport", "Cinema", "Selfie", "Emoji",
  "Earphones", "Headphones", "Powerbank", "Charger", "Mousepad", "Joystick",

  // Indian festivals & culture
  "Temple Bell", "Coconut Water", "Garland", "Diya", "Rangoli",
  "Firecracker", "Rakhi", "Holi", "Diwali", "Navratri", "Ganpati",
  "Trident", "Peacock", "Curry",

  // Home & daily life
  "Hair Oil", "Bedsheet", "Ceiling Fan", "Tube Light", "Switch", "Socket",
  "Extension Board", "Cooler", "Geyser", "Balcony", "Terrace", "Stairs",
  "Lift", "Dustbin", "Broomstick",

  // School & education
  "School Bag", "Exam", "Homework", "Principal", "Uniform", "Blackboard",
  "Whiteboard", "Report Card", "Tuition",

  // Games & sports
  "Ludo", "Carrom", "Chessboard", "Snake Ladder", "Cricket Bat",
  "Cricket Ball", "Stumps", "Umpire", "Boundary", "Wicket",

  // Cartoon & pop culture
  "Chhota Bheem", "Shinchan", "Doraemon", "Nobita", "Tom", "Jerry",
  "Pikachu", "Pokemon", "Minion", "SpongeBob", "Mickey Mouse", "Donald Duck",
  "Kung Fu Panda", "Spiderman", "Batman", "Superman", "Iron Man", "Hulk",
  "Thor", "Captain America", "Deadpool", "Joker", "Thanos", "Baby Shark",

  // Funny / random
  "Rubber Chicken", "Whoopee Cushion", "Toilet Paper", "Flying Chappal",
  "Chappal", "Belan", "Rolling Pin", "Mosquito Bat", "Monkey Cap",
  "Fake Mustache", "Moustache", "Beard", "Tooth Fairy", "Snore", "Yawning",
  "Burp", "Hiccup", "Sneezing",

  // Actions & activities
  "Dancing", "Yoga", "Meditation", "Gym", "Dumbbell", "Skipping Rope",
  "Football Goal",

  // Nature & geography
  "Waterfall", "Desert", "Cave", "Island", "Tornado", "Snowman",

  // Fantasy & misc
  "Santa Claus", "Gift Box", "Party Hat", "Confetti", "Magic", "Wizard",
  "Genie", "Treasure Chest", "Alien", "UFO",

  // New easy additions — fruits & food
  "Donut", "Hot Dog", "Fries", "Ice Cream", "Cereal", "Pancake", "Cupcake",
  "Taco", "Burrito", "Noodles", "Soup", "Milkshake", "Cotton Candy",
  "Bubble Gum", "Jam", "Honey", "Acorn", "Corn",

  // New easy additions — animals
  "Pig", "Crab", "Ant", "Bee", "Owl", "Starfish", "Turtle",

  // New easy additions — nature & places
  "Palm Tree", "Coconut Tree", "Camping", "Igloo",

  // New easy additions — household & objects
  "Lamp", "Sofa", "Toilet", "Bathtub", "Shower", "Oven", "TV",
  "Speaker", "Headphones", "Notebook", "Glue", "Brush",
  "Shorts", "Dress", "Tie", "Crown", "Necklace", "Bracelet",
  "Compass", "Binoculars", "Megaphone", "Dart",

  // New easy additions — toys & games
  "Balloon", "Kite", "YoYo", "Boomerang", "Dice", "Chess", "Rubber Duck",
  "Bubble Wrap", "Sticker",

  // New easy additions — vehicles & transport
  "Helicopter", "Submarine", "Tractor", "Traffic Light",

  // New easy additions — emotions & actions
  "Heart", "Smile", "Angry", "Cry", "Laugh", "Sleep", "Dream", "Yawn",
  "Sneeze",

  // New easy additions — silly / funny
  "Poop", "Mud", "Belly", "Butt", "Underwear", "Pajamas", "Fart",
  "Banana Peel", "Flying Slipper",

  // New easy additions — fantasy & misc
  "Skull", "Helvetica", "Cannon", "Rope", "Slide", "Magic Wand", "Mask", "Elf",
  "Monster", "Zombie", "Ninja", "Knight",
];

/** Returns a random word from the Quick Draw word list */
export function getRandomQuickDrawWord(): string {
  return QUICK_DRAW_WORDS[Math.floor(Math.random() * QUICK_DRAW_WORDS.length)];
}
