call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars32.bat"
cl /O2 /MD /c splash.cxx /ID:\1_documents\graphytica-angular\angular-electron\splashscreen\fltk-1.3.4-1 -ID:\1_documents\graphytica-angular\angular-electron\splashscreen\fltk-1.3.4-1\build_win32
cl /O2 /MD /c main_win.cpp /ID:\1_documents\graphytica-angular\angular-electron\splashscreen\fltk-1.3.4-1 -ID:\1_documents\graphytica-angular\angular-electron\splashscreen\fltk-1.3.4-1\build_win32
cl /O2 splash.obj main_win.obj D:\1_documents\graphytica-angular\angular-electron\splashscreen\fltk-1.3.4-1\build_win32\lib\Release\fltk.lib gdi32.lib user32.lib ole32.lib advapi32.lib shell32.lib /MD /link /SUBSYSTEM:WINDOWS

