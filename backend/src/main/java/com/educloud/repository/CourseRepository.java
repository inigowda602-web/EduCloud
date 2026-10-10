package com.educloud.repository;

import com.educloud.entity.Course;
import com.educloud.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByNameIgnoreCase(String name);
    List<Course> findByDepartment(Department department);
    List<Course> findByDepartmentId(Long departmentId);
}

