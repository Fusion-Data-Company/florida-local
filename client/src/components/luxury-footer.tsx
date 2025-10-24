import { Link } from "wouter";
import { TreePalm, Facebook, Instagram, Twitter, Linkedin, Heart, Shield, Award, CheckCircle } from "lucide-react";
import { AnimatedCarousel } from "@/components/ui/logo-carousel";

export default function LuxuryFooter() {
  const currentYear = new Date().getFullYear();

  // Ultra-Elite 3D Metallic Cyberpunk Partner Logos - Sharp & Clear
  const partnerLogos = [
    // 1. Stripe - Electric Chrome with Cyan Glow
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='stripe1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300d4ff;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%2300a8ff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%230088ff;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23stripe1)' d='M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z'/%3E%3C/svg%3E",
    
    // 2. PayPal - Neon Teal Metallic
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='pp1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300ffcc;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%2300d4aa;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2300a888;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23pp1)' d='M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.419c.041-.27.269-.466.542-.466h7.311c2.408 0 4.117.358 5.078 1.066.984.722 1.481 1.859 1.481 3.377 0 3.052-1.899 4.975-5.466 4.975h-2.76a.65.65 0 0 0-.644.542l-.886 5.64a.641.641 0 0 1-.634.534H7.34a.283.283 0 0 0-.279.25l-.006.034zm11.266-9.93c0 2.657-1.749 4.282-4.663 4.282H12.15c-.28 0-.522.196-.565.469l-.604 3.832a.351.351 0 0 1-.346.295H8.79a.326.326 0 0 1-.321-.378L9.7 12.175a.652.652 0 0 1 .643-.542h1.132c3.567 0 5.867-1.923 5.867-4.924 0-.598-.088-1.108-.256-1.529a5.804 5.804 0 0 0-.744-.779zm0 0'/%3E%3C/svg%3E",

    // 3. Square - Neon Lime Chrome
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='sq1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ccff00;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23aaff00;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2388dd00;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23sq1)' d='M4.01 2v20h15.99V2H4.01zm13.59 15.22c0 .86-.7 1.56-1.56 1.56h-8.1c-.86 0-1.56-.7-1.56-1.56v-8.1c0-.86.7-1.56 1.56-1.56h8.1c.86 0 1.56.7 1.56 1.56v8.1z'/%3E%3C/svg%3E",

    // 4. Shopify - Golden Chrome Elite
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='sh1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ffd700;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23ffb700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23ff9700;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23sh1)' d='M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.022-.116-.114-.192-.23-.192s-1.918-.136-1.918-.136-1.123-1.12-1.38-1.38a.448.448 0 00-.217-.11l-.005.002-.006-.002s-.233.072-.627.194a8.649 8.649 0 00-.308-1.006c-.456-1.006-1.129-1.534-1.945-1.534-.016 0-.031.002-.046.003-.028-.036-.058-.07-.087-.103-.402-.394-.918-.59-1.535-.558-1.194.065-2.386.894-3.353 2.419-.682 1.074-1.201 2.427-1.348 3.474-.051.02-.102.038-.152.057-1.381.521-1.394.535-1.568.998-.129.343-5 15.507-5 15.507l14.48 2.674.055-.01z'/%3E%3C/svg%3E",

    // 5. Google - Cyberpunk Multi-Chrome
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g1'%3E%3Cstop offset='0%25' style='stop-color:%230088ff'/%3E%3Cstop offset='100%25' style='stop-color:%2300d4ff'/%3E%3C/linearGradient%3E%3ClinearGradient id='g2'%3E%3Cstop offset='0%25' style='stop-color:%2300ff88'/%3E%3Cstop offset='100%25' style='stop-color:%2300ffcc'/%3E%3C/linearGradient%3E%3ClinearGradient id='g3'%3E%3Cstop offset='0%25' style='stop-color:%23ffcc00'/%3E%3Cstop offset='100%25' style='stop-color:%23ffff00'/%3E%3C/linearGradient%3E%3ClinearGradient id='g4'%3E%3Cstop offset='0%25' style='stop-color:%23ff4400'/%3E%3Cstop offset='100%25' style='stop-color:%23ff8800'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23g1)' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='url(%23g2)' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='url(%23g3)' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='url(%23g4)' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E",
    
    // 6. Apple Pay - Ultra Chrome Silver
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='ap1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23888888;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23555555;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23333333;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23ap1)' d='M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.9 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.5 1.3-1.14 2.56-2.53 4.08zM12.03 7.25c-.15-2.24 1.66-4.07 3.74-4.25.29 2.58-2.34 4.51-3.74 4.25z'/%3E%3C/svg%3E",

    // 7. Visa - Electric Blue Metallic
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='v1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230099ff;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%230066ff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%230044ff;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23v1)' d='M20.29 8.33L16.11 16h-2.35l-2.06-6.88c-.13-.49-.24-.66-.63-.87-.63-.34-1.67-.66-2.59-.86l.06-.25h4.47c.57 0 1.08.37 1.21.93l1.1 5.62L17.63 7h2.34zm-11.27.03l-2.22 7.64H4.64l2.22-7.64zm13.24-.03L21.23 16h-2.02l.14-1h-2.76l-.45 1h-2.35l3.17-7.01c.22-.49.63-.66 1.15-.66h1.73zm-1.77 3.16l-1.15 2.51h1.78z'/%3E%3C/svg%3E",

    // 8. Mastercard - Neon Orange/Red Gradient
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='m1'%3E%3Cstop offset='0%25' style='stop-color:%23ff3300'/%3E%3Cstop offset='100%25' style='stop-color:%23ff6600'/%3E%3C/linearGradient%3E%3ClinearGradient id='m2'%3E%3Cstop offset='0%25' style='stop-color:%23ffaa00'/%3E%3Cstop offset='100%25' style='stop-color:%23ffdd00'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='7' cy='12' r='7' fill='url(%23m1)'/%3E%3Ccircle cx='17' cy='12' r='7' fill='url(%23m2)' opacity='.9'/%3E%3C/svg%3E",

    // 9. Instagram - Cyan/Orange/Gold Cyberpunk (NO PINK!)
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='ig1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300d4ff' /%3E%3Cstop offset='50%25' style='stop-color:%23ffaa00' /%3E%3Cstop offset='100%25' style='stop-color:%23ffd700' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23ig1)' d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z'/%3E%3C/svg%3E",
    
    // 10. DoorDash - Neon Red/Orange Fire
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='dd1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ff0000;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23ff4400;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23ff8800;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23dd1)' d='M23.95 9.28c-.25-1.87-1.1-3.39-2.47-4.44C19.8 3.52 17.54 3 14.72 3H5.5c-.55 0-1 .45-1 1 0 .06.01.12.02.18l1.54 11.64c.14 1.03 1.02 1.8 2.06 1.8h5.11c.39 0 .74.22.9.57l1.09 2.31c.26.56.84.91 1.46.91.7 0 1.31-.41 1.58-1.06l3.38-8.12c.29-.69.39-1.43.31-2.17z'/%3E%3C/svg%3E",

    // 11. Uber Eats - Electric Neon Green
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='ue1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300ff44;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%2300dd44;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2300bb44;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23ue1)' d='M14.686 14.556c0 3.278-2.634 5.934-5.88 5.934-3.246 0-5.88-2.656-5.88-5.934V2h3.238v12.495c0 1.49 1.186 2.695 2.642 2.695 1.456 0 2.641-1.206 2.641-2.695V2h3.24v12.556zM21.074 8.896h-3.238V2h-3.239v18h6.477v-3.24h-3.239v-4.623h3.24V8.896z'/%3E%3C/svg%3E",

    // 12. Twitter/X - Chrome Silver/Cyan
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='x1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23333333;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23000000;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23444444;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23x1)' d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/%3E%3C/svg%3E",

    // 13. Facebook - Electric Blue 3D
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='fb1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230088ff;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%230066dd;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%230044bb;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23fb1)' d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/%3E%3C/svg%3E",

    // 14. Amazon - Orange/Gold Chrome 3D
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='az1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ffaa00;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23ff8800;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23ff6600;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23az1)' d='M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726-1.53.406-3.045.61-4.516.61-2.265 0-4.41-.396-6.435-1.187-2.02-.794-3.82-1.91-5.43-3.35-.1-.074-.15-.15-.15-.22 0-.047.02-.09.05-.13z'/%3E%3C/svg%3E",

    // 15. YouTube - Red/Chrome 3D Elite
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='yt1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ff0000;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23ff2200;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23dd0000;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23yt1)' d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/%3E%3C/svg%3E",
  ];

  return (
    <>
      {/* Logo Carousel - Above Footer */}
      <div className="relative">
        <AnimatedCarousel
          title="Empowering Local Commerce"
          logos={partnerLogos}
          autoPlay={true}
          autoPlayInterval={2000}
          itemsPerViewMobile={3}
          itemsPerViewDesktop={5}
          padding="py-12 lg:py-16"
          containerClassName="bg-gradient-to-b from-transparent via-background/50 to-background border-t border-border/20"
          titleClassName="text-center"
          logoContainerWidth="w-56"
          logoContainerHeight="h-32"
          logoImageWidth="w-24"
          logoImageHeight="h-24"
          logoMaxHeight="max-h-24"
          logoClassName="bg-white/90 backdrop-blur-sm shadow-md"
        />
      </div>

      <footer className="relative glass-panel footer-marble-section border-t border-border/20 backdrop-blur-lg overflow-hidden">
        {/* Abstract Background Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-accent/5 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 via-cyan-500/5 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-accent/5 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none"></div>

        {/* Gradient Top Border - Enhanced */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary via-accent to-transparent opacity-70"></div>

        <div className="container mx-auto px-4 lg:px-8 py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative group">
                <TreePalm className="text-3xl text-slate-700 group-hover:text-secondary group-hover:scale-105 transition-all duration-500" size={32} />
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold metallic gradient-text-gold text-luxury font-serif">
                  The Florida Local
                </h2>
              </div>
            </div>
            <p className="text-muted-readable text-sm leading-relaxed mb-6">
              Connecting Florida's finest businesses with discerning customers who appreciate luxury,
              quality, and exceptional service.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-full glass-panel hover-lift transition-all duration-300"
                data-testid="social-facebook"
              >
                <Facebook className="text-lg group-hover:text-primary transition-colors duration-300" size={18} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-full glass-panel hover-lift transition-all duration-300"
                data-testid="social-instagram"
              >
                <Instagram className="text-lg group-hover:text-accent transition-colors duration-300" size={18} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-full glass-panel hover-lift transition-all duration-300"
                data-testid="social-twitter"
              >
                <Twitter className="text-lg group-hover:text-primary transition-colors duration-300" size={18} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-3 rounded-full glass-panel hover-lift transition-all duration-300"
                data-testid="social-linkedin"
              >
                <Linkedin className="text-lg group-hover:text-secondary transition-colors duration-300" size={18} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            </div>
          </div>

          {/* Business Links */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold gradient-text-gold text-luxury mb-6">
              For Businesses
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/create-business" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-create-business">
                  <span className="relative z-10">Create Business</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/vendor/products" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-manage-products">
                  <span className="relative z-10">Manage Products</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/spotlight" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-spotlight">
                  <span className="relative z-10">Spotlight Program</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <a href="#advertising" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-advertising">
                  <span className="relative z-10">Advertising</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#analytics" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-analytics">
                  <span className="relative z-10">Business Analytics</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Links */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold gradient-text-cyan text-luxury mb-6">
              For Customers
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-discover">
                  <span className="relative z-10">Discover</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-marketplace">
                  <span className="relative z-10">Marketplace</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/messages" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-network">
                  <span className="relative z-10">Network</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <Link href="/orders" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-orders">
                  <span className="relative z-10">My Orders</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </li>
              <li>
                <a href="#rewards" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-rewards">
                  <span className="relative z-10">Loyalty Rewards</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold gradient-text-magenta text-luxury mb-6">
              Legal & Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#privacy" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-privacy">
                  <span className="relative z-10">Privacy Policy</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#terms" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-terms">
                  <span className="relative z-10">Terms of Service</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#support" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-support">
                  <span className="relative z-10">Customer Support</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#contact" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-contact">
                  <span className="relative z-10">Contact Us</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
              <li>
                <a href="#accessibility" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-accessibility">
                  <span className="relative z-10">Accessibility</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup - Enhanced with Abstract Styling */}
        <div className="mb-12 p-8 rounded-2xl relative overflow-hidden group hover-lift transition-all duration-500">
          {/* Abstract Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/10 via-transparent to-yellow-500/10 rounded-2xl opacity-50"></div>

          {/* Animated Abstract Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl opacity-60 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-3xl opacity-60 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-secondary/20 via-primary/10 to-accent/20 rounded-full blur-3xl opacity-40"></div>

          {/* Glass Panel Overlay */}
          <div className="absolute inset-0 glass-panel rounded-2xl border border-border/30"></div>

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-luxury font-serif mb-4 relative">
              <span className="text-black dark:text-white font-bold drop-shadow-lg">
                Stay Connected with Florida's Elite
              </span>
            </h3>
            <p className="text-foreground/90 mb-6 font-medium drop-shadow-sm">
              Get exclusive access to premium businesses, special offers, and insider updates from Florida's luxury marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg glass-panel border border-border/40 bg-background/80 backdrop-blur-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all duration-300 text-foreground placeholder:text-muted-foreground shadow-md"
                data-testid="newsletter-email"
              />
              <button
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 hover-lift btn-press rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 text-white relative overflow-hidden group/btn"
                data-testid="newsletter-subscribe"
              >
                <span className="relative z-10 font-bold">Subscribe</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm footer-text-readable">
              <p className="text-luxury">
                © {currentYear} The Florida Local. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs">Made with</span>
                <Heart className="text-accent animate-pulse" size={16} />
                <span className="text-xs">in Miami</span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <a href="#security" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-security">
                <Shield className="mr-2 group-hover:text-secondary transition-colors duration-300" size={16} />
                <span className="relative z-10">Secure</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary to-accent transition-all duration-300 group-hover:w-full"></div>
              </a>
              <a href="#certified" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-certified">
                <Award className="mr-2 group-hover:text-primary transition-colors duration-300" size={16} />
                <span className="relative z-10">Certified</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
              </a>
              <a href="#verified" className="group relative footer-link-readable hover:text-foreground transition-all duration-300" data-testid="footer-verified">
                <CheckCircle className="mr-2 group-hover:text-accent transition-colors duration-300" size={16} />
                <span className="relative z-10">Verified</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-secondary transition-all duration-300 group-hover:w-full"></div>
              </a>
            </div>
          </div>
        </div>
      </div>

        {/* Ambient Background Effects */}
        <div className="absolute inset-0 ambient-particles opacity-30 pointer-events-none"></div>
      </footer>
    </>
  );
}