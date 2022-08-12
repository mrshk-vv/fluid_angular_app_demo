import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DiagramAllModule, OverviewAllModule, SymbolPaletteAllModule } from '@syncfusion/ej2-angular-diagrams';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
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
