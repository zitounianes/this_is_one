@echo off
echo تحديث المشروع على GitHub...
echo.

cd /d "c:\Users\acerPc\OneDrive\Bureau\qssxsssqxbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

echo اضافة جميع الملفات...
git add -A

echo.
echo انشاء commit...
git commit -m "Update project - %date% %time%"

echo.
echo رفع التحديثات على GitHub...
git push origin main

echo.
echo تم بنجاح!
pause
