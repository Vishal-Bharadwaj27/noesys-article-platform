import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { tokenStorage } from "@/http-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

const EMPTY_PARAM_DRAFT: Omit<ParameterDraft, "id" | "isNew"> = {
  name: "",
  prompt: "",
  scopeType: "numeric",
  minValue: "0",
  maxValue: "10",
  options: "ABC",
};

type FormState = {
  name: string;
  description: string;
  promptContent: string;
  scoreMin: string;
  scoreMax: string;
  passThreshold: string;
  parameters: ParameterDraft[];
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  promptContent: "",
  scoreMin: "0",
  scoreMax: "10",
  passThreshold: "7",
  parameters: [],
};

// ---- Parameter row (inline add/edit, same pattern as the old modal) ----

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
              {draft.options === "ABC" ? "A / B / C" : "High / Med / Low"}
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

  const numericRangeInvalid =
    draft.scopeType === "numeric" &&
    draft.minValue !== "" &&
    draft.maxValue !== "" &&
    Number(draft.maxValue) <= Number(draft.minValue);

  return (
    <tr className="border-b border-slate-100 last:border-0 bg-indigo-50/30">
      <td colSpan={4} className="py-3">
        <div className="space-y-2.5 px-1">
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              placeholder="Parameter name (e.g. Grammar)"
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={draft.scopeType}
              onChange={(e) =>
                onChange({ ...draft, scopeType: e.target.value as ScopeType })
              }
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="numeric">Numeric</option>
              <option value="option">Option</option>
            </select>
          </div>

          <textarea
            value={draft.prompt}
            onChange={(e) => onChange({ ...draft, prompt: e.target.value })}
            placeholder="AI instruction for evaluating this parameter..."
            rows={2}
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {draft.scopeType === "numeric" ? (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="number"
                  value={draft.minValue}
                  onChange={(e) =>
                    onChange({ ...draft, minValue: e.target.value })
                  }
                  placeholder="Min"
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="number"
                  value={draft.maxValue}
                  onChange={(e) =>
                    onChange({ ...draft, maxValue: e.target.value })
                  }
                  placeholder="Max"
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {numericRangeInvalid && (
                <p className="text-xs text-red-500">
                  Max must be greater than min.
                </p>
              )}
            </>
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
            <Button variant="ghost" size="sm" onClick={onCancel} type="button">
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={onSave}
              disabled={
                !draft.name.trim() ||
                !draft.prompt.trim() ||
                numericRangeInvalid
              }
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

// ---- API response shapes (snake_case, as returned by the D1-backed API) ----

type ArticleTypeResponse = {
  id: string;
  name: string;
  description: string | null;
  pass_threshold: number;
  score_prompt: string;
  score_min: number;
  score_max: number;
};

type ParameterResponse = {
  id: string;
  name: string;
  prompt: string;
  scope_type: ScopeType;
  min_value: number | null;
  max_value: number | null;
  options: (typeof OPTION_KEYS)[number] | null;
};

function parameterFromResponse(p: ParameterResponse): ParameterDraft {
  return {
    id: p.id,
    name: p.name,
    prompt: p.prompt,
    scopeType: p.scope_type,
    minValue: p.min_value?.toString() ?? "0",
    maxValue: p.max_value?.toString() ?? "10",
    options: p.options ?? "ABC",
    isNew: false,
  };
}

function parameterToBody(p: ParameterDraft) {
  if (p.scopeType === "numeric") {
    return {
      name: p.name.trim(),
      prompt: p.prompt.trim(),
      scopeType: "numeric",
      minValue: Number(p.minValue),
      maxValue: Number(p.maxValue),
    };
  }

  return {
    name: p.name.trim(),
    prompt: p.prompt.trim(),
    scopeType: "option",
    options: p.options,
  };
}

// ---- Main form/page component ----

export default function ArticleTypesForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const token = tokenStorage.get();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [removedParameterIds, setRemovedParameterIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Prevent the default scroll behavior that changes the value
    e.currentTarget.blur();
  };
  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);

      try {
        const headers: Record<string, string> = {};

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const [typeRes, paramsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/article-types/${id}`, {
            credentials: "include",
            headers,
          }),
          fetch(`${BACKEND_URL}/api/article-types/${id}/parameters`, {
            credentials: "include",
            headers,
          }),
        ]);
        
        if (!typeRes.ok) throw new Error("Failed to load article type");
        if (!paramsRes.ok) throw new Error("Failed to load parameters");

        const typeJson: { data: ArticleTypeResponse } = await typeRes.json();
        const paramsJson: { data: ParameterResponse[] } =
          await paramsRes.json();

        const t = typeJson.data;

        setForm({
          name: t.name,
          description: t.description ?? "",
          promptContent: t.score_prompt,
          scoreMin: t.score_min.toString(),
          scoreMax: t.score_max.toString(),
          passThreshold: t.pass_threshold.toString(),
          parameters: paramsJson.data.map(parameterFromResponse),
        });
      } catch (err) {
        console.error(err);
        setError(
          "Couldn't load this article type. Try going back and re-opening it.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

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
      parameters: current.parameters.map((p) => (p.id === next.id ? next : p)),
    }));
  };

  const cancelParameterEdit = (parameter: ParameterDraft) => {
    if (parameter.isNew && !parameter.name.trim()) {
      setForm((current) => ({
        ...current,
        parameters: current.parameters.filter((p) => p.id !== parameter.id),
      }));
    }

    setEditingParamId(null);
  };

  const removeParameter = (parameterId: string) => {
    const parameter = form.parameters.find((p) => p.id === parameterId);

    if (parameter && !parameter.isNew) {
      setRemovedParameterIds((current) => [...current, parameterId]);
    }

    setForm((current) => ({
      ...current,
      parameters: current.parameters.filter((p) => p.id !== parameterId),
    }));

    if (editingParamId === parameterId) setEditingParamId(null);
  };

  // Mirrors the backend's own validation so the user sees the problem
  // before submitting, not after a 400 comes back.
  const scoreMinNum = Number(form.scoreMin);
  const scoreMaxNum = Number(form.scoreMax);
  const passThresholdNum = Number(form.passThreshold);

  const scoreRangeInvalid =
    form.scoreMin !== "" && form.scoreMax !== "" && scoreMaxNum <= scoreMinNum;

  const thresholdInvalid =
    !scoreRangeInvalid &&
    form.passThreshold !== "" &&
    (passThresholdNum < scoreMinNum || passThresholdNum > scoreMaxNum);

  const canSubmit =
    form.name.trim() &&
    form.promptContent.trim() &&
    !scoreRangeInvalid &&
    !thresholdInvalid &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const invalidParameter = form.parameters.find(
      (p) => !p.name.trim() || !p.prompt.trim(),
    );

    if (invalidParameter) {
      setEditingParamId(invalidParameter.id);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body = JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        scorePrompt: form.promptContent.trim(),
        scoreMin: scoreMinNum,
        scoreMax: scoreMaxNum,
        passThreshold: passThresholdNum,
      });

      let articleTypeId = id;

      if (isEditing) {
        const res = await fetch(`${BACKEND_URL}/api/article-types/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body,
        });

        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`${BACKEND_URL}/api/article-types`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body,
        });

        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        articleTypeId = json.data.id;
      }

      // Parameters are a separate resource — sync deletes, then creates/updates.
      await Promise.all(
        removedParameterIds.map((paramId) =>
          fetch(
            `${BACKEND_URL}/api/article-types/${articleTypeId}/parameters/${paramId}`,
            {
              method: "DELETE",
              credentials: "include",
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
        ),
      );

      await Promise.all(
        form.parameters.map((p) => {
          const paramBody = JSON.stringify(parameterToBody(p));

          if (p.isNew) {
            return fetch(
              `${BACKEND_URL}/api/article-types/${articleTypeId}/parameters`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: paramBody,
              },
            );
          }

          return fetch(
            `${BACKEND_URL}/api/article-types/${articleTypeId}/parameters/${p.id}`,
            {
              method: "PATCH",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: paramBody,
            },
          );
        }),
      );

      navigate("/admin/article-types");
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong saving this article type. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="m-5 text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="m-5 max-w-2xl ">
      <button
        type="button"
        onClick={() => navigate("/admin/article-types")}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft size={16} />
        Back to Article Types
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-900 leading-tight">
          {isEditing ? "Edit Article Type" : "New Article Type"}
        </h2>
        <p className="text-sm text-slate-500">
          {isEditing
            ? "Update the details below"
            : "Define a new type admins can assign to articles"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            placeholder="e.g. Marketing, Software, HR"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              setForm((c) => ({ ...c, description: e.target.value }))
            }
            placeholder="Short description (optional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              setForm((c) => ({ ...c, promptContent: e.target.value }))
            }
            placeholder="The full AI scoring prompt for this article type..."
            rows={8}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-400 mt-1">
            This is what the AI uses to score submissions of this article type.
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
              No parameters yet — optional, but useful for multi-criteria
              scoring.
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
                      editing={editingParamId === parameter.id}
                      onEdit={() => setEditingParamId(parameter.id)}
                      onChange={updateParameter}
                      onSave={() => setEditingParamId(null)}
                      onCancel={() => cancelParameterEdit(parameter)}
                      onRemove={() => removeParameter(parameter.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            variant="secondary"
            onClick={() => navigate("/admin/article-types")}
            disabled={submitting}
            type="button"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            type="button"
          >
            {isEditing ? "Save Changes" : "Create Type"}
          </Button>
        </div>
      </div>
    </div>
  );
}
