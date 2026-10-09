# Content guide

These are the rules every guide follows, whether a person or Claude writes it.

## Who it's for
A worried cat owner who just searched "how to treat my cat's ___". Answer their question in the first paragraph.

## Shape of every guide
1. A short opening: what's going on and how worried to be.
2. Signs or symptoms.
3. Causes.
4. Safe home care, as numbered steps.
5. "Never" / "Don't" list (toxic products, human medicines, home remedies that harm).
6. "See a vet" section with clear warning signs.
7. `## Common questions`: 3 to 5 questions people actually search, each as a `### Question?` heading followed by a short answer. The build turns these into FAQ data for Google, so keep that exact heading.
8. "The short version": two or three sentences.
9. `## Sources`: "This guide is based on published guidance from:" then a bulleted list of the organizations used, each linked to its home page. Only list sources you actually relied on, and never invent a page URL.

## Rules
- Accuracy first. Base claims on established veterinary sources: AAFP, Cornell Feline Health Center, International Cat Care, Companion Animal Parasite Council, Merck Veterinary Manual, ASPCA. Never invent statistics, studies or dosages.
- **No drug doses.** Say "at the dose on the label" or "as your vet prescribes".
- Always send serious or uncertain cases to a vet. Never discourage a vet visit to sell a product.
- Written for **US readers**: American spelling (diarrhea, behavior, fiber, color), US units first with metric in brackets (9 lb (4 kg), 140°F (60°C)), US brand examples (Tylenol, Pepto-Bismol), "litter box", "vet". For poisoning, point to the ASPCA Animal Poison Control Center, (888) 426-4435.
- Plain language, short paragraphs. **800–1,300 words**, not counting the sources list.
- Front matter: `date` and `reviewed` are both today's date for a new guide. When you meaningfully update an old guide, set `reviewed` to today.
- Photo: add `image:` (an Unsplash photo id such as `photo-1511275539165-cc46b1ee89bf`) and `imageAlt:` (a short, plain description of the photo) to the front matter. Find one with WebFetch on `https://unsplash.com/s/photos/<words>?license=free`, pick a free photo (images.unsplash.com, never plus.unsplash.com) whose description matches the guide, and use a photo no other guide uses. If no fitting photo turns up, leave both out and the topic illustration is shown instead.
- No filler intros, no "In conclusion", no keyword stuffing.
- One topic per guide. Check `content/guides/` first and don't duplicate an existing guide; update it instead.
- Link to 1–3 related guides on the site with relative links like `/guides/how-to-treat-cat-fleas/`.
- `category` must be one of: Digestion, Skin and parasites, Food and treats, Behavior, Health conditions, Care and grooming, Toys and gear. Each has its own topic page and illustration.

## Buying guides (Toys and gear)
Buying guides help someone choose a product: "best X for cats" or "how to choose X". They are where most affiliate income will come from. Use this shape instead of the health guide shape:
1. A short opening: why it matters and the quick answer.
2. What to look for (the features that matter).
3. A table of the main types, what each is best for, and what to know.
4. Placement, setup or how to use it.
5. What to avoid, including any safety risks, with a vet note where health is involved.
6. `## Common questions`, `## The short version` and `## Sources`, as for health guides.

Rules for buying guides:
- **Never claim we tested or own a product**, and never invent reviews, star ratings, prices or "editor's choice" awards.
- Describe product *types* and features rather than specific brands. Add a "Shop" column to the types table with an Amazon link for each type (see below).
- After the types table, add a `## Popular picks` section naming 3 to 6 **specific products** (one per type), as bullets: `- **Exact product name.** One plain sentence on what it is and who it suits. [Check price on Amazon](amazon:exact product name)`. Only pick long-established products from well-known brands that you find recommended by several independent review sites (search the web to check); never invent a product. Open the section with: "These are popular, widely recommended examples of each type... We haven't tested them ourselves, so check the reviews and sizes on Amazon before you buy." Add the same products to `content/pages/best-cat-products.md` as `[Short name](amazon:exact product name) [More <type>](amazon:type search)` in the Popular pick column.
- After publishing a buying guide, add a short section for it to `content/pages/best-cat-products.md` (a sentence, a link to the guide, and a Type / Best for / Shop table with its top 3 to 6 types), so the Best products page stays complete.

## Affiliate links
- Only add links from programs listed in `AFFILIATES.md`, and only where a product genuinely fits the advice.
- Never put a product recommendation above a "see a vet" warning.
- **Amazon (active):** write `[See water fountains](amazon:cat water fountain)`. The build turns it into an amazon.com search link with our tag, marks it `rel="sponsored nofollow"`, and adds the affiliate notice at the top of the guide. Use specific, sensible search words. Don't hand-write Amazon URLs.
- In health guides, link only everyday care products (combs, fountains, litter boxes, treats), never medicines, and only in the home care steps, not in the "see a vet" sections.
- 1 to 3 Amazon links in a health guide. In a buying guide, one link per type in the table plus one per named product in Popular picks.

## Topic backlog
Write these next, roughly in order, and remove each from the list once published (buying guides go in the Toys and gear category):
- How to treat a cat's upset stomach and vomiting
- How to treat dry, flaky skin in cats
- Buying guide: best cat trees for indoor cats
- How to treat worms in cats
- How to help a cat with a urinary tract problem (FLUTD)
- Buying guide: how to choose a litter box (and the best litter types)
- How to treat cat acne
- How to treat a cat's eye infection or runny eyes
- Buying guide: best cat beds and where cats like to sleep
- How to help a cat with arthritis
- How to treat a cat bite or scratch wound (on the cat)
- Buying guide: how to choose a cat carrier for vet trips
- How to help a stressed or anxious cat
- How to get a picky cat to eat
- Buying guide: best cat water fountains
- How to help an overweight cat lose weight
- How to treat bad breath and gum disease in cats
- Buying guide: best puzzle feeders and slow feeders
- How to treat ringworm in cats
- How to care for a cat with kidney disease
- Buying guide: best cat grooming brushes by coat type
- How to give a cat a tablet
- How to treat a cat with a cold (upper respiratory infection)
- Buying guide: best cat window perches and outdoor enclosures (catios)
- How to stop a cat over-grooming
- Best treats for cats with sensitive stomachs
- How to treat a cat's matted fur
- How to help a cat with hyperthyroidism
