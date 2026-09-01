import { Trash2 } from "lucide-react";

interface DeleteConfirmationProps {
  open: boolean;
  name: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

const DeleteConfirmation = ({
  open,
  name,
  submitting,
  onClose,
  onConfirm,
}: DeleteConfirmationProps) => {
  if (!open) return null;
  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/40"
          onClick={() => !submitting && onClose()}
        />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <h2 className="mt-3 font-semibold text-slate-900">
            Delete "{name}"?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This removes the article type and its scoring prompt. Existing
            articles of this type won't be deleted, but new submissions can no
            longer use it.
          </p>

          <div className="mt-5 flex gap-2 justify-end">
            <button
              onClick={() => onClose()}
              disabled={submitting}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
