import avatar1 from '../../assets/images/team/member1.png';
import avatar2 from '../../assets/images/team/member2.png';
import avatar3 from '../../assets/images/team/member3.png';

export const team = {
  title: 'Meet our superheros',
  description:
    'Our team of software engineers, and business analysts with expertise in mobile, web, cloud technologies to create custom solutions that cater to your specific business needs.',
  members: [
    {
      id: 1,
      avatar: avatar1.src,
      name: 'Hieu Doan',
      role: 'Full-stack Engineer',
      socialLinks: [],
    },
    {
      id: 2,
      avatar: avatar2.src,
      name: 'Phuong Tran',
      role: 'Business Analysts',
      socialLinks: [],
    },
    {
      id: 3,
      avatar: avatar3.src,
      name: 'Duy Ton',
      role: 'Data Engineer',
      socialLinks: [],
    },
  ],
};
