const strings = {
  en: {
    // Nav
    navExplore: "Explore",
    navCinema: "Cinema",
    navChat: "AI Chat",
    signIn: "Sign in",
    signOut: "Sign out",
    langLabel: "Language:",

    // Hero
    heroTitle: "Swazi Cultural Heritage",
    heroSubtitle:
      "Preserving the rich traditions, royal lineages, and ceremonies of the Kingdom of Eswatini",
    ctaExplore: "Explore Ceremonies",
    ctaAsk: "Ask AI About Culture",
    ctaSignIn: "Sign In to Explore",

    // Stats
    statCeremonies: "Ceremonies",
    statLineage: "Lineage Records",
    statFounded: "Kingdom Founded",

    // Sections
    featuredTitle: "Featured Ceremonies",
    featuredSub: "Sacred traditions of Eswatini",
    viewAll: "View all →",
    noCeremonies: "No ceremonies published yet.",
    lineageTitle: "Royal Lineage Records",
    lineageSub: "The lineage of Swazi kings and clans",

    // Discover More
    discoverTitle: "Discover More",
    discoverSub: "Explore all aspects of Swazi cultural heritage",
    exploreCardTitle: "Explore Culture",
    exploreCardDesc:
      "Browse ceremonies, songs, and traditional attire of Eswatini",
    browseCta: "Browse →",
    chatCardTitle: "AI Cultural Chat",
    chatCardDesc:
      "Ask our AI assistant anything about Swazi culture and traditions",
    askCta: "Ask now →",
    cinemaCardTitle: "Cultural Cinema",
    cinemaCardDesc: "Watch live and recorded traditional cultural events",
    sessionsCta: "View sessions →",
  },
  ss: {
    // Nav
    navExplore: "Hlola",
    navCinema: "Isinema",
    navChat: "Coca ne-AI",
    signIn: "Ngena",
    signOut: "Phuma",
    langLabel: "Lulwimi:",

    // Hero
    heroTitle: "Imvelaphi YamaSwati",
    heroSubtitle:
      "Kulondvolota Imikhuba, Luhlanga Lwemabandla, Nemigidvo YakaNgwane",
    ctaExplore: "Hlola Imigidvo",
    ctaAsk: "Buta i-AI Ngenhlalo",
    ctaSignIn: "Ngena Kute Uhlole",

    // Stats
    statCeremonies: "Imigidvo",
    statLineage: "Lirekodi Loluhlanga",
    statFounded: "Umbuso Wasungulwa",

    // Sections
    featuredTitle: "Imigidvo Leyikhetsiwe",
    featuredSub: "Imikhuba Lemihle YakaNgwane",
    viewAll: "Bona Konkhe →",
    noCeremonies: "Ayikho Imigidvo Leyashicilelwa.",
    lineageTitle: "Lirekodi Loluhlanga LwemaBandla",
    lineageSub: "Luhlanga LwemaKhosi Nemabandla aSwati",

    // Discover More
    discoverTitle: "Titfola Lokunyenti",
    discoverSub: "Hlola Tonkhe Tingcalo Tenhlalo YamaSwati",
    exploreCardTitle: "Hlola Inhlalo",
    exploreCardDesc: "Chaza Imigidvo, Tihlabelelo, Netigqoko temaSwati",
    browseCta: "Chaza →",
    chatCardTitle: "Ingcogco-AI Yenhlalo",
    chatCardDesc: "Buta i-AI yetfu noma ngani ngenhlalo yamaSwati",
    askCta: "Buta Manje →",
    cinemaCardTitle: "Isinema Senhlalo",
    cinemaCardDesc: "Buka Imcimbi Yemasiko Yesontfo netasebhaliwe",
    sessionsCta: "Buka Imihlangano →",
  },
};

export const ui = (lang, key) => strings[lang]?.[key] ?? strings.en[key] ?? key;
