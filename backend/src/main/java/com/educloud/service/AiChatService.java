package com.educloud.service;

import com.educloud.dto.ai.ChatMessageDto;
import com.educloud.entity.*;
import com.educloud.repository.*;
import com.educloud.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Backend-only Gemini proxy. The API key lives ONLY here (read from an
 * environment variable / application.properties) and is never returned to
 * or requested by the frontend. Every answer is grounded in the CALLING
 * user's own authorized data — pulled server-side via CurrentUserService —
 * never in data the client claims about itself.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final WebClient.Builder webClientBuilder;
    private final CurrentUserService currentUserService;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final MarksRepository marksRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final SubjectRepository subjectRepository;
    private final FacultySubjectAssignmentRepository assignmentAssignRepository;
    private final AttendanceSessionRepository sessionRepository;

    @Value("${app.gemini.api-key}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String model;

    @Value("${app.gemini.api-base:https://generativelanguage.googleapis.com/v1beta}")
    private String apiBase;

    public String chat(String userMessage) {
        return chat(userMessage, null);
    }

    public String chat(String userMessage, List<ChatMessageDto> history) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "Please provide a valid question or message.";
        }

        User user = currentUserService.getUser();
        String context = buildContext(user);

        boolean isConfigured = apiKey != null && !apiKey.isBlank() && !apiKey.trim().equalsIgnoreCase("YOUR_API_KEY");

        if (!isConfigured) {
            log.info("GEMINI_API_KEY is not configured — providing intelligent database-grounded reply.");
            return generateSmartLocalReply(userMessage, context, user);
        }

        try {
            String systemInstruction = "You are EduCloud's AI academic assistant for a Cloud-Based Student Management System. " +
                    "Answer questions politely, concisely, and accurately using ONLY the verified user context provided below. " +
                    "Never invent data. Never expose another person's personal data.\n\n" +
                    "User Context:\n" + context;

            List<Map<String, Object>> contents = new ArrayList<>();

            // Add previous conversation turns if provided
            if (history != null && !history.isEmpty()) {
                int startIdx = Math.max(0, history.size() - 6); // keep last 6 turns for context window
                for (int i = startIdx; i < history.size(); i++) {
                    ChatMessageDto turn = history.get(i);
                    String role = "user".equalsIgnoreCase(turn.getRole()) ? "user" : "model";
                    if (turn.getText() != null && !turn.getText().isBlank()) {
                        contents.add(Map.of(
                                "role", role,
                                "parts", List.of(Map.of("text", turn.getText()))
                        ));
                    }
                }
            }

            // Current question with context reminder
            String promptText = userMessage;
            if (contents.isEmpty()) {
                promptText = systemInstruction + "\n\nUser Question: " + userMessage;
                contents.add(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", promptText))
                ));
            } else {
                contents.add(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userMessage))
                ));
            }

            Map<String, Object> body = Map.of(
                    "contents", contents
            );

            WebClient client = webClientBuilder.build();
            String cleanKey = apiKey.trim();
            String url = apiBase + "/models/" + model.trim() + ":generateContent?key=" + cleanKey;

            Map response = client.post()
                    .uri(url)
                    .header("x-goog-api-key", cleanKey)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            return extractText(response);
        } catch (WebClientResponseException e) {
            log.error("Gemini API HTTP Error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                return "The AI service is currently experiencing heavy traffic. Here is your current data:\n\n" +
                        context + "\n\nPlease try asking again in a few moments.";
            } else if (e.getStatusCode().value() == 400 || e.getStatusCode().value() == 403) {
                return "The configured GEMINI_API_KEY was not accepted by the AI provider. " +
                        "Here is your academic information from EduCloud:\n\n" + context;
            }
            return generateSmartLocalReply(userMessage, context, user);
        } catch (Exception e) {
            log.error("Gemini call failed ({}): {}", e.getClass().getSimpleName(), e.getMessage());
            return generateSmartLocalReply(userMessage, context, user);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map response) {
        if (response == null) {
            return "Sorry, no response was returned by the AI assistant.";
        }
        try {
            List<Map> candidates = (List<Map>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return "The AI assistant could not generate an answer for that query.";
            }
            Map content = (Map) candidates.get(0).get("content");
            List<Map> parts = (List<Map>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "Sorry, I couldn't format the response. Please try again.";
        }
    }

    private String buildContext(User user) {
        return switch (user.getRole()) {
            case STUDENT -> buildStudentContext();
            case FACULTY -> buildFacultyContext();
            case ADMIN -> "The user is an administrator of the EduCloud platform.";
        };
    }

    private String buildStudentContext() {
        try {
            Student student = currentUserService.getStudent();
            List<Attendance> attendance = attendanceRepository.findByStudent(student);
            int total = attendance.size();
            int present = (int) attendance.stream().filter(a -> a.getStatus() != AttendanceStatus.ABSENT).count();
            int pct = total == 0 ? 0 : Math.round(present * 100f / total);

            List<Subject> subjects = student.getCourse() != null && student.getSemester() != null
                    ? subjectRepository.findByCourseAndSemester(student.getCourse(), student.getSemester())
                    : List.of();
            List<Marks> marks = marksRepository.findByStudent(student);

            LocalDate today = LocalDate.now();
            long pendingAssignments = 0;
            if (student.getCourse() != null && student.getSemester() != null) {
                pendingAssignments = assignmentRepository.findAll().stream()
                        .filter(a -> a.getSchoolClass() != null
                                && a.getSchoolClass().getCourse() != null
                                && a.getSchoolClass().getCourse().getId().equals(student.getCourse().getId())
                                && student.getSemester().equals(a.getSchoolClass().getSemester())
                                && submissionRepository.findByAssignmentAndStudent(a, student).isEmpty()
                                && !a.getDueDate().isBefore(today))
                        .count();
            }

            return "Student: " + student.getUser().getName() + " (Roll No: " + student.getRollNo() + ")\n"
                    + "Course: " + (student.getCourse() != null ? student.getCourse().getName() : "N/A") + ", Semester: " + student.getSemester() + "\n"
                    + "Overall attendance: " + pct + "% (" + present + "/" + total + " sessions attended)\n"
                    + "Enrolled subjects (" + subjects.size() + "): " + subjects.stream().map(Subject::getName).toList() + "\n"
                    + "Marks entered for " + marks.size() + " subject(s)\n"
                    + "Pending assignments due: " + pendingAssignments;
        } catch (Exception e) {
            return "Student record details unavailable.";
        }
    }

    private String buildFacultyContext() {
        try {
            Faculty faculty = currentUserService.getFaculty();
            List<FacultySubjectAssignment> assignments = assignmentAssignRepository.findByFaculty(faculty);
            long todaysSessions = sessionRepository.findByFacultyAndDate(faculty, LocalDate.now()).size();

            return "Faculty: " + faculty.getUser().getName() + ", Department: " + (faculty.getDepartment() != null ? faculty.getDepartment().getName() : "N/A") + "\n"
                    + "Designation: " + faculty.getDesignation() + "\n"
                    + "Assigned subjects: " + assignments.stream().map(a -> a.getSubject().getName()).distinct().toList() + "\n"
                    + "Classroom sessions today: " + todaysSessions;
        } catch (Exception e) {
            return "Faculty record details unavailable.";
        }
    }

    private String generateSmartLocalReply(String userMessage, String context, User user) {
        String q = userMessage.toLowerCase(Locale.ROOT);

        if (q.contains("attendance") || q.contains("present") || q.contains("absent") || q.contains("classes")) {
            return "Here is your attendance record:\n\n" + context +
                    "\n\nTip: You can view session-by-session breakdown under the Attendance tab.";
        }
        if (q.contains("subject") || q.contains("course") || q.contains("syllabus")) {
            return "Here are your enrolled subjects and course details:\n\n" + context;
        }
        if (q.contains("assignment") || q.contains("homework") || q.contains("due")) {
            return "Here is your assignment status:\n\n" + context +
                    "\n\nTip: Visit the Assignments page to submit your work before the deadline.";
        }
        if (q.contains("mark") || q.contains("grade") || q.contains("score") || q.contains("result")) {
            return "Here are your academic details:\n\n" + context +
                    "\n\nTip: Visit the Results tab to see SGPA, CGPA, and subject-wise scorecards.";
        }

        return "Here is your current profile and academic summary:\n\n" + context +
                "\n\n*(Note: Running with local data service. To enable live natural-language generative answers, set a valid `GEMINI_API_KEY` in the backend configuration.)*";
    }
}
