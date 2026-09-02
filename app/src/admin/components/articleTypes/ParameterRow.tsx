import Badge from "../../components/ui/Badge";
import { Pencil, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { Select } from "antd";
import { ParameterDraft, ScopeType } from "@/admin/utils/types";

export default function ParameterRow({
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
            <div className="flex gap-1">
              {draft.options.map((op, index) => (
                <Badge variant="indigo" key={index}>
                  {op.label}
                </Badge>
              ))}
            </div>
          )}
        </td>

        <td className="py-2.5 align-top">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
              aria-label="Edit parameter"
            >
              <Pencil size={13} />
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
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

            <Select
              onChange={(scopeType: ScopeType) =>
                onChange({ ...draft, scopeType })
              }
              value={draft.scopeType}
              className="w-[220px]"
              options={[
                {
                  value: "numeric",
                  label: "numeric",
                },
                {
                  value: "option",
                  label: "option",
                },
              ]}
            />
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
            <div className="space-y-2">
              {draft.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option.label}
                    placeholder="Option label"
                    onChange={(e) => {
                      const nextOptions = [...draft.options];
                      nextOptions[index] = {
                        ...nextOptions[index],
                        label: e.target.value,
                      };

                      onChange({
                        ...draft,
                        options: nextOptions,
                      });
                    }}
                    className="flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm"
                  />

                  <button
                    type="button"
                    className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    onClick={() => {
                      const nextOptions = draft.options.filter(
                        (_, i) => i !== index,
                      );

                      onChange({
                        ...draft,
                        options: nextOptions,
                      });
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="border cursor-pointer"
                onClick={() =>
                  onChange({
                    ...draft,
                    options: [...draft.options, { label: "" }],
                  })
                }
              >
                Add a new parameter option
              </Button>
            </div>
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
