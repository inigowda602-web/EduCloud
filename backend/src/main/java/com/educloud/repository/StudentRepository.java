package com.educloud.repository;

import com.educloud.entity.Student;
import com.educloud.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser(User user);
    Optional<Student> findByUserId(Long userId);
    Optional<Student> findByRollNo(String rollNo);
    Optional<Student> findByRollNoIgnoreCase(String rollNo);
    boolean existsByRollNo(String rollNo);
}
