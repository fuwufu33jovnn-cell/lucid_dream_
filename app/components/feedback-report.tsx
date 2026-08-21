import type { FeedbackResult } from "../lib/models";

function rubricLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function AdviceList({ heading, items }: { heading: string; items: string[] }) {
  if (items.length === 0) return null;
  return <section><h3>{heading}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

export function FeedbackReport({ feedback }: { feedback: FeedbackResult }) {
  return (
    <div className="feedback-report">
      <p className="practice-estimate">Practice estimates — not official IELTS band scores</p>
      <p>{feedback.assessment}</p>
      <section>
        <h3>Rubric</h3>
        <dl className="feedback-rubric">
          {Object.entries(feedback.rubric).map(([criterion, result]) => <div key={criterion}><dt>{rubricLabel(criterion)}<small>{result.evidence}</small></dt><dd>{result.score.toFixed(1)}</dd></div>)}
        </dl>
      </section>
      <AdviceList heading="Corrections" items={feedback.corrections} />
      <AdviceList heading="Vocabulary and structure" items={feedback.improvements} />
      <AdviceList heading="Recording observations" items={feedback.observations} />
      <AdviceList heading="Next actions" items={feedback.nextActions} />
      <section><h3>A revised example</h3><p className="revised-example">{feedback.revisedExample}</p></section>
    </div>
  );
}
