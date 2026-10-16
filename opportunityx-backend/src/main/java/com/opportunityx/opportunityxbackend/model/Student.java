
package com.opportunityx.opportunityxbackend.model;

public class Student {

    private String studentId;
    private String name;
    private String email;
    private String course;
    private String year;
    private String skills;

    public Student() {
    }

    public Student(String name, String email, String course, String skills) {
        this.name = name;
        this.email = email;
        this.course = course;
        this.skills = skills;
    }

    public Student(String studentId, String name, String email, String course, String year, String skills) {
        this.studentId = studentId;
        this.name = name;
        this.email = email;
        this.course = course;
        this.year = year;
        this.skills = skills;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }
}
