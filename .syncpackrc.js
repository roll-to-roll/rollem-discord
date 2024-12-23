// @ts-check

/** @type {import("syncpack").RcFile} */
const config = {
  // Local packages appear to always be 'LocalDependencyMismatch'
  dependencyTypes: ["!local"],

  // The scripts are sectioned, and so sorting them throws out the order.
  sortAz: [
    "bin",
    "contributors",
    "dependencies",
    "devDependencies",
    "keywords",
    "peerDependencies",
    "resolutions",
  ],

  versionGroups: [
    {
      // default to lowest
      "packages": ["**"],
      "dependencies": ["**"],
      "dependencyTypes": ["**"],
      "preferVersion": "lowestSemver"
    },
    {
      // https://jamiemason.github.io/syncpack/examples/only-allow-types-in-dev-dependencies/
      dependencies: ["@types/**"],
      dependencyTypes: ["!dev"],
      isBanned: true,
      label: "@types packages should only be under devDependencies.",
    },
  ],
};


// https://jamiemason.github.io/syncpack/config/syncpackrc/
module.exports = config;
