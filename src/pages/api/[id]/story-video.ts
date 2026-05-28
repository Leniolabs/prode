// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuid } from "uuid";
import {
  getUserGroupMatches,
  getCountries,
  getUserProdeById,
  finalsStarted,
  getUserFinalMatches,
} from "../../../utils/queries";
//@ts-ignore
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import FFMPG from "fluent-ffmpeg";
import fs from "fs";
import {
  formatDate,
  formatHour,
  getNextMatches,
  getTodayMatches,
} from "../../../utils/date";
import { localizedCountries, localizedText } from "../../../locale/api";

const scale = (value: number) => value * 2.8;

const videoWidth = 1080;
const videoHeight = 1920;

const width = scale(360);
const height = scale(360);

const prodeOffsetLeft = (videoWidth - width) / 2;
const prodeOffsetTop = (videoHeight - height) / 2;

const headerHeight = scale(40);
const headerFontSize = scale(20);
const countryRowHeight = scale(80);
const countryImageMargin = scale(8);
const countryImageWidth = scale(28);
const countryNameMarginTop = scale(8);
const countryNameFontSize = scale(22);
const inputMarginLeft = scale(134);
const inputMarginTop = scale(7);
const inputWidth = scale(44);
const inputHeight = scale(44);
const inputFontSize = scale(26);
const legendFontSize = scale(16);
const legendMarginTop = scale(62);
const logoMarginTop = scale(5);
const logoMarginLeft = scale(5);
const logoWidth = scale(80);
const logoHeight = scale((80 * 332) / 823);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
) {
  if (!GlobalFonts.has("SSP_Bold"))
    GlobalFonts.registerFromPath("fonts/SourceSansPro-Bold.ttf", "SSP_Bold");
  if (!GlobalFonts.has("SSP_Regular"))
    GlobalFonts.registerFromPath(
      "fonts/SourceSansPro-Regular.ttf",
      "SSP_Regular"
    );

  const locale = req.query?.locale as string;
  const userProdeId = req.query?.id as string;
  const timezone = req.query?.timezone as string;

  const i18n = localizedText(locale);
  const getCountryName = localizedCountries(locale);

  if (!userProdeId) return res.status(404).send({});
  const userProde = await getUserProdeById(userProdeId);
  if (!userProde) return res.status(404).send({});

  const viewUser = userProde.user;
  if (!viewUser || !viewUser.prodePublic) return res.status(404).send({});

  const room = userProde.prodeRoom;
  if (!room) return res.status(404).send({});

  if (req.method === "GET") {
    const matches = (await finalsStarted())
      ? await getUserFinalMatches(room, viewUser)
      : await getUserGroupMatches(room, viewUser);
    const upcomingMatches = await getNextMatches(matches);
    const todayMatches = await getTodayMatches(matches);

    const printMatchesLabel = todayMatches.length
      ? i18n.todayMatchesLabel
      : i18n.upcomingMatchesLabel;
    const printMatches = todayMatches.length ? todayMatches : upcomingMatches;

    const countries = await Promise.all(
      (
        await getCountries()
      ).map(async (country) => {
        const image = await loadImage(`public/flags/${country.code}.png`);
        return {
          ...country,
          image,
        };
      })
    );

    const logoImage = await loadImage(`public/leniolabs-light.png`);

    const canvas = createCanvas(videoWidth, videoHeight); // set the height and width of the canvas
    const ctx = canvas.getContext("2d");
    //@ts-ignore
    ctx.antialias = "subpixel";

    const background = (groupName: string, matchesLength: number) => {
      ctx.fillStyle = "#f5f4f4cc";
      ctx.fillRect(
        prodeOffsetLeft,
        prodeOffsetTop,
        width,
        headerHeight + ((height - headerHeight) * matchesLength) / 4
      );

      ctx.fillStyle = "#1f2740";
      ctx.fillRect(prodeOffsetLeft, prodeOffsetTop, width, headerHeight);

      ctx.font = `${headerFontSize}px SSP_Bold`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        groupName,
        prodeOffsetLeft + width / 2,
        prodeOffsetTop + headerHeight / 2
      );

      ctx.drawImage(
        logoImage,
        prodeOffsetLeft + logoMarginLeft,
        prodeOffsetTop + logoMarginTop,
        logoWidth,
        logoHeight
      );
    };

    const drawMatch = (
      match: typeof matches extends (infer U)[] ? U : never,
      top: number
    ) => {
      ctx.font = `${countryNameFontSize}px SSP_Regular`;
      ctx.fillStyle = "#333";
      ctx.textBaseline = "middle";

      const countryLeft = countries.find((c) => c.id === match.countryLeftId);
      const countryRight = countries.find((c) => c.id === match.countryRightId);

      if (countryLeft) {
        ctx.textAlign = "left";
        ctx.fillText(
          getCountryName(countryLeft.code, countryLeft.name),
          prodeOffsetLeft + countryNameMarginTop,
          prodeOffsetTop + (countryRowHeight * 3) / 5 + top + 10
        );
        ctx.drawImage(
          countryLeft.image,
          prodeOffsetLeft + countryImageMargin,
          prodeOffsetTop + countryRowHeight / 2 + top - countryImageWidth - 10,
          countryImageWidth,
          countryImageWidth
        );
      }

      if (countryRight) {
        ctx.textAlign = "right";
        ctx.fillText(
          getCountryName(countryRight.code, countryRight.name),
          prodeOffsetLeft + width - countryNameMarginTop,
          prodeOffsetTop + (countryRowHeight * 3) / 5 + top + 10
        );
        ctx.drawImage(
          countryRight.image,
          prodeOffsetLeft + width - countryImageMargin - countryImageWidth,
          prodeOffsetTop + countryRowHeight / 2 + top - countryImageWidth - 10,
          countryImageWidth,
          countryImageWidth
        );
      }

      ctx.fillStyle = "#767676";
      ctx.strokeRect(
        prodeOffsetLeft + inputMarginLeft,
        prodeOffsetTop + top + inputMarginTop,
        inputWidth,
        inputHeight
      );
      ctx.strokeRect(
        prodeOffsetLeft + width - inputMarginLeft - inputWidth,
        prodeOffsetTop + top + inputMarginTop,
        inputWidth,
        inputHeight
      );

      ctx.font = `${inputFontSize}px SSP_Regular`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (match.userGoalsLeft !== null) {
        ctx.fillText(
          match.userGoalsLeft.toString(),
          prodeOffsetLeft + inputMarginLeft + inputWidth / 2,
          prodeOffsetTop + top + inputMarginTop + inputHeight / 2 + 2
        );
      }
      if (match.userGoalsRight !== null) {
        ctx.fillText(
          match.userGoalsRight.toString(),
          prodeOffsetLeft + width - inputMarginLeft - inputWidth / 2,
          prodeOffsetTop + top + inputMarginTop + inputHeight / 2 + 2
        );
      }

      ctx.font = `${legendFontSize}px SSP_Regular`;
      ctx.fillStyle = "#767676";
      ctx.fillText(
        todayMatches.length
          ? formatHour(new Date(match.date), locale, timezone)
          : formatDate(new Date(match.date), locale, timezone),
        prodeOffsetLeft + width / 2,
        prodeOffsetTop + legendMarginTop + top
      );
    };

    background(printMatchesLabel, printMatches.length);
    printMatches.map((match, index) => {
      drawMatch(match, index * countryRowHeight + headerHeight);
    });

    const temp_folder = uuid();
    fs.mkdirSync(`temp/${temp_folder}`);
    fs.writeFileSync(
      `temp/${temp_folder}/matches.png`,
      canvas.toBuffer("image/png")
    );

    res.setHeader("content-type", "video/mp4");

    // return res.send(canvas.toBuffer("image/png"));

    try {
      FFMPG("public/video/story.mp4")
        .addInput(`temp/${temp_folder}/matches.png`)
        .withInputOption("-loop 1")
        .withInputOption("-t 9")
        .complexFilter([
          "[0:v]scale=720:1080[v0]",
          "[1:v]scale=720:1080[v1]",
          "[v1]format=rgba,fade=in:st=1.2:d=0.7:alpha=1,fade=out:st=7.5:d=0.8:alpha=1[faded]",
          "[v0][faded]overlay=0:0:shortest=0[vf]",
        ])
        .outputOptions([
          "-map [vf]",
          // "-vf scale=-2:720",
          "-profile:v main",
          "-level:v 3.0",
          "-maxrate 2500k",
          "-bufsize 2500k",
          "-c:v h264",
          "-pix_fmt yuv420p",
        ])
        .on("error", function (e) {
          console.log(e);
          fs.rmdirSync(`temp/${temp_folder}`, { recursive: true });
        })
        .on("start", function (e) {
          console.log(e);
        })
        .on("progress", function (e) {
          console.log(e);
        })
        .on("codecData", function (e) {
          console.log(e);
        })
        .on("stderr", function (e) {
          console.log("stderr" + e);
        })
        .on("end", function (e) {
          console.log("END", e);

          fs.createReadStream(`temp/${temp_folder}/output.mp4`)
            .pipe(res)
            .on("close", () => {
              fs.rmdirSync(`temp/${temp_folder}`, { recursive: true });
            });
        })
        .saveToFile(`temp/${temp_folder}/output.mp4`);
      // .writeToStream(res, { end: true });
    } catch (err) {
      console.log("error", err);
    }
  } else {
    return res.status(400).send({});
  }
}
