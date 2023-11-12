# Encyclopedia

- [Encyclopedia](#encyclopedia)
  - [Technology](#technology)
    - [Theory](#theory)
      - [Asymtonic Notation](#asymtonic-notation)
        - [Big Theta (Θ)](#big-theta-θ)
        - [Common Runtimes](#common-runtimes)
        - [Big Omega (Ω) and Big O (O)](#big-omega-ω-and-big-o-o)
      - [Regular Expression](#regular-expression)
        - [Literals](#literals)
        - [Alternation](#alternation)
        - [Character Sets](#character-sets)
        - [Wild for Wildcards](#wild-for-wildcards)
        - [Ranges](#ranges)
        - [Shorthand Character Classes](#shorthand-character-classes)
        - [Grouping](#grouping)
        - [Quantifies](#quantifies)
          - [Fixed](#fixed)
          - [Optional](#optional)
          - [O or More (Kleene Star), 1 or More (Kleene Plus)](#o-or-more-kleene-star-1-or-more-kleene-plus)
        - [Anchors](#anchors)
        - [Review](#review)
    - [Languages](#languages)
      - [Markup](#markup)
      - [Programming](#programming)
      - [Query](#query)
      - [Scripting](#scripting)
    - [Software Development](#software-development)
      - [Development Tools](#development-tools)
        - [Version Control](#version-control)
        - [Package Manager](#package-manager)
        - [Linters and Formatters](#linters-and-formatters)
        - [Logging](#logging)
        - [Documentation](#documentation)
        - [Build Tools](#build-tools)
        - [Testing](#testing)
          - [Unit Test](#unit-test)
          - [End-to-end](#end-to-end)
      - [Front-end](#front-end)
        - [Styling](#styling)
          - [Preprocessors](#preprocessors)
          - [Frameworks](#frameworks)
          - [Components](#components)
        - [Front-end Frameworks](#front-end-frameworks)
          - [Client-side](#client-side)
          - [Server-side](#server-side)
          - [Mobile](#mobile)
        - [Libraries](#libraries)
          - [Charts](#charts)
          - [State Management](#state-management)
      - [Back-end](#back-end)
        - [Status Codes](#status-codes)
        - [Back-end Frameworks](#back-end-frameworks)
        - [Security](#security)
        - [Object Relational Mapping (ORM)](#object-relational-mapping-orm)
        - [Database](#database)
        - [Message Broker](#message-broker)
      - [Data Science](#data-science)
        - [Data Science Libraries](#data-science-libraries)
          - [Data Collection](#data-collection)
          - [Data Manipulation](#data-manipulation)
          - [Data Visualization](#data-visualization)
          - [Machine Learning](#machine-learning)
      - [DevOps](#devops)
        - [Servers](#servers)
        - [Docker](#docker)
        - [Platform](#platform)
          - [Serverless](#serverless)
          - [SaaS](#saas)
          - [PaaS](#paas)
          - [IaaS (Infrastructure as a Service)](#iaas-infrastructure-as-a-service)
      - [Tools](#tools)
        - [Diagrams](#diagrams)
    - [Hardware Development](#hardware-development)
      - [Electronics](#electronics)
  - [Education](#education)
    - [Universities](#universities)
      - [Australia](#australia)
      - [Canada](#canada)
      - [Singapore](#singapore)
      - [United Kingdom](#united-kingdom)
      - [United States](#united-states)
    - [Online](#online)
      - [Blogs](#blogs)
      - [Coding Exercises](#coding-exercises)
      - [Courses](#courses)
  - [Companies](#companies)
    - [Big Tech](#big-tech)
    - [Computational Neuroscience](#computational-neuroscience)
    - [Investment Banking](#investment-banking)
    - [Investment Management](#investment-management)

## Technology

### Theory

#### Asymtonic Notation

##### Big Theta (Θ)

- We use big Theta when a program has only one case in term of runtime.

##### Common Runtimes

- Θ(1). This is constant runtime. This is the runtime when a program will always do the same thing regardless of the input. For instance, a program that only prints “hello, world” runs in Θ(1) because the program will always just print “hello, world”.
- Θ(log N). This is logarithmic runtime. You will see this runtime in search algorithms.
- Θ(N). This is linear runtime. You will often see this when you have to iterate through an entire dataset.
- Θ(N\*logN). You will see this runtime in sorting algorithms.
- Θ(N2). This is an example of a polynomial runtime. You will see this runtime when you have to search through a two-dimensional dataset (like a matrix) or nested loops.
- Θ(2N). This is exponential runtime. You will often see this runtime in recursive algorithms (Don’t worry if you don’t know what that is yet!).
- Θ(N!). This is factorial runtime. You will often see this runtime when you have to generate all of the different permutations of something. For instance, a program that generates all the different ways to order the letters “abcd” would run in this runtime.

##### Big Omega (Ω) and Big O (O)

- We use big Omega or Ω to describe the best case and big O or O to describe the worst case.

#### Regular Expression

##### Literals

In Regular expression, the `literals` are the simplest characters that will match the exact text of the literals. For example, the regex `monkey` will completely match the text `monkey` but will also match `monkey` in text `The monkeys like to eat bananas.`

##### Alternation

Alternation indicated by the pipe symbol `|`, allows for the matching of either of two subexpressions. For example, the regex `baboons|gorillas` will match the text baboons as well as the text `gorillas`.

##### Character Sets

Regular expression character sets denoted by a pair of brackets `[]` will match any of the characters included within the brackets. For example, the regular expression `con[sc]en[sc]us` will match any of the spellings `consensus`, `concensus`, `consencus`, and `concencus`.

##### Wild for Wildcards

In Regular expression, wildcards are denoted with the period `.` and it can match any single character (letter, number, symbol or whitespace) in a piece of text. For example, the regular expression `.........` will match the text `orangutan`, `marsupial`, or any other 9-character text.

##### Ranges

Regular expression ranges are used to specify a range of characters that can be matched. Common regular expression ranges include: [A-Z]. : match any uppercase letter [a-z]. : match any lowercase letter [0-9]. : match any digit [A-Za-z] : match any uppercase or lowercase letter.

##### Shorthand Character Classes

While character ranges are extremely useful, they can be cumbersome to write out every single time you want to match common ranges such as those that designate alphabetical characters or digits. To alleviate this pain, there are **shorthand character** classes that represent common ranges, and they make writing regular expressions much simpler. These shorthand classes include:

- `\w`: the “word character” class represents the regex range `[A-Za-z0-9_]`, and it matches a single uppercase character, lowercase character, digit or underscore
- `\d`: the “digit character” class represents the regex range `[0-9]`, and it matches a single digit character
- `\s`: the “whitespace character” class represents the regex range `[ \t\r\n\f\v]`, matching a single space, tab, carriage return, line break, form feed, or vertical tab

In addition to the shorthand character classes \w, \d, and \s, we also have access to the negated shorthand character classes! These shorthands will match any character that is NOT in the regular shorthand classes. These negated shorthand classes include:

- `\W`: the “non-word character” class represents the regex range `[^A-Za-z0-9_]`, matching any character that is not included in the range represented by `\w`
- `\D`: the “non-digit character” class represents the regex range `[^0-9]`, matching any character that is not included in the range represented by `\d`
- `\S`: the “non-whitespace character” class represents the regex range `[^ \t\r\n\f\v]`, matching any character that is not included in the range represented by `\s`

##### Grouping

In Regular expressions, grouping is accomplished by open `(` and close parenthesis `)`. Thus the regular expression `I love (baboons|gorillas)` will match the text `I love baboons` as well as `I love gorillas`, as the grouping limits the reach of the | to the text within the parentheses.

##### Quantifies

###### Fixed

In Regular expressions, fixed quantifiers are denoted by curly braces `{}`. It contains either the exact quantity or the quantity range of characters to be matched. For example, the regular expression `roa{3}r` will match the text roaaar, while the regular expression `roa{3,6}r` will match `roaaar`, `roaaaar`, `roaaaaar`, or `roaaaaaar`.

###### Optional

In Regular expressions, optional quantifiers are denoted by a question mark `?`. It indicates that a character can appear either 0 or 1 time. For example, the regular expression `humou?r` will match the text `humour` as well as the text `humor`.

###### O or More (Kleene Star), 1 or More (Kleene Plus)

In Regular expressions, the Kleene star(`*`) indicates that the preceding character can occur 0 or more times. For example, `meo*w` will match `mew`, `meow`, `meooow`, and `meoooooooooooow`.

The Kleene plus(`+`) indicates that the preceding character can occur 1 or more times. For example, `meo+w` will match `meow`, `meooow`, and `meoooooooooooow`, but not match `mew`.

##### Anchors

Anchors (hat `^` and dollar sign `$`) are used in regular expressions to match text at the start and end of a string, respectively. For example, the regex `^Monkeys: my mortal enemy$` will completely match the text `Monkeys: my mortal enemy` but not match `Spider Monkeys: my mortal enemy` or `Monkeys: my mortal enemy in the wild`. The `^` ensures that the matched text begins with `Monkeys`, and the `$` ensures the matched text ends with `enemy`.

##### Review

`\d*\s*\(*\d{3}\)*(\s|-||\.)*\d{3}(\s|-|\.)*\d{3,4}`

Match these strings

- 718-555-3810
- 9175552849
- 1 212 555 3821
- (917)5551298
- 212.555.8731

### Languages

#### Markup

- Markdown
- SVG (Scalable Vector Graphics)

#### Programming

- Data Science
  - [Python](https://www.python.org)
  - [R](https://www.r-project.org/)
- Front-end Development
  - [TypeScript](https://www.typescriptlang.org)
- Back-end Development
  - [Golang](https://go.dev)
  - [Java](https://www.java.com/en/)
- Hardware Development
  - C/C++

#### Query

- [GraphQL](https://graphql.org/) (Graph Query Language)
- SQL (Structured Query Language)

#### Scripting

- Shell Scripts

### Software Development

#### Development Tools

##### Version Control

- [Git](https://git-scm.com/)
  - [GitHub](https://github.com/)
  - [GitLab](https://about.gitlab.com/)

##### Package Manager

- [Golang](https://go.dev/)
  - Go Modules
- [Java](https://www.java.com/en/)
  - [Gradle](https://gradle.org/)
  - [JFrog](https://jfrog.com/)
  - [Maven](https://maven.apache.org/)
- [Node.js](https://nodejs.org/en)
  - [npm](https://www.npmjs.com/)
  - [yarn](https://yarnpkg.com/)
  - [pnpm](https://pnpm.io/)
- [Python](https://www.python.org/)
  - [anaconda](https://www.anaconda.com/)
  - [conda](https://docs.conda.io/en/latest/)
  - [pip](https://pypi.org/project/pip/)
  - [pipenv](https://pipenv.pypa.io/en/latest/)
  - [virtualenv](https://virtualenv.pypa.io/en/latest/)

##### Linters and Formatters

1. [eslint](https://eslint.org) - A pluggable and configurable linter tool for identifying and reporting on patterns in JavaScript. Maintain your code quality with ease
2. [husky](https://typicode.github.io/husky/#/) - Modern native Git hooks made easy
3. [prettier](https://prettier.io) - Opinionated Code Formatter

```sh
yarn add --dev --exact husky eslint prettier
yarn eslint --init
yarn husky install
yarn husky add .husky/pre-commit "yarn lint && yarn prettier --write ."
```

##### Logging

- [Node.js](https://nodejs.org/en)
  - [npmlog](https://github.com/npm/npmlog)
  - [pino](https://getpino.io)
  - [winston](https://github.com/winstonjs)

##### Documentation

- Markdown to HTML
  - [docsify](https://docsify.js.org/#/)
  - [docusaurus](https://docusaurus.io/)
- Front-end
  - [storybook](https://storybook.js.org/)
- Back-end
  - [tsoa](https://tsoa-community.github.io/docs/)

##### Build Tools

- [Node.js](https://nodejs.org/en)
  - [vite](https://vitejs.dev/)
  - [webpack](https://webpack.js.org/)

##### Testing

###### Unit Test

- [jasmine](https://jasmine.github.io/)
- [jest](http://jestjs.io/) - Meta
- [mocha](https://mochajs.org/)

###### End-to-end

- [cypress](https://www.cypress.io/)
- [karma](https://karma-runner.github.io) - Google
- [playwright](https://playwright.dev/) - Microsoft

#### Front-end

##### Styling

###### Preprocessors

- CSS
  - [PostCSS](https://postcss.org/)
  - [SASS](https://sass-lang.com/)

###### Frameworks

- [TailwindCSS](https://tailwindcss.com/)

###### Components

- [Ant Design](https://ant.design/)
- [Chakra UI](https://chakra-ui.com)
- [Theme UI](https://theme-ui.com/)
- [MUI](https://mui.com) - Google

##### Front-end Frameworks

###### Client-side

|                  | [Angular](https://angular.io/) | [React](https://react.dev/) |
| ---------------- | ------------------------------ | --------------------------- |
| Languages        | TypeScript                     | TypeScript                  |
| Type             | Framework                      | Library                     |
| DOM Manipulation | Traditional DOM                | Virtual DOM                 |
| Data Binding     | two-way                        | one-way                     |
| HTML             | HTML with JS                   | JS with HTML (JSX)          |
| Testing          | Jasmine                        | Jest                        |
| Developer        | Google                         | Meta                        |
| Learning Curve   | More Difficult                 | Easier                      |

- ~~[AngularJS](https://angularjs.org/): is JavaScript based. Works on MVC. {{ }} expressions are used for two way binding between view and model. Special methods, ng-bind can also be used to do the same. Prefer a hierarchical dependency injection.~~
- [Solid](https://www.solidjs.com/)
- [Svelte](https://svelte.dev/) - Vercel
- [Vue.js](https://vuejs.org/)

###### Server-side

- [Gatsby.js](https://gatsbyjs.org) - Netlify
- [Next.js](https://nextjs.org/) - Vercel
- [Nuxt](https://nuxtjs.org/)
- [SolidStart](https://start.solidjs.com)
- [SvelteKit](https://kit.svelte.dev/) - Vercel

###### Mobile

- [Ionic](https://ionicframework.com/)
- [NativeScript](https://nativescript.org/)
- [React Native](https://reactnative.dev/) - Meta

##### Libraries

###### Charts

- [Charts.js](https://www.chartjs.org/)
- [Chartist.js](https://gionkunz.github.io/chartist-js/)
- [D3.js](https://d3js.org/)
- [Google Chart](https://developers.google.com/chart)
- [Highcharts](https://www.highcharts.com/)
- [Recharts](https://recharts.org/)

###### State Management

- [Redux](https://redux.js.org/)
  - [Saga](https://redux-saga.js.org/)
  - [Thunk](https://www.npmjs.com/package/redux-thunk)

#### Back-end

##### Status Codes

- Information responses
  - 100 - Continue
  - 101 - Switching Protocols
  - 102 - Processing (WebDAV)
  - 103 - Early Hints
- Successful responses
  - 200 - OK
  - 201 - Created
  - 202 - Accepted
  - 203 - Non-Authoritative Information
  - 204 - No Content
  - 205 - Reset Content
  - 206 - Partial Content
  - 207 - Multi-Status (WebDAV)
  - 208 - Already Reported (WebDAV)
  - 226 - IM Used (WebDAV)
- Redirection messages
  - 300 - Multiple Choices
  - 301 - Moved Permanently
  - 302 - Found
  - 303 - See Other
  - 304 - Not Modified
  - 305 - Use Proxy
  - 306 - Unused
  - 307 - Temporary Redirect
  - 308 - Permanent Redirect
- Client error responses
  - 400 - Bad Request
  - 401 - Unauthorized
  - 402 - Payment Required
  - 403 - Forbidden
  - 404 - Not Found
  - 405 - Method Not Allowed
  - 406 - Not Acceptable
  - 407 - Proxy Authentication Required
  - 408 - Request Timeout
  - 409 - Conflict
  - 410 - Gone
  - 411 - Length Required
  - 412 - Precondition Failed
  - 413 - Payload Too Large
  - 414 - URI Too Long
  - 415 - Unsupported Media Type
  - 416 - Range Not Satisfiable
  - 417 - Expectation Failed
  - 418 - I'm a teapot
  - 421 - Misdirected Request
  - 422 - Unprocessable Entity (WebDAV)
  - 423 - Locked (WebDAV)
  - 424 - Failed Dependency (WebDAV)
  - 425 - Too Early
  - 426 - Upgrade Required
  - 428 - Precondition Required
  - 429 - Too Many Requests
  - 431 - Request Header Fields Too Large
  - 451 - Unavailable For Legal Reasons
- Server error responses
  - 500 Internal Server Error
  - 501 Not Implemented
  - 502 Bad Gateway
  - 503 Service Unavailable
  - 504 Gateway Timeout
  - 505 HTTP Version Not Supported
  - 506 Variant Also Negotiates
  - 507 Insufficient Storage (WebDAV)
  - 508 Loop Detected (WebDAV)
  - 510 Not Extended
  - 511 Network Authentication Required

##### Back-end Frameworks

- [Node.js](https://nodejs.org/en)
  - [express.js](https://expressjs.com/)
  - [fastify](https://www.fastify.io/)
  - [nest.js](https://nestjs.com/)
  - [Apollo GraphQL](https://www.apollographql.com/docs/apollo-server/)

##### Security

- [Node.js](https://nodejs.org/en)
  - [cors](https://github.com/expressjs/cors)
  - [helmet](https://helmetjs.github.io/)
  - Authentication
    - [jsonwebtoken](https://jwt.io/)
    - [passport](https://www.passportjs.org/)

##### Object Relational Mapping (ORM)

- [Mongoose](https://mongoosejs.com/)
- [Prisma](https://www.prisma.io/) for ORM
- [Sequelize](https://sequelize.org/)
- [TypeORM](https://typeorm.io/)

##### Database

- [Redis](https://redis.io/) for Caching
- [PostgreSQL](https://www.postgresql.org/) for Relational SQL
- [MongoDB](https://www.mongodb.com/) for NoSQL

##### Message Broker

- [Kafka](https://kafka.apache.org/)

#### Data Science

##### Data Science Libraries

###### Data Collection

- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [scrapy](https://scrapy.org/)

###### Data Manipulation

- [pandas](https://pandas.pydata.org/)
- [numpy](https://numpy.org/)

###### Data Visualization

- [matplotlib](https://matplotlib.org/)

###### Machine Learning

- [keras](https://keras.io/)
- [pytorch](https://pytorch.org/)
- [scikit-learn](https://scikit-learn.org/stable/)
- [scipy](https://scipy.org/)
- [tensorflow](https://www.tensorflow.org/)

#### DevOps

##### Servers

|     | nginx (Engine X) | Apache HTTP Server |
| --- | ---------------- | ------------------ |

##### [Docker](https://www.docker.com/)

- Image Layers
  - Each layer is an image itself, just one without a human-assigned tag. They have auto-generated IDs though.
  - Each layer stores the changes compared to the image it's based on.
  - An image can consist of a single layer (that's often the case when the squash command was used).
  - Each instruction in a Dockerfile results in a layer. (Except for multi-stage builds, where usually only the layers in the final image are pushed, or when an image is squashed to a single layer).
  - Layers are used to avoid transferring redundant information and skip build steps which have not changed (according to the Docker cache).
- Cached
  - Its parent image exists in the cache
  - The Dockerfile instruction corresponding to the layer is unchanged (or in case of ADD/COPY, the involved files are exactly the same)
  - Cache Gotcha #1: `RUN apt-get update`
  - Using the Cache Well: it is better to update the package management files (`package.json` & `requirements.txt`), you only have to do it once.

##### Platform

###### Serverless

- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com)

###### SaaS

###### PaaS

- [heroku](https://www.heroku.com/)
- [render](https://render.com/)

###### IaaS (Infrastructure as a Service)

| IaaS            |                                          | Amazon Web Services (AWS)           | Azure                                    | Google Cloud                | Digital Ocean               |
| --------------- | ---------------------------------------- | ----------------------------------- | ---------------------------------------- | --------------------------- | --------------------------- |
| Compute         |                                          |                                     | Azure Virtual Machines (Linux & Windows) | Compute Engine              |                             |
|                 | Orchestration                            |                                     | Azure Kubernetes Service (AKS)           | Google Kubernetes Engine    |                             |
|                 |                                          |                                     |                                          |                             |                             |
|                 | PaaS                                     | AWS Elastic Beanstalk               | App Service                              | Google App Engine           | App Platform                |
|                 | Serverless                               |                                     | Azure Functions                          | Cloud Functions             |                             |
|                 |                                          |                                     |                                          |                             |                             |
| Storage         |                                          | Amazon Simple Storage Service (S3)  |                                          |                             | Spaces Object Storage       |
|                 |                                          |                                     |                                          |                             |                             |
|                 |                                          | Amazon Elastic Block Store (EBS)    | Azure Files                              | Cloud Storage               | Volumes Block Storage       |
|                 |                                          | Amazon Elastic File System (EFS)    |                                          |                             |                             |
| Databases       | Key-Value                                |                                     | Azure Cache for Redis                    |                             | Redis                       |
|                 |                                          |                                     |                                          |                             |                             |
|                 | Wide Column                              |                                     |                                          |                             |                             |
|                 | Document Oriented                        |                                     | Azure Cosmos DB                          | Firestore                   | MongoDB                     |
|                 |                                          |                                     |                                          |                             |                             |
|                 | Relational                               |                                     | Azure Database for PostgreSQL            |                             | PostgreSQL                  |
|                 |                                          |                                     | Azure Database for MySQL                 |                             | MySQL                       |
|                 |                                          |                                     | Azure SQL Database                       |                             |                             |
|                 | Graph                                    |                                     |                                          |                             |                             |
|                 | Search Engine                            | OpenSearch Service                  |                                          |                             |                             |
| Networking      |                                          | Amazon VPC                          | Azure Virtual Network                    | Virtual Private Cloud (VPC) | Virtual Private Cloud (VPC) |
|                 |                                          |                                     | Azure Firewall                           |                             | Cloud Firewalls             |
|                 |                                          | Amazon Elastic Load Balancing (ELB) | Load Balancer                            | Cloud Load Balancing        | Load Balancers              |
|                 |                                          |                                     |                                          |                             | Reserved IPs                |
|                 |                                          | Amazon Route 53                     | Azure DNS                                | Cloud DNS                   | DNS                         |
| Message Brokers |                                          |                                     | Azure Service Bus                        |                             |                             |
|                 |                                          |                                     |                                          |                             |                             |
|                 |                                          |                                     |                                          |                             |                             |
| IaC             | Container                                |                                     | Azure Container Registry                 | Container Registry          |                             |
|                 |                                          |                                     |                                          |                             |                             |
| Secrets Manager |                                          | System Manager - Parameter Store    | Azure Key Vault                          |                             |                             |
| Developer Tools | Version Control                          |                                     | GitHub                                   |                             |                             |
|                 | CI                                       |                                     | Azure Pipelines                          |                             |                             |
|                 | CD                                       |                                     | Cloud Build                              |                             |                             |
|                 |                                          |                                     |                                          |                             |                             |
|                 | Command Line Interface (CLI)             |                                     |                                          |                             |                             |
|                 | Integrated Development Environment (IDE) |                                     | Visual Studio                            |                             |                             |
|                 |                                          |                                     | Visual Studio Code                       |                             |                             |

#### Tools

##### Diagrams

- [Diagrams](https://www.diagrams.net/)
- [Sequence Diagram](https://sequencediagram.org/)

### Hardware Development

- [Qt](https://www.qt.io/)

#### Electronics

- [Arduino](https://www.arduino.cc/)
- [Raspberry PI](https://www.raspberrypi.com/)

## Education

### Universities

#### Australia

| No  | University                      | Group          | City      | State                        |
| --- | ------------------------------- | -------------- | --------- | ---------------------------- |
| 01  | Australian National University  | Group of Eight | Acton     | Australian Capital Territory |
| 02  | University of New South Wales   | Group of Eight | Sydney    | New South Wales              |
| 03  | University of Sydney            | Group of Eight | Sydney    | New South Wales              |
| 04  | University of Queensland        | Group of Eight | Brisbane  | Queensland                   |
| 05  | University of Adelaide          | Group of Eight | Adelaide  | South Australia              |
| 06  | University of Melbourne         | Group of Eight | Melbourne | Victoria                     |
| 07  | Monash University               | Group of Eight | Melbourne | Victoria                     |
| 08  | University of Western Australia | Group of Eight | Perth     | Western Australia            |

#### Canada

| No  | University                     | Group | City        | State            |
| --- | ------------------------------ | ----- | ----------- | ---------------- |
| 01  | University of Alberta          | U15   | Edmonton    | Alberta          |
| 02  | University of Calgary          | U15   | Calgary     | Alberta          |
| 03  | University of British Columbia | U15   | Vancouver   | British Columbia |
| 04  | University of Manitoba         | U15   | Winnipeg    | Manitoba         |
| 05  | Dalhousie University           | U15   | Halifax     | Nova Scotia      |
| 06  | McMaster University            | U15   | Hamilton    | Ontario          |
| 07  | University of Ottawa           | U15   | Ottawa      | Ontario          |
| 08  | Queen's University             | U15   | Kingston    | Ontario          |
| 09  | University of Toronto          | U15   | Toronto     | Ontario          |
| 10  | University of Waterloo         | U15   | Waterloo    | Ontario          |
| 11  | University of Western Ontario  | U15   | London      | Ontario          |
| 12  | Université Laval               | U15   | Quebec City | Quebec           |
| 13  | McGill University              | U15   | Montreal    | Quebec           |
| 14  | Université de Montréal         | U15   | Montreal    | Quebec           |
| 15  | University of Saskatchewan     | U15   | Saskatoon   | Saskatchewan     |

#### Singapore

- National University of Singapore
  - Duke - NUS Medical School
  - Yale - NUS College

#### United Kingdom

| No  | University                      | Group   | City        | Country          |
| --- | ------------------------------- | ------- | ----------- | ---------------- |
| 01  | University of Cambridge         | Russell | Cambridge   | England          |
| 02  | University of Oxford            | Russell | Oxford      | England          |
| 03  | Imperial College London         | Russell | London      | England          |
| 04  | King's College London           | Russell | London      | England          |
| 05  | London School of Economics      | Russell | London      | England          |
| 06  | Queen Mary University of London | Russell | London      | England          |
| 07  | University College London       | Russell | London      | England          |
| 08  | University of Birmingham        | Russell | Birmingham  | England          |
| 09  | University of Bristol           | Russell | Bristol     | England          |
| 10  | Durham University               | Russell | Durham      | England          |
| 11  | University of Exeter            | Russell | Exeter      | England          |
| 12  | University of Leeds             | Russell | Leeds       | England          |
| 13  | University of Liverpool         | Russell | Liverpool   | England          |
| 14  | University of Manchester        | Russell | Manchester  | England          |
| 15  | Newcastle University            | Russell | Newcastle   | England          |
| 16  | University of Nottingham        | Russell | Nottingham  | England          |
| 17  | University of Sheffield         | Russell | Sheffield   | England          |
| 18  | University of Southampton       | Russell | Southampton | England          |
| 19  | University of Warwick           | Russell | Coventry    | England          |
| 20  | University of York              | Russell | York        | England          |
| 21  | Queen's University Belfast      | Russell | Belfast     | Northern Ireland |
| 22  | University of Edinburgh         | Russell | Edinburgh   | Scotland         |
| 23  | University of Glasgow           | Russell | Glasgow     | Scotland         |
| 24  | Cardiff University              | Russell | Cardiff     | Wales            |

#### United States

| No  | University                         | Group          | City         | State          |
| --- | ---------------------------------- | -------------- | ------------ | -------------- |
| 01  | Brown University                   | Ivy League     | Providence   | Rhode Island   |
| 02  | Columbia University                | Ivy League     | New York     | New York       |
| 03  | Cornell University                 | Ivy League     | Ithaca       | New York       |
| 04  | Dartmouth College                  | Ivy League     | Hanover      | New Hampshire  |
| 05  | Harvard University                 | Ivy League     | Cambridge    | Massachusetts  |
| 06  | University of Pennsylvania         | Ivy League     | Philadelphia | Pennsylvania   |
| 07  | Princeton University               | Ivy League     | Princeton    | New Jersey     |
| 08  | Yale University                    | Ivy League     | New Haven    | Connecticut    |
| 09  | University of California           | Public School  |              | California     |
| 10  | University of Texas                | Public School  |              | Texas          |
| 11  | Duke University                    | Private School | Durham       | North Carolina |
| 12  | MIT                                | Private School |              | Massachusetts  |
| 13  | Stanford University                | Private School |              | California     |
| 14  | Johns Hopkins University           | Private School | Baltimore    | Maryland       |
| 15  | California Institute of Technology | Private School |              | California     |
| 16  | University of Notre Dame           | Private School | South Bend   | Indiana        |

### Online

#### Blogs

- [Baeldung](https://www.baeldung.com/)
- [dev.to](https://dev.to/)
- [roadmap](https://roadmap.sh)

#### Coding Exercises

- [CodeWars](https://www.codewars.com/)
- [HackerRank](https://www.hackerrank.com/)
- [LeetCode](https://leetcode.com/)
- [NeetCode](https://neetcode.io/)

#### Courses

- [A Cloud Guru](https://acloudguru.com/)
- [Codecademy](https://www.codecademy.com/)
- [Coursera](https://www.coursera.org/)
- [DataCamp](https://www.datacamp.com/)
- [FreeCodeCamp](https://www.freecodecamp.org/)
- [Harvard](https://pll.harvard.edu/)
- [PluralSight](https://www.pluralsight.com/)
- [Udacity](https://www.udacity.com/)
- [Udemy](https://www.udemy.com/)

## Companies

### Big Tech

- Alphabet (Google)
- Amazon
- Meta (Facebook)
- Microsoft

### Computational Neuroscience

- [Kernel](https://www.kernel.com/)
- [BrainGate](https://www.braingate.org/)
  - Stanford, California, United States
- [Blackrock Neurotech](https://blackrockneurotech.com/)
  - Salt Lake City, Utah, United States
- [Neurable](https://neurable.com/)
  - Boston, Massachusetts, United States
- [BrainCo](https://brainco.tech/)
  - Boston, Massachusetts, United States
- [Neuralink](https://neuralink.com/)
  - Fremont, California, United States
  - Austin, Texas, United States
- [Synchron](https://synchron.com/)
  - Brooklyn, New York, United States
  - Melbourne, Victoria, Australia
- [Bitbrain](https://www.bitbrain.com/)
  - Zaragoza, Zaragoza, Spain
  - New York City, New York, United States
- [Precision Neuroscience](https://precisionneuro.io/)
  - Manhattan, New York, United States
  - Mountain View, California, United States
  - Minneapolis, Minnesota, United States
- [Emotiv](https://www.emotiv.com/)
  - San Francisco, California, United States
  - Sydney, New South Wales, Australia
  - Hanoi, Hanoi, Vietnam

### Investment Banking

- Goldman Sachs
- J.P. Morgan
- Morgan Stanley

### Investment Management

- BlackRock (Index Fund)
- BlackStone (Private Equity)
