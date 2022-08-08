import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DiagramAllModule, OverviewAllModule, SymbolPaletteAllModule } from '@syncfusion/ej2-angular-diagrams';
import { CanvasDrawerDirective } from 'src/directive/canvas-drawer.directive';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasDrawerDirective
  ],
  imports: [
    BrowserModule,
    CommonModule,
    DiagramAllModule,
    SymbolPaletteAllModule,
    OverviewAllModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
