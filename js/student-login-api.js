
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("studentLoginForm");
    if (!form) return;

    const message = document.getElementById("studentLoginMessage");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const credentials = {
            identifier: form.querySelector('[name="identifier"]').value.trim(),
            password: form.querySelector('[name="password"]').value
        };

        try {
            message.textContent = "Signing in...";

            const response = await fetch("http://localhost:8080/api/students/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed.");
            }

            const studentData = {
                studentId: result.studentId,
                name: result.name,
                email: result.email,
                course: result.course,
                year: result.year,
                skills: result.skills || []
            };

            // Store for profile page (backend-aware pages)
            sessionStorage.setItem("opportunityX_student", JSON.stringify(studentData));

            // Bridge: also write the app.js session so all portal pages recognise the login
            sessionStorage.setItem(
                "opportunityX_session",
                JSON.stringify({ role: "student", id: result.studentId })
            );

            // Ensure student exists in localStorage so app.js pages can load their data
            try {
                const STORAGE_KEY = "opportunityX_v1";
                const stored = localStorage.getItem(STORAGE_KEY);
                const db = stored ? JSON.parse(stored) : null;
                if (db && Array.isArray(db.students)) {
                    const exists = db.students.some(s => s.id === result.studentId);
                    if (!exists) {
                        db.students.push({
                            id: result.studentId,
                            name: result.name,
                            email: result.email,
                            course: result.course || "",
                            year: String(result.year || "1"),
                            password: "",
                            skills: result.skills || [],
                            clubs: [],
                            registrations: [],
                            read: []
                        });
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
                    }
                }
            } catch (_) { /* non-critical */ }

            message.textContent = "Login successful.";

            window.location.href = new URL(
                "student/dashboard.html",
                window.location.href
            ).href;
        } catch (error) {
            message.textContent = error.message || "Could not connect to the backend.";
        }
    });
});
