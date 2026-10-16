
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("studentRegisterForm");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("studentRegisterMessage");

        const password = form.querySelector('[name="password"]').value;
        const confirmPassword = form.querySelector('[name="confirmPassword"]').value;

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        const skills = Array.from(
            form.querySelectorAll('input[name="studentSkills"]:checked')
        ).map(skill => skill.value);

        const student = {
            studentId: form.querySelector('[name="studentId"]').value.trim(),
            name: form.querySelector('[name="name"]').value.trim(),
            email: form.querySelector('[name="email"]').value.trim(),
            course: form.querySelector('[name="course"]').value,
            year: form.querySelector('[name="year"]').value,
            skills: skills.join(", "),
            password: password
        };

        try {
            message.textContent = "Registering student...";

            const response = await fetch(
                "http://localhost:8080/api/students/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(student)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed.");
            }

            message.textContent = result.message || "Registration successful!";
            form.reset();
        } catch (error) {
            message.textContent = error.message || "Could not connect to the backend.";
        }
    });
});
