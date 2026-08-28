import MarkdownViewer from "./MarkdownViewer";

export default function FeedbackBlock({
  feedback,
}: {
  feedback: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-3">
        <p className="text-md font-semibold uppercase tracking-wide text-slate-600">
          Feedback
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <MarkdownViewer content={feedback} />
      </div>
    </div>
  );
}