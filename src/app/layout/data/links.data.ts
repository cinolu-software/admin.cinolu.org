import {
  UserCheck,
  Calendar1,
  BookOpen,
  Layers,
  Folders,
  LayoutDashboard,
  UserCog,
  User,
  UserRoundCog
} from 'lucide-angular';
import { ILink } from '../types/link.type';

export const LINKS: ILink[] = [
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
  },
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
        path: '/mentor-profiles'
      },
      {
        name: 'Les expertises',
        path: '/expertises'
      }
    ]
  },
  {
    name: 'Les startups',
    path: '/ventures',
    icon: UserRoundCog
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
];
