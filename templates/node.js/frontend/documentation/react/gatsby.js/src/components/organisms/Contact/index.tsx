import React from 'react';
import background from '../../../assets/images/contact/background.png';
import { Button } from '../../atoms/Button';
import { Checkbox } from '../../atoms/Checkbox';
import { Heading } from '../../atoms/Heading';
import { Input } from '../../atoms/Input';

export const Contact: React.FC<{ title?: string; description?: string }> = ({
  title = '',
  description = '',
}) => {
  return (
    <section
      id="contact"
      className="bg-[#F8F0EA] bg-contain bg-bottom bg-no-repeat py-0 md:py-16"
      style={{ backgroundImage: `url(${background.src})` }}>
      <div className="container mx-auto">
        <div className="rounded-none bg-white md:rounded-2xl">
          <div className="px-4 py-8 md:px-8 md:py-16">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="col-span-1">
                <Heading
                  title={title}
                  description={description}
                  align="text-center md:text-left"
                  bottom={false}
                  enhanced
                />
              </div>
              <div className="col-span-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="col-span-1 md:col-span-2">
                    <Input
                      id="email"
                      name="email"
                      placeholder="Enter Email Address"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button className="w-full">Send</Button>
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <Checkbox
                      id="promote"
                      label="Don't provide any promotional message."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
