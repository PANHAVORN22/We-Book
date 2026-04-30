import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/book-content?title=...&author=...
 *
 * Searches for a book on the Gutendex API (Project Gutenberg catalogue)
 * and returns the plain-text content split into paragraphs.
 *
 * If no Gutenberg match is found it returns richly-generated sample
 * paragraphs so the reading UI always has content to display.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const author = searchParams.get('author') || ''

  try {
    // --- Step 1: search Gutendex for a matching work -----------------------
    const searchQuery = encodeURIComponent(title)
    const gutendexRes = await fetch(
      `https://gutendex.com/books/?search=${searchQuery}`,
      { next: { revalidate: 86400 } } // cache for 24 h
    )

    if (gutendexRes.ok) {
      const catalogue = await gutendexRes.json()

      if (catalogue.results && catalogue.results.length > 0) {
        // Pick the first result (best match)
        const book = catalogue.results[0]

        // Gutenberg stores full texts in multiple formats.
        // We prefer plain text (UTF-8).
        const textUrl =
          book.formats['text/plain; charset=utf-8'] ||
          book.formats['text/plain; charset=us-ascii'] ||
          book.formats['text/plain'] ||
          null

        if (textUrl) {
          const textRes = await fetch(textUrl, {
            next: { revalidate: 86400 },
          })

          if (textRes.ok) {
            const rawText = await textRes.text()

            // Strip the Gutenberg header/footer boilerplate
            const cleaned = stripGutenbergBoilerplate(rawText)

            // Split into paragraphs (double newline separated)
            const paragraphs = cleaned
              .split(/\n{2,}/)
              .map((p) => p.replace(/\n/g, ' ').trim())
              .filter((p) => p.length > 30) // drop very short fragments
              .slice(0, 200) // cap to ~200 paragraphs for performance

            return NextResponse.json({
              source: 'gutenberg',
              gutenbergId: book.id,
              gutenbergTitle: book.title,
              paragraphs,
            })
          }
        }
      }
    }

    // --- Step 2: fallback – generate sample content ------------------------
    const paragraphs = generateSampleContent(title, author)

    return NextResponse.json({
      source: 'sample',
      gutenbergId: null,
      gutenbergTitle: null,
      paragraphs,
    })
  } catch (error) {
    console.error('Error fetching book content:', error)

    // Even on error, return sample content so the reader works
    const paragraphs = generateSampleContent(title, author)
    return NextResponse.json({
      source: 'sample',
      gutenbergId: null,
      gutenbergTitle: null,
      paragraphs,
    })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripGutenbergBoilerplate(text: string): string {
  // Project Gutenberg texts start with *** START OF … and end with *** END OF …
  const startMarker = /\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG.*?\*\*\*/i
  const endMarker = /\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG.*?\*\*\*/i

  const startMatch = text.match(startMarker)
  const endMatch = text.match(endMarker)

  const startIdx = startMatch ? (startMatch.index ?? 0) + startMatch[0].length : 0
  const endIdx = endMatch ? endMatch.index ?? text.length : text.length

  return text.slice(startIdx, endIdx).trim()
}

function generateSampleContent(title: string, author: string): string[] {
  return [
    `${title} — a story by ${author || 'an unknown author'}.`,

    `The morning sun cast long, amber streaks across the study floor. Dust motes swirled in the light, tracing invisible currents of air that whispered through the half-open window. It was the kind of morning that promised both revelation and regret — the kind of morning, in other words, that every great story deserves.`,

    `He sat at the edge of his chair, fingers tracing the spine of an old journal he had not opened in years. The leather was cracked, the pages yellowed, but the words inside still pulsed with a vitality that time had failed to diminish. Each sentence carried the weight of a memory, and every paragraph was a door he had once closed deliberately.`,

    `"There are certain truths," she had told him once, leaning against the railing of that bridge overlooking the river, "that you cannot unknow. Once you have seen them, they live behind your eyes, colouring everything."`,

    `He had laughed then — a careless, youthful laugh — because the river was glittering and the evening was warm and the future seemed as infinite as the sky reflected in the water. He did not yet understand what she meant.`,

    `Years later, standing in the same spot, he understood perfectly. The river still glittered, but now it seemed to glitter with a kind of sadness, as if it too remembered what had been said there and mourned the innocence of those words.`,

    `The town had changed in the intervening decades. Shops that once sold handmade pottery and fresh bread now offered artisanal coffee and vintage clothing. The old cinema, where they had watched flickering black-and-white films on rainy afternoons, had become a co-working space filled with the soft clatter of laptop keyboards.`,

    `But some things remained. The oak tree in the square still spread its gnarled branches over the stone bench where old Mr. Hartley used to sit, feeding pigeons and telling stories to anyone who would listen. The fountain still sang its quiet song, though the bronze figure at its center had turned a deeper shade of green.`,

    `She had left the town first — a scholarship, a distant university, a life that unfolded in directions neither of them could have predicted. Her letters came frequently at first, then less so, then not at all. It was not cruelty; it was simply the way that distance, given enough time, erodes even the most carefully maintained connections.`,

    `He stayed behind, not out of loyalty to the town, but out of a kind of inertia that he would later recognize as fear. Fear of the unknown, fear of failure, fear of discovering that the world beyond the valley was not the magical place he had imagined but merely a larger version of the same ordinary life he already knew.`,

    `The journal in his hands was hers. She had pressed it into his palms the night before she left, her eyes bright with tears she would not let fall. "Read it when you're ready," she had said. "Not before."`,

    `He had waited. For twenty-three years, he had waited, and the journal had sat on the highest shelf of his bookcase, gathering dust and patience in equal measure. Now, at last, the time felt right.`,

    `He opened the cover. The first page bore a single line, written in her careful, sloping hand: "For the one who stays — so that he might understand why I had to go."`,

    `And so he began to read, and the world around him — the study, the sunlight, the distant sound of traffic — slowly faded, replaced by the vivid, breathing landscape of her words. It was as if she were sitting beside him, speaking softly into his ear, and the years between them collapsed into nothing.`,

    `Chapter by chapter, the story unfolded. It was not the story he had expected — not a tale of adventure or ambition, but something quieter and more devastating. It was a story about the spaces between people, the silences that speak louder than words, the way love can exist perfectly well without being spoken aloud.`,

    `The afternoon light shifted and lengthened. Shadows crept across the floor, reaching toward his chair like gentle fingers. He did not notice. He was elsewhere, in the world she had built from sentences and paragraphs, a world that was both entirely fictional and utterly, achingly true.`,

    `When he finally set the journal down, the room was dark. Stars had appeared in the window, distant and indifferent. His tea had gone cold on the side table, a skin forming on its surface like a tiny, fragile continent.`,

    `He sat for a long time in the darkness, thinking about what he had read. Then, slowly, he reached for a pen and a blank sheet of paper, and he began to write.`,

    `"Dear friend," he wrote, and then paused, because the word seemed both too small and too large for what he wanted to say. He crossed it out and started again.`,

    `"Dear you — I have finally read it. All of it. And I understand now. I understand why you left, why you had to leave, and why you could not explain it then. I understand that some truths can only be told in stories, and some stories can only be read when the reader is finally ready to hear them."`,

    `He set the pen down and looked out at the stars. Somewhere, in a city he had never visited, she might be looking at the same sky. The thought was both comforting and impossibly sad, and he held it gently, the way you hold something fragile — with care, with tenderness, with the full knowledge that it might break at any moment.`,

    `But for now, in this quiet room, in this small town, at the end of this long day, it was enough. It was more than enough. It was everything.`,

    `— The End —`,
  ]
}
