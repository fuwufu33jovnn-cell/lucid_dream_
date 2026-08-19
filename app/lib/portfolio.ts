export type PortfolioDraft = {
  project: string;
  audience: string;
  painPoint: string;
  role: string;
  choices: string;
  system: string;
  iteration: string;
  impact: string;
  nextRole: string;
};

export type WalkthroughSection = {
  label: string;
  englishLead: string;
  content: string;
};

const FIELDS: Array<keyof PortfolioDraft> = [
  "project", "audience", "painPoint", "role", "choices", "system", "iteration", "impact", "nextRole",
];

export function emptyPortfolioDraft(): PortfolioDraft {
  return { project: "", audience: "", painPoint: "", role: "", choices: "", system: "", iteration: "", impact: "", nextRole: "" };
}

export function walkthroughCompleteness(draft: PortfolioDraft): { completed: number; total: 9 } {
  return { completed: FIELDS.filter((field) => draft[field].trim().length > 0).length, total: 9 };
}

export function buildWalkthroughOutline(draft: PortfolioDraft): WalkthroughSection[] {
  return [
    { label: "Context", englishLead: "This project focused on…", content: draft.project || "Name the project and its purpose." },
    { label: "Pain point", englishLead: "The central pain point was…", content: draft.painPoint || "Describe the problem with observable evidence." },
    { label: "Audience", englishLead: "I designed primarily for…", content: draft.audience || "Name the people affected by the problem." },
    { label: "My role", englishLead: "My contribution was…", content: draft.role || "Separate your own work from the team's work." },
    { label: "Design choices", englishLead: "I chose this direction because…", content: draft.choices || "Explain one choice and one rejected alternative." },
    { label: "Design system", englishLead: "To keep the experience consistent…", content: draft.system || "Name the reusable visual or interaction rules." },
    { label: "Iteration", englishLead: "After testing and feedback…", content: draft.iteration || "Describe what changed and why." },
    { label: "Impact", englishLead: "The result showed…", content: draft.impact || "What changed, what was learned, or what you would measure next." },
    { label: "Role fit", englishLead: "This project prepares me for…", content: draft.nextRole || "Connect the evidence to the role you want next." },
  ];
}
