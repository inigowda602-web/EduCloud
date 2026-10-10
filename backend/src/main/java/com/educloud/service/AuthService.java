package com.educloud.service;

import com.educloud.dto.auth.AuthResponse;
import com.educloud.dto.auth.LoginRequest;
import com.educloud.dto.auth.RegisterRequest;
import com.educloud.dto.auth.UserSummary;
import com.educloud.entity.*;
import com.educloud.exception.BadRequestException;
import com.educloud.exception.ConflictException;
import com.educloud.repository.*;
import com.educloud.security.AppUserDetailsService;
import com.educloud.security.CurrentUserService;
import com.educloud.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final AdminRepository adminRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final ClassStudentRepository classStudentRepository;
    private final AdminCatalogService adminCatalogService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppUserDetailsService userDetailsService;
    private final CurrentUserService currentUserService;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .enabled(true)
                .build();
        user = userRepository.save(user);

        if (request.getRole() == Role.ADMIN) {
            adminRepository.save(Admin.builder()
                    .user(user)
                    .designation("System Administrator")
                    .build());
        } else if (request.getRole() == Role.STUDENT) {
            String refId = request.getMemberId() != null && !request.getMemberId().isBlank()
                    ? request.getMemberId().trim()
                    : (request.getReferenceId() != null && !request.getReferenceId().isBlank() ? request.getReferenceId().trim() : null);

            Optional<Student> existingStudent = (refId != null)
                    ? studentRepository.findByRollNoIgnoreCase(refId)
                    : Optional.empty();

            if (existingStudent.isPresent()) {
                Student student = existingStudent.get();
                student.setUser(user);
                studentRepository.save(student);
            } else {
                Department dept = null;
                if (request.getDepartmentId() != null) {
                    dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
                }
                if (dept == null) {
                    dept = departmentRepository.findAll().stream().findFirst().orElse(null);
                }

                Course course = null;
                if (request.getCourseId() != null) {
                    course = courseRepository.findById(request.getCourseId()).orElse(null);
                }
                if (course == null && dept != null) {
                    course = courseRepository.findByDepartment(dept).stream().findFirst().orElse(null);
                }
                if (course == null) {
                    course = courseRepository.findAll().stream().findFirst().orElse(null);
                }
                if (dept == null && course != null) {
                    dept = course.getDepartment();
                }

                int semester = request.getSemester() != null ? request.getSemester() : 1;

                Student student = Student.builder()
                        .user(user)
                        .department(dept)
                        .course(course)
                        .semester(semester)
                        .status(Student.StudentStatus.ACTIVE)
                        .academicYear("2026-2027")
                        .build();
                student = studentRepository.save(student);

                String rollNo = (refId != null) ? refId.toUpperCase(Locale.ROOT) : ("STU" + (2300 + student.getId()));
                student.setRollNo(rollNo);
                student = studentRepository.save(student);
            }
        } else if (request.getRole() == Role.FACULTY) {
            Department dept = null;
            if (request.getDepartmentId() != null) {
                dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            }
            if (dept == null) {
                dept = departmentRepository.findAll().stream().findFirst().orElse(null);
            }

            String designation = request.getDesignation() != null && !request.getDesignation().isBlank()
                    ? request.getDesignation().trim()
                    : "Assistant Professor";

            Faculty faculty = Faculty.builder()
                    .user(user)
                    .department(dept)
                    .designation(designation)
                    .status(Faculty.FacultyStatus.ACTIVE)
                    .build();
            facultyRepository.save(faculty);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());
        UserSummary summary = toUserSummary(user);

        emailService.sendRegistrationConfirmation(user.getEmail(), user.getName());

        return AuthResponse.builder()
                .token(token)
                .user(summary)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Account has been disabled. Please contact administrator.");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());
        UserSummary summary = toUserSummary(user);

        return AuthResponse.builder()
                .token(token)
                .user(summary)
                .build();
    }

    public UserSummary me() {
        User user = currentUserService.getUser();
        return toUserSummary(user);
    }

    public void logout() {
        // Stateless JWT; client clears token from storage
        log.debug("Logout called for current user");
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT)).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(token)
                    .expiresAt(LocalDateTime.now().plusMinutes(30))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), token);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token."));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invalid or expired password reset token.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    public UserSummary toUserSummary(User user) {
        Long profileId = null;
        if (user.getRole() == Role.STUDENT) {
            profileId = studentRepository.findByUser(user).map(Student::getId).orElse(null);
        } else if (user.getRole() == Role.FACULTY) {
            profileId = facultyRepository.findByUser(user).map(Faculty::getId).orElse(null);
        } else if (user.getRole() == Role.ADMIN) {
            profileId = adminRepository.findByUser(user).map(Admin::getId).orElse(null);
        }

        return UserSummary.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name().toLowerCase(Locale.ROOT))
                .profileId(profileId)
                .build();
    }
}
