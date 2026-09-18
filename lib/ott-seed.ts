import type { Language, VideoContentType } from "./types";

export type OttSeedStory = {
  youtubeId: string;
  title: string;
  displayTitle: string;
  synopsis: string;
  language: Language;
  contentType: VideoContentType;
  category: string;
  topics: string[];
  featured?: boolean;
  heroRank?: number;
  shelfRank?: number;
  isReel?: boolean;
  channelName: string;
};

export const OTT_SEED_CATEGORIES = [
  { name: "Worship & Praise", description: "Songs that lift the heart and turn us toward God." },
  { name: "Messages of Hope", description: "Encouragement for the road ahead." },
  { name: "Prayer & Devotion", description: "Quiet moments to pray, reflect, and draw near." },
  { name: "Testimonies", description: "Real stories of grace, courage, and new beginnings." },
  { name: "Bible Stories", description: "Scripture brought to life for every generation." },
  { name: "Films & Series", description: "Long form Christian stories to watch together." },
];

const rawSeedStories: Array<[string, string, string, string, Language, VideoContentType, string, string[], string]> = [
  ["dy9nwe9_xzw", "Oceans (Where Feet May Fail)", "Step Into Deep Faith", "A worship invitation to trust God beyond the shoreline.", "english", "worship", "Worship & Praise", ["worship", "trust"], "Hillsong UNITED"],
  ["iJCV_2H9xD0", "Way Maker (Official Live Video)", "Way Maker", "Remember the God who is working even when we cannot see it.", "english", "worship", "Worship & Praise", ["worship", "hope"], "Leeland"],
  ["-f4MUUMWMV4", "Goodness Of God", "The Goodness That Follows", "A gentle reminder that goodness and mercy meet us every day.", "english", "worship", "Worship & Praise", ["goodness", "worship"], "Bethel Music"],
  ["Sc6SSHuZvQE", "Reckless Love", "Loved Without Measure", "Rest in the love that leaves the ninety nine to find you.", "english", "worship", "Worship & Praise", ["love", "worship"], "Cory Asbury"],
  ["XtwIT8JjddM", "10,000 Reasons", "Bless the Lord", "Begin again with a grateful heart and a thousand reasons to praise.", "english", "worship", "Worship & Praise", ["praise", "gratitude"], "Matt Redman"],
  ["lKw6uqtGFfo", "Who You Say I Am", "Known and Beloved", "Let this song anchor your identity in the Father’s love.", "english", "worship", "Worship & Praise", ["identity", "freedom"], "Hillsong Worship"],
  ["f2oxGYpuLkw", "Praise", "Praise in Every Season", "A joyful, high energy call to praise through every season.", "english", "worship", "Worship & Praise", ["joy", "praise"], "Elevation Worship"],
  ["Zp6aygmvzM4", "The Blessing", "The Blessing", "Speak peace, presence, and blessing over your home today.", "english", "prayer", "Prayer & Devotion", ["blessing", "family"], "Elevation Worship"],
  ["wNRFumI2ch0", "In Christ Alone", "Steady in Christ", "A timeless confession of hope when everything else shifts.", "english", "devotional", "Messages of Hope", ["hope", "scripture"], "Christian Worship"],
  ["LawxIZE9ePE", "Same God", "The Same God Today", "The God of yesterday is faithful in your story today.", "english", "message", "Messages of Hope", ["faith", "courage"], "Elevation Worship"],
  ["dt1bpUnwubc", "Battle Belongs", "The Battle Belongs to God", "Release the fight and find courage in the One who goes before you.", "english", "message", "Messages of Hope", ["courage", "peace"], "Phil Wickham"],
  ["4Fhv4arL3yk", "The Jesus Way", "The Jesus Way", "Choose the way of Jesus: humble, brave, compassionate, and true.", "english", "message", "Bible Stories", ["Jesus", "discipleship"], "Phil Wickham"],
  ["_OYLMlNnCKI", "Mera Tu Hi Sahara Hai", "तू ही मेरा सहारा", "A Hindi worship moment for anyone who needs a steady refuge.", "hindi", "worship", "Worship & Praise", ["आशा", "आराधना"], "Elroi Hindi"],
  ["eQZLZ9fIzdk", "Lakdi Pe Latka Nasri", "यीशु का बलिदान", "Remember the cross and the hope made possible through Jesus.", "hindi", "bible-story", "Bible Stories", ["यीशु", "क्रूस"], "Elroi Hindi"],
  ["tcV5rLY1jh4", "Humdard", "हमदर्द", "A devotional song for the days when you need a compassionate friend.", "hindi", "devotional", "Prayer & Devotion", ["दया", "प्रार्थना"], "Elroi Hindi"],
  ["5p-gkCq82i0", "Yeshu Tera Naam", "यीशु तेरा नाम", "Carry the name of Jesus into your day with this joyful Hindi praise.", "hindi", "worship", "Worship & Praise", ["नाम", "स्तुति"], "Elroi Hindi"],
  ["2D0Uy9yBoww", "Nepali Christian Worship Collection", "प्रभुको स्तुति", "A Nepali collection of worship songs for your quiet time and family altar.", "nepali", "worship", "Worship & Praise", ["आराधना", "प्रार्थना"], "Biswasiko Awaj"],
  ["qRewnuBQ8Xc", "Nepali Christian Worship Song", "विश्वासको गीत", "Let a Nepali song of faith bring peace to your room today.", "nepali", "devotional", "Prayer & Devotion", ["विश्वास", "शान्ति"], "Christian Sansar"],
  ["bTp5dXRGoKo", "Same God Live", "उही परमेश्वर", "A live declaration that God remains faithful across every generation.", "nepali", "message", "Messages of Hope", ["विश्वास", "आशा"], "Elevation Worship"],
  ["Dnfbpu7iSGU", "World On Fire", "विश्वासको ज्योति", "A cinematic reminder to carry hope and light into a hurting world.", "nepali", "film-series", "Films & Series", ["ज्योति", "आशा"], "for KING + COUNTRY"],
];

export const OTT_SEED_STORIES: OttSeedStory[] = rawSeedStories.map((item, index) => ({
  youtubeId: item[0], title: item[1], displayTitle: item[2], synopsis: item[3], language: item[4], contentType: item[5], category: item[6], topics: item[7], channelName: item[8],
  featured: index < 10, heroRank: index < 10 ? index + 1 : undefined, shelfRank: index + 1, isReel: index % 5 === 0,
}));
