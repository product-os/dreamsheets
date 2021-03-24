# product-os-gsheet-utils
Extraction of common App Script / JS / TS functions to support balena data models in GSheets

## Development 

CI-less local workflow for windows, (should also work on mac and linux)

```bash
$ cd ./balena/product-os/gsheet-utils
$ npm install
$ npm link


$ cd ./path-to/my-new/example-model-repo
$ npm install
$ npm link @balena/gsheet-utils

# now make changes to gsheet-utils, build them and then test them in data-library-mvp-examples
