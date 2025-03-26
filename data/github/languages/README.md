# Languages

## Table of Content

- [Languages](#languages)
  - [Table of Content](#table-of-content)
  - [0. Overview](#0-overview)
  - [1. JavaScript as Swiss Army Knives](#1-javascript-as-swiss-army-knives)
  - [2. Java - Write Once Run Everywhere](#2-java---write-once-run-everywhere)
  - [3. Go for CLI](#3-go-for-cli)
  - [4. Python for Data Science](#4-python-for-data-science)
  - [5. C / C++ for Game Development](#5-c--c-for-game-development)
  - [6. Swift for iOS Development](#6-swift-for-ios-development)
  - [7. Kotlin for Android Development](#7-kotlin-for-android-development)
  - [8. C# for Windows Desktop Development](#8-c-for-windows-desktop-development)
  - [9. Dart with Flutter for Cross-platform Development](#9-dart-with-flutter-for-cross-platform-development)
  - [10. Ruby on Rails for Full-stack Web Development](#10-ruby-on-rails-for-full-stack-web-development)

## 0. Overview

- `IDE` : Integrated Development Environment

| No  | Type        | Language           | Superset         | IDE                              | Runtime            | Packages (Registry / Manager)     | Linter               | Formatter                | Build Tools      | OS     | CLI                    | Web                | Mobile                       | Desktop            | Game                 | Back-end           | Full-stack         | Mathematics        | Machine Learning       | Best Usage        |
| --- | ----------- | ------------------ | ---------------- | -------------------------------- | ------------------ | --------------------------------- | -------------------- | ------------------------ | ---------------- | ------ | ---------------------- | ------------------ | ---------------------------- | ------------------ | -------------------- | ------------------ | ------------------ | ------------------ | ---------------------- | ----------------- |
| 00  | Programming | Assembly           |                  |                                  | Binary             |                                   |                      |                          |                  |        |                        |                    |                              |                    |                      |                    |                    |                    |                        | Low Level         |
| 01  | Programming | C                  | C++              | [CLion][clion]                   | Binary             |                                   |                      |                          |                  | Kernel |                        |                    |                              |                    | [Unreal][unreal]     |                    |                    |                    |                        | Game              |
| 02  | Programming | [Rust][rust]       |                  | [Rust][rust-rover]               | Binary             | [Crates][crates] / [Cargo][cargo] |                      |                          |                  | Kernel |                        |                    |                              |                    |                      |                    |                    |                    |                        | Operating System  |
| 03  | Programming | [Go][go]           |                  | [GoLand][goland]                 | Binary             | [Go Packages][go-pkg]             |                      |                          |                  |        | [Cobra][cobra]         |                    |                              |                    |                      | [Gin][gin]         |                    |                    |                        | CLI               |
| 04  | Programming | [Dart][dart]       |                  | [VS Code][vscode]                |                    | [pub][pub]                        |                      |                          |                  |        |                        | [Flutter][flutter] | [Flutter][flutter]           | [Flutter][flutter] |                      |                    |                    |                    |                        | Cross             |
| 05  | Programming | [Swift][swift]     |                  | [XCode][xcode]                   |                    |                                   |                      |                          |                  |        |                        |                    | [iOS][ios]                   |                    |                      |                    |                    |                    |                        | iOS               |
| 06  | Programming | [Kotlin][kotlin]   |                  | [Android Studio][android-studio] | JVM                | [Maven][maven]                    |                      |                          |                  |        |                        |                    | [Android][android]           |                    |                      | [Spring][spring]   |                    |                    |                        | Android           |
| 07  | Programming | [Scala][scala]     |                  | [IDEA][idea]                     | JVM                | [Maven][maven]                    |                      |                          |                  |        |                        |                    |                              |                    |                      | [Play][play]       |                    |                    |                        | BE                |
| 08  | Programming | [Java][java]       |                  | [IDEA][idea]                     | JVM                | [Maven][maven]                    | [SpotBugs][spotbugs] | [Checkstyle][checkstyle] | [Gradle][gradle] |        |                        |                    | [Android][android]           | [JavaFX][javafx]   |                      | [Spring][spring]   |                    |                    |                        | BE                |
| 09  | Programming | [JavaScript][js]   | [TypeScript][ts] | [VS Code][vscode]                | [Node.js][node.js] | [NPM][npm] / [Yarn][yarn]         | [ESLint][eslint]     | [Prettier][prettier]     | [Turbo][turbo]   |        | [Commander][commander] | [React][react]     | [React Native][react-native] | [Tauri][tauri]     | [three.js][three.js] | [tRPC][trpc]       | [Next.js][next.js] | [math.js][math.js] | [TensorFlow.js][tf.js] | FS                |
| 10  | Programming | [PHP][php]         |                  | [PhpStorm][php-storm]            |                    | [Composer][composer]              |                      |                          |                  |        |                        |                    |                              |                    |                      |                    | [Laravel][laravel] |                    |                        | FS                |
| 11  | Programming | [Ruby][ruby]       |                  | [RubyMine][ruby-mine]            |                    | [Gems][gems]                      |                      |                          |                  |        |                        |                    |                              |                    |                      |                    | [Rails][rails]     |                    |                        | FS                |
| 12  | Programming | [C#][csharp]       |                  | [VS][vs]  - [Rider][rider]       |                    | [Nuget][nuget]                    |                      |                          |                  |        |                        |                    |                              | [UWP][uwp]         | [Unity][unity]       |                    | [.NET][dotnet]     |                    |                        | Windows           |
| 13  | Programming | [MatLab][matlab]   |                  | [VS Code][vscode]                |                    |                                   |                      |                          |                  |        |                        |                    |                              |                    |                      |                    |                    |                    |                        | Mathematics       |
| 14  | Programming | [Python][python]   |                  | [PyCharm][pycharm]               |                    | [Conda][conda]                    |                      |                          |                  |        |                        |                    |                              |                    |                      | [FastAPI][fastapi] | [Django][django]   | [NumPy][numpy]     | [TensorFlow][tf]       | Machine Learninng |
| 15  | Programming | [R][r]             |                  | [PyCharm][pycharm]               |                    |                                   |                      |                          |                  |        |                        |                    |                              |                    |                      |                    |                    |                    |                        | Statistics        |
| 16  | Data        | SQL                |                  | [DataGrip][datagrip]             |                    |                                   |                      |                          |                  |        |                        |                    |                              |                    |                      |                    |                    |                    |                        | Data Query        |
| 17  | Data        | [GraphQL][graphql] |                  | [VS Code][vscode]                |                    |                                   |                      |                          |                  |        |                        |                    |                              |                    |                      |                    |                    |                    |                        | API Gateway       |
| 18  | Data        | JSON               |                  | [VS Code][vscode]                |                    |                                   |                      |                          |                  |        |                        |                    |                              |                    |                      |                    |                    |                    |                        | API Response      |
| 19  | Data        | XML                |                  | [VS Code][vscode]                |                    |                                   |                      |                          |                  |        |                        |                    |                              |                    |                      |                    |                    |                    |                        |                   |
| 20  | Data        | [YAML][yaml]       |                  | [VS Code][vscode]                |                    |                                   |                      |                          |                  |        |                        |                    |                              |                    |                      |                    |                    |                    |                        | App Configuration |

[Back to Table of Content](#table-of-content)

## 1. JavaScript as Swiss Army Knives

JavaScript's ubiquitous presence across web development owes much to its vibrant community. Through collaborative efforts, developers contribute libraries, frameworks, and tools that extend JavaScript's capabilities. This community-driven ecosystem fosters innovation and ensures JavaScript's relevance in diverse domains, from front-end web development to server-side programming and beyond.

- IDE and Code Editors
  - [Fleet][fleet] by [JetBrains][jetbrains]
  - [WebStorm][webstorm] by [JetBrains][jetbrains]
  - [SublimeText][sublimetext] by [Sublime HQ][sublimehq]
  - [Zed][zed] by [Zed Industries][zed]
  - [IDX][idx] by [Google][google]

[Back to Table of Content](#table-of-content)

## 2. Java - Write Once Run Everywhere

Java is a versatile, object-oriented programming language developed by Sun Microsystems (now owned by Oracle). Known for its platform independence, robustness, and vast ecosystem, Java is widely used for building desktop, web, mobile, and enterprise applications. Its key features include portability, automatic memory management, and multithreading support.

- IDE and Code Editors
  - [Eclipse][eclipse] by [Eclipse Foundation][ef]
  - [NetBeans][netbeans] by  [Apache][apache]
- Packages Managers
  - [JFrog](https://jfrog.com)

[Back to Table of Content](#table-of-content)

## 3. Go for CLI

Go, or Golang, is an excellent choice for building Command-Line Interface (CLI) tools due to its simplicity, efficiency, and cross-platform support. With its built-in standard library, Go enables developers to create robust CLI applications quickly. Go's static binaries ensure easy distribution and deployment across different operating systems.

[Back to Table of Content](#table-of-content)

## 4. Python for Data Science

Python is a leading choice for data science due to its simplicity, versatility, and rich ecosystem of libraries and tools. Packages like NumPy, Pandas, and Matplotlib facilitate data manipulation, analysis, and visualization, while frameworks like TensorFlow and PyTorch enable deep learning and machine learning applications, making Python indispensable in data science workflows.

[Back to Table of Content](#table-of-content)

## 5. C / C++ for Game Development

C and C++ are widely used for game development due to their performance and low-level control. C/C++'s efficiency allows developers to create high-performance graphics engines, physics simulations, and real-time systems. With libraries like OpenGL and DirectX, they power many AAA games, game engines, and game development frameworks.

[Back to Table of Content](#table-of-content)

## 6. Swift for iOS Development

Swift is a modern, concise, and powerful programming language developed by Apple for building iOS, macOS, watchOS, and tvOS applications. Introduced in 2014, Swift offers safety, speed, and expressiveness with features such as type inference, optionals, generics, and closures, making it the preferred choice for Apple platform development.

[Back to Table of Content](#table-of-content)

## 7. Kotlin for Android Development

Kotlin is a modern, statically-typed programming language developed by JetBrains. Designed to be concise, expressive, and interoperable with Java, Kotlin is used for building Android, web, server-side, and desktop applications. Its features include null safety, extension functions, data classes, and seamless integration with existing Java codebases.

[Back to Table of Content](#table-of-content)

## 8. C# for Windows Desktop Development

C# is a versatile, object-oriented programming language developed by Microsoft. Known for its simplicity, power, and rich features, C# is widely used for building Windows applications, web services, games, and enterprise software. It offers strong typing, garbage collection, LINQ, and seamless integration with the .NET framework.

Examples:

- Unity
  - [Monument Valley][monumentvalleygame]

[Back to Table of Content](#table-of-content)

## 9. Dart with Flutter for Cross-platform Development

Dart is a client-optimized programming language developed by Google, known for its simplicity and performance. Flutter is an open-source UI toolkit also developed by Google, based on Dart, for building natively compiled applications for mobile, web, and desktop from a single codebase. Together, they empower cross-platform development with ease.

[Back to Table of Content](#table-of-content)

## 10. Ruby on Rails for Full-stack Web Development

Ruby on Rails, often simply called Rails, is a popular web application framework written in the Ruby programming language. It emphasizes convention over configuration and follows the Model-View-Controller (MVC) pattern. With its elegant syntax and powerful features, Rails enables rapid development of robust and scalable web applications.

[Back to Table of Content](#table-of-content)

[android]: https://developer.android.com
[android-studio]: https://developer.android.com/studio/
[apache]: https://www.apache.org
<!-- [apple]: https://developer.apple.com -->
[cargo]: https://doc.rust-lang.org/stable/cargo/
[checkstyle]: https://checkstyle.org
[cobra]: https://cobra.dev
[commander]: https://github.com/tj/commander.js
[clion]: https://www.jetbrains.com/clion/
[composer]: https://getcomposer.org
[conda]: https://conda.io
[crates]: https://crates.io
[csharp]: https://dotnet.microsoft.com/en-us/languages/csharp/
[dart]: https://dart.dev
[datagrip]: https://www.jetbrains.com/datagrip/
[django]: https://www.djangoproject.com
[dotnet]: https://dotnet.microsoft.com
[eclipse]: https://eclipseide.org
[ef]: https://www.eclipse.org/org/foundation/
[eslint]: https://eslint.org
[fastapi]: https://fastapi.tiangolo.com
[fleet]: https://www.jetbrains.com/fleet/
[flutter]: https://flutter.dev
[gems]: https://rubygems.org
[gin]: https://gin-gonic.com
[go]: https://go.dev
[go-pkg]: https://pkg.go.dev
[goland]: https://www.jetbrains.com/go/
[google]: https://google.com
[gradle]: https://gradle.org
[graphql]: https://graphql.org
[idea]: https://www.jetbrains.com/idea/
[idx]: https://idx.dev
[ios]: https://www.apple.com/ios/
[java]: https://www.java.com
[javafx]: https://openjfx.io
[jetbrains]: https://www.jetbrains.com
[js]: https://ecma-international.org/publications-and-standards/standards/ecma-262/
[kotlin]: https://kotlinlang.org
[laravel]: https://laravel.com
[math.js]: https://mathjs.org
[matlab]: https://www.mathworks.com/products/matlab.html
[maven]: https://maven.apache.org
<!-- [microsoft]: https://www.microsoft.com -->
<!-- [meta]: https://developers.facebook.com -->
[monumentvalleygame]: https://www.monumentvalleygame.com
[netbeans]: https://netbeans.apache.org
[next.js]: https://nextjs.org
[node.js]: https://nodejs.org
[npm]: https://www.npmjs.com
[nuget]: https://www.nuget.org
[numpy]: https://numpy.org
<!-- [oracle]: https://www.oracle.com -->
[php]: https://www.php.net
[php-storm]: https://www.jetbrains.com/phpstorm/
[play]: https://www.playframework.com
[prettier]: https://prettier.io
[pub]: https://pub.dev
[pycharm]: https://www.jetbrains.com/pycharm/
[python]: https://www.python.org
[r]: https://www.r-project.org
[rails]: https://rubyonrails.org
[react]: https://react.dev
[react-native]: https://reactnative.dev
[rider]: https://www.jetbrains.com/rider/
[ruby]: https://www.ruby-lang.org
[ruby-mine]: https://www.jetbrains.com/ruby/
[rust]: https://www.rust-lang.org
[rust-rover]: https://www.jetbrains.com/rust/
[scala]: https://www.scala-lang.org
[spotbugs]: https://spotbugs.github.io
[spring]: https://spring.io
[sublimehq]: https://www.sublimehq.com
[sublimetext]: https://www.sublimetext.com
[swift]: https://developer.apple.com/swift/
[tauri]: https://tauri.app
[tf]: https://www.tensorflow.org
[tf.js]: https://www.tensorflow.org/js
[three.js]: https://threejs.org
[trpc]: https://trpc.io
[ts]: https://www.typescriptlang.org
[turbo]: https://turbo.build
[unity]: https://unity.com
[unreal]: https://www.unrealengine.com
[uwp]: https://learn.microsoft.com/en-us/windows/uwp/
[vs]: https://visualstudio.microsoft.com
[vscode]: https://code.visualstudio.com
[webstorm]: https://www.jetbrains.com/webstorm/
[xcode]: https://developer.apple.com/xcode/
[yaml]: https://yaml.org
[yarn]: https://yarnpkg.com
[zed]: https://zed.dev
