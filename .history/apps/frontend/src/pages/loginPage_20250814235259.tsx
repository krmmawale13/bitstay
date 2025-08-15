// src/pages/loginPage.tsx
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-teal-600 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">BitStay Admin</h1>
          <p className="text-gray-500">Sign in to continue</p>
        </div>

        {/* Form */}
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 text-primary" />
              Remember me
            </label>
            <a href="#" className="text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 text-white font-semibold hover:bg-primary/90 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
