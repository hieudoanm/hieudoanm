import { Link } from 'gatsby';
import React from 'react';

export const Project: React.FC<{
  image: string;
  title?: string;
  description?: string;
  url?: string;
  technologies?: string[];
}> = ({ image, title = '', description = '', url = '', technologies = [] }) => {
  return (
    <div className="transition-all duration-100 hover:border hover:p-4 hover:shadow">
      <Link to={url} target="_blank" className="block">
        <div
          className="aspect-video rounded border bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
        <h2 className="mt-4 text-lg font-bold">{title}</h2>
      </Link>
      <p className="mt-4 text-gray-500">{description}</p>
      <div className="mt-4">
        {technologies.map((technology) => (
          <div key={technology} className="badge badge-sm">
            {technology}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Project;
