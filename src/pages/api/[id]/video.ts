// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuid } from "uuid";
import {
  getUserGroupMatches,
  getCountries,
  getUserProdeById,
} from "../../../utils/queries";
//@ts-ignore
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import FFMPG from "fluent-ffmpeg";
import fs from "fs";
import { formatDate } from "../../../utils/date";
import { localizedCountries, localizedText } from "../../../locale/api";

const scale = (value: number) => value * 1.8;

const videoWidth = 720;
const videoHeight = 1280;

const width = scale(360);
const height = scale(360);

const prodeOffsetLeft = (videoWidth - width) / 2;
const prodeOffsetTop = (videoHeight - height) / 2;

const headerHeight = scale(40);
const headerFontSize = scale(20);
const countryRowHeight = scale(52);
const countryImageMargin = scale(8);
const countryImageWidth = scale(28);
const countryNameMargin = scale(8 + 28 + 4);
const countryNameFontSize = scale(14);
const inputMarginLeft = scale(147);
const inputMarginTop = scale(7);
const inputWidth = scale(30);
const inputHeight = scale(24);
const inputFontSize = scale(17);
const legendFontSize = scale(12);
const legendMarginTop = scale(42);
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

  if (!userProdeId) return res.status(404).send({});
  const userProde = await getUserProdeById(userProdeId);
  if (!userProde) return res.status(404).send({});

  const i18n = localizedText(locale);
  const getCountryName = localizedCountries(locale);

  const viewUser = userProde.user;
  if (!viewUser || !viewUser.prodePublic) return res.status(404).send({});

  const room = userProde.prodeRoom;
  if (!room) return res.status(404).send({});

  if (req.method === "GET") {
    const matches = await getUserGroupMatches(room, viewUser);
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

    const bgPortada = await loadImage(`public/video/portada_720.jpg`);
    const bgFondo = await loadImage(`public/video/fondo_720.jpg`);
    const bgFinal = await loadImage(`public/video/final_720.jpg`);
    const logoImage = await loadImage(`public/leniolabs-light.png`);

    const canvas = createCanvas(videoWidth, videoHeight); // set the height and width of the canvas
    const ctx = canvas.getContext("2d");
    //@ts-ignore
    ctx.antialias = "subpixel";

    const background = (groupName: string) => {
      ctx.drawImage(bgFondo, 0, 0);

      ctx.fillStyle = "#f5f4f4cc";
      ctx.fillRect(prodeOffsetLeft, prodeOffsetTop, width, height);

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
          prodeOffsetLeft + countryNameMargin,
          prodeOffsetTop + countryRowHeight / 2 + top
        );
        ctx.drawImage(
          countryLeft.image,
          prodeOffsetLeft + countryImageMargin,
          prodeOffsetTop +
            countryRowHeight / 2 -
            countryImageWidth / 2 -
            4 +
            top,
          countryImageWidth,
          countryImageWidth
        );
      }

      if (countryRight) {
        ctx.textAlign = "right";
        ctx.fillText(
          getCountryName(countryRight.code, countryRight.name),
          prodeOffsetLeft + width - countryNameMargin,
          prodeOffsetTop + countryRowHeight / 2 + top
        );
        ctx.drawImage(
          countryRight.image,
          prodeOffsetLeft + width - countryImageMargin - countryImageWidth,
          prodeOffsetTop +
            countryRowHeight / 2 -
            countryImageWidth / 2 -
            4 +
            top,
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
        formatDate(new Date(match.date), locale, timezone),
        prodeOffsetLeft + width / 2,
        prodeOffsetTop + legendMarginTop + top
      );
    };

    const frames: Buffer[] = [];

    ctx.drawImage(bgPortada, 0, 0);
    frames.push(canvas.toBuffer("image/png"));
    ctx.drawImage(bgPortada, 0, 0);
    frames.push(canvas.toBuffer("image/png"));

    Object.entries(
      matches.reduce((groups, match) => {
        return {
          ...groups,
          [match.stage]: [...(groups?.[match.stage] || []), match],
        };
      }, {} as { [key: string]: typeof matches })
    )
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([group, matches]) => {
        ctx.clearRect(0, 0, width, height);
        //@ts-ignore
        background(i18n[group]);
        matches.map((match, index) =>
          drawMatch(match, index * countryRowHeight + headerHeight)
        );
        frames.push(canvas.toBuffer("image/png"));
      });

    ctx.drawImage(bgFinal, 0, 0);
    frames.push(canvas.toBuffer("image/png"));

    ctx.drawImage(bgFinal, 0, 0);
    frames.push(canvas.toBuffer("image/png"));

    const temp_folder = uuid();
    fs.mkdirSync(`temp/${temp_folder}`);
    frames.forEach((frame, index) => {
      fs.writeFileSync(`temp/${temp_folder}/img_${index}.png`, frame);
    });

    res.setHeader("content-type", "video/mp4");

    try {
      // ffmpeg -i INPUT.MOV -vf scale=-2:720 -c:v libx264 -profile:v main -level:v 3.0 -x264-params scenecut=0:open_gop=0:min-keyint=72:keyint=72:ref=4 -c:a aac -crf 23 -maxrate 3500k -bufsize 3500k -r 30 -ar 44100 -b:a 256k -sn -f mp4 OUTPUT.mp4

      FFMPG()
        .outputOptions([
          "-framerate 1/1",
          `-i temp/${temp_folder}/img_%d.png`,

          // "-vf scale=-2:720",
          "-profile:v main",
          "-level:v 3.0",
          "-maxrate 3500k",
          "-bufsize 3500k",

          "-map 0:v",
          "-r 2",
          "-c:v h264",
          "-tune stillimage",
          "-crf 18",
          "-pix_fmt yuv420p",
          "-max_muxing_queue_size 1024",
          "-shortest",
          "-f mp4",
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
