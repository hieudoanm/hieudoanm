import React from 'react';

export const Service: React.FC<{
  image: string;
  title?: string;
  description?: string;
}> = ({ image, title = '', description = '' }) => {
  return (
    <div className="grid grid-cols-1 gap-x-0 gap-y-8 sm:grid-cols-3 md:gap-8">
      <div className="col-span-1">
        <img src={image} alt={title} className="mx-auto h-16 w-16" />
      </div>
      <div className="col-span-2">
        <div className="text-center sm:text-left">
          <div className="mb-4">
            <h3 className="text-md font-bold sm:text-lg">{title}</h3>
          </div>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Service;
