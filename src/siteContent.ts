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
    facebookUrl?: string;
    instagramUrl?: string;
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
  everydayElegance?: {
    title: string;
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
    tagline: 'A Curated Collection of Everyday Elegance.',
    phone: '+1 (800) 843-2678',
    email: 'concierge@signorabloom.com',
    conciergeHours: 'Mon - Sat, 9:00 AM - 8:00 PM EST',
    address: 'Signora Bloom Concierge',
    facebookUrl: 'https://www.facebook.com/signorabloom/',
    instagramUrl: 'https://instagram.com/tuhinajahantopa',
  },
  hero: {
    slides: [
      {
        id: 0,
        image: '/assets/images/jewelry_hero_clean_1_1789492829951.jpg',
        alt: 'Signora Bloom — A Curated Collection of Everyday Elegance',
        headline: 'SIGNORA BLOOM',
        buttonText: 'SHOP COLLECTION',
      },
      {
        id: 1,
        image: '/assets/images/jewelry_hero_clean_2_1789492847429.jpg',
        alt: 'Thoughtfully curated women\'s accessories for everyday style',
        headline: 'EVERYDAY ELEGANCE, BEAUTIFULLY CURATED',
        buttonText: 'SHOP COLLECTION',
      },
      {
        id: 2,
        image: '/assets/images/jewelry_hero_clean_3_1789492876099.jpg',
        alt: 'Versatile fashion accessories designed to elevate any look',
        headline: 'STYLE IT YOUR WAY',
        buttonText: 'EXPLORE NEW ARRIVALS',
      },
    ],
  },
  collections: [
    {
      id: 'fine-rings',
      title: 'RINGS',
      subtitle: 'Feminine statement pieces and delicate designs to complete your look.',
      category: 'rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85',
      itemCount: 'Curated Selection',
      span: 'tall',
    },
    {
      id: 'sculptural-bracelets',
      title: 'BANGLES & BRACELETS',
      subtitle: 'Beautifully detailed styles for stacking, layering and everyday wear.',
      category: 'bracelets',
      image: 'https://images.unsplash.com/photo-1611591475879-f191b702ec49?auto=format&fit=crop&w=800&q=85',
      itemCount: 'Curated Selection',
      span: 'square',
    },
    {
      id: 'drop-hoop-earrings',
      title: 'EARRINGS',
      subtitle: 'Elegant finishing touches designed to elevate everyday outfits.',
      category: 'earrings',
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=85',
      itemCount: 'Curated Selection',
      span: 'square',
    },
    {
      id: 'medallion-necklaces',
      title: 'JEWELRY',
      subtitle: 'Elegant pieces designed to complement everyday looks.',
      category: 'jewelry',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
      itemCount: 'Curated Selection',
      span: 'wide',
    },
    {
      id: 'shop-charms',
      title: "WOMEN'S ACCESSORIES",
      subtitle: 'Curated accessories chosen to bring personality and polish to your style.',
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
      itemCount: 'Curated Selection',
      span: 'tall',
    },
  ],
  editorial: {
    tabs: [
      {
        id: 'beauty-ingenuity',
        tabLabel: 'THE SIGNORA BLOOM EDIT',
        headline: 'The Signora Bloom Edit',
        description: 'Discover thoughtfully selected accessories designed to make everyday styling feel a little more special. From elegant jewelry to expressive finishing touches, Signora Bloom brings together pieces made for modern, effortless elegance.',
        mainImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=900&q=85',
        insetDetailImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=85',
        buttonLabel: 'DISCOVER SIGNORA',
      },
      {
        id: 'ear-stack-magic',
        tabLabel: 'EVERYDAY ELEGANCE',
        headline: 'Style It Your Way',
        description: 'Style your look your way. Layer bracelets, stack bangles, add a statement ring or finish an outfit with a delicate accessory — Signora Bloom makes everyday styling beautifully effortless.',
        mainImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
        insetDetailImage: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=85',
        buttonLabel: 'EXPLORE STYLING',
      },
      {
        id: 'wristwear-essentials',
        tabLabel: 'CURATED DETAILS',
        headline: 'Curated For Everyday Elegance',
        description: "At Signora Bloom, we curate women's accessories that add a refined finishing touch to everyday style. From intricate textures to graceful silhouettes, each piece is selected for beauty, versatility, and everyday wear.",
        mainImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
        insetDetailImage: 'https://images.unsplash.com/photo-1611591475879-f191b702ec49?auto=format&fit=crop&w=600&q=85',
        buttonLabel: 'SHOP COLLECTION',
      },
    ],
  },
  giftSection: {
    badge: 'A CURATED COLLECTION OF EVERYDAY ELEGANCE',
    headline: 'WHY SIGNORA BLOOM',
    subheadline: "Thoughtfully selected accessories designed to bring effortless elegance to your everyday style.",
    boxLabel: 'SIGNORA BLOOM',
    boxTheme: 'crimson',
    perks: [
      {
        title: 'Curated Selection',
        desc: "Thoughtfully selected accessories for modern everyday style.",
      },
      {
        title: 'Effortless Elegance',
        desc: 'Pieces chosen to complement both everyday looks and special moments.',
      },
      {
        title: 'Detail-Focused',
        desc: 'From texture to finish, every piece is selected for its visual character.',
      },
    ],
    features: [
      {
        number: '01',
        title: 'CURATED WITH CARE',
        description: "A thoughtfully selected collection of women's accessories.",
      },
      {
        number: '02',
        title: 'EFFORTLESS STYLE',
        description: 'Pieces designed to complement everyday fashion.',
      },
      {
        number: '03',
        title: 'BEAUTIFUL DETAILS',
        description: 'Intricate textures, elegant finishes and feminine designs.',
      },
      {
        number: '04',
        title: 'VERSATILE ACCESSORIES',
        description: 'Easy-to-style pieces for different looks and occasions.',
      },
    ],
  },
  everydayElegance: {
    title: 'Everyday Elegance',
  },
  products: [
    {
      id: 'lumina-ring',
      refCode: 'SB-RG-01',
      name: 'Lumina Pavé Eternity Band',
      category: 'rings',
      categoryLabel: 'Rings',
      price: '$48',
      tagline: 'Detailed gold-tone design with an elegant textured finish',
      description: 'An eye-catching piece designed to add a refined touch to everyday styling with delicate light-catching details.',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=85',
      badge: 'Featured',
    },
    {
      id: 'aurelia-bangle',
      refCode: 'SB-BG-02',
      name: 'Aurelia Sculpted Torque Cuff',
      category: 'bracelets',
      categoryLabel: 'Bracelets',
      price: '$58',
      tagline: 'Smooth satin finish and graceful curved silhouette',
      description: 'A sculpted open-cuff silhouette designed for effortless slip-on wear and comfortable everyday layering.',
      image: 'https://images.unsplash.com/photo-1611591475879-f191b702ec49?auto=format&fit=crop&w=700&q=85',
      badge: 'Bestseller',
    },
    {
      id: 'seraphina-earrings',
      refCode: 'SB-ER-03',
      name: 'Seraphina Ribbed Hoops',
      category: 'earrings',
      categoryLabel: 'Earrings',
      price: '$38',
      tagline: 'Fluted textured hoops with warm champagne shine',
      description: 'Lightweight everyday hoops featuring elegant ribbed contouring that brings effortless polish to any outfit.',
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=700&q=85',
      badge: 'New Arrival',
    },
    {
      id: 'solaris-pendant',
      refCode: 'SB-NK-04',
      name: 'Solaris Sun Coin Medallion',
      category: 'necklaces',
      categoryLabel: 'Necklaces',
      price: '$45',
      tagline: 'Embossed medallion pendant with delicate link chain',
      description: 'A versatile pendant necklace designed with subtle relief texture, ideal as a solo accent or layering piece.',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=85',
    },
    {
      id: 'marquise-choker',
      refCode: 'SB-NK-05',
      name: 'Marquise Shimmer Choker',
      category: 'necklaces',
      categoryLabel: 'Necklaces',
      price: '$42',
      tagline: 'Fluid herringbone weave with subtle luminous sheen',
      description: 'Drapes smoothly along the collarbone, adding a sleek and modern finishing touch to casual or evening looks.',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=85',
    },
    {
      id: 'florence-dome-ring',
      refCode: 'SB-RG-06',
      name: 'Florence Fluted Dome Ring',
      category: 'rings',
      categoryLabel: 'Rings',
      price: '$36',
      tagline: 'Sculptural curved dome with polished reflective surface',
      description: 'A smooth statement ring with comfortable inner contouring, designed for effortless everyday wear.',
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=700&q=85',
      badge: 'Popular',
    },
    {
      id: 'celeste-drop-earrings',
      refCode: 'SB-ER-07',
      name: 'Celeste Diamond Droplet Pins',
      category: 'earrings',
      categoryLabel: 'Earrings',
      price: '$44',
      tagline: 'Delicate crystal-accent drop earrings',
      description: 'Designed with subtle articulated drops that catch the light gently with every movement.',
      image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=700&q=85',
    },
    {
      id: 'verona-tennis-bracelet',
      refCode: 'SB-BG-08',
      name: 'Verona Four-Prong Tennis Bracelet',
      category: 'bracelets',
      categoryLabel: 'Bracelets',
      price: '$52',
      tagline: 'Classic shimmering link bracelet with secure clasp',
      description: 'An elegant accessory designed to complement both casual and dressed-up looks with balanced sparkle.',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=85',
      badge: 'Essential',
    },
  ],
  footer: {
    newsletterTitle: 'STAY CONNECTED WITH SIGNORA BLOOM',
    newsletterDesc: 'Discover new arrivals, curated collections and everyday styling inspiration.',
    copyright: '© 2026 Signora Bloom. All rights reserved.',
  },
};
