import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import { Link } from "wouter";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { RotatingCarousel } from "@/components/ui/rotating-carousel";

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-2xl"></div>
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/card:opacity-100 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none rounded-2xl transition-opacity duration-300"></div>
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-2xl"></div>
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/showcase:opacity-100 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none rounded-2xl transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className="text-2xl font-bold mb-1 opacity-100">{showcase.title}</h3>
        <p className="text-sm opacity-90 group-hover/showcase:opacity-100 transition-opacity">
          {showcase.category}
        </p>
      </div>
    </motion.div>
  );
};

// Registry Header Component
const RegistryHeader = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full left-0 top-0">
      <h1 className="text-2xl md:text-7xl font-bold text-white dark:text-white">
        Florida's Elite <br /> Business Registry
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
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
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

  // Placeholder data for business owners
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
  ];

  // Placeholder data for business showcases
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
  ];

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
  ];

  const additionalShowcases = [
    {
      title: "Luxury Spa & Retreat",
      category: "Health & Wellness",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Elite Fitness Center",
      category: "Sports & Fitness",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Artisan Bakery",
      category: "Food & Beverage",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Fashion Boutique Miami",
      category: "Retail",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=600&fit=crop",
      link: "#",
    },
    {
      title: "Legal Excellence Firm",
      category: "Professional Services",
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=600&fit=crop",
      link: "#",
    },
  ];

  const firstOwnerRow = businessOwners.slice(0, 5);
  const secondShowcaseRow = businessShowcases.slice(0, 5);
  const thirdOwnerRow = additionalOwners.slice(0, 5);

  // Carousel data for business owners (people)
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
  ];

  // Carousel data for business showcases (cards)
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
      title: "Luxury Spa & Retreat",
      button: "Explore Business",
      src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      <EliteNavigationHeader />
      
      <div
        ref={ref}
        className="h-[300vh] py-40 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
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
          {/* First Row - Business Owners scrolling right */}
          <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
            {firstOwnerRow.map((owner) => (
              <BusinessOwnerCard
                owner={owner}
                translate={translateX}
                key={owner.name}
              />
            ))}
          </motion.div>

          {/* Second Row - Business Showcases scrolling left */}
          <motion.div className="flex flex-row mb-20 space-x-20">
            {secondShowcaseRow.map((showcase) => (
              <ShowcaseCard
                showcase={showcase}
                translate={translateXReverse}
                key={showcase.title}
              />
            ))}
          </motion.div>

          {/* Third Row - More Business Owners scrolling right */}
          <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
            {thirdOwnerRow.map((owner) => (
              <BusinessOwnerCard
                owner={owner}
                translate={translateX}
                key={owner.name}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Business Owners Carousel - Rotates Forward (Right) */}
      <div className="py-20 bg-gradient-to-b from-black via-gray-900 to-black" data-testid="carousel-owners-section">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Meet the Visionaries
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
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

      {/* Business Showcases Carousel - Rotates Reverse (Left) */}
      <div className="py-20 bg-gradient-to-b from-black via-gray-900 to-gray-800" data-testid="carousel-showcases-section">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Elite Business Showcase
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
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
