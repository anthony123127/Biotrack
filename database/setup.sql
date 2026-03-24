/*
 * BioTrack Database Setup Script
 * Automated Facial Recognition Attendance System
 * Lyceum of San Pedro
 *
 * Run this script in SQL Server Management Studio (SSMS) to create
 * the database and tables required by BioTrack.
 */

-- Create the database (skip if it already exists)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BioTrackDB')
BEGIN
    CREATE DATABASE BioTrackDB;
END
GO

USE BioTrackDB;
GO

-- =====================================================================
-- Students Table
-- Stores registered student information and face embeddings.
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Students' AND xtype = 'U')
BEGIN
    CREATE TABLE Students (
        StudentID       NVARCHAR(50)   PRIMARY KEY,
        FullName        NVARCHAR(255)  NOT NULL,
        Course          NVARCHAR(100)  NOT NULL,
        Year            INT            NOT NULL,
        FaceEmbedding   VARBINARY(MAX) NULL,       -- Serialized 512-d FaceNet embedding
        PhotoPath       NVARCHAR(500)  NULL         -- Relative path to stored face image
    );
END
GO

-- =====================================================================
-- Attendance Table
-- Records daily attendance with timestamps and status.
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Attendance' AND xtype = 'U')
BEGIN
    CREATE TABLE Attendance (
        AttendanceID    INT IDENTITY(1,1) PRIMARY KEY,
        StudentID       NVARCHAR(50)   NOT NULL,
        Date            DATE           NOT NULL,
        TimeIn          TIME           NOT NULL,
        Status          NVARCHAR(20)   NOT NULL DEFAULT 'Present',
        CONSTRAINT FK_Attendance_Student
            FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
            ON DELETE CASCADE
    );

    -- Index for fast daily lookups
    CREATE INDEX IX_Attendance_Date ON Attendance(Date);

    -- Prevent duplicate attendance for the same student on the same day
    CREATE UNIQUE INDEX IX_Attendance_Student_Date
        ON Attendance(StudentID, Date);
END
GO

-- =====================================================================
-- EntryExitLogs Table
-- Tracks gate entry and exit events for campus monitoring.
-- =====================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'EntryExitLogs' AND xtype = 'U')
BEGIN
    CREATE TABLE EntryExitLogs (
        LogID               INT IDENTITY(1,1) PRIMARY KEY,
        StudentID           NVARCHAR(50)   NOT NULL,
        Date                DATE           NOT NULL,
        TimeIn              TIME           NULL,
        TimeOut             TIME           NULL,
        VerificationMethod  NVARCHAR(50)   NOT NULL DEFAULT 'FacialRecognition',
        CONSTRAINT FK_EntryExitLogs_Student
            FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
            ON DELETE CASCADE
    );

    CREATE INDEX IX_EntryExitLogs_Date ON EntryExitLogs(Date);
    CREATE INDEX IX_EntryExitLogs_Student ON EntryExitLogs(StudentID);
END
GO

PRINT 'BioTrack database setup completed successfully.';
GO
