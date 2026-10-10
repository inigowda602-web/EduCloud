package com.educloud.dto.auth;

import com.educloud.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters.")
    private String password;

    @NotNull
    private Role role;

    private String phone;

    // Student-only fields (ignored for other roles)
    private Long departmentId;
    private Long courseId;
    private Integer semester;

    // Faculty-only fields
    private String designation;

    // Member/Student/Faculty ID support
    private String memberId;
    private String referenceId;
}

