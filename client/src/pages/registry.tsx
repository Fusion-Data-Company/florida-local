import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { RotatingCarousel } from "@/components/ui/rotating-carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, ChevronRight } from "lucide-react";

// Business Owner Card Component
const BusinessOwnerCard = ({
  owner,
  translate,
}: {
  owner: {
    name: string;
    business: string;
    image: string;
    link: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={owner.name}
      className="group/card h-96 w-[30rem] relative flex-shrink-0"
      data-testid={`owner-card-${owner.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Link
        href={owner.link}
        className="block group-hover/card:shadow-2xl"
        data-testid={`link-owner-${owner.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <img
          src={owner.image}
          height="600"
          width="600"
          className="object-cover object-center absolute h-full w-full inset-0 rounded-2xl"
          alt={owner.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--fl-teal-lagoon)]/80 via-[var(--fl-teal-lagoon)]/20 to-transparent rounded-2xl"></div>
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/card:opacity-100 bg-gradient-to-t from-[var(--fl-sunset-gold)]/90 via-[var(--fl-bronze)]/40 to-transparent pointer-events-none rounded-2xl transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className="text-2xl font-bold mb-1 opacity-100">{owner.name}</h3>
        <p className="text-sm opacity-90 group-hover/card:opacity-100 transition-opacity">
          {owner.business}
        </p>
      </div>
    </motion.div>
  );
};

// Showcase Card Component (for businesses)
const ShowcaseCard = ({
  showcase,
  translate,
}: {
  showcase: {
    title: string;
    category: string;
    image: string;
    link: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={showcase.title}
      className="group/showcase h-96 w-[30rem] relative flex-shrink-0"
      data-testid={`showcase-card-${showcase.title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Link
        href={showcase.link}
        className="block group-hover/showcase:shadow-2xl"
        data-testid={`link-showcase-${showcase.title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <img
          src={showcase.image}
          height="600"
          width="600"
          className="object-cover object-center absolute h-full w-full inset-0 rounded-2xl"
          alt={showcase.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--fl-sunset-gold)]/80 via-[var(--fl-bronze)]/20 to-transparent rounded-2xl"></div>
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/showcase:opacity-100 bg-gradient-to-t from-[var(--fl-teal-lagoon)]/90 via-[var(--fl-sunset-gold)]/40 to-transparent pointer-events-none rounded-2xl transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className="text-2xl font-bold mb-1 opacity-100">{showcase.title}</h3>
        <p className="text-sm opacity-90 group-hover/showcase:opacity-100 transition-opacity">
          {showcase.category}
        </p>
      </div>
    </motion.div>
  );
};

// Premium Slot Card Component (for 4th row in scroll)
const PremiumSlotCard = ({
  slot,
  translate,
}: {
  slot: {
    id: string;
    companyName: string;
    tagline: string;
    imageUrl: string;
    isPremium: boolean;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={slot.id}
      className="group/slot h-96 w-[30rem] relative flex-shrink-0"
    >
      <div className="block group-hover/slot:shadow-2xl relative h-full w-full rounded-2xl overflow-hidden">
        {slot.isPremium ? (
          <>
            <img
              src={slot.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${slot.companyName}`}
              height="600"
              width="600"
              className="object-cover object-center absolute h-full w-full inset-0"
              alt={slot.companyName}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--fl-sunset-gold)]/90 via-[var(--fl-sunset-gold)]/30 to-transparent"></div>
            <div className="absolute top-4 right-4">
              <Badge className="bg-[var(--fl-sunset-gold)] text-white border-2 border-white">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          </>
        ) : (
          <>
            {/* Ultra 4K engaging placeholder image */}
            <img
              src="/assets/premium-slot-placeholder.svg"
              className="object-cover object-center absolute h-full w-full inset-0"
              alt="Your Business Here - Premium Advertising Slot"
            />
          </>
        )}
        <div className="absolute inset-0 h-full w-full opacity-0 group-hover/slot:opacity-100 bg-gradient-to-t from-black/80 via-[var(--fl-teal-lagoon)]/60 to-transparent pointer-events-none transition-opacity duration-300"></div>
        {!slot.isPremium ? (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] hover:scale-105 transition-transform text-white font-bold text-lg shadow-2xl"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Claim This Premium Slot
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-2xl font-bold mb-1">{slot.companyName}</h3>
            <p className="text-sm opacity-90 group-hover/slot:opacity-100 transition-opacity">
              {slot.tagline}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Registry Header Component
const RegistryHeader = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-20 md:py-32 px-4 w-full left-0 top-0">
      <h1 className="text-2xl md:text-7xl font-bold bg-gradient-to-r from-white via-[var(--fl-sunset-gold)] to-white bg-clip-text text-transparent">
        Florida's Elite <br /> Entrepreneurs & Businesses
      </h1>
      <p className="max-w-2xl text-base md:text-xl mt-8 text-gray-200 dark:text-neutral-200">
        Discover the visionaries and innovators shaping Florida's business landscape.
        From established entrepreneurs to rising stars, explore the stories behind
        the Sunshine State's most dynamic businesses.
      </p>
    </div>
  );
};

export default function Registry() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [1, 1]), // Keep at full opacity always
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  );

  // Fetch premium ad slots
  const { data: premiumSlots = [] } = useQuery<any[]>({
    queryKey: ['/api/premium-slots'],
  });

  // Mock premium slots if none exist - 27 total (9 per row x 3 rows)
  const mockPremiumSlots = Array.from({ length: 27 }, (_, i) => ({
    id: `slot-${i + 1}`,
    companyName: "Your Company Here",
    tagline: "Advertise to thousands of local customers",
    imageUrl: "",
    isPremium: i < 9, // First 9 are "premium" examples (row 1)
  }));

  const displaySlots = premiumSlots.length > 0 ? premiumSlots : mockPremiumSlots;

  // Split slots into 3 rows of 9 each
  const firstPremiumRow = displaySlots.slice(0, 9);   // Row 1: Slots 1-9
  const secondPremiumRow = displaySlots.slice(9, 18); // Row 2: Slots 10-18
  const thirdPremiumRow = displaySlots.slice(18, 27); // Row 3: Slots 19-27

  // Comprehensive data for business owners (Entrepreneurs Row 1)
  const businessOwners = [
    {
      name: "Maria Rodriguez",
      business: "Tech Innovations Inc.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "James Patterson",
      business: "Coastal Real Estate Group",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Sarah Chen",
      business: "Culinary Excellence",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Michael Thompson",
      business: "Thompson Financial Advisors",
      image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Elena Vasquez",
      business: "Green Solutions Ltd.",
      image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "David Martinez",
      business: "Martinez Legal Group",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Rachel Kim",
      business: "Sunshine Marketing Agency",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Anthony Blake",
      business: "Blake Construction Co.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Jennifer Lopez",
      business: "J-Lo Fashion Boutique",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Marcus Williams",
      business: "Williams Auto Group",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=600&fit=crop",
      link: "#",
    },
  ];

  // Business showcases (Row 2 - scrolls left)
  const businessShowcases = [
    {
      title: "Sunshine Café",
      category: "Food & Beverage",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Martinez Construction Co.",
      category: "Construction",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Ocean View Properties",
      category: "Real Estate",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Digital Marketing Pro",
      category: "Marketing",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Tech Hub Innovations",
      category: "Technology",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Tropical Fitness Studio",
      category: "Health & Wellness",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Coastal Legal Services",
      category: "Professional Services",
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Artisan Coffee Roasters",
      category: "Food & Beverage",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Elite Auto Detailing",
      category: "Automotive",
      image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Sunset Photography Studio",
      category: "Creative Services",
      image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=600&fit=crop",
      link: "#",
    },
  ];

  // Additional entrepreneurs (Row 3 - scrolls right)
  const additionalOwners = [
    {
      name: "Robert Williams",
      business: "Williams & Associates Law",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Lisa Anderson",
      business: "Wellness Center Florida",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Carlos Mendez",
      business: "Auto Elite Dealership",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Amanda Foster",
      business: "Foster Design Studio",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Kevin O'Brien",
      business: "Sports Performance Center",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Sophia Patel",
      business: "Patel Consulting Group",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Brandon Scott",
      business: "Scott Media Productions",
      image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Victoria Chen",
      business: "Chen Financial Planning",
      image: "https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Daniel Roberts",
      business: "Roberts Insurance Agency",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      name: "Nina Gonzalez",
      business: "Gonzalez Event Planning",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=600&fit=crop",
      link: "#",
    },
  ];

  // All 3 rows are now premium ad slots (27 total = 9 per row)

  // Carousel data for business owners - Expanded
  const carouselOwners = [
    {
      title: "Maria Rodriguez",
      button: "View Profile",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop",
    },
    {
      title: "James Patterson",
      button: "View Profile",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop",
    },
    {
      title: "Sarah Chen",
      button: "View Profile",
      src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=600&fit=crop",
    },
    {
      title: "Michael Thompson",
      button: "View Profile",
      src: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&h=600&fit=crop",
    },
    {
      title: "Elena Vasquez",
      button: "View Profile",
      src: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&h=600&fit=crop",
    },
    {
      title: "David Martinez",
      button: "View Profile",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop",
    },
    {
      title: "Rachel Kim",
      button: "View Profile",
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop",
    },
    {
      title: "Anthony Blake",
      button: "View Profile",
      src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=600&fit=crop",
    },
  ];

  // Carousel data for business showcases - Expanded
  const carouselShowcases = [
    {
      title: "Sunshine Café",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=600&fit=crop",
    },
    {
      title: "Martinez Construction Co.",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop",
    },
    {
      title: "Ocean View Properties",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=600&fit=crop",
    },
    {
      title: "Digital Marketing Pro",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop",
    },
    {
      title: "Luxury Spa & Retreat",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop",
    },
    {
      title: "Elite Fitness Center",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop",
    },
    {
      title: "Tropical Fitness Studio",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop",
    },
    {
      title: "Artisan Coffee Roasters",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <EliteNavigationHeader />

      {/* SCROLL HEADER WITH 3 ROWS (Row 2 = Premium Ad Slots!) */}
      <div
        ref={ref}
        className="h-[280vh] py-20 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
        data-testid="registry-parallax-container"
      >
        <RegistryHeader />
        <motion.div
          style={{
            rotateX,
            rotateZ,
            translateY,
            opacity,
          }}
          className=""
        >
          {/* First Row - PREMIUM AD SLOTS 1-9 scrolling right */}
          <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
            {firstPremiumRow.map((slot: any) => (
              <PremiumSlotCard
                slot={slot}
                translate={translateX}
                key={slot.id}
              />
            ))}
          </motion.div>

          {/* Second Row - PREMIUM AD SLOTS 10-18 scrolling left */}
          <motion.div className="flex flex-row mb-20 space-x-20">
            {secondPremiumRow.map((slot: any) => (
              <PremiumSlotCard
                slot={slot}
                translate={translateXReverse}
                key={slot.id}
              />
            ))}
          </motion.div>

          {/* Third Row - PREMIUM AD SLOTS 19-27 scrolling right */}
          <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
            {thirdPremiumRow.map((slot: any) => (
              <PremiumSlotCard
                slot={slot}
                translate={translateX}
                key={slot.id}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ENTREPRENEURS CAROUSEL - RIGHT AFTER PREMIUM SLOTS */}
      <div className="py-16 bg-gradient-to-b from-transparent via-[var(--fl-teal-lagoon)]/5 to-transparent" data-testid="carousel-owners-section">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
            Meet the Visionaries
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Florida's most innovative business leaders and entrepreneurs
          </p>
        </div>
        <RotatingCarousel
          slides={carouselOwners}
          autoRotate={true}
          rotateInterval={5000}
          direction="forward"
        />
      </div>

      {/* BUSINESSES CAROUSEL - RIGHT AFTER ENTREPRENEURS */}
      <div className="py-16 bg-gradient-to-b from-transparent via-[var(--fl-sunset-gold)]/5 to-[var(--fl-bronze)]/5" data-testid="carousel-showcases-section">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
            Elite Business Showcase
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover exceptional businesses making their mark in Florida
          </p>
        </div>
        <RotatingCarousel
          slides={carouselShowcases}
          autoRotate={true}
          rotateInterval={5000}
          direction="reverse"
        />
      </div>

      <MobileBottomNav />
    </div>
  );
}
