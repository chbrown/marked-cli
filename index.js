#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const stream = require('stream')
const child_process = require('child_process')

const marked = require('marked')
const optimist = require('optimist')

/** Basically copy & pasted from github.com/chbrown/streaming/index.js */
function readToEnd(stream, callback) {
  const chunks = []
  return stream
    .on('error', callback)
    .on('data', chunk => chunks.push(chunk))
    .on('end', () => callback(null, chunks))
}

function render(inputStream, outputStream, callback) {
  readToEnd(inputStream, (err, chunks) => {
    if (err) return callback(err)

    const inputString = Buffer.concat(chunks).toString('utf8')
    marked(inputString, {}, (err, outputHtml) => {
      if (err) return callback(err)

      outputStream.write(outputHtml)
      callback()
    })
  })
}

function inferInputStream(name) {
  if (!process.stdin.isTTY || name == '-') {
    return process.stdin
  }
  else if (name) {
    return fs.createReadStream(name)
  }
  else {
    throw new Error('You must specify some Markdown input')
  }
}

function inferOutputStream(name) {
  if (name && name != '-') {
    return fs.createWriteStream(name)
  }
  else {
    return process.stdout
  }
}

function coerceReadStream(name, callback) {
  const readStream = fs.createReadStream(name)
    .on('error', () => {
      // the error would be a {errno: -2, code: 'ENOENT', syscall: 'open', path: name}
      // but we don't really care
      const emptyStream = new stream.Readable()
      emptyStream.push(null)
      callback(null, emptyStream)
    })
    .on('open', () => {
      callback(null, readStream)
    })
}

function endIfNeeded(stream) {
  if (stream != process.stdout) {
    stream.end()
  }
}

function openIfPossible(name) {
  if (name && name != '-') {
    child_process.exec(`open ${name}`, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr)
        throw err
      }
      console.error(`open'ed ${name}`)
    })
  }
}

function main() {
    const argvparser = optimist.usage(`
Usage: md README.md README.html
       md <README.md >README.html

Render Markdown to html, prefixing it with an HTML header.

1. If the first argument is specified and is not "-", md reads input from that path.
   Otherwise, md reads from stdin.
2. If the second argument is specified and is not "-", md writes output to that path.
   Otherwise, md writes to stdout.

The contents of the file indicated by the --head option, if it exists,
will be prepended to the HTML output.`)
  .describe({
    head: 'Header HTML',
    help: 'print this help message',
  })
  .boolean(['help'])
  .default({
    head: path.join(process.env.HOME, '.standardhead.html'),
  })

  const argv = argvparser.argv

  if (argv.help) {
    argvparser.showHelp()
    process.exit(0)
  }

  const [argvInput, argvOutput] = argv._

  const inputStream = inferInputStream(argvInput)
  const outputStream = inferOutputStream(argvOutput)

  coerceReadStream(argv.head, (err, headReadStream) => {
    if (err) {
      console.error(err)
      throw err
    }
    headReadStream.on('end', () => {
      render(inputStream, outputStream, err => {
        if (err) {
          console.error(err)
          throw err
        }
        endIfNeeded(outputStream)
        openIfPossible(argvOutput)
      })
    })
    .pipe(outputStream, {end: false})
  })
}

if (require.main == module) {
  main()
}
