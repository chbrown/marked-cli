# marked-cli

`marked-cli` is a Node.js package that provides a command-line interface
for the [`marked`](https://github.com/chjj/marked) markdown parser and compiler,
with fewer/simpler options than the CLI provided by `marked`.


## Instructions

Convert markdown to HTML and prefix with a global header.

    md README.md README.html

If an output file is provided (otherwise, `md` uses `/dev/stdout`),
it will be opened in your browser after the conversion is complete (via the `open` executable).

You can pipe markdown into `md`. The example below dumps the HTML to a temporary file and opens it in Firefox.

    pbpaste | md > /tmp/pasteboard.html
    open -a Firefox.app /tmp/pasteboard.html

The header filepath defaults to `~/.standardhead.html`.


## License

Copyright 2013-2018 Christopher Brown.
[MIT Licensed](https://chbrown.github.io/licenses/MIT/#2013-2018).
