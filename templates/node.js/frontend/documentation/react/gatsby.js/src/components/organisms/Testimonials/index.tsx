import React from 'react';
import { Testimonial } from '../../molecules/Testimonial';

export const Testimonials: React.FC<{
  testimonials: { id: number; logo: string; quote: string; author: string }[];
}> = ({ testimonials = [] }) => {
  return (
    <section className="testimonials-container bg-[#FFF5ED]/50 py-8 md:py-16">
      <div className="container mx-auto">
        <div className="tabs">
          {testimonials?.map(({ id, quote, author }) => (
            <div className="tab" key={id}>
              <Testimonial quote={quote} author={author} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
