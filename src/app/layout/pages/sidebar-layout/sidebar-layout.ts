import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { BackButton } from '@shared/ui/back-button/back-button';
import { Topbar } from '../../components/topbar/topbar';

@Component({
  selector: 'app-sidebar-layout',
  templateUrl: './sidebar-layout.html',
  imports: [RouterOutlet, Sidebar, BackButton, Topbar],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarLayout {}
