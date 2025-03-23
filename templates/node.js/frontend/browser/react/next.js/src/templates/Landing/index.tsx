import { APP_NAME } from '@n26/constants/constants';
import hero from '@n26/svg/hero.svg';
import logo from '@n26/svg/logo.svg';
import services from '@n26/svg/services.svg';
import people from '@n26/images/people.jpg';
import Image from 'next/image';
import React from 'react';
import { Link as ScrollLink } from 'react-scroll';

export const Landing: React.FC = () => {
  return (
    <>
      <header className="sticky top-0 bg-white shadow">
        <div className="container mx-auto flex flex-col items-center justify-between px-8 py-4 sm:flex-row">
          <div className="flex items-center text-2xl">
            <div className="mr-3 w-12">
              <Image src={logo} alt={APP_NAME} width={48} height={48} />
            </div>
            Lander
          </div>
          <div className="mt-4 flex items-center justify-between gap-x-4 sm:mt-0">
            {[
              { id: 'features' },
              { id: 'services' },
              { id: 'stats' },
              { id: 'testimonials' },
            ].map(({ id }) => {
              return (
                <ScrollLink
                  key={id}
                  to={id}
                  spy={true}
                  smooth={true}
                  offset={0}
                  duration={500}
                  className="cursor-pointer capitalize">
                  {id}
                </ScrollLink>
              );
            })}
          </div>
          <div className="hidden md:block">
            <button
              type="button"
              className="rounded bg-teal-500 px-8 py-3 text-sm text-white hover:bg-teal-600">
              Start Free Trial
            </button>
          </div>
        </div>
      </header>
      <main className="text-gray-900">
        <section className="pt-20 md:pt-40">
          <div className="container mx-auto px-8 lg:flex">
            <div className="text-center lg:w-1/2 lg:text-left">
              <h1 className="text-4xl leading-none font-bold lg:text-5xl xl:text-6xl">
                Main title of your landing page
              </h1>
              <p className="mt-6 text-xl font-light lg:text-2xl">
                Free landing page template to promote your business startup and
                generate leads for the offered services
              </p>
              <p className="mt-8 md:mt-12">
                <button
                  type="button"
                  className="rounded bg-teal-500 px-12 py-4 text-white hover:bg-teal-600">
                  Get Started
                </button>
              </p>
              <p className="mt-4 text-gray-600">Sed fermentum felis ut cursu</p>
            </div>

            <div className="lg:w-1/2">
              <Image src={hero} alt="Hero" />
            </div>
          </div>
        </section>

        <section id="features" className="py-20 lg:pt-48 lg:pb-40">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-semibold lg:text-5xl">
              Main Features
            </h2>
            <div className="mt-12 flex flex-col sm:-mx-3 sm:flex-row">
              <div className="flex-1 px-3">
                <div className="mb-8 rounded-lg border border-solid border-gray-200 p-12 shadow">
                  <p className="text-xl font-semibold">Service One</p>
                  <p className="mt-4">
                    An enim nullam tempor gravida donec enim ipsum blandit porta
                    justo integer odio velna vitae auctor integer.
                  </p>
                </div>
              </div>
              <div className="flex-1 px-3">
                <div className="mb-8 rounded-lg border border-solid border-gray-200 p-12 shadow">
                  <p className="text-xl font-semibold">Service Two</p>
                  <p className="mt-4">
                    An enim nullam tempor gravida donec enim ipsum blandit porta
                    justo integer odio velna vitae auctor integer.
                  </p>
                </div>
              </div>
              <div className="flex-1 px-3">
                <div className="mb-8 rounded-lg border border-solid border-gray-200 p-12 shadow">
                  <p className="text-xl font-semibold">Service Three</p>
                  <p className="mt-4">
                    An enim nullam tempor gravida donec enim ipsum blandit porta
                    justo integer odio velna vitae auctor integer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="py-20">
          <div className="container mx-auto flex flex-col items-center px-16 lg:flex-row">
            <div className="lg:w-1/2">
              <div className="lg:pr-32 xl:pr-48">
                <h3 className="text-3xl leading-tight font-semibold">
                  Market Analysis
                </h3>
                <p className="mt-8 text-xl leading-relaxed font-light">
                  Our team of enthusiastic marketers will analyse and evaluate
                  how your company stacks against the closest competitors
                </p>
              </div>
            </div>
            <div className="undefined mt-10 w-full lg:mt-0 lg:w-1/2">
              <Image src={services} alt="Services" />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto flex flex-col items-center px-16 lg:flex-row">
            <div className="lg:w-1/2">
              <div className="lg:pl-32 xl:pl-48">
                <h3 className="text-3xl leading-tight font-semibold">
                  Design And Plan Your Business Growth Steps
                </h3>
                <p className="mt-8 text-xl leading-relaxed font-light">
                  Once the market analysis process is completed our staff will
                  search for opportunities that are in reach
                </p>
              </div>
            </div>
            <div className="order-last mt-10 w-full lg:order-first lg:mt-0 lg:w-1/2">
              <Image src={services} alt="Services" />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto flex flex-col items-center px-16 lg:flex-row">
            <div className="lg:w-1/2">
              <div className="lg:pr-32 xl:pr-48">
                <h3 className="text-3xl leading-tight font-semibold">
                  Search For Performance Optimization
                </h3>
                <p className="mt-8 text-xl leading-relaxed font-light">
                  With all the information in place you will be presented with
                  an action plan that your company needs to follow
                </p>
              </div>
            </div>
            <div className="undefined mt-10 w-full lg:mt-0 lg:w-1/2">
              <Image src={services} alt="Services" />
            </div>
          </div>
        </section>

        <section id="stats" className="py-20 lg:pt-32">
          <div className="container mx-auto text-center">
            <p className="tracking-wider text-gray-600 uppercase">
              Our customers get results
            </p>
            <div className="mt-8 flex flex-col sm:flex-row lg:px-24">
              <div className="w-full sm:w-1/3">
                <p className="text-4xl font-semibold text-teal-500 lg:text-6xl">
                  +100%
                </p>
                <p className="mb-6 font-semibold">Stats Information</p>
              </div>
              <div className="w-full sm:w-1/3">
                <p className="text-4xl font-semibold text-teal-500 lg:text-6xl">
                  +100%
                </p>
                <p className="mb-6 font-semibold">Stats Information</p>
              </div>
              <div className="w-full sm:w-1/3">
                <p className="text-4xl font-semibold text-teal-500 lg:text-6xl">
                  +100%
                </p>
                <p className="mb-6 font-semibold">Stats Information</p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 lg:py-40">
          <div className="container mx-auto">
            <p className="mb-8 text-center tracking-wider text-gray-600 uppercase">
              What customers are saying
            </p>
            <div className="flex flex-col md:-mx-3 md:flex-row">
              <div className="flex-1 px-3">
                <div className="mb-8 rounded-lg border border-solid border-gray-200 p-12 shadow">
                  <p className="text-xl font-semibold">
                    Lorem ipsum dolor sit amet, consectetur adipiscing
                  </p>
                  <p className="mt-6">
                    Eu lobortis elementum nibh tellus molestie nunc non blandit
                    massa. Sit amet consectetur adipiscing elit duis.
                  </p>
                  <div className="mt-8 flex items-center">
                    <Image
                      width={48}
                      height={48}
                      className="mr-4 h-12 w-12 rounded-full"
                      src={people}
                      alt="Jane Doe"
                    />
                    <div>
                      <p>Jane Doe</p>
                      <p className="text-sm text-gray-600">
                        Director of Research and Data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 px-3">
                <div className="mb-8 rounded-lg border border-solid border-gray-200 p-12 shadow">
                  <p className="text-xl font-semibold">
                    Lorem ipsum dolor sit amet, consectetur adipiscing
                  </p>
                  <p className="mt-6">
                    Eu lobortis elementum nibh tellus molestie nunc non blandit
                    massa. Sit amet consectetur adipiscing elit duis.
                  </p>
                  <div className="mt-8 flex items-center">
                    <Image
                      width={48}
                      height={48}
                      className="mr-4 h-12 w-12 rounded-full"
                      src={people}
                      alt="John Doe"
                    />
                    <div>
                      <p>John Doe</p>
                      <p className="text-sm text-gray-600">
                        Director of Research and Data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 px-3">
                <div className="mb-8 rounded-lg border border-solid border-gray-200 p-12 shadow">
                  <p className="text-xl font-semibold">
                    Lorem ipsum dolor sit amet, consectetur adipiscing
                  </p>
                  <p className="mt-6">
                    Eu lobortis elementum nibh tellus molestie nunc non blandit
                    massa. Sit amet consectetur adipiscing elit duis.
                  </p>
                  <div className="mt-8 flex items-center">
                    <Image
                      width={48}
                      height={48}
                      className="mr-4 h-12 w-12 rounded-full"
                      src={people}
                      alt="Jane Smith"
                    />
                    <div>
                      <p>Jane Smith</p>
                      <p className="text-sm text-gray-600">
                        Director of Research and Data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto my-20 rounded-lg bg-gray-200 py-24 text-center">
          <h3 className="text-5xl font-semibold">
            Ready to grow your business?
          </h3>
          <p className="mt-8 text-xl font-light">
            Quis lectus nulla at volutpat diam ut. Enim lobortis scelerisque
            fermentum dui faucibus in.
          </p>
          <p className="mt-8">
            <button
              type="button"
              className="rounded bg-teal-500 px-16 py-5 text-lg text-white hover:bg-teal-600">
              Get Started Now
            </button>
          </p>
        </section>
      </main>
      <footer className="container mx-auto mt-48 mb-8 px-3 py-16 text-gray-800">
        <div className="-mx-3 flex">
          <div className="flex-1 px-3">
            <h2 className="text-lg font-semibold">About Us</h2>
            <p className="mt-5">
              Ridiculus mus mauris vitae ultricies leo integer malesuada nunc.
            </p>
          </div>
          <div className="flex-1 px-3">
            <h2 className="text-lg font-semibold">Important Links</h2>
            <ul className="mt-4 leading-loose">
              <li>
                <a href="https://codebushi.com">Terms &amp; Conditions</a>
              </li>
              <li>
                <a href="https://codebushi.com">Privacy Policy</a>
              </li>
            </ul>
          </div>
          <div className="flex-1 px-3">
            <h2 className="text-lg font-semibold">Social Media</h2>
            <ul className="mt-4 leading-loose">
              <li>
                <a href="https://dev.to/changoman">Dev.to</a>
              </li>
              <li>
                <a href="https://twitter.com/HuntaroSan">Twitter</a>
              </li>
              <li>
                <a href="https://github.com/codebushi/gatsby-starter-lander">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
};
