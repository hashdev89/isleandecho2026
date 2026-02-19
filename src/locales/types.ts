export type LocaleCode = 'EN' | 'SI' | 'TA' | 'FR' | 'DE' | 'ES'

export interface TranslationKeys {
  nav: {
    home: string
    tourPackage: string
    destinations: string
    blog: string
    about: string
    contact: string
  }
  common: {
    language: string
    currency: string
    register: string
    signOut: string
    adminDashboard: string
    search: string
    subscribe: string
    yourEmail: string
    tagline: string
    readMore: string
    viewAll: string
    bookNow: string
    from: string
    perPerson: string
    days: string
    noTours: string
    noDestinations: string
    loadMore: string
  }
  footer: {
    newsletterTitle: string
    newsletterSubtitle: string
    subscribe: string
    yourEmail: string
    contact: string
    company: string
    support: string
    otherServices: string
    aboutUs: string
    careers: string
    blog: string
    press: string
    giftCards: string
    legalNotice: string
    privacyPolicy: string
    termsAndConditions: string
    sitemap: string
    carHire: string
    activityFinder: string
    tourList: string
    flightFinder: string
    cruiseTicket: string
    holidayRental: string
    travelAgents: string
    privacy: string
    terms: string
    siteMap: string
  }
  home: {
    searchTours: string
    searchDestinations: string
    featuredTourPackages: string
    discoverSriLanka: string
    statsTravelers: string
    statsTours: string
    statsDestinations: string
    customerSupport: string
    whyChooseUs: string
    fromOurBlog: string
    customTrip: string
    whereTo: string
    when: string
    guests: string
    interests: string
  }
}
