import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'tiny-button',
  templateUrl: './tiny-button.component.html',
  styleUrls: ['./tiny-button.component.css']
})
export class TinyButtonComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }


  @Input() title: string;
  @Input() iconSrc: string;
  @Input() callback: () => {};
}
