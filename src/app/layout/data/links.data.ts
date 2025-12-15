import { UserCheck, Calendar1, BookOpen, Layers, Folders, LayoutDashboard, Settings, UserCog } from 'lucide-angular';
import { ILink } from '../types/link.type';

export const LINKS: ILink[] = [
  {
    name: 'Dashboard',
    path: '/',
    exactUrl: true,
    icon: LayoutDashboard
  },
  {
    name: 'Mon compte',
    path: '/account',
    icon: UserCog,
    exactUrl: true
  },
  {
    name: 'Les programmes',
    path: '/list-programs',
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
    path: '/list-programs',
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
    path: '/list-programs',
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
