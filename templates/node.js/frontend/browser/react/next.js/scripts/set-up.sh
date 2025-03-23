#!/bin/sh

# Check Version
node -v
pnpm -v
# Create App
pnpm create next-app next-boilerplate --import-alias "@boilerplate/*" --ts --tailwind --eslint --src-dir --turbo --use-pnpm --no-app --skip-install
# Go to Project
cd next-boilerplate
# Install dependencies
pnpm install --save-exact @prisma/client @tanstack/react-query@latest @trpc/client@next @trpc/next@next @trpc/react-query@next @trpc/server@next axios next next-pwa pino react react-dom zod
# Install devDependencies
pnpm install --save-exact --save-dev @eslint/compat @eslint/eslintrc @eslint/js @million/lint @testing-library/dom @testing-library/react @types/jest @types/node @types/react @types/react-dom autoprefixer daisyui eslint@next eslint-config-next eslint-config-prettier eslint-plugin-prettier husky jest jest-environment-jsdom kill-port million postcss prettier prettier-plugin-tailwindcss prisma rimraf tailwindcss ts-jest ts-node typescript typescript-eslint
# Set up Prisma
touch prisma/schema.prisma
