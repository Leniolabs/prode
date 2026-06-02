export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import {
  getUserGroupMatches,
  getCountries,
  getUserProdeById,
} from '@/utils/queries'
// @ts-ignore
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas'
import FFMPG from 'fluent-ffmpeg'
import fs from 'fs'
import { formatDate } from '@/utils/date'
import { localizedCountries, localizedText } from '@/locale/api'

const scale = (value: number) => value * 1.8

const videoWidth = 720
const videoHeight = 1280

const width = scale(360)
const height = scale(360)

const prodeOffsetLeft = (videoWidth - width) / 2
const prodeOffsetTop = (videoHeight - height) / 2

const headerHeight = scale(40)
const headerFontSize = scale(20)
const countryRowHeight = scale(52)
const countryImageMargin = scale(8)
const countryImageWidth = scale(28)
const countryNameMargin = scale(8 + 28 + 4)
const countryNameFontSize = scale(14)
const inputMarginLeft = scale(147)
const inputMarginTop = scale(7)
const inputWidth = scale(30)
const inputHeight = scale(24)
const inputFontSize = scale(17)
const legendFontSize = scale(12)
const legendMarginTop = scale(42)
const logoMarginTop = scale(5)
const logoMarginLeft = scale(5)
const logoWidth = scale(80)
const logoHeight = scale((80 * 332) / 823)

export async function GET(req: Request, routeCtx: { params: Promise<Record<string, string>> }) {
  if (!GlobalFonts.has('SSP_Bold'))
    GlobalFonts.registerFromPath('fonts/SourceSansPro-Bold.ttf', 'SSP_Bold')
  if (!GlobalFonts.has('SSP_Regular'))
    GlobalFonts.registerFromPath('fonts/SourceSansPro-Regular.ttf', 'SSP_Regular')

  const { id: userProdeId } = await routeCtx.params
  const { searchParams } = new URL(req.url)
  const locale = searchParams.get('locale') ?? ''
  const timezone = searchParams.get('timezone') ?? ''

  if (!userProdeId) return NextResponse.json({}, { status: 404 })
  const userProde = await getUserProdeById(userProdeId)
  if (!userProde) return NextResponse.json({}, { status: 404 })

  const i18n = localizedText(locale)
  const getCountryName = localizedCountries(locale)

  const viewUser = userProde.user
  if (!viewUser || !viewUser.prodePublic) return NextResponse.json({}, { status: 404 })

  const room = userProde.prodeRoom
  if (!room) return NextResponse.json({}, { status: 404 })

  const matches = await getUserGroupMatches(room, viewUser)
  const countries = await Promise.all(
    (await getCountries()).map(async (country) => {
      const image = await loadImage(`public/flags/${country.code}.png`)
      return { ...country, image }
    })
  )

  const bgPortada = await loadImage(`public/video/portada_720.jpg`)
  const bgFondo = await loadImage(`public/video/fondo_720.jpg`)
  const bgFinal = await loadImage(`public/video/final_720.jpg`)
  const logoImage = await loadImage(`public/leniolabs-light.png`)

  const canvas = createCanvas(videoWidth, videoHeight)
  const ctx = canvas.getContext('2d')
  // @ts-ignore
  ctx.antialias = 'subpixel'

  const background = (groupName: string) => {
    ctx.drawImage(bgFondo, 0, 0)
    ctx.fillStyle = '#f5f4f4cc'
    ctx.fillRect(prodeOffsetLeft, prodeOffsetTop, width, height)
    ctx.fillStyle = '#1f2740'
    ctx.fillRect(prodeOffsetLeft, prodeOffsetTop, width, headerHeight)
    ctx.font = `${headerFontSize}px SSP_Bold`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(groupName, prodeOffsetLeft + width / 2, prodeOffsetTop + headerHeight / 2)
    ctx.drawImage(logoImage, prodeOffsetLeft + logoMarginLeft, prodeOffsetTop + logoMarginTop, logoWidth, logoHeight)
  }

  const drawMatch = (match: typeof matches extends (infer U)[] ? U : never, top: number) => {
    ctx.font = `${countryNameFontSize}px SSP_Regular`
    ctx.fillStyle = '#333'
    ctx.textBaseline = 'middle'

    const countryLeft = countries.find((c) => c.id === match.countryLeftId)
    const countryRight = countries.find((c) => c.id === match.countryRightId)

    if (countryLeft) {
      ctx.textAlign = 'left'
      ctx.fillText(getCountryName(countryLeft.code, countryLeft.name), prodeOffsetLeft + countryNameMargin, prodeOffsetTop + countryRowHeight / 2 + top)
      ctx.drawImage(countryLeft.image, prodeOffsetLeft + countryImageMargin, prodeOffsetTop + countryRowHeight / 2 - countryImageWidth / 2 - 4 + top, countryImageWidth, countryImageWidth)
    }

    if (countryRight) {
      ctx.textAlign = 'right'
      ctx.fillText(getCountryName(countryRight.code, countryRight.name), prodeOffsetLeft + width - countryNameMargin, prodeOffsetTop + countryRowHeight / 2 + top)
      ctx.drawImage(countryRight.image, prodeOffsetLeft + width - countryImageMargin - countryImageWidth, prodeOffsetTop + countryRowHeight / 2 - countryImageWidth / 2 - 4 + top, countryImageWidth, countryImageWidth)
    }

    ctx.fillStyle = '#767676'
    ctx.strokeRect(prodeOffsetLeft + inputMarginLeft, prodeOffsetTop + top + inputMarginTop, inputWidth, inputHeight)
    ctx.strokeRect(prodeOffsetLeft + width - inputMarginLeft - inputWidth, prodeOffsetTop + top + inputMarginTop, inputWidth, inputHeight)

    ctx.font = `${inputFontSize}px SSP_Regular`
    ctx.fillStyle = '#000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (match.userGoalsLeft !== null) {
      ctx.fillText(match.userGoalsLeft.toString(), prodeOffsetLeft + inputMarginLeft + inputWidth / 2, prodeOffsetTop + top + inputMarginTop + inputHeight / 2 + 2)
    }
    if (match.userGoalsRight !== null) {
      ctx.fillText(match.userGoalsRight.toString(), prodeOffsetLeft + width - inputMarginLeft - inputWidth / 2, prodeOffsetTop + top + inputMarginTop + inputHeight / 2 + 2)
    }

    ctx.font = `${legendFontSize}px SSP_Regular`
    ctx.fillStyle = '#767676'
    ctx.fillText(formatDate(new Date(match.date), locale, timezone), prodeOffsetLeft + width / 2, prodeOffsetTop + legendMarginTop + top)
  }

  const frames: Buffer[] = []

  ctx.drawImage(bgPortada, 0, 0)
  frames.push(canvas.toBuffer('image/png'))
  ctx.drawImage(bgPortada, 0, 0)
  frames.push(canvas.toBuffer('image/png'))

  Object.entries(
    matches.reduce((groups, match) => {
      return { ...groups, [match.stage]: [...(groups?.[match.stage] || []), match] }
    }, {} as { [key: string]: typeof matches })
  )
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([group, groupMatches]) => {
      ctx.clearRect(0, 0, width, height)
      // @ts-ignore
      background(i18n[group])
      groupMatches.map((match, index) => drawMatch(match, index * countryRowHeight + headerHeight))
      frames.push(canvas.toBuffer('image/png'))
    })

  ctx.drawImage(bgFinal, 0, 0)
  frames.push(canvas.toBuffer('image/png'))
  ctx.drawImage(bgFinal, 0, 0)
  frames.push(canvas.toBuffer('image/png'))

  const temp_folder = uuid()
  fs.mkdirSync(`temp/${temp_folder}`)
  frames.forEach((frame, index) => {
    fs.writeFileSync(`temp/${temp_folder}/img_${index}.png`, frame)
  })

  return new Promise<Response>((resolve) => {
    try {
      FFMPG()
        .outputOptions([
          '-framerate 1/1',
          `-i temp/${temp_folder}/img_%d.png`,
          '-profile:v main',
          '-level:v 3.0',
          '-maxrate 3500k',
          '-bufsize 3500k',
          '-map 0:v',
          '-r 2',
          '-c:v h264',
          '-tune stillimage',
          '-crf 18',
          '-pix_fmt yuv420p',
          '-max_muxing_queue_size 1024',
          '-shortest',
          '-f mp4',
        ])
        .on('error', (e: Error) => {
          console.log(e)
          fs.rmdirSync(`temp/${temp_folder}`, { recursive: true })
          resolve(NextResponse.json({}, { status: 500 }))
        })
        .on('end', () => {
          const buffer = fs.readFileSync(`temp/${temp_folder}/output.mp4`)
          fs.rmdirSync(`temp/${temp_folder}`, { recursive: true })
          resolve(new Response(buffer, { headers: { 'content-type': 'video/mp4' } }))
        })
        .saveToFile(`temp/${temp_folder}/output.mp4`)
    } catch (err) {
      console.log('error', err)
      resolve(NextResponse.json({}, { status: 500 }))
    }
  })
}
