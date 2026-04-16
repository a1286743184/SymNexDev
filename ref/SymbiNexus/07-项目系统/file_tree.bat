@echo off
title File Tree Export

REM Get current batch file directory
set current_dir=%~dp0

REM Generate output filename with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

set output_file=%current_dir%FileTree_%timestamp%.txt

echo Generating file tree...
echo Directory: %current_dir%
echo Output file: %output_file%

REM Create file tree and save to txt file
echo ===================================== > "%output_file%"
echo    File Tree Generated on %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec% >> "%output_file%"
echo ===================================== >> "%output_file%"
echo. >> "%output_file%"
echo Directory: %current_dir% >> "%output_file%"
echo. >> "%output_file%"
tree "%current_dir%" /f /a >> "%output_file%"
echo. >> "%output_file%"
echo ===================================== >> "%output_file%"
echo File tree exported successfully! >> "%output_file%"

echo.
echo File tree has been saved to: %output_file%
echo.
pause