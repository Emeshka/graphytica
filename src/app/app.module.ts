import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgxElectronModule } from 'ngx-electron';
import { AppOpenFileButtonBigComponent } from './app-open-file-button-big/app-open-file-button-big.component';
import { TileButtonComponent } from './tile-button/tile-button.component';

import { LastDirectoryService } from './last-directory.service';
import { FilepathSelectorComponent } from './filepath-selector/filepath-selector.component';
import { MainViewComponent } from './main-view/main-view.component';
import { LoadingComponent } from './loading/loading.component';
import { VerticesCategoryComponent } from './vertices-category/vertices-category.component';
import { IconButtonComponent } from './icon-button/icon-button.component';
import { PrettyButtonComponent } from './pretty-button/pretty-button.component'

@NgModule({
  declarations: [
    AppComponent,
    AppOpenFileButtonBigComponent,
    TileButtonComponent,
    FilepathSelectorComponent,
    MainViewComponent,
    LoadingComponent,
    VerticesCategoryComponent,
    IconButtonComponent,
    PrettyButtonComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxElectronModule,
    FormsModule
  ],
  providers: [LastDirectoryService],
  bootstrap: [AppComponent]
})
export class AppModule { }
