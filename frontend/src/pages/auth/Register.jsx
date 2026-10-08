import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import * as authService from "../../services/authService";
import { useToast } from "../../context/ToastContext";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    memberId: "", // Student ID (e.g. STU2301) or Faculty ID (e.g. FAC1042)
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear error for this field when user types
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate() {
    const errs = {};
    if (!form.memberId.trim())
      errs.memberId =
        form.role === "student"
          ? "Student ID is required (e.g. STU2301)."
          : "Faculty ID is required (e.g. FAC1042).";
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    if (form.confirmPassword !== form.password)
      errs.confirmPassword = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register(form);
      toast.success("Registration successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="text-sm text-navy-400 mt-1.5">
        Register using your Student ID or Faculty ID assigned by the admin.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {/* Role selector — only student / faculty */}
        <div>
          <label className="label">I am a</label>
          <div className="flex gap-2">
            {["student", "faculty"].map((role) => (
              <button
                type="button"
                key={role}
                onClick={() => {
                  update("role", role);
                  update("memberId", "");
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors capitalize
                ${
                  form.role === role
                    ? "bg-navy-800 text-white border-navy-800"
                    : "border-surface-border text-navy-600 hover:bg-navy-50"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Member ID */}
        <div>
          <label className="label">
            {form.role === "student" ? "Student ID" : "Faculty ID"}
          </label>
          <input
            className="input"
            value={form.memberId}
            onChange={(e) => update("memberId", e.target.value)}
            placeholder={
              form.role === "student" ? "e.g. STU2301" : "e.g. FAC1042"
            }
          />
          {errors.memberId && (
            <p className="text-xs text-accent-coral mt-1">{errors.memberId}</p>
          )}
          <p className="text-xs text-navy-400 mt-1">
            Use the ID provided by your institution admin.
          </p>
        </div>

        {/* Full name */}
        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Jane Doe"
          />
          {errors.fullName && (
            <p className="text-xs text-accent-coral mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="label">Email address</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-xs text-accent-coral mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-xs text-accent-coral mt-1">
                {errors.password}
              </p>
            )}
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input
              type="password"
              className="input"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-accent-coral mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-sm text-navy-500 text-center mt-6">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-navy-800 font-semibold hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
