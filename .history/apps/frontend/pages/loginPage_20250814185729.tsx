// pages/loginPage.tsx
import { useState } from "react";

export default function LoginPage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "bg-gray-900 text-white" : "bg-[#F5F5F5] text-gray-900"}>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl shadow-lg p-8 bg-white dark:bg-gray-800">
          <h1 className="text-3xl font-bold text-center mb-6 text-[#007B83]">
            BitStay Login
          </h1>
          <form className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E90A1]"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E90A1]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" />
                Remember me
              </label>
              <a href="#" className="text-[#F9B24E] hover:underline">
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              className="w-full bg-[#007B83] text-white py-2 rounded-lg hover:bg-[#1E90A1] transition"
            >
              Sign In
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-sm text-gray-500 hover:underline"
            >
              Toggle {darkMode ? "Light" : "Dark"} Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
