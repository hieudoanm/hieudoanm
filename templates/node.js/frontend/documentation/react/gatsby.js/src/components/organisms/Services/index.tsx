import React from 'react';
import { Heading } from '../../atoms/Heading';
import { Service } from '../../molecules/Service';

export type ServiceType = {
  id: string;
  image: string;
  title: string;
  description: string;
};

export type ServicesProps = {
  title: string;
  description: string;
  services: ServiceType[];
};

export const Services: React.FC<ServicesProps> = ({
  title: sectionTitle = '',
  description: sectionDescription = '',
  services = [],
}: ServicesProps) => {
  return (
    <section id="services" className="bg-[#FFF5ED]/50 py-8 md:py-16">
      <div className="container mx-auto">
        <Heading title={sectionTitle} description={sectionDescription} />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
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
