import React from 'react';
import { content } from '../../../content';
import { Contact } from '../../organisms/Contact';
import { Footer } from '../../organisms/Footer';
import { Hero } from '../../organisms/Hero';
import { Navbar } from '../../organisms/Navbar';
import { Portfolio } from '../../organisms/Portfolio';
import { SEO } from '../../organisms/SEO';
import { Services } from '../../organisms/Services';
import { Team } from '../../organisms/Team';
import { Techstack } from '../../organisms/Techstack';
import { Testimonials } from '../../organisms/Testimonials';
import { Why } from '../../organisms/Why';

export const HomeTemplate: React.FC = () => {
  return (
    <>
      <SEO />
      <Navbar title={content.seo.shortName} items={content.navbar.items} />
      <main>
        <Hero
          title={content.hero.title}
          description={content.hero.description}
        />
        <Services
          title={content.services.title}
          description={content.services.description}
          services={content.services.services}
        />
        <Testimonials testimonials={content.testimonials} />
        <Team
          title={content.team.title}
          description={content.team.description}
          members={content.team.members}
        />
        <Techstack
          title={content.techstack.title}
          description={content.techstack.description}
          services={content.techstack.services}
        />
        <Why reasons={content.why.reasons} />
        <Portfolio
          title={content.portfolio.title}
          description={content.portfolio.description}
          projects={content.portfolio.projects}
        />
        <Contact
          title={content.contact.title}
          description={content.contact.description}
        />
      </main>
      <Footer
        title={content.seo.shortName}
        socialLinks={content.footer.socialLinks}
      />
    </>
  );
};
