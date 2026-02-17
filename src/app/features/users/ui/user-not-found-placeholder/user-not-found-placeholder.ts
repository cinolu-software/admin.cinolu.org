import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-user-not-found-placeholder',
  templateUrl: './user-not-found-placeholder.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserNotFoundPlaceholder {
  title = input<string>('Utilisateur introuvable');
  description = input<string>(
    "Aucun utilisateur ne correspond a cette requete. Verifiez l'adresse email dans l'URL puis rechargez la page."
  );
}
