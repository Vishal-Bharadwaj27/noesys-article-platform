import { useState } from "react";
import {
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  X,
  FileText,
  Tag,
} from "lucide-react";
import DeleteConfirmation from "../../components/articleTypes/DeleteConfirmation";
import ArticleTypesCard from "../../components/articleTypes/ArticleTypesCard";

export type ArticleType = {
  id: string;
  name: string;
  description: string | null;
  is_active: number; // 1 = active, 0 = inactive
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Prompt = {
  id: string;
  article_type_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

// Article type joined with its (optional, since it's created separately) prompt
export type ArticleTypeWithPrompt = ArticleType & {
  prompt: Prompt | null;
};

type FormState = {
  name: string;
  description: string;
  promptContent: string;
};

const EMPTY_FORM: FormState = { name: "", description: "", promptContent: "" };

type ArticleTypesManagerProps = {
  articleTypes: ArticleTypeWithPrompt[];
  onCreate?: (data: {
    name: string;
    description: string;
    promptContent: string;
  }) => void | Promise<void>;
  onUpdate?: (
    id: string,
    data: { name: string; description: string; promptContent: string },
  ) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
};



export default function ArticleTypesManager({
  articleTypes,
  onCreate,
  onUpdate,
  onDelete,
}: ArticleTypesManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] =
    useState<ArticleTypeWithPrompt | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditForm = (type: ArticleTypeWithPrompt) => {
    setEditingId(type.id);
    setForm({
      name: type.name,
      description: type.description ?? "",
      promptContent: type.prompt?.content ?? "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.promptContent.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await onUpdate?.(editingId, form);
      } else {
        await onCreate?.(form);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">
            Article Types
          </h2>
          <p className="text-sm text-slate-500">
            {articleTypes.length} type{articleTypes.length !== 1 ? "s" : ""} ·
            each has a scoring prompt
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-3.5 py-2 transition-colors"
        >
          <Plus size={16} />
          New Type
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 grid grid-cols-2 gap-2">
        {articleTypes.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
            No article types yet. Create one to get started.
          </div>
        )}

        {articleTypes.map((type) => {
          const isExpanded = expandedId === type.id;
          const isActive = type.is_active === 1;

          return (
            <div
              key={type.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              {/* Row */}
              <ArticleTypesCard
                key={type.id}
                type={type}
                isExpanded={expandedId === type.id}
                onToggle={() =>
                  setExpandedId(expandedId === type.id ? null : type.id)
                }
                onEdit={openEditForm}
                onDelete={setDeleteTarget}
              />
            </div>
          );
        })}
      </div>

      {/* Create / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={closeForm}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-900">
                {editingId ? "Edit Article Type" : "New Article Type"}
              </h2>
              <button
                onClick={closeForm}
                disabled={submitting}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
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
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
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
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Short description (optional)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Scoring Prompt
                </label>
                <textarea
                  value={form.promptContent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, promptContent: e.target.value }))
                  }
                  placeholder="The full AI scoring prompt for this article type..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                />
                <p className="text-xs text-slate-400 mt-1">
                  This is what the AI uses to score submissions of this article
                  type.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
              <button
                onClick={closeForm}
                disabled={submitting}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  submitting || !form.name.trim() || !form.promptContent.trim()
                }
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Type"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmation
          open={!!deleteTarget}
          name={deleteTarget?.name ?? ""}
          submitting={submitting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
