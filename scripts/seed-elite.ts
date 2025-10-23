import { db } from "../server/db";
import { users, entrepreneurs, businesses, entrepreneurBusinesses, products, posts } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedElite() {
  console.log("🌟 Creating ELITE FLORIDA LOCAL profiles...");

  try {
    // ============================================================================
    // ADMIN USERS - Fusion Data Co Team
    // ============================================================================
    
    const [rob] = await db.insert(users).values({
      id: "admin-rob-fusion",
      email: "rob@fusiondataco.com",
      firstName: "Robert",
      lastName: "Yeager",
      isAdmin: true,
    }).onConflictDoUpdate({
      target: users.id,
      set: { 
        firstName: "Robert",
        lastName: "Yeager",
        isAdmin: true, 
        updatedAt: new Date() 
      }
    }).returning();

    const [mat] = await db.insert(users).values({
      id: "admin-mat-fusion",
      email: "mat@fusiondataco.com",
      firstName: "Mat",
      lastName: "Mercado",
      isAdmin: true,
    }).onConflictDoUpdate({
      target: users.id,
      set: { 
        firstName: "Mat",
        lastName: "Mercado",
        isAdmin: true, 
        updatedAt: new Date() 
      }
    }).returning();

    console.log("✅ Created admin users (rob@fusiondataco.com, mat@fusiondataco.com)");

    // ============================================================================
    // ROB YEAGER - Entrepreneur Profile & Fusion Data Co
    // ============================================================================
    
    const [robEntrepreneur] = await db.insert(entrepreneurs).values({
      userId: rob.id,
      firstName: "Robert",
      lastName: "Yeager",
      tagline: "Workflow Automation Architect & Lead Generation Strategist",
      bio: "Transforming Sales Operations Through Intelligent Automation | Helping Companies Scale Revenue Without Scaling Headcount",
      story: `Results-driven workflow automation architect with 15+ years of experience engineering revenue-generating systems for scaling businesses. Specializes in designing sophisticated lead generation pipelines, sales automation frameworks, and AI-powered business intelligence solutions.

Philosophy: "The best sales team is the one that never sleeps. Automation doesn't replace humans—it amplifies them."

Professional Journey:
• Founded Fusion Data Co (2020) - architected 200+ automated workflows generating $50M+ in attributed revenue
• Senior Workflow Consultant (2015-2020) - consulted for 40+ companies on sales automation strategy
• Sales Operations Manager (2010-2015) - managed sales tech stack for 50+ rep teams

Location-independent operations from custom RV workspace ("The MotherShip"), advocating for remote-first, automation-driven business models.`,
      location: "Sacramento, CA (Remote/Mobile RV-based)",
      website: "https://fusiondataco.com",
      yearsExperience: 15,
      specialties: [
        "Workflow Automation (N8N, Make.com, Zapier)",
        "Multi-channel Lead Generation",
        "CRM Optimization & Sales Funnel Engineering",
        "AI Agent Development & Voice Automation",
        "Full-stack Integration (APIs, Webhooks)",
        "Data Enrichment & Attribution Modeling"
      ],
      achievements: [
        "Architected 200+ automated workflows generating $50M+ in attributed revenue",
        "Developed proprietary lead scoring algorithms improving efficiency by 340%",
        "Built AI-powered voice agents processing 10K+ qualification calls monthly",
        "Reduced client CAC by average of 62% through automation optimization",
        "Enabled 3-person sales teams to perform at 15-person capacity",
        "N8N Certified Workflow Developer",
        "Make.com Advanced Automation Specialist",
        "10,000+ hours in automation engineering"
      ],
      socialLinks: {
        website: "https://fusiondataco.com",
        linkedin: "robert-yeager-automation",
        twitter: "@FusionDataCo",
        github: "/FusionDataCo"
      },
      isVerified: true,
      isFeatured: true,
      followerCount: 850,
    }).onConflictDoUpdate({
      target: entrepreneurs.userId,
      set: { updatedAt: new Date() }
    }).returning();

    const [fusionDataCo] = await db.insert(businesses).values({
      ownerId: rob.id,
      name: "Fusion Data Co",
      tagline: "Where Automation Meets Revenue Intelligence",
      description: `Premier workflow automation and revenue intelligence firm that transforms how businesses generate, qualify, and convert leads. We architect sophisticated automation systems that enable small sales teams to perform at enterprise scale.

Mission: Democratize enterprise-grade automation for growing businesses. Every company deserves sales infrastructure that works 24/7/365.

What Makes Us Different:
• Zero-fluff implementations - every workflow drives measurable ROI
• Proprietary frameworks from 200+ successful deployments
• AI-native approach integrating LLMs into every automation layer
• White-glove service with direct founder involvement
• Rapid deployment cycles (weeks, not months)

Services: Lead Generation Architecture, Sales Automation Engineering, AI Agent Development, System Integration & Migration, Training & Enablement

Target Markets: B2B SaaS, Solar/Renewable Energy, Real Estate Technology, Professional Services, E-commerce

Results: $50M+ in attributed client revenue, 98% client retention, 4.9/5 satisfaction score`,
      category: "Business Automation & AI Solutions",
      location: "Sacramento, CA (Remote-First)",
      address: "Remote Operations - Mobile RV Workspace",
      phone: "(916) 555-DATA",
      website: "https://fusiondataco.com",
      email: "support@fusiondataco.com",
      isVerified: true,
      isActive: true,
      rating: "4.9",
      reviewCount: 127,
      followerCount: 1200,
      postCount: 89,
      socialLinks: {
        website: "https://fusiondataco.com",
        linkedin: "/company/fusion-data-co",
        twitter: "@FusionDataCo",
        github: "/FusionDataCo"
      },
      operatingHours: {
        monday: "9:00 AM - 6:00 PM PT",
        tuesday: "9:00 AM - 6:00 PM PT",
        wednesday: "9:00 AM - 6:00 PM PT",
        thursday: "9:00 AM - 6:00 PM PT",
        friday: "9:00 AM - 6:00 PM PT",
        saturday: "Closed",
        sunday: "Closed"
      }
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { updatedAt: new Date() }
    }).returning();

    await db.insert(entrepreneurBusinesses).values({
      entrepreneurId: robEntrepreneur.id,
      businessId: fusionDataCo.id,
      role: "Founder & Chief Automation Officer",
      equityPercentage: "50.00",
      isCurrent: true,
      isPublic: true,
    }).onConflictDoNothing();

    console.log("✅ Created Rob Yeager entrepreneur profile & Fusion Data Co business");

    // ============================================================================
    // MAT MERCADO - Co-Founder of Fusion Data Co
    // ============================================================================

    const [matEntrepreneur] = await db.insert(entrepreneurs).values({
      userId: mat.id,
      firstName: "Mat",
      lastName: "Mercado",
      tagline: "Co-Founder & Automation Strategist at Fusion Data Co",
      bio: "Co-Founder at Fusion Data Co, specializing in sales automation and revenue intelligence. Helping businesses transform their operations through intelligent workflow automation and AI-powered solutions.",
      story: `Mat Mercado is Co-Founder of Fusion Data Co, working alongside Rob Yeager to democratize enterprise-grade automation for growing businesses. With deep expertise in sales operations and process optimization, Mat helps clients design and implement automation systems that drive measurable ROI.

Mat's focus is on translating complex business requirements into elegant automation solutions that scale. He specializes in CRM optimization, multi-channel outbound strategies, and building AI-native architectures that integrate LLMs at every workflow layer.

His approach combines technical expertise with strategic thinking, ensuring every automation drives real business value. Mat believes that automation should amplify human capabilities, not replace them, and works directly with clients to ensure successful implementations and ongoing optimization.`,
      location: "Remote",
      website: "https://fusiondataco.com",
      yearsExperience: 10,
      specialties: [
        "Sales Automation Strategy",
        "CRM Optimization",
        "Process Engineering",
        "AI Integration",
        "Revenue Operations",
        "Client Success & Implementation"
      ],
      achievements: [
        "Co-Founded Fusion Data Co (2020)",
        "200+ successful automation deployments",
        "Expert in sales operations scaling",
        "Strategic automation consulting",
        "AI-native workflow architecture"
      ],
      socialLinks: {
        website: "https://fusiondataco.com",
        email: "mat@fusiondataco.com"
      },
      isVerified: true,
      isFeatured: true,
      followerCount: 680,
    }).onConflictDoUpdate({
      target: entrepreneurs.userId,
      set: { updatedAt: new Date() }
    }).returning();

    // Link Mat to Fusion Data Co
    await db.insert(entrepreneurBusinesses).values({
      entrepreneurId: matEntrepreneur.id,
      businessId: fusionDataCo.id,
      role: "Co-Founder & Automation Strategist",
      equityPercentage: "50.00",
      isCurrent: true,
      isPublic: true,
    }).onConflictDoNothing();

    console.log("✅ Created Mat Mercado entrepreneur profile & linked to Fusion Data Co");

    // ============================================================================
    // 1. JASON PEREZ - The Insurance School
    // ============================================================================
    
    const [jasonUser] = await db.insert(users).values({
      id: "elite-jason-perez",
      email: "jason@theinsuranceschool.com",
      firstName: "Jason",
      lastName: "Perez",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [jasonEntrepreneur] = await db.insert(entrepreneurs).values({
      userId: jasonUser.id,
      firstName: "Jason",
      lastName: "Perez",
      tagline: "Helping Florida Locals Get Licensed & Launch Insurance Careers",
      bio: "Founder & Chief Compliance Officer of The Insurance School - Florida's premier D.F.S. Authorized Insurance Education Provider. We've helped 2,000+ Florida locals every month get their insurance licenses and launch successful careers.",
      story: "With 25+ years in insurance education, Jason Perez has built The Insurance School into Central Florida's most trusted licensing education platform. His mission is simple: #NeverHuntAlone. Through live classes, on-demand replays, and community support, Jason has helped thousands of Florida residents transform their careers in the insurance industry. His innovative approach combines state-authorized pre-licensing with real-world exam strategies, creating a study group atmosphere where students thrive together.",
      location: "Orlando, Florida",
      website: "https://theinsuranceschool.com",
      yearsExperience: 25,
      specialties: ["Insurance Education", "2-15 Health & Life Licensing", "State Exam Preparation", "Compliance Training", "Student Success"],
      achievements: [
        "Founded The Insurance School (1998)",
        "D.F.S. Authorized Insurance Education Provider",
        "2,000+ students monthly",
        "High first-time pass rate",
        "Creator of iPower Moves Podcast"
      ],
      socialLinks: {
        website: "https://theinsuranceschool.com",
        community: "https://thefloridalocal.com"
      },
      isVerified: true,
      isFeatured: true,
      followerCount: 2000,
    }).onConflictDoUpdate({
      target: entrepreneurs.userId,
      set: { updatedAt: new Date() }
    }).returning();

    const [insuranceSchool] = await db.insert(businesses).values({
      ownerId: jasonUser.id,
      name: "The Insurance School",
      tagline: "We Make Licensing EASY❗️",
      description: "Florida's premier D.F.S. Authorized Insurance Education Provider since 1998. We help 2,000+ Florida locals every month get their insurance licenses and launch successful careers through live state-authorized classes, on-demand course replays, and comprehensive exam prep. Our study group atmosphere and #NeverHuntAlone philosophy ensures you have the support and resources needed to pass your state exam on the first try.",
      category: "Education & Training",
      location: "Orlando, Florida",
      phone: "(407) 555-2015",
      website: "https://theinsuranceschool.com",
      isVerified: true,
      isActive: true,
      rating: "4.9",
      reviewCount: 487,
      followerCount: 2150,
      postCount: 324,
      socialLinks: {
        youtube: "https://youtube.com/@ipowermoves",
        facebook: "https://facebook.com/theinsuranceschool",
        instagram: "https://instagram.com/theinsuranceschool",
        skool: "The Insurance School Community"
      }
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { updatedAt: new Date() }
    }).returning();

    await db.insert(entrepreneurBusinesses).values({
      entrepreneurId: jasonEntrepreneur.id,
      businessId: insuranceSchool.id,
      role: "Founder & Chief Compliance Officer",
      equityPercentage: "100.00",
      isCurrent: true,
      isPublic: true,
    }).onConflictDoNothing();

    console.log("✅ Created Jason Perez (The Insurance School)");

    // ============================================================================
    // 2. KELLI KIRK - Boho Hooligan (Etsy Store)
    // ============================================================================
    
    const [kelliUser] = await db.insert(users).values({
      id: "elite-kelli-kirk",
      email: "kelli@bohohooligan.com",
      firstName: "Kelli",
      lastName: "Kirk",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [kelliEntrepreneur] = await db.insert(entrepreneurs).values({
      userId: kelliUser.id,
      firstName: "Kelli",
      lastName: "Kirk",
      tagline: "Handcrafted Bohemian Artisan Jewelry & Accessories",
      bio: "Founder of Boho Hooligan - Creating unique, handcrafted bohemian jewelry and accessories that celebrate free-spirited style. Each piece tells a story and brings artistic expression to everyday wear.",
      story: "Kelli Kirk turned her passion for bohemian artistry into Boho Hooligan, a thriving Etsy shop that has captured the hearts of free spirits everywhere. Her handcrafted jewelry and accessories blend vintage charm with modern boho aesthetics, creating one-of-a-kind pieces that celebrate individuality and artistic expression.",
      location: "Florida",
      website: "https://www.etsy.com/ca/shop/BohoHooligan",
      yearsExperience: 8,
      specialties: ["Handcrafted Jewelry", "Bohemian Accessories", "Artisan Crafts", "Etsy Sales", "Product Photography"],
      achievements: [
        "Successful Etsy Store Owner",
        "Thousands of satisfied customers",
        "Unique boho jewelry designs",
        "Featured products and reviews"
      ],
      socialLinks: {
        etsy: "https://www.etsy.com/ca/shop/BohoHooligan",
        instagram: "https://instagram.com/bohohooligan"
      },
      isVerified: true,
      followerCount: 850,
    }).onConflictDoUpdate({
      target: entrepreneurs.userId,
      set: { updatedAt: new Date() }
    }).returning();

    const [bohoHooligan] = await db.insert(businesses).values({
      ownerId: kelliUser.id,
      name: "Boho Hooligan",
      tagline: "Handcrafted Bohemian Jewelry & Accessories for Free Spirits",
      description: "Boho Hooligan creates unique, handcrafted bohemian jewelry and accessories that celebrate free-spirited style and artistic expression. Each piece is carefully designed and crafted to bring vintage charm and modern boho aesthetics together, creating wearable art that tells your story.",
      category: "Arts & Crafts",
      location: "Florida",
      website: "https://www.etsy.com/ca/shop/BohoHooligan",
      isVerified: true,
      isActive: true,
      rating: "4.8",
      reviewCount: 342,
      followerCount: 920,
      postCount: 156,
      socialLinks: {
        etsy: "https://www.etsy.com/ca/shop/BohoHooligan",
        instagram: "https://instagram.com/bohohooligan",
        pinterest: "https://pinterest.com/bohohooligan"
      }
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { updatedAt: new Date() }
    }).returning();

    await db.insert(entrepreneurBusinesses).values({
      entrepreneurId: kelliEntrepreneur.id,
      businessId: bohoHooligan.id,
      role: "Founder & Artisan",
      equityPercentage: "100.00",
      isCurrent: true,
      isPublic: true,
    }).onConflictDoNothing();

    console.log("✅ Created Kelli Kirk (Boho Hooligan)");

    // ============================================================================
    // 3. TED BOGERT - The Ted Show (GOLD STANDARD PROFILE)
    // ============================================================================
    
    const [tedUser] = await db.insert(users).values({
      id: "elite-ted-bogert",
      email: "ted@thetedshow.com",
      firstName: "Ted",
      lastName: "Bogert",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [tedEntrepreneur] = await db.insert(entrepreneurs).values({
      userId: tedUser.id,
      firstName: "Ted",
      lastName: "Bogert",
      tagline: "Host & Creator of The Ted Show | Community Expert | Market Leader at Future Home Loans",
      bio: "With 30+ years in the people business across insurance, mortgage, and real estate, Ted Bogert helps professionals, business owners, and families marshal their resources and protect their assets. Creator of 'The Ted Show' - a daily Facebook Live talk show connecting Central Florida's community leaders, entrepreneurs, and innovators since 2017.",
      story: "Ted Bogert's journey spans three decades of serving people across multiple industries. After earning his Bachelor's in Finance and Master's in Health Care Administration from UCF, he built a distinguished career in insurance, mortgage, and real estate. But Ted's true calling emerged in 2017 when he launched The Ted Show from Orlando's Citrus Club - a high-energy daily talk show that has since filmed thousands of episodes, featuring community leaders, veterans, entrepreneurs, and innovators.\n\nAs Market Leader at Future Home Loans (NMLS #945102), Ted combines his extensive mortgage expertise with his passion for community building. His 'Heroes Always Welcome' segment honors U.S. military veterans, while his Community.Expert platform connects real estate agents, attorneys, and business owners with charitable causes.\n\nTed's work extends far beyond business. He's deeply involved with Harbor House (domestic abuse prevention), BASE Camp Children's Cancer Foundation, The Lifeboat Project (human trafficking survivors), Special Olympics, Central Florida Navy League, and the Florida Association of Veteran Owned Businesses. Married to his college sweetheart with three children and one grandson, Ted lives by a simple philosophy: 'Connect. Refer. Repeat.' - always coming from contribution with a focus on others' growth.",
      location: "Orlando, Florida",
      website: "https://thetedshow.com",
      yearsExperience: 30,
      specialties: [
        "Media & Broadcasting",
        "Mortgage Lending (VA Loans Specialist)",
        "Community Building",
        "Business Development",
        "Content Creation",
        "Public Speaking",
        "Network Building",
        "Real Estate Finance",
        "Veteran Services"
      ],
      achievements: [
        "Creator & Host of The Ted Show (2017-Present)",
        "Thousands of episodes filmed",
        "NMLS #945102 - Licensed Mortgage Professional",
        "Market Leader at Future Home Loans",
        "Co-creator of Community.Expert platform",
        "Bachelor of Science in Finance (UCF 1989)",
        "Master's in Health Care Administration (UCF)",
        "30+ years multi-industry expertise",
        "Active in 10+ charitable organizations",
        "Professional emcee and traveling speaker"
      ],
      socialLinks: {
        website: "https://thetedshow.com",
        community: "https://community.expert",
        facebook: "https://facebook.com/thetedshow",
        linkedin: "https://linkedin.com/in/tedbogert"
      },
      isVerified: true,
      isFeatured: true,
      followerCount: 8500,
      showcaseCount: 1247,
    }).onConflictDoUpdate({
      target: entrepreneurs.userId,
      set: { updatedAt: new Date() }
    }).returning();

    const [tedShow] = await db.insert(businesses).values({
      ownerId: tedUser.id,
      name: "The Ted Show",
      tagline: "Connecting Central Florida's Leaders, Innovators & Change-Makers",
      description: "The Ted Show is Central Florida's premier daily talk show, bringing you high-energy conversations with community leaders, entrepreneurs, veterans, innovators, and philanthropists. Since launching in August 2017, we've filmed thousands of episodes featuring the people and stories that make Orlando and Central Florida exceptional.\n\nEach weekday at 1pm EST on Facebook Live, host Ted Bogert welcomes guests to discuss business development, arts and culture, community engagement, entrepreneurship, real estate, finance, veteran affairs, and local events. Our 'Heroes Always Welcome' segment specifically honors U.S. military veterans and their inspiring stories.\n\nWhether you're looking to share your business story, connect with Central Florida's engaged community, or amplify your message through The Florida Local network, The Ted Show provides the platform and audience to make it happen.",
      category: "Media & Broadcasting",
      location: "Orlando, Florida",
      address: "255 S Orange Ave, Suite 213, Orlando, FL 32801",
      phone: "(407) 555-SHOW",
      website: "https://thetedshow.com",
      operatingHours: {
        monday: { open: "13:00", close: "14:00", notes: "Live show 1pm EST" },
        tuesday: { open: "13:00", close: "14:00", notes: "Live show 1pm EST" },
        wednesday: { open: "13:00", close: "14:00", notes: "Live show 1pm EST" },
        thursday: { open: "13:00", close: "14:00", notes: "Live show 1pm EST" },
        friday: { open: "13:00", close: "14:00", notes: "Live show 1pm EST" }
      },
      isVerified: true,
      isActive: true,
      rating: "5.0",
      reviewCount: 892,
      followerCount: 12400,
      postCount: 3247,
      socialLinks: {
        facebook: "https://facebook.com/thetedshow",
        linkedin: "https://linkedin.com/company/thetedshow",
        youtube: "https://youtube.com/@thetedshow",
        website: "https://community.expert"
      }
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { updatedAt: new Date() }
    }).returning();

    await db.insert(entrepreneurBusinesses).values({
      entrepreneurId: tedEntrepreneur.id,
      businessId: tedShow.id,
      role: "Host & Creator",
      equityPercentage: "100.00",
      isCurrent: true,
      isPublic: true,
    }).onConflictDoNothing();

    console.log("✅ Created Ted Bogert (The Ted Show) - GOLD STANDARD");

    // ============================================================================
    // 4. NEIL SCHWABE - Neil Schwabe & Associates (Insurance MGA)
    // ============================================================================
    
    const [neilUser] = await db.insert(users).values({
      id: "elite-neil-schwabe",
      email: "neil@schwabebenefitsgroup.com",
      firstName: "Neil",
      lastName: "Schwabe",
      isAdmin: false,
    }).onConflictDoUpdate({
      target: users.id,
      set: { updatedAt: new Date() }
    }).returning();

    const [neilEntrepreneur] = await db.insert(entrepreneurs).values({
      userId: neilUser.id,
      firstName: "Neil",
      lastName: "Schwabe",
      tagline: "LUTCF, MGA | Top Health Insurance Expert | 30+ Years National Experience",
      bio: "Managing General Agent (MGA) with 30+ years of health insurance expertise. As an independent broker, I represent client interests 'First, Foremost, and Always' - providing personal, professional representation across all health coverage plans with multiple carriers nationwide.",
      story: "Since 1993, Neil Schwabe has built a reputation as one of the nation's top health insurance professionals. As a Managing General Agent (MGA) - the highest level of carrier contract in the health insurance industry - Neil performs critical functions including plan development, underwriting, appointing retail agents, and settling claims.\n\nNeil's career includes founding GetInsurancePlans.com (2004) and GetHealthInsurance.com (2005), pioneering web-based insurance portals that revolutionized how individuals and businesses access coverage. His Miami Dade College education laid the foundation for a career dedicated to making insurance choices easy through education and clarity.\n\nAs founder of Neil Schwabe & Associates and Schwabe Benefits Group (founded 1980), Neil specializes in health, life, and annuity insurance for individuals, families, and small businesses. His Independent Agent Conglomerate teaches agents how to scale their businesses through proven lead generation and sales strategies.\n\nNeil's commitment to client education is evident in his monthly newsletters covering upcoming dates, plan best practices, healthy living resources, terminology, and policy updates. Operating nationally with a home base in Miami, Neil emphasizes tailored solutions over one-size-fits-all approaches.",
      location: "Miami, Florida",
      website: "https://www.neilschwabe.com",
      yearsExperience: 30,
      specialties: [
        "Health Insurance (Primary)",
        "Life Insurance",
        "Annuity Insurance",
        "Small Business Group Coverage",
        "Individual & Family Coverage",
        "Managing General Agent (MGA)",
        "Plan Development",
        "Agent Training & Mentorship",
        "Lead Generation Strategies"
      ],
      achievements: [
        "LUTCF - Life Underwriter Training Council Fellow",
        "MGA - Managing General Agent (Highest carrier contract level)",
        "30+ years in insurance (since 1993)",
        "Founded Schwabe Benefits Group (1980)",
        "Founded GetInsurancePlans.com (2004-2017)",
        "Founded GetHealthInsurance.com (2005-2014)",
        "Creator of Independent Agent Conglomerate",
        "National consultant (not limited to Florida)",
        "500+ LinkedIn connections",
        "Recognized as 'Top Health Insurance Expert'"
      ],
      socialLinks: {
        website: "https://www.neilschwabe.com",
        linkedin: "https://www.linkedin.com/in/neil-schwabe",
        email: "neil@schwabebenefitsgroup.com"
      },
      isVerified: true,
      isFeatured: true,
      followerCount: 1840,
    }).onConflictDoUpdate({
      target: entrepreneurs.userId,
      set: { updatedAt: new Date() }
    }).returning();

    const [schwabeAssociates] = await db.insert(businesses).values({
      ownerId: neilUser.id,
      name: "Neil Schwabe & Associates",
      tagline: "Independent Health Insurance Representation - First, Foremost, and Always",
      description: "Neil Schwabe & Associates provides independent broker services representing client interests across all health coverage plans. With 30+ years of national experience and MGA-level expertise, we specialize in health, life, and annuity insurance for individuals, families, and small businesses.\n\nAs a Managing General Agent (MGA) - the highest level of carrier contract - we perform critical industry functions including plan development, underwriting, appointing retail agents, and settling claims. Our independent status allows us to work with multiple carriers, staying informed on market changes to provide clients with the best options.\n\nWe're committed to making insurance choices easy through education and clarity, offering tailored solutions over one-size-fits-all approaches. Our monthly newsletter keeps clients informed on upcoming dates, plan best practices, healthy living resources, terminology, and policy updates.",
      category: "Insurance & Financial Services",
      location: "Miami, Florida",
      address: "2665 S Bayshore Dr STE 220, Miami, FL 33133",
      phone: "(305) 270-1990",
      website: "https://www.neilschwabe.com",
      operatingHours: {
        monday: { open: "9:00", close: "17:00" },
        tuesday: { open: "9:00", close: "17:00" },
        wednesday: { open: "9:00", close: "17:00" },
        thursday: { open: "9:00", close: "17:00" },
        friday: { open: "9:00", close: "17:00" }
      },
      isVerified: true,
      isActive: true,
      rating: "4.9",
      reviewCount: 524,
      followerCount: 2180,
      postCount: 487,
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/neil-schwabe",
        website: "https://www.neilschwabe.com"
      }
    }).onConflictDoUpdate({
      target: businesses.id,
      set: { updatedAt: new Date() }
    }).returning();

    await db.insert(entrepreneurBusinesses).values({
      entrepreneurId: neilEntrepreneur.id,
      businessId: schwabeAssociates.id,
      role: "Founder & Managing General Agent",
      equityPercentage: "100.00",
      isCurrent: true,
      isPublic: true,
    }).onConflictDoNothing();

    console.log("✅ Created Neil Schwabe (Neil Schwabe & Associates)");

    // ============================================================================
    // PRODUCTS/SERVICES FOR EACH BUSINESS
    // ============================================================================

    // Rob Yeager - Fusion Data Co Services
    await db.insert(products).values([
      {
        businessId: fusionDataCo.id,
        name: "Lead Generation Architecture Sprint",
        description: "2-week intensive sprint to design and deploy your multi-channel lead generation system. Includes discovery workshop, workflow design, implementation, and training. Typical ROI: 300%+ in 90 days.",
        price: "7500.00",
        category: "Automation Services",
        isActive: true,
        isDigital: true,
        inventory: 10,
        tags: ["Lead Generation", "Automation", "Multi-Channel", "Outbound", "Sprint"],
        rating: "5.0",
        reviewCount: 42
      },
      {
        businessId: fusionDataCo.id,
        name: "AI Voice Agent Development",
        description: "Custom AI-powered voice qualification bot using ElevenLabs technology. Handles inbound qualification calls 24/7, books meetings, and routes hot leads to your team. Processes 1,000+ calls monthly.",
        price: "12000.00",
        category: "AI Solutions",
        isActive: true,
        isDigital: true,
        inventory: 5,
        tags: ["AI", "Voice Agent", "ElevenLabs", "Qualification", "24/7"],
        rating: "5.0",
        reviewCount: 28
      },
      {
        businessId: fusionDataCo.id,
        name: "Sales Automation Retainer",
        description: "Monthly ongoing optimization and support for your automation infrastructure. Includes workflow maintenance, new feature development, performance optimization, and strategic consulting.",
        price: "3500.00",
        category: "Monthly Retainer",
        isActive: true,
        isDigital: true,
        inventory: 999,
        tags: ["Retainer", "Support", "Optimization", "Consulting", "Ongoing"],
        rating: "4.9",
        reviewCount: 67
      }
    ]).onConflictDoNothing();

    // Jason Perez - The Insurance School Products
    await db.insert(products).values([
      {
        businessId: insuranceSchool.id,
        name: "2-15 PRIVATE Masterclass",
        description: "Complete Health & Life Insurance licensing preparation with live state-authorized classes, on-demand replays, State Exam Keywords & Concept Glossary, and everything in our resource catalog. Multiple review sessions ensure you're exam-ready.",
        price: "299.00",
        category: "Pre-Licensing Course",
        isActive: true,
        isDigital: true,
        inventory: 999,
        tags: ["2-15 License", "Health Insurance", "Life Insurance", "Live Classes", "On-Demand"],
        rating: "4.9",
        reviewCount: 234
      },
      {
        businessId: insuranceSchool.id,
        name: "iFast Broker ELITE Bundle",
        description: "Complete package for launching your insurance career fast. Includes pre-licensing, exam prep, business setup guidance, and career launch resources.",
        price: "497.00",
        category: "Career Launch Package",
        isActive: true,
        isDigital: true,
        inventory: 999,
        tags: ["Career Launch", "Business Setup", "Complete Package"],
        rating: "5.0",
        reviewCount: 89
      },
      {
        businessId: insuranceSchool.id,
        name: "Continuing Education Package",
        description: "2-14, 2-15, 2-40, 2-20 CE Courses - Keep your license valid with guest speaker insights, breakout sessions, NO EXAMS, and 4 Hour Law & Ethics included.",
        price: "149.00",
        category: "Continuing Education",
        isActive: true,
        isDigital: true,
        inventory: 999,
        tags: ["CE", "Continuing Education", "License Renewal"],
        rating: "4.8",
        reviewCount: 156
      }
    ]).onConflictDoNothing();

    // Kelli Kirk - Boho Hooligan Products
    await db.insert(products).values([
      {
        businessId: bohoHooligan.id,
        name: "Bohemian Layered Necklace Set",
        description: "Handcrafted multi-strand bohemian necklace featuring natural stones, vintage beads, and artisan metalwork. Each piece is unique and tells its own story.",
        price: "48.00",
        category: "Jewelry",
        isActive: true,
        isDigital: false,
        inventory: 12,
        tags: ["Boho", "Handmade", "Necklace", "Layered", "Natural Stones"],
        rating: "5.0",
        reviewCount: 47
      },
      {
        businessId: bohoHooligan.id,
        name: "Festival Fringe Earrings",
        description: "Eye-catching bohemian fringe earrings perfect for festivals and free spirits. Lightweight and comfortable for all-day wear.",
        price: "32.00",
        category: "Jewelry",
        isActive: true,
        isDigital: false,
        inventory: 18,
        tags: ["Boho", "Earrings", "Festival", "Fringe", "Handmade"],
        rating: "4.9",
        reviewCount: 63
      },
      {
        businessId: bohoHooligan.id,
        name: "Vintage Bohemian Bracelet Stack",
        description: "Curated set of 5 handcrafted bracelets featuring vintage charms, natural stones, and artisan beads. Mix and match for your perfect boho look.",
        price: "56.00",
        category: "Jewelry",
        isActive: true,
        isDigital: false,
        inventory: 8,
        tags: ["Boho", "Bracelets", "Stack", "Vintage", "Artisan"],
        rating: "5.0",
        reviewCount: 28
      }
    ]).onConflictDoNothing();

    // Ted Bogert - The Ted Show Services
    await db.insert(products).values([
      {
        businessId: tedShow.id,
        name: "Guest Feature on The Ted Show",
        description: "Feature your business on The Ted Show's daily Facebook Live broadcast. Reach thousands of engaged Central Florida followers and share your story with our community of leaders and entrepreneurs.",
        price: "500.00",
        category: "Media & Promotion",
        isActive: true,
        isDigital: true,
        inventory: 50,
        tags: ["Media", "Promotion", "Interview", "Facebook Live", "Exposure"],
        rating: "5.0",
        reviewCount: 178
      },
      {
        businessId: tedShow.id,
        name: "VA Loan Consultation with Ted",
        description: "Expert VA loan consultation with NMLS #945102 Ted Bogert. Over 30 years experience helping veterans and their families achieve homeownership. Personalized service from a dedicated veteran advocate.",
        price: "0.00",
        category: "Mortgage Services",
        isActive: true,
        isDigital: false,
        inventory: 999,
        tags: ["VA Loans", "Veterans", "Mortgage", "Consultation", "Free"],
        rating: "5.0",
        reviewCount: 342
      },
      {
        businessId: tedShow.id,
        name: "Professional Event Emcee Service",
        description: "Book Ted Bogert as your professional emcee. High-energy, engaging host for conferences, business events, and community gatherings. Creates fun, memorable experiences for your audience.",
        price: "1500.00",
        category: "Speaking & Events",
        isActive: true,
        isDigital: false,
        inventory: 24,
        tags: ["Emcee", "Speaker", "Events", "Professional", "Entertainment"],
        rating: "5.0",
        reviewCount: 94
      }
    ]).onConflictDoNothing();

    // Neil Schwabe - Insurance Services
    await db.insert(products).values([
      {
        businessId: schwabeAssociates.id,
        name: "Individual Health Insurance Plan",
        description: "Personalized health insurance coverage tailored to your needs. As an independent broker with 30+ years experience and MGA credentials, I represent YOUR interests first across all major carriers.",
        price: "0.00",
        category: "Health Insurance",
        isActive: true,
        isDigital: false,
        inventory: 999,
        tags: ["Health Insurance", "Individual", "ACA", "Consultation"],
        rating: "5.0",
        reviewCount: 287
      },
      {
        businessId: schwabeAssociates.id,
        name: "Small Business Group Coverage",
        description: "Comprehensive group health coverage for small businesses. General Liability, Employee Benefits, Worker's Comp, and PEO services through Schwabe Benefits Group.",
        price: "0.00",
        category: "Business Insurance",
        isActive: true,
        isDigital: false,
        inventory: 999,
        tags: ["Group Insurance", "Business", "Employee Benefits", "Small Business"],
        rating: "4.9",
        reviewCount: 156
      },
      {
        businessId: schwabeAssociates.id,
        name: "Life & Annuity Insurance Consultation",
        description: "Expert guidance on life insurance and annuity products. Protect your family's future and build retirement income with tailored solutions from a LUTCF professional.",
        price: "0.00",
        category: "Life Insurance",
        isActive: true,
        isDigital: false,
        inventory: 999,
        tags: ["Life Insurance", "Annuities", "Retirement", "LUTCF"],
        rating: "5.0",
        reviewCount: 198
      }
    ]).onConflictDoNothing();

    console.log("✅ Created all products and services");

    // ============================================================================
    // SOCIAL POSTS FOR ENGAGEMENT
    // ============================================================================

    await db.insert(posts).values([
      {
        businessId: fusionDataCo.id,
        content: "Just deployed a lead generation system for a solar company that reduced their response time from 3 days to under 5 minutes. Result? Their close rate jumped from 8% to 23% in 90 days. This is what intelligent automation looks like. 🚀 #WorkflowAutomation #SalesOps",
        type: "achievement",
        likeCount: 156,
        commentCount: 24,
        isVisible: true
      },
      {
        businessId: fusionDataCo.id,
        content: "Hot take: Your sales team doesn't need more reps. They need better automation. We just helped a 3-person team perform at 15-person capacity through smart workflows. The future of sales isn't bigger teams—it's smarter systems. 💡 #Automation #ScaleUp",
        type: "update",
        likeCount: 203,
        commentCount: 31,
        shareCount: 18,
        isVisible: true
      },
      {
        businessId: insuranceSchool.id,
        content: "🎉 Another amazing cohort just crushed their 2-15 exam! 87% pass rate on FIRST attempt! Remember: #NeverHuntAlone. When you join The Insurance School family, you're joining a community of future insurance professionals who support each other every step of the way. Ready to start YOUR insurance career? Link in bio! 📚✨",
        type: "achievement",
        likeCount: 124,
        commentCount: 18,
        isVisible: true
      },
      {
        businessId: bohoHooligan.id,
        content: "✨ NEW DROP ALERT ✨ Just listed these gorgeous Festival Fringe Earrings - perfect for all you free spirits heading to upcoming festivals! Each pair is handcrafted with love and attention to detail. Limited quantities available! Shop link in bio 🌙💫 #BohoStyle #HandmadeJewelry",
        type: "product",
        likeCount: 89,
        commentCount: 12,
        isVisible: true
      },
      {
        businessId: tedShow.id,
        content: "🎙️ INCREDIBLE show today! Had the honor of featuring three Central Florida veterans on our 'Heroes Always Welcome' segment. Their stories of service, sacrifice, and success in business will inspire you. Catch the full episode on our Facebook page. Thank you for your service! 🇺🇸 #TheTedShow #HeroesAlwaysWelcome",
        type: "update",
        likeCount: 342,
        commentCount: 47,
        shareCount: 28,
        isVisible: true
      },
      {
        businessId: schwabeAssociates.id,
        content: "📊 Open Enrollment is just around the corner! As an independent MGA with 30+ years experience, I'm here to help you navigate your options across ALL major carriers. Don't settle for one-size-fits-all - get personalized coverage that actually fits YOUR needs. Schedule your free consultation today! ☎️ (305) 270-1990",
        type: "update",
        likeCount: 67,
        commentCount: 9,
        isVisible: true
      }
    ]).onConflictDoNothing();

    console.log("✅ Created social posts for all businesses");

    console.log("\n🎉 ELITE SEED DATA COMPLETE!");
    console.log("\n📋 Summary:");
    console.log("👥 Admins: rob@fusiondataco.com (Robert Yeager), mat@fusiondataco.com (Mat Mercado)");
    console.log("🏪 Businesses:");
    console.log("   0. Rob Yeager & Mat Mercado - Fusion Data Co (ADMIN ELITE - Workflow Automation)");
    console.log("   1. Jason Perez - The Insurance School (Central Florida)");
    console.log("   2. Kelli Kirk - Boho Hooligan (Etsy Artisan)");
    console.log("   3. Ted Bogert - The Ted Show (GOLD STANDARD - Orlando Media)");
    console.log("   4. Neil Schwabe - Neil Schwabe & Associates (Miami Insurance MGA)");
    console.log("\n✅ All profiles feature:");
    console.log("   - Complete entrepreneur profiles with stories and achievements");
    console.log("   - Verified business listings with full details");
    console.log("   - Relevant products/services based on actual offerings");
    console.log("   - Social posts for engagement");
    console.log("\n🔐 Admin users (Rob & Mat) have both admin privileges AND entrepreneur profiles with Fusion Data Co business");
    
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  }
}

// Execute the seed
seedElite()
  .then(() => {
    console.log("✅ Seed script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
