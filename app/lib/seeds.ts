export type SeedCategory = "Design" | "Work" | "Life" | "Culture" | "Academic" | "Music" | "Film" | "Podcasts" | "Books";
export type SeedLevel = "B1" | "B2" | "C1";
export type SeedMediaType = "video" | "audio" | "article" | "course" | "text";

export type SeedActivity = {
  id: string;
  title: string;
  publisher: string;
  sourceUrl: string;
  category: SeedCategory;
  level: SeedLevel;
  minutes: 5 | 15 | 30;
  skills: string[];
  usageBasis: string;
  prompt: string;
  output: string;
  reviewedAt: string;
  mediaType?: SeedMediaType;
  topics?: string[];
  hasText?: boolean;
};

const LINK_BASIS = "Publisher-hosted page; LUCID DREAM stores only metadata and original study prompts.";

function discovery(
  id: string,
  title: string,
  publisher: string,
  sourceUrl: string,
  category: SeedCategory,
  mediaType: SeedMediaType,
  level: SeedLevel,
  minutes: SeedActivity["minutes"],
  skills: string[],
  hasText = false,
): SeedActivity {
  return {
    id, title, publisher, sourceUrl, category, mediaType, level, minutes, skills, hasText,
    usageBasis: LINK_BASIS,
    prompt: "Use the publisher-hosted source to notice one useful English phrase, idea, or storytelling choice; do not copy protected text.",
    output: "Give a short original English response about what you noticed.",
    reviewedAt: "2026-08-23",
  };
}

const DISCOVERY_LIBRARY: readonly SeedActivity[] = [
  discovery("music-taylor-swift", "Explore Taylor Swift's official videos", "Taylor Swift", "https://www.youtube.com/@TaylorSwift", "Music", "video", "B2", 15, ["Listening", "Pop culture"]),
  discovery("music-beyonce", "Explore Beyoncé's official videos", "Beyoncé", "https://www.youtube.com/@beyonce", "Music", "video", "B2", 15, ["Listening", "Performance"]),
  discovery("music-the-beatles", "Explore The Beatles' official videos", "The Beatles", "https://www.youtube.com/@TheBeatles", "Music", "video", "B1", 15, ["Listening", "Classic music"]),
  discovery("music-adele", "Explore Adele's official videos", "Adele", "https://www.youtube.com/@Adele", "Music", "video", "B1", 15, ["Listening", "Pop culture"]),
  discovery("music-billie-eilish", "Explore Billie Eilish's official videos", "Billie Eilish", "https://www.youtube.com/@BillieEilish", "Music", "video", "B2", 15, ["Listening", "Contemporary music"]),
  discovery("music-coldplay", "Explore Coldplay's official videos", "Coldplay", "https://www.youtube.com/@coldplay", "Music", "video", "B1", 15, ["Listening", "Band interviews"]),
  discovery("music-bts", "Explore BTS's official videos", "BANGTANTV", "https://www.youtube.com/@BTS", "Music", "video", "B2", 15, ["Listening", "Global culture"]),
  discovery("music-dua-lipa", "Explore Dua Lipa's official videos", "Dua Lipa", "https://www.youtube.com/@dualipa", "Music", "video", "B2", 15, ["Listening", "Pop culture"]),
  discovery("music-kendrick-lamar", "Explore Kendrick Lamar's official videos", "Kendrick Lamar", "https://www.youtube.com/@kendricklamar", "Music", "video", "C1", 15, ["Listening", "Visual storytelling"]),
  discovery("music-lady-gaga", "Explore Lady Gaga's official videos", "Lady Gaga", "https://www.youtube.com/@LadyGaga", "Music", "video", "B2", 15, ["Listening", "Performance"]),
  discovery("music-ed-sheeran", "Explore Ed Sheeran's official videos", "Ed Sheeran", "https://www.youtube.com/@EdSheeran", "Music", "video", "B1", 15, ["Listening", "Songwriting interviews"]),
  discovery("music-bruno-mars", "Explore Bruno Mars's official videos", "Bruno Mars", "https://www.youtube.com/@brunomars", "Music", "video", "B1", 15, ["Listening", "Performance"]),
  discovery("music-radiohead", "Explore Radiohead's official videos", "Radiohead", "https://www.youtube.com/@radiohead", "Music", "video", "C1", 15, ["Listening", "Alternative music"]),
  discovery("music-npr-tiny-desk", "Browse Tiny Desk Concerts", "NPR Music", "https://www.npr.org/series/tiny-desk-concerts/", "Music", "video", "B2", 15, ["Listening", "Live performance"]),

  discovery("film-star-wars", "Star Wars: A New Hope — official trailer", "Star Wars", "https://www.youtube.com/watch?v=vZ734NWnAHA", "Film", "video", "B1", 15, ["Listening", "Film vocabulary"]),
  discovery("film-lord-of-the-rings", "The Lord of the Rings: The Fellowship of the Ring — official trailer", "Warner Bros. Pictures", "https://www.youtube.com/watch?v=V75dMMIW2B4", "Film", "video", "B2", 15, ["Listening", "Narrative language"]),
  discovery("film-dark-knight", "The Dark Knight — official trailer", "Warner Bros. Pictures", "https://www.youtube.com/watch?v=EXeTwQWrcwY", "Film", "video", "B2", 15, ["Listening", "Film vocabulary"]),
  discovery("film-spirited-away", "Spirited Away — official trailer", "Studio Ghibli", "https://www.youtube.com/watch?v=ByXuk9QqQkk", "Film", "video", "B1", 15, ["Listening", "Animation"]),
  discovery("film-dune", "Dune — official trailer", "Warner Bros. Pictures", "https://www.youtube.com/watch?v=n9xhJrPXop4", "Film", "video", "B2", 15, ["Listening", "Science-fiction"]),
  discovery("film-interstellar", "Interstellar — official trailer", "Paramount Pictures", "https://www.youtube.com/watch?v=zSWdZVtXT7E", "Film", "video", "B2", 15, ["Listening", "Science vocabulary"]),
  discovery("film-parasite", "Parasite — official trailer", "NEON", "https://www.youtube.com/watch?v=5xH0HfJHsaY", "Film", "video", "B2", 15, ["Listening", "Social commentary"]),
  discovery("film-matrix", "The Matrix — official trailer", "Warner Bros. Pictures", "https://www.youtube.com/watch?v=vKQi3bBA1y8", "Film", "video", "B2", 15, ["Listening", "Science-fiction"]),
  discovery("film-mad-max", "Mad Max: Fury Road — official trailer", "Warner Bros. Pictures", "https://www.youtube.com/watch?v=hEJnMQG9ev8", "Film", "video", "B2", 15, ["Listening", "Action-film vocabulary"]),
  discovery("film-spider-man", "Spider-Man: Into the Spider-Verse — official trailer", "Sony Pictures Entertainment", "https://www.youtube.com/watch?v=g4Hbz2jLxvQ", "Film", "video", "B1", 15, ["Listening", "Animation"]),
  discovery("film-coco", "Coco — official trailer", "Pixar", "https://www.youtube.com/watch?v=Rvr68u6k5sI", "Film", "video", "B1", 15, ["Listening", "Family stories"]),
  discovery("film-inception", "Inception — official trailer", "Warner Bros. Pictures", "https://www.youtube.com/watch?v=YoHD9XEInc0", "Film", "video", "B2", 15, ["Listening", "Narrative language"]),
  discovery("film-hidden-figures", "Hidden Figures — official trailer", "20th Century Studios", "https://www.youtube.com/watch?v=RK8xHq6dfAo", "Film", "video", "B2", 15, ["Listening", "Workplace English"]),
  discovery("film-black-panther", "Black Panther — official trailer", "Marvel Entertainment", "https://www.youtube.com/watch?v=xjDjIWPwcPU", "Film", "video", "B1", 15, ["Listening", "Film vocabulary"]),
  discovery("film-back-to-the-future", "Back to the Future — official trailer", "Universal Pictures", "https://www.youtube.com/watch?v=qvsgGtivCgs", "Film", "video", "B1", 15, ["Listening", "Classic film"]),

  discovery("podcast-fresh-air", "Listen to Fresh Air", "NPR", "https://www.npr.org/podcasts/381444908/fresh-air", "Podcasts", "audio", "C1", 30, ["Listening", "Interviews"], true),
  discovery("podcast-tiny-desk", "Listen to NPR's Pop Culture Happy Hour", "NPR", "https://www.npr.org/podcasts/510282/pop-culture-happy-hour", "Podcasts", "audio", "B2", 30, ["Listening", "Culture"], true),
  discovery("podcast-ted-talks-daily", "Listen to TED Talks Daily", "TED", "https://www.ted.com/podcasts/ted-talks-daily", "Podcasts", "audio", "B2", 15, ["Listening", "Ideas"], true),
  discovery("podcast-bbc-global-news", "Listen to Global News Podcast", "BBC World Service", "https://www.bbc.co.uk/programmes/p02nq0gn", "Podcasts", "audio", "C1", 30, ["Listening", "News English"], true),
  discovery("podcast-radiolab", "Listen to Radiolab", "WNYC Studios", "https://radiolab.org/", "Podcasts", "audio", "C1", 30, ["Listening", "Science stories"], true),
  discovery("podcast-the-moth", "Listen to The Moth", "The Moth", "https://themoth.org/podcast", "Podcasts", "audio", "B2", 15, ["Listening", "Storytelling"], true),
  discovery("podcast-99pi", "Listen to 99% Invisible", "99% Invisible", "https://99percentinvisible.org/", "Podcasts", "audio", "C1", 30, ["Listening", "Design vocabulary"], true),
  discovery("podcast-ezra-klein", "Listen to The Ezra Klein Show", "The New York Times", "https://www.nytimes.com/column/ezra-klein-podcast", "Podcasts", "audio", "C1", 30, ["Listening", "Long-form discussion"], true),
  discovery("podcast-science-friday", "Listen to Science Friday", "Science Friday", "https://www.sciencefriday.com/", "Podcasts", "audio", "B2", 30, ["Listening", "Science vocabulary"], true),
  discovery("podcast-fall-of-civilizations", "Listen to Fall of Civilizations", "Fall of Civilizations", "https://fallofcivilizationspodcast.com/", "Podcasts", "audio", "C1", 30, ["Listening", "History"], true),
  discovery("podcast-bbc-learning-english", "Listen to BBC Learning English podcasts", "BBC Learning English", "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english", "Podcasts", "audio", "B1", 15, ["Listening", "Vocabulary"], true),
  discovery("podcast-guardian-long-read", "Listen to The Audio Long Read", "The Guardian", "https://www.theguardian.com/news/series/the-audio-long-read", "Podcasts", "audio", "C1", 30, ["Listening", "Academic vocabulary"], true),

  discovery("book-frankenstein-text", "Read Frankenstein", "Project Gutenberg", "https://www.gutenberg.org/ebooks/84", "Books", "text", "B2", 30, ["Reading", "Classic fiction"], true),
  discovery("book-pride-and-prejudice-text", "Read Pride and Prejudice", "Project Gutenberg", "https://www.gutenberg.org/ebooks/1342", "Books", "text", "B2", 30, ["Reading", "Classic fiction"], true),
  discovery("book-alice-text", "Read Alice's Adventures in Wonderland", "Project Gutenberg", "https://www.gutenberg.org/ebooks/11", "Books", "text", "B1", 30, ["Reading", "Classic fiction"], true),
  discovery("book-sherlock-text", "Read The Adventures of Sherlock Holmes", "Project Gutenberg", "https://www.gutenberg.org/ebooks/1661", "Books", "text", "B2", 30, ["Reading", "Mystery vocabulary"], true),
  discovery("book-moby-dick-text", "Read Moby-Dick", "Project Gutenberg", "https://www.gutenberg.org/ebooks/2701", "Books", "text", "C1", 30, ["Reading", "Classic fiction"], true),
  discovery("book-tale-of-two-cities-text", "Read A Tale of Two Cities", "Project Gutenberg", "https://www.gutenberg.org/ebooks/98", "Books", "text", "B2", 30, ["Reading", "Historical fiction"], true),
  discovery("book-huckleberry-finn-text", "Read Adventures of Huckleberry Finn", "Project Gutenberg", "https://www.gutenberg.org/ebooks/76", "Books", "text", "B2", 30, ["Reading", "American English"], true),
  discovery("book-yellow-wallpaper-text", "Read The Yellow Wallpaper", "Project Gutenberg", "https://www.gutenberg.org/ebooks/1952", "Books", "text", "C1", 15, ["Reading", "Short fiction"], true),
  discovery("book-jane-eyre-text", "Read Jane Eyre", "Project Gutenberg", "https://www.gutenberg.org/ebooks/1260", "Books", "text", "B2", 30, ["Reading", "Classic fiction"], true),
  discovery("book-dorian-gray-text", "Read The Picture of Dorian Gray", "Project Gutenberg", "https://www.gutenberg.org/ebooks/174", "Books", "text", "B2", 30, ["Reading", "Classic fiction"], true),
  discovery("book-dracula-text", "Read Dracula", "Project Gutenberg", "https://www.gutenberg.org/ebooks/345", "Books", "text", "B2", 30, ["Reading", "Classic fiction"], true),
  discovery("book-little-women-text", "Read Little Women", "Project Gutenberg", "https://www.gutenberg.org/ebooks/514", "Books", "text", "B1", 30, ["Reading", "Classic fiction"], true),
  discovery("book-walden-text", "Read Walden", "Project Gutenberg", "https://www.gutenberg.org/ebooks/205", "Books", "text", "C1", 30, ["Reading", "Nature writing"], true),
  discovery("book-time-machine-text", "Read The Time Machine", "Project Gutenberg", "https://www.gutenberg.org/ebooks/35", "Books", "text", "B2", 30, ["Reading", "Science-fiction"], true),
  discovery("book-wizard-oz-text", "Read The Wonderful Wizard of Oz", "Project Gutenberg", "https://www.gutenberg.org/ebooks/55", "Books", "text", "B1", 30, ["Reading", "Children's classic"], true),
  discovery("audiobook-frankenstein", "Listen to Frankenstein", "LibriVox", "https://librivox.org/search/?q=Frankenstein&search_category=title", "Books", "audio", "B2", 30, ["Listening", "Classic fiction"]),
  discovery("audiobook-pride-and-prejudice", "Listen to Pride and Prejudice", "LibriVox", "https://librivox.org/search/?q=Pride+and+Prejudice&search_category=title", "Books", "audio", "B2", 30, ["Listening", "Classic fiction"]),
  discovery("audiobook-sherlock-holmes", "Listen to Sherlock Holmes", "LibriVox", "https://librivox.org/search/?q=Sherlock+Holmes&search_category=title", "Books", "audio", "B2", 30, ["Listening", "Mystery vocabulary"]),
  discovery("audiobook-dracula", "Listen to Dracula", "LibriVox", "https://librivox.org/search/?q=Dracula&search_category=title", "Books", "audio", "B2", 30, ["Listening", "Classic fiction"]),
  discovery("audiobook-jane-eyre", "Listen to Jane Eyre", "LibriVox", "https://librivox.org/search/?q=Jane+Eyre&search_category=title", "Books", "audio", "B2", 30, ["Listening", "Classic fiction"]),
];

export const SEED_LIBRARY: readonly SeedActivity[] = [
  { id: "apple-design-principles", title: "Principles of great design", publisher: "Apple Developer", sourceUrl: "https://developer.apple.com/videos/design/", category: "Design", level: "B2", minutes: 15, skills: ["Listening", "Design vocabulary"], usageBasis: LINK_BASIS, prompt: "Listen for three qualities used to evaluate a design.", output: "Give a 60-second Design Breakdown of one interface you use.", reviewedAt: "2026-08-18" },
  { id: "apple-ux-writing", title: "Make a big impact with small writing changes", publisher: "Apple Developer", sourceUrl: "https://developer.apple.com/videos/design/", category: "Design", level: "B2", minutes: 15, skills: ["Listening", "UX writing"], usageBasis: LINK_BASIS, prompt: "Notice how short interface labels reduce uncertainty.", output: "Rewrite three labels from one of your projects in English.", reviewedAt: "2026-08-18" },
  { id: "apple-inclusive-design", title: "Principles of inclusive app design", publisher: "Apple Developer", sourceUrl: "https://developer.apple.com/videos/design/", category: "Design", level: "C1", minutes: 30, skills: ["Listening", "Accessibility"], usageBasis: LINK_BASIS, prompt: "Identify one design decision that includes more users.", output: "Explain an accessibility improvement for your portfolio project.", reviewedAt: "2026-08-18" },
  { id: "apple-presenting-work", title: "Presenting design work", publisher: "Apple Developer", sourceUrl: "https://developer.apple.com/videos/design/", category: "Design", level: "B2", minutes: 15, skills: ["Listening", "Presentation"], usageBasis: LINK_BASIS, prompt: "Track the order used to move from context to decision.", output: "Record a 60-second opening for your own case study.", reviewedAt: "2026-08-18" },
  { id: "figma-future-apps", title: "Design for the future of apps", publisher: "Figma Config", sourceUrl: "https://config.figma.com/", category: "Design", level: "C1", minutes: 30, skills: ["Listening", "Design systems"], usageBasis: LINK_BASIS, prompt: "Listen for the tension between personalization and consistency.", output: "Write a six-sentence Design Breakdown with one trade-off.", reviewedAt: "2026-08-18" },
  { id: "figma-config-agenda", title: "Choose a Config design-systems talk", publisher: "Figma Config", sourceUrl: "https://config.figma.com/", category: "Design", level: "B2", minutes: 15, skills: ["Scanning", "Topic selection"], usageBasis: LINK_BASIS, prompt: "Scan titles and choose one talk relevant to your portfolio direction.", output: "Predict three ideas the speaker may cover, in English.", reviewedAt: "2026-08-18" },
  { id: "mit-computational-media", title: "Fundamentals of Computational Media Design", publisher: "MIT OpenCourseWare", sourceUrl: "https://ocw.mit.edu/courses/mas-110-fundamentals-of-computational-media-design-fall-2008/pages/syllabus/", category: "Design", level: "C1", minutes: 15, skills: ["Reading", "Media theory"], usageBasis: LINK_BASIS, prompt: "Find how the course connects art, technology, and critique.", output: "Describe where art and technology meet in one of your projects.", reviewedAt: "2026-08-18" },
  { id: "mit-media-assignment", title: "Reflect on a computational media process", publisher: "MIT OpenCourseWare", sourceUrl: "https://ocw.mit.edu/courses/mas-110-fundamentals-of-computational-media-design-fall-2008/pages/assignments/", category: "Design", level: "C1", minutes: 30, skills: ["Reading", "Reflection"], usageBasis: LINK_BASIS, prompt: "Look at how an assignment asks students to explain intention and process.", output: "Draft a short process reflection for your own work.", reviewedAt: "2026-08-18" },
  { id: "mit-sociable-media", title: "Designing sociable media", publisher: "MIT OpenCourseWare", sourceUrl: "https://ocw.mit.edu/courses/mas-961-special-topics-designing-sociable-media-spring-2008/", category: "Design", level: "C1", minutes: 15, skills: ["Reading", "Interaction design"], usageBasis: LINK_BASIS, prompt: "List two ways an interface represents social activity.", output: "Propose one social interaction and explain its visual feedback.", reviewedAt: "2026-08-18" },
  { id: "material-design", title: "Explore Material Design", publisher: "Google", sourceUrl: "https://m3.material.io/", category: "Design", level: "B2", minutes: 15, skills: ["Reading", "Design systems"], usageBasis: LINK_BASIS, prompt: "Choose one component and notice how guidance is structured.", output: "Explain when you would and would not use that component.", reviewedAt: "2026-08-18" },
  { id: "mit-digital-storytelling", title: "Media technology and city design", publisher: "MIT OpenCourseWare", sourceUrl: "https://ocw.mit.edu/courses/11-310j-media-technology-and-city-design-and-development-fall-2002/", category: "Academic", level: "C1", minutes: 30, skills: ["Reading", "Synthesis"], usageBasis: LINK_BASIS, prompt: "Identify how digital storytelling can represent a place.", output: "Pitch a small media project about a neighbourhood you know.", reviewedAt: "2026-08-18" },
  { id: "mit-visual-arguments", title: "Planning, communications, and digital media", publisher: "MIT OpenCourseWare", sourceUrl: "https://ocw.mit.edu/courses/11-204-planning-communications-and-digital-media-fall-2004/pages/lecture-notes/", category: "Academic", level: "C1", minutes: 30, skills: ["Reading", "Critical thinking"], usageBasis: LINK_BASIS, prompt: "Look for ways images can construct an argument about a place.", output: "Explain one ethical risk in visual storytelling.", reviewedAt: "2026-08-18" },
  { id: "mit-codesign", title: "Civic media codesign studio", publisher: "MIT OpenCourseWare", sourceUrl: "https://ocw.mit.edu/courses/cms-362-civic-media-codesign-studio-fall-2020/", category: "Academic", level: "C1", minutes: 15, skills: ["Reading", "Codesign"], usageBasis: LINK_BASIS, prompt: "Find the stages where communities participate in design.", output: "Summarize why codesign changes a designer's role.", reviewedAt: "2026-08-18" },
  { id: "skillsfuture-framework", title: "Map a Singapore skills framework", publisher: "SkillsFuture Singapore", sourceUrl: "https://www.skillsfuture.gov.sg/skills-framework", category: "Work", level: "B2", minutes: 15, skills: ["Scanning", "Career English"], usageBasis: LINK_BASIS, prompt: "Choose one sector and note three capabilities it values.", output: "Say which capability your portfolio already proves.", reviewedAt: "2026-08-18" },
  { id: "mom-ep", title: "Read an official Employment Pass requirement page", publisher: "Singapore Ministry of Manpower", sourceUrl: "https://www.mom.gov.sg/passes-and-permits/employment-pass/eligibility", category: "Work", level: "C1", minutes: 15, skills: ["Reading", "Policy vocabulary"], usageBasis: LINK_BASIS, prompt: "Separate candidate requirements from employer-dependent factors.", output: "Explain one limitation of making a visa plan too early.", reviewedAt: "2026-08-18" },
  { id: "mom-sat", title: "Understand the official Self-Assessment Tool", publisher: "Singapore Ministry of Manpower", sourceUrl: "https://www.mom.gov.sg/eservices/services/employment-s-pass-self-assessment-tool", category: "Work", level: "C1", minutes: 5, skills: ["Reading", "Practical English"], usageBasis: LINK_BASIS, prompt: "Find who the tool is designed for and what it cannot guarantee.", output: "Summarize the limitation in two English sentences.", reviewedAt: "2026-08-18" },
  { id: "singapore-digital", title: "Explore Singapore's digital economy direction", publisher: "IMDA", sourceUrl: "https://www.imda.gov.sg/about-imda/research-and-statistics/sgdigital/digital-economy-framework-for-action", category: "Work", level: "C1", minutes: 15, skills: ["Reading", "Industry vocabulary"], usageBasis: LINK_BASIS, prompt: "Scan for sectors and skills connected to digital work.", output: "Connect one trend to a digital-media portfolio project.", reviewedAt: "2026-08-18" },
  { id: "ielts-speaking-criteria", title: "Read the IELTS Speaking criteria", publisher: "IELTS", sourceUrl: "https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf", category: "Academic", level: "B2", minutes: 15, skills: ["Reading", "Exam literacy"], usageBasis: LINK_BASIS, prompt: "Choose one criterion and translate it into an observable habit.", output: "Record a response while focusing on that single habit.", reviewedAt: "2026-08-18" },
  { id: "ielts-sample", title: "Explore official IELTS sample questions", publisher: "IELTS", sourceUrl: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions", category: "Academic", level: "B2", minutes: 15, skills: ["Reading", "Exam format"], usageBasis: LINK_BASIS, prompt: "Choose one section and identify what the task actually asks you to do.", output: "Write one strategy sentence and one warning sentence.", reviewedAt: "2026-08-18" },
  { id: "moma-magazine", title: "Read one MoMA design story", publisher: "MoMA", sourceUrl: "https://www.moma.org/magazine/", category: "Culture", level: "C1", minutes: 15, skills: ["Reading", "Art vocabulary"], usageBasis: LINK_BASIS, prompt: "Choose an article and notice how the writer frames context.", output: "Give a 60-second response: what changed how you saw the work?", reviewedAt: "2026-08-18" },
  { id: "tate-art-terms", title: "Build an art-language mini glossary", publisher: "Tate", sourceUrl: "https://www.tate.org.uk/art/art-terms", category: "Culture", level: "B1", minutes: 15, skills: ["Reading", "Vocabulary"], usageBasis: LINK_BASIS, prompt: "Pick three terms relevant to your visual style.", output: "Use each term in a sentence about your own work.", reviewedAt: "2026-08-18" },
  { id: "smithsonian-open", title: "Curate a three-object visual story", publisher: "Smithsonian", sourceUrl: "https://www.si.edu/openaccess", category: "Culture", level: "B2", minutes: 30, skills: ["Browsing", "Curation"], usageBasis: "Official Open Access portal; follow each asset's rights statement and store only original notes here.", prompt: "Choose three openly available objects with a shared visual idea.", output: "Present the three-object story in English.", reviewedAt: "2026-08-18" },
  { id: "nhs-appointment", title: "Understand how a GP appointment works", publisher: "NHS", sourceUrl: "https://www.nhs.uk/nhs-services/gps/gp-appointments-and-bookings/", category: "Life", level: "B2", minutes: 15, skills: ["Reading", "Life English"], usageBasis: LINK_BASIS, prompt: "Find the words used for booking and preparing for an appointment.", output: "Practise a short appointment request without inventing symptoms.", reviewedAt: "2026-08-18" },
  { id: "singapore-renting", title: "Read Singapore consumer guidance", publisher: "CASE Singapore", sourceUrl: "https://www.case.org.sg/", category: "Life", level: "C1", minutes: 15, skills: ["Scanning", "Consumer vocabulary"], usageBasis: LINK_BASIS, prompt: "Find one official channel for a consumer question or complaint.", output: "Draft a calm request for clarification and a specific remedy.", reviewedAt: "2026-08-18" },
  ...DISCOVERY_LIBRARY,
];
