export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl border p-6 bg-white shadow">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Sign in</h1>
        <input className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="Email" />
        <input className="w-full border rounded-lg px-3 py-2 mb-4" type="password" placeholder="Password" />
        <button className="w-full rounded-lg px-4 py-2 font-medium text-white bg-brand-600 hover:bg-brand-700">
          Continue
        </button>
      </div>
    </div>
  );
}
