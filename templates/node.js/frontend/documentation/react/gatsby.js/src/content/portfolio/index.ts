import project1 from '../../assets/images/portfolio/project1.png';
import project2 from '../../assets/images/portfolio/project2.png';
import project3 from '../../assets/images/portfolio/project3.png';

export const portfolio = {
  title: 'Portfolio of Our Demo Project',
  description:
    'Focus only on the meaning, we take care of the design. As soon as the meeting end you can export in one click.',
  projects: [
    {
      id: 1,
      url: '/themes/next-profile-astronout',
      image: project1.src,
      title: `How to work with prototype design with adobe xd featuring tools`,
      description: `The 2019 Innovation by Design Awards honor the designers and businesses solving the problems of today and tomorrow. It is one of the most sought-after design`,
      technologies: ['next.js'],
    },
    {
      id: 2,
      url: '#how-to',
      image: project2.src,
      title: `Anti bias receives honorable gift mention at Fast Company's most Innovation by Design Awards`,
      description: `The 2019 Innovation by Design Awards honor the designers and businesses solving the problems of today and tomorrow. It is one of the most sought-after design`,
      technologies: [],
    },
    {
      id: 3,
      url: '#how-to',
      image: project3.src,
      title: `Multiple task wireframing with team management perform better`,
      description: `The 2019 Innovation by Design Awards honor the designers and businesses solving the problems of today and tomorrow. It is one of the most sought-after design`,
      technologies: [],
    },
  ],
};
