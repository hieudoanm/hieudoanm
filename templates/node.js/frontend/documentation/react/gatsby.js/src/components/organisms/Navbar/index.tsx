import React, { useState } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import Sticky from 'react-stickynode';
import { content } from '../../../content';
import { FaBars, FaX } from 'react-icons/fa6';

export const Navbar: React.FC<{
  title?: string;
  items?: { id: string; link: string; text: string }[];
}> = ({ title = '', items = [] }) => {
  const [open, setOpen] = useState(false);
  console.log(open);

  return (
    <>
      <Sticky top={0} enabled={true} innerZ={100} activeClass="is-sticky">
        <nav className="bg-white">
          <div className="container mx-auto">
            <div className="py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <h1 className="text-2xl">
                    <ScrollLink
                      to="home"
                      spy={true}
                      offset={-70}
                      smooth={true}
                      duration={500}
                      className="cursor-pointer">
                      {title}
                    </ScrollLink>
                  </h1>
                  <div className="hidden items-center gap-8 md:flex">
                    {items.map(({ id, link, text }) => {
                      return (
                        <div key={id}>
                          <ScrollLink
                            to={link}
                            spy={true}
                            offset={-70}
                            smooth={true}
                            duration={500}
                            activeClass="active"
                            className="nav-scroll-link cursor-pointer">
                            {text}
                          </ScrollLink>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <ScrollLink
                    to="contact"
                    spy={true}
                    offset={-70}
                    smooth={true}
                    duration={500}
                    className="cursor-pointer font-bold text-emerald-500">
                    Get Started
                  </ScrollLink>
                  <div className="block md:hidden">
                    <FaBars onClick={() => setOpen(true)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </Sticky>
      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="relative h-screen w-[80vw]">
          <div className="absolute flex w-full items-center justify-between px-8 py-8">
            <h1 className="text-2xl">{content.seo.shortName}</h1>
            <FaX onClick={() => setOpen(false)} />
          </div>
          <div className="flex h-full w-full items-center">
            <div>
              {items.map(({ id, link, text }) => {
                return (
                  <div key={id} className="w-full px-8 py-2">
                    <ScrollLink
                      to={link}
                      spy={true}
                      offset={-70}
                      smooth={true}
                      duration={500}
                      activeClass="active"
                      className="nav-scroll-link cursor-pointer">
                      {text}
                    </ScrollLink>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
