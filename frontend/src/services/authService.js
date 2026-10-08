// authService.js
// Authentication service integrating with backend API and local mock fallback.
// Registration is restricted: only students/faculty pre-added by the admin
// (in the admin panel → Students / Faculty pages) can create accounts.

import { delay, mockError } from "./_utils";
import { currentStudent, currentFaculty, currentAdmin } from "../data/mockData";
import { getToken } from "./api";
import { getData } from "./storageService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const DEMO_ACCOUNTS = {
  "student@example.com": { password: "demo1234", profile: currentStudent },
  "faculty@example.com": { password: "demo1234", profile: currentFaculty },
  "admin@example.com": { password: "demo1234", profile: currentAdmin },
  "student@educloud.com": { password: "Student@123", profile: { ...currentStudent, email: "student@educloud.com" } },
  "faculty@educloud.com": { password: "Faculty@123", profile: { ...currentFaculty, email: "faculty@educloud.com" } },
  "admin@educloud.com": { password: "Admin@123", profile: { ...currentAdmin, name: "Sunita Desai", email: "admin@educloud.com" } },
};

const REGISTERED_USERS_KEY = "educloud_registered_users";

function loadRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveRegisteredUsers(users) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

function findAccount(email) {
  const key = email.trim().toLowerCase();
  const registered = loadRegisteredUsers();
  return registered[key] || DEMO_ACCOUNTS[key] || null;
}

export async function login({ email, password, role }) {
  if (!role) {
    return mockError("Please select your role.");
  }

  const cleanEmail = email.trim().toLowerCase();

  // Try real backend first
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success && data?.data) {
      const backendUser = data.data.user;
      const normalizedRole = (backendUser.role || "").toLowerCase();

      if (role && normalizedRole && normalizedRole !== role.toLowerCase()) {
        const label = role.charAt(0).toUpperCase() + role.slice(1);
        throw new Error(`This account is not registered as a ${label}.`);
      }

      const initials = (backendUser.name || "")
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";

      const fallbackProfile =
        normalizedRole === "faculty"
          ? currentFaculty
          : normalizedRole === "admin"
          ? currentAdmin
          : currentStudent;

      const user = {
        ...fallbackProfile,
        ...backendUser,
        role: normalizedRole || role.toLowerCase(),
        avatar: initials,
      };

      return { token: data.data.token, user };
    } else if (response.status === 401 || response.status === 403 || response.status === 400) {
      // If the backend actively rejected wrong credentials, and it's not a local demo email
      if (!DEMO_ACCOUNTS[cleanEmail] && !loadRegisteredUsers()[cleanEmail]) {
        throw new Error(data?.message || "Invalid credentials.");
      }
    }
  } catch (err) {
    // If it's a validation/role/auth rejection from backend, rethrow it
    if (
      err.message &&
      !err.message.includes("fetch") &&
      !err.message.includes("abort") &&
      !err.message.includes("Failed to") &&
      !err.message.includes("NetworkError")
    ) {
      throw err;
    }
    // Otherwise network/timeout, proceed to mock fallback
  }

  // Fallback to local accounts
  const account = findAccount(cleanEmail);
  if (!account) {
    return mockError("No account found with this email.");
  }
  if (account.password !== password) {
    return mockError("Incorrect password.");
  }

  const accountRole = (account.profile.role || "").toLowerCase();
  const selectedRole = role.toLowerCase();
  if (accountRole !== selectedRole) {
    const label = role.charAt(0).toUpperCase() + role.slice(1);
    return mockError(`This account is not registered as a ${label}.`);
  }

  return delay({ token: "mock-jwt-token", user: account.profile }, 300);
}

/**
 * Register a new account.
 * Only students/faculty who are already added by the admin (in the
 * admin panel Students / Faculty pages) can register.
 *
 * The user provides: memberId (Student ID / Faculty ID), fullName,
 * email, and password. All other details (department, course,
 * semester, etc.) come from the admin-managed data.
 */
export async function register(formData) {
  const key = formData.email.trim().toLowerCase();
  const memberId = formData.memberId.trim().toUpperCase();
  const role = formData.role.toLowerCase();

  // Check if email is already registered
  if (DEMO_ACCOUNTS[key] || loadRegisteredUsers()[key]) {
    throw new Error("An account with this email already exists.");
  }

  // Check if this member ID is already registered by another email
  const existingUsers = loadRegisteredUsers();
  for (const existingEmail of Object.keys(existingUsers)) {
    const existing = existingUsers[existingEmail];
    if (existing.profile && existing.profile.id === memberId) {
      throw new Error(
        `This ${role === "student" ? "Student" : "Faculty"} ID is already registered with another account.`
      );
    }
  }

  // Validate the ID exists in admin-managed data
  let adminRecord = null;

  if (role === "student") {
    const students = getData("students") || [];
    adminRecord = students.find(
      (s) => s.id && s.id.toUpperCase() === memberId
    );
    if (!adminRecord) {
      throw new Error(
        `Student ID "${formData.memberId.trim()}" not found. Please contact your admin to add you to the system first.`
      );
    }
  } else if (role === "faculty") {
    const faculty = getData("faculty") || [];
    adminRecord = faculty.find(
      (f) => f.id && f.id.toUpperCase() === memberId
    );
    if (!adminRecord) {
      throw new Error(
        `Faculty ID "${formData.memberId.trim()}" not found. Please contact your admin to add you to the system first.`
      );
    }
  } else {
    throw new Error("Only students and faculty can register. Admin accounts are created separately.");
  }

  // Attempt backend register (silently — fallback to local if backend unavailable)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.fullName,
        email: key,
        password: formData.password,
        role: formData.role.toUpperCase(),
        memberId: memberId,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await response.json().catch(() => null);
    if (!response.ok && data?.message) {
      if (response.status === 409 || response.status === 400) {
        throw new Error(data.message);
      }
    }
  } catch (err) {
    if (
      err.message &&
      !err.message.includes("fetch") &&
      !err.message.includes("abort") &&
      !err.message.includes("Failed to")
    ) {
      throw err;
    }
  }

  // Build the profile using admin data + user-supplied name/email
  const initials = formData.fullName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profile = {
    ...adminRecord,                       // All admin-managed fields (department, course, semester, etc.)
    id: adminRecord.id,                   // Keep the admin-assigned ID
    name: formData.fullName,              // Use the name the user provided
    email: key,                           // Use the email the user provided
    role: role,
    avatar: initials || "U",
    ...(role === "student" && {
      studentId: adminRecord.id,
      rollNo: adminRecord.id,
      semester: adminRecord.semester
        ? `${adminRecord.semester}${ordinalSuffix(adminRecord.semester)} Semester`
        : "1st Semester",
      academicYear: "2026 - 2027",
      address: adminRecord.address || "",
    }),
    ...(role === "faculty" && {
      designation: adminRecord.designation || "Assistant Professor",
      subjects: adminRecord.subjectNames || adminRecord.subjects || [],
      experience: adminRecord.experience || "Newly joined",
      qualification: adminRecord.qualification || "",
    }),
  };

  const registered = loadRegisteredUsers();
  registered[key] = { password: formData.password, profile };
  saveRegisteredUsers(registered);

  return { success: true, message: "Registration successful. You can now log in." };
}

/** Helper: returns "st", "nd", "rd", or "th" for a number */
function ordinalSuffix(n) {
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  if (num === 1) return "st";
  if (num === 2) return "nd";
  if (num === 3) return "rd";
  return "th";
}

export async function forgotPassword(email) {
  try {
    await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  } catch {
    // Silent fallback
  }
  return delay({ success: true, message: `Password reset instructions sent to ${email}.` }, 400);
}

export async function logout() {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore
    }
  }
  return delay({ success: true }, 150);
}
