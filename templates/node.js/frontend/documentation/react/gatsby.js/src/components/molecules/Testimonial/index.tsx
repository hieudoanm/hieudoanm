import React from 'react';
import quoteImage from '../../../assets/images/icons/quote.png';

export type TestimonialProperties = {
  quote?: string;
  author?: string;
};

export const Testimonial: React.FC<TestimonialProperties> = ({
  quote = '',
  author = '',
}) => {
  return (
    <div className="pb-16">
      <div
        className="mx-auto w-full bg-no-repeat pl-0 md:w-2/3 md:pl-16"
        style={{ backgroundImage: `url(${quoteImage.src})` }}>
        <blockquote className="pb-8">
          <h2 className="font-b612 text-justify text-2xl leading-loose text-gray-700">
            {quote}
          </h2>
        </blockquote>
        <p className="text-lg font-medium text-gray-500">{author}</p>
      </div>
    </div>
  );
};

export default Testimonial;
