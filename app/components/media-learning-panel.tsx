import type { EditorialActivity } from "../lib/editorial";

export function MediaLearningPanel({ activity }: { activity: EditorialActivity }) {
  const canEmbedYouTube = activity.sourceKind === "youtube" && !!activity.youtubeId;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${activity.publisher} ${activity.title} official`)}`;

  return (
    <section className="media-learning-panel" aria-label={`${activity.contentKind} learning source`}>
      {canEmbedYouTube ? (
        <div className="media-frame">
          <iframe
            title={`${activity.title} — official video`}
            src={`https://www.youtube.com/embed/${activity.youtubeId}?rel=0`}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <a className="media-source-card" href={activity.sourceUrl} target="_blank" rel="noopener">
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
        <div className="official-source-actions">
          <a className="official-source-link" href={activity.sourceUrl} target="_blank" rel="noopener">OPEN ON YOUTUBE ↗</a>
          <a className="official-source-link" href={youtubeSearchUrl} target="_blank" rel="noopener">FIND CURRENT OFFICIAL VIDEO ↗</a>
        </div>
      )}
    </section>
  );
}
