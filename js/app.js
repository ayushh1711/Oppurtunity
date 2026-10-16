// ─── Constants ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "opportunityX_v1";
const SESSION_KEY = "opportunityX_session";

// ─── Default seed data ───────────────────────────────────────────────────────
const defaultData = {
    admins: [
        {
            id: "admin",
            name: "College Admin",
            email: "admin@college.edu",
            department: "Student Affairs",
            password: "12345678"
        }
    ],
    students: [
        {
            id: "STU001",
            name: "Ananya Sharma",
            email: "ananya@college.edu",
            course: "BCA",
            year: "2",
            password: "student123",
            skills: ["Dance", "Photography"],
            clubs: ["c1"],
            registrations: [],
            read: []
        },
        {
            id: "STU002",
            name: "Aarav Singh",
            email: "aarav@college.edu",
            course: "BTech",
            year: "1",
            password: "student123",
            skills: ["Coding", "Robotics"],
            clubs: ["c2"],
            registrations: [],
            read: []
        }
    ],
    clubs: [
        {
            id: "c1",
            name: "Cultural Club",
            category: "Cultural",
            description: "Participate in cultural activities, performances, and university celebrations.",
            skills: ["Dance", "Singing", "Music"],
            status: "approved"
        },
        {
            id: "c2",
            name: "Coding Club",
            category: "Technical",
            description: "Explore programming, coding challenges, and technical learning opportunities.",
            skills: ["Coding", "Robotics"],
            status: "approved"
        },
        {
            id: "c3",
            name: "Photography Club",
            category: "Creative",
            description: "Improve your photography skills and capture campus activities.",
            skills: ["Photography", "Graphic Design"],
            status: "approved"
        },
        {
            id: "c4",
            name: "Sports Club",
            category: "Sports",
            description: "Take part in sports activities, competitions, and fitness events.",
            skills: ["Sports", "Teamwork"],
            status: "approved"
        }
    ],
    clubApplications: [],
    events: [
        {
            id: "e1",
            title: "Annual Dance Competition",
            clubId: "c1",
            date: "2026-11-12",
            skills: ["Dance"],
            description: "Showcase your dance skills and participate in a university competition."
        },
        {
            id: "e2",
            title: "Coding Workshop",
            clubId: "c2",
            date: "2026-11-18",
            skills: ["Coding"],
            description: "Learn programming concepts and improve your problem-solving skills."
        }
    ],
    notices: [
        {
            id: "n1",
            title: "Dance Competition Registrations Open",
            message: "Registrations are open for the Annual Dance Competition.",
            target: "Dance",
            date: new Date().toISOString()
        },
        {
            id: "n2",
            title: "Welcome to Opportunity-X",
            message: "Explore clubs, discover events, and keep your student profile updated.",
            target: "all",
            date: new Date().toISOString()
        }
    ]
};

// ─── Storage helpers ─────────────────────────────────────────────────────────
function getDatabase() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : structuredClone(defaultData);

        for (const key of Object.keys(defaultData)) {
            if (!Array.isArray(data[key])) {
                data[key] = structuredClone(defaultData[key]);
            }
        }

        data.clubs.forEach(club => {
            if (!club.status) club.status = "approved";
        });

        if (!saved) saveDatabase(data);
        return data;
    } catch {
        const data = structuredClone(defaultData);
        saveDatabase(data);
        return data;
    }
}

function saveDatabase(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Session helpers ─────────────────────────────────────────────────────────
function getSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch {
        return null;
    }
}

function setSession(role, id) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, id }));
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("opportunityX_student");
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
}

function showMessage(id, message, success = false) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.style.color = success ? "#18794e" : "#b42318";
}

function makeId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function requireRole(role) {
    const session = getSession();
    if (!session || session.role !== role) {
        window.location.href = role === "admin"
            ? "../admin-login.html"
            : role === "clubAdmin"
                ? "../club-login.html"
                : "../student-login.html";
        return false;
    }
    return true;
}

function requireStudentSession() {
    const session = getSession();
    if (!session || session.role !== "student") {
        window.location.href = "../student-login.html";
        return false;
    }
    return true;
}

function getCurrentStudent(data = getDatabase()) {
    const session = getSession();
    if (!session || session.role !== "student") return null;
    return data.students.find(s => s.id === session.id) || null;
}

function getCurrentAdmin(data = getDatabase()) {
    const session = getSession();
    if (!session || session.role !== "admin") return null;
    return data.admins.find(a => a.id === session.id) || null;
}

function getCurrentClubAdmin(data = getDatabase()) {
    const session = getSession();
    if (!session || session.role !== "clubAdmin") return null;
    return data.clubApplications.find(a => a.id === session.id && a.status === "approved") || null;
}

function getCurrentManagedClub(data = getDatabase()) {
    const application = getCurrentClubAdmin(data);
    if (!application) return null;
    return data.clubs.find(c => c.applicationId === application.id && c.status === "approved") || null;
}

function getClubName(data, clubId) {
    return data.clubs.find(c => c.id === clubId)?.name || "Unknown Club";
}

function formatDate(date) {
    if (!date) return "Not specified";
    const parsed = new Date(date + "T00:00:00");
    if (Number.isNaN(parsed.getTime())) return escapeHTML(date);
    return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function createTags(items = []) {
    return items.length
        ? items.map(i => `<span class="tag">${escapeHTML(i)}</span>`).join(" ")
        : "<span>No skills listed</span>";
}

// ─── Card builders ───────────────────────────────────────────────────────────
function createClubCard(club, student = null) {
    const joined = student && student.clubs.includes(club.id);
    return `
        <article class="card">
            <span class="tag">${escapeHTML(club.category)}</span>
            <h2>${escapeHTML(club.name)}</h2>
            <p>${escapeHTML(club.description)}</p>
            <p><strong>Skills:</strong></p>
            <div>${createTags(club.skills)}</div>
            ${student ? `
                <button type="button" class="btn" data-join-club="${escapeHTML(club.id)}" ${joined ? "disabled" : ""}>
                    ${joined ? "Already Joined" : "Join Club"}
                </button>
            ` : ""}
        </article>
    `;
}

function createEventCard(event, data, student = null) {
    const clubName = getClubName(data, event.clubId);
    const registered = student && student.registrations.some(r => r.eventId === event.id);
    return `
        <article class="card">
            <h2>${escapeHTML(event.title)}</h2>
            <p>${escapeHTML(event.description)}</p>
            <p><strong>Date:</strong> ${formatDate(event.date)}</p>
            <p><strong>Organised by:</strong> ${escapeHTML(clubName)}</p>
            <p><strong>Skills:</strong> ${escapeHTML((event.skills || []).join(", ") || "Open to all")}</p>
            ${student ? `
                <button type="button" class="btn" data-register-event="${escapeHTML(event.id)}" ${registered ? "disabled" : ""}>
                    ${registered ? "Registered" : "Register"}
                </button>
            ` : ""}
        </article>
    `;
}

// ─── Homepage ────────────────────────────────────────────────────────────────
function loadHomepage() {
    const data = getDatabase();

    const clubsContainer = document.getElementById("publicClubs");
    if (clubsContainer) {
        const approved = data.clubs.filter(c => c.status === "approved");
        clubsContainer.innerHTML = approved.length
            ? approved.map(c => createClubCard(c)).join("")
            : "<p>No clubs are available right now.</p>";
    }

    const eventsContainer = document.getElementById("publicEvents");
    if (eventsContainer) {
        const approvedIds = data.clubs.filter(c => c.status === "approved").map(c => c.id);
        const upcoming = data.events
            .filter(e => e.date >= new Date().toISOString().slice(0, 10))
            .filter(e => approvedIds.includes(e.clubId))
            .sort((a, b) => a.date.localeCompare(b.date));
        eventsContainer.innerHTML = upcoming.length
            ? upcoming.map(e => createEventCard(e, data)).join("")
            : "<p>No upcoming events are available right now.</p>";
    }
}

// ─── Auth handlers ───────────────────────────────────────────────────────────
function handleStudentRegister() {
    const form = document.getElementById("studentRegisterForm");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const data = getDatabase();
        const id = document.getElementById("studentId").value.trim();
        const name = document.getElementById("studentName").value.trim();
        const email = document.getElementById("studentEmail").value.trim().toLowerCase();
        const course = document.getElementById("studentCourse").value;
        const year = document.getElementById("studentYear").value;
        const password = document.getElementById("studentNewPassword").value;
        const confirmPassword = document.getElementById("studentConfirmPassword").value;
        const skills = [...form.querySelectorAll('input[name="studentSkills"]:checked')].map(i => i.value);

        if (data.students.some(s => s.id.toLowerCase() === id.toLowerCase())) {
            showMessage("studentRegisterMessage", "This student ID is already registered.");
            return;
        }
        if (data.students.some(s => s.email.toLowerCase() === email)) {
            showMessage("studentRegisterMessage", "This email is already registered.");
            return;
        }
        if (password.length < 6) {
            showMessage("studentRegisterMessage", "Password must contain at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            showMessage("studentRegisterMessage", "Passwords do not match.");
            return;
        }

        data.students.push({ id, name, email, course, year, password, skills, clubs: [], registrations: [], read: [] });
        saveDatabase(data);
        form.reset();
        showMessage("studentRegisterMessage", "Registration successful! You can now log in.", true);
    });
}

function handleStudentLogin() {
    const form = document.getElementById("studentLoginForm");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const data = getDatabase();
        const identifier = document.getElementById("studentIdentifier").value.trim().toLowerCase();
        const password = document.getElementById("studentPassword").value;
        const student = data.students.find(s =>
            s.id.toLowerCase() === identifier || s.email.toLowerCase() === identifier
        );

        if (!student || student.password !== password) {
            showMessage("studentLoginMessage", "Invalid student ID/email or password.");
            return;
        }

        setSession("student", student.id);
        window.location.href = "student/dashboard.html";
    });
}

function handleAdminLogin() {
    const form = document.getElementById("adminLoginForm");
    if (!form || form.dataset.handlerAttached === "true") return;
    form.dataset.handlerAttached = "true";

    form.addEventListener("submit", event => {
        event.preventDefault();

        const data = getDatabase();
        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value;
        const admin = data.admins.find(a => a.id === username);

        if (!admin || admin.password !== password) {
            showMessage("adminLoginMessage", "Invalid username or password.");
            return;
        }

        setSession("admin", admin.id);
        window.location.href = "admin/dashboard.html";
    });
}

function handleClubRegistration() {
    const form = document.getElementById("clubRegistrationForm");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const data = getDatabase();
        const name = document.getElementById("clubName").value.trim();
        const category = document.getElementById("clubCategory").value;
        const description = document.getElementById("clubDescription").value.trim();
        const skills = document.getElementById("clubSkills").value.split(",").map(s => s.trim()).filter(Boolean);
        const contactEmail = document.getElementById("clubContactEmail").value.trim().toLowerCase();
        const contactPhone = document.getElementById("clubContactPhone").value.trim();
        const adminName = document.getElementById("clubAdminName").value.trim();
        const adminEmail = document.getElementById("clubAdminEmail").value.trim().toLowerCase();
        const username = document.getElementById("clubAdminUsername").value.trim();
        const password = document.getElementById("clubAdminPassword").value;
        const confirmPassword = document.getElementById("clubAdminConfirmPassword").value;

        if (data.clubs.some(c => c.name.toLowerCase() === name.toLowerCase()) ||
            data.clubApplications.some(a => a.name.toLowerCase() === name.toLowerCase() && a.status !== "rejected")) {
            showMessage("clubRegistrationMessage", "A club with this name has already been registered.");
            return;
        }
        if (data.clubApplications.some(a => a.username.toLowerCase() === username.toLowerCase())) {
            showMessage("clubRegistrationMessage", "This username is already in use.");
            return;
        }
        if (data.clubApplications.some(a => a.adminEmail.toLowerCase() === adminEmail)) {
            showMessage("clubRegistrationMessage", "This Club Admin email is already registered.");
            return;
        }
        if (username.length < 4) {
            showMessage("clubRegistrationMessage", "Username must contain at least 4 characters.");
            return;
        }
        if (password.length < 8) {
            showMessage("clubRegistrationMessage", "Password must contain at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            showMessage("clubRegistrationMessage", "Passwords do not match.");
            return;
        }

        data.clubApplications.push({
            id: makeId("ca"), name, category, description, skills, contactEmail,
            contactPhone, adminName, adminEmail, username, password,
            status: "pending", submittedAt: new Date().toISOString()
        });
        saveDatabase(data);
        form.reset();
        showMessage("clubRegistrationMessage", "Application submitted successfully. Your club is pending University Admin approval.", true);
    });
}

function handleClubLogin() {
    const form = document.getElementById("clubLoginForm");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const data = getDatabase();
        const username = document.getElementById("clubLoginUsername").value.trim().toLowerCase();
        const password = document.getElementById("clubLoginPassword").value;
        const application = data.clubApplications.find(a => a.username.toLowerCase() === username);

        if (!application || application.password !== password) {
            showMessage("clubLoginMessage", "Invalid username or password.");
            return;
        }
        if (application.status !== "approved") {
            showMessage("clubLoginMessage", application.status === "rejected"
                ? "Your club application was rejected. Please contact the University Admin."
                : "Your club application is still pending approval."
            );
            return;
        }
        const club = data.clubs.find(c => c.applicationId === application.id && c.status === "approved");
        if (!club) {
            showMessage("clubLoginMessage", "Your approved club account could not be found. Contact the University Admin.");
            return;
        }

        setSession("clubAdmin", application.id);
        window.location.href = "club-admin/dashboard.html";
    });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function handleLogoutLinks() {
    document.querySelectorAll("a").forEach(link => {
        if (link.textContent.trim().toLowerCase() === "logout") {
            link.addEventListener("click", e => {
                clearSession();
                // let the href navigate naturally
            });
        }
    });
}

// ─── Student Portal ───────────────────────────────────────────────────────────
function loadStudentDashboard() {
    if (!document.getElementById("studentRecommendedClubs")) return;
    if (!requireStudentSession()) return;

    const data = getDatabase();
    const student = getCurrentStudent(data);
    if (!student) { clearSession(); window.location.href = "../student-login.html"; return; }

    // Recommended clubs based on skill overlap
    const recClubs = document.getElementById("studentRecommendedClubs");
    if (recClubs) {
        const approved = data.clubs.filter(c => c.status === "approved" && !student.clubs.includes(c.id));
        const matched = approved.filter(c =>
            (c.skills || []).some(s => (student.skills || []).includes(s))
        );
        const toShow = matched.length ? matched : approved.slice(0, 3);
        recClubs.innerHTML = toShow.length
            ? toShow.map(c => createClubCard(c, student)).join("")
            : "<p>Join some clubs to see recommendations.</p>";

        recClubs.addEventListener("click", e => {
            const btn = e.target.closest("[data-join-club]");
            if (!btn) return;
            const db = getDatabase();
            const st = db.students.find(s => s.id === student.id);
            if (!st || st.clubs.includes(btn.dataset.joinClub)) return;
            st.clubs.push(btn.dataset.joinClub);
            saveDatabase(db);
            btn.disabled = true;
            btn.textContent = "Already Joined";
        });
    }

    // Upcoming events
    const upcomingEl = document.getElementById("studentUpcomingEvents");
    if (upcomingEl) {
        const approvedIds = data.clubs.filter(c => c.status === "approved").map(c => c.id);
        const upcoming = data.events
            .filter(e => e.date >= new Date().toISOString().slice(0, 10) && approvedIds.includes(e.clubId))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 4);
        upcomingEl.innerHTML = upcoming.length
            ? upcoming.map(e => createEventCard(e, data, student)).join("")
            : "<p>No upcoming events right now.</p>";

        upcomingEl.addEventListener("click", e => {
            const btn = e.target.closest("[data-register-event]");
            if (!btn) return;
            const db = getDatabase();
            const st = db.students.find(s => s.id === student.id);
            if (!st || st.registrations.some(r => r.eventId === btn.dataset.registerEvent)) return;
            st.registrations.push({ eventId: btn.dataset.registerEvent, registeredAt: new Date().toISOString() });
            saveDatabase(db);
            btn.disabled = true;
            btn.textContent = "Registered";
        });
    }
}

function loadStudentClubs() {
    const listEl = document.getElementById("studentClubList");
    if (!listEl) return;
    if (!requireStudentSession()) return;

    const data = getDatabase();
    const student = getCurrentStudent(data);
    if (!student) { clearSession(); window.location.href = "../student-login.html"; return; }

    const searchEl = document.getElementById("clubSearch");
    const filterEl = document.getElementById("clubCategoryFilter");

    function render() {
        const query = (searchEl?.value || "").trim().toLowerCase();
        const category = filterEl?.value || "all";
        const approved = data.clubs.filter(c => c.status === "approved");
        const filtered = approved.filter(c => {
            const matchCat = category === "all" || c.category === category;
            const matchQ = !query || c.name.toLowerCase().includes(query) || (c.skills || []).some(s => s.toLowerCase().includes(query));
            return matchCat && matchQ;
        });
        listEl.innerHTML = filtered.length
            ? filtered.map(c => createClubCard(c, student)).join("")
            : "<p>No clubs match your search.</p>";

        // My clubs section
        const myList = document.getElementById("myClubsList");
        if (myList) {
            const joined = approved.filter(c => student.clubs.includes(c.id));
            myList.innerHTML = joined.length
                ? joined.map(c => `<article class="card"><span class="tag">${escapeHTML(c.category)}</span><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.description)}</p></article>`).join("")
                : "<p>You have not joined any clubs yet.</p>";
        }
    }

    listEl.addEventListener("click", e => {
        const btn = e.target.closest("[data-join-club]");
        if (!btn) return;
        const db = getDatabase();
        const st = db.students.find(s => s.id === student.id);
        if (!st || st.clubs.includes(btn.dataset.joinClub)) return;
        st.clubs.push(btn.dataset.joinClub);
        saveDatabase(db);
        student.clubs.push(btn.dataset.joinClub);
        showMessage("clubActionMessage", "You have joined the club!", true);
        render();
    });

    searchEl?.addEventListener("input", render);
    filterEl?.addEventListener("change", render);
    render();
}

function loadStudentEvents() {
    const listEl = document.getElementById("studentEventList");
    if (!listEl) return;
    if (!requireStudentSession()) return;

    const data = getDatabase();
    const student = getCurrentStudent(data);
    if (!student) { clearSession(); window.location.href = "../student-login.html"; return; }

    const searchEl = document.getElementById("eventSearch");
    const filterEl = document.getElementById("eventClubFilter");

    // Populate club filter dynamically
    if (filterEl) {
        const approved = data.clubs.filter(c => c.status === "approved");
        filterEl.innerHTML = '<option value="all">All Clubs</option>' +
            approved.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
    }

    function render() {
        const query = (searchEl?.value || "").trim().toLowerCase();
        const clubId = filterEl?.value || "all";
        const approvedIds = data.clubs.filter(c => c.status === "approved").map(c => c.id);
        let events = data.events.filter(e => approvedIds.includes(e.clubId));
        if (clubId !== "all") events = events.filter(e => e.clubId === clubId);
        if (query) events = events.filter(e => e.title.toLowerCase().includes(query) || (e.skills || []).some(s => s.toLowerCase().includes(query)));
        events = events.sort((a, b) => a.date.localeCompare(b.date));

        listEl.innerHTML = events.length
            ? events.map(e => createEventCard(e, data, student)).join("")
            : "<p>No events match your search.</p>";

        // My registrations section on events page
        const myReg = document.getElementById("myEventRegistrations");
        if (myReg) {
            const regEvents = student.registrations
                .map(r => data.events.find(e => e.id === r.eventId))
                .filter(Boolean);
            myReg.innerHTML = regEvents.length
                ? regEvents.map(e => `<p><strong>${escapeHTML(e.title)}</strong> — ${formatDate(e.date)} — ${escapeHTML(getClubName(data, e.clubId))}</p>`).join("")
                : "<p>You have not registered for any events yet.</p>";
        }
    }

    listEl.addEventListener("click", e => {
        const btn = e.target.closest("[data-register-event]");
        if (!btn) return;
        const db = getDatabase();
        const st = db.students.find(s => s.id === student.id);
        if (!st || st.registrations.some(r => r.eventId === btn.dataset.registerEvent)) return;
        st.registrations.push({ eventId: btn.dataset.registerEvent, registeredAt: new Date().toISOString() });
        saveDatabase(db);
        student.registrations = st.registrations;
        showMessage("eventActionMessage", "You have registered for the event!", true);
        render();
    });

    searchEl?.addEventListener("input", render);
    filterEl?.addEventListener("change", render);
    render();
}

function loadStudentSkills() {
    const form = document.getElementById("studentSkillsForm");
    if (!form) return;
    if (!requireStudentSession()) return;

    const data = getDatabase();
    const student = getCurrentStudent(data);
    if (!student) { clearSession(); window.location.href = "../student-login.html"; return; }

    // Pre-check saved skills
    const checkboxes = form.querySelectorAll('input[name="studentSkills"]');
    checkboxes.forEach(cb => {
        cb.checked = (student.skills || []).includes(cb.value);
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        const skills = [...form.querySelectorAll('input[name="studentSkills"]:checked')].map(i => i.value);
        const db = getDatabase();
        const st = db.students.find(s => s.id === student.id);
        if (st) {
            st.skills = skills;
            saveDatabase(db);
            showMessage("skillsMessage", "Skills updated successfully!", true);
        }
    });
}

function loadStudentNotifications() {
    const listEl = document.getElementById("studentNotificationList");
    if (!listEl) return;
    if (!requireStudentSession()) return;

    const data = getDatabase();
    const student = getCurrentStudent(data);
    if (!student) { clearSession(); window.location.href = "../student-login.html"; return; }

    const filterEl = document.getElementById("notificationFilter");
    const summaryEl = document.getElementById("notificationSummary");

    function getRelevantNotices() {
        return data.notices.filter(n => n.target === "all" || (student.skills || []).includes(n.target));
    }

    function render() {
        const filter = filterEl?.value || "all";
        let notices = getRelevantNotices();
        if (filter === "unread") notices = notices.filter(n => !(student.read || []).includes(n.id));
        if (filter === "read") notices = notices.filter(n => (student.read || []).includes(n.id));
        notices = notices.slice().reverse();

        const unreadCount = getRelevantNotices().filter(n => !(student.read || []).includes(n.id)).length;
        if (summaryEl) summaryEl.textContent = unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All notifications read.";

        listEl.innerHTML = notices.length ? notices.map(n => {
            const isRead = (student.read || []).includes(n.id);
            return `
                <article class="card" style="${isRead ? "opacity:0.7;" : ""}">
                    <h3>${escapeHTML(n.title)}</h3>
                    <p>${escapeHTML(n.message)}</p>
                    <p class="muted"><strong>Target:</strong> ${n.target === "all" ? "All Students" : escapeHTML(n.target)}</p>
                    <p class="muted">${new Date(n.date).toLocaleDateString("en-IN")}</p>
                    ${!isRead ? `<button type="button" class="btn" data-mark-read="${escapeHTML(n.id)}">Mark as Read</button>` : "<span class='tag'>Read</span>"}
                </article>
            `;
        }).join("") : "<p>No notifications to show.</p>";
    }

    listEl.addEventListener("click", e => {
        const btn = e.target.closest("[data-mark-read]");
        if (!btn) return;
        const db = getDatabase();
        const st = db.students.find(s => s.id === student.id);
        if (!st) return;
        if (!st.read) st.read = [];
        if (!st.read.includes(btn.dataset.markRead)) st.read.push(btn.dataset.markRead);
        saveDatabase(db);
        student.read = st.read;
        render();
    });

    document.getElementById("markAllReadButton")?.addEventListener("click", () => {
        const db = getDatabase();
        const st = db.students.find(s => s.id === student.id);
        if (!st) return;
        const relevant = getRelevantNotices().map(n => n.id);
        st.read = [...new Set([...(st.read || []), ...relevant])];
        saveDatabase(db);
        student.read = st.read;
        render();
        showMessage("notificationMessage", "All notifications marked as read.", true);
    });

    filterEl?.addEventListener("change", render);
    render();
}

function loadStudentRegistrations() {
    const clubRegEl = document.getElementById("studentClubRegistrations");
    const eventRegEl = document.getElementById("studentEventRegistrationTable");
    if (!clubRegEl && !eventRegEl) return;
    if (!requireStudentSession()) return;

    const data = getDatabase();
    const student = getCurrentStudent(data);
    if (!student) { clearSession(); window.location.href = "../student-login.html"; return; }

    // Club memberships
    if (clubRegEl) {
        const joined = data.clubs.filter(c => student.clubs.includes(c.id));
        document.getElementById("clubRegistrationCount").textContent = `${joined.length} club${joined.length !== 1 ? "s" : ""} joined`;
        clubRegEl.innerHTML = joined.length
            ? joined.map(c => `<article class="card"><span class="tag">${escapeHTML(c.category)}</span><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.description)}</p></article>`).join("")
            : "<p>You have not joined any clubs yet.</p>";
    }

    // Event registrations
    if (eventRegEl) {
        const regEvents = student.registrations.map(r => {
            const ev = data.events.find(e => e.id === r.eventId);
            return ev ? { ...ev, registeredAt: r.registeredAt } : null;
        }).filter(Boolean);

        document.getElementById("eventRegistrationCount").textContent = `${regEvents.length} event${regEvents.length !== 1 ? "s" : ""} registered`;
        eventRegEl.innerHTML = regEvents.length
            ? regEvents.map(e => `
                <tr>
                    <td>${escapeHTML(e.title)}</td>
                    <td>${escapeHTML(getClubName(data, e.clubId))}</td>
                    <td>${formatDate(e.date)}</td>
                    <td><span class="tag">Registered</span></td>
                </tr>
            `).join("")
            : '<tr><td colspan="4">You have not registered for any events yet.</td></tr>';
    }
}

// ─── Admin Portal ─────────────────────────────────────────────────────────────
function loadAdminDashboard() {
    if (!document.getElementById("totalStudents")) return;
    if (!requireRole("admin")) return;

    const data = getDatabase();
    document.getElementById("totalStudents").textContent = data.students.length;
    document.getElementById("totalClubs").textContent = data.clubs.filter(c => c.status === "approved").length;
    document.getElementById("totalEvents").textContent = data.events.length;
    document.getElementById("totalNotices").textContent = data.notices.length;
}

function loadAdminStudents() {
    const tbody = document.getElementById("studentTableBody");
    if (!tbody || !requireRole("admin")) return;

    const data = getDatabase();
    const search = document.getElementById("studentSearch");

    function render() {
        const query = (search?.value || "").trim().toLowerCase();
        const students = data.students.filter(s =>
            [s.id, s.name, s.email, s.course].some(v => String(v).toLowerCase().includes(query))
        );
        tbody.innerHTML = students.length
            ? students.map(s => `
                <tr>
                    <td>${escapeHTML(s.id)}</td>
                    <td>${escapeHTML(s.name)}</td>
                    <td>${escapeHTML(s.email)}</td>
                    <td>${escapeHTML(s.course)}</td>
                    <td>${escapeHTML(s.year)}</td>
                    <td>${escapeHTML((s.skills || []).join(", "))}</td>
                </tr>
            `).join("")
            : '<tr><td colspan="6">No students found.</td></tr>';

        const countEl = document.getElementById("studentCount");
        if (countEl) countEl.textContent = `${students.length} students`;
    }

    search?.addEventListener("input", render);
    render();
}

function handleClubForm() {
    const form = document.getElementById("clubForm");
    if (!form || !requireRole("admin")) return;

    const data = getDatabase();

    function render() {
        const container = document.getElementById("adminClubList");
        if (!container) return;
        container.innerHTML = data.clubs.length
            ? data.clubs.map(c => `
                <article class="card">
                    <h3>${escapeHTML(c.name)}</h3>
                    <p>${escapeHTML(c.category)}</p>
                    <p>${escapeHTML(c.description)}</p>
                    <p><strong>Status:</strong> ${escapeHTML(c.status || "approved")}</p>
                    <p><strong>Skills:</strong> ${escapeHTML((c.skills || []).join(", "))}</p>
                    <button class="btn" type="button" data-delete-club="${escapeHTML(c.id)}">Delete Club</button>
                </article>
            `).join("")
            : "<p>No clubs have been added.</p>";
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        const name = document.getElementById("clubName").value.trim();
        const category = document.getElementById("clubCategory").value;
        const description = document.getElementById("clubDescription").value.trim();
        const skills = document.getElementById("clubSkills").value.split(",").map(s => s.trim()).filter(Boolean);

        if (data.clubs.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            showMessage("clubMessage", "A club with this name already exists.");
            return;
        }
        data.clubs.push({ id: makeId("c"), name, category, description, skills, status: "approved" });
        saveDatabase(data);
        form.reset();
        showMessage("clubMessage", "Club added successfully.", true);
        render();
        // refresh event club dropdown if present
        populateEventClubDropdown(data);
    });

    document.getElementById("adminClubList")?.addEventListener("click", e => {
        const button = e.target.closest("[data-delete-club]");
        if (!button) return;
        const clubId = button.dataset.deleteClub;
        data.clubs = data.clubs.filter(c => c.id !== clubId);
        data.students.forEach(s => { s.clubs = s.clubs.filter(id => id !== clubId); });
        data.events = data.events.filter(ev => ev.clubId !== clubId);
        saveDatabase(data);
        render();
    });

    render();
}

function loadClubApplications() {
    const container = document.getElementById("clubApplicationList");
    if (!container || !requireRole("admin")) return;

    const data = getDatabase();

    function render() {
        container.innerHTML = data.clubApplications.length
            ? data.clubApplications.slice().reverse().map(a => `
                <article class="card">
                    <h3>${escapeHTML(a.name)}</h3>
                    <p><strong>Category:</strong> ${escapeHTML(a.category)}</p>
                    <p>${escapeHTML(a.description)}</p>
                    <p><strong>Contact:</strong> ${escapeHTML(a.contactEmail)}</p>
                    <p><strong>Club Admin:</strong> ${escapeHTML(a.adminName)}</p>
                    <p><strong>Username:</strong> ${escapeHTML(a.username)}</p>
                    <p><strong>Status:</strong> <span class="tag">${escapeHTML(a.status)}</span></p>
                    ${a.status === "pending" ? `
                        <button type="button" class="btn" data-approve-club="${escapeHTML(a.id)}">Approve</button>
                        <button type="button" class="btn" data-reject-club="${escapeHTML(a.id)}">Reject</button>
                    ` : ""}
                </article>
            `).join("")
            : "<p>No club applications have been submitted.</p>";
    }

    container.addEventListener("click", e => {
        const approveBtn = e.target.closest("[data-approve-club]");
        const rejectBtn = e.target.closest("[data-reject-club]");

        if (approveBtn) {
            const app = data.clubApplications.find(a => a.id === approveBtn.dataset.approveClub);
            if (!app || app.status !== "pending") return;
            app.status = "approved";
            if (!data.clubs.some(c => c.name.toLowerCase() === app.name.toLowerCase())) {
                data.clubs.push({
                    id: makeId("c"),
                    name: app.name, category: app.category, description: app.description,
                    skills: app.skills, status: "approved", contactEmail: app.contactEmail,
                    contactPhone: app.contactPhone, adminUsername: app.username,
                    applicationId: app.id
                });
            }
            saveDatabase(data);
            render();
        }

        if (rejectBtn) {
            const app = data.clubApplications.find(a => a.id === rejectBtn.dataset.rejectClub);
            if (!app || app.status !== "pending") return;
            app.status = "rejected";
            saveDatabase(data);
            render();
        }
    });

    render();
}

function populateEventClubDropdown(data) {
    const select = document.getElementById("eventClub");
    if (!select) return;
    const approved = (data || getDatabase()).clubs.filter(c => c.status === "approved");
    select.innerHTML = '<option value="">Select a club</option>' +
        approved.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
}

function loadAdminEvents() {
    const form = document.getElementById("eventForm");
    if (!form || !requireRole("admin")) return;

    const data = getDatabase();
    populateEventClubDropdown(data);

    function render() {
        const container = document.getElementById("adminEventList");
        if (!container) return;
        container.innerHTML = data.events.length
            ? data.events.slice().reverse().map(e => `
                <article class="card">
                    <h3>${escapeHTML(e.title)}</h3>
                    <p>${escapeHTML(e.description)}</p>
                    <p><strong>Club:</strong> ${escapeHTML(getClubName(data, e.clubId))}</p>
                    <p><strong>Date:</strong> ${formatDate(e.date)}</p>
                    <p><strong>Skills:</strong> ${escapeHTML((e.skills || []).join(", ") || "Open to all")}</p>
                    <button type="button" class="btn" data-delete-event="${escapeHTML(e.id)}">Delete Event</button>
                </article>
            `).join("")
            : "<p>No events have been added yet.</p>";
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        const title = document.getElementById("eventTitle").value.trim();
        const clubId = document.getElementById("eventClub").value;
        const date = document.getElementById("eventDate").value;
        const skills = document.getElementById("eventSkills").value.split(",").map(s => s.trim()).filter(Boolean);
        const description = document.getElementById("eventDescription").value.trim();

        if (!clubId) { showMessage("eventMessage", "Please select an organising club."); return; }

        data.events.push({ id: makeId("e"), title, clubId, date, skills, description });
        saveDatabase(data);
        form.reset();
        populateEventClubDropdown(data);
        showMessage("eventMessage", "Event added successfully.", true);
        render();
    });

    document.getElementById("adminEventList")?.addEventListener("click", e => {
        const btn = e.target.closest("[data-delete-event]");
        if (!btn) return;
        data.events = data.events.filter(ev => ev.id !== btn.dataset.deleteEvent);
        saveDatabase(data);
        render();
    });

    render();
}

function loadAdminNotices() {
    const form = document.getElementById("noticeForm");
    if (!form || !requireRole("admin")) return;

    const data = getDatabase();

    function render() {
        const container = document.getElementById("adminNoticeList");
        if (!container) return;
        container.innerHTML = data.notices.length
            ? data.notices.slice().reverse().map(n => `
                <article class="card">
                    <h3>${escapeHTML(n.title)}</h3>
                    <p>${escapeHTML(n.message)}</p>
                    <p><strong>Target:</strong> ${n.target === "all" ? "All Students" : escapeHTML(n.target)}</p>
                    <p class="muted">${new Date(n.date).toLocaleDateString("en-IN")}</p>
                    <button type="button" class="btn" data-delete-notice="${escapeHTML(n.id)}">Delete</button>
                </article>
            `).join("")
            : "<p>No notices have been published yet.</p>";
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        const title = document.getElementById("noticeTitle").value.trim();
        const message = document.getElementById("noticeMessage").value.trim();
        const target = document.getElementById("noticeTarget").value;

        data.notices.push({ id: makeId("n"), title, message, target, date: new Date().toISOString() });
        saveDatabase(data);
        form.reset();
        showMessage("noticeMessageStatus", "Notice published successfully.", true);
        render();
    });

    document.getElementById("adminNoticeList")?.addEventListener("click", e => {
        const btn = e.target.closest("[data-delete-notice]");
        if (!btn) return;
        data.notices = data.notices.filter(n => n.id !== btn.dataset.deleteNotice);
        saveDatabase(data);
        render();
    });

    render();
}

function loadAdminRegistrations() {
    const tbody = document.getElementById("registrationTableBody");
    if (!tbody || !requireRole("admin")) return;

    const data = getDatabase();
    const typeFilter = document.getElementById("registrationType");
    const searchEl = document.getElementById("registrationSearch");

    function render() {
        const type = typeFilter?.value || "all";
        const query = (searchEl?.value || "").trim().toLowerCase();

        const rows = [];

        if (type !== "event") {
            data.students.forEach(s => {
                s.clubs.forEach(clubId => {
                    const club = data.clubs.find(c => c.id === clubId);
                    if (!club) return;
                    rows.push({ studentId: s.id, studentName: s.name, type: "Club", name: club.name, date: "–", status: "Active" });
                });
            });
        }

        if (type !== "club") {
            data.students.forEach(s => {
                (s.registrations || []).forEach(r => {
                    const ev = data.events.find(e => e.id === r.eventId);
                    if (!ev) return;
                    rows.push({ studentId: s.id, studentName: s.name, type: "Event", name: ev.title, date: formatDate(ev.date), status: "Registered" });
                });
            });
        }

        const filtered = query
            ? rows.filter(r => [r.studentId, r.studentName, r.name].some(v => v.toLowerCase().includes(query)))
            : rows;

        const countEl = document.getElementById("registrationCount");
        if (countEl) countEl.textContent = `${filtered.length} registration${filtered.length !== 1 ? "s" : ""}`;

        tbody.innerHTML = filtered.length
            ? filtered.map(r => `
                <tr>
                    <td>${escapeHTML(r.studentId)}</td>
                    <td>${escapeHTML(r.studentName)}</td>
                    <td>${escapeHTML(r.type)}</td>
                    <td>${escapeHTML(r.name)}</td>
                    <td>${escapeHTML(r.date)}</td>
                    <td><span class="tag">${escapeHTML(r.status)}</span></td>
                </tr>
            `).join("")
            : '<tr><td colspan="6">No registrations found.</td></tr>';
    }

    typeFilter?.addEventListener("change", render);
    searchEl?.addEventListener("input", render);
    render();
}

// ─── Club Admin Portal ────────────────────────────────────────────────────────
function loadClubAdminDashboard() {
    if (!document.getElementById("clubDashboardTitle")) return;
    if (!requireRole("clubAdmin")) return;

    const data = getDatabase();
    const application = getCurrentClubAdmin(data);
    const club = getCurrentManagedClub(data);

    if (!application || !club) {
        clearSession();
        window.location.href = "../club-login.html";
        return;
    }

    const events = data.events.filter(e => e.clubId === club.id);
    const notices = data.notices.filter(n => n.clubId === club.id);

    document.getElementById("clubDashboardTitle").textContent = club.name;
    document.getElementById("clubDashboardWelcome").textContent =
        `Welcome, ${application.adminName}. Manage events and notices for ${club.name}.`;
    document.getElementById("clubDashboardStatus").textContent = "Approved";
    document.getElementById("clubDashboardEventCount").textContent = events.length;
    document.getElementById("clubDashboardNoticeCount").textContent = notices.length;
}

function loadClubAdminEvents() {
    const form = document.getElementById("clubEventForm");
    if (!form || !requireRole("clubAdmin")) return;

    const data = getDatabase();
    const club = getCurrentManagedClub(data);
    if (!club) { clearSession(); window.location.href = "../club-login.html"; return; }

    function render() {
        const container = document.getElementById("clubManagedEventList");
        if (!container) return;
        const events = data.events.filter(e => e.clubId === club.id);
        container.innerHTML = events.length
            ? events.slice().reverse().map(e => `
                <article class="card">
                    <h3>${escapeHTML(e.title)}</h3>
                    <p>${escapeHTML(e.description)}</p>
                    <p><strong>Date:</strong> ${formatDate(e.date)}</p>
                    <p><strong>Skills:</strong> ${escapeHTML((e.skills || []).join(", ") || "Open to all")}</p>
                    <button type="button" class="btn" data-delete-event="${escapeHTML(e.id)}">Delete</button>
                </article>
            `).join("")
            : "<p>No events created yet.</p>";
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        const title = document.getElementById("clubEventTitle").value.trim();
        const date = document.getElementById("clubEventDate").value;
        const skills = document.getElementById("clubEventSkills").value.split(",").map(s => s.trim()).filter(Boolean);
        const description = document.getElementById("clubEventDescription").value.trim();

        data.events.push({ id: makeId("e"), title, clubId: club.id, date, skills, description });
        saveDatabase(data);
        form.reset();
        showMessage("clubEventMessage", "Event published successfully.", true);
        render();
    });

    document.getElementById("clubManagedEventList")?.addEventListener("click", e => {
        const btn = e.target.closest("[data-delete-event]");
        if (!btn) return;
        data.events = data.events.filter(ev => ev.id !== btn.dataset.deleteEvent);
        saveDatabase(data);
        render();
    });

    render();
}

function loadClubAdminNotices() {
    const form = document.getElementById("clubNoticeForm");
    if (!form || !requireRole("clubAdmin")) return;

    const data = getDatabase();
    const club = getCurrentManagedClub(data);
    if (!club) { clearSession(); window.location.href = "../club-login.html"; return; }

    function render() {
        const container = document.getElementById("clubManagedNoticeList");
        if (!container) return;
        const notices = data.notices.filter(n => n.clubId === club.id);
        container.innerHTML = notices.length
            ? notices.slice().reverse().map(n => `
                <article class="card">
                    <h3>${escapeHTML(n.title)}</h3>
                    <p>${escapeHTML(n.message)}</p>
                    <p><strong>Target:</strong> ${n.target === "all" ? "All Students" : escapeHTML(n.target)}</p>
                    <p class="muted">${new Date(n.date).toLocaleDateString("en-IN")}</p>
                    <button type="button" class="btn" data-delete-notice="${escapeHTML(n.id)}">Delete</button>
                </article>
            `).join("")
            : "<p>No notices published yet.</p>";
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        const title = document.getElementById("clubNoticeTitle").value.trim();
        const message = document.getElementById("clubNoticeMessage").value.trim();
        const target = document.getElementById("clubNoticeTarget").value;

        data.notices.push({ id: makeId("n"), title, message, target, clubId: club.id, date: new Date().toISOString() });
        saveDatabase(data);
        form.reset();
        showMessage("clubNoticeMessageStatus", "Notice published successfully.", true);
        render();
    });

    document.getElementById("clubManagedNoticeList")?.addEventListener("click", e => {
        const btn = e.target.closest("[data-delete-notice]");
        if (!btn) return;
        data.notices = data.notices.filter(n => n.id !== btn.dataset.deleteNotice);
        saveDatabase(data);
        render();
    });

    render();
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
function initializeOpportunityX() {
    loadHomepage();

    // Auth pages
    handleStudentRegister();
    handleStudentLogin();
    handleAdminLogin();
    handleClubRegistration();
    handleClubLogin();

    // Student portal
    loadStudentDashboard();
    loadStudentClubs();
    loadStudentEvents();
    loadStudentSkills();
    loadStudentNotifications();
    loadStudentRegistrations();

    // Admin portal
    loadAdminDashboard();
    loadAdminStudents();
    handleClubForm();
    loadClubApplications();
    loadAdminEvents();
    loadAdminNotices();
    loadAdminRegistrations();

    // Club admin portal
    loadClubAdminDashboard();
    loadClubAdminEvents();
    loadClubAdminNotices();

    // Logout links
    handleLogoutLinks();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOpportunityX);
} else {
    initializeOpportunityX();
}
