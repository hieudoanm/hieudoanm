import React from 'react';
import { Heading } from '../../atoms/Heading';
import { Member } from '../../molecules/Member';

export const Team: React.FC<{
  title?: string;
  description?: string;
  members: {
    id: number;
    avatar: string;
    name: string;
    role: string;
    socialLinks: { name: string; link: string }[];
  }[];
}> = ({ title = '', description = '', members = [] }) => {
  return (
    <section id="team" className="py-8 md:py-16">
      <div className="container mx-auto">
        <div className="mb-16">
          <Heading title={title} description={description} />
        </div>
        <div className="grid-col-1 grid gap-8 md:grid-cols-3">
          {members?.map(({ id, avatar, name, role, socialLinks = [] }) => (
            <div key={id} className="col-span-1">
              <Member
                avatar={avatar}
                name={name}
                role={role}
                socialLinks={socialLinks}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
