import { Component } from '@angular/core';
import { AccountUpdate } from '@features/account/components/account-update/account-update';

@Component({
  selector: 'app-account-page',
  templateUrl: './account.html',
  imports: [AccountUpdate]
})
export class Account {}
