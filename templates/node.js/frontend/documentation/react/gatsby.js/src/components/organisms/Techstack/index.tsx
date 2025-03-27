import React from 'react';
import { Heading } from '../../atoms/Heading';
import { Service } from '../../molecules/Service';
import { ServiceType } from '../Services';

export const Techstack: React.FC<{
  title: string;
  description: string;
  services: ServiceType[];
}> = ({
  title: sectionTitle = '',
  description: sectionDescription = '',
  services = [],
}) => {
  return (
    <section className="bg-[#F9FAFC] py-8 md:py-16">
      <div className="container mx-auto">
        <Heading title={sectionTitle} description={sectionDescription} />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {services.map(({ id, image, title, description }: ServiceType) => {
            return (
              <Service
                key={id}
                image={image}
                title={title}
                description={description}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Techstack;
