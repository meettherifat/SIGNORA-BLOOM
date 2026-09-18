export interface CollectionItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  itemCount: string;
  span?: string;
}

export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    conciergeHours: string;
    address: string;
  };
  hero: {
    slides: {
      id: number;
      image: string;
      alt: string;
      headline: string;
      buttonText: string;
    }[];
  };
  collections: CollectionItem[];
  editorial: {
    tabs: {
      id: string;
      tabLabel: string;
      headline: string;
      description: string;
      mainImage: string;
      insetDetailImage: string;
      buttonLabel: string;
    }[];
  };
  giftSection: {
    badge: string;
    headline: string;
    subheadline: string;
    boxLabel: string;
    boxTheme: 'crimson' | 'noir' | 'champagne' | 'emerald';
    perks: { title: string; desc: string }[];
    features: { number: string; title: string; description: string }[];
  };
  products: {
    id: string;
    refCode: string;
    name: string;
    category: string;
    categoryLabel: string;
    price: string;
    tagline: string;
    description: string;
    image: string;
    badge?: string;
  }[];
  footer: {
    newsletterTitle: string;
    newsletterDesc: string;
    copyright: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  brand: {
    name: 'SIGNORA BLOOM',
    tagline: 'Curated accessories for women celebrating everyday elegance and fine craftsmanship.',
    phone: '+1 (800) 843-2678',
    email: 'concierge@signorabloom.com',
    conciergeHours: 'Mon - Sat, 9:00 AM - 8:00 PM EST',
    address: 'Via Monte Napoleone 8, Milan & 740 Madison Ave, New York',
  },
  hero: {
    slides: [
      {
        id: 0,
        image: '/assets/images/jewelry_hero_clean_1_1789492829951.jpg',
        alt: 'Jewelry for Every Day luxury still life with gold diamond rings and cuff',
        headline: 'Jewelry For Every Day',
        buttonText: 'SHOP NOW',
      },
      {
        id: 1,
        image: '/assets/images/jewelry_hero_clean_2_1789492847429.jpg',
        alt: 'Everyday Sophistication sculpted gold bangles and diamond earrings',
        headline: 'Everyday Sophistication',
        buttonText: 'SHOP NOW',
      },
      {
        id: 2,
        image: '/assets/images/jewelry_hero_clean_3_1789492876099.jpg',
        alt: 'Sculpted In Pure Gold coin medallion pendant on limestone',
        headline: 'Sculpted In Pure Gold',
        buttonText: 'SHOP NOW',
      },
    ],
  },
  collections: [
    {
      id: 'fine-rings',
      title: 'FINE RINGS',
      subtitle: 'Architectural bands & diamond pavé silhouettes',
      category: 'rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85',
      itemCount: '24 Designs',
      span: 'tall',
    },
    {
      id: 'sculptural-bracelets',
      title: 'SCULPTURAL BRACELETS',
      subtitle: 'Torques, curb links & everyday wrist cuffs',
      category: 'bracelets',
      image: 'https://images.unsplash.com/photo-1611591475879-f191b702ec49?auto=format&fit=crop&w=800&q=85',
      itemCount: '18 Designs',
      span: 'square',
    },
    {
      id: 'drop-hoop-earrings',
      title: 'DROP & HOOP EARRINGS',
      subtitle: 'Light-catching chandeliers & modern huggies',
      category: 'earrings',
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=85',
      itemCount: '32 Designs',
      span: 'square',
    },
    {
      id: 'medallion-necklaces',
      title: 'MEDALLION NECKLACES',
      subtitle: 'Layering chains & coin pendants',
      category: 'necklaces',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
      itemCount: '16 Designs',
      span: 'wide',
    },
    {
      id: 'shop-charms',
      title: 'SHOP CHARMS',
      subtitle: 'Sculpted charms & everyday statement pendants',
      category: 'charms',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
      itemCount: '20 Designs',
      span: 'tall',
    },
  ],
  editorial: {
    tabs: [
      {
        id: 'beauty-ingenuity',
        tabLabel: 'BEAUTY & INGENUITY',
        headline: 'Beauty & Ingenuity',
        description: 'Sensory weight and ergonomic fluidity. Each contour is hand-buffed in small artisan studios, achieving luminous light refraction that complements the natural rhythm of everyday movement.',
        mainImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=900&q=85',
        insetDetailImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=85',
        buttonLabel: 'SHOP NOW',
      },
      {
        id: 'ear-stack-magic',
        tabLabel: 'EAR STACK MAGIC',
        headline: 'Ear Stack Magic',
        description: 'Explore the geometry of personal expression through balanced hoops, cuffs, and sculpted studs that catch the light from morning through twilight.',
        mainImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
        insetDetailImage: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=85',
        buttonLabel: 'DISCOVER STACKS',
      },
      {
        id: 'wristwear-essentials',
        tabLabel: 'WRISTWEAR ESSENTIALS',
        headline: 'Wristwear Essentials',
        description: 'Tactile torque cuffs, solid link chains, and fluid bangles cast in 18-karat recycled yellow gold and set with certified brilliant-cut diamonds.',
        mainImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
        insetDetailImage: 'https://images.unsplash.com/photo-1611591475879-f191b702ec49?auto=format&fit=crop&w=600&q=85',
        buttonLabel: 'EXPLORE CUFFS',
      },
    ],
  },
  giftSection: {
    badge: 'COMPLIMENTARY LUXURY PACKAGING',
    headline: 'Surprise A Loved One',
    subheadline: 'Every Signora Bloom piece arrives ensconced in our iconic striped hatbox with hand-tied twill ribbon and an anti-tarnish micro-suede pouch.',
    boxLabel: 'SIGNORA BLOOM',
    boxTheme: 'crimson',
    perks: [
      {
        title: 'Iconic Striped Hatbox',
        desc: 'Rigid heirloom cardboard with hand-pleated ribbon pull.',
      },
      {
        title: 'Custom Calligraphy Note',
        desc: 'Gilded hot-stamped card with your personalized gift message.',
      },
      {
        title: 'Anti-Tarnish Suede Pouch',
        desc: 'Protective dual-chamber travel pouch in blush velvet suede.',
      },
    ],
    features: [
      {
        number: '01',
        title: 'Viverra venenatis donec',
        description: 'Vestibulum ante ipsum primis in faucibus orci luctus',
      },
      {
        number: '02',
        title: 'Viverra venenatis donec',
        description: 'Vestibulum ante ipsum primis in faucibus orci luctus',
      },
      {
        number: '03',
        title: 'Viverra venenatis donec',
        description: 'Vestibulum ante ipsum primis in faucibus orci luctus',
      },
      {
        number: '04',
        title: 'Viverra venenatis donec',
        description: 'Vestibulum ante ipsum primis in faucibus orci luctus',
      },
    ],
  },
  products: [
    {
      id: 'lumina-ring',
      refCode: 'SB-RG-01',
      name: 'Lumina Pavé Eternity Band',
      category: 'rings',
      categoryLabel: 'Rings',
      price: '$480',
      tagline: '18k recycled gold with micro-pavé lab diamonds',
      description: 'A seamless circle of brilliant fire designed for effortless daily stackability or standalone radiance.',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=85',
      badge: '-14%',
    },
    {
      id: 'aurelia-bangle',
      refCode: 'SB-BG-02',
      name: 'Aurelia Sculpted Torque Cuff',
      category: 'bracelets',
      categoryLabel: 'Bracelets',
      price: '$890',
      tagline: 'Satin-finish hand-hammered 18k solid torque',
      description: 'Cast in heavy solid 18k gold with a gently flared organic silhouette that comfortably hugs the wrist bone.',
      image: 'https://images.unsplash.com/photo-1611591475879-f191b702ec49?auto=format&fit=crop&w=700&q=85',
      badge: '-20%',
    },
    {
      id: 'seraphina-earrings',
      refCode: 'SB-ER-03',
      name: 'Seraphina Ribbed Hoops',
      category: 'earrings',
      categoryLabel: 'Earrings',
      price: '$340',
      tagline: 'Fluted architectural chunky hoops in warm champagne gold',
      description: 'Hollow-core construction ensures featherlight all-day comfort while presenting a bold visual weight.',
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=700&q=85',
      badge: 'NEW',
    },
    {
      id: 'solaris-pendant',
      refCode: 'SB-NK-04',
      name: 'Solaris Sun Coin Medallion',
      category: 'necklaces',
      categoryLabel: 'Necklaces',
      price: '$620',
      tagline: 'Intaglio ancient celestial sun talisman on faceted box chain',
      description: 'Drawn from vintage Roman talismans with a hand-engraved radiant sun emblem and textured rim.',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=85',
    },
    {
      id: 'marquise-choker',
      refCode: 'SB-NK-05',
      name: 'Marquise Shimmer Choker',
      category: 'necklaces',
      categoryLabel: 'Necklaces',
      price: '$540',
      tagline: 'Graduated liquid snake chain in 14k polished yellow gold',
      description: 'Fluid drape that catches candlelight at the collarbone with high liquid sheen.',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=85',
    },
    {
      id: 'florence-dome-ring',
      refCode: 'SB-RG-06',
      name: 'Florence Fluted Dome Ring',
      category: 'rings',
      categoryLabel: 'Rings',
      price: '$410',
      tagline: 'Sculptural croissant dome band with mirror polish',
      description: 'A timeless European cocktail classic with smooth comfortable inner contour.',
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=700&q=85',
      badge: 'BESTSELLER',
    },
    {
      id: 'celeste-drop-earrings',
      refCode: 'SB-ER-07',
      name: 'Celeste Diamond Droplet Pins',
      category: 'earrings',
      categoryLabel: 'Earrings',
      price: '$490',
      tagline: 'Briolette bezel-set drops with kinetic articulation',
      description: 'Designed to oscillate gracefully with every gesture, catching subtle daylight.',
      image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=700&q=85',
    },
    {
      id: 'verona-tennis-bracelet',
      refCode: 'SB-BG-08',
      name: 'Verona Four-Prong Tennis Bracelet',
      category: 'bracelets',
      categoryLabel: 'Bracelets',
      price: '$1,250',
      tagline: 'Continuous line of VVS brilliant-cut lab grown diamonds',
      description: 'Low-profile prong settings ensure the bracelet lays flat and never catches on silk sleeves.',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=85',
      badge: 'LIMITED',
    },
  ],
  footer: {
    newsletterTitle: 'The Atelier Journal',
    newsletterDesc: 'Subscribe for private access to seasonal capsule drops, bespoke trunk shows, and editorial styling musings.',
    copyright: '© 2026 SIGNORA BLOOM ATELIER. ALL RIGHTS RESERVED.',
  },
};
