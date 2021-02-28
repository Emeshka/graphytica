#include "splash.h"
//#include <iostream> //саша
//#include <fstream> //log to file

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <Psapi.h>

void splash_timeout(void *param) {
    ((Fl_Double_Window*) param)->hide();
}

int cnt = 0;
float r_from = 0x33;
float g_from = 0x99;
float b_from = 0xff;

float r_to = 0xff;
float g_to = 0xff;
float b_to = 0xff;

void fadein_timeout(void*) {
    cnt += 5;
    if (cnt > 255) cnt = 255;
    double v = cnt / 255.0;
    
    Fl_Color color = (((int) (v * r_to + (1 - v) * r_from)) << 24) |
        (((int) (v * g_to + (1 - v) * g_from)) << 16) |
        (((int) (v * b_to + (1 - v) * b_from)) << 8);
    // printf("color: %08X\n", color);
    header_box->labelcolor(color);
    // footer_box->labelcolor(color);
    if (cnt < 255) {
        Fl::repeat_timeout(0.01, fadein_timeout);
    }
    splash_wnd->redraw();
}

int main(int argc, char *argv[]) {
    //std::ofstream myfile;
    //myfile.open ("splash_log.txt");

    Fl_Double_Window *wnd = make_window();
    wnd->show(argc, argv);
    int n = Fl::screen_num(wnd->x(), wnd->y(), wnd->w(), wnd->h());
    int x, y, w, h;
    Fl::screen_xywh(x, y, w, h, n);
    wnd->resize(x + w / 2 - wnd->w() / 2,
        y + h / 2 - wnd->h() / 2,
        wnd->w(),
        wnd->h()); // center
        
    HANDLE h_proc = GetCurrentProcess();
    /*HANDLE h_dup;//похоже это для передачи второму процессу ручки для закрытия сплеша, но мы пойдем другим путем
    
    if (!DuplicateHandle(h_proc, h_proc, h_proc,
        &h_dup, 0, TRUE, DUPLICATE_SAME_ACCESS)) {
        
        printf("Failed to duplicate handle\n");
        //myfile << "Failed to duplicate handle\n";
        //fflush(stdout);
    }*/

    DWORD my_pid = GetCurrentProcessId();
        
    
    
    TCHAR fname[MAX_PATH];
    GetModuleFileNameEx(h_proc, NULL, fname, sizeof(fname) / sizeof(TCHAR));
    printf("fname: %s\n", fname);
    //myfile << "fname: " << fname << "\n";
    //fflush(stdout);
    char *end = strrchr(fname, '\\');
    *end = 0;
    char *pwd = strdup(fname);
    strcat(fname, "\\ae-graphytica.exe");
    printf("target: %s\n", fname);
    //myfile << "target: " << fname << "\n";
    //fflush(stdout);
    
    TCHAR cmdline[MAX_PATH * 2];
    //sprintf(cmdline, "%s %d", fname, h_dup);
    sprintf(cmdline, "%s %d", fname, my_pid);
    printf("cmdline: %s\n", cmdline);
    //myfile << "cmdline: " << cmdline << "\n";
    //fflush(stdout);
    
    STARTUPINFO sinfo;
    GetStartupInfo(&sinfo);
    
    PROCESS_INFORMATION pinfo;
        
    if (!CreateProcess(fname, cmdline, NULL, NULL,
        TRUE, CREATE_SUSPENDED, NULL, pwd, &sinfo, &pinfo)) {
        
        printf("Failed to launch process. GetLastError(): %d\n", GetLastError());
        //myfile << "Failed to launch process. GetLastError(): " << GetLastError() << "\n";
        //fflush(stdout);
        // return -1;
        // exit(-1);
        wnd->hide();
    }
      
    free(pwd);
    
    ResumeThread(pinfo.hThread);
        
    Fl::add_timeout(0.01, fadein_timeout, wnd);
    // Fl::add_timeout(5.0, splash_timeout, wnd);
    
    //myfile.close();
        
    return Fl::run();
}
