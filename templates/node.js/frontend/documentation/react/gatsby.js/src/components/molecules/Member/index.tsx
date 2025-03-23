import { Link } from 'gatsby';
import React, { ReactNode } from 'react';
import { FaFacebook, FaGithub, FaTwitter } from 'react-icons/fa6';

const icons: Record<string, ReactNode> = {
  facebook: <FaFacebook fontSize="medium" className="text-[#1877f2]" />,
  twitter: <FaTwitter fontSize="medium" className="text-[#1da1f2]" />,
  github: <FaGithub fontSize="medium" className="text-[#333333]" />,
};

export const Member: React.FC<{
  avatar: string;
  name?: string;
  role?: string;
  socialLinks?: { name: string; link: string }[];
}> = ({ avatar, name = '', role = '', socialLinks = [] }) => {
  return (
    <div>
      <img src={avatar} alt={name} className="rounded-xl border" />
      <div className="text-center">
        <h2 className="mt-4 text-lg font-medium md:text-2xl">{name}</h2>
        <p className="mt-2 text-sm text-gray-500 md:text-lg">{role}</p>
      </div>
      {socialLinks.length > 0 ? (
        <div className="mt-2 flex gap-2">
          {socialLinks.map((socialLink: { name: string; link: string }) => {
            return (
              <Link key={socialLink.name} to={socialLink.link}>
                {icons[socialLink.name]}
              </Link>
            );
          })}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Member;
