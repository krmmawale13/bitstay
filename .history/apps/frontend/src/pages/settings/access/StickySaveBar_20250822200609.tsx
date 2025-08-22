import React from "react";

export default function StickySaveBar({
  dirty,
  saving,
  onSave,
  labelDirty = "You have unsaved changes",
  labelSaved = "All changes saved",
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  labelDirty?: string;
  labelSaved?: string;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0">
      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur p-3 flex items-center justify-between">
        <div className="text-sm">
          {dirty ? (
            <span className="text-slate-800 dark:text-slate-200">{labelDirty}</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{labelSaved}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            className="px-4 py-2 rounded-xl font-medium text-white shadow-sm 
                       bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500
                       disabled:opacity-50"
            title={!dirty ? "No changes to save" : "Save overrides"}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
