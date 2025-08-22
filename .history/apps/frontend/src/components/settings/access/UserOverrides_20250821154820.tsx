import { useMemo } from "react";

export type PermissionKey = string;

type Overrides = { add: PermissionKey[]; remove: PermissionKey[] };

type Props = {
  allPermissions: PermissionKey[];
  overrides: Overrides;                               // { add:[], remove:[] }
  onChange: (next: Overrides) => void;                // controlled component
  saving?: boolean;
  onSave?: () => void;
  titleAdd?: string;
  titleRemove?: string;
};

export default function UserOverrides({
  allPermissions,
  overrides,
  onChange,
  saving,
  onSave,
  titleAdd = "Grant (Add)",
  titleRemove = "Revoke (Remove)",
}: Props) {
  const addSet = useMemo(() => new Set(overrides.add ?? []), [overrides.add]);
  const removeSet = useMemo(() => new Set(overrides.remove ?? []), [overrides.remove]);

  const toggle = (perm: PermissionKey, list: "add" | "remove") => {
    const next: Overrides = {
      add: [...(overrides.add ?? [])],
      remove: [...(overrides.remove ?? [])],
    };
    const arr = list === "add" ? next.add : next.remove;
    const idx = arr.indexOf(perm);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(perm);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Per-User Overrides</div>
        {onSave && (
          <button
            onClick={onSave}
            disabled={!!saving}
            className="px-4 py-2 rounded-lg border hover:bg-accent disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>

      <Section title={titleAdd}>
        <PermGrid
          list={allPermissions}
          activeSet={addSet}
          onToggle={(p) => toggle(p, "add")}
        />
      </Section>

      <Section title={titleRemove}>
        <PermGrid
          list={allPermissions}
          activeSet={removeSet}
          onToggle={(p) => toggle(p, "remove")}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="font-medium mb-2">{title}</div>
      {children}
    </section>
  );
}

function PermGrid({
  list,
  activeSet,
  onToggle,
}: {
  list: PermissionKey[];
  activeSet: Set<PermissionKey>;
  onToggle: (perm: PermissionKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {list.map((p) => {
        const active = activeSet.has(p);
        return (
          <button
            key={p}
            onClick={() => onToggle(p)}
            className={`text-left px-3 py-2 rounded-lg border hover:bg-accent ${active ? "bg-accent" : ""}`}
            title={p}
          >
            <div className="text-sm">{p}</div>
          </button>
        );
      })}
    </div>
  );
}
