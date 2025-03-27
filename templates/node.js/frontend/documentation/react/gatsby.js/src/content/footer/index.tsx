import React from 'react';
import { FaFacebook, FaGithub, FaTwitter } from 'react-icons/fa6';

export const footer = {
  socialLinks: [
    {
      id: 'facebook',
      link: 'https://facebook.com',
      icon: <FaFacebook fontSize="medium" className="text-[#1877f2]" />,
    },
    {
      id: 'twitter',
      link: 'https://twitter.com',
      icon: <FaTwitter fontSize="medium" className="text-[#1da1f2]" />,
    },
    {
      id: 'github',
      link: 'https://github.com',
      icon: <FaGithub fontSize="medium" className="text-[#333333]" />,
    },
  ],
};
