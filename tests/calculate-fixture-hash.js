#!/usr/bin/env node
'use strict'

const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

// Calculate SHA256 of test fixture
const fixturePath = path.join(__dirname, 'fixtures', 'gitleaks-test-binary')
const fixtureContent = fs.readFileSync(fixturePath)
const fixtureSHA256 = crypto
  .createHash('sha256')
  .update(fixtureContent)
  .digest('hex')

console.log('Test fixture path:', fixturePath)
console.log('Test fixture size:', fixtureContent.length, 'bytes')
console.log('Test fixture SHA256:', fixtureSHA256)

// Show sample of content
console.log('Content preview:')
console.log(fixtureContent.toString().slice(0, 200))
