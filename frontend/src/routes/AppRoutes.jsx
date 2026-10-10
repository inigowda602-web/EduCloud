import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Loading from "../components/Loading";

import AuthLayout from "../layouts/AuthLayout";
import StudentLayout from "../layouts/StudentLayout";
import FacultyLayout from "../layouts/FacultyLayout";
import AdminLayout from "../layouts/AdminLayout";

// Eagerly loaded public entry pages
import Landing from "../pages/common/Landing";
import NotFound from "../pages/common/NotFound";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";

// Lazy-loaded Student pages
const StudentDashboard = lazy(() => import("../pages/student/Dashboard"));
const StudentProfile = lazy(() => import("../pages/student/Profile"));
const StudentAttendance = lazy(() => import("../pages/student/Attendance"));
const StudentQRAttendance = lazy(() => import("../pages/student/QRAttendance"));
const StudentSubjects = lazy(() => import("../pages/student/Subjects"));
const StudentTimetable = lazy(() => import("../pages/student/Timetable"));
const StudentResults = lazy(() => import("../pages/student/Results"));
const StudentFees = lazy(() => import("../pages/student/Fees"));
const StudentAssessments = lazy(() => import("../pages/student/Assessments"));
const StudentAssignments = lazy(() => import("../pages/student/Assignments"));
const StudentFeedback = lazy(() => import("../pages/student/Feedback"));
const StudentNotifications = lazy(() => import("../pages/student/Notifications"));
const StudentChatbot = lazy(() => import("../pages/student/Chatbot"));
const StudentSettings = lazy(() => import("../pages/student/Settings"));

// Lazy-loaded Faculty pages
const FacultyDashboard = lazy(() => import("../pages/faculty/Dashboard"));
const FacultyProfile = lazy(() => import("../pages/faculty/Profile"));
const FacultyMyClasses = lazy(() => import("../pages/faculty/MyClasses"));
const FacultyTimetable = lazy(() => import("../pages/faculty/Timetable"));
const FacultySubjects = lazy(() => import("../pages/faculty/Subjects"));
const FacultyStudents = lazy(() => import("../pages/faculty/Students"));
const FacultyAttendance = lazy(() => import("../pages/faculty/Attendance"));
const FacultyQRAttendance = lazy(() => import("../pages/faculty/QRAttendance"));
const FacultyMarks = lazy(() => import("../pages/faculty/Marks"));
const FacultyAssessments = lazy(() => import("../pages/faculty/Assessments"));
const FacultyAssignments = lazy(() => import("../pages/faculty/Assignments"));
const FacultyCourseMaterials = lazy(() => import("../pages/faculty/CourseMaterials"));
const FacultyAnnouncements = lazy(() => import("../pages/faculty/Announcements"));
const FacultyNotifications = lazy(() => import("../pages/faculty/Notifications"));
const FacultyStudentPerformance = lazy(() => import("../pages/faculty/StudentPerformance"));
const FacultyFeedback = lazy(() => import("../pages/faculty/Feedback"));
const FacultyRequests = lazy(() => import("../pages/faculty/Requests"));
const FacultyReports = lazy(() => import("../pages/faculty/Reports"));
const FacultyTasks = lazy(() => import("../pages/faculty/Tasks"));
const FacultyChatbot = lazy(() => import("../pages/faculty/Chatbot"));
const FacultySettings = lazy(() => import("../pages/faculty/Settings"));

// Lazy-loaded Admin pages
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const AdminStudents = lazy(() => import("../pages/admin/Students"));
const AdminFaculty = lazy(() => import("../pages/admin/Faculty"));
const AdminDepartments = lazy(() => import("../pages/admin/Departments"));
const AdminCourses = lazy(() => import("../pages/admin/Courses"));
const AdminSubjects = lazy(() => import("../pages/admin/Subjects"));
const AdminAttendance = lazy(() => import("../pages/admin/Attendance"));
const AdminQRManagement = lazy(() => import("../pages/admin/QRManagement"));
const AdminLocations = lazy(() => import("../pages/admin/LocationManagement"));
const AdminResults = lazy(() => import("../pages/admin/Results"));
const AdminTimetable = lazy(() => import("../pages/admin/Timetable"));
const AdminNotifications = lazy(() => import("../pages/admin/Notifications"));
const AdminReports = lazy(() => import("../pages/admin/Reports"));
const AdminChatbot = lazy(() => import("../pages/admin/Chatbot"));
const AdminSettings = lazy(() => import("../pages/admin/Settings"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading label="Loading EduCloud..." />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="qr-attendance" element={<StudentQRAttendance />} />
          <Route path="subjects" element={<StudentSubjects />} />
          <Route path="classes" element={<StudentSubjects />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="assessments" element={<StudentAssessments />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="feedback" element={<StudentFeedback />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="notices" element={<StudentNotifications />} />
          <Route path="chatbot" element={<StudentChatbot />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* Faculty */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute role="faculty">
              <FacultyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FacultyDashboard />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
          <Route path="profile" element={<FacultyProfile />} />
          <Route path="my-classes" element={<FacultyMyClasses />} />
          <Route path="classes" element={<FacultyMyClasses />} />
          <Route path="timetable" element={<FacultyTimetable />} />
          <Route path="subjects" element={<FacultySubjects />} />
          <Route path="students" element={<FacultyStudents />} />
          <Route path="attendance" element={<FacultyAttendance />} />
          <Route path="qr-attendance" element={<FacultyQRAttendance />} />
          <Route path="marks" element={<FacultyMarks />} />
          <Route path="assessments" element={<FacultyAssessments />} />
          <Route path="assignments" element={<FacultyAssignments />} />
          <Route path="materials" element={<FacultyCourseMaterials />} />
          <Route path="announcements" element={<FacultyAnnouncements />} />
          <Route path="notifications" element={<FacultyNotifications />} />
          <Route path="notices" element={<FacultyNotifications />} />
          <Route path="performance" element={<FacultyStudentPerformance />} />
          <Route path="feedback" element={<FacultyFeedback />} />
          <Route path="requests" element={<FacultyRequests />} />
          <Route path="reports" element={<FacultyReports />} />
          <Route path="tasks" element={<FacultyTasks />} />
          <Route path="chatbot" element={<FacultyChatbot />} />
          <Route path="settings" element={<FacultySettings />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="faculty" element={<AdminFaculty />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="subjects" element={<AdminSubjects />} />
          <Route path="classes" element={<AdminSubjects />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="qr-attendance" element={<AdminQRManagement />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="timetable" element={<AdminTimetable />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="notices" element={<AdminNotifications />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="chatbot" element={<AdminChatbot />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
