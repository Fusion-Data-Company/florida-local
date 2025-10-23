import { AnimatedHikeCard, Stat } from "@/components/ui/card-25";
import { Clock, Star, MapPin, Users, Heart, Sparkles } from "lucide-react";

// Import Florida Local business images
import elegantRestaurant1 from "@/assets/stock_images/elegant_restaurant_f_aa323e17.jpg";
import elegantRestaurant2 from "@/assets/stock_images/elegant_restaurant_f_cc520cc1.jpg";
import fineDiningFood from "@/assets/stock_images/fine_dining_food_pre_6c60b0bf.jpg";

import beachWedding1 from "@/assets/stock_images/beachwedding1.jpg";
import beachWedding2 from "@/assets/stock_images/beach_wedding_ceremo_313889d0.jpg";
import beachWedding3 from "@/assets/stock_images/beach_wedding_ceremo_59009157.jpg";

import luxurySpa1 from "@/assets/stock_images/luxury_spa_wellness__78221b18.jpg";
import luxurySpa2 from "@/assets/stock_images/luxury_wellness_spa__482737df.jpg";
import luxurySpa3 from "@/assets/stock_images/luxury_wellness_spa__8f194a3c.jpg";

import cubanSandwich from "@/assets/stock_images/cuban_sandwich1.jpg";
import gourmetCuban from "@/assets/stock_images/gourmet_cuban_sandwi_e0346f8d.jpg";
import elegantRestaurant3 from "@/assets/stock_images/elegant_restaurant_i_5b327bb1.jpg";

export default function AnimatedHikeCardDemo() {
  // Multiple business category examples showcasing Florida Local
  const businesses = [
    {
      title: "Fine Dining",
      images: [elegantRestaurant1, elegantRestaurant2, fineDiningFood],
      stats: [
        { icon: <Clock className="h-4 w-4" />, label: "Open Daily" },
        { icon: <MapPin className="h-4 w-4" />, label: "Miami, FL" },
        { icon: <Star className="h-4 w-4" />, label: "Premium" },
      ] as Stat[],
      description:
        "Experience Florida's finest dining with world-class cuisine, elegant atmosphere, and exceptional service. Discover local flavors and premium dining experiences.",
      href: "#fine-dining",
    },
    {
      title: "Beach Weddings",
      images: [beachWedding1, beachWedding2, beachWedding3],
      stats: [
        { icon: <Heart className="h-4 w-4" />, label: "Full Service" },
        { icon: <MapPin className="h-4 w-4" />, label: "Coastal FL" },
        { icon: <Users className="h-4 w-4" />, label: "50-200 Guests" },
      ] as Stat[],
      description:
        "Create unforgettable memories with stunning beach wedding ceremonies. Professional planning, beautiful venues, and personalized service for your special day.",
      href: "#weddings",
    },
    {
      title: "Luxury Spa & Wellness",
      images: [luxurySpa1, luxurySpa2, luxurySpa3],
      stats: [
        { icon: <Sparkles className="h-4 w-4" />, label: "Premium" },
        { icon: <Clock className="h-4 w-4" />, label: "7 Days/Week" },
        { icon: <Star className="h-4 w-4" />, label: "5-Star" },
      ] as Stat[],
      description:
        "Rejuvenate your mind and body with luxury spa treatments, wellness programs, and serene environments. Expert care in Florida's premier wellness destinations.",
      href: "#wellness",
    },
    {
      title: "Cuban Cuisine",
      images: [cubanSandwich, gourmetCuban, elegantRestaurant3],
      stats: [
        { icon: <Clock className="h-4 w-4" />, label: "Lunch & Dinner" },
        { icon: <MapPin className="h-4 w-4" />, label: "Tampa, FL" },
        { icon: <Star className="h-4 w-4" />, label: "Authentic" },
      ] as Stat[],
      description:
        "Savor authentic Cuban flavors with traditional recipes, fresh ingredients, and warm hospitality. From classic sandwiches to gourmet specialties.",
      href: "#cuban",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-center text-4xl font-bold tracking-tight">
          Florida Local Business Showcase
        </h1>
        <p className="mb-12 text-center text-muted-foreground">
          Discover amazing local businesses across Florida. Hover over each card to explore.
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {businesses.map((business, index) => (
            <div key={index} className="flex justify-center">
              <AnimatedHikeCard {...business} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
