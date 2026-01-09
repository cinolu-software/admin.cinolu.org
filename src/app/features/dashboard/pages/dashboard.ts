import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminStats } from '../components/admin-stats/admin-stats';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  imports: [FormsModule, AdminStats]
})
export class Dashboard {}
