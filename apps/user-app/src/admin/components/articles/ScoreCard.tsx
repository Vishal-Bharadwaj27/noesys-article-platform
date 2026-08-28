export default function ScoreCard({
  score,
}: {
  score: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-md font-semibold uppercase tracking-wide text-slate-600 mb-2">
        Current Score
      </p>

      {score === null ? (
        <p className="text-slate-500">
          Scoring...
        </p>
      ) : (
        <>
          <p className="text-4xl font-semibold">
            {score}
            <span className="text-base text-slate-400">
              {" "}
              / 10
            </span>
          </p>

          <div className="mt-3 h-2 rounded bg-slate-200">
            <div
              className="h-full rounded bg-emerald-500"
              style={{
                width: `${score * 10}%`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}