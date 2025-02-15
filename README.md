# Frugal

[![tag](https://img.shields.io/github/v/tag/PaulBlanche/frugal)](https://deno.land/x/frugal)
[![codecov](https://codecov.io/gh/PaulBlanche/frugal/branch/dev/graph/badge.svg?token=F5PV06R9V1)](https://codecov.io/gh/PaulBlanche/frugal)
[![license](https://img.shields.io/github/license/PaulBlanche/frugal)](https://github.com/PaulBlanche/frugal/blob/main/LICENSE)

Frugal is a hybrid, dynamic and static site generator that aims to minimize the amount of JavaScript served, thanks to partial hydration:

- _Static pages rendered at build time_: by default Frugal produces static HTML
- _Server side pages_ rendered at request time
- _Bring your own framework_: Frugal works with any UI framework able to compile to HTML
- _Manual partial hydration_ for interactive island in pages if you use Preact
- _Client-side and server-side form submission_ for both static and dynamic pages
- _Incremental build_: if both data and code did not change, the page is not rebuilt
- _Client session_: transform your MPA into a SPA at little cost

## Getting Started

Visit the [Getting started pages](https://frugal.deno.dev/doc@0.9/getting-started) to get started with Frugal.

## Documentation

The docs are live at https://frugal.deno.dev/doc@latest.

## Why?

Modern web development is geared toward delivering more JavaScript. JSX and client-side navigation enabling larger codebase and optimized with code splitting. Each new optimization is not used to make the web faster, but rather to send more.

Don't get me wrong, those tools and optimizations are fantastic (and Frugal relies on them). But somewhere along the way, we kinda lost ourselves.

The idea is to keep most of the developer experience of those tools (JSX, CSS in JS), but ship everything static in HTML and css and keep the dynamic parts in JS.

That's the difference between Frugal and Next.js for example. Next.js will bundle the whole JSX (even the static parts), and ships it alongside a static rendering in HTML. So everything static is sent twice: one time in the HTML, and then in uncompressed form in the JS bundle. The browser has to render it twice: one time with the HTML, and then by parsing and executing a JS bundle that mutate the DOM.

With Frugal, we lose the ability to do client-side navigation, because the JS does not have all the information to render the pages we navigate to (since only the dynamic parts are in the JS), but we make it up by having small cacheable pages (as a result, round trips to the server are quick and infrequent).

Compared to Next.js, Frugal is less opinionated:

- No filesystem-based router, you are free to organize your codebase your own way
- Static page refresh is done on demand via webhook, rather than on each visit
- Frugal is frontend-framework agnostic, as long as you can return a string, it will be happy
- Integration with Preact is completely optional
