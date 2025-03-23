import graphql from '../../assets/images/techstack/graphql.svg';
import mui from '../../assets/images/techstack/mui.svg';
import nextjs from '../../assets/images/techstack/next.js.svg';
import postgresql from '../../assets/images/techstack/postgresql.svg';
import prisma from '../../assets/images/techstack/prisma.svg';
import supabase from '../../assets/images/techstack/supabase.png';

export const techstack = {
  title: 'Our modern web techstack',
  description:
    'Focus only on the meaning, we take care of the design. As soon as the meeting end you can export in one click into your preferred.',
  services: [
    {
      id: 'next.js',
      image: nextjs.src,
      title: 'Next.js',
      description:
        'React framework for server-rendered web apps with powerful features.',
    },
    {
      id: 'mui',
      image: mui.src,
      title: 'MUI',
      description:
        'Popular React library for Material Design components and theming.',
    },
    {
      id: 'graphql',
      image: graphql.src,
      title: 'GraphQL',
      description:
        "Flexible query language for API's; client defines data structure needed.",
    },
    {
      id: 'postgresql',
      image: postgresql.src,
      title: 'PostgreSQL',
      description:
        'Powerful, open-source, object-relational database management system.',
    },
    {
      id: 'prisma',
      image: prisma.src,
      title: 'Prisma',
      description:
        'Open-source, type-safe ORM for Node.js and TypeScript with GraphQL support.',
    },
    {
      id: 'supabase',
      image: supabase.src,
      title: 'Supabase',
      description:
        'Open-source, Firebase-like platform built on PostgreSQL and GraphQL.',
    },
  ],
};
