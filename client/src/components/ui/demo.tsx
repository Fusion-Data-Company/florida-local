import { AnimatedHikeCard, Stat } from "@/components/ui/card-25";
import { Clock, Star, MapPin } from "lucide-react";

// Import Florida Local business images
import elegantRestaurant1 from "@/assets/stock_images/elegant_restaurant_f_aa323e17.jpg";
import elegantRestaurant2 from "@/assets/stock_images/elegant_restaurant_f_cc520cc1.jpg";
import fineDiningFood from "@/assets/stock_images/fine_dining_food_pre_6c60b0bf.jpg";

export default function AnimatedHikeCardDemo() {
  // Sample props showcasing Florida Local business
  const businessProps = {
    title: "Fine Dining",
    images: [
      elegantRestaurant1,
      elegantRestaurant2,
      fineDiningFood,
    ],
    stats: [
      {
        icon: <Clock className="h-4 w-4" />,
        label: "Open Daily",
      },
      {
        icon: <MapPin className="h-4 w-4" />,
        label: "Miami, FL",
      },
      {
        icon: <Star className="h-4 w-4" />,
        label: "Premium",
      },
    ] as Stat[],
    description:
      "Experience Florida's finest dining with world-class cuisine, elegant atmosphere, and exceptional service. Discover local flavors and premium dining experiences.",
    href: "#",
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <AnimatedHikeCard {...businessProps} />
    </div>
  );
}
