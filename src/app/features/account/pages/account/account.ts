import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AccountUpdate } from '@features/account/components/account-update/account-update';

@Component({
  selector: 'app-account-page',
  templateUrl: './account.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountUpdate]
})
export class Account {}
