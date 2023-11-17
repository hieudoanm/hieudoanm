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
        - [Node.js](#nodejs)
      - [Query](#query)
      - [Scripting](#scripting)
    - [Software Development](#software-development)
      - [Development Tools](#development-tools)
        - [Version Control](#version-control)
        - [Linters and Formatters](#linters-and-formatters)
      - [Front-end](#front-end)
        - [Front-end Frameworks](#front-end-frameworks)
          - [Web Client Side Rendering (CSR)](#web-client-side-rendering-csr)
        - [Libraries](#libraries)
      - [Back-end](#back-end)
        - [Status Codes](#status-codes)
        - [API Architectures](#api-architectures)
        - [Back-end Frameworks](#back-end-frameworks)
      - [DevOps](#devops)
        - [Servers](#servers)
        - [Docker](#docker)
        - [Platform](#platform)
          - [IaaS (Infrastructure as a Service)](#iaas-infrastructure-as-a-service)
      - [Tools](#tools)
        - [Diagrams](#diagrams)
    - [Hardware Development](#hardware-development)
      - [Electronics](#electronics)
  - [Education](#education)
    - [Universities](#universities)
    - [Online](#online)
      - [Blogs](#blogs)
      - [Coding Exercises](#coding-exercises)
      - [Courses](#courses)
  - [Companies](#companies)

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

##### Node.js

- `Event Loop` job is to get first function from Event `Queue` and push it to `Call Stack` - last in first out
- `Heap` <=> `Call Stack` => `Web API` => `Queue`

```javascript
setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});

new Promise((resolve) => {
  resolve();
  console.log('resolve');
}).then(() => {
  console.log('then');
});

process.nextTick(() => {
  console.log('nextTick');
});

console.log('log');

// Output:
// resolve
// log
// nextTick
// then
// setTimeout
// setImmediate
```

#### Query

- [GraphQL](https://graphql.org/) (Graph Query Language)
- SQL (Structured Query Language)

#### Scripting

- Shell Scripts

### Software Development

#### Development Tools

##### Version Control

- [Git](https://git-scm.com/)

##### Linters and Formatters

1. [husky](https://typicode.github.io/husky/#/) - Modern native Git hooks made easy

```sh
yarn add --dev --exact husky eslint prettier
yarn eslint --init
yarn husky install
yarn husky add .husky/pre-commit "yarn lint && yarn prettier --write ."
```

#### Front-end

##### Front-end Frameworks

###### Web Client Side Rendering (CSR)

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

##### Libraries

#### Back-end

##### Status Codes

|                        | Status Codes                          |
| ---------------------- | ------------------------------------- |
| Information responses  | 100 - Continue                        |
|                        | 101 - Switching Protocols             |
|                        | 102 - Processing (WebDAV)             |
|                        | 103 - Early Hints                     |
| Successful responses   | 200 - OK                              |
|                        | 201 - Created                         |
|                        | 202 - Accepted                        |
|                        | 203 - Non-Authoritative Information   |
|                        | 204 - No Content                      |
|                        | 205 - Reset Content                   |
|                        | 206 - Partial Content                 |
|                        | 207 - Multi-Status (WebDAV)           |
|                        | 208 - Already Reported (WebDAV)       |
|                        | 226 - IM Used (WebDAV)                |
| Redirection messages   | 300 - Multiple Choices                |
|                        | 301 - Moved Permanently               |
|                        | 302 - Found                           |
|                        | 303 - See Other                       |
|                        | 304 - Not Modified                    |
|                        | 305 - Use Proxy                       |
|                        | 306 - Unused                          |
|                        | 307 - Temporary Redirect              |
|                        | 308 - Permanent Redirect              |
| Client error responses | 400 - Bad Request                     |
|                        | 401 - Unauthorized                    |
|                        | 402 - Payment Required                |
|                        | 403 - Forbidden                       |
|                        | 404 - Not Found                       |
|                        | 405 - Method Not Allowed              |
|                        | 406 - Not Acceptable                  |
|                        | 407 - Proxy Authentication Required   |
|                        | 408 - Request Timeout                 |
|                        | 409 - Conflict                        |
|                        | 410 - Gone                            |
|                        | 411 - Length Required                 |
|                        | 412 - Precondition Failed             |
|                        | 413 - Payload Too Large               |
|                        | 414 - URI Too Long                    |
|                        | 415 - Unsupported Media Type          |
|                        | 416 - Range Not Satisfiable           |
|                        | 417 - Expectation Failed              |
|                        | 418 - I'm a teapot                    |
|                        | 421 - Misdirected Request             |
|                        | 422 - Unprocessable Entity (WebDAV)   |
|                        | 423 - Locked (WebDAV)                 |
|                        | 424 - Failed Dependency (WebDAV)      |
|                        | 425 - Too Early                       |
|                        | 426 - Upgrade Required                |
|                        | 428 - Precondition Required           |
|                        | 429 - Too Many Requests               |
|                        | 431 - Request Header Fields Too Large |
|                        | 451 - Unavailable For Legal Reasons   |
| Server error responses | 500 Internal Server Error             |
|                        | 501 Not Implemented                   |
|                        | 502 Bad Gateway                       |
|                        | 503 Service Unavailable               |
|                        | 504 Gateway Timeout                   |
|                        | 505 HTTP Version Not Supported        |
|                        | 506 Variant Also Negotiates           |
|                        | 507 Insufficient Storage (WebDAV)     |
|                        | 508 Loop Detected (WebDAV)            |
|                        | 510 Not Extended                      |
|                        | 511 Network Authentication Required   |

##### API Architectures

- SOAP (XML)
- RESTful (JSON)
- GraphQL
- gRPC (Google Remote Procedure Call)
- WebSocket (Bi-directional)
- WebHook (Event Driven)

##### Back-end Frameworks

CLI: Command-line Interface
e2e: End to End
ORM: Object Relational Mapping

| No  | Development  | Supersector                       | Sector              | Subsector         | URL                                                                     | Usage   | Developer |
| --- | ------------ | --------------------------------- | ------------------- | ----------------- | ----------------------------------------------------------------------- | ------- | --------- |
|     | Full-stack   |                                   | Language            |                   | C                                                                       |         |           |
|     | Full-stack   |                                   | Language            |                   | C++                                                                     |         |           |
|     | Full-stack   |                                   | Language            |                   | C#                                                                      |         | Microsoft |
|     | Full-stack   |                                   | Language            |                   | [Golang](https://go.dev)                                                |         | Google    |
|     | Full-stack   |                                   | Language            |                   | [Java](https://www.java.com/en/)                                        |         | Oracle    |
|     | Full-stack   |                                   | Language            |                   | [Python](https://www.python.org)                                        |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Language            |                   | [JavaScript](https://www.javascript.com/)                               |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Language            |                   | [TypeScript](https://www.typescriptlang.org)                            |         | Microsoft |
|     | Full-stack   | [Golang](https://go.dev/)         | Package Manager     |                   | [Go Packages](https://pkg.go.dev/)                                      |         | Google    |
|     | Full-stack   | [Java](https://www.java.com/en/)  | Package Manager     |                   | [Gradle](https://gradle.org/)                                           |         |           |
|     | Full-stack   | [Java](https://www.java.com/en/)  | Package Manager     |                   | [JFrog](https://jfrog.com/)                                             |         |           |
|     | Full-stack   | [Java](https://www.java.com/en/)  | Package Manager     |                   | [Maven](https://maven.apache.org/)                                      |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Package Manager     |                   | [npm](https://www.npmjs.com/)                                           |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Package Manager     |                   | [pnpm](https://pnpm.io/)                                                |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Package Manager     |                   | [yarn](https://yarnpkg.com/)                                            |         |           |
|     | Full-stack   | [Python](https://www.python.org/) | Package Manager     |                   | [anaconda](https://www.anaconda.com/)                                   |         |           |
|     | Full-stack   | [Python](https://www.python.org/) | Package Manager     |                   | [conda](https://docs.conda.io/en/latest/)                               |         |           |
|     | Full-stack   | [Python](https://www.python.org/) | Package Manager     |                   | [pip](https://pypi.org/project/pip/)                                    |         |           |
|     | Full-stack   | [Python](https://www.python.org/) | Package Manager     |                   | [pipenv](https://pipenv.pypa.io/en/latest/)                             |         |           |
|     | Full-stack   | [Python](https://www.python.org/) | Package Manager     |                   | [virtualenv](https://virtualenv.pypa.io/en/latest/)                     |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Logging             |                   | [npmlog](https://github.com/npm/npmlog)                                 |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Logging             |                   | [pino](https://getpino.io)                                              |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Logging             |                   | [winston](https://github.com/winstonjs)                                 |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Linting & Formatter | Linting           | [eslint](https://eslint.org)                                            |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Linting & Formatter | Formatter         | [prettier](https://prettier.io)                                         |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Build               |                   | [webpack](https://webpack.js.org/)                                      |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Testing             | Unit              | [jasmine](https://jasmine.github.io/)                                   |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Testing             | Unit              | [jest](http://jestjs.io/)                                               |         | Meta      |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Testing             | Unit              | [mocha](https://mochajs.org/)                                           |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | CLI                 |                   | [vite](https://vitejs.dev/)                                             |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Documentation       | Markdown to HTML  | [docsify](https://docsify.js.org/#/)                                    |         |           |
|     | Full-stack   | [Node.js](https://nodejs.org/en)  | Documentation       | Markdown to HTML  | [docusaurus](https://docusaurus.io/)                                    |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Extension     | [PostCSS](https://postcss.org/)                                         |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Extension     | [SASS](https://sass-lang.com/)                                          |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Framework     | [Bootstrap](https://getbootstrap.com/)                                  |         | Twitter   |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Framework     | [Materialize CSS](https://materializecss.com/)                          |         | Google    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Framework     | [TailwindCSS](https://tailwindcss.com/)                                 |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Components    | [Ant Design](https://ant.design/)                                       |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Components    | [Chakra UI](https://chakra-ui.com)                                      |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Components    | [TailwindUI](https://tailwindui.com/)                                   |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Components    | [Theme UI](https://theme-ui.com/)                                       |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Components    | [MUI](https://mui.com)                                                  |         | Google    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | CSS Components    | [NextUI](https://nextui.org/)                                           |         | Vercel    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Styling             | Documentation     | [storybook](https://storybook.js.org/)                                  |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Client            | ~~[AngularJS](https://angularjs.org/)~~                                 |         | Google    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Client            | [Angular](https://angular.io/)                                          |         | Google    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Client            | [React](https://react.dev/)                                             |         | Meta      |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Client            | [Solid](https://www.solidjs.com/)                                       |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Client            | [Svelte](https://svelte.dev/)                                           |         | Vercel    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Client            | [Vue.js](https://vuejs.org/)                                            |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Server            | [Gatsby.js](https://gatsbyjs.org)                                       |         | Netlify   |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Server            | [Next.js](https://nextjs.org/)                                          |         | Vercel    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Server            | [Nuxt](https://nuxtjs.org/)                                             |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Server            | [SolidStart](https://start.solidjs.com)                                 |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Server            | [SvelteKit](https://kit.svelte.dev/)                                    |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Hybrid            | [Flutter](https://flutter.dev/)                                         |         | Google    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Hybrid            | [Ionic](https://ionicframework.com/)                                    |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Hybrid            | [NativeScript](https://nativescript.org/)                               |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Hybrid            | [React Native](https://reactnative.dev/)                                |         | Meta      |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Framework           | Desktop           | [Electron](https://www.electronjs.org/)                                 |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Testing             | e2e               | [cypress](https://www.cypress.io/)                                      |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Testing             | e2e               | [karma](https://karma-runner.github.io)                                 |         | Google    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Testing             | e2e               | [playwright](https://playwright.dev/)                                   |         | Microsoft |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Chart               |                   | [Charts.js](https://www.chartjs.org/)                                   |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Chart               |                   | [Chartist.js](https://gionkunz.github.io/chartist-js/)                  |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Chart               |                   | [D3.js](https://d3js.org/)                                              |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Chart               |                   | [Google Chart](https://developers.google.com/chart)                     |         | Google    |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Chart               |                   | [Highcharts](https://www.highcharts.com/)                               |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | Chart               | React             | [Recharts](https://recharts.org/)                                       |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | State Management    | React             | [Redux](https://redux.js.org/)                                          |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | State Management    | React             | [Redux Saga](https://redux-saga.js.org/)                                |         |           |
|     | Front-end    | [Node.js](https://nodejs.org/en)  | State Management    | React             | [Redux Thunk](https://www.npmjs.com/package/redux-thunk)                |         |           |
|     | Mobile       |                                   | Language            |                   | [Kotlin](https://kotlinlang.org/)                                       |         | JetBrains |
|     | Mobile       |                                   | Language            |                   | [Swift](https://developer.apple.com/swift/)                             |         | Apple     |
|     | Back-end     | [Java](https://www.java.com/en/)  | Framework           |                   | [Spring Boot](https://spring.io/projects/spring-boot)                   |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Framework           | GraphQL           | [Apollo GraphQL](https://www.apollographql.com/docs/apollo-server/)     |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Framework           |                   | [Express.js](https://expressjs.com/)                                    |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Framework           |                   | [Fastify](https://www.fastify.io/)                                      |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Framework           |                   | [Nest.js](https://nestjs.com/)                                          |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Framework           | WebSocket         | [Socket.io](https://socket.io/)                                         |         |           |
|     | Back-end     | [Python](https://www.python.org/) | Framework           |                   | [Django](https://www.djangoproject.com/)                                |         |           |
|     | Back-end     | [Python](https://www.python.org/) | Framework           |                   | [FastAPI](https://fastapi.tiangolo.com/)                                |         |           |
|     | Back-end     | [Python](https://www.python.org/) | Framework           |                   | [Flask](https://flask.palletsprojects.com/en/3.0.x/)                    |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Security            | Authentication    | [jsonwebtoken](https://jwt.io/)                                         |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Security            | Authentication    | [passport](https://www.passportjs.org/)                                 |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Security            | Protection        | [cors](https://github.com/expressjs/cors)                               |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Security            | Protection        | [helmet](https://helmetjs.github.io/)                                   |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | Swagger             | Documentation     | [tsoa](https://tsoa-community.github.io/docs/)                          |         |           |
|     | Back-end     |                                   | Database            | Key-Value         | [Redis](https://redis.io/)                                              | Caching |           |
|     | Back-end     |                                   | Database            | Key-Value         | [Memcached](https://memcached.org/)                                     | Caching |           |
|     | Back-end     |                                   | Database            | Wide Column       | [Cassandra](https://cassandra.apache.org/)                              | NoSQL   | Apache    |
|     | Back-end     |                                   | Database            | Wide Column       | [HBase](https://hbase.apache.org/)                                      | NoSQL   | Apache    |
|     | Back-end     |                                   | Database            | Document Oriented | [MongoDB](https://www.mongodb.com/)                                     | NoSQL   |           |
|     | Back-end     |                                   | Database            | Document Oriented | [CouchDB](https://couchdb.apache.org/)                                  | NoSQL   | Apache    |
|     | Back-end     |                                   | Database            | Relational        | [PostgreSQL](https://www.postgresql.org/)                               | SQL     |           |
|     | Back-end     |                                   | Database            | Relational        | [MySQL](https://www.mysql.com/)                                         | SQL     |           |
|     | Back-end     |                                   | Database            | Relational        | [CockroachDB](https://www.cockroachlabs.com/)                           | SQL     |           |
|     | Back-end     |                                   | Database            | Relational        | [SQLite](https://www.sqlite.org/)                                       | SQL     |           |
|     | Back-end     |                                   | Database            | Graph             | [neo4j](https://neo4j.com/)                                             |         |           |
|     | Back-end     |                                   | Database            | Search Engine     | [elasticsearch](https://www.elastic.co/elasticsearch)                   |         | Elastic   |
|     | Back-end     |                                   | Database            | Multi Model       | [FaunaDB](https://fauna.com/)                                           |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | ORM                 |                   | [Mongoose](https://mongoosejs.com/)                                     | NoSQL   |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | ORM                 |                   | [Prisma](https://www.prisma.io/)                                        |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | ORM                 |                   | [Sequelize](https://sequelize.org/)                                     |         |           |
|     | Back-end     | [Node.js](https://nodejs.org/en)  | ORM                 |                   | [TypeORM](https://typeorm.io/)                                          |         |           |
|     | Back-end     |                                   | Message Broker      |                   | [ActiveMQ](https://activemq.apache.org/)                                |         | Apache    |
|     | Back-end     |                                   | Message Broker      |                   | [Kafka](https://kafka.apache.org/)                                      |         | Apache    |
|     | Back-end     |                                   | Message Broker      |                   | [RabbitMQ](https://www.rabbitmq.com/)                                   |         |           |
|     | Data Science |                                   | Language            |                   | [R](https://www.r-project.org/)                                         |         |           |
|     | Data Science | [Python](https://www.python.org/) | Data Collection     |                   | [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/) |         |           |
|     | Data Science | [Python](https://www.python.org/) | Data Collection     |                   | [scrapy](https://scrapy.org/)                                           |         |           |
|     | Data Science | [Python](https://www.python.org/) | Data Exploration    |                   | [pandas](https://pandas.pydata.org/)                                    |         |           |
|     | Data Science | [Python](https://www.python.org/) | Data Exploration    |                   | [numpy](https://numpy.org/)                                             |         |           |
|     | Data Science | [Python](https://www.python.org/) | Data Visualization  |                   | [matplotlib](https://matplotlib.org/)                                   |         |           |
|     | Data Science | [Python](https://www.python.org/) | Machine Learning    |                   | [keras](https://keras.io/)                                              |         |           |
|     | Data Science | [Python](https://www.python.org/) | Machine Learning    |                   | [pytorch](https://pytorch.org/)                                         |         |           |
|     | Data Science | [Python](https://www.python.org/) | Machine Learning    |                   | [scikit-learn](https://scikit-learn.org/stable/)                        |         |           |
|     | Data Science | [Python](https://www.python.org/) | Machine Learning    |                   | [scipy](https://scipy.org/)                                             |         |           |
|     | Data Science | [Python](https://www.python.org/) | Machine Learning    |                   | [tensorflow](https://www.tensorflow.org/)                               |         | Google    |
|     | DevOps       |                                   | SaaS                | Version Control   | [GitHub](https://github.com/)                                           |         |           |
|     | DevOps       |                                   | SaaS                | Version Control   | [GitLab](https://about.gitlab.com/)                                     |         |           |
|     | DevOps       |                                   | Serverless          |                   | [Netlify](https://www.netlify.com/)                                     |         |           |
|     | DevOps       |                                   | Serverless          |                   | [Vercel](https://vercel.com)                                            |         |           |
|     | DevOps       |                                   | PaaS                |                   | [heroku](https://www.heroku.com/)                                       |         |           |
|     | DevOps       |                                   | PaaS                |                   | [render](https://render.com/)                                           |         |           |

#### DevOps

##### Servers

|        | nginx (Engine X)     | Apache HTTP Server   |
| ------ | -------------------- | -------------------- |
|        | Reverse Proxy Server |                      |
| Static | Yes                  | No                   |
| Speed  | Faster               |                      |
|        | URI locations        | Filesystem locations |

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

###### IaaS (Infrastructure as a Service)

| IaaS            |                                          | Amazon Web Services (AWS)           | Azure                                    | Google Cloud                | Digital Ocean               |
| --------------- | ---------------------------------------- | ----------------------------------- | ---------------------------------------- | --------------------------- | --------------------------- | --- |
| Compute         |                                          |                                     | Azure Virtual Machines (Linux & Windows) | Compute Engine              |                             |
|                 | Orchestration                            |                                     | Azure Kubernetes Service (AKS)           | Google Kubernetes Engine    |                             |
|                 |                                          |                                     |                                          |                             |                             |
|                 | PaaS                                     | AWS Elastic Beanstalk               | App Service                              | Google App Engine           | App Platform                |
|                 |                                          | Serverless                          |                                          | Azure Functions             | Cloud Functions             |     |
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

| No  | Group          | Country        | State                        | City         | University                             |
| --- | -------------- | -------------- | ---------------------------- | ------------ | -------------------------------------- |
| 01  | Group of Eight | Australia      | Australian Capital Territory | Acton        | Australian National University         |
| 02  | Group of Eight | Australia      | New South Wales              | Sydney       | University of New South Wales          |
| 03  | Group of Eight | Australia      | New South Wales              | Sydney       | University of Sydney                   |
| 04  | Group of Eight | Australia      | Queensland                   | Brisbane     | University of Queensland               |
| 05  | Group of Eight | Australia      | South Australia              | Adelaide     | University of Adelaide                 |
| 06  | Group of Eight | Australia      | Victoria                     | Melbourne    | University of Melbourne                |
| 07  | Group of Eight | Australia      | Victoria                     | Melbourne    | Monash University                      |
| 08  | Group of Eight | Australia      | Western Australia            | Perth        | University of Western Australia        |
| 09  | U15            | Canada         | Alberta                      | Edmonton     | University of Alberta                  |
| 10  | U15            | Canada         | Alberta                      | Calgary      | University of Calgary                  |
| 11  | U15            | Canada         | British Columbia             | Vancouver    | University of British Columbia         |
| 12  | U15            | Canada         | Manitoba                     | Winnipeg     | University of Manitoba                 |
| 13  | U15            | Canada         | Nova Scotia                  | Halifax      | Dalhousie University                   |
| 14  | U15            | Canada         | Ontario                      | Hamilton     | McMaster University                    |
| 15  | U15            | Canada         | Ontario                      | Ottawa       | University of Ottawa                   |
| 16  | U15            | Canada         | Ontario                      | Kingston     | Queen's University                     |
| 17  | U15            | Canada         | Ontario                      | Toronto      | University of Toronto                  |
| 18  | U15            | Canada         | Ontario                      | Waterloo     | University of Waterloo                 |
| 19  | U15            | Canada         | Ontario                      | London       | University of Western Ontario          |
| 20  | U15            | Canada         | Quebec                       | Quebec City  | Université Laval                       |
| 21  | U15            | Canada         | Quebec                       | Montreal     | McGill University                      |
| 22  | U15            | Canada         | Quebec                       | Montreal     | Université de Montréal                 |
| 23  | U15            | Canada         | Saskatchewan                 | Saskatoon    | University of Saskatchewan             |
| 24  |                | Singapore      |                              |              | National University of Singapore (NUS) |
| 25  |                | Singapore      |                              |              | Duke - NUS Medical School              |
| 26  |                | Singapore      |                              |              | Yale - NUS College                     |
| 27  | Russell        | United Kingdom | England                      | Cambridge    | University of Cambridge                |
| 28  | Russell        | United Kingdom | England                      | Oxford       | University of Oxford                   |
| 29  | Russell        | United Kingdom | England                      | London       | Imperial College London                |
| 30  | Russell        | United Kingdom | England                      | London       | King's College London                  |
| 31  | Russell        | United Kingdom | England                      | London       | London School of Economics             |
| 32  | Russell        | United Kingdom | England                      | London       | Queen Mary University of London        |
| 33  | Russell        | United Kingdom | England                      | London       | University College London              |
| 34  | Russell        | United Kingdom | England                      | Birmingham   | University of Birmingham               |
| 35  | Russell        | United Kingdom | England                      | Bristol      | University of Bristol                  |
| 36  | Russell        | United Kingdom | England                      | Durham       | Durham University                      |
| 37  | Russell        | United Kingdom | England                      | Exeter       | University of Exeter                   |
| 38  | Russell        | United Kingdom | England                      | Leeds        | University of Leeds                    |
| 39  | Russell        | United Kingdom | England                      | Liverpool    | University of Liverpool                |
| 40  | Russell        | United Kingdom | England                      | Manchester   | University of Manchester               |
| 41  | Russell        | United Kingdom | England                      | Newcastle    | Newcastle University                   |
| 42  | Russell        | United Kingdom | England                      | Nottingham   | University of Nottingham               |
| 43  | Russell        | United Kingdom | England                      | Sheffield    | University of Sheffield                |
| 44  | Russell        | United Kingdom | England                      | Southampton  | University of Southampton              |
| 45  | Russell        | United Kingdom | England                      | Coventry     | University of Warwick                  |
| 46  | Russell        | United Kingdom | England                      | York         | University of York                     |
| 47  | Russell        | United Kingdom | Northern Ireland             | Belfast      | Queen's University Belfast             |
| 48  | Russell        | United Kingdom | Scotland                     | Edinburgh    | University of Edinburgh                |
| 49  | Russell        | United Kingdom | Scotland                     | Glasgow      | University of Glasgow                  |
| 50  | Russell        | United Kingdom | Wales                        | Cardiff      | Cardiff University                     |
| 51  | Ivy League     | United States  | Rhode Island                 | Providence   | Brown University                       |
| 52  | Ivy League     | United States  | New York                     | New York     | Columbia University                    |
| 53  | Ivy League     | United States  | New York                     | Ithaca       | Cornell University                     |
| 54  | Ivy League     | United States  | New Hampshire                | Hanover      | Dartmouth College                      |
| 55  | Ivy League     | United States  | Massachusetts                | Cambridge    | Harvard University                     |
| 56  | Ivy League     | United States  | Pennsylvania                 | Philadelphia | University of Pennsylvania             |
| 57  | Ivy League     | United States  | New Jersey                   | Princeton    | Princeton University                   |
| 58  | Ivy League     | United States  | Connecticut                  | New Haven    | Yale University                        |
| 59  | Public Ivy     | United States  | California                   | Los Angeles  | University of California               |
| 60  | Public Ivy     | United States  | Texas                        | Austin       | University of Texas                    |
| 61  | Private School | United States  | North Carolina               | Durham       | Duke University                        |
| 62  | Private School | United States  | Massachusetts                | Cambridge    | MIT                                    |
| 63  | Private School | United States  | California                   | Stanford     | Stanford University                    |
| 64  | Private School | United States  | Maryland                     | Baltimore    | Johns Hopkins University               |
| 65  | Private School | United States  | California                   | Pasadena     | California Institute of Technology     |
| 66  | Private School | United States  | Indiana                      | South Bend   | University of Notre Dame               |

### Online

#### Blogs

- [Baeldung](https://www.baeldung.com/)
- [dev.to](https://dev.to/)
- [roadmap](https://roadmap.sh)

#### Coding Exercises

- [CodeWars](https://www.codewars.com/)
- [Codility](https://www.codility.com/)
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

| Category                   | Company                                                | Location                                 | Product        |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------- | -------------- |
|                            | [Alphabet](http://alphabet.com/)                       |                                          |                |
|                            | [Amazon](https://www.amazon.com/)                      |                                          |                |
|                            | [Meta](https://www.meta.com/)                          |                                          |                |
|                            | [Microsoft](https://www.microsoft.com)                 |                                          |                |
| Computational Neuroscience | [Kernel](https://www.kernel.com/)                      |                                          |                |
| Computational Neuroscience | [BrainGate](https://www.braingate.org/)                | Stanford, California, United States      |                |
| Computational Neuroscience | [Blackrock Neurotech](https://blackrockneurotech.com/) | Salt Lake City, Utah, United States      |                |
| Computational Neuroscience | [Neurable](https://neurable.com/)                      | Boston, Massachusetts, United States     |                |
| Computational Neuroscience | [BrainCo](https://brainco.tech/)                       | Boston, Massachusetts, United States     |                |
| Computational Neuroscience | [Neuralink](https://neuralink.com/)                    | Fremont, California, United States       |                |
|                            |                                                        | Austin, Texas, United States             |                |
| Computational Neuroscience | [Synchron](https://synchron.com/)                      | Brooklyn, New York, United States        |                |
|                            |                                                        | Melbourne, Victoria, Australia           |                |
| Computational Neuroscience | [Bitbrain](https://www.bitbrain.com/)                  | Zaragoza, Zaragoza, Spain                |                |
|                            |                                                        | New York City, New York, United States   |                |
| Computational Neuroscience | [Precision Neuroscience](https://precisionneuro.io/)   | Manhattan, New York, United States       |                |
|                            |                                                        | Mountain View, California, United States |                |
|                            |                                                        | Minneapolis, Minnesota, United States    |                |
| Computational Neuroscience | [Emotiv](https://www.emotiv.com/)                      | San Francisco, California, United States |                |
|                            |                                                        | Sydney, New South Wales, Australia       |                |
|                            |                                                        | Hanoi, Hanoi, Vietnam                    |                |
| Investment Banking         | Goldman Sachs                                          |                                          |                |
| Investment Banking         | J.P. Morgan                                            |                                          |                |
| Investment Banking         | Morgan Stanley                                         |                                          |                |
| Venture Capital            | [BlackRock](https://www.blackrock.com/)                |                                          | Index Fund     |
| Venture Capital            | [BlackStone](https://www.blackstone.com/)              |                                          | Private Equity |
| Venture Capital            | [Vanguard](https://www.vanguard.com)                   |                                          | Index Fund     |
