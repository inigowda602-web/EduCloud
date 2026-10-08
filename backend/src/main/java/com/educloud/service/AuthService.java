package com.educloud.service;

import com.educloud.dto.AuthResponse;
import com.educloud.dto.LoginRequest;
import com.educloud.dto.RegisterRequest;
import com.educloud.model.Faculty;
import com.educloud.model.Student;
import com.educloud.model.User;
import com.educloud.repository.FacultyRepository;
import com.educloud.repository.StudentRepository;
import com.educloud.repository.UserRepository;
import com.educloud.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .name(user.getName())
                .email(user.getEmail())
                .referenceId(user.getReferenceId())
                .userId(user.getId())
                .build();
    }

    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // Prevent admin registration
        if ("ADMIN".equalsIgnoreCase(request.getRole())) {
            throw new RuntimeException("Admin registration is not allowed");
        }

        // Backend password validation (defense in depth)
        String password = request.getPassword();
        if (password.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters");
        }
        if (!password.matches(".*[a-zA-Z].*")) {
            throw new RuntimeException("Password must contain at least one letter");
        }
        if (!password.matches(".*\\d.*")) {
            throw new RuntimeException("Password must contain at least one number");
        }
        if (!password.matches(".*[!@#$%^&*(),.?\":\\{\\}|<>].*")) {
            throw new RuntimeException("Password must contain at least one special character");
        }

        // Validate against admin-created records
        String referenceId = request.getReferenceId();
        String name = request.getName();

        // Check if someone already registered with this reference ID
        Optional<User> existingUser = userRepository.findByReferenceId(referenceId);
        if (existingUser.isPresent()) {
            throw new RuntimeException("An account with this ID already exists. Please login instead.");
        }

        if ("STUDENT".equalsIgnoreCase(request.getRole())) {
            Student student = studentRepository.findByStudentId(referenceId)
                    .orElseThrow(() -> new RuntimeException("Invalid registration. Student ID not found in admin records."));

            if (!student.getName().equalsIgnoreCase(name)) {
                throw new RuntimeException("Invalid registration. Name does not match admin records.");
            }

            // Update student email
            student.setEmail(request.getEmail());
            studentRepository.save(student);

        } else if ("FACULTY".equalsIgnoreCase(request.getRole())) {
            Faculty faculty = facultyRepository.findByFacultyId(referenceId)
                    .orElseThrow(() -> new RuntimeException("Invalid registration. Faculty ID not found in admin records."));

            if (!faculty.getName().equalsIgnoreCase(name)) {
                throw new RuntimeException("Invalid registration. Name does not match admin records.");
            }

            // Update faculty email
            faculty.setEmail(request.getEmail());
            facultyRepository.save(faculty);

        } else {
            throw new RuntimeException("Invalid role. Must be STUDENT or FACULTY.");
        }

        // Create user account
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .referenceId(referenceId)
                .build();

        userRepository.save(user);

        // Do NOT return a token - user must login after registration
        return AuthResponse.builder()
                .token(null)
                .role(user.getRole().name())
                .name(user.getName())
                .email(user.getEmail())
                .referenceId(user.getReferenceId())
                .userId(user.getId())
                .build();
    }
}
