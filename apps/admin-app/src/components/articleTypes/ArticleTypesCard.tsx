import { ChevronDown, FileText, Pencil, Tag, Trash2 } from "lucide-react";
import { ArticleTypeWithPrompt } from "../../pages/articleTypes/ArticleTypesManager";
import { formatDate } from "../../utils/date";

type ArticleTypesCardProps = {
  type: ArticleTypeWithPrompt;
  isExpanded: boolean;
  onToggle: (type: string | null) => void;
  onEdit: (type: ArticleTypeWithPrompt) => void;
  onDelete: (type: ArticleTypeWithPrompt) => void;
};

function ArticleTypesCard({
  type,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: ArticleTypesCardProps) {
  return (
    <div>
      <button
        onClick={() => onToggle(isExpanded ? null : type.id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="w-9 h-9 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Tag size={16} className="text-indigo-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900">{type.name}</span>
            {!type.is_active && (
              <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-red-50 text-red-600">
                Inactive
              </span>
            )}
            {!type.prompt && (
              <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-amber-50 text-amber-700">
                No prompt set
              </span>
            )}
          </div>
          {type.description && (
            <p className="text-sm text-slate-500 truncate mt-0.5">
              {type.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(type);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onEdit(type);
              }
            }}
            className="p-2 rounded-md text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
            aria-label={`Edit ${type.name}`}
          >
            <Pencil size={15} />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(type);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onDelete(type);
              }
            }}
            className="p-2 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label={`Delete ${type.name}`}
          >
            <Trash2 size={15} />
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded prompt view */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-4 py-3.5 bg-slate-50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2">
            <FileText size={13} />
            Scoring Prompt
          </div>
          {type.prompt ? (
            <>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed bg-white border border-slate-200 rounded-lg p-3 max-h-56 overflow-y-auto">
                {type.prompt}
              </pre>
            </>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No prompt has been configured for this type yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ArticleTypesCard;
