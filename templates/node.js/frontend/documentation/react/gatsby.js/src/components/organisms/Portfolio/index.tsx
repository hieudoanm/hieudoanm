import React, { FC } from 'react';
import { Heading } from '../../atoms/Heading';
import { Project } from '../../molecules/Project';

export const Portfolio: FC<{
  title: string;
  description: string;
  projects: {
    id: number;
    url: string;
    image: string;
    title: string;
    description: string;
    technologies: string[];
  }[];
}> = ({
  title: sectionTitle = '',
  description: sectionDescription = '',
  projects = [],
}) => {
  return (
    <section id="projects" className="py-8 md:py-16">
      <div className="container mx-auto">
        <Heading title={sectionTitle} description={sectionDescription} />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {projects.map(
            ({ id, url, image, title, description, technologies }) => (
              <Project
                key={id}
                url={url}
                image={image}
                title={title}
                description={description}
                technologies={technologies}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
};
