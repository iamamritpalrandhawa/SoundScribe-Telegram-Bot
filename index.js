// // index.js

import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fun from "./search.js";
const fs = require("fs");
const { Telegraf } = require("telegraf");
const downloader = require("./downloader.cjs");
const connectToMongo = require("./db.cjs");
const User = require("./Modals/User.cjs");
const Song = require("./Modals/Song.cjs");
const Download_History = require("./Modals/History.cjs");

// const axios = require("axios");
const bot = new Telegraf("6696254467:AAEDrUt9gjAYDrgeN9_RNnZz4UjzQSs4SLk");
connectToMongo();
let userResults = new Map();
// Replace './models' with the path to your models file

// ...

// Modify the bot.start handler
bot.start(async (ctx) => {
  // Extract user information from the context
  const { first_name, last_name, username, id: user_id } = ctx.from;

  // Create or update the user in the database
  try {
    const user = await User.findOneAndUpdate(
      { User_ID: user_id },
      {
        First_Name: first_name,
        Last_Name: last_name,
        Username: username,
        Chat_ID: ctx.chat.id, // Store the chat ID (optional)
      },
      { upsert: true, new: true }
    );

    // Send a welcome message to the user
    ctx.sendMessage(
      `*Hello ${first_name}*\nI'm a *Sound Scribe Bot*\n\nSend me the name of a song, and I'll send you the song in the highest quality.`,
      {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id,
      }
    );
  } catch (err) {
    // Handle any errors that occur during database operations
    console.error("Error storing user details:", err);
    ctx.reply("Oops! Something went wrong. Please try again later.");
  }
});

// Store results for each user

bot.on("text", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    // Set initial values for each user
    userResults.set(chatId, {
      results: await fun(ctx.message.text),
      currentIndex: 0,
    });

    // Send the message with the inline keyboard and data for the "Download ⏬" button
    sendSongMessage(ctx, chatId);
  } catch (err) {
    console.error("Error in bot.on('text') handler:", err);
    ctx.reply("Oops! Something went wrong. Please try again later.");
  }
});

bot.action("next_song", async (ctx) => {
  // ctx.deleteMessage();
  const chatId = ctx.chat.id;
  let userResult = userResults.get(chatId);
  if (userResult) {
    userResult.currentIndex++;
    userResults.set(chatId, userResult);
    // ... Your other code ...
    // Send the updated message with the inline keyboard and data for the "Download ⏬" button
    sendSongMessage(ctx, chatId);
  }
});

bot.action("previous_song", async (ctx) => {
  // ctx.deleteMessage();
  const chatId = ctx.chat.id;
  let userResult = userResults.get(chatId);
  if (userResult) {
    userResult.currentIndex--;
    userResults.set(chatId, userResult);
    // ... Your other code ...
    // Send the updated message with the inline keyboard and data for the "Download ⏬" button
    sendSongMessage(ctx, chatId);
  }
});

async function sendSongMessage(ctx, chatId) {
  let userResult = userResults.get(chatId);
  if (userResult) {
    const i = userResult.currentIndex;
    const result = userResult.results;
    if (i >= 0 && i < result.length) {
      let message = `
<b>Song Name:</b> ${result[i].title}
<b>Artists:</b> ${result[i].artists[0].name}
<b>Duration:</b> ${result[i].duration.label}
<b>Album:</b> ${result[i].album}
<a  href="${result[i].thumbnailUrl}">&#8205;</a>
      `;

      let inlineKeyboard = [
        [
          { text: " ⏮️ Previous", callback_data: "previous_song" },
          { text: "Next ⏭️", callback_data: "next_song" },
        ],
        [
          {
            text: " ⏮️ Play Online",
            url: `https://sound-scribe.vercel.app/musicplayer/${result[i].youtubeId}`,
          },
          // { text: " ⏮️ Play Online", url: `https://www.google.com` }
        ],
        [
          {
            text: "Download ⏬",
            callback_data: `${result[i].youtubeId},${result[i].title}`,
          },
        ],
      ];

      if (i === 0) {
        inlineKeyboard[0].shift(); // Remove the "Previous" button if it's the first song
      }

      // Check if this is the first time sending a message to the user
      if (!userResult.messageId) {
        // Send the initial message
        const sentMessage = await bot.telegram.sendMessage(
          ctx.chat.id,
          message,
          {
            parse_mode: "HTML", // Use HTML parse mode
            reply_markup: {
              inline_keyboard: inlineKeyboard,
            },
          }
        );
        userResult.messageId = sentMessage.message_id; // Store the message ID for future edits
        userResults.set(chatId, userResult); // Update the user's result with the message ID
      } else {
        // Edit the existing message with the updated song information and inline keyboard
        bot.telegram.editMessageText(
          ctx.chat.id,
          userResult.messageId,
          null,
          message,
          {
            parse_mode: "HTML", // Use HTML parse mode
            reply_markup: {
              inline_keyboard: inlineKeyboard,
            },
          }
        );
      }
    } else {
      ctx.reply("I have shown all the related data of your message.");
    }
  }
}

async function sendAudioToUser(ctx, audioFilePath, title) {
  try {
    // Read the audio file from the file system
    const audioFile = fs.readFileSync(audioFilePath);
    // Send the audio to the user and get the sent message object
    const sentMessage = await bot.telegram.sendAudio(ctx.chat.id, {
      source: audioFile,
      filename: `${title}.mp3`,
    });

    // Get the file_id from the audio field in the sent message
    const file_id = sentMessage.audio.file_id;

    // Delete the audio file from the downloads folder
    fs.unlink(audioFilePath, (err) => {
      if (err) {
        console.error("Error deleting audio file:", err);
      } else {
        console.log("Audio file deleted:", audioFilePath);
      }
    });

    // Return the file_id
    return file_id;
  } catch (error) {
    console.error("Error sending audio to user:", error);
    return null; // Return null in case of an error
  }
}

bot.action(/([-_a-zA-Z0-9]{11}),(.*?)$/, async (ctx) => {
  try {
    ctx.answerCbQuery("Download link will be sent shortly."); // This will display a notification to the user.
    const callbackData = ctx.match[0].split(",");
    const youtubeId = callbackData[0];
    const title = callbackData[1];
    let newSong = "";

    // Check if the youtubeId is present in the database
    const song = await Song.findOne({ YouTube_ID: youtubeId });

    if (song && song.File_ID) {
      // If the youtubeId is present and has a file_id, send the audio to the user using the stored file_id
      const file_id = song.File_ID; // Replace 'file_id_here' with the actual file_id
      await bot.telegram.sendAudio(ctx.chat.id, file_id);
    } else {
      // If the youtubeId is not present in the database, download the audio and store the details in the database
      const audioFilePath = await downloader(youtubeId, title);

      // Send the downloaded audio to the user and get the file_id
      const file_id = await sendAudioToUser(
        ctx,
        `downloads/${title}.mp3`,
        title
      );

      // Save the youtubeId and file_id in the Song model
      if (!song) {
        newSong = new Song({
          YouTube_ID: youtubeId,
          File_ID: file_id,
          Title: title,
        });
        await newSong.save();
      } else {
        // If the song entry exists but the File_ID is missing, update it
        song.File_ID = file_id;
        await song.save();
      }
    }
    const user = await User.findOne({ User_ID: ctx.from.id });
    // Create and save a new Download_History entry
    const downloadHistory = new Download_History({
      User: user._id, // Assuming ctx.from.id contains the user's ID
      Song: newSong ? newSong._id : song._id, // Assuming song._id contains the song's ID or use undefined if song is not present
    });
    await downloadHistory.save();
  } catch (err) {
    console.error("Error in bot.action handler:", err);
    ctx.answerCbQuery("An error occurred. Please try again later.");
  }
});

bot.launch();
