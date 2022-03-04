<div align="center">
  <img width="400" height="auto" src="https://raw.githubusercontent.com/product-os/dreamsheets/master/icon.png">
  <br>
  <br>

[![npm version](https://badge.fury.io/js/dreamsheets.svg)](https://badge.fury.io/js/dreamsheets)

  <p>
    Makes working with Google sheets a dream!
    <br>
    https://product-os.github.io/dreamsheets
  </p>
  <br>
  <br>
</div>

Dreamsheets is a simple, easy to use, and powerful tool for managing your Google Sheets through Google App Scripts.

## Installation

Install by running:

```sh
npm install --save dreamsheets
```

## Usage

For example, you can read from a sheet like this:

```javascript
import { readSheet } from "dreamsheets";

const mySheetData = readSheet("Sheet Name", { range: "A1:Z100" });
```

## Documentation

[![Publish Documentation](https://github.com/product-os/dreamsheets/actions/workflows/publish-docs.yml/badge.svg)](https://github.com/product-os/dreamsheets/actions/workflows/publish-docs.yml)

Visit the website for complete documentation: https://product-os.github.io/dreamsheets

## Development

CI-less local workflow for windows, (should also work on mac and linux)

```bash
$ cd ./dreamsheets
$ npm install
$ npm link


$ cd ./path-to/my-new/example-model-repo
$ npm install
$ npm link dreamsheets

# now make changes to dreamsheets, build them and then test them
```

## License

The project is licensed under the Apache-2.0 license.

The icon at the top of this file is provided by
[svgrepo.com](https://www.svgrepo.com/svg/206802/sheep) and is
licensed under [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/).
