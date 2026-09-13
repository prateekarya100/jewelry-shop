// Seed catalogue. Replace image/video URLs from the Admin Studio (password: aura-admin)
// once you have real product photography and turntable/demo videos of your pieces.
// Video field accepts a direct .mp4 URL or a YouTube watch/embed URL.

const SAMPLE_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const SAMPLE_VIDEO_2 =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";

const seedProducts = [
  {
    id: "p_ring_amara",
    title: "Amara Solitaire Ring",
    category: "Rings",
    tagline: "A single stone, quietly stated",
    description:
      "Hand-set in 18k gold vermeil, the Amara carries one lab-grown solitaire on a tapered band. Comfortable enough for every day, formal enough for the nights that matter.",
    price: 18500,
    discount: 10,
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1200&auto=format&fit=crop",
    ],
    video: SAMPLE_VIDEO,
    material: "18k gold vermeil, lab-grown diamond",
    stock: 12,
  },
  {
    id: "p_ring_vela",
    title: "Vela Twist Band",
    category: "Rings",
    tagline: "Two threads of gold, wound once",
    description:
      "An open, twisted band in solid 92.5 silver with a warm gold plate. Stacks well with the Amara, or wears alone.",
    price: 6200,
    discount: 0,
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1200&auto=format&fit=crop",
    ],
    video: "",
    material: "925 silver, gold plated",
    stock: 30,
  },
  {
    id: "p_neck_meera",
    title: "Meera Layered Necklace",
    category: "Necklaces",
    tagline: "Three lengths, one clasp",
    description:
      "A pre-layered chain in three drops, finished with a hand-finished pendant at the shortest length. No tangling, no second necklace to buy.",
    price: 24800,
    discount: 15,
    images: [
      "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=1200&auto=format&fit=crop",
    ],
    video: SAMPLE_VIDEO_2,
    material: "18k gold vermeil",
    stock: 8,
  },
  {
    id: "p_neck_iris",
    title: "Iris Pearl Strand",
    category: "Necklaces",
    tagline: "Freshwater pearls, hand-knotted",
    description:
      "Each pearl is individually knotted on silk thread — the traditional way, so a broken strand never means a lost necklace.",
    price: 15900,
    discount: 0,
    images: ["https://postimg.cc/RW5hLZPS"],
    video: "",
    material: "Freshwater pearl, silk thread",
    stock: 20,
  },
  {
    id: "p_ear_nadia",
    title: "Nadia Drop Earrings",
    category: "Earrings",
    tagline: "Movement without weight",
    description:
      "A articulated drop in brushed gold, light enough to wear from morning meetings into dinner.",
    price: 9800,
    discount: 20,
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=1200&auto=format&fit=crop",
    ],
    video: SAMPLE_VIDEO,
    material: "18k gold vermeil",
    stock: 16,
  },
  {
    id: "p_ear_soleil",
    title: "Soleil Hoop Set",
    category: "Earrings",
    tagline: "Three sizes, one drawer",
    description:
      "A set of three graduated hoops — small for daily wear, large for everything else.",
    price: 7400,
    discount: 0,
    images: [
      "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?q=80&w=1200&auto=format&fit=crop",
    ],
    video: "",
    material: "925 silver, gold plated",
    stock: 25,
  },
  {
    id: "p_bang_tara",
    title: "Tara Cuff Bangle",
    category: "Bangles",
    tagline: "One piece, hand-hammered",
    description:
      "Cut from a single sheet and hand-hammered for texture, the Tara cuff is adjustable to most wrist sizes.",
    price: 12600,
    discount: 5,
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1200&auto=format&fit=crop",
    ],
    video: SAMPLE_VIDEO_2,
    material: "Brass, 18k gold plated",
    stock: 14,
  },
  {
    id: "p_bang_kavi",
    title: "Kavi Charm Bracelet",
    category: "Bangles",
    tagline: "Start with one charm",
    description:
      "A fine chain bracelet designed to grow — add a charm for every year, or leave it as it is.",
    price: 5400,
    discount: 0,
    images: [
      "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?q=80&w=1200&auto=format&fit=crop",
    ],
    video: "",
    material: "925 silver",
    stock: 40,
  },
];

export default seedProducts;
