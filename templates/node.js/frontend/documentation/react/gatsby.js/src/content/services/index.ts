import service4 from '../../assets/images/services/service4.png';
import nodejs from '../../assets/images/techstack/node.js.svg';
import typescript from '../../assets/images/techstack/typescript.svg';

export const services = {
  title: 'Grow your startup with our Service',
  description:
    'Build an incredible workplace and grow your business with Gusto’s all-in-one platform with amazing contents.',
  services: [
    {
      id: 'ultimate-development',
      image: service4.src,
      title: 'Ultimate development',
      description:
        'Get your info tests delivered at home collect a sample from the your progress tests.',
    },
    {
      id: 'typescript',
      image: typescript.src,
      title: 'TypeScript',
      description:
        'JavaScript superset with optional static typing for improved code quality.',
    },
    {
      id: 'nodejs',
      image: nodejs.src,
      title: 'Node.js',
      description:
        'JavaScript runtime for building server-side and network apps.',
    },
  ],
};
