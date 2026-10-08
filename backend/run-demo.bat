@echo off
REM Starts the backend in demo mode (in-memory H2, sample data auto-seeded). No MySQL required.
where mvn >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.1\plugins\maven\lib\maven3\bin\mvn.cmd" (
        set "PATH=C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.1\plugins\maven\lib\maven3\bin;%PATH%"
    )
)
mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
