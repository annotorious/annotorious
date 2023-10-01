## Contributing

Annotorious aims to be a community project - we welcome your involvement!

When contributing, please attempt to match the code style already in the codebase. If you are new to the 
project, please check out the [project Website for the 2.x version of Annotorious](https://annotorious.github.io/) first. 

If you're new to open source in general, check out [GitHub's open source intro guide](https://guides.github.com/activities/contributing-to-open-source/).

## Setup

1. Install a recent version of Node and npm
2. Clone this repository
3. Install project dependencies by running `npm install` in the project directory

## Repository Structure

This repository is a [monorepo](https://dev.to/limal/simplify-your-monorepo-with-npm-7-workspaces-5gmj), which
means it contains multiple JavaScript modules. We are using [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) to manage the monorepo.

### Main Packages: @annotorious/annotorious and @annotorious/openSeadragon

The main packages are located in these folders:

- `packages/annotorious`. The main Annotorious JavaScript library, and the future successor to the [current standard version](https://annotorious.github.io/getting-started/). 
- `packages/annotorious-openseadragon`. The Annotorious plugin for the [OpenSeadragon viewer for zoomable images](http://openseadragon.github.io/), and the future successor to the [current version of the Annotorious OpenSeadragon plugin](https://annotorious.github.io/getting-started/osd-plugin/)

To start developing, enter the folder, run `npm start` and point your browser to <http://localhost:5173/test/index.html>. To compile the distribution bundle, run `npm run build`.

Furthermore, there these additional modules:

- `packages/annotorious-core`. Core components used by both Annotorious and Annotorious OpenSeadragon.
- `packages/annotorious-formats`. Additional annotation data formats.
- `packages/annotorious-react`. A native React integration for Annotorious and Annotorious OpenSeadragon.

