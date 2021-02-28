#if 0
g++ splash_target.cpp -o splash_target
exit 0
#endif

#include <stdio.h>
#include <unistd.h>
#include <sys/signal.h>

int main(int argc, char *argv[]) {
    printf("splash_target here\n");
    int ppid = getppid();
    printf("Sleeping...\n");
    sleep(5);
    printf("Killing parent pid: %d\n", ppid);
    kill(ppid, 9);
    return 0;
}

