import { Directive, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { filter, map, pairwise, switchMap, takeUntil } from 'rxjs/operators'

@Directive({
  selector: '[canvasDrawer]'
})
export class CanvasDrawerDirective implements OnInit, OnDestroy {

  private _subscriptions: Subscription[] = []

  mouseMove$ = fromEvent(this.canvas, 'mousemove');
  mouseDown$ = fromEvent(this.canvas, 'mousedown');
  mouseUp$ = fromEvent(this.canvas, 'mouseup');
  mouseOut$ = fromEvent(this.canvas, 'mouseout');
  keyup$ = fromEvent(document, 'keyup');

  get canvas(): HTMLCanvasElement {
    return this.canvasElement.nativeElement;
  }

  get context(): CanvasRenderingContext2D {
    return this.canvas.getContext('2d');
  }

  get rect(): DOMRect {
    return this.canvas.getBoundingClientRect()
  }

  get scale(): number {
    return window.devicePixelRatio;
  }

  constructor(private canvasElement: ElementRef<HTMLCanvasElement>) { }

  ngOnInit(): void {
    this.setCanvasSize();
    this.initDrawingHandlers();
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  initDrawingHandlers() {
    const drawSub = this.mouseDown$.pipe(
      switchMap(_ => {
        return this.mouseMove$
          .pipe(
            map((e: MouseEvent) => ({
              x: e.offsetX,
              y: e.offsetY
            })
          ),
            pairwise(),
            takeUntil(this.mouseUp$),
            takeUntil(this.mouseOut$)
          )
      })
    )
      .subscribe(([from, to]) => {
        this.context.beginPath();
        this.context.moveTo(from.x, from.y);
        this.context.lineTo(to.x, to.y);
        this.context.stroke();
      })

    this.setKeyboardHandler('Delete', () => this.context.clearRect(0, 0, this.canvas.width, this.canvas.height));

    this._subscriptions.push(drawSub);
  }

  setKeyboardHandler(keyCode: string, handler: (e: KeyboardEvent) => void) {
    const sub = this.keyup$
      .pipe(
        filter((e: KeyboardEvent) => e.code === keyCode)
      )
      .subscribe(handler)
    this._subscriptions.push(sub);
  }



  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.setCanvasSize()
  }

  setCanvasSize() {
    this.canvas.width = this.rect.width * this.scale;
    this.canvas.height = this.rect.height * this.scale;
    this.context.scale(this.scale, this.scale);
  }

}
