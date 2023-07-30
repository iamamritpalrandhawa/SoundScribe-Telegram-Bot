const fs = require("fs"); // Import the 'fs' module to handle file system operations
const path = require("path"); // Import the 'path' module to handle file paths

const ytdl = require("ytdl-core");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const downloadsFolder = path.join(__dirname, "downloads"); // Assuming the script is in the root folder

// Function to create the "downloads" folder if it doesn't exist
function createDownloadsFolder() {
  if (!fs.existsSync(downloadsFolder)) {
    fs.mkdirSync(downloadsFolder);
  }
}

async function fetchVideo(youtubeId, audioFileName) {
  return new Promise((resolve, reject) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const videoStream = ytdl(youtubeUrl, { quality: "highestaudio" });

    const ffmpegCommand = ffmpeg(videoStream)
      .audioBitrate(128)
      .toFormat("mp3")
      .save(audioFileName)
      .on("end", () => {
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      });

    ffmpegCommand.run();
  });
}

async function main(youtubeUrl, audioFileName) {
  const newName = path.join(downloadsFolder, `${audioFileName}.mp3`); // Set the output file path with extension

  createDownloadsFolder(); // Create the "downloads" folder before fetching the video
  // await fetchVideo(youtubeUrl, newName)
  //   .then(() => {
  //     console.log("Done");
  //     return newName;
  //   })
  //   .catch((err) => {
  //     console.log("Error", err);
  //   });
  try {
    await fetchVideo(youtubeUrl, newName);
    console.log("Done");
    return newName;
  } catch (err) {
    console.log("Error", err);
    throw err; // Rethrow the error to be handled by the caller
  }
}

// {
//   "dependencies": {
//     "@ffmpeg-installer/ffmpeg": "^1.1.0",
//     "fluent-ffmpeg": "^2.1.2",
//     "ytdl-core": "^4.11.4"
//   }
// }
// main("M31cR50hiCE", "Dunia")
module.exports = main;
