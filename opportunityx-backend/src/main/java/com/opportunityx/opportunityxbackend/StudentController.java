
package com.opportunityx.opportunityxbackend;

import com.opportunityx.opportunityxbackend.model.Student;
import com.opportunityx.opportunityxbackend.model.StudentRegistrationRequest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = {
    "http://127.0.0.1:5500",
    "http://localhost:5500"
})
public class StudentController {

    private final JdbcTemplate jdbcTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public StudentController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/students")
    public List<Student> getStudents() {
        List<Student> students = jdbcTemplate.query(
            "SELECT StudentID, FullName, Email, Course, AcademicYear FROM Students ORDER BY CreatedAt DESC",
            (rs, rowNum) -> new Student(
                rs.getString("StudentID"),
                rs.getString("FullName"),
                rs.getString("Email"),
                rs.getString("Course"),
                rs.getObject("AcademicYear") == null
                    ? null
                    : String.valueOf(rs.getInt("AcademicYear")),
                null
            )
        );

        for (Student student : students) {
            List<String> skills = jdbcTemplate.query(
                "SELECT SkillName FROM StudentSkills WHERE StudentID = ? ORDER BY SkillName",
                (rs, rowNum) -> rs.getString("SkillName"),
                student.getStudentId()
            );
            student.setSkills(String.join(", ", skills));
        }

        return students;
    }

    @PostMapping("/api/students/register")
    @Transactional
    public Map<String, String> registerStudent(
            @RequestBody StudentRegistrationRequest request) {

        if (request.getStudentId() == null
                || request.getName() == null
                || request.getEmail() == null
                || request.getPassword() == null
                || request.getStudentId().isBlank()
                || request.getName().isBlank()
                || request.getEmail().isBlank()
                || request.getPassword().length() < 6) {
            throw new IllegalArgumentException(
                "Please provide valid registration details and a password of at least 6 characters."
            );
        }

        String studentId = request.getStudentId().trim();
        String name = request.getName().trim();
        String email = request.getEmail().trim().toLowerCase();
        String course = request.getCourse() == null
            ? null : request.getCourse().trim();

        Integer year = null;

        if (request.getYear() != null && !request.getYear().isBlank()) {
            try {
                year = Integer.valueOf(request.getYear().trim());
            } catch (NumberFormatException exception) {
                throw new IllegalArgumentException(
                    "Academic year must be a valid number."
                );
            }
        }

        String skillsText = request.getSkills() == null
            ? "" : request.getSkills().trim();

        Integer duplicateCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM Students WHERE StudentID = ? OR LOWER(Email) = ?",
            Integer.class,
            studentId,
            email
        );

        if (duplicateCount != null && duplicateCount > 0) {
            throw new IllegalArgumentException(
                "Student ID or email is already registered."
            );
        }

        String passwordHash = hashPassword(request.getPassword());

        try {
            jdbcTemplate.update(
                "INSERT INTO Students (StudentID, FullName, Email, PasswordHash, Course, AcademicYear) VALUES (?, ?, ?, ?, ?, ?)",
                studentId, name, email, passwordHash, course, year
            );

            List<String> skills = new ArrayList<>();

            if (!skillsText.isBlank()) {
                for (String skill : skillsText.split(",")) {
                    String cleaned = skill.trim();
                    if (!cleaned.isBlank() && !skills.contains(cleaned)) {
                        skills.add(cleaned);
                    }
                }
            }

            for (String skill : skills) {
                jdbcTemplate.update(
                    "INSERT INTO StudentSkills (StudentID, SkillName) VALUES (?, ?)",
                    studentId, skill
                );
            }
        } catch (DuplicateKeyException exception) {
            throw new IllegalArgumentException(
                "Student ID or email is already registered."
            );
        }

        return Map.of("message", "Registration successful.");
    }

    @PostMapping("/api/students/login")
    public Map<String, Object> loginStudent(
            @RequestBody Map<String, String> request) {

        String identifier = request.get("identifier");
        String password = request.get("password");

        if (identifier == null || password == null
                || identifier.isBlank() || password.isBlank()) {
            throw new IllegalArgumentException(
                "Student ID/email and password are required."
            );
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT StudentID, FullName, Email, PasswordHash, Course, AcademicYear FROM Students WHERE StudentID = ? OR LOWER(Email) = ?",
            identifier.trim(),
            identifier.trim().toLowerCase()
        );

        if (rows.isEmpty()) {
            throw new IllegalArgumentException(
                "Invalid student ID/email or password."
            );
        }

        Map<String, Object> row = rows.get(0);
        String storedHash = (String) row.get("PasswordHash");

        if (storedHash == null || !verifyPassword(password, storedHash)) {
            throw new IllegalArgumentException(
                "Invalid student ID/email or password."
            );
        }

        String studentId = row.get("StudentID").toString();

        List<String> skills = jdbcTemplate.query(
            "SELECT SkillName FROM StudentSkills WHERE StudentID = ? ORDER BY SkillName",
            (rs, rowNum) -> rs.getString("SkillName"),
            studentId
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Login successful.");
        result.put("studentId", studentId);
        result.put("name", row.get("FullName"));
        result.put("email", row.get("Email"));
        result.put("course", row.get("Course"));
        result.put("year", row.get("AcademicYear"));
        result.put("skills", skills);

        return result;
    }

    @GetMapping("/api/students/{studentId}/profile")
    public Map<String, Object> getStudentProfile(
            @PathVariable String studentId) {

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT StudentID, FullName, Email, Course, AcademicYear FROM Students WHERE StudentID = ?",
            studentId
        );

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Student not found.");
        }

        Map<String, Object> row = rows.get(0);

        List<String> skills = jdbcTemplate.query(
            "SELECT SkillName FROM StudentSkills WHERE StudentID = ? ORDER BY SkillName",
            (rs, rowNum) -> rs.getString("SkillName"),
            studentId
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentId", row.get("StudentID"));
        result.put("name", row.get("FullName"));
        result.put("email", row.get("Email"));
        result.put("course", row.get("Course"));
        result.put("year", row.get("AcademicYear"));
        result.put("skills", skills);

        return result;
    }

    @PutMapping("/api/students/{studentId}/profile")
    @Transactional
    public Map<String, String> updateStudentProfile(
            @PathVariable String studentId,
            @RequestBody Map<String, Object> request) {

        String name = value(request, "name");
        String email = value(request, "email").toLowerCase();
        String course = value(request, "course");
        String yearText = value(request, "year");

        if (name.isBlank() || email.isBlank()
                || course.isBlank() || yearText.isBlank()) {
            throw new IllegalArgumentException(
                "Name, email, course and year are required."
            );
        }

        int year;
        try {
            year = Integer.parseInt(yearText);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Year must be a number.");
        }

        if (year < 1 || year > 5) {
            throw new IllegalArgumentException("Year must be between 1 and 5.");
        }

        Integer duplicateCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM Students WHERE LOWER(Email) = ? AND StudentID <> ?",
            Integer.class,
            email,
            studentId
        );

        if (duplicateCount != null && duplicateCount > 0) {
            throw new IllegalArgumentException(
                "This email is already used by another student."
            );
        }

        int updated = jdbcTemplate.update(
            "UPDATE Students SET FullName = ?, Email = ?, Course = ?, AcademicYear = ? WHERE StudentID = ?",
            name, email, course, year, studentId
        );

        if (updated == 0) {
            throw new IllegalArgumentException("Student not found.");
        }

        return Map.of("message", "Profile updated successfully.");
    }

    private String value(Map<String, Object> request, String key) {
        Object result = request.get(key);
        return result == null ? "" : result.toString().trim();
    }

    private String hashPassword(String password) {
        byte[] salt = new byte[16];
        secureRandom.nextBytes(salt);

        PBEKeySpec spec = new PBEKeySpec(
            password.toCharArray(), salt, 120000, 256
        );

        try {
            byte[] hash = SecretKeyFactory
                .getInstance("PBKDF2WithHmacSHA256")
                .generateSecret(spec)
                .getEncoded();

            return Base64.getEncoder().encodeToString(salt)
                + ":" + Base64.getEncoder().encodeToString(hash);
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Could not process password.", exception
            );
        } finally {
            spec.clearPassword();
        }
    }

    private boolean verifyPassword(String password, String storedValue) {
        String[] parts = storedValue.split(":");

        if (parts.length != 2) return false;

        try {
            byte[] salt = Base64.getDecoder().decode(parts[0]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[1]);

            PBEKeySpec spec = new PBEKeySpec(
                password.toCharArray(), salt, 120000, 256
            );

            try {
                byte[] actualHash = SecretKeyFactory
                    .getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(spec)
                    .getEncoded();

                return MessageDigest.isEqual(expectedHash, actualHash);
            } finally {
                spec.clearPassword();
            }
        } catch (IllegalArgumentException exception) {
            return false;
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Could not verify password.", exception
            );
        }
    }
}
