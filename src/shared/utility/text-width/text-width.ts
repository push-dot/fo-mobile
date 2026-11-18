// Advance widths in 1/1000 em of the bundled Noto Sans KR Regular and SemiBold (hmtx of assets/fonts/NotoSansKR-*.ttf): ASCII 32 to 126, the two symbols the
// boards print inside text, and 920 for every Hangul syllable and jamo (all of them share one advance).
const REGULAR: readonly number[] = [224, 323, 474, 555, 555, 921, 680, 278, 338, 338, 467, 555, 278, 347, 278, 392, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 278, 278, 555, 555, 555, 474, 946, 608, 657, 638, 688, 589, 552, 689, 728, 293, 535, 646, 543, 812, 723, 742, 633, 742, 635, 596, 599, 721, 575, 878, 573, 531, 603, 338, 392, 338, 555, 559, 606, 563, 618, 510, 620, 554, 325, 564, 607, 275, 275, 552, 284, 926, 610, 606, 620, 620, 388, 468, 377, 607, 521, 802, 498, 521, 475, 338, 270, 338, 555]
const REGULAR_OTHER = { '·': 561, '›': 302 }
const SEMIBOLD: readonly number[] = [226, 357, 546, 580, 580, 951, 723, 311, 367, 367, 495, 580, 311, 364, 311, 389, 580, 580, 580, 580, 580, 580, 580, 580, 580, 580, 311, 311, 580, 580, 580, 503, 990, 632, 674, 651, 707, 608, 576, 709, 749, 319, 559, 675, 568, 842, 742, 762, 658, 762, 669, 616, 618, 740, 606, 904, 611, 566, 610, 367, 389, 367, 580, 565, 620, 583, 637, 522, 637, 573, 359, 588, 631, 296, 297, 589, 306, 953, 632, 620, 637, 637, 423, 487, 408, 629, 560, 846, 544, 559, 501, 367, 289, 367, 580]
const SEMIBOLD_OTHER = { '·': 583, '›': 318 }

const WIDE = 920

type Weight = 'regular' | 'semibold'

/**
 * The width of a line of text in points, for a layout that needs a column's natural width before the text is on screen (a markdown table sizes its columns from its cells).
 * Within 0.5 pt of the boards' WebKit on 14 pt cells (max 1.5 pt on a hyphenated Latin word), because CoreText and WebKit agree on these advances.
 */
export const textWidth = (text: string, size: number, weight: Weight = 'regular', tracking = 0) => {
  const [ascii, other] = weight === 'semibold' ? [SEMIBOLD, SEMIBOLD_OTHER] : [REGULAR, REGULAR_OTHER]
  let units = 0
  let count = 0
  for (const ch of text) {
    const code = ch.codePointAt(0)!
    units += code >= 32 && code <= 126 ? ascii[code - 32]! : (other[ch as keyof typeof other] ?? WIDE)
    count += 1
  }
  return (units * size) / 1000 + tracking * count
}
