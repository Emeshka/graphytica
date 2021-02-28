// generated by Fast Light User Interface Designer (fluid) version 1.0302

#include "splash.h"

Fl_Double_Window *splash_wnd=(Fl_Double_Window *)0;

Fl_Box *header_box=(Fl_Box *)0;

Fl_Box *footer_box=(Fl_Box *)0;

Fl_Double_Window* make_window() {
  { splash_wnd = new Fl_Double_Window(480, 280);
    { header_box = new Fl_Box(0, 0, 480, 280, "G");
      header_box->box(FL_FLAT_BOX);
      header_box->color((Fl_Color)-5623040);
      header_box->labelsize(88);
      header_box->labelcolor(FL_BACKGROUND2_COLOR);
    } // Fl_Box* header_box
    { footer_box = new Fl_Box(0, 250, 480, 25, "Splashscreen by Stanislaw Adaszewski (c), 2017");
      footer_box->labelcolor(FL_BACKGROUND2_COLOR);
      footer_box->align(Fl_Align(FL_ALIGN_BOTTOM|FL_ALIGN_INSIDE));
      Fl_Group::current()->resizable(footer_box);
    } // Fl_Box* footer_box
    splash_wnd->clear_border();
    splash_wnd->end();
  } // Fl_Double_Window* splash_wnd
  return splash_wnd;
}
