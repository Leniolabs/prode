// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiResponse } from "next";
import { v4 as uuid } from "uuid";
import {
  getProdeRoom,
  getUserByUserProdeId,
  getUserGroupMatches,
  getCountries,
  getUserTemplateGroupMatches,
} from "./queries";
//@ts-ignore
import { createCanvas, registerFont, loadImage } from "@napi-rs/canvas";
import FFMPG from "fluent-ffmpeg";
import fs from "fs";
//@ts-ignore
import GIFEncoder from "gif-encoder-2";
import { formatDate } from "./date";

registerFont("fonts/SourceSansPro-Bold.ttf", {
  family: "SSP_Bold",
  weight: "bold",
});
registerFont("fonts/SourceSansPro-Regular.ttf", {
  family: "SSP_Regular",
  weight: "normal",
});

const scale = (value: number) => value * 2;

const width = scale(360);
const height = scale(360);
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

export async function getVideoStream(
  res: NextApiResponse,
  id: string,
  userId: string
) {
  const viewUser = await getUserByUserProdeId(userId);
  if (!viewUser || !viewUser.prodePublic) return;

  const room = await getProdeRoom(id);
  if (!room) return;

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

  const logoImage = await loadImage(`public/leniolabs-light.png`);

  const canvas = createCanvas(width, height); // set the height and width of the canvas
  const ctx = canvas.getContext("2d");
  //@ts-ignore
  ctx.antialias = "subpixel";

  const background = (groupName: string) => {
    ctx.fillStyle = "#f5f4f4cc";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#1f2740";
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.font = `${headerFontSize}px SSPBold`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(groupName, width / 2, headerHeight / 2);

    ctx.drawImage(
      logoImage,
      logoMarginLeft,
      logoMarginTop,
      logoWidth,
      logoHeight
    );
  };

  const drawMatch = (
    match: typeof matches extends (infer U)[] ? U : never,
    top: number
  ) => {
    ctx.font = `${countryNameFontSize}px SSPRegular`;
    ctx.fillStyle = "#333";
    ctx.textBaseline = "middle";

    const countryLeft = countries.find((c) => c.id === match.countryLeftId);
    const countryRight = countries.find((c) => c.id === match.countryRightId);

    if (countryLeft) {
      ctx.textAlign = "left";
      ctx.fillText(
        countryLeft.name,
        countryNameMargin,
        countryRowHeight / 2 + top
      );
      ctx.drawImage(
        countryLeft.image,
        countryImageMargin,
        countryRowHeight / 2 - countryImageWidth / 2 - 4 + top,
        countryImageWidth,
        countryImageWidth
      );
    }

    if (countryRight) {
      ctx.textAlign = "right";
      ctx.fillText(
        countryRight.name,
        width - countryNameMargin,
        countryRowHeight / 2 + top
      );
      ctx.drawImage(
        countryRight.image,
        width - countryImageMargin - countryImageWidth,
        countryRowHeight / 2 - countryImageWidth / 2 - 4 + top,
        countryImageWidth,
        countryImageWidth
      );
    }

    ctx.fillStyle = "#767676";
    ctx.strokeRect(
      inputMarginLeft,
      top + inputMarginTop,
      inputWidth,
      inputHeight
    );
    ctx.strokeRect(
      width - inputMarginLeft - inputWidth,
      top + inputMarginTop,
      inputWidth,
      inputHeight
    );

    ctx.font = `${inputFontSize}px SSPRegular`;
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (match.userGoalsLeft !== null) {
      ctx.fillText(
        match.userGoalsLeft.toString(),
        inputMarginLeft + inputWidth / 2,
        top + inputMarginTop + inputHeight / 2 + 2
      );
    }
    if (match.userGoalsRight !== null) {
      ctx.fillText(
        match.userGoalsRight.toString(),
        width - inputMarginLeft - inputWidth / 2,
        top + inputMarginTop + inputHeight / 2 + 2
      );
    }

    ctx.font = `${legendFontSize}px SSPRegular`;
    ctx.fillStyle = "#767676";
    ctx.fillText(
      formatDate(new Date(match.date), "es"),
      width / 2,
      legendMarginTop + top
    );
  };

  const frames: Buffer[] = [];

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
      background(group.replace("_", " "));
      matches.map((match, index) =>
        drawMatch(match, index * countryRowHeight + headerHeight)
      );
      frames.push(canvas.toBuffer("image/png"));
    });

  res.setHeader("content-type", "video/mp4");

  const temp_folder = uuid();
  fs.mkdirSync(`temp/${temp_folder}`);
  frames.forEach((frame, index) => {
    new Array(1).fill(0).forEach((_, i) => {
      fs.writeFileSync(`temp/${temp_folder}/img_${1 * index + i}.png`, frame);
    });
  });

  FFMPG(`temp/${temp_folder}/img_%d.png`)
    .videoCodec("libx264")
    .outputOptions([
      "-brand mp42",
      "-profile:v high",
      "-level:v 5.1",
      "-movflags frag_keyframe",
      "-pix_fmt yuv420p",
      "-video_track_timescale 10000",
    ])
    .noAudio()
    .fpsInput(1)
    .fpsOutput(30)
    .toFormat("mp4")
    .on("error", function () {
      fs.rmdirSync(`temp/${temp_folder}`, { recursive: true });
    })
    .on("end", function () {
      fs.rmdirSync(`temp/${temp_folder}`, { recursive: true });
    })
    .pipe(res, { end: true });
}

export async function getGifBuffer(id: string, userId: string, locale: string) {
  const viewUser = await getUserByUserProdeId(userId);
  if (!viewUser || !viewUser.prodePublic) return;

  const room = await getProdeRoom(id);
  if (!room) return;

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

  const logoImage = await loadImage(`public/leniolabs-light.png`);

  const canvas = createCanvas(width, height); // set the height and width of the canvas
  const ctx = canvas.getContext("2d");
  //@ts-ignore
  ctx.antialias = "subpixel";

  const background = (groupName: string) => {
    ctx.fillStyle = "#f5f4f4cc";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#1f2740";
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.font = `${headerFontSize}px SSPBold`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(groupName, width / 2, headerHeight / 2);

    ctx.drawImage(
      logoImage,
      logoMarginLeft,
      logoMarginTop,
      logoWidth,
      logoHeight
    );
  };

  const drawMatch = (
    match: typeof matches extends (infer U)[] ? U : never,
    top: number
  ) => {
    ctx.font = `${countryNameFontSize}px SSPRegular`;
    ctx.fillStyle = "#333";
    ctx.textBaseline = "middle";

    const countryLeft = countries.find((c) => c.id === match.countryLeftId);
    const countryRight = countries.find((c) => c.id === match.countryRightId);

    if (countryLeft) {
      ctx.textAlign = "left";
      ctx.fillText(
        countryLeft.name,
        countryNameMargin,
        countryRowHeight / 2 + top
      );
      ctx.drawImage(
        countryLeft.image,
        countryImageMargin,
        countryRowHeight / 2 - countryImageWidth / 2 - 4 + top,
        countryImageWidth,
        countryImageWidth
      );
    }

    if (countryRight) {
      ctx.textAlign = "right";
      ctx.fillText(
        countryRight.name,
        width - countryNameMargin,
        countryRowHeight / 2 + top
      );
      ctx.drawImage(
        countryRight.image,
        width - countryImageMargin - countryImageWidth,
        countryRowHeight / 2 - countryImageWidth / 2 - 4 + top,
        countryImageWidth,
        countryImageWidth
      );
    }

    ctx.fillStyle = "#767676";
    ctx.strokeRect(
      inputMarginLeft,
      top + inputMarginTop,
      inputWidth,
      inputHeight
    );
    ctx.strokeRect(
      width - inputMarginLeft - inputWidth,
      top + inputMarginTop,
      inputWidth,
      inputHeight
    );

    ctx.font = `${inputFontSize}px SSPRegular`;
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (match.userGoalsLeft !== null) {
      ctx.fillText(
        match.userGoalsLeft.toString(),
        inputMarginLeft + inputWidth / 2,
        top + inputMarginTop + inputHeight / 2 + 2
      );
    }
    if (match.userGoalsRight !== null) {
      ctx.fillText(
        match.userGoalsRight.toString(),
        width - inputMarginLeft - inputWidth / 2,
        top + inputMarginTop + inputHeight / 2 + 2
      );
    }

    ctx.font = `${legendFontSize}px SSPRegular`;
    ctx.fillStyle = "#767676";
    ctx.fillText(
      formatDate(new Date(match.date), locale),
      width / 2,
      legendMarginTop + top
    );
  };

  const frames: Buffer[] = [];

  const encoder = new GIFEncoder(width, height);
  encoder.setDelay(500);
  encoder.start(); // starts the encoder

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
      background(group.replace("_", " "));
      matches.map((match, index) =>
        drawMatch(match, index * countryRowHeight + headerHeight)
      );
      //   frames.push(canvas.toBuffer("image/png"));
      encoder.addFrame(ctx);
    });

  encoder.finish();

  return `data:image/gif;base64, ${Buffer.from(encoder.out.getData()).toString(
    "base64"
  )}`;
}

export async function getGifTemplateBuffer(userId: string, locale: string) {
  const viewUser = await getUserByUserProdeId(userId);
  if (!viewUser || !viewUser.prodePublic) return;

  const matches = await getUserTemplateGroupMatches(viewUser);
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

  const canvas = createCanvas(width, height); // set the height and width of the canvas
  const ctx = canvas.getContext("2d");
  //@ts-ignore
  ctx.antialias = "subpixel";

  const background = (groupName: string) => {
    ctx.fillStyle = "#f5f4f4cc";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#1f2740";
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.font = `${headerFontSize}px SSPBold`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(groupName, width / 2, headerHeight / 2);

    ctx.drawImage(
      logoImage,
      logoMarginLeft,
      logoMarginTop,
      logoWidth,
      logoHeight
    );
  };

  const drawMatch = (
    match: typeof matches extends (infer U)[] ? U : never,
    top: number
  ) => {
    ctx.font = `${countryNameFontSize}px SSPRegular`;
    ctx.fillStyle = "#333";
    ctx.textBaseline = "middle";

    const countryLeft = countries.find((c) => c.id === match.countryLeftId);
    const countryRight = countries.find((c) => c.id === match.countryRightId);

    if (countryLeft) {
      ctx.textAlign = "left";
      ctx.fillText(
        countryLeft.name,
        countryNameMargin,
        countryRowHeight / 2 + top
      );
      ctx.drawImage(
        countryLeft.image,
        countryImageMargin,
        countryRowHeight / 2 - countryImageWidth / 2 - 4 + top,
        countryImageWidth,
        countryImageWidth
      );
    }

    if (countryRight) {
      ctx.textAlign = "right";
      ctx.fillText(
        countryRight.name,
        width - countryNameMargin,
        countryRowHeight / 2 + top
      );
      ctx.drawImage(
        countryRight.image,
        width - countryImageMargin - countryImageWidth,
        countryRowHeight / 2 - countryImageWidth / 2 - 4 + top,
        countryImageWidth,
        countryImageWidth
      );
    }

    ctx.fillStyle = "#767676";
    ctx.strokeRect(
      inputMarginLeft,
      top + inputMarginTop,
      inputWidth,
      inputHeight
    );
    ctx.strokeRect(
      width - inputMarginLeft - inputWidth,
      top + inputMarginTop,
      inputWidth,
      inputHeight
    );

    ctx.font = `${inputFontSize}px SSPRegular`;
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (match.userGoalsLeft !== null) {
      ctx.fillText(
        match.userGoalsLeft.toString(),
        inputMarginLeft + inputWidth / 2,
        top + inputMarginTop + inputHeight / 2 + 2
      );
    }
    if (match.userGoalsRight !== null) {
      ctx.fillText(
        match.userGoalsRight.toString(),
        width - inputMarginLeft - inputWidth / 2,
        top + inputMarginTop + inputHeight / 2 + 2
      );
    }

    ctx.font = `${legendFontSize}px SSPRegular`;
    ctx.fillStyle = "#767676";
    ctx.fillText(
      formatDate(new Date(match.date), locale),
      width / 2,
      legendMarginTop + top
    );
  };

  const frames: Buffer[] = [];

  const encoder = new GIFEncoder(width, height);
  encoder.setDelay(500);
  encoder.start(); // starts the encoder

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
      background(group.replace("_", " "));
      matches.map((match, index) =>
        drawMatch(match, index * countryRowHeight + headerHeight)
      );
      //   frames.push(canvas.toBuffer("image/png"));
      encoder.addFrame(ctx);
    });

  encoder.finish();

  return `data:image/gif;base64, ${Buffer.from(encoder.out.getData()).toString(
    "base64"
  )}`;
}
