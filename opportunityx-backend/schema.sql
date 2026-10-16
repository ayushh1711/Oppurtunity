-- =============================================================================
-- Opportunity-X  |  Microsoft SQL Server Schema
-- Run this script once against your SQL Server instance to create the database
-- and all tables required by the platform.
--
-- How to run:
--   1. Open SQL Server Management Studio (SSMS)
--   2. Connect to your instance (localhost\SQLEXPRESS or localhost)
--   3. Open this file (File > Open > File) and execute (F5)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create database
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'OpportunityX')
BEGIN
    CREATE DATABASE OpportunityX;
END
GO

USE OpportunityX;
GO

-- -----------------------------------------------------------------------------
-- 2. Admins
--    One default admin seeded: username = admin, password = 12345678
--    The password field is plain text here for the localStorage prototype only.
--    The Spring Boot backend does not manage admin auth yet; the localStorage
--    app.js handles it. Add a proper hash when backend admin auth is added.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Admins')
BEGIN
    CREATE TABLE Admins (
        AdminID      NVARCHAR(50)  NOT NULL,
        Name         NVARCHAR(150) NOT NULL,
        Email        NVARCHAR(254) NOT NULL,
        Department   NVARCHAR(100) NULL,
        PasswordHash NVARCHAR(512) NOT NULL,
        CreatedAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Admins      PRIMARY KEY (AdminID),
        CONSTRAINT UQ_Admins_Email UNIQUE (Email)
    );

    -- Seed default admin (plain password stored for reference; replace with hash in production)
    INSERT INTO Admins (AdminID, Name, Email, Department, PasswordHash)
    VALUES ('admin', 'College Admin', 'admin@college.edu', 'Student Affairs', '12345678');
END
GO

-- -----------------------------------------------------------------------------
-- 3. Students
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Students')
BEGIN
    CREATE TABLE Students (
        StudentID    NVARCHAR(50)   NOT NULL,
        FullName     NVARCHAR(150)  NOT NULL,
        Email        NVARCHAR(254)  NOT NULL,
        PasswordHash NVARCHAR(512)  NOT NULL,
        Course       NVARCHAR(50)   NULL,
        AcademicYear TINYINT        NULL CHECK (AcademicYear BETWEEN 1 AND 5),
        CreatedAt    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Students       PRIMARY KEY (StudentID),
        CONSTRAINT UQ_Students_Email UNIQUE (Email)
    );
END
GO

-- -----------------------------------------------------------------------------
-- 4. Student Skills
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'StudentSkills')
BEGIN
    CREATE TABLE StudentSkills (
        StudentID NVARCHAR(50)  NOT NULL,
        SkillName NVARCHAR(100) NOT NULL,

        CONSTRAINT PK_StudentSkills PRIMARY KEY (StudentID, SkillName),
        CONSTRAINT FK_StudentSkills_Students
            FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
            ON DELETE CASCADE
    );
END
GO

-- -----------------------------------------------------------------------------
-- 5. Clubs
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Clubs')
BEGIN
    CREATE TABLE Clubs (
        ClubID      NVARCHAR(50)   NOT NULL,
        Name        NVARCHAR(150)  NOT NULL,
        Category    NVARCHAR(100)  NOT NULL,
        Description NVARCHAR(1000) NULL,
        Status      NVARCHAR(20)   NOT NULL DEFAULT 'approved'
                        CHECK (Status IN ('approved', 'pending', 'rejected')),
        ContactEmail NVARCHAR(254) NULL,
        ContactPhone NVARCHAR(20)  NULL,
        CreatedAt   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Clubs      PRIMARY KEY (ClubID),
        CONSTRAINT UQ_Clubs_Name UNIQUE (Name)
    );

    -- Seed default clubs
    INSERT INTO Clubs (ClubID, Name, Category, Description, Status)
    VALUES
        ('c1', 'Cultural Club',     'Cultural',  'Participate in cultural activities, performances, and university celebrations.', 'approved'),
        ('c2', 'Coding Club',       'Technical', 'Explore programming, coding challenges, and technical learning opportunities.', 'approved'),
        ('c3', 'Photography Club',  'Creative',  'Improve your photography skills and capture campus activities.',                 'approved'),
        ('c4', 'Sports Club',       'Sports',    'Take part in sports activities, competitions, and fitness events.',             'approved');
END
GO

-- -----------------------------------------------------------------------------
-- 6. Club Skills  (skills associated with a club)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'ClubSkills')
BEGIN
    CREATE TABLE ClubSkills (
        ClubID    NVARCHAR(50)  NOT NULL,
        SkillName NVARCHAR(100) NOT NULL,

        CONSTRAINT PK_ClubSkills PRIMARY KEY (ClubID, SkillName),
        CONSTRAINT FK_ClubSkills_Clubs
            FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
            ON DELETE CASCADE
    );

    -- Seed club skills
    INSERT INTO ClubSkills (ClubID, SkillName) VALUES
        ('c1', 'Dance'), ('c1', 'Singing'), ('c1', 'Music'),
        ('c2', 'Coding'), ('c2', 'Robotics'),
        ('c3', 'Photography'), ('c3', 'Graphic Design'),
        ('c4', 'Sports'), ('c4', 'Teamwork');
END
GO

-- -----------------------------------------------------------------------------
-- 7. Club Applications  (pending / rejected club registration requests)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'ClubApplications')
BEGIN
    CREATE TABLE ClubApplications (
        ApplicationID NVARCHAR(50)   NOT NULL,
        ClubName      NVARCHAR(150)  NOT NULL,
        Category      NVARCHAR(100)  NOT NULL,
        Description   NVARCHAR(1000) NULL,
        ContactEmail  NVARCHAR(254)  NULL,
        ContactPhone  NVARCHAR(20)   NULL,
        AdminName     NVARCHAR(150)  NOT NULL,
        AdminEmail    NVARCHAR(254)  NOT NULL,
        Username      NVARCHAR(100)  NOT NULL,
        PasswordHash  NVARCHAR(512)  NOT NULL,
        Status        NVARCHAR(20)   NOT NULL DEFAULT 'pending'
                          CHECK (Status IN ('pending', 'approved', 'rejected')),
        -- Once approved, linked ClubID is set here
        ClubID        NVARCHAR(50)   NULL,
        SubmittedAt   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_ClubApplications          PRIMARY KEY (ApplicationID),
        CONSTRAINT UQ_ClubApplications_Username UNIQUE (Username),
        CONSTRAINT UQ_ClubApplications_Email    UNIQUE (AdminEmail),
        CONSTRAINT FK_ClubApplications_Clubs
            FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
    );
END
GO

-- -----------------------------------------------------------------------------
-- 8. Club Application Skills
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'ClubApplicationSkills')
BEGIN
    CREATE TABLE ClubApplicationSkills (
        ApplicationID NVARCHAR(50)  NOT NULL,
        SkillName     NVARCHAR(100) NOT NULL,

        CONSTRAINT PK_ClubApplicationSkills PRIMARY KEY (ApplicationID, SkillName),
        CONSTRAINT FK_ClubApplicationSkills_Applications
            FOREIGN KEY (ApplicationID) REFERENCES ClubApplications(ApplicationID)
            ON DELETE CASCADE
    );
END
GO

-- -----------------------------------------------------------------------------
-- 9. Student Club Memberships
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'StudentClubs')
BEGIN
    CREATE TABLE StudentClubs (
        StudentID NVARCHAR(50) NOT NULL,
        ClubID    NVARCHAR(50) NOT NULL,
        JoinedAt  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_StudentClubs PRIMARY KEY (StudentID, ClubID),
        CONSTRAINT FK_StudentClubs_Students
            FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
            ON DELETE CASCADE,
        CONSTRAINT FK_StudentClubs_Clubs
            FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
            ON DELETE CASCADE
    );
END
GO

-- -----------------------------------------------------------------------------
-- 10. Events
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Events')
BEGIN
    CREATE TABLE Events (
        EventID     NVARCHAR(50)   NOT NULL,
        Title       NVARCHAR(200)  NOT NULL,
        Description NVARCHAR(2000) NULL,
        ClubID      NVARCHAR(50)   NOT NULL,
        EventDate   DATE           NULL,
        CreatedAt   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Events    PRIMARY KEY (EventID),
        CONSTRAINT FK_Events_Clubs
            FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
            ON DELETE CASCADE
    );

    -- Seed default events
    INSERT INTO Events (EventID, Title, Description, ClubID, EventDate)
    VALUES
        ('e1', 'Annual Dance Competition',
         'Showcase your dance skills and participate in a university competition.',
         'c1', '2026-11-12'),
        ('e2', 'Coding Workshop',
         'Learn programming concepts and improve your problem-solving skills.',
         'c2', '2026-11-18');
END
GO

-- -----------------------------------------------------------------------------
-- 11. Event Skills
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'EventSkills')
BEGIN
    CREATE TABLE EventSkills (
        EventID   NVARCHAR(50)  NOT NULL,
        SkillName NVARCHAR(100) NOT NULL,

        CONSTRAINT PK_EventSkills PRIMARY KEY (EventID, SkillName),
        CONSTRAINT FK_EventSkills_Events
            FOREIGN KEY (EventID) REFERENCES Events(EventID)
            ON DELETE CASCADE
    );

    INSERT INTO EventSkills (EventID, SkillName) VALUES
        ('e1', 'Dance'),
        ('e2', 'Coding');
END
GO

-- -----------------------------------------------------------------------------
-- 12. Event Registrations  (student registers for an event)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'EventRegistrations')
BEGIN
    CREATE TABLE EventRegistrations (
        StudentID    NVARCHAR(50) NOT NULL,
        EventID      NVARCHAR(50) NOT NULL,
        RegisteredAt DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_EventRegistrations PRIMARY KEY (StudentID, EventID),
        CONSTRAINT FK_EventRegistrations_Students
            FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
            ON DELETE CASCADE,
        CONSTRAINT FK_EventRegistrations_Events
            FOREIGN KEY (EventID) REFERENCES Events(EventID)
            ON DELETE CASCADE
    );
END
GO

-- -----------------------------------------------------------------------------
-- 13. Notices
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Notices')
BEGIN
    CREATE TABLE Notices (
        NoticeID  NVARCHAR(50)   NOT NULL,
        Title     NVARCHAR(200)  NOT NULL,
        Message   NVARCHAR(4000) NOT NULL,
        -- 'all' means all students; otherwise a skill name e.g. 'Coding'
        Target    NVARCHAR(100)  NOT NULL DEFAULT 'all',
        -- NULL means notice posted by university admin; otherwise by a club
        ClubID    NVARCHAR(50)   NULL,
        CreatedAt DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Notices PRIMARY KEY (NoticeID),
        CONSTRAINT FK_Notices_Clubs
            FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
            ON DELETE SET NULL
    );

    -- Seed default notices
    INSERT INTO Notices (NoticeID, Title, Message, Target, ClubID)
    VALUES
        ('n1', 'Dance Competition Registrations Open',
         'Registrations are open for the Annual Dance Competition.',
         'Dance', 'c1'),
        ('n2', 'Welcome to Opportunity-X',
         'Explore clubs, discover events, and keep your student profile updated.',
         'all', NULL);
END
GO

-- -----------------------------------------------------------------------------
-- 14. Notice Read Receipts  (tracks which notices a student has read)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'NoticeReads')
BEGIN
    CREATE TABLE NoticeReads (
        StudentID NVARCHAR(50) NOT NULL,
        NoticeID  NVARCHAR(50) NOT NULL,
        ReadAt    DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_NoticeReads PRIMARY KEY (StudentID, NoticeID),
        CONSTRAINT FK_NoticeReads_Students
            FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
            ON DELETE CASCADE,
        CONSTRAINT FK_NoticeReads_Notices
            FOREIGN KEY (NoticeID) REFERENCES Notices(NoticeID)
            ON DELETE CASCADE
    );
END
GO

-- =============================================================================
-- Verification: list all created tables
-- =============================================================================
SELECT
    t.name        AS TableName,
    SUM(p.rows)   AS TotalRows
FROM sys.tables   t
JOIN sys.indexes  i ON t.object_id = i.object_id AND i.index_id <= 1
JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
GROUP BY t.name
ORDER BY t.name;
GO
