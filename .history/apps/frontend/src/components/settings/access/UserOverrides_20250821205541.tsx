// Same logic as yours, just polished UI part
// Replace rendering with customers-style table/buttons

// ... keep your imports & state as-is

return (
  <div className="flex gap-6">
    {/* Left: users list */}
    <aside className="w-80 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 
                      bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users by name/email/role…"
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent 
                   px-3 py-2 mb-3 focus:ring-2 focus:ring-indigo-500"
      />
      <div className="max-h-[65vh] overflow-auto space-y-1">
        {loadingUsers && <div className="p-2 text-sm">Loading users…</div>}
        {!loadingUsers && filtered.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground">No users found.</div>
        )}
        {!loadingUsers && filtered.map((u) => (
          <button key={u.id} onClick={() => loadOverrides(u)}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${
              selected?.id === u.id
                ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
            }`}>
            <div className="font-medium">{u.name}</div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
            {u.role && <div className="text-[10px] uppercase mt-1 opacity-80">{u.role}</div>}
          </button>
        ))}
      </div>
    </aside>

    {/* Right: overrides editor */}
    <main className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 
                     bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-4">
      {!selected ? (
        <div className="text-sm text-muted-foreground">Select a user to view and edit overrides.</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{selected.name}</div>
              <div className="text-xs text-muted-foreground">{selected.email}</div>
            </div>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 rounded-xl font-medium text-white shadow-sm 
                         bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500
                         disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          <Section title="Grant (Add)">
            <PermGrid list={ALL_PERMS} active={ov.add} onToggle={(p) => toggle(p, "add")} />
          </Section>
          <Section title="Revoke (Remove)">
            <PermGrid list={ALL_PERMS} active={ov.remove} onToggle={(p) => toggle(p, "remove")} />
          </Section>
        </div>
      )}
    </main>
  </div>
);
