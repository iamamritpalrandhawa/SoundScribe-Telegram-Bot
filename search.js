// // tempindex.js

// // const { searchMusics } = require('node-youtube-music');

// // tempindex.mjs
// // tempindex.mjs
// These lines make "require" available
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { searchMusics } from "node-youtube-music";

const fun = async (Songname) => {
  const musics = await searchMusics(Songname);
  return musics;
};
export default fun;
