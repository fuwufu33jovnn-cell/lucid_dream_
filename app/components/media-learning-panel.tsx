import type { EditorialActivity } from "../lib/editorial";

export function MediaLearningPanel({ activity }: { activity: EditorialActivity }) {
  const canEmbedYouTube = activity.sourceKind === "youtube" && !!activity.youtubeId;

  return (
    <section className="media-learning-panel" aria-label={`${activity.contentKind} learning source`}>
      {canEmbedYouTube ? (
        <div className="media-frame">
          <iframe
            title={`${activity.title} — official video`}
            src={`https://www.youtube-nocookie.com/embed/${activity.youtubeId}`}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <a className="media-source-card" href={activity.sourceUrl} target="_blank" rel="noreferrer">
          <span>{activity.contentKind.toUpperCase()} / EXTERNAL SOURCE</span>
          <strong>OPEN OFFICIAL SOURCE ↗</strong>
          <small>This source cannot be embedded reliably inside LUCID DREAM, so it opens on the publisher&apos;s site instead.</small>
        </a>
      )}
      <div className="learning-copy" data-language-tools-root>
        <p className="learning-copy-label">SELECTABLE LEARNING NOTES</p>
        {activity.learningText.map((line) => <p key={line.id}>{line.text}</p>)}
      </div>
      {canEmbedYouTube && (
        <a className="official-source-link" href={activity.sourceUrl} target="_blank" rel="noreferrer">OPEN OFFICIAL SOURCE ↗</a>
      )}
    </section>
  );
}
