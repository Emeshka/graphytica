import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DbServiceService } from '../db-service.service';

@Component({
  selector: 'app-vertices-category',
  templateUrl: './vertices-category.component.html',
  styleUrls: ['./vertices-category.component.css']
})
export class VerticesCategoryComponent implements OnInit {

  constructor(
    private conn: DbServiceService
  ) { }

  amountByClass = null;
  activeTool = '';

  @Input() selection: any;
  @Input() setTool: (toolId) => {};

  ngOnInit(): void {
    this.conn.db.query('SELECT @class, count(*) FROM V GROUP BY @class').then(result => {
      console.log('SELECT @class, count(*) FROM V GROUP BY @class:', result);
      let countByClass = {};
      let sum = 0;
      for (let i = 0; i<result.length; i++) {
        if (result[i]['class'] == 'V') countByClass['Без класса'] = result[i].count;
        else countByClass[result[i]['class']] = result[i].count;
        sum += result[i].count;
      }
      countByClass['Всего'] = sum;
      console.log('SELECT @class, count(*) FROM V GROUP BY @class:', countByClass);
      this.amountByClass = countByClass;
    })
  }
}
