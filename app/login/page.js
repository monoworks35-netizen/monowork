"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // login | signup | change
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ===== LOGIN HANDLER =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.loading("Processing login...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success("Login successful!");
        localStorage.setItem("token", data.token || "");
        setEmail("");
        setPassword("");
        router.push("/");
      } else {
        toast.error(data.message || "Invalid email or password!");
      }
    } catch (err) {
      console.error("Login Error:", err);
      toast.dismiss();
      toast.error("Server error!");
    } finally {
      setLoading(false);
    }
  };

  // ===== SIGNUP HANDLER =====
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.message("Creating account...");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success("Signup successful!");
        setMode("login");
        setEmail("");
        setPassword("");
      } else {
        toast.error(data.message || "Signup failed!");
      }
    } catch (err) {
      console.error("Signup Error:", err);
      toast.dismiss();
      toast.error("Server error!");
    } finally {
      setLoading(false);
    }
  };

  // ===== CHANGE PASSWORD HANDLER =====
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.message("Updating password...");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success("Password changed successfully!");
        setEmail("");
        setCurrentPassword("");
        setNewPassword("");
        setMode("login");
      } else {
        toast.error(data.message || "Failed to change password!");
      }
    } catch (err) {
      console.error("Change Password Error:", err);
      toast.dismiss();
      toast.error("Server error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="bg-white w-[400px] p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-semibold text-center text-green-700 mb-6">
          {mode === "login"
            ? "Welcome Back 👋"
            : mode === "signup"
            ? "Create an Account"
            : "Change Password"}
        </h2>

        {/* ===== LOGIN FORM ===== */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-gray-700 text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="text-gray-700 text-sm font-medium">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[35px] text-gray-500"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-2">
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-green-700 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>

            <p className="text-center text-sm text-gray-500">
              Forgot password?{" "}
              <button
                type="button"
                onClick={() => setMode("change")}
                className="text-green-700 font-semibold hover:underline"
              >
                Change here
              </button>
            </p>
          </form>
        )}

        {/* ===== SIGNUP FORM ===== */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-gray-700 text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="text-gray-700 text-sm font-medium">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[35px] text-gray-500"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-green-700 font-semibold hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        )}

        {/* ===== CHANGE PASSWORD FORM ===== */}
        {mode === "change" && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-gray-700 text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="text-gray-700 text-sm font-medium">Current Password</label>
              <input
                type={showCurrent ? "text" : "password"}
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-[35px] text-gray-500"
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="relative">
              <label className="text-gray-700 text-sm font-medium">New Password</label>
              <input
                type={showNew ? "text" : "password"}
                required
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-[35px] text-gray-500"
              >
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              {loading ? "Updating..." : "Change Password"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-2">
              Back to{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-green-700 font-semibold hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
