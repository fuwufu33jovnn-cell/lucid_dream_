export type ReadingQuestion = {
  id: string;
  number: number;
  type: "choice" | "short";
  prompt: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
};

export type ReadingMock = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  durationSeconds: number;
  passage: Array<{ heading?: string; text: string }>;
  questions: ReadingQuestion[];
};

export type ExamSnapshot = {
  id: string;
  mockId: string;
  startedAt: number;
  endAt: number;
  answers: Record<string, string>;
  currentQuestion: string;
  lastSavedAt: number;
  submitted: boolean;
};

export const REALISTIC_READING_MOCK: ReadingMock = {
  id: "realistic-reading-01",
  label: "Realistic Mock · Original practice",
  title: "Designing a City That Can Be Read",
  subtitle: "Reading practice · 10 questions · 20 minutes",
  durationSeconds: 1_200,
  passage: [
    {
      heading: "A",
      text: "A transport map is often judged by whether it looks attractive, but its first duty is less glamorous: it must help a tired or hurried person make a correct decision. In a large station, travellers may be carrying luggage, watching children, or trying to understand announcements in an unfamiliar language. Under those conditions, decoration contributes little if the information hierarchy is weak. The most successful wayfinding systems therefore begin with observation. Designers record where people stop, turn back, ask for help, or accidentally enter the wrong corridor. These moments reveal a gap between the building as planned and the building as experienced.",
    },
    {
      heading: "B",
      text: "One common mistake is to treat every message as equally important. A sign may contain a station name, six service notices, advertising, accessibility information, and several arrows, all competing for attention. Research in visual perception suggests that people scan a scene before they read it in detail. A useful sign must first make its main action visible: continue, turn, change level, or stop. Supporting information can then be placed in a second layer. This principle is sometimes called progressive disclosure. It does not remove information; it reveals information in the order in which a traveller needs it.",
    },
    {
      heading: "C",
      text: "Colour can strengthen that order, yet colour alone is unreliable. Lighting conditions alter colour, printed material fades, and some users cannot distinguish particular combinations. For this reason, robust systems repeat meaning through several channels. A rail line may have a colour, a number, a name, and a distinct geometric marker. An accessible route may use both an icon and a written label. When the channels agree, a traveller can recover the message even if one channel fails. Designers call this redundancy, though the word should not be confused with unnecessary repetition.",
    },
    {
      heading: "D",
      text: "Digital displays introduce a different problem: information can change. A platform alteration can be communicated instantly, but an animated advertisement can also push essential guidance off screen. Motion attracts attention automatically, so it should be reserved for events that genuinely require attention. Some cities have adopted a quiet-screen rule in which routine information remains stable while disruption notices use limited movement. The goal is not to make every screen calm at all times; it is to protect the meaning of movement by using it selectively.",
    },
    {
      heading: "E",
      text: "Testing is most valuable when it occurs before the system is polished. A paper arrow taped to a wall may reveal more than a beautifully rendered proposal because real passengers can respond to it in the actual space. Designers can compare two versions, count wrong turns, and ask users what they expected to find. Low-cost prototypes also make criticism easier to accept: teams are less attached to work that has not consumed weeks of production. The resulting changes may concern wording, placement, contrast, or even the route itself.",
    },
    {
      heading: "F",
      text: "Wayfinding is therefore not a collection of signs added at the end of an architectural project. It is a conversation between space, information, and human behaviour. A readable station does more than reduce missed trains. It lowers the number of stressful decisions a traveller must make and gives newcomers greater independence. This is why some design teams measure success not through compliments about appearance, but through quieter evidence: fewer requests for directions, shorter pauses at junctions, and fewer people walking back against the flow.",
    },
  ],
  questions: [
    { id: "q1", number: 1, type: "choice", prompt: "What is the main purpose of the first paragraph?", options: [
      { value: "A", label: "To argue that transport maps should use more decoration" },
      { value: "B", label: "To explain why observation should come before visual styling" },
      { value: "C", label: "To compare announcements in different languages" },
    ] },
    { id: "q2", number: 2, type: "short", prompt: "What do designers record to identify gaps in the station experience?", placeholder: "No more than four words" },
    { id: "q3", number: 3, type: "choice", prompt: "Progressive disclosure means that information is…", options: [
      { value: "A", label: "removed when it is not attractive" },
      { value: "B", label: "shown in the order people need it" },
      { value: "C", label: "repeated on every available surface" },
    ] },
    { id: "q4", number: 4, type: "short", prompt: "Name one condition that can make colour less reliable.", placeholder: "Type your answer" },
    { id: "q5", number: 5, type: "choice", prompt: "Why does the author mention geometric markers?", options: [
      { value: "A", label: "They provide another channel for the same meaning" },
      { value: "B", label: "They make station branding more fashionable" },
      { value: "C", label: "They replace names and numbers completely" },
    ] },
    { id: "q6", number: 6, type: "choice", prompt: "The quiet-screen rule is intended to…", options: [
      { value: "A", label: "ban all movement from transport screens" },
      { value: "B", label: "keep advertising visible during disruption" },
      { value: "C", label: "preserve motion for information that needs attention" },
    ] },
    { id: "q7", number: 7, type: "short", prompt: "What kind of prototype may be more revealing than a polished proposal?", placeholder: "Three words" },
    { id: "q8", number: 8, type: "choice", prompt: "Why may teams accept criticism more easily during early testing?", options: [
      { value: "A", label: "Passengers provide only positive comments" },
      { value: "B", label: "Less production effort has been invested" },
      { value: "C", label: "Early prototypes cannot be compared" },
    ] },
    { id: "q9", number: 9, type: "short", prompt: "According to paragraph F, readable stations give newcomers greater…", placeholder: "One word" },
    { id: "q10", number: 10, type: "choice", prompt: "Which result best represents the author's preferred evidence of success?", options: [
      { value: "A", label: "Passengers praise the colour palette" },
      { value: "B", label: "The project wins an architecture award" },
      { value: "C", label: "Fewer travellers reverse direction" },
    ] },
  ],
};

export function createExamSnapshot(mockId: string, endAt: number): ExamSnapshot {
  return {
    id: mockId,
    mockId,
    startedAt: endAt - REALISTIC_READING_MOCK.durationSeconds * 1_000,
    endAt,
    answers: {},
    currentQuestion: REALISTIC_READING_MOCK.questions[0].id,
    lastSavedAt: 0,
    submitted: false,
  };
}

export function answerQuestion(
  snapshot: ExamSnapshot,
  questionId: string,
  answer: string,
  savedAt: number,
): ExamSnapshot {
  return {
    ...snapshot,
    answers: { ...snapshot.answers, [questionId]: answer },
    currentQuestion: questionId,
    lastSavedAt: savedAt,
  };
}

export function remainingSeconds(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1_000));
}

export function systemNow(): number {
  return Date.now();
}
