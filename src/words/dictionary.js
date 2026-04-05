/**
 * Common 3-letter English words dictionary.
 * Curated for the Lexicube game — common, recognizable words only.
 */

const WORDS = [
  "ace","act","add","ado","ads","age","ago","aid","aim","air",
  "ale","all","and","ant","any","ape","apt","arc","are","ark",
  "arm","art","ash","ask","ate","awe","axe",
  "bad","bag","ban","bar","bat","bay","bed","bee","bet","bid",
  "big","bin","bit","bog","bow","box","boy","bud","bug","bun",
  "bus","but","buy",
  "cab","cam","can","cap","car","cat","cob","cod","cog","cop",
  "cot","cow","cry","cub","cud","cup","cur","cut",
  "dab","dad","dam","day","den","dew","did","dig","dim","din",
  "dip","doe","dog","don","dot","dry","dub","dud","due","dug",
  "dun","duo","dye",
  "ear","eat","eel","egg","ego","elm","emu","end","era","eve",
  "ewe","eye",
  "fad","fan","far","fat","fax","fed","fee","fen","few","fig",
  "fin","fir","fit","fix","fly","fob","foe","fog","fop","for",
  "fox","fry","fun","fur",
  "gab","gag","gal","gap","gas","gay","gel","gem","get","gig",
  "gin","gnu","god","got","gum","gun","gut","guy","gym",
  "had","ham","has","hat","hay","hem","hen","her","hew","hex",
  "hid","him","hip","his","hit","hob","hoe","hog","hop","hot",
  "how","hub","hue","hug","hum","hut",
  "ice","icy","ill","imp","ink","inn","ion","ire","irk","its",
  "ivy",
  "jab","jag","jam","jar","jaw","jay","jet","jig","job","jog",
  "jot","joy","jug","jut",
  "keg","ken","key","kid","kin","kit",
  "lab","lad","lag","lap","law","lay","lea","led","leg","let",
  "lid","lie","lip","lit","log","lot","low","lug",
  "mad","man","map","mar","mat","maw","may","men","met","mid",
  "mix","mob","mod","mom","mop","mow","mud","mug","mum",
  "nab","nag","nap","net","new","nil","nip","nit","nod","nor",
  "not","now","nub","nun","nut",
  "oak","oar","oat","odd","ode","off","oft","oil","old","one",
  "opt","orb","ore","our","out","owe","owl","own",
  "pad","pal","pan","pap","par","pat","paw","pay","pea","peg",
  "pen","pep","per","pet","pew","pie","pig","pin","pit","ply",
  "pod","pop","pot","pow","pro","pry","pub","pug","pun","pup",
  "pus","put",
  "rag","ram","ran","rap","rat","raw","ray","red","ref","rib",
  "rid","rig","rim","rip","rob","rod","roe","rot","row","rub",
  "rug","rum","run","rut",
  "sac","sad","sag","sap","sat","saw","say","sea","set","sew",
  "she","shy","sin","sip","sir","sis","sit","six","ski","sky",
  "sly","sob","sod","son","sop","sot","sow","soy","spa","spy",
  "sty","sub","sue","sum","sun","sup",
  "tab","tad","tag","tan","tap","tar","tat","tax","tea","ten",
  "the","thy","tic","tie","tin","tip","toe","ton","too","top",
  "tot","tow","toy","try","tub","tug","tun",
  "urn","use",
  "van","vat","vet","vex","vie","vim","vow",
  "wad","wag","war","was","wax","way","web","wed","wet","who",
  "why","wig","win","wit","woe","wok","won","woo","wow",
  "yak","yam","yap","yaw","yea","yes","yet","yew","you","yow",
  "zap","zed","zen","zip","zoo",
];

export const DICTIONARY = new Set(WORDS);

/**
 * Check if a string is a valid 3-letter word.
 */
export function isValidWord(word) {
  return DICTIONARY.has(word.toLowerCase());
}

/**
 * Build a prefix map: 2-letter prefix -> list of words.
 */
export function buildPrefixMap() {
  const map = new Map();
  for (const word of WORDS) {
    const prefix = word[0] + word[1];
    if (!map.has(prefix)) map.set(prefix, []);
    map.get(prefix).push(word);
  }
  return map;
}
