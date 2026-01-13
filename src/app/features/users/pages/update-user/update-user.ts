import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsersStore } from '../../store/users.store';
import { UserEditForm } from '../../components/user-edit-form/user-edit-form';

@Component({
  selector: 'app-user-update',
  templateUrl: './update-user.html',
  providers: [UsersStore],
  imports: [UserEditForm]
})
export class UpdateUser implements OnInit {
  #route = inject(ActivatedRoute);
  #email = this.#route.snapshot.params['email'];
  usersStore = inject(UsersStore);

  ngOnInit(): void {
    this.usersStore.loadOne(this.#email);
  }
}
