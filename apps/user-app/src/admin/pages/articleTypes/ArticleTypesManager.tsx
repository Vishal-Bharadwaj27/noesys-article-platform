import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";

import DeleteConfirmation from "../../components/articleTypes/DeleteConfirmation";
import ArticleTypesCard from "../../components/articleTypes/ArticleTypesCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export type ArticleType = {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ArticleTypeWithPrompt = ArticleType & {
  prompt: string | null;
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

type StatusFilter = "all" | "active" | "inactive";

type ArticleTypesManagerProps = {
  articleTypes: ArticleTypeWithPrompt[];

  onCreate?: (data: {
    name: string;
    description: string;
    promptContent: string;
    parameters: ArticleTypeParameterInput[];
  }) => void | Promise<void>;

  onUpdate?: (
    id: string,
    data: {
      name: string;
      description: string;
      promptContent: string;
      parameters: ArticleTypeParameterInput[];
    },
  ) => void | Promise<void>;

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

function ParameterRow({
  draft,
  onChange,
  onSave,
  onCancel,
  onRemove,
  editing,
  onEdit,
}: {
  draft: ParameterDraft;
  onChange: (next: ParameterDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
  editing: boolean;
  onEdit: () => void;
}) {
  if (!editing) {
    return (
      <tr className="group border-b border-slate-100 last:border-0">
        <td className="py-2.5 pr-3 text-sm font-medium text-slate-800 align-top">
          {draft.name || (
            <span className="text-slate-300 italic">Untitled</span>
          )}
        </td>

        <td className="py-2.5 pr-3 text-sm text-slate-500 align-top max-w-[220px] truncate">
          {draft.prompt || (
            <span className="text-slate-300 italic">No prompt</span>
          )}
        </td>

        <td className="py-2.5 pr-3 align-top">
          {draft.scopeType === "numeric" ? (
            <Badge variant="indigo">
              {draft.minValue}–{draft.maxValue}
            </Badge>
          ) : (
            <Badge variant="indigo">
              {draft.options === "ABC"
                ? "A / B / C"
                : "High / Med / Low"}
            </Badge>
          )}
        </td>

        <td className="py-2.5 align-top">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
              aria-label="Edit parameter"
            >
              <Pencil size={13} />
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove parameter"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 last:border-0 bg-indigo-50/30">
      <td colSpan={4} className="py-3">
        <div className="space-y-2.5 px-1">
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              value={draft.name}
              onChange={(e) =>
                onChange({
                  ...draft,
                  name: e.target.value,
                })
              }
              placeholder="Parameter name (e.g. Grammar)"
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={draft.scopeType}
              onChange={(e) =>
                onChange({
                  ...draft,
                  scopeType: e.target.value as ScopeType,
                })
              }
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="numeric">Numeric</option>
              <option value="option">Option</option>
            </select>
          </div>

          <textarea
            value={draft.prompt}
            onChange={(e) =>
              onChange({
                ...draft,
                prompt: e.target.value,
              })
            }
            placeholder="AI instruction for evaluating this parameter..."
            rows={2}
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {draft.scopeType === "numeric" ? (
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="number"
                value={draft.minValue}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    minValue: e.target.value,
                  })
                }
                placeholder="Min"
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <input
                type="number"
                value={draft.maxValue}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    maxValue: e.target.value,
                  })
                }
                placeholder="Max"
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <select
              value={draft.options}
              onChange={(e) =>
                onChange({
                  ...draft,
                  options: e.target.value as ParameterDraft["options"],
                })
              }
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ABC">A / B / C</option>
              <option value="HIGH_MED_LOW">High / Med / Low</option>
            </select>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={onSave}
              disabled={!draft.name.trim() || !draft.prompt.trim()}
              type="button"
            >
              Save
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

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
  onCreate,
  onUpdate,
  onDelete,
}: ArticleTypesManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editingParamId, setEditingParamId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

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


      return matchesQuery ;
    });
  }, [articleTypes, query]);

  const openCreateForm = () => {
    setEditingId(null);
    setEditingParamId(null);
    setForm({
      name: "",
      description: "",
      promptContent: "",
      parameters: [],
    });
    setFormOpen(true);
  };

  const openEditForm = (type: ArticleTypeWithPrompt) => {
    setEditingId(type.id);
    setEditingParamId(null);

    setForm({
      name: type.name,
      description: type.description ?? "",
      promptContent: type.prompt ?? "",
      parameters: [],
    });

    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) return;

    setFormOpen(false);
    setEditingId(null);
    setEditingParamId(null);
    setForm(EMPTY_FORM);
  };

  const addParameter = () => {
    const draft: ParameterDraft = {
      id: crypto.randomUUID(),
      ...EMPTY_PARAM_DRAFT,
      isNew: true,
    };

    setForm((current) => ({
      ...current,
      parameters: [...current.parameters, draft],
    }));

    setEditingParamId(draft.id);
  };

  const updateParameter = (next: ParameterDraft) => {
    setForm((current) => ({
      ...current,
      parameters: current.parameters.map((parameter) =>
        parameter.id === next.id ? next : parameter,
      ),
    }));
  };

  const cancelParameterEdit = (parameter: ParameterDraft) => {
    if (parameter.isNew && !parameter.name.trim()) {
      setForm((current) => ({
        ...current,
        parameters: current.parameters.filter(
          (item) => item.id !== parameter.id,
        ),
      }));
    }

    setEditingParamId(null);
  };

  const removeParameter = (parameterId: string) => {
    setForm((current) => ({
      ...current,
      parameters: current.parameters.filter(
        (parameter) => parameter.id !== parameterId,
      ),
    }));

    if (editingParamId === parameterId) {
      setEditingParamId(null);
    }
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    const promptContent = form.promptContent.trim();

    if (!name || !promptContent) return;

    const invalidParameter = form.parameters.find(
      (parameter) =>
        !parameter.name.trim() || !parameter.prompt.trim(),
    );

    if (invalidParameter) {
      setEditingParamId(invalidParameter.id);
      return;
    }

    setSubmitting(true);

    try {
      const parameters = form.parameters.map(toParameterInput);

      const payload = {
        name,
        description: form.description.trim(),
        promptContent,
        parameters,
      };

      if (editingId) {
        await onUpdate?.(editingId, payload);
      } else {
        await onCreate?.(payload);
      }

      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

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
              {articleTypes.length !== 1 ? "s" : ""} · each has a
              scoring prompt
            </p>
          </div>
        </div>

        <Button
          onClick={openCreateForm}
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
            title="No article types yet"
            description="Create one to define how submissions of this type get scored."
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
                  setExpandedId(
                    expandedId === type.id ? null : type.id,
                  )
                }
                onEdit={openEditForm}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={closeForm}
          />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingId
                    ? "Edit Article Type"
                    : "New Article Type"}
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                  {editingId
                    ? "Update the details below"
                    : "Define a new type admins can assign to articles"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Marketing, Software, HR"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>

                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Short description (optional)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Scoring Prompt
                  </label>

                  <span className="text-xs text-slate-400">
                    {form.promptContent.length} chars
                  </span>
                </div>

                <textarea
                  value={form.promptContent}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      promptContent: e.target.value,
                    }))
                  }
                  placeholder="The full AI scoring prompt for this article type..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-shadow"
                />

                <p className="text-xs text-slate-400 mt-1">
                  This is what the AI uses to score submissions of
                  this article type.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Parameters
                  </label>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Plus size={13} />}
                    type="button"
                    onClick={addParameter}
                  >
                    Add parameter
                  </Button>
                </div>

                {form.parameters.length === 0 ? (
                  <p className="text-sm text-slate-400 italic border border-dashed border-slate-200 rounded-lg px-3 py-3 text-center">
                    No parameters yet — optional, but useful for
                    multi-criteria scoring.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="py-2 px-3 text-xs font-medium text-slate-500">
                            Name
                          </th>
                          <th className="py-2 px-3 text-xs font-medium text-slate-500">
                            Prompt
                          </th>
                          <th className="py-2 px-3 text-xs font-medium text-slate-500">
                            Range / Options
                          </th>
                          <th className="py-2 px-3 w-16" />
                        </tr>
                      </thead>

                      <tbody>
                        {form.parameters.map((parameter) => (
                          <ParameterRow
                            key={parameter.id}
                            draft={parameter}
                            editing={
                              editingParamId === parameter.id
                            }
                            onEdit={() =>
                              setEditingParamId(parameter.id)
                            }
                            onChange={updateParameter}
                            onSave={() =>
                              setEditingParamId(null)
                            }
                            onCancel={() =>
                              cancelParameterEdit(parameter)
                            }
                            onRemove={() =>
                              removeParameter(parameter.id)
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <Button
                variant="secondary"
                onClick={closeForm}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={
                  !form.name.trim() ||
                  !form.promptContent.trim()
                }
              >
                {editingId ? "Save Changes" : "Create Type"}
              </Button>
            </div>
          </div>
        </div>
      )}

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