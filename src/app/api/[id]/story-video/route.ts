import {
  getUserGroupMatches,
  getCountries,
  getUserProdeById,
  finalsStarted,
  getUserFinalMatches,
} from '@/utils/queries'
// @ts-ignore
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas'
import FFMPG from 'fluent-ffmpeg'
import fs from 'fs'
import { v4 as uuid } from 'uuid'
import {
  formatDate,
  formatHour,
  getNextMatches,
  getTodayMatches,
} from '@/utils/date'
import { localizedCountries, localizedText } from '@/locale/api'
import { NextRequest, NextResponse } from 'next/server'

const scale = (value: number) => value * 2.8

const videoWidth = 1080
const videoHeight = 1920
const width = scale(360)
const height = scale(360)
const prodeOffsetLeft = (videoWidth - width) / 2
const prodeOffsetTop = (videoHeight - height) / 2
const headerHeight = scale(40)
const headerFontSize = scale(20)
const countryRowHeight = scale(80)
const countryImageMargin = scale(8)
const countryImageWidth = scale(28)
const countryNameMarginTop = scale(8)
const countryNameFontSize = scale(22)
const inputMarginLeft = scale(134)
const inputMarginTop = scale(7)
const inputWidth = scale(44)
const inputHeight = scale(44)
const inputFontSize = scale(26)
const legendFontSize = scale(16)
const legendMarginTop = scale(62)
const logoMarginTop = scale(5)
const logoMarginLeft = scale(5)
const logoWidth = scale(80)
const logoHeight = scale((80 * 332) / 823)

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!GlobalFonts.has('SSP_Bold'))
    GlobalFonts.registerFromPath('fonts/SourceSansPro-Bold.ttf', 'SSP_Bold')
  if (!GlobalFonts.has('SSP_Regular'))
    GlobalFonts.registerFromPath('fonts/SourceSansPro-Regular.ttf', 'SSP_Regular')

  const locale = req.nextUrl.searchParams.get('locale') ?? ''
  const { id: userProdeId } = await context.params
  const timezone = req.nextUrl.searchParams.get('timezone') ?? ''

  const i18n = localizedText(locale)
  const getCountryName = localizedCountries(locale)

  if (!userProdeId) return NextResponse.json({}, { status: 404 })
  const userProde = await getUserProdeById(userProdeId)
  if (!userProde) return NextResponse.json({}, { status: 404 })

  const viewUser = userProde.user
  if (!viewUser || !viewUser.prodePublic) return NextResponse.json({}, { status: 404 })

  const room = userProde.prodeRoom
  if (!room) return NextResponse.json({}, { status: 404 })

  const matches = (await finalsStarted())
    ? await getUserFinalMatches(room, viewUser)
    : await getUserGroupMatches(room, viewUser)
  const upcomingMatches = await getNextMatches(matches, timezone)
  const todayMatches = await getTodayMatches(matches, timezone)

  const printMatchesLabel = todayMatches.length ? i18n.todayMatchesLabel : i18n.upcomingMatchesLabel
  const printMatches = todayMatches.length ? todayMatches : upcomingMatches

  const countries = await Promise.all(
    (await getCountries()).map(async (country) => {
      const image = await loadImage(`public/flags/${country.code}.png`)
      return { ...country, image }
    })
  )

  const logoImage = await loadImage('public/leniolabs-light.png')
  const canvas = createCanvas(videoWidth, videoHeight)
  const ctx = canvas.getContext('2d')
  // @ts-ignore
  ctx.antialias = 'subpixel'

  const background = (groupName: string, matchesLength: number) => {
    ctx.fillStyle = '#f5f4f4cc'
    ctx.fillRect(prodeOffsetLeft, prodeOffsetTop, width, headerHeight + ((height - headerHeight) * matchesLength) / 4)
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
      ctx.fillText(getCountryName(countryLeft.code, countryLeft.name), prodeOffsetLeft + countryNameMarginTop, prodeOffsetTop + (countryRowHeight * 3) / 5 + top + 10)
      ctx.drawImage(countryLeft.image, prodeOffsetLeft + countryImageMargin, prodeOffsetTop + countryRowHeight / 2 + top - countryImageWidth - 10, countryImageWidth, countryImageWidth)
    }
    if (countryRight) {
      ctx.textAlign = 'right'
      ctx.fillText(getCountryName(countryRight.code, countryRight.name), prodeOffsetLeft + width - countryNameMarginTop, prodeOffsetTop + (countryRowHeight * 3) / 5 + top + 10)
      ctx.drawImage(countryRight.image, prodeOffsetLeft + width - countryImageMargin - countryImageWidth, prodeOffsetTop + countryRowHeight / 2 + top - countryImageWidth - 10, countryImageWidth, countryImageWidth)
    }
    ctx.fillStyle = '#767676'
    ctx.strokeRect(prodeOffsetLeft + inputMarginLeft, prodeOffsetTop + top + inputMarginTop, inputWidth, inputHeight)
    ctx.strokeRect(prodeOffsetLeft + width - inputMarginLeft - inputWidth, prodeOffsetTop + top + inputMarginTop, inputWidth, inputHeight)
    ctx.font = `${inputFontSize}px SSP_Regular`
    ctx.fillStyle = '#000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (match.userGoalsLeft !== null) ctx.fillText(match.userGoalsLeft.toString(), prodeOffsetLeft + inputMarginLeft + inputWidth / 2, prodeOffsetTop + top + inputMarginTop + inputHeight / 2 + 2)
    if (match.userGoalsRight !== null) ctx.fillText(match.userGoalsRight.toString(), prodeOffsetLeft + width - inputMarginLeft - inputWidth / 2, prodeOffsetTop + top + inputMarginTop + inputHeight / 2 + 2)
    ctx.font = `${legendFontSize}px SSP_Regular`
    ctx.fillStyle = '#767676'
    ctx.fillText(
      todayMatches.length ? formatHour(new Date(match.date), locale, timezone) : formatDate(new Date(match.date), locale, timezone),
      prodeOffsetLeft + width / 2,
      prodeOffsetTop + legendMarginTop + top
    )
  }

  background(printMatchesLabel, printMatches.length)
  printMatches.map((match, index) => drawMatch(match, index * countryRowHeight + headerHeight))

  const temp_folder = uuid()
  fs.mkdirSync(`temp/${temp_folder}`)
  fs.writeFileSync(`temp/${temp_folder}/matches.png`, canvas.toBuffer('image/png'))

  return new Promise<NextResponse>((resolve) => {
    FFMPG('public/video/story.mp4')
      .addInput(`temp/${temp_folder}/matches.png`)
      .withInputOption('-loop 1')
      .withInputOption('-t 9')
      .complexFilter([
        '[0:v]scale=720:1080[v0]',
        '[1:v]scale=720:1080[v1]',
        '[v1]format=rgba,fade=in:st=1.2:d=0.7:alpha=1,fade=out:st=7.5:d=0.8:alpha=1[faded]',
        '[v0][faded]overlay=0:0:shortest=0[vf]',
      ])
      .outputOptions(['-map [vf]', '-profile:v main', '-level:v 3.0', '-maxrate 2500k', '-bufsize 2500k', '-c:v h264', '-pix_fmt yuv420p'])
      .on('error', (e: Error) => {
        console.log(e)
        fs.rmdirSync(`temp/${temp_folder}`, { recursive: true })
        resolve(NextResponse.json({}, { status: 500 }))
      })
      .on('end', () => {
        const buffer = fs.readFileSync(`temp/${temp_folder}/output.mp4`)
        fs.rmdirSync(`temp/${temp_folder}`, { recursive: true })
        resolve(new NextResponse(buffer, { headers: { 'content-type': 'video/mp4' } }))
      })
      .saveToFile(`temp/${temp_folder}/output.mp4`)
  })
}
