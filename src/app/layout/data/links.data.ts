import {
  UserCheck,
  Calendar1,
  BookOpen,
  Layers,
  Folders,
  LayoutDashboard,
  UserCog,
  User,
  UserRoundCog,
  Briefcase
} from 'lucide-angular';
import { ILinkGroup } from '../types/link.type';

export const LINK_GROUPS: ILinkGroup[] = [
  {
    title: 'Gestion',
    links: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        exactUrl: true,
        icon: LayoutDashboard
      },
      {
        name: 'Mon compte',
        path: '/account',
        icon: UserCog
      }
    ]
  },
  {
    title: 'Contenu',
    links: [
      {
        name: 'Les programmes',
        icon: Layers,
        children: [
          {
            name: 'Tous les programmes',
            path: '/programs'
          },
          {
            name: 'Les catégories',
            path: '/program-categories'
          }
        ]
      },
      {
        name: 'Les projets',
        icon: Folders,
        children: [
          {
            name: 'Tous les projets',
            path: '/projects'
          },
          {
            name: 'Les catégories',
            path: '/project-categories'
          }
        ]
      },
      {
        name: 'Les événements',
        icon: Calendar1,
        children: [
          {
            name: 'Tous les événements',
            path: '/events'
          },
          {
            name: 'Les catégories',
            path: '/event-categories'
          }
        ]
      },
      {
        name: 'Les mentors',
        icon: User,
        children: [
          {
            name: 'Tous les mentors',
            path: '/mentors'
          },
          {
            name: 'Les expertises',
            path: '/expertises'
          }
        ]
      },
      {
        name: 'Le blog',
        path: '/blog',
        icon: BookOpen,
        children: [
          {
            name: 'Tous les articles',
            path: '/blog/articles'
          },
          {
            name: 'Les tags',
            path: '/blog/tags'
          }
        ]
      },
      {
        name: 'Les opportunités',
        path: '/opportunities',
        icon: Briefcase,
        children: [
          {
            name: 'Toutes les opportunités',
            path: '/opportunities'
          },
          {
            name: 'Les tags',
            path: '/opportunity-tags'
          }
        ]
      },
      {
        name: 'Les startups',
        path: '/ventures',
        icon: UserRoundCog
      }
    ]
  },
  {
    title: 'Administration',
    links: [
      {
        name: 'Les utilisateurs',
        path: '/users',
        icon: UserCheck,
        children: [
          {
            name: 'Les utilisateurs',
            path: '/users'
          },
          {
            name: 'Les rôles',
            path: '/roles'
          }
        ]
      }
    ]
  }
];
