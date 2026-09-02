# Hero illustration — image-generation brief

Attach: `WhatsApp Image 2026-09-02 at 11.46.16 PM.jpeg` (the cycling photo).
**Crop it to just Anirudh and the bike before uploading** — the two other people in the
frame will otherwise be pulled into the output.

Save the result into this folder (any name, `.png` or `.webp`), delete `desk.svg`, and the
hero swaps automatically. No code change.

---

## The prompt

> **Use the attached photograph as a likeness reference only.** Take from it: the man's face,
> his rectangular dark-framed glasses, his short dark hair, his build and his approximate
> age (early twenties), and the shape of his black hardtail mountain bike. **Discard
> everything else from it** — the background greenery, the path, the other people, the cap,
> the clothing, the daylight and the colour palette. None of those appear in the output.
>
> **Subject.** A single illustrated scene: that same man, seated at a desk, drawn from a
> slight three-quarter angle, turned a little away from the viewer. He is absorbed in the
> work in front of him — calm and occupied, not posing and not smiling at the camera. He
> wears a plain dark long-sleeved shirt, no cap, no logos, no pattern. He should be
> recognisably the person in the photograph, but rendered as line art, not as a portrait
> likeness study.
>
> **The desk is the real subject — it is a portrait made of his objects.** On it, arranged
> naturally and not in a row:
> - An open laptop, angled toward him, its screen showing a small **node-and-edge diagram** —
>   circles joined by straight lines, like a compiler's control-flow graph. This is the one
>   bright thing in the picture.
> - A **harmonica** lying flat near his hand.
> - A stack of three or four **books** on markets and finance, one lying open.
> - A **printed academic paper**, a few sheets, with a small diagram visible on the top page.
> - A **mug**.
>
> **On the wall behind him**, two things:
> - A **window divided into two panes**. Through the left pane: snow-covered alpine peaks
>   under a pale sky. Through the right pane: a dense tropical harbour skyline at dusk. The
>   two panes deliberately look onto two different places.
> - A **pinned board** of loose sheets held by pins. One of those sheets carries the *same*
>   node-and-edge graph that is on the laptop screen — the picture's one internal rhyme.
>
> **In the foreground, cropped by the edges of the frame:**
> - The **front wheel and forks of the mountain bike** entering from the left edge, only
>   partly visible.
> - A **squash racket** leaning against the desk.
> - The **near end of an upright piano keyboard** at the lower right, seen at a shallow angle.
>
> **Style — this is the most important part.** A fine-lined editorial illustration in the
> manner of an engraved technical plate or a New Yorker spot illustration. Confident, even,
> thin line work of consistent weight. Shadow indicated by **cross-hatching and parallel
> hatching only**. Absolutely flat: no gradients, no glow, no bloom, no soft shading, no
> ambient occlusion, no 3D rendering, no photorealism, no painterly texture, no cel-shaded
> cartoon fills.
>
> **Palette — strictly three values and no others.** A near-black blue-tinted background
> (#08090b). Warm off-white line work (#e9e5dd) for every object, figure and outline. And
> exactly one accent, a cold platinum blue (#9fc4e8), used **only** on the graph on the
> laptop screen, the matching graph on the pinned sheet, and a thin suggestion of light in
> the window. Nothing else in the image is coloured. No warm tones, no greens, no purple, no
> teal, no neon.
>
> **Composition.** Square, 1:1. He sits slightly left of centre. The desk runs across the
> lower-middle third. The window and pinned board occupy the upper wall. The bicycle wheel,
> racket and piano crop against the frame edges so the scene reads as a slice of a larger
> room. **Fill the frame** — the objects should occupy the composition generously rather
> than floating as a small motif in a large empty field, but keep the background clean and
> uncluttered between them.
>
> **No text anywhere in the image.** No letters, no words, no numbers, no labels, no titles,
> no signage, no book spines with writing, no watermark, no signature. All typography on the
> page is supplied separately, and generated lettering always comes out malformed.
>
> Output: square 1:1, at least 1024×1024. Transparent background if the tool supports it;
> otherwise solid #08090b.

---

## Negative prompt / avoid

text, letters, words, numbers, watermark, signature, logos, brand marks, book titles,
photorealism, 3D render, octane, unreal engine, painterly, oil painting, watercolour,
gradients, glow, bloom, lens flare, bokeh, depth of field, vignette, neon, cyberpunk,
purple and blue gradient, teal and orange, corporate flat-vector illustration, cartoon
mascot, chibi, anime, extra people, crowd, children, greenery, jungle, daylight, outdoor
scene, baseball cap, patterned shirt, extra fingers, malformed hands, distorted glasses,
duplicated limbs, cluttered background

---

## If the result is not right

- **Face comes out wrong or uncanny.** This is the most likely failure. Ask for the figure
  seen more from behind and to one side, so the face is three-quarter-away and reads as a
  person rather than as a likeness. The scene works fine without a clear face — the desk is
  doing the characterisation.
- **It comes back in colour.** Repeat the palette constraint as its own sentence at the very
  end of the prompt; models weight the tail of a prompt heavily.
- **It looks like a 3D render.** Add "flat 2D line drawing, ink on paper, no rendering" and
  put "engraving" earlier in the style sentence.
- **Objects are missing.** Generate at a larger size, or drop the squash racket and the
  piano — the laptop, books, harmonica, window and bicycle carry the idea on their own.

## After you add it

- The page applies `saturate(0.9) contrast(1.03) brightness(0.97)` so a generated image
  cannot drag its own colour temperature onto the site. If the artwork already sits in-key,
  that rule can be deleted — it is one block, `.hero__illustration` in `src/styles/app.css`.
- If the file is over ~400 KB, run `npm run images`.
- Update the `alt` text in `src/components/Hero.tsx` to describe what the final image
  actually shows. The current alt describes the hand-drawn `desk.svg`.
