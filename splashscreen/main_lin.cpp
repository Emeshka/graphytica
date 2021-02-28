#include "splash.h"

#include <unistd.h>
#include <sys/stat.h>
#include <stdio.h>

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
    Fl_Double_Window *wnd = make_window();
    wnd->show(argc, argv);
    int n = 0; // Fl::screen_num(wnd->x(), wnd->y(), wnd->w(), wnd->h());
    int x, y, w, h;
    Fl::screen_xywh(x, y, w, h, n);
    wnd->resize(x + w / 2 - wnd->w() / 2,
        y + h / 2 - wnd->h() / 2,
        wnd->w(),
        wnd->h()); // center
        
    
        
    Fl::add_timeout(0.01, fadein_timeout, wnd);
    // Fl::add_timeout(5.0, splash_timeout, wnd);

    char path[256];
    sprintf(path, "/proc/self/exe");
    // printf("path: %s\n", path);

    char fname[1024];
    ssize_t sz = readlink(path, fname, 1023);
    fname[sz] = 0;
    // printf("fname: %s\n", fname);

    char *end = strrchr(fname, '/');
    *end = 0;
    char *pwd = strdup(fname);
    strcat(fname, "/splash_target");
    // printf("target: %s\n", fname);

    int pid = fork();
    if (pid == -1) {
        perror("Error while executing fork()");
        return -1;
    }

    if (pid == 0) {
        char **new_argv = (char**) malloc(sizeof(char*) * (argc + 1));
        new_argv[0] = fname;
        new_argv[argc] = 0;
        for (int i = 1; i < argc; i++) new_argv[i] = argv[i];
        if (execve(fname, new_argv, NULL) == -1) {
            perror("Error on execve()");
            return -1;
        }
    }
        
    return Fl::run();
}
