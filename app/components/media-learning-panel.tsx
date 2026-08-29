import type { EditorialActivity } from "../lib/editorial";

export function MediaLearningPanel({ activity }: { activity: EditorialActivity }) {
  return (
    <section className="media-learning-panel" aria-label={`${activity.contentKind} learning source`}>
      <div className="media-frame">
        {activity.sourceKind === "youtube" && activity.youtubeId ? (
          <iframe
            title={`${activity.title} — official video`}
            src={`https://www.youtube-nocookie.com/embed/${activity.youtubeId}`}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="media-external-state"><span>{activity.contentKind.toUpperCase()}</span><p>THIS SOURCE OPENS ON ITS OFFICIAL SITE.</p></div>
        )}
      </div>
      <div className="learning-copy" data-language-tools-root>
        <p className="learning-copy-label">SELECTABLE LEARNING NOTES</p>
        {activity.learningText.map((line) => <p key={line.id}>{line.text}</p>)}
      </div>
      <a className="official-source-link" href={activity.sourceUrl} target="_blank" rel="noreferrer">OPEN OFFICIAL SOURCE ↗</a>
    </section>
  );
}
