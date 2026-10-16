document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("studentProfileForm");
    if (!form) return;

    const message = document.getElementById("profileMessage");
    const showMessage = text => { if (message) message.textContent = text; };

    // ── Resolve current student from whichever session exists ──────────────
    // Backend login sets opportunityX_student  (has studentId field)
    // App.js login sets opportunityX_session   (has role + id fields)
    let student = null;
    let useBackend = false;

    try {
        const backendSession = JSON.parse(sessionStorage.getItem("opportunityX_student") || "null");
        if (backendSession && backendSession.studentId) {
            student = backendSession;
            useBackend = true;
        }
    } catch (_) {}

    if (!student) {
        try {
            const appSession = JSON.parse(sessionStorage.getItem("opportunityX_session") || "null");
            if (appSession && appSession.role === "student" && appSession.id) {
                // Pull data from localStorage
                const STORAGE_KEY = "opportunityX_v1";
                const db = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
                if (db && Array.isArray(db.students)) {
                    const s = db.students.find(x => x.id === appSession.id);
                    if (s) {
                        student = {
                            studentId: s.id,
                            name: s.name,
                            email: s.email,
                            course: s.course || "",
                            year: s.year || "1",
                            skills: Array.isArray(s.skills) ? s.skills : []
                        };
                        useBackend = false;
                    }
                }
            }
        } catch (_) {}
    }

    if (!student) {
        window.location.href = "../student-login.html";
        return;
    }

    // ── Load profile ────────────────────────────────────────────────────────
    if (useBackend) {
        // Fetch fresh data from the Spring Boot API
        const api = "http://localhost:8080/api/students";
        try {
            const response = await fetch(`${api}/${encodeURIComponent(student.studentId)}/profile`);
            const profile = await response.json();
            if (!response.ok) throw new Error(profile.message || "Could not load profile.");

            document.getElementById("profileStudentId").value = profile.studentId || "";
            document.getElementById("profileName").value = profile.name || "";
            document.getElementById("profileEmail").value = profile.email || "";
            document.getElementById("profileCourse").value = profile.course || "BCA";
            document.getElementById("profileYear").value = profile.year == null ? "1" : String(profile.year);

            const skillsContainer = document.getElementById("profileSkills");
            if (skillsContainer) {
                const skills = Array.isArray(profile.skills) ? profile.skills : [];
                skillsContainer.textContent = skills.length ? skills.join(", ") : "No skills added yet.";
            }

            sessionStorage.setItem("opportunityX_student", JSON.stringify({ ...student, ...profile }));
            showMessage("Profile loaded successfully.");
        } catch (error) {
            showMessage(error.message || "Could not load profile.");
            populateFormFromLocal(student);
        }

        // Save handler for backend users
        form.addEventListener("submit", async event => {
            event.preventDefault();
            const updatedProfile = {
                name: document.getElementById("profileName").value.trim(),
                email: document.getElementById("profileEmail").value.trim(),
                course: document.getElementById("profileCourse").value,
                year: document.getElementById("profileYear").value
            };
            try {
                showMessage("Saving changes...");
                const response = await fetch(
                    `http://localhost:8080/api/students/${encodeURIComponent(student.studentId)}/profile`,
                    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedProfile) }
                );
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || "Could not save profile.");
                sessionStorage.setItem("opportunityX_student", JSON.stringify({ ...student, ...updatedProfile }));
                showMessage("Profile updated successfully.");
            } catch (error) {
                showMessage(error.message || "Could not save profile.");
            }
        });

    } else {
        // localStorage path — populate from local data
        populateFormFromLocal(student);
        showMessage("Profile loaded.");

        // Save handler for localStorage users
        form.addEventListener("submit", event => {
            event.preventDefault();
            const name = document.getElementById("profileName").value.trim();
            const email = document.getElementById("profileEmail").value.trim();
            const course = document.getElementById("profileCourse").value;
            const year = document.getElementById("profileYear").value;

            try {
                const STORAGE_KEY = "opportunityX_v1";
                const db = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
                if (db && Array.isArray(db.students)) {
                    const s = db.students.find(x => x.id === student.studentId);
                    if (s) {
                        s.name = name;
                        s.email = email;
                        s.course = course;
                        s.year = year;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
                        // keep session in sync
                        const updated = { ...student, name, email, course, year };
                        sessionStorage.setItem("opportunityX_student", JSON.stringify(updated));
                        showMessage("Profile updated successfully.");
                    }
                }
            } catch (_) {
                showMessage("Could not save profile.");
            }
        });
    }

    function populateFormFromLocal(s) {
        document.getElementById("profileStudentId").value = s.studentId || "";
        document.getElementById("profileName").value = s.name || "";
        document.getElementById("profileEmail").value = s.email || "";
        document.getElementById("profileCourse").value = s.course || "BCA";
        document.getElementById("profileYear").value = s.year == null ? "1" : String(s.year);

        const skillsContainer = document.getElementById("profileSkills");
        if (skillsContainer) {
            const skills = Array.isArray(s.skills) ? s.skills : (typeof s.skills === "string" ? s.skills.split(",").map(x => x.trim()).filter(Boolean) : []);
            skillsContainer.textContent = skills.length ? skills.join(", ") : "No skills added yet.";
        }
    }
});
