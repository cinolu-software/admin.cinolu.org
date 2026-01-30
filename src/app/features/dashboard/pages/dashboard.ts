import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Stats } from '../components/stats/stats';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  imports: [FormsModule, Stats]
})
export class Dashboard {}
