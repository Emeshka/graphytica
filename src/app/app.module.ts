import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxElectronModule } from 'ngx-electron';
import { AutosizeModule } from 'ngx-autosize';
//import { AngularHighlightJsModule } from 'angular2-highlight-js';
import { registerLanguage } from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
registerLanguage('javascript', javascript);

import { AppOpenFileButtonBigComponent } from './app-open-file-button-big/app-open-file-button-big.component';
import { TileButtonComponent } from './tile-button/tile-button.component';
import { LastDirectoryService } from './last-directory.service';
import { FilepathSelectorComponent } from './filepath-selector/filepath-selector.component';
import { MainViewComponent } from './main-view/main-view.component';
import { LoadingComponent } from './loading/loading.component';
import { VerticesCategoryComponent } from './vertices-category/vertices-category.component';
import { IconButtonComponent } from './icon-button/icon-button.component';
import { PrettyButtonComponent } from './pretty-button/pretty-button.component';
import { ClassesCategoryComponent } from './classes-category/classes-category.component';
import { TreeBranchComponent } from './tree-branch/tree-branch.component';
import { SelectionCategoryComponent } from './selection-category/selection-category.component';
import { TinyButtonComponent } from './tiny-button/tiny-button.component';
import { ViewCategoryComponent } from './view-category/view-category.component';
import { SwitchTrueFalseComponent } from './switch-true-false/switch-true-false.component';
import { AutosizedTextareaComponent } from './autosized-textarea/autosized-textarea.component';
import { DatePickerComponent } from './date-picker/date-picker.component';

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
    PrettyButtonComponent,
    ClassesCategoryComponent,
    TreeBranchComponent,
    SelectionCategoryComponent,
    TinyButtonComponent,
    ViewCategoryComponent,
    SwitchTrueFalseComponent,
    AutosizedTextareaComponent,
    DatePickerComponent
  ],
  imports: [
    //AngularHighlightJsModule,//...spread operator?
    BrowserModule,
    AppRoutingModule,
    NgxElectronModule,
    AutosizeModule,
    FormsModule
  ],
  providers: [LastDirectoryService],
  bootstrap: [AppComponent]
})
export class AppModule { }
