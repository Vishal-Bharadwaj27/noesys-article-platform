import { useMemo, useState } from "react";
import { Plus, Search, Tag } from "lucide-react";

import DeleteConfirmation from "../../components/articleTypes/DeleteConfirmation";
import ArticleTypesCard from "../../components/articleTypes/ArticleTypesCard";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useNavigate } from "react-router-dom";

type Parameter = {
  id: string;
  name: string;
  scopeType: "numeric" | "option";
  options: string | null;
};

export type ArticleType = {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
  created_by: string;
  created_at: string;
  parameters: Parameter[];
  updated_at: string;
};

export type ArticleTypeWithPrompt = ArticleType & {
  score_prompt: string | null;
};

type ScopeType = "numeric" | "option";

const OPTION_KEYS = ["ABC", "HIGH_MED_LOW"] as const;

type ParameterDraft = {
  id: string;
  name: string;
  prompt: string;
  scopeType: ScopeType;
  minValue: string;
  maxValue: string;
  options: (typeof OPTION_KEYS)[number];
  isNew: boolean;
};

export type ArticleTypeParameterInput = {
  id?: string;
  name: string;
  prompt: string;
  scopeType: ScopeType;
  minValue?: number;
  maxValue?: number;
  options?: (typeof OPTION_KEYS)[number];
};

type FormState = {
  name: string;
  description: string;
  promptContent: string;
  parameters: ParameterDraft[];
};

type ArticleTypesManagerProps = {
  articleTypes: ArticleTypeWithPrompt[];

  onDelete?: (id: string) => void | Promise<void>;
};

const EMPTY_PARAM_DRAFT: Omit<ParameterDraft, "id" | "isNew"> = {
  name: "",
  prompt: "",
  scopeType: "numeric",
  minValue: "0",
  maxValue: "10",
  options: "ABC",
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  promptContent: "",
  parameters: [],
};

function toParameterInput(
  parameter: ParameterDraft,
): ArticleTypeParameterInput {
  if (parameter.scopeType === "numeric") {
    return {
      ...(parameter.isNew ? {} : { id: parameter.id }),
      name: parameter.name.trim(),
      prompt: parameter.prompt.trim(),
      scopeType: "numeric",
      minValue: Number(parameter.minValue),
      maxValue: Number(parameter.maxValue),
    };
  }

  return {
    ...(parameter.isNew ? {} : { id: parameter.id }),
    name: parameter.name.trim(),
    prompt: parameter.prompt.trim(),
    scopeType: "option",
    options: parameter.options,
  };
}

export default function ArticleTypesManager({
  articleTypes,
  onDelete,
}: ArticleTypesManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] =
    useState<ArticleTypeWithPrompt | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return articleTypes.filter((type) => {
      const matchesQuery =
        !normalizedQuery ||
        type.name.toLowerCase().includes(normalizedQuery) ||
        type.description?.toLowerCase().includes(normalizedQuery);

      return matchesQuery;
    });
  }, [articleTypes, query]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);

    try {
      await onDelete?.(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="m-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/20">
            <Tag size={18} className="text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900 leading-tight">
              Article Types
            </h2>

            <p className="text-sm text-slate-500">
              {articleTypes.length} type
              {articleTypes.length !== 1 ? "s" : ""} · each has a scoring prompt
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate("/admin/article-types/new")}
          icon={<Plus size={16} />}
          className="cursor-pointer"
        >
          New Type
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4 w-[50vw]">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search article types..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="w-[50vw]">
        {articleTypes.length === 0 ? (
          <EmptyState
            icon={<Tag size={20} />}
            title={"Loading articles."}
            description=" Please wait..."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={20} />}
            title="No matches"
            description="Try a different search term or filter."
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {filtered.map((type) => (
              <ArticleTypesCard
                key={type.id}
                type={type}
                isExpanded={expandedId === type.id}
                onToggle={() =>
                  setExpandedId(expandedId === type.id ? null : type.id)
                }
                onEdit={() => navigate(`/admin/article-types/${type.id}/edit`)}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirmation
          open={!!deleteTarget}
          name={deleteTarget.name}
          submitting={submitting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
