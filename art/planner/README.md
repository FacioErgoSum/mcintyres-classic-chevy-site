# Parts finder pictures

The parts finder (/planner) shows a picture on each choice once the picture is in
`public/planner/`. Each step switches from the plain list to picture tiles as soon
as **one** of its pictures exists, so you can add them a few at a time.

**How to add one:** run the reference (or just the prompt) through Gemini, touch it up,
then save it in `public/planner/` with the exact file name below. `.webp`, `.png` or
`.jpg` all work. Restart `npm run dev` (or deploy) and it shows up.

Keep the style the same across every picture so the grid looks like one set.

**Zoom to fit is automatic.** When the site builds, any plain white (or see-through)
border around a picture is trimmed off, so every part fills its tile the same way.
Your file in `public/planner/` isn't changed; the trimmed copy goes in
`public/planner/fit/`, which is made fresh on every build (don't edit it).

## The style (paste this at the start of every prompt)

> Vintage auto-parts catalog illustration. Bold clean black outlines, flat cel-shaded
> metal in 3–4 tones of grey with crisp white highlights, slightly posterized, like a
> 1980s restoration parts catalog. One object, centered, isolated on a pure white
> background. No text, no logos, no badges, no watermark, no floor shadow.

## Step 1: year (3 pictures)

**Done:** `year-1955.png`, `year-1956.png`, `year-1957.png` are cut out from your
turquoise-and-white photo (background removed, facing right). To posterize them,
run them through your filter and save over the same names.

Size about **1500 × 600** (5:2), car facing **right** (to match the year pictures), exact side view, wheels level, whole
car in frame with a little white space around it. Same paint on all cars so the
year differences stand out: **Tropical Turquoise body with an India Ivory roof**.

| File name | Prompt (after the style text) |
|---|---|
| `year-1955` | Exact side profile of a 1955 Chevrolet Bel Air 2-door hardtop, facing right. Egg-crate grille, straight rear fender, small round tail lights. |
| `year-1956` | Exact side profile of a 1956 Chevrolet Bel Air 2-door hardtop, facing right. Wide rectangular grille, chrome side spear dipping toward the rear wheel, gas filler hidden in the left tail light. |
| `year-1957` | Exact side profile of a 1957 Chevrolet Bel Air 2-door hardtop, facing right. Tall pointed rear fins, anodized side insert panel, twin hood rockets, bumper guards with black rubber tips. |

Reference: `reference/cars-yard-photo.webp` (the cars at the shop) if Gemini needs a
nudge on what Tri-Fives look like.

## Step 2: body style (8 pictures)

Size about **1500 × 600**, same style and paint, all drawn as a **1956** (the middle year)
so only the body shape changes. The roofline and doors are what people need to see.

| File name | Prompt (after the style text) |
|---|---|
| `body-2-door-sedan` | Exact side profile of a 1956 Chevrolet 210 2-door sedan, facing right. Fixed B-pillar between the door and the rear side window. |
| `body-4-door-sedan` | Exact side profile of a 1956 Chevrolet Bel Air 4-door sedan, facing right. Four doors, B-pillar. |
| `body-2-door-hardtop` | Exact side profile of a 1956 Chevrolet Bel Air 2-door hardtop Sport Coupe, facing right. No B-pillar, open side glass. |
| `body-4-door-hardtop` | Exact side profile of a 1956 Chevrolet Bel Air 4-door hardtop Sport Sedan, facing right. Four doors and no B-pillar. |
| `body-convertible` | Exact side profile of a 1956 Chevrolet Bel Air convertible with the top down, facing right. |
| `body-wagon` | Exact side profile of a 1956 Chevrolet 210 4-door station wagon (Townsman), facing right. Long roof, four doors. |
| `body-nomad` | Exact side profile of a 1956 Chevrolet Bel Air Nomad 2-door wagon, facing right. Slanted rear pillar, ribbed roof, wide 2-door. |
| `body-sedan-delivery` | Exact side profile of a 1956 Chevrolet sedan delivery, facing right. Wagon body with solid panels instead of rear side windows. |

Optional: a picture for one year only, e.g. `body-nomad-1957`, is used for '57 buyers
instead of `body-nomad`.

## Step 3: area of the car (10 pictures)

Size **800 × 800** (square), the part at a three-quarter angle like the reference.
Run each reference photo through Gemini with: *"Redraw this exact part in the style
below"* + the style text.

| File name | What it shows | Reference |
|---|---|---|
| `area-floors-trunk` | Complete floor pan with braces | `reference/area-floors-trunk.jpg` |
| `area-quarters-rockers` | '57 quarter panel | `reference/area-quarters-rockers.jpg` |
| `area-front-end` | '55 front fender with headlight opening | `reference/area-front-end.jpg` |
| `area-doors-roof` | Door shell | `reference/area-doors-roof.jpg` |
| `area-bumpers-grille` | '55 bumper set (or use the '57 grille in `…-alt-grille.jpg`) | `reference/area-bumpers-grille.jpg` |
| `area-glass-windows` | Vent window assembly | `reference/area-glass-windows.jpg` |
| `area-trim-emblems` | '57 hood and trunk V's | `reference/area-trim-emblems.jpg` |
| `area-lights` | Headlight bucket, ring and gasket | `reference/area-lights.jpg` |
| `area-interior` | '57 dash panel | `reference/area-interior.jpg` |
| `area-fuel-chassis` | Gas tank | `reference/area-fuel-chassis.jpg` |

The reference photos are Golden Star's product photos, for drawing from only. They
live here, outside `public/`, so they never go on the website.
